# Safety Policy Engine

The safety engine evaluates `BotResponse` objects against rule packs.
Enable packs via `config/safety.yaml` or override with CLI flags.
Violations return short codes like `SAF_NO_RISKS`.
The duty-of-care gate blocks orchestration when violations or missing approvals appear.
