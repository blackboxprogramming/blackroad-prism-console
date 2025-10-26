use std::sync::Mutex;

use once_cell::sync::Lazy;
use serde::{Deserialize, Serialize};

use super::{ErrorResponse, IpcError};

static TASKS: Lazy<Mutex<Vec<Task>>> = Lazy::new(|| Mutex::new(Vec::new()));

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TaskLogEntry {
    pub id: String,
    pub task_id: String,
    pub level: String,
    pub message: String,
    #[serde(rename = "timestamp")]
    pub timestamp: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Task {
    pub id: String,
    pub title: String,
    pub status: String,
    #[serde(rename = "createdAt")]
    pub created_at: String,
    #[serde(rename = "updatedAt")]
    pub updated_at: String,
    pub tags: Vec<String>,
    pub log: Vec<TaskLogEntry>,
}

#[derive(Debug, Deserialize)]
pub struct RunTaskInput {
    pub title: String,
    #[serde(default)]
    pub args: serde_json::Value,
}

#[derive(Debug, Serialize)]
pub struct RunTaskOutput {
    #[serde(rename = "taskId")]
    pub task_id: String,
}

#[derive(Debug, Deserialize)]
pub struct GetTaskInput {
    pub id: String,
}

#[derive(Debug, Deserialize)]
pub struct ListTasksInput {
    #[serde(default)]
    pub status: Option<String>,
}

#[tauri::command]
pub async fn run_task(payload: RunTaskInput) -> Result<RunTaskOutput, ErrorResponse> {
    let mut tasks = TASKS.lock().map_err(|_| IpcError::Message("lock poisoned".into()))?;
    let now = chrono::Utc::now().to_rfc3339();
    let id = uuid::Uuid::new_v4().to_string();
    let log = vec![TaskLogEntry {
        id: uuid::Uuid::new_v4().to_string(),
        task_id: id.clone(),
        level: "info".into(),
        message: "Task started".into(),
        timestamp: now.clone(),
    }];
    let task = Task {
        id: id.clone(),
        title: payload.title,
        status: "running".into(),
        created_at: now.clone(),
        updated_at: now,
        tags: vec![],
        log,
    };
    tasks.push(task);
    Ok(RunTaskOutput { task_id: id })
}

#[tauri::command]
pub async fn get_task(payload: GetTaskInput) -> Result<Task, ErrorResponse> {
    let tasks = TASKS.lock().map_err(|_| IpcError::Message("lock poisoned".into()))?;
    tasks
        .iter()
        .find(|task| task.id == payload.id)
        .cloned()
        .ok_or_else(|| IpcError::Message("task not found".into()).into())
}

#[tauri::command]
pub async fn list_tasks(payload: Option<ListTasksInput>) -> Result<Vec<Task>, ErrorResponse> {
    let payload = payload.unwrap_or(ListTasksInput { status: None });
    let tasks = TASKS.lock().map_err(|_| IpcError::Message("lock poisoned".into()))?;
    Ok(tasks
        .iter()
        .filter(|task| match &payload.status {
            Some(status) => task.status == *status,
            None => true,
        })
        .cloned()
        .collect())
}
