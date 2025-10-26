#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod ipc;
mod fs;
mod platform;


fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            ipc::codex::query_codex,
            ipc::codex::save_memory,
            ipc::codex::list_memory,
            ipc::codex::update_memory,
            ipc::codex::delete_memory,
            ipc::tasks::run_task,
            ipc::tasks::get_task,
            ipc::tasks::list_tasks,
            ipc::secure::secure_set,
            ipc::secure::secure_get,
            ipc::secure::secure_delete,
            ipc::settings::get_settings,
            ipc::settings::save_settings,
            ipc::export_import::export_bundle,
            ipc::export_import::import_bundle,
        ])
        .setup(|_app| {
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("failed to run Lucidia Desktop");
}
