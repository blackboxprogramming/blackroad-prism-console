use std::fs;
use std::path::PathBuf;

use anyhow::{Context, Result};
use serde::{Deserialize, Serialize};
use tauri::AppHandle;

use crate::fs::atomic::atomic_write;

const SETTINGS_FILE: &str = "settings.json";

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct NetworkSettings {
  pub allow_gateway: bool,
  pub allow_telemetry: bool,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Settings {
  pub theme: String,
  pub keybindings: serde_json::Map<String, serde_json::Value>,
  pub model_routing: String,
  pub data_directory: String,
  pub network: NetworkSettings,
}

fn store_path(app: &AppHandle) -> Result<PathBuf> {
  Ok(app
    .path()
    .app_dir()
    .context("unable to determine app data directory")?
    .join(SETTINGS_FILE))
}

fn load_settings(app: &AppHandle) -> Result<Settings> {
  let path = store_path(app)?;
  if !path.exists() {
    return Ok(default_settings());
  }
  let data = fs::read_to_string(path)?;
  Ok(serde_json::from_str(&data)?)
}

fn persist_settings(app: &AppHandle, settings: &Settings) -> Result<()> {
  let path = store_path(app)?;
  let data = serde_json::to_vec(settings)?;
  atomic_write(&path, &data)
}

fn default_settings() -> Settings {
  let mut keybindings = serde_json::Map::new();
  keybindings.insert("command.palette".into(), serde_json::Value::String("mod+k".into()));
  Settings {
    theme: "system".into(),
    keybindings,
    model_routing: "local".into(),
    data_directory: String::new(),
    network: NetworkSettings {
      allow_gateway: false,
      allow_telemetry: false,
    },
  }
}

#[tauri::command]
pub fn get_settings(app: AppHandle) -> Result<Settings, String> {
  load_settings(&app).map_err(|err| err.to_string())
}

#[tauri::command]
pub fn save_settings(app: AppHandle, payload: Settings) -> Result<Settings, String> {
  persist_settings(&app, &payload).map_err(|err| err.to_string())?;
  Ok(payload)
}
