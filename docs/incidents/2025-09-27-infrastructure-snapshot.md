# Infrastructure Operations Snapshot — 27 Sep 2025

This memo captures a cross-provider view of three notable infrastructure events that unfolded on 27 Sep 2025. The goal is to summarize what happened, enumerate the known or suspected causes, and outline potential mitigation steps or monitoring follow-ups for BlackRoad teams that depend on these services.

## OpenAI: Fine-Tuning Job Latency
- **Status**: Active incident on OpenAI's public status page noting "Increased latency on fine-tuning jobs" as of 04:10 UTC.
- **Current mitigation**: OpenAI reported adding extra capacity while continuing to investigate the underlying issue.
- **Operational impact**: Queued fine-tuning jobs may sit in prolonged "waiting" states. Historically, this class of incident has led to jobs stalling indefinitely until OpenAI manually rebalances capacity.
- **Recommended actions**:
  - Defer non-critical fine-tuning submissions until OpenAI clears the incident.
  - For unavoidable jobs, coordinate with stakeholders about elongated delivery timelines and ensure retry logic can handle extended queue times.
  - Track OpenAI's status RSS feed for closure or escalation.

## Cloudflare: 22.2 Tbps / 10.6 Bpps DDoS Attempt
- **Status**: Cloudflare mitigated a ~40 second DDoS burst that peaked at 22.2 Tbps and 10.6 Bpps, roughly twice the volume of the previous record just weeks earlier.
- **Attack profile**: Traffic originated from more than 404,000 distinct, non-spoofed IP addresses spanning 14+ autonomous systems, indicating a large-scale botnet or multiple botnets acting in concert.
- **Operational impact**: No customer downtime reported, but the magnitude underscores the rapidly rising ceiling of volumetric attacks.
- **Recommended actions**:
  - Confirm that properties relying on Cloudflare have appropriate tiering (e.g., Advanced DDoS protection) and automatic mitigation enabled.
  - Review rate limiting, bot management, and anomaly detection dashboards for residual effects.
  - Incorporate the new peak volume into capacity modelling for any self-hosted scrubbing plans.

## DigitalOcean FRA1: Spaces Performance Degradation
- **Status**: Degraded performance and availability for the FRA1 Spaces object storage region from ~08:02 UTC to 09:40 UTC. Incident resolved.
- **Impact surface**: API and UI access to Spaces, with potential knock-on effects for dependent services such as the container registry.
- **Operational impact**: Users may have experienced slower object storage responses, failed uploads/downloads, or registry pulls in FRA1.
- **Recommended actions**:
  - Audit workloads using FRA1 to verify data synchronization and retry any failed transfers.
  - Validate that multi-region replication or failover policies behaved as expected.
  - Update incident postmortem trackers with the resolved status and confirm no SLA breach notifications are required.

## Cross-Incident Takeaways
- **Tight capacity margins**: Whether in AI training pipelines, DDoS mitigation, or regional storage, providers are operating near limits; short spikes can ripple into prolonged customer impact.
- **Observability**: Ensure dashboards and alerting cover third-party service degradation, not just outright outages, so teams are aware when latency or throughput degrade before a full failure.
- **Resilience planning**: Where feasible, diversify providers or regions for critical workloads and rehearse the manual steps required to shift load when upstream incidents occur.

---
*Prepared by: Autonomous Agent*  
*Date: 27 Sep 2025*
