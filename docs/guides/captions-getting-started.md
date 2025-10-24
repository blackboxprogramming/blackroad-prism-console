# Getting Started with RoadStudio Captions

This guide shows how to run the captioning MVP locally, generate SRT/VTT artefacts, and inspect progress via GraphQL and the CLI.

## Prerequisites

- Node.js 20+
- `pnpm` or `npm`
- Sample media asset (an audio or video file)

## 1. Install dependencies

```bash
pnpm install
pnpm --filter @blackroad/captioner build
pnpm --filter @blackroad/media-gateway build
```

## 2. Launch the media gateway

```bash
node -e "const { createCaptionGateway } = require('@blackroad/media-gateway'); const gateway = createCaptionGateway(); console.log('Caption gateway ready', gateway.typeDefs.split('\n')[0]);"
```

The sample above instantiates the in-memory queue and logs that the schema is loaded. Wire this into your preferred GraphQL HTTP server (Apollo, Yoga, etc.) and register the `captionCreate`, `captionJob`, and `captionEvents` resolvers.

## 3. Create a job via the CLI

```bash
pnpm --filter blackroadctl build
BLACKROADCTL_ROLE=operator CONTROL_PLANE_ENDPOINT=http://localhost:4100/graphql \
  blackroadctl media caption-create --asset asset-123 --file ./sample.wav --backend local
```

You should see a JSON response with the queued job ID. Re-run with `--backend provider` to exercise the HTTP adapter (point `PROVIDER_STT_URL` at a mock service during development).

## 4. Watch job status

```bash
blackroadctl media caption-status --job <job-id> --watch
```

The watcher polls the control plane SDK and prints state transitions until the job reaches a terminal state.

## 5. Preview captions in RoadStudio

Open the RoadStudio asset page and select the **Captions** panel. Upload a file, kick off a job, and use the preview component to inspect generated cues before downloading the SRT or VTT artefacts.

If you need a lightweight SDK instance for the panel, wire it up with the helper exported from `@blackroad/control-plane-sdk`:

```ts
import { createCaptionsSdk } from '@blackroad/control-plane-sdk';

const sdk = {
  captions: createCaptionsSdk({
    endpoint: process.env.CONTROL_PLANE_ENDPOINT!,
    token: window.localStorage.getItem('controlPlaneToken') || undefined
  })
};
```

Pass the `sdk` object to `<CaptionPanel assetId="..." sdk={sdk} />` to enable the upload form and polling loop.

## Troubleshooting

- **Provider failures** — Check that `PROVIDER_STT_URL` is reachable and returning JSON with `chunks`.
- **Permission errors** — Ensure your CLI role includes `caption:write` capability.
- **Golden mismatch** — Run `pnpm --filter @blackroad/captioner test` to update golden artefacts only after verifying intentional changes.
