#!/usr/bin/env node
/**
 * Masked address health reporter.
 *
 * Reads the comma separated ADDRESS_NAMES environment variable and for each
 * corresponding environment entry prints the masked tail and a truncated
 * SHA-256 digest. Output is appended to ADDR_HEALTH_LOG (defaults to the
 * invoking user's home directory).
 */

import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';

const parseNames = (value = '') =>
  value
    .split(',')
    .map((token) => token.trim())
    .filter(Boolean);

const maskValue = (value) => (value ? `****${value.slice(-6)}` : '');
const digestValue = (value) =>
  crypto.createHash('sha256').update(value ?? '', 'utf8').digest('hex');

const ADDRESS_NAMES = parseNames(process.env.ADDRESS_NAMES);
const LOG_FILE =
  process.env.ADDR_HEALTH_LOG ||
  `${os.homedir().replace(/\\$/, '')}/addr-health.log`;

const rows = [['NAME', 'LEN', 'MASKED', 'DIGEST8']];
for (const name of ADDRESS_NAMES) {
  const value = process.env[name];
  if (!value) continue;
  rows.push([
    name,
    String(value.length),
    maskValue(value),
    digestValue(value).slice(0, 8),
  ]);
}

if (rows.length === 1) {
  rows.push(['(no addresses)', '0', '', '']);
}

const columnWidth = (index) =>
  Math.max(...rows.map((row) => (row[index] ?? '').length));
const widths = rows[0].map((_, index) => columnWidth(index));
const renderRow = (row) =>
  row
    .map((cell, index) =>
      index === 0 ? cell.padEnd(widths[index]) : cell.padStart(widths[index])
    )
    .join('  ');

const header = renderRow(rows[0]);
const separator = '-'.repeat(widths.reduce((acc, width) => acc + width, 0) + 6);
const body = rows.slice(1).map(renderRow).join('\n');
const output = `${header}\n${separator}${body ? `\n${body}` : ''}\n`;

const timestamp = new Date().toISOString();
const logEntry = `\n# ${timestamp}\n${output}`;
try {
  fs.appendFileSync(LOG_FILE, logEntry, 'utf8');
} catch (error) {
  console.error(`failed to write to ${LOG_FILE}:`, error.message);
}

process.stdout.write(output);
