# Infrastructure Skeleton

This directory contains an initial skeleton for provisioning a self-hosted Lucidia stack on
BlackRoad-controlled infrastructure. The layout uses Ansible playbooks to configure a
highly-available k3s cluster backed by Longhorn for storage and MinIO for object
hosting. All playbooks are currently placeholders awaiting implementation.

## Structure
- `bootstrap.sh` – convenience script to run the full Ansible bootstrap.
- `ansible/` – Ansible inventory, playbooks, and roles.
  - `playbooks/` – entry points for each major component.
  - `roles/` – component roles with placeholder tasks.

Customize `ansible/inventory.ini` with hostnames or IPs for your environment before
running the bootstrap script.

_Last updated on 2025-09-11_
