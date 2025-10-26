use serde::Serialize;
use serde::Deserialize;
use tauri::AppHandle;

use crate::platform::keychain;

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SecureSetPayload {
  pub key: String,
  pub value: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SecureKeyPayload {
  pub key: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct OkResponse {
  pub ok: bool,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SecureGetResponse {
  pub value: Option<String>,
}

#[tauri::command]
pub fn secure_set(_app: AppHandle, payload: SecureSetPayload) -> Result<OkResponse, String> {
  keychain::set_secret(&payload.key, &payload.value).map_err(|err| err.to_string())?;
  Ok(OkResponse { ok: true })
}

#[tauri::command]
pub fn secure_get(_app: AppHandle, payload: SecureKeyPayload) -> Result<SecureGetResponse, String> {
  let value = keychain::get_secret(&payload.key).map_err(|err| err.to_string())?;
  Ok(SecureGetResponse { value })
}

#[tauri::command]
pub fn secure_delete(_app: AppHandle, payload: SecureKeyPayload) -> Result<OkResponse, String> {
  keychain::delete_secret(&payload.key).map_err(|err| err.to_string())?;
  Ok(OkResponse { ok: true })
}
