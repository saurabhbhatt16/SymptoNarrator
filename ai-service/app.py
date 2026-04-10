"""
Flask API for AI Symptom Checker Service
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
from predictor import predict, generate_report, get_specialist_for_disease
import traceback
import sys
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

app = Flask(__name__)

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
        days = data.get('days', 1)
        user_info = data.get('user', {})
        
        if not symptoms:
            return jsonify({
                'error': 'Symptoms field cannot be empty',
                'status': 'failed'
            }), 400
        
        # Generate report
        report = generate_report(symptoms, days, user_info)
        
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
    app_port = int(os.getenv("APP_PORT", 8000))
    app_env = os.getenv("APP_ENV", "development")
    debug_mode = app_env == "development"
    
    print("🚀 Starting MediSense AI Symptom Checker Service...")
    print(f"📍 Flask API running on http://localhost:{app_port}")
    print(f"🔧 Environment: {app_env}")
    print("\nEndpoints:")
    print("  GET  /health")
    print("  POST /api/predict")
    print("  POST /api/analyze")
    print("  POST /api/report")
    print("  GET  /api/specialist/<disease_name>")
    
    app.run(debug=debug_mode, host='0.0.0.0', port=app_port)
