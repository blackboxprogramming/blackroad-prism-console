# Production rollback & forward playbook

The production manifest (`environments/production.yml`) documents automation and
infrastructure wiring. This playbook translates those references into concrete
steps for safely promoting a change or rolling back when the release pipeline
flags regressions.

## Canary ladder (forward deploy)

1. Run the reusable **deploy-canary** workflow when you need a quick health
   check with a specific percentage (1%, 5%, 10%, 50%, 100%).
   - Ensure repository variables (`AWS_REGION`, `ECR_REPO`, `ECS_CLUSTER`,
     `ECS_SERVICE`, `TG_BLUE_ARN`, `TG_GREEN_ARN`, `HTTPS_LISTENER_ARN`,
     `APP_URL`, `ALB_ARN_SUFFIX`) are up to date.
   - Provide the `AWS_ROLE_TO_ASSUME` secret with rights to push images and touch
     ECS/ELB resources.
   - Use the run output to confirm the ALB 5xx counts remain within baseline
     tolerances before increasing traffic.
2. Promote through multiple percentages by running **deploy-canary-ladder**.
   - Leave the default step ladder (`1,50,100`) or supply your own comma
     separated list.
   - The ladder job performs curl probes and CloudWatch comparisons at each
     step, automatically rolling back to the blue target group if the thresholds
     are exceeded.
3. Once the ladder finishes, leave the ALB listener at 100% green. The workflow
   forces the final promotion but continues to emit status for observability and
   incident review.

## Rollback + legacy forward path

1. Trigger **Deploy & Self-Heal** if ECS is degraded or automation is blocked.
   - The workflow rsyncs the repository to the long-lived host identified by
     `BR_HOST`, executes `scripts/deploy.sh`, and then runs the
     `/usr/local/bin/self_heal.sh` routine with the configured endpoint list.
   - Configure `ROLLOBACK_STRATEGY` (`git` or `docker`) and `ROLLOBACK_REF` so
     the helper scripts know how to revert.
2. If the self-heal routine fails, connect via SSH and run the same scripts to
   diagnose the failing component. The automation leaves the repository at the
   attempted ref so manual comparisons (`git status`, `git log -1`) are quick.
3. After recovering, re-run the canary workflow so future deploys do not drift
   away from the baseline container image.

## Verification checklist

Run these commands locally or through the workflow outputs to confirm the
environment is healthy after either path:

```bash
curl -fsS https://blackroad.io/healthz >/dev/null
curl -fsS https://api.blackroad.io/health >/dev/null
aws ecs describe-services --cluster "$ECS_CLUSTER" --services "$ECS_SERVICE" --region us-west-2
aws cloudwatch get-metric-statistics \
  --namespace AWS/ApplicationELB \
  --metric-name HTTPCode_ELB_5XX_Count \
  --dimensions Name=LoadBalancer,Value=$ALB_ARN_SUFFIX \
  --start-time "$(date -u -d '15 minutes ago' +%Y-%m-%dT%H:%M:%SZ)" \
  --end-time "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
  --period 300 \
  --statistics Sum
```

If the verification fails, re-run the ladder at a lower percentage or the
self-heal workflow before attempting another promotion.
