use once_cell::sync::Lazy;
use serde::{Deserialize, Serialize};
use std::sync::Mutex;

use super::{ErrorResponse, IpcError};

static SETTINGS: Lazy<Mutex<Settings>> = Lazy::new(|| Mutex::new(Settings::default()));

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NetworkSettings {
    #[serde(rename = "allowGateway")]
    pub allow_gateway: bool,
    #[serde(rename = "allowTelemetry")]
    pub allow_telemetry: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Settings {
    pub theme: String,
    pub keybindings: std::collections::HashMap<String, String>,
    #[serde(rename = "modelRouting")]
    pub model_routing: String,
    #[serde(rename = "dataDir")]
    pub data_dir: String,
    pub network: NetworkSettings,
}

impl Default for Settings {
    fn default() -> Self {
        let mut keybindings = std::collections::HashMap::new();
        keybindings.insert("command-palette".into(), "Mod+K".into());
        Self {
            theme: "system".into(),
            keybindings,
            model_routing: "local".into(),
            data_dir: "lucidia".into(),
            network: NetworkSettings {
                allow_gateway: false,
                allow_telemetry: false,
            },
        }
    }
}

#[tauri::command]
pub async fn get_settings() -> Result<Settings, ErrorResponse> {
    let settings = SETTINGS.lock().map_err(|_| IpcError::Message("lock poisoned".into()))?;
    Ok(settings.clone())
}

#[tauri::command]
pub async fn save_settings(payload: Settings) -> Result<Settings, ErrorResponse> {
    let mut settings = SETTINGS.lock().map_err(|_| IpcError::Message("lock poisoned".into()))?;
    *settings = payload.clone();
    Ok(payload)
}
