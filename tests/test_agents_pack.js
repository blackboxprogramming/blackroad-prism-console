const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const agents = [
  'logger','guardian','roadie','cecilia','quantum','search','visual','emotional',
  'truth','spiral','auth','file','co_creation','dashboard','integration','deployment'
];

async function testAgent(name) {
  return new Promise((resolve, reject) => {
    const proc = spawn('node', [path.join(__dirname, '..', 'agents', name, 'index.js')]);
    let responded = false;
    proc.stdout.setEncoding('utf8');
    proc.stdout.on('data', (data) => {
      if (data.trim() === `pong: ${name}`) {
        responded = true;
        proc.kill();
        resolve();
      }
    });
    proc.on('error', reject);
    setTimeout(() => {
      proc.stdin.write('ping\n');
    }, 50);
    setTimeout(() => {
      if (!responded) {
        proc.kill();
        reject(new Error(`no response from ${name}`));
      }
    }, 1000);
  }).then(() => {
    const logPath = path.join(__dirname, '..', 'prism', 'logs', `${name}.log`);
    if (!fs.existsSync(logPath)) {
      throw new Error(`log missing for ${name}`);
    }
    if (name === 'truth' || name === 'guardian') {
      const cPath = path.join(__dirname, '..', 'prism', 'contradictions', `${name}.json`);
      if (!fs.existsSync(cPath)) {
        throw new Error(`contradictions missing for ${name}`);
      }
    }
  });
}

(async () => {
  for (const name of agents) {
    await testAgent(name);
  }
  console.log('all agents responded');
})();
