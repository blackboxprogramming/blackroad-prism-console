#!/usr/bin/env node
/**
 * Basic log scan guardrail stub.
 * Greps for obvious credential keywords in structured logs.
 * Extend later with more sources / sinks.
 */

const fs = require('fs');
const readline = require('readline');

const DEFAULT_LOG_PATH =
  process.env.DEBUG_LOG_PATH || '/var/log/blackroad-api/app.log';
const logPath = process.argv[2] || DEFAULT_LOG_PATH;

if (!fs.existsSync(logPath)) {
  console.error(
    `[log-scan] file not found: ${logPath}\n` +
      'Pass an explicit file path or pipe logs via stdin.'
  );
  process.exit(0);
}

const suspiciousPatterns = [
  /authorization/i,
  /bearer\s+[a-z0-9\-_.~+/]+=*/i,
  /api[_-]?key/i,
  /secret/i,
  /password/i,
  /token/i,
];

let flagged = 0;

const rl = readline.createInterface({
  input: fs.createReadStream(logPath, { encoding: 'utf8' }),
  crlfDelay: Infinity,
});

rl.on('line', (line) => {
  if (suspiciousPatterns.some((pattern) => pattern.test(line))) {
    flagged += 1;
    console.log(`[flagged] ${line}`);
  }
});

rl.on('close', () => {
  console.log(
    `\n[log-scan] completed — ${flagged} potential secret leak$${
      flagged === 1 ? '' : 's'
    } detected`
  );
  if (flagged > 0) {
    process.exitCode = 2;
  }
});
