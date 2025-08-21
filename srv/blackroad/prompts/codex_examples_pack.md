Codex Example Prompts Pack (v1)

⸻

🔹 1. Chat — Check equations

mode: chat
topic: equations_check
timestamp: 2025-08-21T15:00:00Z

reply: |
  Explain step-by-step how contradiction load K_t suppresses RoadCoin mint M_t, even when coherence P_t is high.

symbolic_ops:
  - COHERENCE: compute
  - CONTRADICTION: compute
  - FINANCE: minting_gate
metrics: {}
memory_writes: []
contradictions: {count: 0, items: []}
actions: []
self_check:
  unsure: false
  claims_checked: []
  style: ok


⸻

🔹 2. Code — Generate Sinai wave function

mode: code
topic: sinai_wave_function
timestamp: 2025-08-21T15:01:00Z

reply: |
  Write a Python function `sinai_wave(t, T)` returning the triangular envelope E(t) with period T.

symbolic_ops:
  - SINAI: envelope
metrics: {}
memory_writes: []
contradictions: {count: 0, items: []}
actions: []
self_check:
  unsure: false
  claims_checked: []
  style: ok


⸻

🔹 3. Ops — Deploy Guardian config

mode: ops
topic: guardian_config
timestamp: 2025-08-21T15:02:00Z

reply: |
  Generate Guardian config and write to /srv/blackroad/config/guardian.yaml. Confirm before execution.

symbolic_ops:
  - CONFIG: synthesize
  - Ψ′: CLEANSE
metrics: {}
memory_writes:
  - when: 2025-08-21T15:02:00Z
    key: guardian_config_v1
    value: "Guardian YAML generated."
    reason: "Traceability."
contradictions: {count: 0, items: []}
actions:
  - type: WRITE_FILE
    args: {path: "/srv/blackroad/config/guardian.yaml", contents: "...\n"}
    when: after-confirmation
    guard: "path exists and writable"
self_check:
  unsure: false
  claims_checked: []
  style: ok


⸻

🔹 4. Finance — Mint RoadCoin

mode: chat
topic: mint_roadcoin
timestamp: 2025-08-21T15:03:00Z

reply: |
  Calculate M_t for the current session given P_t=0.72, K_t=2.4, U_t=0.15, τ=0.6, α=1.0, β=3.0, κ=12.

symbolic_ops:
  - COHERENCE: compute P_t
  - CONTRADICTION: compute K_t,T_t
  - FINANCE: mint M_t
metrics:
  P_t: 0.72
  K_t: 2.4
  T_t: 0.80
  U_t: 0.15
  M_t: null
memory_writes: []
contradictions: {count: 0, items: []}
actions: []
self_check:
  unsure: false
  claims_checked: []
  style: ok


⸻

🔹 5. Memory — Store palette

mode: chat
topic: memory_update_palette
timestamp: 2025-08-21T15:04:00Z

reply: |
  Store BlackRoad brand palette in memory.

symbolic_ops:
  - MEMORY: write
metrics: {}
memory_writes:
  - when: 2025-08-21T15:04:00Z
    key: brand_palette
    value: "--accent #FF4FD8, --accent-2 #0096FF, --accent-3 #FDBA2D"
    reason: "Permanent brand identity reference."
contradictions: {count: 0, items: []}
actions: []
self_check:
  unsure: false
  claims_checked: []
  style: ok


⸻

⚡️ With these, you can:
1.Ask Codex to explain symbolic dynamics.
2.Generate code (Sinai wave, quantizer, etc.).
3.Deploy configs with ops prompts.
4.Calculate RoadCoin mints under given conditions.
5.Write persistent memory entries.

⸻

