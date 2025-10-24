import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import ArtifactViewer from '../src/components/ArtifactViewer/index.jsx';

const ARTIFACTS = [
  {
    id: 'art-1',
    kind: 'image',
    name: 'Frame 1',
    url: '/static/frame1.png',
    downloadUrl: '/static/frame1.png',
  },
  {
    id: 'art-2',
    kind: 'table',
    name: 'Metrics',
    rows: [
      ['Metric', 'Value'],
      ['Loss', '0.018'],
      ['Drift', '0.002'],
    ],
  },
  {
    id: 'art-3',
    kind: 'json',
    name: 'Config',
    json: { learningRate: 0.001, schedule: 'cosine' },
  },
];

describe('ArtifactViewer', () => {
  it('renders deterministic artifact layout', () => {
    const { container } = render(<ArtifactViewer jobId="demo" artifacts={ARTIFACTS} />);
    expect(container.firstChild).toMatchSnapshot();
  });
});
