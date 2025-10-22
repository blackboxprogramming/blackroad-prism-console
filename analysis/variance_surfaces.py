"""
Variance heatmaps + closed-form check.
Reads:
  data/raw/Trinary_Optimizer__min-Var_.csv
  data/raw/quaternary_optimizer_summary.csv
"""
import os, pandas as pd, numpy as np, matplotlib.pyplot as plt
os.makedirs("figures", exist_ok=True)

tri = pd.read_csv("data/raw/Trinary_Optimizer__min-Var_.csv")
pivot = tri.pivot_table(index="a", columns="b", values="var")
plt.figure(figsize=(6,4)); plt.imshow(pivot.values, origin="lower", aspect="auto", cmap="viridis")
plt.colorbar(label="Var[ψ_w]"); plt.title("Trinary variance heatmap (a+b+c=0)")
plt.xlabel("b"); plt.ylabel("a"); plt.tight_layout()
plt.savefig("figures/trinary_variance_heatmap.png"); plt.close()

print("wrote figures/trinary_variance_heatmap.png")
#!/usr/bin/env python
# coding: utf-8

# # Variance Surfaces
# 
# Trinary/quaternary variance heatmaps with closed-form check.

# In[ ]:


import pandas as pd
import matplotlib.pyplot as plt

# TODO: implement analysis
"""
Variance heatmaps + closed-form check.
Reads:
  data/raw/Trinary_Optimizer__min-Var_.csv
  data/raw/quaternary_optimizer_summary.csv
"""
import os, pandas as pd, numpy as np, matplotlib.pyplot as plt
os.makedirs("figures", exist_ok=True)

tri = pd.read_csv("data/raw/Trinary_Optimizer__min-Var_.csv")
pivot = tri.pivot_table(index="a", columns="b", values="var")
plt.figure(figsize=(6,4)); plt.imshow(pivot.values, origin="lower", aspect="auto", cmap="viridis")
plt.colorbar(label="Var[ψ_w]"); plt.title("Trinary variance heatmap (a+b+c=0)")
plt.xlabel("b"); plt.ylabel("a"); plt.tight_layout()
plt.savefig("figures/trinary_variance_heatmap.png"); plt.close()

print("wrote figures/trinary_variance_heatmap.png")
