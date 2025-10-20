#!/usr/bin/env node
import { readFileSync, existsSync } from 'node:fs';
import { execSync } from 'node:child_process';
const MAX = Number(process.env.MAX_TEMP_C || 70);
function temp() {
  try {
    const out = execSync('vcgencmd measure_temp',{stdio:['ignore','pipe','ignore']}).toString();
// Optional watcher: if temp > MAX, send SIGTERM to xmrig and exit.
// Use with Docker xmrig by 'docker stop xmrig' on trip (preferred).

import { readFileSync, existsSync } from 'node:fs';
import { execSync } from 'node:child_process';

const MAX = Number(process.env.MAX_TEMP_C || 70);
function readTemp() {
  try {
    const out = execSync('vcgencmd measure_temp', { stdio: ['ignore','pipe','ignore'] }).toString();
    const v = parseFloat(out.replace(/[^0-9.]/g,''));
    if (!isNaN(v)) return v;
  } catch {}
  if (existsSync('/sys/class/thermal/thermal_zone0/temp')) {
    const raw = readFileSync('/sys/class/thermal/thermal_zone0/temp','utf8').trim();
    const v = Number(raw)/1000; if (!isNaN(v)) return v;
  }
  return 0;
}
const t = temp();
if (t >= MAX) {
  try { execSync('docker stop xmrig',{stdio:'ignore'}); } catch {}
  console.log(JSON.stringify({ok:false,temp:t,action:'stopped xmrig'})); process.exit(1);
}
console.log(JSON.stringify({ok:true,temp:t}));
    const v = Number(raw)/1000;
    if (!isNaN(v)) return v;
  }
  return 0;
}

const t = readTemp();
if (t >= MAX) {
  try {
    execSync('docker stop xmrig', { stdio: 'ignore' });
  } catch {}
  console.log(JSON.stringify({ ok:false, temp:t, action:'stopped xmrig' }));
  process.exit(1);
}
console.log(JSON.stringify({ ok:true, temp:t }));
