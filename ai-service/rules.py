"""
Rule Engine for Severity Assessment and Emergency Detection
"""

CRITICAL_KEYWORDS = {
    'severe': ['chest pain', 'heart attack', 'stroke', 'difficulty breathing', 'breathlessness', 
               'paralysis', 'unconscious', 'unresponsive', 'severe bleeding', 'poisoning'],
    'emergency': ['cardiac arrest', 'choking', 'severe burn', 'anaphylaxis', 'sepsis', 
                  'severe allergic', 'loss of consciousness']
}

SYMPTOM_SEVERITY_MAP = {
    # Critical symptoms
    'chest pain': 'Critical',
    'difficulty breathing': 'Critical',
    'breathlessness': 'Critical',
    'paralysis': 'Critical',
    'unconscious': 'Critical',
    'severe bleeding': 'Critical',
    'heart attack': 'Critical',
    'stroke': 'Critical',
    'loss of consciousness': 'Critical',
    
    # High severity
    'high fever': 'High',
    'severe headache': 'High',
    'severe pain': 'High',
    'persistent cough': 'High',
    'persistent fever': 'High',
    'vomiting': 'High',
    
    # Moderate severity
    'fever': 'Moderate',
    'cough': 'Moderate',
    'sore throat': 'Moderate',
    'headache': 'Moderate',
    'fatigue': 'Moderate',
    
    # Mild severity
    'sneezing': 'Mild',
    'runny nose': 'Mild',
    'mild cough': 'Mild',
}

def get_severity_from_symptoms(symptoms_text):
    """
    Determine severity based on symptom keywords
    Returns: 'Critical', 'High', 'Moderate', or 'Mild'
    """
    symptoms_lower = symptoms_text.lower()
    
    # Check critical symptoms first
    for critical_symptom in SYMPTOM_SEVERITY_MAP.keys():
        if critical_symptom in symptoms_lower:
            severity = SYMPTOM_SEVERITY_MAP[critical_symptom]
            if severity == 'Critical':
                return 'Critical'
    
    # Check for high severity
    for critical_symptom in SYMPTOM_SEVERITY_MAP.keys():
        if critical_symptom in symptoms_lower:
            severity = SYMPTOM_SEVERITY_MAP[critical_symptom]
            if severity == 'High':
                return 'High'
    
    # Check for moderate severity
    for critical_symptom in SYMPTOM_SEVERITY_MAP.keys():
        if critical_symptom in symptoms_lower:
            severity = SYMPTOM_SEVERITY_MAP[critical_symptom]
            if severity == 'Moderate':
                return 'Moderate'
    
    return 'Mild'

def get_severity_from_days(days, severity_base='Moderate'):
    """
    Adjust severity based on duration
    """
    try:
        days = int(days)
    except:
        return severity_base
    
    # If symptoms persist for more than 7 days, escalate
    if days > 14:
        return 'High'
    elif days > 7:
        return 'Moderate' if severity_base == 'Mild' else severity_base
    
    return severity_base

def is_emergency(symptoms, disease_severity):
    """
    Check if condition requires immediate emergency care
    """
    symptoms_lower = symptoms.lower()
    
    # Emergency keywords
    emergency_keywords = [
        'chest pain', 'difficulty breathing', 'unconscious', 'fainting',
        'severe bleeding', 'poison', 'anaphylaxis', 'cardiac', 'stroke',
        'paralysis', 'loss of consciousness'
    ]
    
    for keyword in emergency_keywords:
        if keyword in symptoms_lower:
            return True
    
    # If severity is Critical, it's emergency
    if disease_severity == 'Critical':
        return True
    
    return False

def get_final_severity(symptoms, days, dataset_severity):
    """
    Combine multiple factors to get final severity
    """
    symptom_severity = get_severity_from_symptoms(symptoms)
    day_adjusted = get_severity_from_days(days, symptom_severity)
    
    # Priority: Document severity > Day-adjusted severity
    severity_levels = ['Mild', 'Moderate', 'High', 'Critical']
    
    scores = [
        severity_levels.index(dataset_severity) if dataset_severity in severity_levels else 1,
        severity_levels.index(day_adjusted) if day_adjusted in severity_levels else 1,
        severity_levels.index(symptom_severity) if symptom_severity in severity_levels else 1,
    ]
    
    final_idx = max(scores)
    return severity_levels[final_idx] if final_idx < len(severity_levels) else 'Moderate'
