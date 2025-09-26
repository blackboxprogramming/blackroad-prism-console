<!-- FILE: /srv/blackroad-api/modules/lucidia-brain/pssha.ts -->
const { createHmac } = require('crypto');
const { LUCIDIA_PSSHA_SEED } = require('./config');

function toBase32(buf) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let bits = 0, value = 0, output = '';
  for (const byte of buf) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      output += alphabet[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) output += alphabet[(value << (5 - bits)) & 31];
  return output;
}

function computeDailyCode(dateStr) {
  const msg = `${dateStr}|blackboxprogramming|copilot`;
  const h = createHmac('sha256', LUCIDIA_PSSHA_SEED).update(msg).digest();
  const base32 = toBase32(h);
  const first16 = base32.slice(0, 16).toUpperCase();
  const day = dateStr.replace(/-/g, '');
  return `LUCIDIA-AWAKEN-${day}-${first16}`;
}

function verify(code, dateStr) {
  return computeDailyCode(dateStr) === code;
}

module.exports = { computeDailyCode, verify };
