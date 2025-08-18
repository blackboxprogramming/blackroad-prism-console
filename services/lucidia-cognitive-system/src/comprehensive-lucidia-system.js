import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import pino from 'pino';

const log = pino();
const app = express();

app.use(helmet());
app.use(compression());
app.use(express.json({ limit: '1mb' }));
app.use(morgan('tiny'));

app.get('/health', (_req, res) => res.json({ ok: true }));
app.get('/ready', (_req, res) => res.status(200).send('OK'));
app.get('/live', (_req, res) => res.status(200).send('OK'));

app.get('/', (_req, res) => {
  res.json({
    name: 'lucidia-cognitive-system',
    status: 'online',
    logic: ['binary', 'trinary', '42-state'],
  });
});

const PORT = Number(process.env.PORT) || 8000;
app.listen(PORT, () => log.info({ port: PORT }, 'Lucidia system listening'));
