"""
Main prediction engine using TF-IDF and similarity matching
"""

import numpy as np
import warnings
from sklearn.metrics.pairwise import cosine_similarity
from model import df, vectorizer, X
from nlp import clean_text, tokenize, split_symptom_phrases
from rules import get_final_severity, is_emergency

warnings.filterwarnings(
    "ignore",
    message="The parameter 'stop_words' will not be used since 'analyzer' != 'word'",
)

def _jaccard_similarity(left_tokens, right_tokens):
    left = set(left_tokens)
    right = set(right_tokens)
    if not left or not right:
        return 0.0
    return len(left & right) / len(left | right)

def _compute_overlap_scores(user_symptoms):
    user_phrases = split_symptom_phrases(user_symptoms)
    user_phrase_tokens = [set(tokenize(phrase)) for phrase in user_phrases]
    user_tokens = set(tokenize(' '.join(user_phrases)))

    exact_overlap_scores = np.zeros(len(df), dtype=float)
    token_overlap_scores = np.zeros(len(df), dtype=float)

    for idx, disease_row in df.iterrows():
      disease_phrases = split_symptom_phrases(disease_row.get('Symptoms', ''))
      disease_phrase_tokens = [set(tokenize(phrase)) for phrase in disease_phrases]
      disease_tokens = set(tokenize(' '.join(disease_phrases)))

      if user_phrases and disease_phrase_tokens:
          matched = 0
          for user_token_set in user_phrase_tokens:
              best = 0.0
              for disease_token_set in disease_phrase_tokens:
                  score = _jaccard_similarity(user_token_set, disease_token_set)
                  if score > best:
                      best = score
              if best >= 0.6:
                  matched += 1

          exact_overlap_scores[idx] = matched / max(1, len(user_phrase_tokens))

      token_overlap_scores[idx] = _jaccard_similarity(user_tokens, disease_tokens)

    return exact_overlap_scores, token_overlap_scores

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

    # Calculate phrase/token overlap scores for medically meaningful symptom alignment
    exact_overlap_scores, token_overlap_scores = _compute_overlap_scores(user_symptoms)

    # Blend semantic (TF-IDF) and structured overlap signals.
    final_scores = (
        (0.55 * exact_overlap_scores)
        + (0.25 * token_overlap_scores)
        + (0.20 * similarity_scores)
    )
    
    # Get top match index
    top_idx = int(np.argmax(final_scores))
    top_score = float(final_scores[top_idx])
    
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
        'similarity_score': float(similarity_scores[top_idx]),
        'final_match_score': top_score,
        'exact_overlap_score': float(exact_overlap_scores[top_idx]),
        'token_overlap_score': float(token_overlap_scores[top_idx]),
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
