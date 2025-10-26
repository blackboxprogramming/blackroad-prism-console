use std::fs;
use std::path::PathBuf;

use anyhow::{Context, Result};
use chrono::Utc;
use rand::{distributions::Alphanumeric, Rng};
use serde::{Deserialize, Serialize};
use tauri::AppHandle;

use crate::fs::atomic::atomic_write;

const TASK_FILE: &str = "tasks.json";

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct TaskLogEntry {
  pub id: String,
  pub task_id: String,
  pub level: String,
  pub message: String,
  pub timestamp: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Task {
  pub id: String,
  pub title: String,
  pub status: String,
  pub created_at: String,
  pub updated_at: String,
  pub tags: Vec<String>,
  pub logs: Vec<TaskLogEntry>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RunTaskPayload {
  pub title: String,
  pub args: Option<serde_json::Value>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TaskIdPayload {
  pub id: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ListTasksPayload {
  pub status: Option<String>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RunTaskResponse {
  pub task_id: String,
}

fn store_path(app: &AppHandle) -> Result<PathBuf> {
  Ok(app
    .path()
    .app_dir()
    .context("unable to determine app data directory")?
    .join("db")
    .join(TASK_FILE))
}

fn load_tasks(app: &AppHandle) -> Result<Vec<Task>> {
  let path = store_path(app)?;
  if !path.exists() {
    return Ok(vec![]);
  }
  let data = fs::read_to_string(path)?;
  Ok(serde_json::from_str(&data)?)
}

fn persist_tasks(app: &AppHandle, tasks: &[Task]) -> Result<()> {
  let path = store_path(app)?;
  let json = serde_json::to_vec(tasks)?;
  atomic_write(&path, &json)
}

fn generate_id() -> String {
  rand::thread_rng()
    .sample_iter(&Alphanumeric)
    .take(12)
    .map(char::from)
    .collect()
}

#[tauri::command]
pub fn run_task(app: AppHandle, payload: RunTaskPayload) -> Result<RunTaskResponse, String> {
  let mut tasks = load_tasks(&app).map_err(|err| err.to_string())?;
  let id = generate_id();
  let now = Utc::now().to_rfc3339();
  let logs = vec![TaskLogEntry {
    id: generate_id(),
    task_id: id.clone(),
    level: "info".into(),
    message: format!("Task '{}' started", payload.title),
    timestamp: now.clone(),
  }];
  let task = Task {
    id: id.clone(),
    title: payload.title,
    status: "done".into(),
    created_at: now.clone(),
    updated_at: now,
    tags: vec![],
    logs,
  };
  tasks.push(task);
  persist_tasks(&app, &tasks).map_err(|err| err.to_string())?;
  Ok(RunTaskResponse { task_id: id })
}

#[tauri::command]
pub fn get_task(app: AppHandle, payload: TaskIdPayload) -> Result<Task, String> {
  let tasks = load_tasks(&app).map_err(|err| err.to_string())?;
  tasks.into_iter().find(|task| task.id == payload.id).ok_or_else(|| "task not found".into())
}

#[tauri::command]
pub fn list_tasks(app: AppHandle, payload: Option<ListTasksPayload>) -> Result<Vec<Task>, String> {
  let tasks = load_tasks(&app).map_err(|err| err.to_string())?;
  let filtered = tasks
    .into_iter()
    .filter(|task| match &payload {
      Some(p) => p.status.as_ref().map(|status| &task.status == status).unwrap_or(true),
      None => true,
    })
    .collect();
  Ok(filtered)
}
