pub mod memory;
pub mod vfs;
use once_cell::sync::Lazy;
use std::fs;
use std::io;
use std::path::{Path, PathBuf};
use std::sync::Mutex;
use std::time::{SystemTime, UNIX_EPOCH};

#[cfg(target_arch = "wasm32")]
use wasm_bindgen::{prelude::*, JsCast};
#[cfg(target_arch = "wasm32")]
use wasm_bindgen_futures::JsFuture;
#[cfg(target_arch = "wasm32")]
use web_sys::{IdbDatabase, IdbOpenDbRequest, IdbTransactionMode};
#[cfg(target_arch = "wasm32")]
use js_sys::{Object, Reflect};
#[cfg(target_arch = "wasm32")]
use wasm_bindgen::closure::Closure;

/// In-memory representation of an agent managed by PrismOS.
pub struct Agent {
    pub name: &'static str,
    pub state: Vec<u8>,
}

/// Serialized snapshot of an agent's state.
#[derive(Clone)]
pub struct AgentSnapshot {
    pub agent_name: &'static str,
    pub state_data: Vec<u8>,
    pub timestamp: u64,
}

/// Global table of all snapshots held by the kernel.
pub static SNAPSHOT_TABLE: Lazy<Mutex<Vec<AgentSnapshot>>> =
    Lazy::new(|| Mutex::new(Vec::new()));

/// Minimal error type for kernel operations.
#[derive(Debug)]
pub enum PrismError {
    SnapshotNotFound,
    Io(io::Error),
}

impl From<io::Error> for PrismError {
    fn from(err: io::Error) -> Self {
        PrismError::Io(err)
    }
}

fn current_timestamp() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs()
}

/// Copy an agent's memory/state into a snapshot buffer using a bump allocator.
pub fn snapshot_agent(agent: &Agent) -> Result<AgentSnapshot, PrismError> {
    // In lieu of a bump allocator, simply clone the state buffer.
    let snapshot = AgentSnapshot {
        agent_name: agent.name,
        state_data: agent.state.clone(),
        timestamp: current_timestamp(),
    };
    SNAPSHOT_TABLE.lock().unwrap().push(snapshot.clone());
    Ok(snapshot)
}

/// Restore an agent's state from a prior snapshot.
pub fn rollback_agent(agent: &mut Agent, snapshot: &AgentSnapshot) -> Result<(), PrismError> {
    agent.state = snapshot.state_data.clone();
    Ok(())
}

/// Base directory where snapshots are materialised.
const SNAPSHOT_DIR: &str = "/prism/snapshots";

fn agent_dir(agent: &str) -> PathBuf {
    Path::new(SNAPSHOT_DIR).join(agent)
}

fn snapshot_file(agent: &str, ts: u64) -> PathBuf {
    agent_dir(agent).join(format!("{}.snap", ts))
}

/// Persist a snapshot to the /prism/snapshots VFS.
pub fn persist_snapshot(snapshot: &AgentSnapshot) -> Result<PathBuf, PrismError> {
    let path = snapshot_file(snapshot.agent_name, snapshot.timestamp);
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent)?;
    }
    fs::write(&path, &snapshot.state_data)?;
    Ok(path)
}

#[cfg(target_arch = "wasm32")]
async fn store_snapshot_metadata(snapshot: &AgentSnapshot) {
    if let Some(window) = web_sys::window() {
        if let Ok(Some(factory)) = window.indexed_db() {
            if let Ok(open_req) = factory.open("prism") {
                let upgrade = Closure::wrap(Box::new(move |event: web_sys::Event| {
                    let req: IdbOpenDbRequest = event.target().unwrap().unchecked_into();
                    let db: IdbDatabase = req.result().unwrap().unchecked_into();
                    let _ = db.create_object_store("snapshots");
                }) as Box<dyn FnMut(_)>);
                open_req.set_onupgradeneeded(Some(upgrade.as_ref().unchecked_ref()));
                upgrade.forget();
                if let Ok(db_val) = JsFuture::from(open_req).await {
                    let db: IdbDatabase = db_val.unchecked_into();
                    if let Ok(tx) = db.transaction_with_str_and_mode("snapshots", IdbTransactionMode::Readwrite) {
                        if let Ok(store) = tx.object_store("snapshots") {
                            let meta = Object::new();
                            let _ = Reflect::set(&meta, &JsValue::from_str("agent"), &JsValue::from_str(snapshot.agent_name));
                            let _ = Reflect::set(&meta, &JsValue::from_str("timestamp"), &JsValue::from_f64(snapshot.timestamp as f64));
                            let _ = Reflect::set(&meta, &JsValue::from_str("size"), &JsValue::from_f64(snapshot.state_data.len() as f64));
                            let key = JsValue::from_str(&format!("{}-{}", snapshot.agent_name, snapshot.timestamp));
                            let _ = store.put_with_key(&meta, &key);
                        }
                        let _ = JsFuture::from(tx.done()).await;
                    }
                }
            }
        }
    }
}

