import { differenceInMilliseconds, parseISO } from 'date-fns';

export const defaultDelayMs = 1000 * 60 * 60 * 3; // 3 hours

export function toIsoString(timestamp: number): string {
  return new Date(timestamp).toISOString();
}

export function calculateRoomProgress(expiresAt: string): number {
  const now = Date.now();
  const expiry = parseISO(expiresAt).getTime();
  const created = expiry - 1000 * 60 * 60 * 12;
  const total = expiry - created;
  const elapsed = Math.min(Math.max(now - created, 0), total);
  return total === 0 ? 1 : elapsed / total;
}

export function minutesBetween(start: string, end: string): number {
  return Math.abs(differenceInMilliseconds(parseISO(end), parseISO(start)) / (1000 * 60));
}
