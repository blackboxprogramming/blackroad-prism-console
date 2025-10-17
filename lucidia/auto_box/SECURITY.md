SECURITY.md (Lucidia / Auto-Box v0)

Fingerprint: 23064887b1469b19fa562e8afdee5e9046bedf99aa9cd7142c35e38f91e6fef2
Codex Reference: 2 — The Circle

Threat Model
• External attackers: try to exfiltrate user data (items/boxes), tamper with classification, or hijack accounts.
• Insiders: devs/admins misusing access to view or alter user data.
• Model risks: opaque classifications, data leakage from training, adversarial input.
• Infrastructure risks: lost keys, misconfigured storage, dependency exploits.

Controls (v0)
1. Zero trust: all API calls require scoped tokens; no implicit trust across services.
2. Encryption:
   • Data at rest = AES-256 (per-owner key).
   • Data in transit = TLS 1.3+.
   • PQC toggle path reserved (see /config/crypto).
3. Identity & auth:
   • MFA for admin/ops.
   • Per-owner keys for data.
   • No shared root accounts.
4. Consent receipts: every classification request logged with explicit purpose/scope.
5. Explainability: no classification stored without rationale string.
6. Ephemerality: if storage isn’t needed, don’t persist.
7. Backups: encrypted, immutable, tested monthly; 3-2-1 rule.
8. Audit logs: owner-visible + tamper-evident append-only (hash-chained).
9. Dependencies: pinned versions + automated vulnerability scans (CI).
10. Incident fallback:
    • Read-only mode available.
    • One-click purge kills all owner data + keys.

Developer Practices
• Commit footer includes Lucidia seed + codex reference.
• No secrets in code; use vaults/keystores.
• Threat model updated with every new feature.
• Two-person rule for production key rotation.
