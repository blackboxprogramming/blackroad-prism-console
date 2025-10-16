import jwt from 'jsonwebtoken';
import fetch from 'node-fetch';
import { ssm } from './ssm.js';

interface InstallationToken {
  token: string;
  expires_at: string;
}

async function getAppCreds(env: string) {
  const [appId, privKey] = await Promise.all([
    ssm.get(`/blackroad/${env}/github/app_id`),
    ssm.get(`/blackroad/${env}/github/private_key_pem`)
  ]);
  return { appId, privKey };
}

export async function getInstallationToken(env: string, installationId: string): Promise<InstallationToken> {
  const { appId, privKey } = await getAppCreds(env);
  const now = Math.floor(Date.now() / 1000);
  const jwtToken = jwt.sign(
    { iat: now - 60, exp: now + 9 * 60, iss: appId },
    privKey,
    { algorithm: 'RS256' }
  );

  const res = await fetch(`https://api.github.com/app/installations/${installationId}/access_tokens`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${jwtToken}`,
      Accept: 'application/vnd.github+json',
      'User-Agent': 'BlackRoad'
    }
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Install token ${res.status}: ${text}`);
  }
  const body = (await res.json()) as { token: string; expires_at: string };
  return { token: body.token, expires_at: body.expires_at };
}
