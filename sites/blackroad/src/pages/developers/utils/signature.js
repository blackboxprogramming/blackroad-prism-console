export async function verifySignature({ payload, secret, timestamp, signature }) {
  if (!payload || !secret || !timestamp || !signature) {
    return false;
  }
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const data = encoder.encode(`${timestamp}.${payload}`);
  const buffer = await crypto.subtle.sign('HMAC', cryptoKey, data);
  const digest = Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
  return digest === signature.toLowerCase();
}
