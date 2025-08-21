"""Tiny client that streams a sine through the Lucidia Sine Service and plots metrics."""
import math
import time
import requests
import numpy as np
import matplotlib.pyplot as plt

SERVICE_URL = "http://localhost:8707"


def main():
    dt = 0.01
    T = 2.0
    n = int(T / dt)
    t = np.arange(n) * dt

    # Simple 1-D sine input
    freq = 3.0  # Hz equivalent (since service expects rad/s we convert inside)
    x = np.sin(2 * math.pi * freq * t)

    F_vals, L_vals, Phi_vals = [], [], []

    for xi in x:
        resp = requests.post(f"{SERVICE_URL}/update", json={"x": [xi, 0, 0, 0]})
        resp.raise_for_status()
        data = resp.json()
        F_vals.append(data["F_t"])
        L_vals.append(data["L_t"])
        Phi_vals.append(data["Phi_spec"])
        time.sleep(dt)

    plt.plot(t, F_vals, label="F_t")
    plt.plot(t, L_vals, label="L_t")
    plt.plot(t, Phi_vals, label="Phi_spec")
    plt.legend()
    plt.xlabel("Time (s)")
    plt.title("Lucidia Sine Service Metrics")
    plt.show()


if __name__ == "__main__":
    main()
