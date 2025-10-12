import test from 'node:test';
import assert from 'node:assert/strict';
import { planPerformance } from '../src/planner.js';

const SAMPLE = {
  bpm: 122,
  time: '4/4',
  quant: '1/16',
  voice: 'warm',
  seq: [
    { t: 'We', pace: 1.0, emph: 0.0, pitch: 0, beat: '@1:1:1', overlay: 'cap:soft' },
    { t: 'really', pace: 0.85, emph: 0.35, pitch: 2, beat: '@1:1:3', overlay: 'cap:glow', gesture: 'browUp' },
    { t: 'need', pace: 0.92, emph: 0.18, pitch: 1, beat: '@1:2:1' },
    { t: 'this', pace: 0.9, emph: 0.17, pitch: 1, beat: '@1:2:2', gesture: 'handBeat' },
    { t: 'to', pace: 1.0, emph: 0.0, pitch: 0, beat: '@1:2:3' },
    { t: 'land', pace: 0.96, emph: 0.08, pitch: 0, beat: '@1:3:1' },
    { t: 'clearly.', pace: 0.86, emph: 0.22, pitch: 2, beat: '@1:3:3', overlay: 'cap:glow', gesture: 'microZoom' }
  ],
  post: [
    { kind: 'pause', ms: 140, beat: '@1:4:1' },
    { kind: 'stinger', type: 'hit', dur_ms: 120, beat: '@1:4:3', overlay: 'lower-third:flash' }
  ]
};

test('planPerformance returns SSML and scheduling metadata', async () => {
  const plan = await planPerformance(SAMPLE);
  assert.ok(plan.ssml.includes('<speak>'));
  assert.ok(plan.ssml.includes('<voice name="warm">'));
  assert.equal(plan.sequence.length, SAMPLE.seq.length);
  assert.equal(plan.obs.captions.length >= SAMPLE.seq.length, true);
  const emphasised = plan.sequence[1];
  assert.equal(emphasised.breakMs >= 100, true);
  assert.equal(emphasised.duckDb < 0, true);
  assert.equal(plan.postEvents.length, 2);
  const stinger = plan.postEvents[1];
  assert.equal(stinger.overlay, 'lower-third:flash');
  assert.equal(plan.meta.bpm, 122);
  assert.ok(plan.meta.estimatedDurationMs > 0);
});

test('planPerformance rejects invalid payloads', async () => {
  await assert.rejects(() => planPerformance({}), /bpm must be a number/);
});
