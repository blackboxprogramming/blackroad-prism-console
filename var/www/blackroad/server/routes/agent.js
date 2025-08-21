// Returns a plan and a diff patch against a virtual buffer (demo)
async function runTask(req, res){
  const { prompt, selection } = req.body || {};
  const plan = [
    `Understand intent: ${String(prompt).slice(0,120)}`,
    'Generate minimal cohesive patch',
    'Request approval',
    'Apply patch and verify build'
  ];
  const patches = [{
    path: 'virtual://current',
    diff: ['--- a/virtual','+++ b/virtual','@@ -1,2 +1,2 @@','-// TODO','+// Implemented: '+(prompt||'inline edit')].join('\n')+"\n"
  }];
  res.json({ plan, patches, commands: [] });
}
module.exports = { runTask };