#[cfg(target_arch = "wasm32")]
#[wasm_bindgen]
pub async fn snapshotAgent(name: String, state: js_sys::Uint8Array) -> Result<JsValue, JsValue> {
    let agent = Agent { name: Box::leak(name.clone().into_boxed_str()), state: state.to_vec() };
    let snap = snapshot_agent(&agent).map_err(|e| JsValue::from_str(&format!("{:?}", e)))?;
    let _ = persist_snapshot(&snap);
    store_snapshot_metadata(&snap).await;
    Ok(JsValue::from_f64(snap.timestamp as f64))
}

#[cfg(target_arch = "wasm32")]
#[wasm_bindgen]
pub async fn rollbackAgent(name: String, id: u64) -> Result<js_sys::Uint8Array, JsValue> {
    let mut agent = Agent { name: Box::leak(name.into_boxed_str()), state: Vec::new() };
    cmd_rollback(&mut agent, id).map_err(|e| JsValue::from_str(&format!("{:?}", e)))?;
    Ok(js_sys::Uint8Array::from(agent.state.as_slice()))
}

/// Read metadata from a snapshot file.
pub fn read_snapshot_metadata(path: &Path) -> Result<String, PrismError> {
    let data = fs::read(path)?;
    Ok(format!(
        "agent: {}\ntimestamp: {}\nsize: {}",
        path.parent()
            .and_then(|p| p.file_name())
            .and_then(|n| n.to_str())
            .unwrap_or("unknown"),
        path.file_stem()
            .and_then(|s| s.to_str())
            .unwrap_or("0"),
        data.len()
    ))
}

/// Shell command helpers ---------------------------------------------------

/// `snapshot <agent>`
pub fn cmd_snapshot(agent: &Agent) -> Result<AgentSnapshot, PrismError> {
    let snap = snapshot_agent(agent)?;
    let _ = persist_snapshot(&snap); // best effort
    Ok(snap)
}

/// `snapshots <agent>`
pub fn cmd_list(agent_name: &str) -> Vec<AgentSnapshot> {
    SNAPSHOT_TABLE
        .lock()
        .unwrap()
        .iter()
        .filter(|s| s.agent_name == agent_name)
        .cloned()
        .collect()
}

/// `rollback <agent> <id>`
pub fn cmd_rollback(agent: &mut Agent, id: u64) -> Result<(), PrismError> {
    let table = SNAPSHOT_TABLE.lock().unwrap();
    if let Some(s) = table
        .iter()
        .find(|s| s.agent_name == agent.name && s.timestamp == id)
    {
        rollback_agent(agent, s)
    } else {
        Err(PrismError::SnapshotNotFound)
    }
}

/// Auto-snapshot hooks ----------------------------------------------------

/// Snapshot an agent prior to restart/stop.
pub fn autosnapshot(agent: &Agent) {
    if let Ok(snap) = snapshot_agent(agent) {
        let _ = persist_snapshot(&snap);
    }
}

/// Snapshot an agent on crash with `crash-<ts>.snap` filename.
pub fn crash_snapshot(agent: &Agent) {
    if let Ok(mut snap) = snapshot_agent(agent) {
        snap.timestamp = current_timestamp();
        let path = agent_dir(agent.name).join(format!("crash-{}.snap", snap.timestamp));
        if let Some(parent) = path.parent() {
            let _ = fs::create_dir_all(parent);
        }
        let _ = fs::write(path, &snap.state_data);
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn snapshot_and_rollback() {
        let mut agent = Agent { name: "echo", state: b"before".to_vec() };
        let snap = snapshot_agent(&agent).unwrap();
        agent.state = b"after".to_vec();
        rollback_agent(&mut agent, &snap).unwrap();
        assert_eq!(agent.state, b"before".to_vec());
    }

    #[test]
    fn crash_creates_file() {
        let agent = Agent { name: "echo", state: b"msg".to_vec() };
        crash_snapshot(&agent);
        let dir = agent_dir(agent.name);
        // ensure at least one crash file exists
        let paths: Vec<_> = fs::read_dir(&dir)
            .unwrap()
            .filter_map(|e| e.ok())
            .map(|e| e.path())
            .collect();
        assert!(paths.iter().any(|p| p.to_string_lossy().contains("crash-")));
        // cleanup
        let _ = fs::remove_dir_all(agent_dir(agent.name));
    }
}
