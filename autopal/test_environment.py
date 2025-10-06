#!/usr/bin/env python3
"""
Quick smoke test for the environment access endpoints.
"""
import asyncio
import sys
from pathlib import Path

# Add the autopal app directory to the path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.environment_control import EnvironmentRegistry, EnvironmentControlError


async def test_environment_access_flow():
    """Test the basic environment access request and approval flow."""
    
    registry = EnvironmentRegistry(request_timeout_seconds=900)
    
    # Test 1: Create a request
    print("Test 1: Creating environment access request...")
    record = await registry.request(
        environment_name="production",
        requested_by="alice",
        purpose="Deploy hotfix",
        duration_minutes=120,
        metadata={"ticket": "INC-1234"}
    )
    assert record.request_id is not None
    assert record.environment_name == "production"
    assert record.requested_by == "alice"
    assert record.is_approved is False
    assert record.is_active is False
    print("✓ Request created successfully")
    
    # Test 2: Approve the request with different user
    print("\nTest 2: Approving request with different user...")
    approved_record = await registry.approve(record.request_id, approved_by="bob")
    assert approved_record.is_approved is True
    assert approved_record.approved_by == "bob"
    assert approved_record.granted_at is not None
    assert approved_record.expires_at is not None
    assert approved_record.is_active is True
    print("✓ Request approved successfully")
    
    # Test 3: Try to approve own request (should fail)
    print("\nTest 3: Testing self-approval rejection...")
    record2 = await registry.request(
        environment_name="staging",
        requested_by="charlie",
        purpose="Testing",
        duration_minutes=60,
    )
    try:
        await registry.approve(record2.request_id, approved_by="charlie")
        print("✗ Self-approval should have been rejected!")
        return False
    except EnvironmentControlError as e:
        if "must differ from requester" in str(e):
            print("✓ Self-approval correctly rejected")
        else:
            print(f"✗ Unexpected error: {e}")
            return False
    
    # Test 4: Get request status
    print("\nTest 4: Getting request status...")
    fetched_record = await registry.get(record.request_id)
    assert fetched_record.request_id == record.request_id
    assert fetched_record.is_approved is True
    print("✓ Status retrieval successful")
    
    # Test 5: Unknown request
    print("\nTest 5: Testing unknown request...")
    try:
        await registry.get("nonexistent-id")
        print("✗ Should have raised error for unknown request!")
        return False
    except EnvironmentControlError as e:
        if "Unknown request" in str(e):
            print("✓ Unknown request correctly rejected")
        else:
            print(f"✗ Unexpected error: {e}")
            return False
    
    print("\n✅ All tests passed!")
    return True


if __name__ == "__main__":
    result = asyncio.run(test_environment_access_flow())
    sys.exit(0 if result else 1)
