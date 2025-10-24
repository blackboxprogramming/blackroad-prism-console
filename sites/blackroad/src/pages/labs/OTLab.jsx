import React, { useMemo } from 'react';
import ArtifactViewer from '../../components/ArtifactViewer/index.jsx';
import ChatPanel from '../../components/ChatPanel/index.jsx';

const SAMPLE_ARTIFACTS = [
  {
    id: 'ot-map',
    kind: 'image',
    name: 'Transport Map',
    url: '/static/labs/ot/map.png',
    downloadUrl: '/static/labs/ot/map.png',
    caption: 'Optimal transport geodesic at τ = 0.45.',
  },
  {
    id: 'ot-cost',
    kind: 'table',
    name: 'Cost Matrix (excerpt)',
    rows: [
      ['Source', 'Target', 'Cost'],
      ['μ₁', 'ν₁', '0.19'],
      ['μ₂', 'ν₂', '0.23'],
      ['μ₃', 'ν₃', '0.28'],
    ],
  },
];

const SAMPLE_MESSAGES = [
  {
    id: 'ot-msg-1',
    jobId: 'ot-lab-demo',
    author: 'Transporter',
    role: 'agent',
    ts: '2025-01-15T12:05:00.000Z',
    text: 'Rebalanced plan pushed to production bucket.',
    reactions: { '📈': 2 },
    attachments: [{ kind: 'json', url: '/static/labs/ot/plan.json' }],
    redactions: [],
  },
];

export default function OTLab() {
  const artifacts = useMemo(() => SAMPLE_ARTIFACTS, []);
  const messages = useMemo(() => SAMPLE_MESSAGES, []);
  const jobId = 'ot-lab-demo';

  return (
    <div className="grid gap-6 p-6 lg:grid-cols-[1.2fr_1fr]">
      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h1 className="text-xl font-semibold text-slate-900">Optimal Transport Lab</h1>
        <p className="mt-2 text-sm text-slate-600">
          Analyze transport plans and collaborate with the optimization agent.
        </p>
        <ArtifactViewer jobId={jobId} artifacts={artifacts} />
      </section>
      <ChatPanel jobId={jobId} protocol="graphql" initialMessages={messages} />
    </div>
  );
}
