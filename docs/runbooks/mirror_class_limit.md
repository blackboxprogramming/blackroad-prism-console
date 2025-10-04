# MIRROR_CLASS_LIMIT Runbook

**Owner:** SecOps Eng Duty <secops@corp>

## Summary

Blocks mirror actions that target repositories classified as `restricted` or `secret`. Mirrors to those repositories risk copying sensitive IP to uncontrolled destinations.

## Triage

1. Confirm the target repository's classification in the registry.
2. Reach out to the requestor listed in the violation payload.
3. If the mirror is required, coordinate an exception review with data governance.

## Remediation

- If the classification is incorrect, update the metadata and re-run the action.
- If the mirror is legitimate, file an exception ticket and add it to the allowlist rotation job.
- Otherwise, document the deny event and notify the product security list.

## Related Dashboards

- `dashboards/grafana-rule-board.json` — Mirror Guard panel.

## Active exceptions (this rule)

<div id="mirror-class-exceptions">Loading…</div>
<script>
(async function () {
  const el = document.getElementById('mirror-class-exceptions');
  if (!el) return;
  try {
    const res = await fetch('/exceptions/active?rule_id=MIRROR_CLASS_LIMIT');
    if (!res.ok) throw new Error(res.statusText || String(res.status));
    const data = await res.json();
    if (!data.items || data.items.length === 0) {
      el.textContent = '(none)';
      return;
    }
    const rows = data.items.map((item) => {
      const subject = `${item.subject_type}:${item.subject_id}`;
      const until = item.valid_until ? new Date(item.valid_until).toISOString() : 'open';
      const requestedBy = item.requested_by || '?';
      return `<li>#${item.id} — <code>${subject}</code> — by <strong>${requestedBy}</strong> — until <em>${until}</em></li>`;
    });
    el.innerHTML = `<ul>${rows.join('')}</ul>`;
  } catch (err) {
    console.error('exceptions load failed', err);
    el.textContent = '(error loading exceptions)';
  }
})();
</script>
