#!/usr/bin/env bash
# Integration test for autopal environment access endpoints

set -euo pipefail

BASE_URL="${AUTOPAL_URL:-http://localhost:8080}"

echo "Testing Autopal Environment Access Endpoints"
echo "=============================================="
echo ""

# Test health check
echo "1. Health check..."
response=$(curl -s "${BASE_URL}/health/live")
if echo "$response" | jq -e '.status == "live"' > /dev/null; then
    echo "✓ Service is live"
else
    echo "✗ Health check failed"
    exit 1
fi

# Test environment request
echo ""
echo "2. Creating environment access request..."
response=$(curl -s -X POST "${BASE_URL}/environments/request" \
    -H 'Content-Type: application/json' \
    -d '{
        "environment_name": "production",
        "requested_by": "alice",
        "purpose": "Deploy critical hotfix for payment processing",
        "duration_minutes": 120
    }')
echo "$response" | jq .
request_id=$(echo "$response" | jq -r .request_id)

if [ -z "$request_id" ] || [ "$request_id" == "null" ]; then
    echo "✗ Failed to create request"
    exit 1
fi
echo "✓ Request created with ID: $request_id"

# Verify request is pending
if echo "$response" | jq -e '.approved_by == null' > /dev/null; then
    echo "✓ Request is pending approval"
else
    echo "✗ Request should be pending"
    exit 1
fi

# Test self-approval rejection
echo ""
echo "3. Testing self-approval rejection..."
response=$(curl -s -X POST "${BASE_URL}/environments/${request_id}/approve" \
    -H 'Content-Type: application/json' \
    -d '{"approved_by": "alice"}')
if echo "$response" | jq -e '.detail' | grep -q "differ from requester"; then
    echo "✓ Self-approval correctly rejected"
else
    echo "✗ Self-approval should have been rejected"
    echo "$response" | jq .
    exit 1
fi

# Test approval by different user
echo ""
echo "4. Approving request with different user..."
response=$(curl -s -X POST "${BASE_URL}/environments/${request_id}/approve" \
    -H 'Content-Type: application/json' \
    -d '{"approved_by": "bob"}')
echo "$response" | jq .

if echo "$response" | jq -e '.approved_by == "bob"' > /dev/null; then
    echo "✓ Request approved by bob"
else
    echo "✗ Approval failed"
    exit 1
fi

if echo "$response" | jq -e '.granted_at != null' > /dev/null; then
    echo "✓ Access granted timestamp recorded"
else
    echo "✗ Missing granted_at timestamp"
    exit 1
fi

if echo "$response" | jq -e '.expires_at != null' > /dev/null; then
    echo "✓ Access expiration timestamp recorded"
else
    echo "✗ Missing expires_at timestamp"
    exit 1
fi

# Test status check
echo ""
echo "5. Checking request status..."
response=$(curl -s "${BASE_URL}/environments/${request_id}")
echo "$response" | jq .

if echo "$response" | jq -e '.request_id == "'$request_id'"' > /dev/null; then
    echo "✓ Status retrieved successfully"
else
    echo "✗ Failed to get status"
    exit 1
fi

# Test double approval rejection
echo ""
echo "6. Testing double-approval rejection..."
response=$(curl -s -X POST "${BASE_URL}/environments/${request_id}/approve" \
    -H 'Content-Type: application/json' \
    -d '{"approved_by": "charlie"}')
if echo "$response" | jq -e '.detail' | grep -q "already approved"; then
    echo "✓ Double-approval correctly rejected"
else
    echo "✗ Double-approval should have been rejected"
    echo "$response" | jq .
    exit 1
fi

echo ""
echo "=============================================="
echo "✅ All integration tests passed!"
