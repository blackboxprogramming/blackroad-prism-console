'use strict';

const { LUCIDIA_LLM_URL } = require('../config');

async function chat(messages) {
  // Try local LLM first
  try {
    const rsp = await fetch(LUCIDIA_LLM_URL.replace(/\/$/, '') + '/chat', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ messages })
    });
    if (rsp.ok) {
      const json = await rsp.json();
      return { provider: 'lucidia-llm', ...json };
    }
  } catch (e) {
    // fall through to stub
  }
  // Fallback stub
  const content = stubReply(messages);
  return { provider: 'stub', choices: [{ role: 'assistant', content }] };
}

function stubReply(messages) {
  const last = messages[messages.length - 1];
  const prompt = last && last.content ? last.content : '(no content)';
  return `LLM offline. Echo: ${prompt}`;
}

module.exports = { chat };
