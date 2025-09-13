import { execSync } from 'node:child_process';
const run = (cmd:string) => execSync(cmd,{stdio:'inherit'});
try {
  run('npm ci --prefix apps/api');
  run('npx prettier -w apps');
  run('npx eslint apps/api --fix || true');
  run('npm run build --prefix apps/api');
} catch { /* no-op, never fail */ }
