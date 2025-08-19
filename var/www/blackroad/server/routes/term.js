const queue = new Map();

async function propose(req, res){
  const { cmd, cwd } = req.body || {};
  if(!cmd) return res.status(400).json({ error: 'cmd required' });
  const id = Math.random().toString(36).slice(2);
  queue.set(id, { cmd, cwd: cwd||process.cwd() });
  res.json({ proposalId: id, cmd });
}

async function approve(req, res){
  const { proposalId } = req.body || {};
  const item = queue.get(proposalId);
  if(!item) return res.status(404).json({ error: 'not found' });
  queue.delete(proposalId);
  // SECURITY: In first pass, do NOT execute. Return a dry-run response.
  res.json({ output: `DRY RUN — would execute: ${item.cmd} (cwd=${item.cwd})`, exitCode: 0 });
}

module.exports = { propose, approve };
