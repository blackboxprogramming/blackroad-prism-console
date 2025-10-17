import json, os, pickle, pathlib
from sklearn.datasets import make_classification
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import roc_auc_score
from sklearn.model_selection import train_test_split

X, y = make_classification(n_samples=5000, n_features=4, n_informative=3, random_state=42)
Xtr, Xte, ytr, yte = train_test_split(X, y, test_size=0.25, random_state=42)

clf = LogisticRegression(max_iter=1000).fit(Xtr, ytr)
probs = clf.predict_proba(Xte)[:,1]
auc = roc_auc_score(yte, probs)

pathlib.Path("ml/artifacts").mkdir(parents=True, exist_ok=True)
with open("ml/artifacts/model.pkl","wb") as f: pickle.dump(clf, f)
with open("ml/artifacts/model.json","w") as f:
    json.dump({"kind":"linear","w":clf.coef_[0].tolist(),"b":float(clf.intercept_[0])}, f)
with open("ml/artifacts/metrics.json","w") as f:
    json.dump({"auc": float(auc)}, f)
print(json.dumps({"auc": float(auc)}))
