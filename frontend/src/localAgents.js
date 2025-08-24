// Utilities for managing local WebAssembly agents stored in IndexedDB
// Provides spawn/kill helpers and listing for unified agent view

const DB_NAME = 'prism';
const STORE = 'agents';
const instances = new Map();

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE, { keyPath: 'id' });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function withStore(mode, fn) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, mode);
    const store = tx.objectStore(STORE);
    const request = fn(store);
    tx.oncomplete = () => resolve(request.result);
    tx.onerror = () => reject(tx.error);
  });
}

export async function getLocalAgents() {
  return withStore('readonly', store => store.getAll());
}

export async function saveLocalAgent(agent) {
  await withStore('readwrite', store => store.put(agent));
}

export async function deleteLocalAgent(id) {
  await withStore('readwrite', store => store.delete(id));
  instances.delete(id);
}

export async function spawnLocalAgent(id, wasmUrl) {
  const res = await fetch(wasmUrl);
  const module = await WebAssembly.instantiateStreaming(res, {});
  instances.set(id, module);
  const agent = { id, name: id, status: 'running', wasmUrl, location: 'local' };
  await saveLocalAgent(agent);
  return agent;
}

export function killLocalAgent(id) {
  instances.delete(id);
  return deleteLocalAgent(id);
}
