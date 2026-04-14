import re

PHRASE_SPLIT_PATTERN = re.compile(r'[;,]|\band\b|\bplus\b|\balso\b|\n', re.IGNORECASE)

TOKEN_REPLACEMENTS = {
    'tightness': 'tightness',
    'pressure': 'pressure',
    'radiating': 'radiating',
    'radiation': 'radiating',
    'breathlessness': 'shortness of breath',
    'breathless': 'shortness of breath',
    'sob': 'shortness of breath',
}

def clean_text(text):
    """
    Clean and normalize text input
    - Convert to lowercase
    - Remove special characters except spaces
    - Remove extra whitespace
    """
    if not isinstance(text, str):
        return ""
    
    # Convert to lowercase
    text = text.lower()
    
    # Remove special characters, keep only letters, numbers, and spaces
    text = re.sub(r'[^a-z0-9\s]', '', text)
    
    # Remove extra whitespace
    text = re.sub(r'\s+', ' ', text).strip()
    
    return text

def normalize_symptom_phrase(text):
    """Normalize one symptom phrase while preserving meaningful symptom terms."""
    cleaned = clean_text(text)
    if not cleaned:
        return ''

    normalized_tokens = []
    for token in cleaned.split():
        replacement = TOKEN_REPLACEMENTS.get(token, token)
        normalized_tokens.extend(replacement.split())

    return ' '.join(normalized_tokens).strip()

def split_symptom_phrases(text):
    """Split raw symptom text into normalized symptom phrases."""
    raw = str(text or '')
    parts = [part.strip() for part in PHRASE_SPLIT_PATTERN.split(raw) if part.strip()]

    phrases = []
    seen = set()
    for part in parts:
        normalized = normalize_symptom_phrase(part)
        if not normalized or normalized in seen:
            continue
        seen.add(normalized)
        phrases.append(normalized)

    return phrases

def tokenize(text):
    """
    Tokenize text into individual symptoms
    """
    cleaned = normalize_symptom_phrase(text)
    tokens = [t.strip() for t in cleaned.split() if t.strip()]
    return tokens
