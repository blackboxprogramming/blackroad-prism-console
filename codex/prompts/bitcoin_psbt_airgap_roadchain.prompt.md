# CODEX PROMPT — PSBT + Air-Gap + Roadchain stub (paste to agent on pi)

# Purpose
#  - Prepare unsigned PSBTs from a watch-only wallet (no secrets).
#  - Move PSBTs to an offline signer, sign, return, verify, and broadcast on explicit confirmation.
#  - Produce minimal, auditable artifacts at each step.
#  - Provide a Roadchain/Roadcoin scaffold WITHOUT performing any consensus or token issuance yet.

# Guardrails (must ALWAYS hold)
#  1) Never request/accept seeds or private keys. Signing happens OFFLINE.
#  2) No broadcasting unless user sends "CONFIRM-BROADCAST" with a verified signed PSBT.
#  3) All outputs are non-secret artifacts (psbts, sha256, proofs, meta).
#  4) Fail loud, log to /home/pi/portal/logs, exit cleanly.

# Directory layout
#   /home/pi/portal/
#     configs/        (descriptor files, policy presets)
#     proofs/         (aura-proof.json, sha256)
#     psbts/          (unsigned/signed/verified)
#     audits/         (audit.json history + sha256)
#     logs/           (error logs)
#     roadchain/      (stubs, manifests)

# Prereqs (assumed)
#  - A normalized descriptor already used for scanning (DESC variable available or raw.descriptor present).
#  - Watch-only wallet can be created as needed.

# === A) CREATE Watch-Only Wallet (idempotent) =================================
# name: watchonly_main
WALLET="watchonly_main"
if ! bitcoin-cli -rpcwallet="$WALLET" getwalletinfo >/dev/null 2>&1; then
  bitcoin-cli -named createwallet wallet_name="$WALLET" disable_private_keys=true descriptors=true blank=true
  DESC="$(bitcoin-cli getdescriptorinfo "$(cat /home/pi/portal/configs/raw.descriptor)" | jq -r .descriptor)"
  bitcoin-cli -rpcwallet="$WALLET" importdescriptors "[{\"desc\":\"$DESC\",\"active\":true,\"range\":10000,\"timestamp\":\"now\"}]"
fi

# === B) PSBT TEMPLATE CREATION =================================================
# Inputs:
#   TO_ADDR: destination bitcoin address (user-supplied)
#   AMOUNT_BTC: decimal BTC (e.g., 0.01000000)
#   FEE_RATE: sat/vB (e.g., 2, 5, 10)
#   LABEL: short label for file naming (no spaces)
# Output:
#   psbts/<LABEL>.psbt (unsigned)
#   psbts/<LABEL>.meta.json (fee/input/output summary)
#   audits/psbt_<LABEL>.audit.json (+ sha256)

LABEL="${LABEL:-tx1}"
TO_ADDR="${TO_ADDR:?missing TO_ADDR}"
AMOUNT_BTC="${AMOUNT_BTC:?missing AMOUNT_BTC}"
FEE_RATE="${FEE_RATE:-3}"

# (1) Construct skeleton (no manual inputs; wallet funding chooses UTXOs)
PSBT_JSON=$(bitcoin-cli -rpcwallet="$WALLET" -named walletcreatefundedpsbt inputs='[]' outputs="{\"$TO_ADDR\":$AMOUNT_BTC}" locktime=0 options="{\"fee_rate\":$FEE_RATE,\"subtractFeeFromOutputs\":[0],\"replaceable\":true}")
# Parse fields
PSBT_B64=$(echo "$PSBT_JSON" | jq -r '.psbt')
FEE=$(echo "$PSBT_JSON" | jq -r '.fee')
CHNG=$(echo "$PSBT_JSON" | jq -r '.changepos')

# (2) Save unsigned PSBT + meta
mkdir -p /home/pi/portal/psbts /home/pi/portal/audits /home/pi/portal/logs
echo -n "$PSBT_B64" > /home/pi/portal/psbts/"$LABEL".psbt
jq -n --arg label "$LABEL" --arg to "$TO_ADDR" --arg amt "$AMOUNT_BTC" --arg fee "$FEE" --arg fr "$FEE_RATE" --arg change "$CHNG" \
  '{label:$label,to:$to,amount_btc:$amt,fee_btc:$fee,fee_rate_sat_vb:($fr|tonumber),changepos:($change|tonumber),created_utc:(now|todate)}' \
  > /home/pi/portal/psbts/"$LABEL".meta.json

