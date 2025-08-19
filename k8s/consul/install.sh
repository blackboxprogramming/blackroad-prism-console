#!/usr/bin/env bash
set -euo pipefail

kubectl create namespace consul --dry-run=client -o yaml | kubectl apply -f -
helm repo add hashicorp https://helm.releases.hashicorp.com
helm repo update
helm upgrade --install consul hashicorp/consul \
  --namespace consul \
  -f k8s/consul/values-lucidia-dev.yaml
