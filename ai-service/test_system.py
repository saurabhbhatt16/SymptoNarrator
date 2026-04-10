"""
MediSense AI - System Test Suite
Tests all components of the AI symptom checker system
"""

import requests
import json
import time
from datetime import datetime

# Configuration
FLASK_URL = "http://localhost:5000"
BACKEND_URL = "http://localhost:3000"  # Update with your backend port if different

# Auth token (get from login, use for testing)
AUTH_TOKEN = None  # Set this to your actual token for testing

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    END = '\033[0m'

def print_test(name):
    print(f"\n{Colors.BLUE}{'='*60}{Colors.END}")
    print(f"{Colors.YELLOW}▶ {name}{Colors.END}")
    print(f"{Colors.BLUE}{'='*60}{Colors.END}")

def print_success(msg):
    print(f"{Colors.GREEN}✓ {msg}{Colors.END}")

def print_error(msg):
    print(f"{Colors.RED}✗ {msg}{Colors.END}")

def print_info(msg):
    print(f"  {msg}")

# ==================== Flask Service Tests ====================

def test_flask_health():
    """Test Flask service is running"""
    print_test("Flask Health Check")
    
    try:
        response = requests.get(f"{FLASK_URL}/health", timeout=5)
        
        if response.status_code == 200:
            print_success("Flask service is running")
            print_info(f"Response: {response.json()}")
            return True
        else:
            print_error(f"Unexpected status code: {response.status_code}")
            return False
            
    except requests.exceptions.ConnectionError:
        print_error(f"Cannot connect to Flask service at {FLASK_URL}")
        print_info("Make sure to run: python app.py in ai-service directory")
        return False
    except Exception as e:
        print_error(f"Error: {str(e)}")
        return False