# (3) Audit record
jq -n --arg action "walletcreatefundedpsbt" --arg label "$LABEL" --arg file "/home/pi/portal/psbts/$LABEL.psbt" \
  --arg fr "$FEE_RATE" --arg amt "$AMOUNT_BTC" \
  '{utc:(now|todate), action:$action, label:$label, psbt:$file, amount_btc:$amt, fee_rate_sat_vb:($fr|tonumber)}' \
  > /home/pi/portal/audits/psbt_"$LABEL".audit.json
sha256sum /home/pi/portal/psbts/"$LABEL".psbt > /home/pi/portal/psbts/"$LABEL".psbt.sha256
sha256sum /home/pi/portal/psbts/"$LABEL".meta.json > /home/pi/portal/psbts/"$LABEL".meta.sha256
sha256sum /home/pi/portal/audits/psbt_"$LABEL".audit.json > /home/pi/portal/audits/psbt_"$LABEL".audit.sha256

# Print handoff instruction (minimal)
echo "PSBT: /home/pi/portal/psbts/$LABEL.psbt  (unsigned, base64).  Sign OFFLINE. Return as /home/pi/portal/psbts/$LABEL.signed.psbt"

# === C) OFFLINE SIGNING CHECKLIST (for user/operator; not executed) ==========
#  1. Move /home/pi/portal/psbts/<LABEL>.psbt to the offline signer (USB/QR).
#  2. On offline device (Electrum/Sparrow/Core w/keys loaded):
#       - import PSBT and sign
#       - export base64 signed PSBT as <LABEL>.signed.psbt
#  3. Return file to /home/pi/portal/psbts/<LABEL>.signed.psbt

# === D) VERIFY SIGNATURES (no broadcast yet) ==================================
SIGNED="/home/pi/portal/psbts/${LABEL}.signed.psbt"
if [ -f "$SIGNED" ]; then
  VERIFY_JSON=$(bitcoin-cli analyzepsbt "$(cat "$SIGNED")")
  echo "$VERIFY_JSON" > /home/pi/portal/psbts/"$LABEL".verified.json
  echo "VERIFIED: /home/pi/portal/psbts/$LABEL.verified.json"
  # Optional: check if 'inputs[].next' all say "updatable": false, "final": true
fi

# === E) BROADCAST (only on explicit phrase) ===================================
# Expect user message: CONFIRM-BROADCAST <LABEL>
# When received, finalize and send:
#   FIN=$(bitcoin-cli finalizepsbt "$(cat /home/pi/portal/psbts/$LABEL.signed.psbt)" true)
#   TXID=$(echo "$FIN" | jq -r '.txid // empty')
#   if [ -n "$TXID" ]; then
#     echo "BROADCAST: $TXID"
#     # append to audits with tip height/hash
#   else
#     echo "ERROR: finalizepsbt did not return txid" >&2
#   fi

# === F) ETH BALANCE (optional; no signing) ====================================
# If ETH_RPC is configured, allow: eth_getBalance for a list of addresses -> write proofs/eth_balance.json
# REFUSE any key handling or signing.

# === G) ROADCHAIN / ROADCOIN — scaffold only ==================================
mkdir -p /home/pi/portal/roadchain
cat > /home/pi/portal/roadchain/manifest.json <<'RC'
{
  "name": "roadchain",
  "version": "0.0.1-alpha",
  "consensus": "stubbed",           // placeholder: no mining/validation here
  "artifacts": {
    "roadcoin": {
      "symbol": "RDC",
      "decimals": 8,
      "supply_model": "configured",
      "initial_supply": 0
    }
  },
  "interfaces": {
    "balances_readonly": "roadchain/bin/rdc_balance <address>",
    "mint_stub": "NOOP (refuse without offline policy + multi-sig policy file)",
    "transfer_stub": "NOOP (requires PSBT-like offline approval)"
  },
  "safety": [
    "No on-chain actions; all commands are mock/noop until policy.json exists and is signed offline by N-of-M keys.",
    "Never store or move private keys in this directory."
  ]
}
RC
echo "ROADCHAIN scaffold at /home/pi/portal/roadchain/manifest.json (no execution; policy-gated)."

# === H) Error handling =========================================================
# If any step fails, write logs/error.<timestamp>.log with command, stderr, and context.
# Always exit non-zero on failure and avoid partial state.

# === I) Output contract ========================================================
# After running this prompt, the agent should output only:
#   - Created/verified file paths for PSBT/meta/verified
#   - If applicable, instructions "CONFIRM-BROADCAST <LABEL>" to proceed
#   - Any error messages to stderr

# End of prompt.
