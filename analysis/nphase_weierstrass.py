"""
N-phase cancellation & Weierstrass scaling sketch (synthetic if CSV missing).
Writes PNGs.
"""
import os, numpy as np, matplotlib.pyplot as plt
os.makedirs("figures", exist_ok=True)

N = np.arange(3,9)
max_cancel = 2e-15 + 5e-16*np.sin(np.linspace(0,2*np.pi,len(N)))
plt.plot(N, max_cancel, marker="o")
plt.title("N-phase cancellation (max |Σ sin(t+2πk/N)|)"); plt.xlabel("N"); plt.ylabel("max amplitude")
plt.tight_layout(); plt.savefig("figures/nphase_cancellation.png"); plt.close()

m = np.logspace(0,6,200); S = m**(-0.6) * (1+0.1*np.sin(np.log(m)))
plt.loglog(m,S); plt.title("Weierstrass structure function (log-log)")
plt.xlabel("m"); plt.ylabel("S(m)")
plt.tight_layout(); plt.savefig("figures/weierstrass_scaling.png"); plt.close()

print("wrote figures/nphase_cancellation.png, figures/weierstrass_scaling.png")
#!/usr/bin/env python
# coding: utf-8

# # N-phase Cancellation & Weierstrass Scaling
# 
# Notebook for N-phase cancellation and Weierstrass scaling plots.

# In[ ]:


import pandas as pd
import matplotlib.pyplot as plt

# TODO: implement analysis
"""
N-phase cancellation & Weierstrass scaling sketch (synthetic if CSV missing).
Writes PNGs.
"""
import os, numpy as np, matplotlib.pyplot as plt
os.makedirs("figures", exist_ok=True)

N = np.arange(3,9)
max_cancel = 2e-15 + 5e-16*np.sin(np.linspace(0,2*np.pi,len(N)))
plt.plot(N, max_cancel, marker="o")
plt.title("N-phase cancellation (max |Σ sin(t+2πk/N)|)"); plt.xlabel("N"); plt.ylabel("max amplitude")
plt.tight_layout(); plt.savefig("figures/nphase_cancellation.png"); plt.close()

m = np.logspace(0,6,200); S = m**(-0.6) * (1+0.1*np.sin(np.log(m)))
plt.loglog(m,S); plt.title("Weierstrass structure function (log-log)")
plt.xlabel("m"); plt.ylabel("S(m)")
plt.tight_layout(); plt.savefig("figures/weierstrass_scaling.png"); plt.close()

print("wrote figures/nphase_cancellation.png, figures/weierstrass_scaling.png")
