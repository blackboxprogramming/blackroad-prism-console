const jwt = require('jsonwebtoken');

function signToken(payload, secret, expires='2h') {
  return jwt.sign(payload, secret, { expiresIn: expires });
}

function verifyToken(token, secret) {
  try {
    return jwt.verify(token, secret);
  } catch (e) {
    return null;
  }
}

function authMiddleware(secret) {
  return (req, res, next) => {
    const hdr = req.headers.authorization || '';
    const token = hdr.startsWith('Bearer ') ? hdr.slice(7) : null;
    if (!token) return res.status(401).json({ error: 'missing token' });
    const decoded = verifyToken(token, secret);
    if (!decoded) return res.status(401).json({ error: 'invalid token' });
    req.user = decoded;
    next();
  };
}

function nowISO(){ return new Date().toISOString(); }

module.exports = { signToken, verifyToken, authMiddleware, nowISO };
