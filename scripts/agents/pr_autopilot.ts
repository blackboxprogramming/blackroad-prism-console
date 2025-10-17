import { execSync } from 'node:child_process';

const pr = process.argv[2] || '';
try{
  const head = pr ? execSync(`gh pr view ${pr} --json headRefName -q .headRefName`, { encoding:'utf-8' }).trim() : '';
  const ref = head || execSync(`git branch --show-current`, { encoding:'utf-8' }).trim();
  execSync(`git fetch origin ${ref}`, { stdio:'inherit' });
  execSync(`git checkout ${ref}`, { stdio:'inherit' });

  // Autofix pass
  try { execSync(`npx prettier -w .`, { stdio:'inherit' }); } catch {}
  try { execSync(`npx eslint . --fix`, { stdio:'inherit' }); } catch {}

  execSync(`git add -A && git commit -m "bot: autofix suggestions" || echo "no changes"`, { stdio:'inherit' });
  execSync(`git push origin ${ref}`, { stdio:'inherit' });

  // Optionally label automerge (best-effort)
  if (pr) execSync(`gh pr edit ${pr} --add-label automerge`, { stdio:'inherit' });

  console.log('PR autopilot complete');
} catch (e:any) {
  console.log('autopilot failed:', e?.message||e);
  process.exit(0);
}
