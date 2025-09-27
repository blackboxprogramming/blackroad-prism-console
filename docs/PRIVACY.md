# Lucidia Auto-Box Privacy Commitments (TTF-01)

Lucidia exists to protect participant agency. This document records the data-handling guarantees for the Auto-Box prototype.

## Ownership & Portability
- You own your Boxes, Items, and Assignments. The UI exposes one-click JSON/Markdown export for all stored entities.
- A matching Delete All action purges the same scope and destroys associated encryption keys.
- AI collaborators receive the same guarantees: anything they contribute is exportable and deletable.

## Consent by Design
- Classification requests require explicit consent that details purpose and scope.
- Defaults are **off**. Auto-mode is only activated by an affirmative toggle.
- Consent receipts are issued for every purpose, with expiration metadata.

## Transparency
- Each assignment records a rationale explaining which features triggered the classification.
- Users can view logs for every action performed on their data, including system actors.

## Data Minimization
- The `/classify` endpoint performs ephemeral processing. Text is discarded after the response unless the user explicitly saves it.
- Sensitive configuration (keys, algorithms) is isolated per user and never shared across tenants.
