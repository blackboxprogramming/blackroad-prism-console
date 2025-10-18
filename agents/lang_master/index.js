const fs = require('fs');
const path = require('path');

const name = path.basename(__dirname);
const base = path.join(__dirname, '..', '..', 'prism');
const logDir = path.join(base, 'logs');
const contrDir = path.join(base, 'contradictions');

function ensure() {
  fs.mkdirSync(logDir, { recursive: true });
  fs.mkdirSync(contrDir, { recursive: true });
}

function log(msg) {
  ensure();
  fs.appendFileSync(path.join(logDir, `${name}.log`), msg + '\n');
}

function contradiction(detail) {
  ensure();
  fs.writeFileSync(path.join(contrDir, `${name}.json`), JSON.stringify({ detail }));
}

function normalizeSentence(sentence) {
  if (!sentence || !sentence.trim()) {
    return '';
  }
  const trimmed = sentence.trim();
  const capitalized = trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
  const punctuation = /[.!?]$/.test(capitalized) ? '' : '.';
  return capitalized.replace(/\s+/g, ' ') + punctuation;
}

function grammarCheck(text) {
  if (!text || !text.trim()) {
    return { corrected: '', suggestions: ['Provide text to proofread.'] };
  }
  const sentences = text
    .replace(/\n+/g, ' ')
    .split(/(?<=[.!?])\s+/)
    .map(normalizeSentence)
    .filter(Boolean);
  const corrected = sentences.join(' ');
  const suggestions = [];
  if (/[A-Z]{2,}/.test(text)) {
    suggestions.push('Avoid using all caps unless necessary.');
  }
  if (/\s{2,}/.test(text)) {
    suggestions.push('Collapse repeated spaces.');
  }
  return { corrected, suggestions };
}

function enhanceEnglish(text) {
  if (!text || !text.trim()) {
    return 'Please provide content to enhance.';
  }
  const cleaned = normalizeSentence(text);
  return `${cleaned} This version emphasises clarity and a confident tone.`;
}

function buildCodingPlan(goal) {
  const header = goal && goal.trim() ? goal.trim() : 'Implement the requested feature';
  return [
    `Goal: ${header}`,
    '1. Clarify inputs, outputs, and constraints.',
    '2. Design a step-by-step algorithm with test coverage.',
    '3. Implement iteratively, running linting and unit tests.',
    '4. Document design trade-offs and follow-up actions.'
  ].join('\n');
}

function reviewCode(snippet, language = 'unknown') {
  const suggestions = [];
  if (!snippet || !snippet.trim()) {
    return { summary: 'No code supplied for review.', suggestions };
  }
  if (!snippet.includes('test')) {
    suggestions.push('Consider adding automated tests to cover critical paths.');
  }
  if (/console\.log|print\(/.test(snippet)) {
    suggestions.push('Remove debug logging before final commit.');
  }
  if (/TODO/.test(snippet)) {
    suggestions.push('Address remaining TODO items before shipping.');
  }
  return {
    summary: `Preliminary review for ${language} code complete.`,
    suggestions
  };
}

module.exports = {
  name,
  handle(msg) {
    switch (msg.type) {
      case 'ping':
        log('ping');
        return `pong: ${name}`;
      case 'analyze':
        log(`analyze:${msg.path}`);
        return 'analysis complete';
      case 'codegen':
        log(`codegen:${msg.spec}`);
        return `code stub for ${msg.spec}`;
      case 'coding_plan':
        log(`coding_plan:${msg.goal || 'unspecified'}`);
        return buildCodingPlan(msg.goal);
      case 'code_review':
        log(`code_review:${msg.language || 'unknown'}`);
        return reviewCode(msg.snippet, msg.language);
      case 'grammar_check':
        log('grammar_check');
        return grammarCheck(msg.text);
      case 'english_refine':
        log('english_refine');
        return enhanceEnglish(msg.text);
      case 'contradiction':
        contradiction(msg.detail || 'unknown');
        return 'contradiction logged';
      default:
        return 'unknown';
    }
  }
};
