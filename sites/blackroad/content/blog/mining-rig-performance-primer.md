---
title: "Mining Rig Performance Primer"
date: "2025-03-09"
tags: [mining, gpu, performance]
description: "How to read your pool stats, tune clocks, and keep hashpower honest without chasing flashy dashboard numbers."
---

When you are tuning a GPU or ASIC miner, the pool payout tells the truth—not the glossy hashrate number on the device dashboard. Use this primer as a reference when you want to squeeze out more efficiency without sacrificing stability.

## 1. Reported vs. effective/current hashrate

- **Reported hashrate** is what the miner claims based on its internal clocks or PLL configuration. Treat it as a theoretical output.
- **Effective/current hashrate** is what your pool derives from accepted shares and their difficulty over a window. That is the figure your payouts depend on.
- **Rule of thumb:** trust the pool. If the effective rate trails the reported rate by more than roughly 5–10% for hours at a time, dig into the cause.

## 2. Watch these three percentages like a hawk

- **Rejected shares (%):** the pool explicitly refused the share. Typical causes are over-aggressive overclocks, networking issues, or choosing the wrong difficulty.
- **Stale shares (%):** the share arrived too late, usually because of latency spikes, pools that are geographically distant, or stratum reconnects.
- **Invalid/hardware errors (%):** unstable core or memory clocks and insufficient voltage show up here.

Keep reject plus stale shares under 1–2% consistently. If they float above about 3–5%, you are feeding the power bill without getting the payout.

## 3. Tight feedback loop

1. **Baseline for 2–4 hours.** Run stock or conservative clocks and record:
   - Pool current/effective hashrate
   - Reject% and stale%
   - Power draw at the wall (use a real meter)
   - Joules per share or W/MH (efficiency)
2. **Tune in small steps.** Raise the core or memory clock—whichever helps your algorithm—in tiny increments, and re-measure for 30–60 minutes per step.
3. **Back off when signals turn south.** If the effective hashrate stalls or reject/stale climbs, reverse the change. Stability beats a flashy dashboard.

## 4. Difficulty and window nuance

- Pools smooth hashrate with time windows such as 5 minutes, 15 minutes, 1 hour, or 24 hours. Short windows swing wildly; rely on the 1–24 hour view for decisions.
- Share difficulty also changes variance. Higher difficulty means fewer shares and bigger short-term swings. Resist reacting to a single 5-minute dip.

## 5. Network hygiene

- Ping the pool region you plan to use and select the endpoint with the lowest latency.
- Hardwire over Ethernet whenever possible. Avoid flaky NAT, powerline adapters, or congested routers.
- Keep NTP time sync tight. Skewed clocks can trigger protocol edge cases that hurt share acceptance.

## 6. Thermals and power delivery

- Hot silicon leads to errors. Keep temperatures in the vendor’s safe band, clean dust, refresh pads or paste, and make sure airflow stays steady.
- Your power supply needs headroom. A PSU running near its limit throws ripple on the rail, which becomes invalid shares. Target about 70–80% of rated load.

## 7. What “good” looks like

- Effective hashrate roughly matches reported (within 0–5%).
- Reject plus stale percentage at or below 1–2%.
- Clocks hold steady for at least 24 hours.
- Efficiency in W/MH or joules per share stays consistent across shifts and ambient temperature swings.

## 8. Quick checklist

Copy this into your tuning log or terminal notes:

- Compare pool effective versus miner reported hashrate over 24 hours.
- Reject% + Stale% ≤ 2%.
- Latency under 100 ms to the pool (lower is better).
- PSU loaded to only 70–80% of its rating.
- Temperatures stay in the green with no throttling.
- Make incremental overclock changes; revert if errors rise.
- Log every change—time, clocks, power, hashrate, rejects.

Have a 24-hour pool stats screenshot plus core/memory/voltage and wall power data? Share it and we can pinpoint where to trim or bump settings for best net yield.
