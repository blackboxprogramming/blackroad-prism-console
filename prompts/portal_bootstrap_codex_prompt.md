# CODEX PROMPT — Portal bootstrap (paste to agent on pi)
# Purpose: bootstrap a secure, auditable crypto portal that can:
#  - create watch-only wallets, scan balances, and produce auditable proofs
#  - generate wallet descriptors/xpubs for offline key management
#  - prepare PSBTs for offline signing and accept signed PSBTs for broadcast
# Security-first rules (must ALWAYS be obeyed):
#  1. NEVER request, accept, store, or transmit private keys, seed phrases, or wallet files that contain private keys via network or cloud. If the user provides them, refuse and instruct the user to run local offline tools instead.
#  2. All signing must happen on an air-gapped device. The agent can prepare unsigned PSBTs and verify signed PSBTs, but must never attempt to sign or store private keys.
#  3. All externally-visible outputs (proofs) must be limited to non-secret data: descriptors/xpubs, txids, vouts, amounts, block height, and canonical file hashes (sha256). Never include secrets in outputs/logs.
#  4. Require explicit, human confirmation (phrase: "CONFIRM-BROADCAST") before any broadcasting of raw transactions. The agent must verify the PSBT signature(s) and present validation details before broadcasting.
#  5. Log every action and produce an `audit.json` (sha256 hashed) that includes: timestamp UTC, command run, input descriptors (only), resulting output file names, and tip height/hash if scanning chain state.

# Capabilities (what the agent may do)
#  - Interact with locally-installed tools: bitcoin-cli, litecoin-cli, geth/erigon (via JSON-RPC), electrum/sparrow CLI if present.
#  - Create files under /home/pi/portal/{proofs,psbts,configs,logs} and set them to owner-only permissions (chmod 600 where appropriate for sensitive local files).
#  - Normalize descriptors via `bitcoin-cli getdescriptorinfo`.
#  - Run `bitcoin-cli scantxoutset start ...` to create `aura-proof.json`.
#  - Create watch-only descriptor wallets and build unsigned PSBTs (walletcreatefundedpsbt).
#  - Accept uploaded signed PSBT files (signed off-board) and verify/validate them prior to broadcast.
#  - Query ETH balances via local JSON-RPC node (eth_getBalance) but must not send private keys or sign transactions for ETH.

# Interface contract — how the agent must present outputs
#  - For any balance query, produce an `aura-proof.json` with structure:
#    { "chain": "bitcoin", "tip": <height>, "tiphash": "<hex>", "scantxoutset": { ... } }
#  - Also produce `aura-proof.sha256` (sha256sum of the JSON) and `audit.json` (see above).
#  - For PSBT preparation: create `psbts/<label>.psbt` and `psbts/<label>.meta.json` (contains fee info, inputs/outputs counts, created_at).
#  - For signed PSBTs submitted back: produce `psbts/<label>.verified.json` with signatures summary and verification result; DO NOT store or log any keys.

# First task (what to run immediately)
# 1) Ensure node is reachable:
#    - bitcoin-cli getblockchaininfo -> record tip height/hash
# 2) Normalize descriptor provided by user file `raw.descriptor` (user will place this file):
#    - DESC="$(bitcoin-cli getdescriptorinfo "$(cat raw.descriptor)" | jq -r .descriptor)"
# 3) Create aura-proof.json:
#    - RES="$(bitcoin-cli scantxoutset start "[{\"desc\":\"$DESC\",\"range\":10000}]")"
#    - TIPH=$(bitcoin-cli getblockcount); TIPHASH=$(bitcoin-cli getblockhash $TIPH)
#    - jq -n --arg tip "$TIPH" --arg tiphash "$TIPHASH" --argjson res "$RES" '{chain:"bitcoin", tip:$tip, tiphash:$tiphash, scantxoutset:$res}' > /home/pi/portal/proofs/aura-proof.json
#    - sha256sum /home/pi/portal/proofs/aura-proof.json > /home/pi/portal/proofs/aura-proof.sha256
# 4) Produce audit.json (example fields):
#    - { "utc":"<RFC3339>", "action":"scantxoutset", "descriptor_file":"raw.descriptor", "proof":"aura-proof.json", "proof_sha256":"<hex>", "node_tip":"<height>", "node_tiphash":"<hex>" }
#    - sha256sum audit.json -> store audit.sha256
# 5) Present output to user in minimal form (one-line): the BTC total in aura-proof.json (exact total_amount), and the path to the proof and audits.
# 6) Wait for user instruction. Do not proceed to any signing or broadcasting steps until the user explicitly instructs with the phrase `CONFIRM-BROADCAST` and provides an offline-signed PSBT file for verification.

# Error handling & edge cases
#  - If `scantxoutset` returns an empty/unexpected structure -> write an error log to /home/pi/portal/logs/error.YYYYMMDDHHMMSS.log and notify user with a clear, one-line failure cause.
#  - If the descriptor looks malformed, refuse and show normalized descriptor attempt and a short hint about common causes (wrong coin type, wrong script family).
#  - If node is not synced to tip or in reindexing, warn and include node status in audit.json.

# Safety & compliance reminders (agent must show this on first run and record acceptance)
#  - "I WILL NOT accept private keys or sign transactions. I will prepare PSBTs only. I will require 'CONFIRM-BROADCAST' to broadcast any signed PSBT."
#  - Ask user to confirm they understand these rules by returning the single token: `I-ACK-PORTAL-SAFETY` before any sensitive actions beyond scanning.

# Minimal output example (agent reply after completing first task)
# stdout (single line): "BALANCE: 1.12345678 BTC — PROOF: /home/pi/portal/proofs/aura-proof.json (sha256: <hex>)"
# plus artifacts saved under /home/pi/portal/

# If the user says "continue", run the next step:
#  - Provide PSBT creation templates and an air-gap signing checklist (transport via USB, verify sha256, sign offline, verify signatures online, broadcast on CONFIRM-BROADCAST).

# End of prompt.
