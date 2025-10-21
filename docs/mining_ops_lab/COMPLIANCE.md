# Provider Compliance Checklist Template

```yaml
version: 2024-05
providers:
  aws:
    allowed: true
    spot_policy: "Spot + On-Demand allowed; interruption handling required"
    inbound_ports: "Not permitted"
    disclosure: "Customer must disclose workload nature to cloud provider if required"
    notes:
      - "Enforce outbound-only security groups"
      - "Set task max runtime <= 120 minutes"
      - "Enable EventBridge termination on budget cap"
  gcp:
    allowed: true
    spot_policy: "Preemptible VMs recommended"
    inbound_ports: "Not permitted"
    disclosure: "Comply with regional cryptocurrency policies"
    notes:
      - "Use Cloud Scheduler to enforce runtime caps"
      - "Ensure firewall denies inbound traffic"
  azure:
    allowed: true
    spot_policy: "Use Azure Spot Virtual Machines with eviction handling"
    inbound_ports: "Not permitted"
    disclosure: "Follow Azure Acceptable Use Policy"
    notes:
      - "Leverage Azure Monitor alerts for budget overages"
      - "Auto-delete resource groups nightly"
```

Organisations must acknowledge the provider-specific checklist before launching jobs. The acknowledgement is recorded with version, timestamp, and actor id and is surfaced in the UI to prove compliance.
