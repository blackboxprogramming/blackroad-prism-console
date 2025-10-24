import test from 'node:test';
import assert from 'node:assert/strict';
import { createEnvelope, EVENT_SCHEMA_VERSION, mergeAttributes, normalizeTimestamp } from '../src/envelope';

test('normalizes timestamps and enforces schema', () => {
  const envelope = createEnvelope({
    ts: '2024-04-12T00:00:00Z',
    source: 'otel',
    service: 'control-plane-gateway',
    kind: 'span',
    attrs: { foo: 'bar' },
  });

  assert.equal(envelope.ts, '2024-04-12T00:00:00.000Z');
  assert.equal(envelope.schemaVersion, EVENT_SCHEMA_VERSION);
});

test('merges attributes without mutating original', () => {
  const envelope = createEnvelope({
    ts: Date.now(),
    source: 'audit',
    service: 'authz',
    kind: 'audit',
    attrs: { actor: 'user-1' },
  });

  const merged = mergeAttributes(envelope, { target: 'release-1' });

  assert.deepEqual(merged.attrs, { actor: 'user-1', target: 'release-1' });
  assert.deepEqual(envelope.attrs, { actor: 'user-1' });
});

test('coerces numeric timestamps to ISO strings', () => {
  const now = Date.now();
  const iso = normalizeTimestamp(now);
  assert.match(iso, /Z$/);
});
