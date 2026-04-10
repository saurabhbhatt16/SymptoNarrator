import re

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

def tokenize(text):
    """
    Tokenize text into individual symptoms
    """
    cleaned = clean_text(text)
    tokens = [t.strip() for t in cleaned.split() if t.strip()]
    return tokens
