const crypto = require('crypto');

function verifySignature(secret, body, signature) {
  if (!secret || !signature) return false;
  const hmac = crypto.createHmac('sha256', secret);
  const digest = 'sha256=' + hmac.update(body).digest('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
  } catch {
    return false;
  }
}

function verifyToken(given, expected) {
  if (!given || !expected) return false;
  try {
    return crypto.timingSafeEqual(Buffer.from(given), Buffer.from(expected));
  } catch {
    return false;
  }
}

function branchAllowed(branch, allow) {
  return Array.isArray(allow) && allow.includes(branch);
}

module.exports = { verifySignature, verifyToken, branchAllowed };
