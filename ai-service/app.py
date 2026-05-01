"""
Flask API for AI Symptom Checker Service
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
from predictor import predict, generate_report, get_specialist_for_disease
from nlp import tokenize
from deep_translator import GoogleTranslator
from langdetect import detect, LangDetectException
import traceback
import sys
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

app = Flask(__name__)


def read_int_env(name, default):
    raw_value = os.environ.get(name, default)
    try:
        return int(str(raw_value).strip())
    except (TypeError, ValueError):
        print(
            f"Warning: invalid {name}={raw_value!r}; falling back to {default}",
            file=sys.stderr,
        )
        return int(default)


def detect_language(text):
    candidate = str(text or "").strip()
    if not candidate:
        return "en"

    try:
        return detect(candidate)
    except LangDetectException:
        return "en"


def translate_text(text, target_language):
    source_text = str(text or "")
    target = str(target_language or "en").strip().lower()

    if not source_text:
        return source_text

    if not target or target == "en":
        return source_text

    try:
        translated = GoogleTranslator(source="auto", target=target).translate(source_text)
        return translated if isinstance(translated, str) and translated.strip() else source_text
    except Exception:
        # Keep behavior stable if translation service is unavailable.
        return source_text

# CORS configuration - allow requests from backend
CORS(app, origins=[
    "http://localhost:5000",
    "http://localhost:5173",
    os.getenv("BACKEND_URL", "http://localhost:5000"),
    os.getenv("FRONTEND_URL", "http://localhost:5173")
])

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'MediSense AI Symptom Checker',
        'version': '1.0.0'
    }), 200

@app.route('/api/predict', methods=['POST'])
def predict_endpoint():
    """
    Predict disease from symptoms
    
    Request JSON:
    {
        "symptoms": "fever cough fatigue"
    }
    
    Response: Disease prediction with details
    """
    try:
        data = request.json
        
        if not data or 'symptoms' not in data:
            return jsonify({
                'error': 'Missing required field: symptoms',
                'status': 'failed'
            }), 400
        
        symptoms = data.get('symptoms', '').strip()
        
        if not symptoms:
            return jsonify({
                'error': 'Symptoms field cannot be empty',
                'status': 'failed'
            }), 400
        
        result = predict(symptoms)
        
        if result is None:
            return jsonify({
                'error': 'Could not process symptoms',
                'status': 'failed'
            }), 400
        
        result['status'] = 'success'
        return jsonify(result), 200
    
    except Exception as e:
        print(f"Error in /api/predict: {str(e)}", file=sys.stderr)
        traceback.print_exc()
        return jsonify({
            'error': str(e),
            'status': 'failed'
        }), 500

@app.route('/api/analyze', methods=['POST'])
def analyze_endpoint():
    """
    Generate complete health report from symptoms
    
    Request JSON:
    {
        "symptoms": "fever cough fatigue",
        "days": 5,
        "user": {
            "id": "user123",
            "name": "John Doe",
            "age": 28,
            "gender": "Male"
        }
    }
    
    Response: Comprehensive health report
    """
    try:
        data = request.json
        
        # Validate required fields
        if not data or 'symptoms' not in data:
            return jsonify({
                'error': 'Missing required field: symptoms',
                'status': 'failed'
            }), 400
        
        symptoms = data.get('symptoms', '').strip()
        original_input = str(data.get('original_input', '')).strip()
        days = data.get('days', 1)
        user_info = data.get('user', {})
        
        if not symptoms:
            return jsonify({
                'error': 'Symptoms field cannot be empty',
                'status': 'failed'
            }), 400

        # Debug logs for end-to-end symptom lifecycle verification.
        # Translation currently happens upstream before this service receives keywords.
        translated_text = symptoms
        symptom_tokens = tokenize(translated_text)
        print("Original:", symptoms, flush=True)
        print("Translated:", translated_text, flush=True)
        print("Tokens:", symptom_tokens, flush=True)
        
        # Generate report
        report = generate_report(symptoms, days, user_info)

        if isinstance(report, dict) and report.get('status') == 'success':
            existing_summary = str(report.get('summary', '') or '')
            detected_language = detect_language(original_input or symptoms)
            report['translated_summary'] = translate_text(existing_summary, detected_language)
        
        return jsonify(report), 200
    
    except Exception as e:
        print(f"Error in /api/analyze: {str(e)}", file=sys.stderr)
        traceback.print_exc()
        return jsonify({
            'error': str(e),
            'status': 'failed'
        }), 500

@app.route('/api/specialist/<disease_name>', methods=['GET'])
def get_specialist_endpoint(disease_name):
    """
    Get specialist for a specific disease
    
    URL: /api/specialist/Flu%20(Influenza)
    Response: {"disease": "Flu (Influenza)", "specialist": "General Physician"}
    """
    try:
        specialist = get_specialist_for_disease(disease_name)
        
        if specialist is None:
            return jsonify({
                'error': f'Disease not found: {disease_name}',
                'status': 'failed'
            }), 404
        
        return jsonify({
            'disease': disease_name,
            'specialist': specialist,
            'status': 'success'
        }), 200
    
    except Exception as e:
        print(f"Error in /api/specialist: {str(e)}", file=sys.stderr)
        return jsonify({
            'error': str(e),
            'status': 'failed'
        }), 500

@app.route('/api/report', methods=['POST'])
def report_endpoint():
    """
    Alias for /api/analyze - Generate complete health report
    """
    return analyze_endpoint()


@app.route('/api/translate', methods=['POST'])
def translate_endpoint():
    """Translate arbitrary text to a target language."""
    try:
        data = request.json or {}
        text = str(data.get('text', '')).strip()
        target_language = str(data.get('target_language', 'en')).strip().lower()

        if not text:
            return jsonify({
                'error': 'Missing required field: text',
                'status': 'failed'
            }), 400

        translated_text = translate_text(text, target_language)
        return jsonify({
            'status': 'success',
            'translated_text': translated_text
        }), 200
    except Exception as e:
        print(f"Error in /api/translate: {str(e)}", file=sys.stderr)
        return jsonify({
            'error': str(e),
            'status': 'failed'
        }), 500

@app.errorhandler(404)
def not_found(error):
    """Handle 404 errors"""
    return jsonify({
        'error': 'Endpoint not found',
        'status': 'failed'
    }), 404

@app.errorhandler(500)
def server_error(error):
    """Handle 500 errors"""
    return jsonify({
        'error': 'Internal server error',
        'status': 'failed'
    }), 500

if __name__ == '__main__':
    app.run(
        debug=os.environ.get('FLASK_DEBUG', 'false').lower() == 'true',
        host='0.0.0.0',
        port=read_int_env('PORT', 8000)
    )
