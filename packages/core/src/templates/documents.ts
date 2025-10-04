export function renderFormCrs(clientId: string): string {
  return `BlackRoad Finance Form CRS\nClient: ${clientId}\nUpdated: ${new Date().toISOString()}\nSummary:\n- Services: Advisory, Brokerage, Insurance\n- Fees: Refer to ADV Part 2A\n- Conflicts: Mitigated via policies.\n`;
}

export function renderPrivacyNotice(clientId: string): string {
  return `BlackRoad Finance Privacy Notice\nClient: ${clientId}\nWe protect your non-public information and share only as permitted by law.`;
}
