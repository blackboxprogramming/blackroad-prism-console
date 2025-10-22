"""
Selector ablations + ACF contrasts.
Reads:
  data/raw/ISI_Even_Odd_Decomposition.csv
  data/raw/fig_acf_random.csv (optional precomputed)
  data/raw/fig_acf_ipow.csv   (optional)
"""
import os, numpy as np, pandas as pd, matplotlib.pyplot as plt
os.makedirs("figures", exist_ok=True)

# ISI selector comparison
sel = pd.read_csv("data/raw/ISI_Even_Odd_Decomposition.csv")
ax = sel.set_index("selector")["mse"].plot(kind="bar", figsize=(8,4))
ax.set_ylabel("ISI MSE"); ax.set_title("Selectors vs Base")
plt.tight_layout(); plt.savefig("figures/selectors_vs_base.png"); plt.close()

print("wrote figures/selectors_vs_base.png")
#!/usr/bin/env python
# coding: utf-8

# # Selector Tests & Autocorrelation
# 
# Selector ablations and ACF contrasts.

# In[ ]:


import pandas as pd
import matplotlib.pyplot as plt

# TODO: implement analysis
"""
Selector ablations + ACF contrasts.
Reads:
  data/raw/ISI_Even_Odd_Decomposition.csv
  data/raw/fig_acf_random.csv (optional precomputed)
  data/raw/fig_acf_ipow.csv   (optional)
"""
import os, numpy as np, pandas as pd, matplotlib.pyplot as plt
os.makedirs("figures", exist_ok=True)

# ISI selector comparison
sel = pd.read_csv("data/raw/ISI_Even_Odd_Decomposition.csv")
ax = sel.set_index("selector")["mse"].plot(kind="bar", figsize=(8,4))
ax.set_ylabel("ISI MSE"); ax.set_title("Selectors vs Base")
plt.tight_layout(); plt.savefig("figures/selectors_vs_base.png"); plt.close()

print("wrote figures/selectors_vs_base.png")
