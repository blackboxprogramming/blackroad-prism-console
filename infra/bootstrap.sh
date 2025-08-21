#!/usr/bin/env bash
set -euo pipefail

# Run the full bootstrap playbook which chains all component playbooks.
ANSIBLE_INVENTORY=${ANSIBLE_INVENTORY:-ansible/inventory.ini}

ansible-playbook -i "$ANSIBLE_INVENTORY" ansible/playbooks/bootstrap.yml
