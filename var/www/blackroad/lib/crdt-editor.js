import * as Y from '/lib/yjs.mjs';
import { WebsocketProvider } from '/lib/y-websocket.js';

const $ = (id) => document.getElementById(id);
let doc, ytext, provider;

function bindTextarea(textarea, ytext) {
  // naive binding: replace full content on remote updates; local edits push diffs
  let applyingRemote = false;

  // Remote → UI
  const updateUi = () => {
    applyingRemote = true;
    textarea.value = ytext.toString();
    applyingRemote = false;
  };
  ytext.observe(updateUi);
  updateUi();

  // UI → CRDT
  textarea.addEventListener('input', () => {
    if (applyingRemote) return;
    const oldStr = ytext.toString();
    const newStr = textarea.value;
    // compute minimal diff (very simple LCS-like slice)
    let start = 0;
    while (start < oldStr.length && start < newStr.length && oldStr[start] === newStr[start]) start++;
    let endOld = oldStr.length - 1,
      endNew = newStr.length - 1;
    while (endOld >= start && endNew >= start && oldStr[endOld] === newStr[endNew]) {
      endOld--;
      endNew--;
    }
    // apply change
    ytext.delete(start, endOld - start + 1 > 0 ? endOld - start + 1 : 0);
    ytext.insert(start, newStr.slice(start, endNew + 1));
  });

  // Presence: local caret index via awareness
  textarea.addEventListener('keyup', updateCursor);
  textarea.addEventListener('click', updateCursor);
  function updateCursor() {
    const pos = textarea.selectionStart || 0;
    provider.awareness.setLocalStateField('cursor', { index: pos });
  }
}

function renderPeers(awareness) {
  const peersEl = $('peers');
  const states = Array.from(awareness.getStates().values());
  peersEl.innerHTML = states
    .map((s) => {
      const name = s.user?.name || 'anon';
      const color = s.user?.color || '#0096FF';
      const idx = s.cursor?.index ?? null;
      return `<li><b style="color:${color}">●</b> ${name} ${idx !== null ? `<small>@${idx}</small>` : ''}</li>`;
    })
    .join('');
}

$('join').onclick = () => {
  // clean up prior doc/provider if any
  try {
    provider?.destroy();
  } catch {}
  doc = new Y.Doc();
  ytext = doc.getText('text');

  // Same-origin websocket via Nginx: wss://blackroad.io/yjs
  const room = $('room').value || 'blackroad-notes';
  const url = (location.protocol === 'https:' ? 'wss://' : 'ws://') + location.host + '/yjs';
  provider = new WebsocketProvider(url, room, doc);

  // Awareness
  const color = '#' + Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0');
  provider.awareness.setLocalStateField('user', { name: $('name').value || 'anon', color });
  provider.awareness.on('change', () => renderPeers(provider.awareness));

  // Bind textarea
  bindTextarea($('editor'), ytext);
};
