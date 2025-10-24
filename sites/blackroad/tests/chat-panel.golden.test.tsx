import { describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';

const SAMPLE_MESSAGES = [
  {
    id: 'chat-1',
    jobId: 'demo',
    author: 'Operator',
    role: 'user',
    ts: '2025-01-15T12:00:00.000Z',
    text: 'Init job run /rerun',
    reactions: { '👍': 1 },
    attachments: [],
    redactions: [],
  },
  {
    id: 'chat-2',
    jobId: 'demo',
    author: 'Agent',
    role: 'agent',
    ts: '2025-01-15T12:05:00.000Z',
    text: 'Run completed, artifact ready.',
    reactions: {},
    attachments: [{ kind: 'image', url: '/static/frame1.png' }],
    redactions: [],
  },
];

vi.mock('@blackroad/chat-sdk', () => ({
  connect: () => ({
    protocol: 'sse',
    subscribe: () => () => {},
    fetchThread: async () => SAMPLE_MESSAGES,
    post: async () => SAMPLE_MESSAGES[0],
    close: () => {},
  }),
}));

import ChatPanel from '../src/components/ChatPanel/index.jsx';

describe('ChatPanel', () => {
  it('renders message feed with composer', async () => {
    const { container, findByText } = render(
      <ChatPanel jobId="demo" protocol="sse" initialMessages={SAMPLE_MESSAGES} permissions={{ canPost: true }} />,
    );

    await findByText('Run completed, artifact ready.');

    expect(container.firstChild).toMatchSnapshot();
  });
});
