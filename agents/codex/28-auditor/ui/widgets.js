const state = {
  receipts: [],
  filters: {
    status: 'all',
    audience: 'engineer',
  },
};

function formatEnergy(energy) {
  if (!energy) return '—';
  const value = Number(energy.actual_joules || 0).toFixed(2);
  const badge = energy.within_target ? 'badge' : 'badge danger';
  return `<span class="${badge}">${value} J</span>`;
}

function formatPolicy(receipt) {
  return receipt.policy_pass ? '<span class="badge">Pass</span>' : '<span class="badge danger">Fail</span>';
}

function summarizeForAudience(receipt) {
  const base = receipt.policy_pass ? 'All policies cleared.' : `${receipt.violations.length} violation(s).`;
  switch (state.filters.audience) {
    case 'regulator':
      return `${base} Hash bundle=${receipt.hashes.bundle.slice(0, 8)}…`;
    case 'investor':
      return `${base} Energy=${Number(receipt.energy.actual_joules || 0).toFixed(2)}J.`;
    case 'public':
      return receipt.policy_pass ? '✅ Safe to announce.' : '⚠️ Pending review.';
    default:
      return `${base} Reviewer=${receipt.inputs.reviewer || 'unassigned'}.`;
  }
}

function applyFilters(receipts) {
  return receipts.filter((receipt) => {
    if (state.filters.status === 'pass' && !receipt.policy_pass) return false;
    if (state.filters.status === 'fail' && receipt.policy_pass) return false;
    return true;
  });
}

function renderTable() {
  const tableBody = document.querySelector('#receipts-table tbody');
  tableBody.innerHTML = '';
  const visibleReceipts = applyFilters(state.receipts);
  visibleReceipts.forEach((receipt) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${receipt.receipt_id}</td>
      <td>${new Date(receipt.timestamp).toLocaleString()}</td>
      <td>${formatPolicy(receipt)}</td>
      <td>${formatEnergy(receipt.energy)}</td>
      <td>${summarizeForAudience(receipt)}</td>
    `;
    tableBody.appendChild(row);
  });
}

function renderEnergyTrend() {
  const trend = document.querySelector('#energy-trend');
  if (!trend) return;
  const values = applyFilters(state.receipts).map((receipt) => receipt.energy.actual_joules || 0);
  if (values.length === 0) {
    trend.textContent = 'No receipts yet.';
    return;
  }
  const average = values.reduce((acc, val) => acc + val, 0) / values.length;
  const within = average <= 2.0;
  trend.innerHTML = `Average ${average.toFixed(2)} J/report — ${within ? '✅ Within target' : '⚠️ Above target'}`;
}

function render() {
  renderTable();
  renderEnergyTrend();
}

function setFiltersFromControls() {
  const status = document.getElementById('status-filter');
  const audience = document.getElementById('audience-filter');
  if (!status || !audience) return;
  state.filters.status = status.value;
  state.filters.audience = audience.value;
  render();
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('status-filter').addEventListener('change', setFiltersFromControls);
  document.getElementById('audience-filter').addEventListener('change', setFiltersFromControls);

  // Seed with placeholder receipts for offline preview.
  state.receipts = [
    {
      receipt_id: 'demo-1',
      timestamp: new Date().toISOString(),
      policy_pass: true,
      hashes: { bundle: 'abc12345' },
      energy: { actual_joules: 1.4, within_target: true },
      violations: [],
      inputs: { reviewer: 'auditor@example.com' },
    },
    {
      receipt_id: 'demo-2',
      timestamp: new Date().toISOString(),
      policy_pass: false,
      hashes: { bundle: 'def67890' },
      energy: { actual_joules: 2.8, within_target: false },
      violations: [{ id: 'PRIV-002' }],
      inputs: { reviewer: null },
    },
  ];

  render();
});
