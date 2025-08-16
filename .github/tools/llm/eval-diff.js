#!/usr/bin/env node
/**
 * Compare current artifacts/llm-eval/*.json to the main branch snapshot (if available).
 * Outputs a brief markdown summary to stdout.
 */
import { execSync as sh } from 'child_process';
import fs from 'fs';
import path from 'path';
const dir = 'artifacts/llm-eval';
if (!fs.existsSync(dir)) { console.log('No eval artifacts; skipping.'); process.exit(0); }
try {
  sh('git fetch origin main:refs/remotes/origin/main', { stdio: 'ignore' });
} catch {
  /* ignore fetch errors */
}
try { sh('git fetch origin main:refs/remotes/origin/main', {stdio:'ignore'}); } catch {}
const tmp='.llm-eval-main'; fs.rmSync(tmp,{recursive:true,force:true}); fs.mkdirSync(tmp,{recursive:true});
try { sh(`git show origin/main:${dir} 1>/dev/null 2>&1`); } catch { console.log('No prior artifacts on main; skipping diff.'); process.exit(0); }
let md = '### LLM Eval Diff (advisory)\n';
const nowFiles = fs.readdirSync(dir).filter(f=>f.endsWith('.json') && f!=='latency.json');
for(const f of nowFiles){
  let prev=''; try { prev = sh(`git show origin/main:${dir}/${f}`, {encoding:'utf8'}); } catch { continue; }
  const prevObj=JSON.parse(prev), nowObj=JSON.parse(fs.readFileSync(path.join(dir,f),'utf8'));
  const prevN=prevObj.results?.length||0, nowN=nowObj.results?.length||0;
  md += `- ${f}: cases ${prevN} → ${nowN}\n`;
}
console.log(md);
