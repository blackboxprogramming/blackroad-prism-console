import { Router } from 'express';
import { verify } from '../../lib/oauth.js';
import { prisma } from '../../lib/db.js';
const r = Router();

r.post('/token', async (req,res)=>{
  const { grant_type, code } = req.body || {};
  if (grant_type !== 'authorization_code') return res.status(400).json({ error:'unsupported_grant_type' });
  const payload = verify(String(code||'')) as any;
  if (!payload?.appId) return res.status(400).json({ error:'invalid_code' });
  const exp = new Date(Date.now()+3600*1000);
  const accessToken = Buffer.from(code).toString('base64url')+'.at';
  await prisma.oAuthToken.create({ data:{ appId: payload.appId, orgId: payload.orgId, scope: payload.scope||'', accessToken, expiresAt: exp }});
  res.json({ token_type:'bearer', access_token: accessToken, expires_in: 3600, scope: payload.scope||'' });
});

export default r;
