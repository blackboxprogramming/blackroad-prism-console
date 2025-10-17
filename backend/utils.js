function signToken(payload) {
  return Buffer.from(JSON.stringify(payload)).toString('base64');
}

function verifyToken(token) {
  try {
    return JSON.parse(Buffer.from(token, 'base64').toString());
  } catch {
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

function adminMiddleware(req, res, next) {
  const role = req.user?.role;
  if (role !== 'owner' && role !== 'admin') {
    return res.status(403).json({ error: 'forbidden' });
  }
  next();
}

function nowISO(){ return new Date().toISOString(); }

module.exports = { signToken, verifyToken, authMiddleware, adminMiddleware, nowISO };
function requireAdmin(req, res, next) {
  const role = req.user?.role;
  if (!['admin', 'owner'].includes(role)) {
    return res.status(403).json({ error: 'forbidden' });
  }
  next();
}

module.exports = { signToken, verifyToken, authMiddleware, nowISO, requireAdmin };
