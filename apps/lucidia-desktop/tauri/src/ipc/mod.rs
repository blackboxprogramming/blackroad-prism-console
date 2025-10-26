pub mod codex;
pub mod tasks;
pub mod secure;
pub mod settings;
pub mod export_import;

use serde::Serialize;
use thiserror::Error;

#[derive(Debug, Error)]
pub enum IpcError {
    #[error("{0}")]
    Message(String),
}

#[derive(Debug, Serialize)]
pub struct ErrorResponse {
    pub r#type: String,
    pub message: String,
    pub code: Option<String>,
}

impl From<IpcError> for ErrorResponse {
    fn from(value: IpcError) -> Self {
        Self {
            r#type: "error".into(),
            message: value.to_string(),
            code: None,
        }
    }
}
