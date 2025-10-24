import crypto from 'crypto';

export interface VerifyOptions {
  toleranceSeconds?: number;
}

export function signPayload(body: string, secret: string, timestamp: number): string {
  return crypto.createHmac('sha256', secret).update(`${timestamp}.${body}`).digest('hex');
}

export function verifySignature(
  body: string,
  secret: string,
  signature: string,
  timestamp: number,
  options: VerifyOptions = {}
): boolean {
  const tolerance = options.toleranceSeconds ?? 300;
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - timestamp) > tolerance) {
    return false;
  }

  const expected = signPayload(body, secret, timestamp);
  const expectedBuffer = Buffer.from(expected, 'hex');
  const signatureBuffer = Buffer.from(signature, 'hex');

  if (expectedBuffer.length !== signatureBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(expectedBuffer, signatureBuffer);
}
