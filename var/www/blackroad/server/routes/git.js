// TODO: replace with real unified diff apply that edits files safely.
async function applyPatches(req, res){
  const { patches } = req.body || {};
  if(!Array.isArray(patches)) return res.status(400).json({ error: 'patches[] required' });
  const applied = Object.fromEntries(patches.map(p=>[p.path,'ok']));
  res.json({ applied });
}
module.exports = { applyPatches };
