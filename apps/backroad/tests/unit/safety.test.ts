import { describe, expect, it } from 'vitest';
import { evaluatePostSafety } from '@/lib/safety';

describe('evaluatePostSafety', () => {
  it('detects PII', () => {
    const result = evaluatePostSafety('email me at ember@example.com');
    expect(result.flags.some((flag) => flag.code === 'pii')).toBe(true);
  });

  it('detects abuse keywords', () => {
    const result = evaluatePostSafety('This reads like a threat.');
    expect(result.flags.some((flag) => flag.code === 'abuse')).toBe(true);
  });
});
