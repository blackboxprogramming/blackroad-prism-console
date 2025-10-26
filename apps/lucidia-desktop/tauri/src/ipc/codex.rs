use std::sync::Mutex;

use once_cell::sync::Lazy;
use serde::{Deserialize, Serialize};

use super::{ErrorResponse, IpcError};

static MEMORY: Lazy<Mutex<Vec<CodexDoc>>> = Lazy::new(|| Mutex::new(Vec::new()));

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CodexDoc {
    pub id: String,
    pub title: String,
    #[serde(default)]
    pub tags: Vec<String>,
    pub content: String,
    #[serde(rename = "createdAt")]
    pub created_at: String,
    #[serde(rename = "updatedAt")]
    pub updated_at: String,
    pub vector: Vec<f32>,
}

#[derive(Debug, Deserialize)]
pub struct QueryCodexInput {
    pub q: String,
    #[serde(default, rename = "topK")]
    pub top_k: Option<usize>,
    #[serde(default)]
    pub tags: Option<Vec<String>>,
}

#[derive(Debug, Serialize)]
pub struct QueryCodexOutput {
    pub hits: Vec<CodexDoc>,
}

#[derive(Debug, Deserialize)]
pub struct SaveMemoryInput {
    pub title: String,
    #[serde(default)]
    pub tags: Vec<String>,
    pub content: String,
}

#[derive(Debug, Deserialize)]
pub struct ListMemoryInput {
    pub tag: Option<String>,
    #[serde(default)]
    pub limit: Option<usize>,
    #[serde(default)]
    pub offset: Option<usize>,
}

#[derive(Debug, Serialize)]
pub struct ListMemoryOutput {
    pub items: Vec<CodexDoc>,
    pub total: usize,
}

#[derive(Debug, Deserialize)]
pub struct UpdateMemoryInput {
    pub id: String,
    pub patch: UpdateMemoryPatch,
}

#[derive(Debug, Deserialize)]
pub struct UpdateMemoryPatch {
    pub title: Option<String>,
    pub tags: Option<Vec<String>>,
    pub content: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct DeleteMemoryInput {
    pub id: String,
}

#[tauri::command]
pub async fn query_codex(payload: QueryCodexInput) -> Result<QueryCodexOutput, ErrorResponse> {
    let memory = MEMORY.lock().map_err(|_| IpcError::Message("lock poisoned".into()))?;
    let hits = memory
        .iter()
        .filter(|doc| {
            payload
                .tags
                .as_ref()
                .map(|tags| tags.iter().all(|tag| doc.tags.contains(tag)))
                .unwrap_or(true)
        })
        .filter(|doc| doc.content.contains(&payload.q) || doc.title.contains(&payload.q))
        .take(payload.top_k.unwrap_or(5))
        .cloned()
        .collect();
    Ok(QueryCodexOutput { hits })
}

#[tauri::command]
pub async fn save_memory(payload: SaveMemoryInput) -> Result<CodexDoc, ErrorResponse> {
    let mut memory = MEMORY.lock().map_err(|_| IpcError::Message("lock poisoned".into()))?;
    let now = chrono::Utc::now().to_rfc3339();
    let doc = CodexDoc {
        id: uuid::Uuid::new_v4().to_string(),
        title: payload.title,
        tags: payload.tags,
        content: payload.content,
        created_at: now.clone(),
        updated_at: now,
        vector: Vec::new(),
    };
    memory.push(doc.clone());
    Ok(doc)
}

#[tauri::command]
pub async fn list_memory(payload: Option<ListMemoryInput>) -> Result<ListMemoryOutput, ErrorResponse> {
    let payload = payload.unwrap_or(ListMemoryInput {
        tag: None,
        limit: None,
        offset: None,
    });
    let memory = MEMORY.lock().map_err(|_| IpcError::Message("lock poisoned".into()))?;
    let mut filtered: Vec<_> = memory
        .iter()
        .filter(|doc| match &payload.tag {
            Some(tag) => doc.tags.contains(tag),
            None => true,
        })
        .cloned()
        .collect();
    let total = filtered.len();
    if let Some(offset) = payload.offset {
        filtered = filtered.into_iter().skip(offset).collect();
    }
    if let Some(limit) = payload.limit {
        filtered.truncate(limit);
    }
    Ok(ListMemoryOutput {
        items: filtered,
        total,
    })
}

#[tauri::command]
pub async fn update_memory(payload: UpdateMemoryInput) -> Result<CodexDoc, ErrorResponse> {
    let mut memory = MEMORY.lock().map_err(|_| IpcError::Message("lock poisoned".into()))?;
    let now = chrono::Utc::now().to_rfc3339();
    if let Some(doc) = memory.iter_mut().find(|doc| doc.id == payload.id) {
        if let Some(title) = payload.patch.title {
            doc.title = title;
        }
        if let Some(tags) = payload.patch.tags {
            doc.tags = tags;
        }
        if let Some(content) = payload.patch.content {
            doc.content = content;
        }
        doc.updated_at = now;
        return Ok(doc.clone());
    }
    Err(IpcError::Message("memory not found".into()).into())
}

#[tauri::command]
pub async fn delete_memory(payload: DeleteMemoryInput) -> Result<serde_json::Value, ErrorResponse> {
    let mut memory = MEMORY.lock().map_err(|_| IpcError::Message("lock poisoned".into()))?;
    memory.retain(|doc| doc.id != payload.id);
    Ok(serde_json::json!({ "ok": true }))
}
