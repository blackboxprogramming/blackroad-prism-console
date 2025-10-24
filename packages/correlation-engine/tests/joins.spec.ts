import test from 'node:test';
import assert from 'node:assert/strict';
import { createEnvelope } from '../../obs-mesh/src/envelope';
import { CorrelationEngine } from '../src';

test('joins release and incident notes', () => {
  const engine = new CorrelationEngine();
  engine.ingest(
    createEnvelope({
      ts: '2024-01-01T00:00:00Z',
      source: 'audit',
      service: 'deploy',
      kind: 'audit',
      releaseId: 'rel-1',
      attrs: { action: 'deploy.create' },
    }),
  );
  engine.ingest(
    createEnvelope({
      ts: '2024-01-01T00:05:00Z',
      source: 'gateway',
      service: 'incident',
      kind: 'log',
      releaseId: 'rel-1',
      attrs: { route: '/incidents' },
    }),
  );

  const result = engine.correlate('rel-1', 'releaseId');
  assert.ok(result.notes.includes('Release rel-1 aligns with an incident window; review error rates.'));
  assert.equal(result.timeline.length, 2);
});

test('captures caption latency regressions', () => {
  const engine = new CorrelationEngine();
  engine.ingest(
    createEnvelope({
      ts: '2024-02-01T00:00:00Z',
      source: 'media',
      service: 'captioner',
      kind: 'job',
      assetId: 'asset-1',
      releaseId: 'rel-2',
      attrs: { durationMs: 1200 },
    }),
  );
  engine.ingest(
    createEnvelope({
      ts: '2024-02-01T00:01:00Z',
      source: 'media',
      service: 'captioner',
      kind: 'job',
      assetId: 'asset-1',
      attrs: { durationMs: 800 },
    }),
  );

  const result = engine.correlate('asset-1', 'assetId');
  assert.ok(result.notes.some((note) => note.includes('Latency regression')));
});
