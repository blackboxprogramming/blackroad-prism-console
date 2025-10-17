let nodeCrypto = null;
try {
  nodeCrypto = require('crypto');
} catch {
  nodeCrypto = null;
}

const FNV_OFFSET = 2166136261;
const FNV_PRIME = 16777619;

function fallbackHash(seed) {
  let hash = FNV_OFFSET;
  for (let i = 0; i < seed.length; i += 1) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, FNV_PRIME);
  }
  return hash >>> 0;
}

function bucket(seed) {
  if (nodeCrypto && typeof nodeCrypto.createHash === 'function') {
    const digest = nodeCrypto.createHash('sha256').update(seed).digest();
    const value =
      ((digest[0] << 24) | (digest[1] << 16) | (digest[2] << 8) | digest[3]) >>>
      0;
    return value % 100;
  }
  return fallbackHash(seed) % 100;
}

module.exports = { bucket };
