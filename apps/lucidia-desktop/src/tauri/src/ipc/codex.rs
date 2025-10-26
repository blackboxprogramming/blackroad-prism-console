use std::fs;
use std::path::PathBuf;

use anyhow::{Context, Result};
use chrono::Utc;
use rand::{distributions::Alphanumeric, Rng};
use serde::{Deserialize, Serialize};
use tauri::AppHandle;

use crate::fs::atomic::atomic_write;

const MEMORY_FILE: &str = "memory.jsonl";
const VECTOR_DIM: usize = 64;

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct CodexDoc {
  pub id: String,
  pub title: String,
  pub tags: Vec<String>,
  pub content: String,
  pub created_at: String,
  pub updated_at: String,
  pub vector: Vec<f32>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SaveMemoryPayload {
  pub title: String,
  pub tags: Vec<String>,
  pub content: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct QueryCodexPayload {
  pub q: String,
  pub top_k: Option<usize>,
  pub tags: Option<Vec<String>>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ListMemoryPayload {
  pub tag: Option<String>,
  pub limit: Option<usize>,
  pub offset: Option<usize>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateMemoryPayload {
  pub id: String,
  pub patch: UpdateMemoryPatch,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateMemoryPatch {
  pub title: Option<String>,
  pub tags: Option<Vec<String>>,
  pub content: Option<String>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DeleteMemoryPayload {
  pub id: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct QueryCodexResponse {
  pub hits: Vec<CodexDoc>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ListMemoryResponse {
  pub items: Vec<CodexDoc>,
  pub total: usize,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct OkResponse {
  pub ok: bool,
}

fn store_path(app: &AppHandle) -> Result<PathBuf> {
  Ok(app
    .path()
    .app_dir()
    .context("unable to determine app data directory")?
    .join("db")
    .join(MEMORY_FILE))
}

fn load_docs(app: &AppHandle) -> Result<Vec<CodexDoc>> {
  let path = store_path(app)?;
  if !path.exists() {
    return Ok(vec![]);
  }
  let data = fs::read_to_string(path)?;
  let mut docs = Vec::new();
  for line in data.lines() {
    let doc: CodexDoc = serde_json::from_str(line)?;
    docs.push(doc);
  }
  Ok(docs)
}

fn persist_docs(app: &AppHandle, docs: &[CodexDoc]) -> Result<()> {
  let path = store_path(app)?;
  let content: String = docs
    .iter()
    .map(|doc| serde_json::to_string(doc))
    .collect::<Result<Vec<_>, _>>()?
    .join("\n");
  atomic_write(&path, content.as_bytes())
}

fn embed_text(text: &str) -> Vec<f32> {
  let mut vector = vec![0.0f32; VECTOR_DIM];
  let normalized = text.to_lowercase();
  for (index, byte) in normalized.bytes().enumerate() {
    let bucket = (byte as usize + index) % VECTOR_DIM;
    vector[bucket] += (byte as f32 % 13.0) / 12.0;
  }
  let magnitude: f32 = vector.iter().map(|v| v * v).sum::<f32>().sqrt();
  if magnitude > 0.0 {
    vector.iter_mut().for_each(|v| *v /= magnitude);
  }
  vector
}

fn cosine_similarity(a: &[f32], b: &[f32]) -> f32 {
  if a.len() != b.len() {
    return 0.0;
  }
  let mut dot = 0.0;
  let mut mag_a = 0.0;
  let mut mag_b = 0.0;
  for (x, y) in a.iter().zip(b.iter()) {
    dot += x * y;
    mag_a += x * x;
    mag_b += y * y;
  }
  if mag_a == 0.0 || mag_b == 0.0 {
    return 0.0;
  }
  dot / (mag_a.sqrt() * mag_b.sqrt())
}

fn generate_id() -> String {
  rand::thread_rng()
    .sample_iter(&Alphanumeric)
    .take(12)
    .map(char::from)
    .collect()
}

#[tauri::command]
pub fn save_memory(app: AppHandle, payload: SaveMemoryPayload) -> Result<CodexDoc, String> {
  let mut docs = load_docs(&app).map_err(|err| err.to_string())?;
  let now = Utc::now().to_rfc3339();
  let doc = CodexDoc {
    id: generate_id(),
    title: payload.title,
    tags: payload.tags,
    content: payload.content.clone(),
    created_at: now.clone(),
    updated_at: now,
    vector: embed_text(&payload.content),
  };
  docs.push(doc.clone());
  persist_docs(&app, &docs).map_err(|err| err.to_string())?;
  Ok(doc)
}

#[tauri::command]
pub fn list_memory(app: AppHandle, payload: Option<ListMemoryPayload>) -> Result<ListMemoryResponse, String> {
  let docs = load_docs(&app).map_err(|err| err.to_string())?;
  let filtered: Vec<CodexDoc> = docs
    .into_iter()
    .filter(|doc| match &payload {
      Some(p) => p.tag.as_ref().map(|tag| doc.tags.contains(tag)).unwrap_or(true),
      None => true,
    })
    .collect();
  let total = filtered.len();
  let offset = payload.as_ref().and_then(|p| p.offset).unwrap_or(0);
  let limit = payload.as_ref().and_then(|p| p.limit).unwrap_or(total);
  let items = filtered.into_iter().skip(offset).take(limit).collect();
  Ok(ListMemoryResponse { items, total })
}

#[tauri::command]
pub fn update_memory(app: AppHandle, payload: UpdateMemoryPayload) -> Result<CodexDoc, String> {
  let mut docs = load_docs(&app).map_err(|err| err.to_string())?;
  let mut updated = None;
  for doc in docs.iter_mut() {
    if doc.id == payload.id {
      if let Some(title) = &payload.patch.title {
        doc.title = title.clone();
      }
      if let Some(tags) = &payload.patch.tags {
        doc.tags = tags.clone();
      }
      if let Some(content) = &payload.patch.content {
        doc.content = content.clone();
        doc.vector = embed_text(content);
      }
      doc.updated_at = Utc::now().to_rfc3339();
      updated = Some(doc.clone());
      break;
    }
  }
  if updated.is_none() {
    return Err("memory not found".into());
  }
  persist_docs(&app, &docs).map_err(|err| err.to_string())?;
  Ok(updated.unwrap())
}

#[tauri::command]
pub fn delete_memory(app: AppHandle, payload: DeleteMemoryPayload) -> Result<OkResponse, String> {
  let mut docs = load_docs(&app).map_err(|err| err.to_string())?;
  docs.retain(|doc| doc.id != payload.id);
  persist_docs(&app, &docs).map_err(|err| err.to_string())?;
  Ok(OkResponse { ok: true })
}

#[tauri::command]
pub fn query_codex(app: AppHandle, payload: QueryCodexPayload) -> Result<QueryCodexResponse, String> {
  let docs = load_docs(&app).map_err(|err| err.to_string())?;
  let query_vector = embed_text(&payload.q);
  let mut scored: Vec<(f32, CodexDoc)> = docs
    .into_iter()
    .map(|doc| (cosine_similarity(&query_vector, &doc.vector), doc))
    .collect();
  scored.sort_by(|a, b| b.0.partial_cmp(&a.0).unwrap_or(std::cmp::Ordering::Equal));
  let top_k = payload.top_k.unwrap_or(5);
  Ok(QueryCodexResponse {
    hits: scored.into_iter().take(top_k).map(|(_, doc)| doc).collect(),
  })
}
