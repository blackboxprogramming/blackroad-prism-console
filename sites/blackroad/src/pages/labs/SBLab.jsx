import React, { useMemo } from 'react';
import ArtifactViewer from '../../components/ArtifactViewer/index.jsx';
import ChatPanel from '../../components/ChatPanel/index.jsx';

const SAMPLE_ARTIFACTS = [
  {
    id: 'sb-frame-1',
    kind: 'image',
    name: 'Simulation Snapshot',
    url: '/static/labs/sb/frame-001.png',
    downloadUrl: '/static/labs/sb/frame-001.png',
    caption: 'Score-based sampler at step 250.',
  },
  {
    id: 'sb-metrics',
    kind: 'json',
    name: 'Sampler Metrics',
    json: { step: 250, divergence: 0.014, temperature: 0.72 },
  },
];

const SAMPLE_MESSAGES = [
  {
    id: 'msg-1',
    jobId: 'sb-lab-demo',
    author: 'Ops Agent',
    role: 'agent',
    ts: '2025-01-15T12:00:00.000Z',
    text: 'Sampler converged on manifold drift check.',
    reactions: { '👍': 3, '🧪': 1 },
    attachments: [{ kind: 'image', url: '/static/labs/sb/frame-001.png' }],
    redactions: [],
  },
];

export default function SBLab() {
  const artifacts = useMemo(() => SAMPLE_ARTIFACTS, []);
  const messages = useMemo(() => SAMPLE_MESSAGES, []);
  const jobId = 'sb-lab-demo';

  return (
    <div className="grid gap-6 p-6 lg:grid-cols-[1.2fr_1fr]">
      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h1 className="text-xl font-semibold text-slate-900">Score-Based Lab</h1>
        <p className="mt-2 text-sm text-slate-600">
          Monitor sampler health, inspect generated frames, and coordinate reruns with the ops agent.
        </p>
        <ArtifactViewer jobId={jobId} artifacts={artifacts} />
      </section>
      <ChatPanel jobId={jobId} protocol="graphql" initialMessages={messages} />
    </div>
  );
}
