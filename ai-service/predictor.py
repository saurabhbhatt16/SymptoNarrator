"""
Main prediction engine using TF-IDF and similarity matching
"""

import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
from model import df, vectorizer, X
from nlp import clean_text, tokenize
from rules import get_final_severity, is_emergency

def predict(user_symptoms):
    """
    Predict disease based on user input symptoms
    Returns: Dictionary with disease details from dataset
    """
    # Clean user input
    cleaned_symptoms = clean_text(user_symptoms)
    
    if not cleaned_symptoms:
        return None
    
    # Transform user input using the same vectorizer
    user_vec = vectorizer.transform([cleaned_symptoms])
    
    # Calculate cosine similarity with all diseases
    similarity_scores = cosine_similarity(user_vec, X).flatten()
    
    # Get top match index
    top_idx = np.argmax(similarity_scores)
    top_score = similarity_scores[top_idx]
    
    # Return matched disease as dictionary
    disease = df.iloc[top_idx]
    
    return {
        'disease_id': disease['Disease_ID'],
        'disease_name': disease['Disease_Name'],
        'symptoms': disease['Symptoms'],
        'specialist_doctor': disease['Specialist_Doctor'],
        'disease_category': disease['Disease_Category'],
        'treatment_plan': disease['Treatment_Plan'],
        'medicines': disease['Medicines'],
        'severity': disease['Severity'],
        'disease_type': disease['Disease_Type'],
        'min_recovery_days': int(disease['Min_Recovery_Days']),
        'max_recovery_days': int(disease['Max_Recovery_Days']),
        'prevalence': disease['Prevalence'],
        'similarity_score': float(top_score),
        'match_confidence': f"{float(top_score) * 100:.2f}%"
    }

def generate_report(symptoms, days, user_info):
    """
    Generate comprehensive health report
    
    Args:
        symptoms: str - User's symptoms
        days: int - Number of days experiencing symptoms
        user_info: dict - {id, name, age, gender}
    
    Returns:
        dict - Complete health report
    """
    try:
        days = int(days)
    except:
        days = 1
    
    # Get prediction
    prediction = predict(symptoms)
    
    if not prediction:
        return {
            'error': 'Could not analyze symptoms. Please provide clear symptom description.',
            'status': 'failed'
        }
    
    # Calculate final severity
    final_severity = get_final_severity(
        symptoms,
        days,
        prediction['severity']
    )
    
    # Check if emergency
    is_emergency_case = is_emergency(symptoms, final_severity)
    
    # Parse medicines and treatment plan
    medicines_list = [m.strip() for m in prediction['medicines'].split(';')]
    treatment_list = [t.strip() for t in prediction['treatment_plan'].split(';')]
    investigation_list = ['Blood Test (CBC)']  # Default, can be expanded
    
    # Create summary
    summary = f"{user_info.get('age', '?')} year old {user_info.get('gender', '?')} patient {user_info.get('name', 'patient')} is experiencing {symptoms} since {days} day(s)."
    
    # Build report
    report = {
        'status': 'success',
        'patient': {
            'id': user_info.get('id'),
            'name': user_info.get('name'),
            'age': user_info.get('age'),
            'gender': user_info.get('gender')
        },
        'input': {
            'symptoms': symptoms,
            'duration_days': days
        },
        'diagnosis': {
            'disease_id': prediction['disease_id'],
            'disease_name': prediction['disease_name'],
            'category': prediction['disease_category'],
            'type': prediction['disease_type'],
            'prevalence': prediction['prevalence'],
            'confidence': prediction['match_confidence']
        },
        'specialist_required': prediction['specialist_doctor'],
        'treatment': {
            'plan': treatment_list,
            'medicines': medicines_list,
            'investigations': investigation_list
        },
        'recovery': {
            'min_days': prediction['min_recovery_days'],
            'max_days': prediction['max_recovery_days'],
            'estimated_range': f"{prediction['min_recovery_days']} - {prediction['max_recovery_days']} days"
        },
        'severity': {
            'level': final_severity,
            'is_emergency': is_emergency_case,
            'recommendation': 'Seek immediate medical attention' if is_emergency_case else 'Schedule appointment with specialist'
        },
        'summary': summary,
        'confidence_score': prediction['similarity_score']
    }
    
    return report

def get_doctors_for_specialist(specialist_name):
    """
    Get all unique specialists from dataset
    """
    return df['Specialist_Doctor'].unique().tolist()

def get_specialist_for_disease(disease_name):
    """
    Get specialist for a specific disease
    """
    result = df[df['Disease_Name'].str.lower() == disease_name.lower()]
    if not result.empty:
        return result.iloc[0]['Specialist_Doctor']
    return None
