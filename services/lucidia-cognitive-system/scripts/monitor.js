import pino from 'pino';
const log = pino();
log.info({ ts: Date.now() }, 'Lucidia monitor tick');
// Extend with real metrics as needed
