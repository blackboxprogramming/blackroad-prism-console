"""
Generates Tap-Null vs Base ISI charts from shipped CSVs.
Reads:
  data/raw/Tap-Null_Pulse_ISI_Results.csv
  data/raw/4-ary_vs_8-ary__ISI_with_without_tap-null.csv
Writes PNGs to figures/.
"""
import pandas as pd, matplotlib.pyplot as plt, os
os.makedirs("figures", exist_ok=True)

def barplot(df, title, out):
    ax = df.plot(kind="bar", figsize=(8,4))
    ax.set_ylabel("ISI MSE")
    ax.set_title(title)
    plt.tight_layout(); plt.savefig(out); plt.close()

df1 = pd.read_csv("data/raw/Tap-Null_Pulse_ISI_Results.csv")
barplot(df1.set_index("label")[["base","tap_null"]],
        "Tap-Null vs Base (all codes)", "figures/tap_null_vs_base.png")

df2 = pd.read_csv("data/raw/4-ary_vs_8-ary__ISI_with_without_tap-null.csv")
barplot(df2.set_index("code")[["base","tap_null"]],
        "4-ary vs 8-ary (Tap-Null)", "figures/4ary_8ary_tapnull.png")
print("wrote figures/tap_null_vs_base.png, figures/4ary_8ary_tapnull.png")
#!/usr/bin/env python
# coding: utf-8

# # Tap-Null ISI
# 
# Regenerate Tap-Null vs base plots from raw data.

# In[ ]:


import pandas as pd
import matplotlib.pyplot as plt

# TODO: implement analysis
"""
Generates Tap-Null vs Base ISI charts from shipped CSVs.
Reads:
  data/raw/Tap-Null_Pulse_ISI_Results.csv
  data/raw/4-ary_vs_8-ary__ISI_with_without_tap-null.csv
Writes PNGs to figures/.
"""
import pandas as pd, matplotlib.pyplot as plt, os
os.makedirs("figures", exist_ok=True)

def barplot(df, title, out):
    ax = df.plot(kind="bar", figsize=(8,4))
    ax.set_ylabel("ISI MSE")
    ax.set_title(title)
    plt.tight_layout(); plt.savefig(out); plt.close()

df1 = pd.read_csv("data/raw/Tap-Null_Pulse_ISI_Results.csv")
barplot(df1.set_index("label")[["base","tap_null"]],
        "Tap-Null vs Base (all codes)", "figures/tap_null_vs_base.png")

df2 = pd.read_csv("data/raw/4-ary_vs_8-ary__ISI_with_without_tap-null.csv")
barplot(df2.set_index("code")[["base","tap_null"]],
        "4-ary vs 8-ary (Tap-Null)", "figures/4ary_8ary_tapnull.png")
print("wrote figures/tap_null_vs_base.png, figures/4ary_8ary_tapnull.png")
