import { detectPii } from '@/lib/pii';
import { detectAbuse } from '@/lib/abuse';

export interface SafetyFlag {
  code: string;
  message: string;
}

export interface SafetyResult {
  flags: SafetyFlag[];
}

export function evaluatePostSafety(markdown: string): SafetyResult {
  const flags: SafetyFlag[] = [];
  detectPii(markdown).forEach((message) => flags.push({ code: 'pii', message }));
  detectAbuse(markdown).forEach((message) => flags.push({ code: 'abuse', message }));
  return { flags };
}
