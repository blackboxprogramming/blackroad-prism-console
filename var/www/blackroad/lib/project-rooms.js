import monaco from '/lib/monaco-bind.js';
import * as Y from '/lib/yjs.mjs';
import { WebsocketProvider } from '/lib/y-websocket.js';
import { MonacoBinding } from '/lib/y-monaco.js';

const $ = id => document.getElementById(id);
let KEY = localStorage.getItem('br_origin_key') || '';
let currentProject = null;
let tabs = []; // { path, doc, ytext, provider, editorModel }
let autosaveTimers = new Map(); // path -> timer
const AUTOSAVE_MS = 2000;
const PENDING = JSON.parse(localStorage.getItem('br_autosave_pending')||'{}'); // offline queue

function api(path, opts={}){
  opts.headers = Object.assign({'X-BlackRoad-Key': KEY}, opts.headers||{});
  return fetch(path, opts);
}

async function listProjects(){
  const r = await api('/api/projects'); const arr = await r.json();
  $('proj').innerHTML = arr.map(p=>`<option value="${p.id}">${p.id}</option>`).join('');
}
async function loadProj(){
  currentProject = $('proj').value;
  const r = await api(`/api/projects/${encodeURIComponent(currentProject)}/tree`); const tree = await r.json();
  renderTree(tree);
}
async function createProj(){
  const name=$('newname').value.trim(); if(!name) return;
  await api('/api/projects',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name})});
  listProjects().then(loadProj);
}

function renderTree(nodes){
  const t = $('tree'); t.innerHTML='';
  function item(n, depth=0){
    const li=document.createElement('div');
    li.style.paddingLeft=(depth*12)+'px';
    li.innerHTML = n.type==='dir' ? `📁 ${n.name}` : `📄 ${n.name}`;
    li.onclick=()=> { if(n.type==='file') openFile(n.path); };
    t.appendChild(li);
    (n.children||[]).forEach(c=>item(c, depth+1));
  }
  nodes.forEach(n=>item(n,0));
}

function slugRoom(proj, file){ // room id: prj:<id>:<path>
  return `prj:${proj}:${file}`;
}

function addTab(path, model){
  const tabsEl=$('tabs');
  const el=document.createElement('div'); el.className='tab'; el.textContent=path.split('/').pop();
  el.onclick=()=> switchTab(path);
  tabsEl.appendChild(el);
  tabs.forEach(t=>t.tabEl?.classList.remove('active'));
  const tab = tabs.find(t=>t.path===path); tab.tabEl = el; el.classList.add('active');
}

function switchTab(path){
  const tab = tabs.find(t=>t.path===path);
  if(!tab) return;
  tabs.forEach(t=>t.tabEl?.classList.remove('active')); tab.tabEl?.classList.add('active');
  monaco.editor.setModel(tab.editorModel);
}

async function openFile(path){
  if(!currentProject) return;
  // Already open?
  const exist = tabs.find(t=>t.path===path);
  if (exist) { switchTab(path); return; }

  const doc = new Y.Doc();
  const ytext = doc.getText('monaco');
  const url = (location.protocol==='https:'?'wss://':'ws://') + location.host + '/yjs';
  const room = slugRoom(currentProject, path);
  const provider = new WebsocketProvider(url, room, doc);
  provider.awareness.setLocalStateField('user', { name:'you', color:'#0096FF' });

  // If first load, seed with file contents
  const seed = await (await api(`/api/projects/${encodeURIComponent(currentProject)}/file?path=${encodeURIComponent(path)}`)).text().catch(()=> '');
  if (seed && ytext.length === 0) ytext.insert(0, seed);

  // Create a Monaco model for this file
  const model = monaco.editor.createModel('', detectLanguage(path));
  const binding = new MonacoBinding(ytext, model, new Set([editor]), provider.awareness);

  // AUTOSAVE: watch ytext and throttle PUT
  ytext.observe(()=> {
    // queue to local pending buffer (best-effort)
    PENDING[`${currentProject}:${path}`] = ytext.toString();
    localStorage.setItem('br_autosave_pending', JSON.stringify(PENDING));
    if (autosaveTimers.has(path)) clearTimeout(autosaveTimers.get(path));
    autosaveTimers.set(path, setTimeout(()=> pushAutosave(path), AUTOSAVE_MS));
    $('hint').textContent = '…autosaving';
  });

  // Track tab
  const tab = { path, doc, ytext, provider, editorModel: model, binding };
  tabs.push(tab);
  addTab(path, model);
  monaco.editor.setModel(model);
}

