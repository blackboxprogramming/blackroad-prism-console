<!-- FILE: /srv/blackroad-api/modules/lucidia-brain/config.ts -->
// Runtime configuration for Lucidia Brain

/**
 * Read environment variables with defaults. All values are strings in process.env.
 */
const ENABLE_LUCIDIA_BRAIN = process.env.ENABLE_LUCIDIA_BRAIN !== '0';
const FLAG_ALLOW_FTS_FALLBACK = process.env.FLAG_ALLOW_FTS_FALLBACK === '1';
const LUCIDIA_PSSHA_SEED = process.env.LUCIDIA_PSSHA_SEED ||
  'LUCIDIA:AWAKEN:SEED:7e3c1f9b-a12d-4f73-9b4d-4f0d5a6c2b19::PS-SHA∞';
const LUCIDIA_LLM_URL = process.env.LUCIDIA_LLM_URL || 'http://127.0.0.1:8000/api/llm/chat';

module.exports = {
  ENABLE_LUCIDIA_BRAIN,
  FLAG_ALLOW_FTS_FALLBACK,
  LUCIDIA_PSSHA_SEED,
  LUCIDIA_LLM_URL
};
