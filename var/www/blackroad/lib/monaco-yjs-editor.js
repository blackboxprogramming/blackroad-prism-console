import * as Y from '/lib/yjs.mjs';
import { WebsocketProvider } from '/lib/y-websocket.js';
import { MonacoBinding } from '/lib/y-monaco.js';

// --- Dual-room diff: open branch "B" alongside current --- //
export async function openDiff(roomA, roomB, language='javascript'){
  const url = (location.protocol==='https:'?'wss://':'ws://') + location.host + '/yjs';
  // A (current)
  const docA = new Y.Doc(), yA = docA.getText('monaco');
  const pA = new WebsocketProvider(url, roomA, docA);
  // B (alt)
  const docB = new Y.Doc(), yB = docB.getText('monaco');
  const pB = new WebsocketProvider(url, roomB, docB);

  const modelA = monaco.editor.createModel(yA.toString(), language);
  const modelB = monaco.editor.createModel(yB.toString(), language);
  new MonacoBinding(yA, modelA, new Set(), pA.awareness);
  new MonacoBinding(yB, modelB, new Set(), pB.awareness);

  const node = document.getElementById('editor');
  node.innerHTML = ''; // clear existing
  const diff = monaco.editor.createDiffEditor(node, { theme:'vs-dark', renderSideBySide:true, automaticLayout:true });
  diff.setModel({ original: modelA, modified: modelB });
  return { dispose:()=>diff.dispose(), modelA, modelB };
}
// usage example (console):
// openDiff('prj:demo-app:/src/app.js', 'prj:demo-app:/src/app.js#proposal-B','javascript')
