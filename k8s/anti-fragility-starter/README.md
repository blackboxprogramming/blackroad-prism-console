# Anti-Fragility Starter Stack

This starter kit wires a minimal anti-fragile operations loop on Kubernetes. It combines telemetry, progressive delivery, automated remediation, and continuous learning so that stress hardens the platform instead of degrading it.

## Components

- **Namespace** – isolates demo resources under `anti-fragile-demo`.
- **SLO** – an [OpenSLO](https://openslo.com/) objective for the demo service that feeds error-budget policy.
- **Alert routing** – a Prometheus Operator `AlertmanagerConfig` that annotates incidents with context and sends them to chat and ticketing.
- **Progressive delivery** – an Argo Rollouts canary with automatic rollback driven by golden-signal analysis.
- **Incident-to-learning job** – a nightly CronJob that turns incidents into embeddings so anomaly detectors retrain on fresh patterns.

## Deploy with GitOps

Apply the manifests with Argo CD or `kubectl`:

```bash
kubectl apply -k k8s/anti-fragility-starter
```

For GitOps, point an Argo CD `Application` at this directory. The manifests are composable via kustomize overlays.

## Flow

1. Telemetry exports latency and error metrics that back the SLO objective.
2. Alertmanager enriches burn-rate alerts with runbooks, deploy SHAs, and recent changes.
3. Argo Rollouts gradually shifts traffic; analysis gates watch the SLO burn and error rate.
4. If analysis fails, the rollout aborts and rolls back automatically.
5. After incidents, the CronJob updates the feature store powering anomaly detectors so future responses improve.

## Next Steps

- Connect Prometheus and Alertmanager instances to these configs.
- Plug the incident learning job into your real incident data source.
- Extend SLO definitions per service and enforce budgets via admission control.
