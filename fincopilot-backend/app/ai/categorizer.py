import os
import numpy as np
import joblib
from dataclasses import dataclass

# Default system categories with representative keywords for cold-start
SYSTEM_CATEGORIES = {
    "dining": {"name": "Coffee & Dining", "keywords": ["coffee starbucks restaurant food dining cafe pizza burger mcdonalds chipotle subway sushi ramen thai"], "icon": "🍽️"},
    "groceries": {"name": "Groceries", "keywords": ["grocery walmart target kroger safeway whole foods trader joe costco aldi publix"], "icon": "🛒"},
    "transport": {"name": "Transportation", "keywords": ["uber lyft taxi gas fuel shell chevron bp metro bus train airline flight airbnb"], "icon": "🚗"},
    "entertainment": {"name": "Entertainment", "keywords": ["netflix spotify hulu disney amazon prime game cinema movie theater concert"], "icon": "🎬"},
    "utilities": {"name": "Utilities", "keywords": ["electric gas water phone internet cable at&t verizon comcast pg&e utility bill"], "icon": "💡"},
    "health": {"name": "Health & Medical", "keywords": ["pharmacy cvs walgreens doctor hospital dental gym fitness medical prescription"], "icon": "🏥"},
    "shopping": {"name": "Shopping", "keywords": ["amazon apple store best buy zara h&m nike adidas clothing shoes electronics"], "icon": "🛍️"},
    "housing": {"name": "Housing", "keywords": ["rent mortgage airbnb hotel lodging accommodation property"], "icon": "🏠"},
    "finance": {"name": "Finance & Banking", "keywords": ["bank transfer wire atm fee interest payment loan credit"], "icon": "🏦"},
    "other": {"name": "Other", "keywords": [""], "icon": "💰"},
}


class ExpenseCategorizer:
    def __init__(self, model_dir: str = "models"):
        self.model_dir = model_dir
        self.clf = None
        self.encoder = None
        self._load_models()

    def _load_models(self):
        try:
            from sentence_transformers import SentenceTransformer
            self.encoder = SentenceTransformer("all-MiniLM-L6-v2")
        except Exception:
            self.encoder = None

        clf_path = os.path.join(self.model_dir, "category_clf.pkl")
        if os.path.exists(clf_path):
            try:
                self.clf = joblib.load(clf_path)
            except Exception:
                self.clf = None

    def predict(self, description: str, merchant: str, amount: float) -> dict:
        text = f"{merchant} {description}".lower()

        if self.encoder and self.clf:
            try:
                embedding = self.encoder.encode([f"{merchant} {description} {amount:.0f}"])[0]
                probs = self.clf.predict_proba([embedding])[0]
                top_idx = np.argsort(probs)[::-1][:3]
                return {
                    "category_id": self.clf.classes_[top_idx[0]],
                    "confidence": float(probs[top_idx[0]]),
                    "top3": [{"id": self.clf.classes_[i], "prob": float(probs[i])} for i in top_idx],
                }
            except Exception:
                pass

        return self._keyword_match(text)

    def _keyword_match(self, text: str) -> dict:
        best_cat = "other"
        best_score = 0

        for cat_id, cat_data in SYSTEM_CATEGORIES.items():
            keywords = cat_data["keywords"][0].split()
            score = sum(1 for kw in keywords if kw in text)
            if score > best_score:
                best_score = score
                best_cat = cat_id

        confidence = min(0.95, 0.50 + best_score * 0.10) if best_score > 0 else 0.40
        return {
            "category_id": best_cat,
            "confidence": confidence,
            "top3": [{"id": best_cat, "prob": confidence}],
        }

    def retrain(self, corrections: list) -> None:
        if not self.encoder or len(corrections) < 50:
            return
        try:
            from sklearn.linear_model import LogisticRegression

            texts = [f"{c.original_description}" for c in corrections]
            labels = [str(c.new_category_id) for c in corrections]
            X = self.encoder.encode(texts)

            clf = LogisticRegression(max_iter=1000, C=1.0)
            clf.fit(X, labels)

            os.makedirs(self.model_dir, exist_ok=True)
            joblib.dump(clf, os.path.join(self.model_dir, "category_clf.pkl"))
            self.clf = clf
        except Exception as e:
            print(f"Retrain failed: {e}")
