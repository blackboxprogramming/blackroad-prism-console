import crypto from 'crypto';

export function redactAccountNo(accountNo: string): string {
  if (accountNo.length <= 4) {
    return '*'.repeat(accountNo.length);
  }
  return `${'*'.repeat(accountNo.length - 4)}${accountNo.slice(-4)}`;
}

export function hashBuffer(buffer: Buffer): string {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}
