import crypto from 'node:crypto';
import fetch from 'node-fetch';

const provider = process.env.KMS_PROVIDER || 'local';
const keyId    = process.env.KMS_KEY_ID || 'local-key';
const region   = process.env.KMS_REGION || 'us-east-1';

function aesEncrypt(plaintext: Buffer, dataKey: Buffer) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', dataKey, iv);
  const enc = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, enc]);
}
function aesDecrypt(blob: Buffer, dataKey: Buffer) {
  const iv = blob.subarray(0,12);
  const tag = blob.subarray(12,28);
  const enc = blob.subarray(28);
  const decipher = crypto.createDecipheriv('aes-256-gcm', dataKey, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(enc), decipher.final()]);
}

async function kmsWrap(dataKey: Buffer) {
  if (provider === 'aws') {
    // Placeholder: call AWS KMS Encrypt API via a gateway you control
    return Buffer.from(`KMS:${keyId}:`).toString('base64') + dataKey.toString('base64');
  }
  return Buffer.from(`LOCAL:`).toString('base64') + dataKey.toString('base64');
}
async function kmsUnwrap(wrapped: string) {
  if (wrapped.startsWith(Buffer.from('KMS:').toString('base64'))) {
    // Placeholder: call AWS KMS Decrypt API
    const raw = Buffer.from(wrapped.replace(/^.+?:/,'')||'', 'base64');
    return raw;
  }
  const raw = Buffer.from(wrapped.replace(/^.+?:/,'')||'', 'base64');
  return raw;
}

export async function encryptBlob(plaintext: Buffer) {
  const dataKey = crypto.randomBytes(32);
  const wrapped = await kmsWrap(dataKey);
  const cipher  = aesEncrypt(plaintext, dataKey);
  return { wrappedKey: wrapped, blob: cipher.toString('base64') };
}

export async function decryptBlob(wrappedKey: string, blobB64: string) {
  const dataKey = await kmsUnwrap(wrappedKey);
  const plain = aesDecrypt(Buffer.from(blobB64, 'base64'), dataKey);
  return plain;
}
