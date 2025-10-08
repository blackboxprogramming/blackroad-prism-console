import { sdk } from '../otel.js';

await sdk.start();

const { startServer } = await import('./server.js');

await startServer();
