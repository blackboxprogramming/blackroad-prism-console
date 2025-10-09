const { bucket } = require('../packages/flags/hash');
const { isOn } = require('../packages/flags/eval');

describe('bucket', () => {
  test('is deterministic', () => {
    expect(bucket('user-a')).toBe(bucket('user-a'));
    expect(bucket('feature:user-b')).toBe(bucket('feature:user-b'));
  });

  test('stays within 0..99', () => {
    for (let i = 0; i < 100; i += 1) {
      const value = bucket(`seed-${i}`);
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(100);
    }
  });
});

describe('isOn', () => {
  const baseDoc = {
    features: {
      'always.on': { state: 'on' },
      'always.off': { state: 'off' },
      'conditional.percent': { state: 'conditional', percent: 50 },
      'conditional.segment': {
        state: 'conditional',
        percent: 100,
        segments: ['staff'],
      },
      'conditional.window': {
        state: 'conditional',
        percent: 100,
        startAt: new Date(Date.now() - 1_000).toISOString(),
        endAt: new Date(Date.now() + 1_000).toISOString(),
      },
      'conditional.past': {
        state: 'conditional',
        percent: 100,
        endAt: new Date(Date.now() - 5_000).toISOString(),
      },
    },
    segments: {
      staff: ['@blackroad.io', 'alexa@blackroad.io'],
    },
    version: 1,
  };

  test('respects on/off states', () => {
    expect(isOn(baseDoc, 'always.on', {})).toBe(true);
    expect(isOn(baseDoc, 'always.off', {})).toBe(false);
  });

  test('returns false for missing flag', () => {
    expect(isOn(baseDoc, 'missing.flag', {})).toBe(false);
  });

  test('enforces percent rollout', () => {
    const results = new Set();
    for (let i = 0; i < 200; i += 1) {
      const userId = `user-${i}`;
      results.add(isOn(baseDoc, 'conditional.percent', { userId }));
    }
    expect(results.has(true)).toBe(true);
    expect(results.has(false)).toBe(true);
  });

  test('checks segment membership by email and domain', () => {
    expect(
      isOn(baseDoc, 'conditional.segment', { email: 'alexA@blackroad.io' })
    ).toBe(true);
    expect(
      isOn(baseDoc, 'conditional.segment', { email: 'qa@example.com' })
    ).toBe(false);
  });

  test('respects time windows', () => {
    expect(isOn(baseDoc, 'conditional.window', { userId: 'user-1' })).toBe(
      true
    );
    expect(isOn(baseDoc, 'conditional.past', { userId: 'user-1' })).toBe(false);
  });

  test('falls back to reqId when user and email are missing', () => {
    const doc = {
      features: {
        'rollout.req': { state: 'conditional', percent: 100 },
      },
      version: 1,
    };
    expect(isOn(doc, 'rollout.req', { reqId: 'req-123' })).toBe(true);
  });
});
