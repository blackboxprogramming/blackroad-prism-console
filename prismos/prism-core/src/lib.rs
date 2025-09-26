use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs;
use std::path::{Path, PathBuf};
use thiserror::Error;

#[derive(Debug, Error)]
pub enum PrismError {
    #[error("io error: {0}")]
    Io(#[from] std::io::Error),
    #[error("toml error: {0}")]
    Toml(#[from] toml::de::Error),
    #[error("json error: {0}")]
    Json(#[from] serde_json::Error),
    #[error("agent {0} not found")]
    NotFound(String),
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub enum AgentStatus {
    Running,
    Restarting,
    Failed,
}

impl Default for AgentStatus {
    fn default() -> Self {
        AgentStatus::Running
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Agent {
    pub name: String,
    #[serde(default)]
    pub capabilities: Vec<String>,
    #[serde(default)]
    pub config: HashMap<String, String>,
    pub version: String,
    #[serde(skip_deserializing, default)]
    pub status: AgentStatus,
}

impl Agent {
    fn from_file(path: &Path) -> Result<Self, PrismError> {
        let data = fs::read_to_string(path)?;
        let mut agent: Agent = toml::from_str(&data)?;
        agent.status = AgentStatus::Running;
        Ok(agent)
    }
}

#[derive(Default)]
pub struct AgentManager {
    agents: HashMap<String, Agent>,
}

impl AgentManager {
    pub fn load_from_dir<P: AsRef<Path>>(dir: P) -> Result<Self, PrismError> {
        let mut mgr = AgentManager::default();
        for entry in fs::read_dir(dir)? {
            let entry = entry?;
            if entry.path().extension().and_then(|s| s.to_str()) == Some("toml") {
                let agent = Agent::from_file(&entry.path())?;
                mgr.agents.insert(agent.name.clone(), agent);
            }
        }
        Ok(mgr)
    }

    pub fn status(&self) -> Vec<Agent> {
        self.agents.values().cloned().collect()
    }

    pub fn restart(&mut self, name: &str) -> Result<(), PrismError> {
        let agent = self.agents.get_mut(name).ok_or_else(|| PrismError::NotFound(name.to_string()))?;
        agent.status = AgentStatus::Restarting;
        // In real impl we'd restart container; here we just set running.
        agent.status = AgentStatus::Running;
        Ok(())
    }

    pub fn fail_and_autorestart(&mut self, name: &str) -> Result<(), PrismError> {
        let agent = self.agents.get_mut(name).ok_or_else(|| PrismError::NotFound(name.to_string()))?;
        agent.status = AgentStatus::Failed;
        // auto-restart immediately
        agent.status = AgentStatus::Running;
        Ok(())
    }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Command {
    pub cmd: String,
    pub agent: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Response {
    pub ok: bool,
    pub data: serde_json::Value,
}

impl AgentManager {
    pub async fn handle_stream(&mut self, mut stream: tokio::net::UnixStream) -> Result<(), PrismError> {
        use tokio::io::{AsyncReadExt, AsyncWriteExt};
        let mut buf = Vec::new();
        stream.read_to_end(&mut buf).await?;
        let cmd: Command = serde_json::from_slice(&buf)?;
        let resp = match cmd.cmd.as_str() {
            "status" => Response { ok: true, data: serde_json::to_value(self.status()).unwrap() },
            "restart" => {
                if let Some(name) = cmd.agent { self.restart(&name)?; }
                Response { ok: true, data: serde_json::json!({}) }
            }
            "snapshot" | "rollback" => Response { ok: true, data: serde_json::json!({}) },
            "fail" => {
                if let Some(name) = cmd.agent { self.fail_and_autorestart(&name)?; }
                Response { ok: true, data: serde_json::json!({}) }
            }
            _ => Response { ok: false, data: serde_json::json!({"error": "unknown"}) },
        };
        let out = serde_json::to_vec(&resp).unwrap();
        stream.write_all(&out).await?;
        Ok(())
    }
}

pub async fn run_server(socket: &Path, mut mgr: AgentManager) -> Result<(), PrismError> {
    if socket.exists() {
        fs::remove_file(socket)?;
    }
    let listener = tokio::net::UnixListener::bind(socket)?;
    loop {
        let (stream, _) = listener.accept().await?;
        mgr.handle_stream(stream).await?;
    }
}

pub fn default_agent_dir() -> PathBuf {
    PathBuf::from("/etc/prismos/agents.d")
}

pub fn default_socket() -> PathBuf {
    PathBuf::from("/tmp/prismosd.sock")
}