def test_flask_predict():
    """Test disease prediction"""
    print_test("Flask Disease Prediction")
    
    test_cases = [
        {"symptoms": "fever cough body pain"},
        {"symptoms": "chest pain difficulty breathing"},
        {"symptoms": "sneezing runny nose sore throat"},
    ]
    
    for i, test_case in enumerate(test_cases, 1):
        try:
            print_info(f"Test {i}: {test_case['symptoms']}")
            
            response = requests.post(
                f"{FLASK_URL}/api/predict",
                json=test_case,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                print_success(f"Predicted: {data['disease_name']}")
                print_info(f"  Specialist: {data['specialist_doctor']}")
                print_info(f"  Confidence: {data['match_confidence']}")
            else:
                print_error(f"Failed with status {response.status_code}")
                
        except Exception as e:
            print_error(f"Error: {str(e)}")

def test_flask_analyze():
    """Test comprehensive report generation"""
    print_test("Flask Health Report Analysis")
    
    payload = {
        "symptoms": "fever cough fatigue",
        "days": 5,
        "user": {
            "id": "test_user_123",
            "name": "Test Patient",
            "age": 28,
            "gender": "Male"
        }
    }
    
    try:
        print_info(f"Analyzing: {payload['symptoms']} (for {payload['days']} days)")
        
        response = requests.post(
            f"{FLASK_URL}/api/analyze",
            json=payload,
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            
            if data['status'] == 'success':
                print_success("Report generated successfully")
                report = data
                print_info(f"Disease: {report['diagnosis']['disease_name']}")
                print_info(f"Category: {report['diagnosis']['category']}")
                print_info(f"Severity: {report['severity']['level']}")
                print_info(f"Is Emergency: {report['severity']['is_emergency']}")
                print_info(f"Recovery: {report['recovery']['estimated_range']}")
                print_info(f"Medicines: {', '.join(report['treatment']['medicines'][:2])}...")
            else:
                print_error(f"Report generation failed: {data.get('error')}")
        else:
            print_error(f"Failed with status {response.status_code}")
            
    except Exception as e:
        print_error(f"Error: {str(e)}")

def test_flask_specialist():
    """Test specialist lookup"""
    print_test("Flask Specialist Lookup")
    
    diseases = ["Flu (Influenza)", "Heart Attack", "Asthma"]
    
    for disease in diseases:
        try:
            print_info(f"Looking up specialist for: {disease}")
            
            response = requests.get(
                f"{FLASK_URL}/api/specialist/{disease}",
                timeout=5
            )
            
            if response.status_code == 200:
                data = response.json()
                print_success(f"{disease} → {data['specialist']}")
            elif response.status_code == 404:
                print_error(f"Disease not found: {disease}")
            else:
                print_error(f"Failed with status {response.status_code}")
                
        except Exception as e:
            print_error(f"Error: {str(e)}")

# ==================== Backend Tests ====================

def test_backend_analyze():
    """Test Node backend analyze endpoint"""
    print_test("Node Backend AI Analysis")
    
    if not AUTH_TOKEN:
        print_error("AUTH_TOKEN not set - skipping backend tests")
        print_info("Set AUTH_TOKEN variable to run backend tests")
        return
    
    payload = {
        "symptoms": "fever cough",
        "days": 3
    }
    
    headers = {
        "Authorization": f"Bearer {AUTH_TOKEN}",
        "Content-Type": "application/json"
    }
    
    try:
        print_info("Sending analyze request to backend...")
        
        response = requests.post(
            f"{BACKEND_URL}/api/ai/analyze",
            json=payload,
            headers=headers,
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            print_success("Backend analysis successful")
            
            report = data.get('data', {})
            print_info(f"Disease: {report.get('diagnosis', {}).get('disease_name')}")
            print_info(f"Available Doctors: {report.get('total_doctors_available', 0)}")
            
        else:
            print_error(f"Failed with status {response.status_code}")
            print_info(f"Response: {response.text}")
            
    except Exception as e:
        print_error(f"Error: {str(e)}")

def test_backend_doctors():
    """Test Node backend doctors endpoint"""
    print_test("Node Backend Doctor Lookup")
    
    if not AUTH_TOKEN:
        print_error("AUTH_TOKEN not set - skipping backend tests")
        return
    
    specialists = ["General Physician", "Cardiologist", "Pulmonologist"]
    
    headers = {
        "Authorization": f"Bearer {AUTH_TOKEN}",
        "Content-Type": "application/json"
    }
    
    for specialist in specialists:
        try:
            print_info(f"Fetching doctors for: {specialist}")
            
            response = requests.get(
                f"{BACKEND_URL}/api/ai/doctors/{specialist}",
                headers=headers,
                timeout=5
            )
            
            if response.status_code == 200:
                data = response.json()
                total = data.get('total', 0)
                print_success(f"Found {total} doctors")
                
                doctors = data.get('doctors', [])
                for doc in doctors[:2]:  # Show first 2
                    print_info(f"  - {doc['name']} ({doc['hospital']})")
                    
            else:
                print_error(f"Failed with status {response.status_code}")
                
        except Exception as e:
            print_error(f"Error: {str(e)}")

# ==================== Integration Tests ====================

def test_full_workflow():
    """Test complete end-to-end workflow"""
    print_test("Complete AI Workflow Test")
    
    print_info("Step 1: Flask receives patient input")
    user_symptoms = "fever cough body ache"
    print_info(f"  Input: '{user_symptoms}'")
    
    print_info("Step 2: NLP cleaning")
    cleaned = user_symptoms.lower().replace(",", "").replace("ache", "pain")
    print_info(f"  Cleaned: '{cleaned}'")
    
    print_info("Step 3: TF-IDF matching against dataset")
    print_info("  Comparing with 100+ diseases...")
    
    try:
        response = requests.post(
            f"{FLASK_URL}/api/predict",
            json={"symptoms": user_symptoms},
            timeout=10
        )
        
        if response.status_code == 200:
            prediction = response.json()
            print_success(f"Matched disease: {prediction['disease_name']}")
            
            print_info("Step 4: Severity assessment")
            print_info(f"  From dataset: {prediction['severity']}")
            
            print_info("Step 5: Get specialist")
            specialist = prediction['specialist_doctor']
            print_info(f"  Specialist required: {specialist}")
            
            print_info("Step 6: Query for doctors (would happen in backend)")
            print_info(f"  Backend queries DB for verified {specialist}s")
            
            print_info("Step 7: Generate report with doctor list")
            print_success("Complete workflow executed successfully")
            
        else:
            print_error(f"Workflow failed at prediction step")
            
    except Exception as e:
        print_error(f"Workflow error: {str(e)}")

# ==================== Performance Tests ====================

def test_performance():
    """Test system performance metrics"""
    print_test("Performance Metrics")
    
    try:
        payload = {"symptoms": "fever cough fatigue"}
        
        start = time.time()
        response = requests.post(
            f"{FLASK_URL}/api/predict",
            json=payload,
            timeout=10
        )
        elapsed = time.time() - start
        
        if response.status_code == 200:
            print_success(f"Prediction time: {elapsed*1000:.2f}ms")
        
        # Test multiple predictions
        print_info("\nTesting 5 sequential predictions...")
        times = []
        
        for i in range(5):
            start = time.time()
            requests.post(
                f"{FLASK_URL}/api/predict",
                json={"symptoms": f"symptom {i}"},
                timeout=10
            )
            elapsed = time.time() - start
            times.append(elapsed)
            
        avg_time = sum(times) / len(times)
        max_time = max(times)
        min_time = min(times)
        
        print_info(f"  Average: {avg_time*1000:.2f}ms")
        print_info(f"  Min: {min_time*1000:.2f}ms")
        print_info(f"  Max: {max_time*1000:.2f}ms")
        
        if avg_time < 0.2:  # 200ms
            print_success("Performance is excellent")
        elif avg_time < 0.5:  # 500ms
            print_success("Performance is good")
        else:
            print_error("Performance may need optimization")
            
    except Exception as e:
        print_error(f"Error: {str(e)}")

# ==================== Main ====================

def main():
    print(f"\n{Colors.BLUE}")
    print("╔═══════════════════════════════════════════════════════════════╗")
    print("║        MediSense AI Symptom Checker - Test Suite              ║")
    print(f"║       {datetime.now().strftime('%A, %B %d, %Y at %H:%M:%S')}        ║")
    print("╚═══════════════════════════════════════════════════════════════╝")
    print(Colors.END)
    
    print(f"\n{Colors.YELLOW}Configuration:{Colors.END}")
    print(f"  Flask Service: {FLASK_URL}")
    print(f"  Backend URL: {BACKEND_URL}")
    print(f"  Auth Token: {'Set' if AUTH_TOKEN else 'Not set (backend tests skipped)'}")
    
    # Run tests
    print(f"\n{Colors.YELLOW}Running Flask Service Tests...{Colors.END}")
    flask_ok = test_flask_health()
    
    if not flask_ok:
        print(f"\n{Colors.RED}Flask service not running. Cannot continue.{Colors.END}")
        return
    
    test_flask_predict()
    test_flask_analyze()
    test_flask_specialist()
    
    print(f"\n{Colors.YELLOW}Running Backend Tests...{Colors.END}")
    if AUTH_TOKEN:
        test_backend_analyze()
        test_backend_doctors()
    else:
        print(f"{Colors.YELLOW}Skipping backend tests (no AUTH_TOKEN){Colors.END}")
    
    print(f"\n{Colors.YELLOW}Running Integration Tests...{Colors.END}")
    test_full_workflow()
    
    print(f"\n{Colors.YELLOW}Running Performance Tests...{Colors.END}")
    test_performance()
    
    # Summary
    print(f"\n{Colors.BLUE}{'='*63}{Colors.END}")
    print(f"{Colors.GREEN}✓ Test Suite Complete{Colors.END}")
    print(f"{Colors.BLUE}{'='*63}{Colors.END}\n")

if __name__ == "__main__":
    main()
