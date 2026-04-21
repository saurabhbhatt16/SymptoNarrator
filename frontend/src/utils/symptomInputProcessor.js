const ENGLISH_STOP_WORDS = new Set([
  "i",
  "have",
  "and",
  "is",
  "the",
  "a",
  "my",
  "me",
  "am",
  "with",
  "having",
  "feel",
  "feeling",
  "from",
  "since",
  "for",
  "to",
  "of",
]);

const HINDI_STOP_WORDS = new Set([
  "mujhe",
  "mujhko",
  "mera",
  "meri",
  "hai",
  "hain",
  "aur",
  "se",
  "ko",
  "mein",
  "main",
  "ka",
  "ki",
  "ke",
]);

const HINDI_PHRASE_TO_KEYWORD = {
  बुखार: "fever",
  "सर दर्द": "headache",
  "सिर दर्द": "headache",
  खांसी: "cough",
  जुकाम: "cold",
  "गले में खराश": "sore throat",
  थकान: "fatigue",
  मतली: "nausea",
  उल्टी: "vomiting",
  दस्त: "diarrhea",
  "पेट दर्द": "stomach pain",
  "सीने में दर्द": "chest pain",
  "सांस फूलना": "shortness of breath",
  "शरीर दर्द": "body pain",
  "पीठ दर्द": "back pain",
  "जोड़ों में दर्द": "joint pain",
  "भूख न लगना": "loss of appetite",
  "नाक बहना": "runny nose",
  छींक: "sneezing",
  "ठंड लगना": "chills",
  कमजोरी: "weakness",
  बेचैनी: "anxiety",
  "नींद न आना": "insomnia",
  "धुंधला दिखना": "blurred vision",
};

function hasHindiScript(text) {
  return /[\u0900-\u097F]/.test(String(text || ""));
}

function normalizeEnglish(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z\s,]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeHindiRoman(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z\s,]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function translateHindiToEnglishSentence(input = "") {
  let translated = String(input || "");

  Object.entries(HINDI_PHRASE_TO_KEYWORD)
    .sort((a, b) => b[0].length - a[0].length)
    .forEach(([hindiPhrase, englishKeyword]) => {
      const escaped = hindiPhrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      translated = translated.replace(
        new RegExp(escaped, "gi"),
        ` ${englishKeyword} `,
      );
    });

  // Support common Hinglish connectors by normalizing into English separators.
  translated = translated
    .replace(/\b(aur|or|plus|also)\b/gi, ", ")
    .replace(
      /\b(mujhe|mujhko|mera|meri|hai|hain|se|ko|mein|main|ka|ki|ke)\b/gi,
      " ",
    );

  return normalizeEnglish(translated);
}

function tokenizeForKeywords(text) {
  return normalizeEnglish(text)
    .split(/[\s,]+/)
    .map((word) => word.trim())
    .filter(Boolean)
    .filter(
      (word) => !ENGLISH_STOP_WORDS.has(word) && !HINDI_STOP_WORDS.has(word),
    );
}

function extractKeywordsFromKnownSymptoms(processedInput, knownSymptoms = []) {
  const normalizedInput = normalizeEnglish(processedInput);
  const tokens = new Set(tokenizeForKeywords(normalizedInput));
  const keywords = [];

  const normalizedSymptoms = (knownSymptoms || [])
    .map((symptom) =>
      String(symptom || "")
        .trim()
        .toLowerCase(),
    )
    .filter(Boolean);

  for (const symptom of normalizedSymptoms) {
    if (symptom.includes(" ")) {
      const phraseRegex = new RegExp(
        `(^|\\s)${symptom.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(\\s|$)`,
        "i",
      );
      if (phraseRegex.test(normalizedInput)) {
        keywords.push(symptom);
      }
      continue;
    }

    if (tokens.has(symptom)) {
      keywords.push(symptom);
    }
  }

  return [...new Set(keywords)];
}

export function processSymptomInput({ input, knownSymptoms = [] }) {
  const originalInput = String(input || "").trim();
  if (!originalInput) {
    return {
      original_input: "",
      processed_input: "",
      symptoms: [],
    };
  }

  const inputHasHindi = hasHindiScript(originalInput);
  const processedInput = inputHasHindi
    ? translateHindiToEnglishSentence(originalInput)
    : normalizeEnglish(originalInput);

  const symptoms = extractKeywordsFromKnownSymptoms(
    processedInput,
    knownSymptoms,
  );

  return {
    original_input: originalInput,
    processed_input: processedInput,
    symptoms,
  };
}
