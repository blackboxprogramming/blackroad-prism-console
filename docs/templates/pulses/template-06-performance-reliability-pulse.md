# 📈 Performance & Reliability Pulse

**Use**: Weekly/monthly system review or after big deploys.  
**Goal**: Surface silent degradation, capture trends, and keep ownership visible.

---

## 🧾 Header
- **HASH ID**: (e.g., `SYS-PERF-2025-W40`)
- **Date Range**: `YYYY-MM-DD – YYYY-MM-DD`
- **System/Service**: `@__`
- **Owner**: `@__`
- **Pulse**: `🟢🟢⚪️⚪️⚪️ → 🟢🟢🟢🟢🟢✅`

---

## 📊 Stage 1 — Collect & Compare
- Pull metrics (latency, error rate, throughput, cost).
- Plot current vs last period; mark variance > ±5 %.
- Check alert thresholds and recent suppressions.
- Run synthetic checks (end-to-end).
- Validate dashboards → no broken queries or widgets.
- Tag data snapshots in repo for audit.

---

## 🔍 Stage 2 — Analyze Patterns

| Metric | Target | Current | Δ % | Owner |
| --- | --- | --- | --- | --- |
| p95 Latency | `< 250 ms` | `230 ms` | `🟢 -8 %` | `@__` |
| Error Rate | `< 0.1 %` | `0.4 %` | `🔴 +300 %` | `@__` |
| Uptime (30 d) | `≥ 99.9 %` | `99.7 %` | `🟡 -0.2 %` | `@__` |

---

## 🧩 Stage 3 — Remediate & Optimize
- Create tasks for any metric outside SLO.
- Review queries and indexes if DB latency spikes.
- Tune autoscaling rules if load pattern changed.
- Re-train alert thresholds if too noisy / too silent.
- Record infra cost vs usage delta (spot anomalies).
- Patch dependencies with performance fixes.

---

## 🧠 Stage 4 — Reliability Review
- Revisit SLAs / SLOs → still realistic?
- Document any manual recoveries needed this period.
- Check on-call load and alert fatigue metrics.
- Propose automation or runbook updates.
- File learning items to team wiki.

---

## 🪶 Automation Hooks
- **Grafana/Datadog**: weekly report → auto-open “Performance Pulse” ticket.
- **GitHub**: label `perf-review` → add this template as comment.
- **ClickUp**: recurring task = first Monday → generate checklist and auto-assign owners.
- **Slack**: `/pulse-perf` → post table summary in `#reliability`.

---

## ✅ Completion Criteria
- All metrics logged and anomalies explained.
- Action items created and linked.
- Dashboard snapshot saved.
- Pulse `🟢🟢🟢🟢🟢✅`.

---

**Next Template Preview**: Template #7 — 🧠 Learning Loop & Mentorship Pulse (structured feedback, growth tracking, and “I don’t know yet” support).
