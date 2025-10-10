# Docker Test Environment - Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Docker Test Environment                      │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                        User Commands                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ./scripts/validate-docker-test.sh                              │
│         │                                                        │
│         ├─→ Check Docker installed                              │
│         ├─→ Check Docker Compose available                      │
│         ├─→ Validate docker-compose.yml syntax                  │
│         └─→ Verify all scripts exist                            │
│                                                                  │
│  docker compose run --rm tests                                  │
│         │                                                        │
│         └─→ Build image (if needed)                             │
│             └─→ Run scripts/docker-test.sh                      │
│                                                                  │
│  docker compose run --rm test-node                              │
│         │                                                        │
│         └─→ Run npm test only                                   │
│                                                                  │
│  docker compose run --rm test-python                            │
│         │                                                        │
│         └─→ Run pytest only                                     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    Docker Image Build Process                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Dockerfile (multi-stage build)                                 │
│  ├─ Stage 1: base                                               │
│  │  ├─ mcr.microsoft.com/devcontainers/python:3.11             │
│  │  ├─ Install Node.js 20 via NodeSource                        │
│  │  ├─ Install jq and build tools                               │
│  │  └─ Install Python packages from pyproject.toml              │
│  │                                                               │
│  ├─ Stage 2: webdeps                                            │
│  │  ├─ Copy package.json and lock files                         │
│  │  ├─ Set npm registry to public (https://registry.npmjs.org) │
│  │  └─ Install Node.js dependencies with --legacy-peer-deps    │
│  │                                                               │
│  └─ Stage 3: runtime                                            │
│     ├─ Copy all files                                           │
│     ├─ Install pytest and jsonschema                            │
│     ├─ Copy node_modules from webdeps stage                     │
│     └─ Run npm build (optional)                                 │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    Test Execution Flow                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  scripts/docker-test.sh                                         │
│  ├─ Set environment variables                                   │
│  │  ├─ APP_ENV=development                                      │
│  │  └─ CI=true                                                  │
│  │                                                               │
│  ├─ Validate environment                                        │
│  │  ├─ Check Node.js installed                                  │
│  │  └─ Check Python installed                                   │
│  │                                                               │
│  ├─ Run JavaScript tests                                        │
│  │  └─ npm test (Jest)                                          │
│  │                                                               │
│  ├─ Run Python tests                                            │
│  │  └─ pytest -q                                                │
│  │                                                               │
│  └─ Report summary                                              │
│     ├─ JavaScript exit code                                     │
│     ├─ Python exit code                                         │
│     └─ Overall status                                           │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    Docker Compose Services                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │    tests     │  │  test-node   │  │ test-python  │         │
│  ├──────────────┤  ├──────────────┤  ├──────────────┤         │
│  │ Runs both    │  │ Runs Jest    │  │ Runs pytest  │         │
│  │ Jest +       │  │ tests only   │  │ tests only   │         │
│  │ pytest       │  │              │  │              │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
│         │                  │                  │                 │
│         └──────────────────┴──────────────────┘                │
│                            │                                    │
│                  Same Docker image                              │
│              blackroad/prism-console:test                       │
│                                                                  │
│  All services mount current directory to /workspace            │
│  All services set CI=true environment variable                  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                        Key Features                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ✓ Isolated test environment                                    │
│  ✓ Reproducible across machines                                 │
│  ✓ Automatic fallback to public npm registry                    │
│  ✓ Support for legacy peer dependencies                         │
│  ✓ Three separate test services for flexibility                 │
│  ✓ Comprehensive validation and integration tests               │
│  ✓ Clear documentation and usage guides                         │
│  ✓ Compatible with CI/CD pipelines                              │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    Files Created/Modified                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Modified:                                                       │
│    ✓ Dockerfile               - Added npm registry fallback     │
│    ✓ docker-compose.yml       - Added three test services       │
│    ✓ README.md                - Added Docker testing section    │
│                                                                  │
│  Created:                                                        │
│    ✓ scripts/docker-test.sh            - Test runner           │
│    ✓ scripts/validate-docker-test.sh   - Setup validator       │
│    ✓ scripts/test-docker-integration.sh - Integration tests    │
│    ✓ DOCKER_TESTS.md                   - User guide            │
│    ✓ DOCKER_TEST_IMPLEMENTATION.md     - Implementation doc    │
│    ✓ DOCKER_TEST_ARCHITECTURE.md       - This file             │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Quick Start

1. Validate your setup:
   ```bash
   ./scripts/validate-docker-test.sh
   ```

2. Run all tests:
   ```bash
   docker compose run --rm tests
   ```

3. Run specific test suites:
   ```bash
   docker compose run --rm test-node    # JavaScript only
   docker compose run --rm test-python  # Python only
   ```

## Integration Testing

Run the integration test suite to verify everything is configured correctly:

```bash
./scripts/test-docker-integration.sh
```

Expected output: **24/24 tests passing**

## Documentation

- **DOCKER_TESTS.md** - Complete usage guide with examples
- **DOCKER_TEST_IMPLEMENTATION.md** - Implementation details and summary
- **README.md** - Quick start in main documentation