async function pushAutosave(path){
  const key = `${currentProject}:${path}`;
  const text = PENDING[key];
  if (text==null) return;
  try{
    const r = await api(`/api/projects/${encodeURIComponent(currentProject)}/file?path=${encodeURIComponent(path)}`, {
      method:'PUT', body: text
    });
    if (r.ok){
      delete PENDING[key];
      localStorage.setItem('br_autosave_pending', JSON.stringify(PENDING));
      $('hint').textContent = 'Saved.';
    } else {
      $('hint').textContent = 'Autosave failed (will retry).';
    }
  }catch{
    $('hint').textContent = 'Offline (autosave queued).';
  }
}

function detectLanguage(p){
  if (p.endsWith('.ts')) return 'typescript';
  if (p.endsWith('.js')) return 'javascript';
  if (p.endsWith('.json')) return 'json';
  if (p.endsWith('.py')) return 'python';
  if (p.endsWith('.md')) return 'markdown';
  if (p.endsWith('.html')) return 'html';
  if (p.endsWith('.css')) return 'css';
  return 'plaintext';
}

async function saveFile(){
  const active = monaco.editor.getModels()[0];
  // find tab with this model
  const tab = tabs.find(t=>t.editorModel===active);
  if(!tab) return;
  const text = tab.ytext.toString();
  const r = await api(`/api/projects/${encodeURIComponent(currentProject)}/file?path=${encodeURIComponent(tab.path)}`, {
    method:'PUT', body: text
  });
  $('hint').textContent = r.ok ? 'Saved.' : 'Save error.';
}

async function commit(){
  const msg = $('msg').value || 'Update';
  const r = await api(`/api/projects/${encodeURIComponent(currentProject)}/commit`, {
    method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({message: msg})
  });
  $('hint').textContent = 'Committed.';
}

async function deploy(){
  const r = await api(`/api/projects/${encodeURIComponent(currentProject)}/deploy`, {method:'POST'});
  $('hint').textContent = 'Deploy requested.';
}

async function mkfile(){
  const p = $('newpath').value.trim(); if(!p) return;
  await api(`/api/projects/${encodeURIComponent(currentProject)}/file?path=${encodeURIComponent(p)}`, {method:'PUT', body:''});
  loadProj(); openFile(p);
}
async function mkdir(){
  const p = $('newpath').value.trim(); if(!p) return;
  await api(`/api/projects/${encodeURIComponent(currentProject)}/mkdir`, {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({path:p})});
  loadProj();
}
function setKey(){ KEY = prompt('Origin key:', KEY || '') || ''; localStorage.setItem('br_origin_key', KEY); }

let editor;
(function boot(){
  editor = monaco.editor.create($('editor'), { value:'', language:'javascript', theme:'vs-dark', minimap:{enabled:false}, automaticLayout:true });
  listProjects();
  // retry queued autosaves
  setTimeout(async ()=>{
    for (const k of Object.keys(PENDING)){
      const [proj, ...rest] = k.split(':'); const p = rest.join(':');
      if (proj === currentProject){ await pushAutosave(p); }
    }
  }, 1000);
})();

// === Jobs client ===
async function startJob(kind){
  if (!currentProject){ $('hint').textContent = 'Open a project first.'; return; }
  const r = await api('/api/project-jobs/start', {method:'POST', headers:{'content-type':'application/json'},
               body: JSON.stringify({project: currentProject, kind})});
  const j = await r.json(); if (!j.job_id){ $('hint').textContent='job failed to start'; return; }
  attachJob(j.job_id);
}
async function startCustom(){
  const script = $('customCmd').value.trim(); if(!script) return;
  const r = await api('/api/project-jobs/start', {method:'POST', headers:{'content-type':'application/json'},
               body: JSON.stringify({project: currentProject, kind:'custom', script})});
  const j = await r.json(); if (j.job_id) attachJob(j.job_id);
}
function attachJob(id){
  $('jid').textContent = 'job: '+id;
  $('jstate').textContent = 'state: starting';
  $('jprog').textContent = 'progress: 0%';
  $('log').textContent = '';
  const es = new EventSource('/api/project-jobs/'+encodeURIComponent(id)+'/events');
  es.addEventListener('log', ev=> { $('log').textContent += ev.data; $('log').scrollTop = $('log').scrollHeight; });
  es.addEventListener('progress', ev=> {
    try{ const p = JSON.parse(ev.data).progress || 0; $('jprog').textContent = 'progress: '+Math.round(p*100)+'%'; }catch{}
  });
  es.addEventListener('state', ev=> {
    try{ const s = JSON.parse(ev.data).status || 'running'; $('jstate').textContent = 'state: '+s; if (s!=='running') es.close(); }catch{}
  });
}
