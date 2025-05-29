"""
backend/app.py
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
A tiny Flask server that loads a pickled TF-IDF+classifier pipeline*
and exposes a single POST endpoint `/api/verify`.

Send it a JSON payload like `{ "text": "your claim here" }` and it will
reply with:

```json
{
  "label": "real" | "fake",     # the prediction
  "confidence": 0.93,            # nice human friendly 0-1 score
  "why": "Key words: …"          # top tokens that swayed the model
}
```

The code works for *both* linear models (LogReg / SVM) **and** Naïve‑Bayes
family models because we check which attributes the classifier provides.
"""

from pathlib import Path

from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import numpy as np

# 1. Load the trained pipeline (.pkl)

MODEL_PATH = Path("covid_fake_news_nb_with_validation.pkl")
pipe = joblib.load(MODEL_PATH) 

# 2. Spin up the Flask app and enable CORS so the Next.js front‑end running
#    on http://localhost:3000 can talk to us without browser complaints.

app = Flask(__name__)
CORS(app)

# 3. Helper – pull out the 4 most influential tokens so users get a clue
#    *why* the model said "fake" / "real".

def layman_reason(text: str, top_k: int = 4) -> str:
    """Return a comma separated string with the `top_k` tokens that had
    the biggest absolute impact on this particular prediction."""

    tfidf = pipe.named_steps["tfidf"]
    clf = pipe.named_steps["clf"]

    # Weight vector depends on model family
    if hasattr(clf, "coef_"):  # linear SVM / Logistic Regression
        coef = clf.coef_.ravel()
    elif hasattr(clf, "feature_log_prob_"):  # MultinomialNB, BernoulliNB …
        coef = clf.feature_log_prob_[1] - clf.feature_log_prob_[0]
    else:
        return "N/A"  # something exotic we didn't account for

    row = tfidf.transform([text])
    idxs = row.nonzero()[1]
    pairs = [(
        tfidf.get_feature_names_out()[j],
        row[0, j] * coef[j]
    ) for j in idxs]
    pairs.sort(key=lambda x: abs(x[1]), reverse=True)

    words = [token for token, _ in pairs[:top_k]]
    return ", ".join(words) if words else "N/A"

# 4. Main prediction endpoint

@app.route("/api/verify", methods=["POST"])
def verify():
    data = request.get_json(silent=True) or {}
    text = (data.get("text") or "").strip()
    if not text:
        return jsonify({"error": "No text provided"}), 400

    # prediction 
    label = pipe.predict([text])[0]  # 'fake' or 'real'

    # convert raw model output into a friendly 0‑1 confidence
    tfidf_row = pipe.named_steps["tfidf"].transform([text])
    clf = pipe.named_steps["clf"]

    if hasattr(clf, "decision_function"):
        margin = float(clf.decision_function(tfidf_row)[0])
        prob = 1 / (1 + np.exp(-margin))  # sigmoid → 0‒1
    else:  # Naïve‑Bayes
        log_probs = clf.predict_log_proba(tfidf_row)[0]
        prob = float(np.exp(log_probs.max()))  # highest class prob
        margin = float(log_probs[1] - log_probs[0])  # still handy for debug

    return jsonify(
        label=label,
        confidence=prob,
        why=f"Key words: {layman_reason(text)}"
    )

# 5. Tiny health‑check so you can open http://127.0.0.1:5000 in the browser

@app.route("/")
def home():
    return "Fake-News API up!"

# 6. Dev server entry point

if __name__ == "__main__":
    # 0.0.0.0 → visible on LAN; remove that if you only want localhost.
    app.run(host="0.0.0.0", port=5000, debug=True)
