#!/usr/bin/env bash
# Integration test for Docker test environment
# This script simulates running tests in Docker without actually building the image
set -euo pipefail

echo "========================================="
echo "Docker Test Environment Integration Test"
echo "========================================="
echo ""

# Track test results
TESTS_PASSED=0
TESTS_FAILED=0

# Helper function to run a test
run_test() {
  local test_name="$1"
  local test_cmd="$2"
  
  echo -n "Testing: $test_name... "
  
  if eval "$test_cmd" > /dev/null 2>&1; then
    echo "✓ PASS"
    TESTS_PASSED=$((TESTS_PASSED + 1))
  else
    echo "✗ FAIL"
    TESTS_FAILED=$((TESTS_FAILED + 1))
  fi
}

# Test 1: Dockerfile exists and has correct structure
run_test "Dockerfile exists" "[ -f Dockerfile ]"
run_test "Dockerfile contains Node.js setup" "grep -q 'nodejs' Dockerfile"
run_test "Dockerfile contains Python setup" "grep -q 'python' Dockerfile"
run_test "Dockerfile contains npm registry config" "grep -q 'npm config set registry' Dockerfile"
run_test "Dockerfile contains pytest installation" "grep -q 'pytest' Dockerfile"

# Test 2: docker-compose.yml is properly configured
run_test "docker-compose.yml exists" "[ -f docker-compose.yml ]"
run_test "docker-compose.yml has tests service" "grep -q 'tests:' docker-compose.yml"
run_test "docker-compose.yml has test-node service" "grep -q 'test-node:' docker-compose.yml"
run_test "docker-compose.yml has test-python service" "grep -q 'test-python:' docker-compose.yml"
run_test "docker-compose.yml uses CI environment" "grep -q 'CI=true' docker-compose.yml"

# Test 3: Test scripts are present and executable
run_test "docker-test.sh exists" "[ -f scripts/docker-test.sh ]"
run_test "docker-test.sh is executable" "[ -x scripts/docker-test.sh ]"
run_test "validate-docker-test.sh exists" "[ -f scripts/validate-docker-test.sh ]"
run_test "validate-docker-test.sh is executable" "[ -x scripts/validate-docker-test.sh ]"

# Test 4: Test script content validation
run_test "docker-test.sh checks Node.js" "grep -q 'node --version' scripts/docker-test.sh"
run_test "docker-test.sh checks Python" "grep -q 'python3 --version' scripts/docker-test.sh"
run_test "docker-test.sh runs npm test" "grep -q 'npm test' scripts/docker-test.sh"
run_test "docker-test.sh runs pytest" "grep -q 'pytest' scripts/docker-test.sh"

# Test 5: Documentation is present
run_test "DOCKER_TESTS.md exists" "[ -f DOCKER_TESTS.md ]"
run_test "DOCKER_TESTS.md documents all services" "grep -q 'test-node' DOCKER_TESTS.md && grep -q 'test-python' DOCKER_TESTS.md"
run_test "README.md mentions Docker testing" "grep -q 'Docker' README.md"

# Test 6: Validate docker-compose syntax
if command -v docker &> /dev/null && docker compose version &> /dev/null; then
  run_test "docker-compose.yml has valid syntax" "docker compose config > /dev/null 2>&1"
else
  echo "⚠ Skipping docker-compose validation (Docker not available)"
fi

# Test 7: Verify package.json has test script
run_test "package.json exists" "[ -f package.json ]"
run_test "package.json has test script" "grep -q '\"test\"' package.json"

# Summary
echo ""
echo "========================================="
echo "Test Summary"
echo "========================================="
echo "Passed: $TESTS_PASSED"
echo "Failed: $TESTS_FAILED"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
  echo "✓ All integration tests passed!"
  echo ""
  echo "The Docker test environment is properly configured."
  echo "You can now run tests with:"
  echo "  docker compose run --rm tests"
  exit 0
else
  echo "✗ Some integration tests failed"
  echo ""
  echo "Please review the failed tests above."
  exit 1
fi
