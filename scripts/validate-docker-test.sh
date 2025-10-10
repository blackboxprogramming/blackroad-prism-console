#!/usr/bin/env bash
# Validate the Docker test environment setup
set -euo pipefail

echo "========================================="
echo "Docker Test Environment Validator"
echo "========================================="
echo ""

# Check Docker is installed
if ! command -v docker &> /dev/null; then
  echo "✗ Docker is not installed"
  echo "  Install Docker: https://docs.docker.com/get-docker/"
  exit 1
fi
echo "✓ Docker is installed: $(docker --version)"

# Check Docker Compose is available
if docker compose version &> /dev/null; then
  echo "✓ Docker Compose is available: $(docker compose version --short)"
elif command -v docker-compose &> /dev/null; then
  echo "✓ Docker Compose is available: $(docker-compose --version)"
else
  echo "✗ Docker Compose is not installed"
  echo "  Install Docker Compose: https://docs.docker.com/compose/install/"
  exit 1
fi

# Validate docker-compose.yml
echo ""
echo "Validating docker-compose.yml..."
if docker compose config > /dev/null 2>&1; then
  echo "✓ docker-compose.yml is valid"
else
  echo "✗ docker-compose.yml has syntax errors"
  docker compose config
  exit 1
fi

# Check Dockerfile exists
if [ -f Dockerfile ]; then
  echo "✓ Dockerfile found"
else
  echo "✗ Dockerfile not found"
  exit 1
fi

# Check test script exists
if [ -f scripts/docker-test.sh ]; then
  echo "✓ Test script (scripts/docker-test.sh) found"
  if [ -x scripts/docker-test.sh ]; then
    echo "✓ Test script is executable"
  else
    echo "⚠ Test script is not executable (will be fixed)"
    chmod +x scripts/docker-test.sh
  fi
else
  echo "✗ Test script (scripts/docker-test.sh) not found"
  exit 1
fi

# Show available test services
echo ""
echo "Available test services:"
echo "  - tests:       Run all tests (Jest + pytest)"
echo "  - test-node:   Run JavaScript/Jest tests only"
echo "  - test-python: Run Python/pytest tests only"
echo ""

echo "========================================="
echo "✓ Docker test environment is ready!"
echo "========================================="
echo ""
echo "To run tests, use:"
echo "  docker compose run --rm tests"
echo ""
echo "For more information, see DOCKER_TESTS.md"
