const checklist = [
  '- [ ] CI green',
  '- [ ] /api/health returns 200',
  '- [ ] Tests added/updated',
  '- [ ] No secrets committed',
];
console.log(`PR Review Suggestions:\n${checklist.join('\n')}`);
