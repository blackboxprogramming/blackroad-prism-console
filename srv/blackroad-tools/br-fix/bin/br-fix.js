#!/usr/bin/env node
// FILE: /srv/blackroad-tools/br-fix/bin/br-fix.js
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function run(cmd) {
  try {
    execSync(cmd, { stdio: 'inherit' });
    return { cmd, ok: true };
  } catch (e) {
    return { cmd, ok: false, error: e.message };
  }
}

function writeJSON(file, obj) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(obj, null, 2));
}

const args = process.argv.slice(2);
const cmd = args[0];
const repoIdx = args.indexOf('--repo');
const repo = repoIdx >= 0 ? args[repoIdx + 1] : process.cwd();

switch (cmd) {
  case 'scan': {
    const outIdx = args.indexOf('--out');
    const out = outIdx >= 0 ? args[outIdx + 1] : path.join(__dirname, '../reports/scan.json');
    const results = [];
    results.push(run(`npx eslint ${path.join(repo, 'src/routes/json.js')}`));
    const pyFiles = execSync(`git -C ${repo} ls-files '*.py'`, { encoding: 'utf8' }).trim().split('\n').filter(Boolean);
    if (pyFiles.length) {
      results.push(run(`python -m py_compile ${pyFiles.map(f => path.join(repo, f)).join(' ')}`));
    }
    writeJSON(out, { summary: results });
    break;
  }
  case 'apply': {
    const backupIdx = args.indexOf('--backup');
    if (backupIdx >= 0) {
      const dest = args[backupIdx + 1];
      const ts = new Date().toISOString().replace(/[-:]/g, '').replace(/\..*/, '');
      const dir = path.join(dest, ts);
      fs.mkdirSync(dir, { recursive: true });
      fs.copyFileSync(path.join(repo, 'src/routes/json.js'), path.join(dir, 'json.js'));
      fs.writeFileSync(path.join(dir, 'restore.sh'), "#!/usr/bin/env bash\ncp json.js " + path.join(repo, 'src/routes/json.js') + "\n");
    }
    console.log('No patches applied');
    break;
  }
  case 'test': {
    run(`npm test --prefix ${repo}`);
    break;
  }
  case 'report': {
    console.log('Reports stored in', path.join(__dirname, '../reports'));
    break;
  }
  default:
    console.log('Usage: br-fix <scan|apply|test|report> [--repo path]');
}
