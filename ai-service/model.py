import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
import os

# Get the base directory of this script
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
CSV_PATH = os.path.join(BASE_DIR, 'data', 'dataset.csv')

# Load dataset
df = pd.read_csv(CSV_PATH)

# Normalize symptoms to lowercase and clean
df['Symptoms'] = df['Symptoms'].str.lower().str.strip()

# Initialize TF-IDF Vectorizer
vectorizer = TfidfVectorizer(
    lowercase=True,
    stop_words='english',
    analyzer='char',
    ngram_range=(2, 3),
    max_features=500
)

# Fit vectorizer on symptoms
X = vectorizer.fit_transform(df['Symptoms'])

print(f"✓ Dataset loaded: {len(df)} diseases")
print(f"✓ Vectorizer fitted with {len(vectorizer.get_feature_names_out())} features")
