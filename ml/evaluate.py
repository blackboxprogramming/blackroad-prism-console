import json, pathlib
from sklearn.metrics import roc_auc_score, confusion_matrix
# Here, metrics were computed in train.py; we just copy to eval.json for uniformity
pathlib.Path("ml/artifacts").mkdir(parents=True, exist_ok=True)
m = json.load(open("ml/artifacts/metrics.json"))
json.dump({"auc": m.get("auc",0.0)}, open("ml/artifacts/eval.json","w"))
print(json.dumps({"auc": m.get("auc",0.0)}))
