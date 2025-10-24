# Display & Chat Surfaces

The display and chat stack gives operators a single canvas to inspect long-running jobs, replay artifacts, and collaborate with agents. The feature is composed of three layers:

1. **obs-gateway** — provides the GraphQL schema, REST fallbacks, and SSE transport.
2. **chat-sdk** — a thin browser/client helper that normalises reconnect, posting, and thread fetching.
3. **ArtifactViewer** and **ChatPanel** — React components embedded throughout the BlackRoad site.

## Quickstart

1. Add the gateway routes to your API service:

   ```ts
   import express from 'express';
   import { streamChat } from '@blackroad/obs-gateway';

   const app = express();
   app.get('/events/stream', (req, res) => streamChat(req, res));
   ```

2. Mount the GraphQL resolvers (`typeDefs` + `resolvers`) in your Apollo or Yoga server.

3. On the client, connect the chat SDK and render the viewer/panel pair:

   ```jsx
   import { connect } from '@blackroad/chat-sdk';
   import ArtifactViewer from '@/components/ArtifactViewer';
   import ChatPanel from '@/components/ChatPanel';

   const client = connect({ jobId, baseUrl: '/api' });
   ```

## Slack mirroring

Set `SLACK_BOT_TOKEN` and `SLACK_CHANNEL_ID` for the gateway process. Messages are mirrored with redactions applied and the first three attachments surfaced as rich links. Attachments over 5 MB should be dropped at the caller level before posting.

## Testing

- `npm test -- chat-sdk` runs the SSE reconnect suite.
- `npm --prefix sites/blackroad run test:ui` runs the component goldens.

## Screenshots

Screenshots live in `docs/assets/display-chat/*.png`. Update them whenever the layout or theming changes.
