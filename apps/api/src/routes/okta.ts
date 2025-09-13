import { Router } from 'express';
import { Issuer, generators } from 'openid-client';
import { setSessionCookie } from '../middleware/session.js';
import fs from 'fs';
import path from 'path';

const router = Router();
const oktaIssuer = process.env.OKTA_ISSUER || '';
const clientId = process.env.OKTA_CLIENT_ID || '';
const clientSecret = process.env.OKTA_CLIENT_SECRET || '';
const redirectUri = process.env.OKTA_REDIRECT_URI || '';
const clientPromise = (async () => {
  const issuer = await Issuer.discover(oktaIssuer);
  return new issuer.Client({
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uris: [redirectUri],
    response_types: ['code']
  });
})();

router.get('/login', async (_req, res) => {
  const client = await clientPromise;
  const codeVerifier = generators.codeVerifier();
  const codeChallenge = generators.codeChallenge(codeVerifier);
  // Save verifier in a temporary cookie
  res.cookie('okta_cv', codeVerifier, { httpOnly: true });
  const authUrl = client.authorizationUrl({
    scope: 'openid profile email',
    code_challenge: codeChallenge,
    code_challenge_method: 'S256'
  });
  res.redirect(authUrl);
});

router.get('/callback', async (req, res) => {
  const client = await clientPromise;
  const codeVerifier = req.cookies.okta_cv || '';
  const params = client.callbackParams(req);
  const tokenSet = await client.callback(redirectUri, params, { code_verifier: codeVerifier });
  const { email, sub } = tokenSet.claims();
  // Create or find user and issue your own session cookie
  setSessionCookie(res, { uid: sub, email }, process.env.SESSION_SECRET || '', 60 * 60 * 24 * 7);
  // Lucidia memory hook
  try {
    const memoryFile = path.resolve(process.cwd(), 'session_memory.json');
    const memory = JSON.parse(fs.readFileSync(memoryFile, 'utf-8'));
    memory.logins = memory.logins || [];
    memory.logins.push({ email, ts: new Date().toISOString() });
    fs.writeFileSync(memoryFile, JSON.stringify(memory, null, 2));
  } catch (err) {
    console.error('Memory write failed', err);
  }
  res.redirect('/');
});

export default router;
