# Running Tests in Docker

This repository includes Docker support for running tests in an isolated environment.

## Quick Start

### Validate Setup

First, validate your Docker test environment:

```bash
./scripts/validate-docker-test.sh
```

### Run All Tests

To run both JavaScript (Jest) and Python (pytest) tests in a Docker container:

```bash
docker compose run --rm tests
```

### Run Specific Test Suites

**JavaScript tests only:**
```bash
docker compose run --rm test-node
```

**Python tests only:**
```bash
docker compose run --rm test-python
```

## Docker Services

The `docker-compose.yml` file defines the following test services:

- **tests**: Runs both JavaScript and Python tests using `scripts/docker-test.sh`
- **test-node**: Runs only JavaScript/Jest tests
- **test-python**: Runs only Python/pytest tests

## Building the Test Image

The test services use the same Docker image as the development environment. To build it:

```bash
docker compose build tests
```

Or build explicitly:

```bash
docker build -t blackroad/prism-console:test .
```

## Environment Variables

The test services set the following environment variables:

- `CI=true`: Indicates tests are running in a CI environment
- `APP_ENV=development`: Sets the application environment to development mode

## Troubleshooting

### Registry Issues

If you encounter issues with the npm registry (e.g., `verdaccio.internal:4873` not found), the Dockerfile is configured to fall back to the public npm registry (`https://registry.npmjs.org/`).

### Node.js Not Found

Ensure the Docker image includes Node.js. The Dockerfile installs Node.js 20 via NodeSource in the base stage.

### Running Tests Locally

You can also run tests outside of Docker:

**JavaScript tests:**
```bash
npm test
```

**Python tests:**
```bash
pytest
```

**All tests:**
```bash
scripts/run_all_tests.sh
```

## Integration with CI/CD

The test setup is designed to work in GitHub Actions and other CI/CD systems. The `.github/workflows/ci.yml` file contains the CI configuration.

## Advanced Usage

### Interactive Testing

To get a bash shell in the test container:

```bash
docker compose run --rm tests bash
```

From there, you can run tests interactively:

```bash
npm test
pytest -v
pytest tests/specific_test.py
```

### Custom Test Arguments

Pass arguments to pytest:

```bash
docker compose run --rm tests bash -c "pytest -v -k test_specific"
```

### Debugging Failed Tests

For verbose output:

```bash
docker compose run --rm tests bash -c "npm test -- --verbose && pytest -vv"
```
