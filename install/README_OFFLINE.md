# Offline Installation

1. Generate requirements and wheels:
   ```bash
   python build/repro/compile_deps.py
   python build/offline_wheels.py
   python build/signing/keygen.sh
   python build/signing/sign_wheels.py
   python build/signing/verify_wheels.py
   ```
2. Build SBOM and licenses:
   ```bash
   python build/sbom.py
   python build/licenses.py
   ```
3. Create attestation:
   ```bash
   python build/attest.py
   ```
4. Install offline:
   ```bash
   bash install/offline_install.sh
   ```
5. Uninstall:
   ```bash
   bash install/offline_uninstall.sh
   ```
