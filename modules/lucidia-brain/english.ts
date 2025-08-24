<!-- FILE: /srv/blackroad-api/modules/lucidia-brain/english.ts -->
const { logContradiction } = require('./contradictions');

const intentWords = {
  ask: ['?', 'what', 'why', 'how'],
  build: ['build', 'create', 'make'],
  recall: ['remember', 'recall'],
  plan: ['plan', 'schedule'],
  define: ['define', 'explain']
};

const emotionWords = {
  love: ['love', 'like'],
  anger: ['hate', 'angry'],
  joy: ['happy', 'glad'],
  sad: ['sad']
};

function parse(text, session_id, flags = {}) {
  if (!text || !text.trim()) {
    logContradiction(session_id, 'Ψ′_TRUTH', 'block', 'empty message');
    if (!flags.allowUnparsed) throw new Error('unparsed');
    return { intents: [], entities: [], constraints: [], emotions: [], tokens: 0 };
  }
  const tokens = text.trim().split(/\s+/);
  const intents = [];
  for (const [intent, words] of Object.entries(intentWords)) {
    if (tokens.some(t => words.includes(t.toLowerCase()))) intents.push(intent);
  }
  const entities = [];
  const m = text.match(/"([^"]+)"/g);
  if (m) m.forEach(e => entities.push(e.replace(/"/g, '')));
  const constraints = tokens.filter(t => ['must', 'never', 'only'].includes(t.toLowerCase()));
  const emotions = [];
  for (const [emo, words] of Object.entries(emotionWords)) {
    if (tokens.some(t => words.includes(t.toLowerCase()))) emotions.push(emo);
  }
  return { intents, entities, constraints, emotions, tokens: tokens.length };
}

module.exports = { parse };
