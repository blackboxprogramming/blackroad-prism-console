use serde::Serialize;

use super::{ErrorResponse, IpcError};

#[derive(Debug, Serialize)]
pub struct ExportBundleOutput {
    pub path: String,
}

#[derive(Debug, serde::Deserialize)]
pub struct ImportBundleInput {
    pub path: String,
}

#[derive(Debug, Serialize)]
pub struct ImportBundleOutputDetails {
    pub memory: usize,
    pub tasks: usize,
    pub settings: bool,
}

#[derive(Debug, Serialize)]
pub struct ImportBundleOutput {
    pub imported: ImportBundleOutputDetails,
}

#[tauri::command]
pub async fn export_bundle() -> Result<ExportBundleOutput, ErrorResponse> {
    Ok(ExportBundleOutput {
        path: "./lucidia-export.zip".into(),
    })
}

#[tauri::command]
pub async fn import_bundle(_payload: ImportBundleInput) -> Result<ImportBundleOutput, ErrorResponse> {
    Ok(ImportBundleOutput {
        imported: ImportBundleOutputDetails {
            memory: 0,
            tasks: 0,
            settings: true,
        },
    })
}
