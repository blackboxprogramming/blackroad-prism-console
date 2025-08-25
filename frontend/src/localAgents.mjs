// Utilities for managing local WebAssembly agents with sandboxed APIs
// Provides spawn/kill helpers, IPC messaging and persistence in IndexedDB

const DB_NAME = 'prism';
const STORE = 'agents';
const AGENT_TABLE = new Map();
const memoryDB = new Map();
const encoder = new TextEncoder();
const decoder = new TextDecoder();

function appendStore(key, msg) {
  if (typeof localStorage === 'undefined') return;
  const data = JSON.parse(localStorage.getItem(key) || '[]');
  data.push(msg);
  localStorage.setItem(key, JSON.stringify(data));
}

function openDB() {
  if (typeof indexedDB === 'undefined') {
    return Promise.resolve(null);
  }
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE, { keyPath: 'id' });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function getAllRaw() {
  if (typeof indexedDB === 'undefined') {
    return Array.from(memoryDB.values());
  }
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const store = tx.objectStore(STORE);
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function saveLocalAgent(agent) {
  if (typeof indexedDB === 'undefined') {
    memoryDB.set(agent.id, agent);
    return;
  }
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(agent);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function deleteLocalAgent(id) {
  AGENT_TABLE.delete(id);
  if (typeof indexedDB === 'undefined') {
    memoryDB.delete(id);
    return;
  }
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getLocalAgents() {
  const all = await getAllRaw();
  return all.map(a => ({ id: a.id, name: a.id, status: 'running', wasmUrl: a.manifest.wasm, location: 'local' }));
}

export async function restoreAgents() {
  const all = await getAllRaw();
  for (const a of all) {
    const wasm = new Uint8Array(a.wasm);
    await loadAgent(a.manifest, wasm);
  }
}

export function clearAgents() {
  AGENT_TABLE.clear();
}

export async function loadAgent(manifest, wasmBinary) {
  const name = manifest.name;
  const inbox = [];
  const outbox = [];
  const logs = [];
  let memory;
  const imports = {
    prism: {
      prism_log(ptr, len) {
        const bytes = new Uint8Array(memory.buffer, ptr, len);
        const msg = decoder.decode(bytes.slice(0, len));
        logs.push(msg);
        appendStore(`/prism/logs/${name}`, msg);
      },
      prism_send(ptr, len) {
        const bytes = new Uint8Array(memory.buffer, ptr, len);
        const msg = decoder.decode(bytes.slice(0, len));
        outbox.push(msg);
        appendStore(`/prism/ipc/${name}`, msg);
      },
      prism_recv(ptr, len) {
        if (inbox.length === 0) return 0;
        const msg = inbox.shift();
        const bytes = encoder.encode(msg);
        const view = new Uint8Array(memory.buffer, ptr, len);
        view.set(bytes.slice(0, len));
        return bytes.length;
      }
    }
  };
  const { instance } = await WebAssembly.instantiate(wasmBinary, imports);
  memory = instance.exports.memory;
  AGENT_TABLE.set(name, { manifest, instance, memory, inbox, outbox, logs });
  return name;
}

export function sendMessage(agent, msg) {
  const rt = AGENT_TABLE.get(agent);
  if (!rt) return;
  rt.inbox.push(msg);
  appendStore(`/prism/ipc/${agent}`, msg);
  if (rt.instance.exports.handle) {
    try {
      rt.instance.exports.handle();
    } catch (e) {
      appendStore(`/prism/logs/${agent}`, `crash: ${e.message}`);
    }
  }
}

export function recvMessage(agent) {
  const rt = AGENT_TABLE.get(agent);
  if (!rt) return null;
  return rt.outbox.shift() || null;
}

export async function spawnLocalAgent(manifestUrl) {
  const res = await fetch(manifestUrl);
  const manifest = await res.json();
  const wasmRes = await fetch(manifest.wasm);
  const wasmBuf = await wasmRes.arrayBuffer();
  await loadAgent(manifest, wasmBuf);
  await saveLocalAgent({ id: manifest.name, manifest, wasm: Array.from(new Uint8Array(wasmBuf)) });
  return { id: manifest.name, name: manifest.name, status: 'running', wasmUrl: manifest.wasm, location: 'local' };
}

export function killLocalAgent(id) {
  AGENT_TABLE.delete(id);
  return deleteLocalAgent(id);
}
