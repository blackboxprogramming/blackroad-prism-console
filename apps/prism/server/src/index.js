import { createServer } from './server.js';

const PORT = Number.parseInt(process.env.PORT ?? '3050', 10);
const app = createServer();

app.listen(PORT, () => {
  console.log(`prism conductor listening on :${PORT}`);
});
