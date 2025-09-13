# Security Artifacts

The build process produces signed wheels, a checksum file, SBOM, license report and an attestation.

* **Signed wheels** – each wheel in `dist/wheels` has a detached GPG signature and is listed in `SHA256SUMS`.
* **SBOM** – `dist/SBOM.spdx.json` enumerates packages, versions and hashes.
* **License report** – `dist/LICENSES.md` lists package licenses and enforces `config/license_policy.yaml`.
* **Attestation** – `dist/attestation.json` records commit, environment summary and hashes; `attestation.json.asc` is its signature.

Verification commands:
```
python build/signing/verify_wheels.py
python build/sbom.py
python build/licenses.py
python build/attest.py && gpg --verify dist/attestation.json.asc dist/attestation.json
```
