#![forbid(unsafe_code)]

use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct AgentState {
    pub id: String,
    pub memory_heat: f32,
}

pub fn encode_state(state: &AgentState) -> serde_json::Result<String> {
    serde_json::to_string(state)
}
