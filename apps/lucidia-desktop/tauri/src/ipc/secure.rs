use std::sync::Mutex;

use once_cell::sync::Lazy;
use serde::{Deserialize, Serialize};

use super::{ErrorResponse, IpcError};

static SECRETS: Lazy<Mutex<std::collections::HashMap<String, String>>> =
    Lazy::new(|| Mutex::new(std::collections::HashMap::new()));

#[derive(Debug, Deserialize)]
pub struct SecureSetInput {
    pub key: String,
    pub value: String,
}

#[derive(Debug, Deserialize)]
pub struct SecureGetInput {
    pub key: String,
}

#[derive(Debug, Serialize)]
pub struct SecureValueOutput {
    pub value: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct SecureDeleteInput {
    pub key: String,
}

#[tauri::command]
pub async fn secure_set(payload: SecureSetInput) -> Result<serde_json::Value, ErrorResponse> {
    let mut secrets = SECRETS.lock().map_err(|_| IpcError::Message("lock poisoned".into()))?;
    secrets.insert(payload.key, payload.value);
    Ok(serde_json::json!({ "ok": true }))
}

#[tauri::command]
pub async fn secure_get(payload: SecureGetInput) -> Result<SecureValueOutput, ErrorResponse> {
    let secrets = SECRETS.lock().map_err(|_| IpcError::Message("lock poisoned".into()))?;
    Ok(SecureValueOutput {
        value: secrets.get(&payload.key).cloned(),
    })
}

#[tauri::command]
pub async fn secure_delete(payload: SecureDeleteInput) -> Result<serde_json::Value, ErrorResponse> {
    let mut secrets = SECRETS.lock().map_err(|_| IpcError::Message("lock poisoned".into()))?;
    secrets.remove(&payload.key);
    Ok(serde_json::json!({ "ok": true }))
}
