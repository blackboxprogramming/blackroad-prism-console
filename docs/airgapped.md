# Air-Gapped Build and Install

This document describes how to build signed wheels and install the CLI in an offline environment.

## Build
```
python build/repro/compile_deps.py
python build/offline_wheels.py
bash build/signing/keygen.sh
python build/signing/sign_wheels.py
python build/signing/verify_wheels.py
python build/sbom.py
python build/licenses.py
python build/attest.py
```

## Install
```
bash install/offline_install.sh
```

## Uninstall
```
bash install/offline_uninstall.sh
```
