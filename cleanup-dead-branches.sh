#!/bin/bash

# Branch Cleanup Script
# This script deletes 787 merged branches from the remote repository
# Run this with an account that has branch deletion permissions

echo "=== Dead Branch Cleanup Script ==="
echo "This will delete 787 merged remote branches"
echo ""
echo "WARNING: This action cannot be undone!"
echo ""
read -p "Are you sure you want to continue? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "Aborted."
    exit 0
fi

# Read branches from the list
BRANCH_FILE="/tmp/branches_to_delete.txt"

if [ ! -f "$BRANCH_FILE" ]; then
    echo "Error: Branch list file not found at $BRANCH_FILE"
    exit 1
fi

echo ""
echo "Starting branch deletion..."
echo ""

deleted=0
failed=0

while IFS= read -r branch; do
    # Trim whitespace
    branch=$(echo "$branch" | xargs)

    if [ -n "$branch" ]; then
        echo "Deleting: $branch"
        if git push origin --delete "$branch" 2>/dev/null; then
            ((deleted++))
        else
            ((failed++))
            echo "  Failed to delete: $branch"
        fi
    fi
done < "$BRANCH_FILE"

echo ""
echo "=== Cleanup Complete ==="
echo "Successfully deleted: $deleted branches"
echo "Failed: $failed branches"
