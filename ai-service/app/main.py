import csv
import re
from pathlib import Path

from fastapi import FastAPI
from pydantic import BaseModel
from rapidfuzz import fuzz


app = FastAPI(title="major-project-ai-service")

DATASET_PATH = Path(__file__).resolve().parent.parent / "data" / "dataset.csv"
MIN_MATCH_THRESHOLD = 65
TOKEN_SIMILARITY_THRESHOLD = 70


class PredictRequest(BaseModel):
    symptoms: str


def normalize_text(text: str) -> str:
    lowered = text.lower().strip()
    cleaned = re.sub(r"[^a-z0-9,\s]", " ", lowered)
    return re.sub(r"\s+", " ", cleaned).strip()


def split_symptoms(text: str) -> list[str]:
    normalized = normalize_text(text)
    if not normalized:
        return []

    if "," in normalized:
        parts = [item.strip() for item in normalized.split(",") if item.strip()]
        return parts

    return [item.strip() for item in normalized.split() if item.strip()]


def load_dataset() -> list[dict]:
    rows = []
    if not DATASET_PATH.exists():
        return rows

    with DATASET_PATH.open("r", encoding="utf-8") as file:
        reader = csv.DictReader(file)
        for row in reader:
            disease = row.get("disease") or row.get("Disease") or row.get("Name") or "Unknown"
            treatment = row.get("treatment") or row.get("Treatment") or row.get("Treatments") or ""
            raw_symptoms = row.get("symptoms") or row.get("Symptoms") or ""

            symptoms_list = split_symptoms(raw_symptoms)
            rows.append(
                {
                    "disease": disease.strip(),
                    "treatment": treatment.strip(),
                    "symptoms": symptoms_list,
                }
            )

    return rows


DATASET_ROWS = load_dataset()


def best_token_score(input_symptom: str, dataset_symptom: str) -> float:
    return max(
        fuzz.ratio(input_symptom, dataset_symptom),
        fuzz.partial_ratio(input_symptom, dataset_symptom),
        fuzz.token_sort_ratio(input_symptom, dataset_symptom),
    )


def predict_from_symptoms(input_text: str) -> dict:
    input_symptoms = split_symptoms(input_text)
    if not input_symptoms:
        return {
            "disease": "No match found",
            "treatment": "Please provide one or more symptoms.",
            "confidence": 0,
            "matchedSymptoms": 0,
        }

    best_result = {
        "disease": "No match found",
        "treatment": "No match found",
        "confidence": 0,
        "matchedSymptoms": 0,
        "score": 0,
    }

    for row in DATASET_ROWS:
        row_symptoms = row["symptoms"]
        if not row_symptoms:
            continue

        matched = 0
        score_sum = 0.0

        for user_symptom in input_symptoms:
            symptom_best = 0.0
            for reference_symptom in row_symptoms:
                symptom_best = max(symptom_best, best_token_score(user_symptom, reference_symptom))

            if symptom_best >= TOKEN_SIMILARITY_THRESHOLD:
                matched += 1

            score_sum += symptom_best

        average_score = score_sum / len(input_symptoms)
        weighted_score = average_score + (matched * 10)

        if weighted_score > best_result["score"]:
            best_result = {
                "disease": row["disease"],
                "treatment": row["treatment"] or "Consult a healthcare professional for treatment guidance.",
                "confidence": min(100, round(average_score)),
                "matchedSymptoms": matched,
                "score": weighted_score,
            }

    if best_result["score"] < MIN_MATCH_THRESHOLD:
        return {
            "disease": "No match found",
            "treatment": "No close match found. Please provide more detailed symptoms.",
            "confidence": min(100, round(best_result["score"])),
            "matchedSymptoms": best_result["matchedSymptoms"],
        }

    return {
        "disease": best_result["disease"],
        "treatment": best_result["treatment"],
        "confidence": best_result["confidence"],
        "matchedSymptoms": best_result["matchedSymptoms"],
    }


@app.get("/health")
def health_check():
    return {"status": "ok", "service": "ai-service"}


@app.get("/")
def root():
    return {"message": "AI service is running"}


@app.post("/predict")
def predict(payload: PredictRequest):
    return predict_from_symptoms(payload.symptoms)
