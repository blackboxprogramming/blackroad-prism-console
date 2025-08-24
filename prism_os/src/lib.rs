pub mod memory;
pub mod vfs;
use once_cell::sync::Lazy;
use std::fs;
use std::io;
use std::path::{Path, PathBuf};
use std::sync::Mutex;
use std::time::{SystemTime, UNIX_EPOCH};

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
