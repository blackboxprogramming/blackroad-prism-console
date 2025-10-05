// FILE: /srv/blackroad-api/server_full.js
'use strict';

require('dotenv').config();
const path = require('path');
const fs = require('fs');
const http = require('http');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const cookieSession = require('cookie-session');
const rateLimit = require('express-rate-limit');

// Allow requiring .ts files as plain JS for lucidia brain modules
require.extensions['.ts'] = require.extensions['.js'];
const {
  PORT,
  NODE_ENV,
  ALLOWED_ORIGIN,
  LOG_DIR,
  SESSION_SECRET,
  ROADVIEW_STORAGE
} = require('./src/config');
const subscribe = require('./src/routes/subscribe');

// Ensure log dir exists
if (LOG_DIR) {
  try {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  } catch {}
}

const app = express();
app.set('trust proxy', 1); // behind NGINX

// HTTP security headers
app.use(helmet());

// CORS (adjust as needed)
const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true); // allow curl / same-origin
    if (!ALLOWED_ORIGIN || origin === ALLOWED_ORIGIN) return callback(null, true);
    return callback(new Error('Not allowed by CORS'), false);
  },
  credentials: true
};
app.use(cors(corsOptions));

// Logging
app.use(morgan('combined'));

// Stripe webhook needs raw body
app.post('/api/stripe/webhook', express.raw({ type: 'application/json' }), subscribe.webhookHandler);

// Body parsing
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: false }));

// Sessions
if (!SESSION_SECRET || SESSION_SECRET === 'change-this-session-secret') {
  console.warn('[WARN] Weak or default SESSION_SECRET detected. Update your .env!');
}
app.use(cookieSession({
  name: 'brsid',
  secret: SESSION_SECRET || 'dev-session-secret',
  httpOnly: true,
  sameSite: 'lax',
  secure: NODE_ENV === 'production',
  maxAge: 1000 * 60 * 60 * 24 * 7 // 7 days
}));

// Rate limiting (global)
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false
});
app.use(limiter);

// Initialize DB (auto-migrations on import)
const db = require('./src/db');

// ROADVIEW
const ROADVIEW_PROJECTS_DIR = path.join(ROADVIEW_STORAGE, 'projects');
try {
  fs.mkdirSync(ROADVIEW_PROJECTS_DIR, { recursive: true });
} catch (err) {
  console.error(
    `Failed to ensure RoadView projects directory at ${ROADVIEW_PROJECTS_DIR}`,
    err
  );
}
app.use(
  '/files/roadview',
  express.static(ROADVIEW_STORAGE, { index: false, fallthrough: false })
);

// Routes
const apiRouter = require('./src/routes');
app.use('/api', apiRouter);

// MCI routes
const mciRouter = require('./srv/blackroad-api/mci/routes/mci.routes');
app.use('/api/mci', mciRouter);
// Lucidia Brain routes
if (process.env.ENABLE_LUCIDIA_BRAIN !== '0') {
  app.use('/api/lucidia/brain', require('./routes/lucidia-brain'));
}

// Root
app.get('/', (req, res) => {
  res.status(200).json({ ok: true, service: 'blackroad-api', env: NODE_ENV || 'dev' });
});

// HTTP server + Socket.IO
const server = http.createServer(app);
const { setupSockets } = require('./src/socket');
setupSockets(server);

server.listen(PORT, () => {
  console.log(`[blackroad-api] listening on port ${PORT} (env: ${NODE_ENV})`);
});
