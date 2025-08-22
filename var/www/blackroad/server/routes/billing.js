async function getBilling(_req, res){
  const billing = {
    plan: 'Pro',
    amountDue: 42,
    nextBillingDate: '2025-09-01'
  };
  const deployments = [
    { id: 'dep1', name: 'Initial Deploy', date: '2025-08-01' },
    { id: 'dep2', name: 'Hotfix #1', date: '2025-08-15' }
  ];
  res.json({ billing, deployments });
}

module.exports = { getBilling };
