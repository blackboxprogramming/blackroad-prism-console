use std::fs;
use std::path::{Path, PathBuf};

use anyhow::Result;
use serde::{Deserialize, Serialize};
use tauri::AppHandle;

use crate::fs::atomic::atomic_write;

const EXPORT_FILE: &str = "lucidia-export.json";

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ExportBundleResponse {
  pub path: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ImportBundlePayload {
  pub path: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ImportBundleResponse {
  pub imported: ImportedSummary,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ImportedSummary {
  pub memory: usize,
  pub tasks: usize,
  pub settings: bool,
}

#[tauri::command]
pub fn export_bundle(app: AppHandle) -> Result<ExportBundleResponse, String> {
  let app_dir = app.path().app_dir().map_err(|err| err.to_string())?;
  let memory_count = count_memory_docs(&app_dir).map_err(|err| err.to_string())?;
  let task_count = count_tasks(&app_dir).map_err(|err| err.to_string())?;
  let payload = serde_json::json!({
    "memory": memory_count,
    "tasks": task_count,
    "settings": app_dir.join("settings.json").exists(),
  });
  let export_path = app_dir.join(EXPORT_FILE);
  let data = serde_json::to_vec_pretty(&payload).map_err(|err| err.to_string())?;
  atomic_write(&export_path, &data).map_err(|err| err.to_string())?;
  Ok(ExportBundleResponse { path: export_path.to_string_lossy().into_owned() })
}

#[tauri::command]
pub fn import_bundle(_app: AppHandle, payload: ImportBundlePayload) -> Result<ImportBundleResponse, String> {
  let path = PathBuf::from(payload.path);
  let data = fs::read_to_string(&path).map_err(|err| err.to_string())?;
  let parsed: serde_json::Value = serde_json::from_str(&data).map_err(|err| err.to_string())?;
  let memory = parsed.get("memory").and_then(|v| v.as_u64()).unwrap_or(0) as usize;
  let tasks = parsed.get("tasks").and_then(|v| v.as_u64()).unwrap_or(0) as usize;
  let settings = parsed.get("settings").and_then(|v| v.as_bool()).unwrap_or(false);
  Ok(ImportBundleResponse {
    imported: ImportedSummary {
      memory,
      tasks,
      settings,
    },
  })
}

fn count_memory_docs(app_dir: &Path) -> Result<usize> {
  let path = app_dir.join("db").join("memory.jsonl");
  if !path.exists() {
    return Ok(0);
  }
  let data = fs::read_to_string(path)?;
  Ok(data.lines().count())
}

fn count_tasks(app_dir: &Path) -> Result<usize> {
  let path = app_dir.join("db").join("tasks.json");
  if !path.exists() {
    return Ok(0);
  }
  let data = fs::read_to_string(path)?;
  let tasks: Vec<serde_json::Value> = serde_json::from_str(&data)?;
  Ok(tasks.len())
}
