mod fs;
mod ipc;
mod platform;

use ipc::codex::{delete_memory, list_memory, query_codex, save_memory, update_memory};
use ipc::export_import::{export_bundle, import_bundle};
use ipc::secure::{secure_delete, secure_get, secure_set};
use ipc::settings::{get_settings, save_settings};
use ipc::tasks::{get_task, list_tasks, run_task};
use tauri::{generate_context, generate_handler, Builder};

fn main() {
  Builder::default()
    .invoke_handler(generate_handler![
      query_codex,
      save_memory,
      list_memory,
      update_memory,
      delete_memory,
      run_task,
      get_task,
      list_tasks,
      secure_set,
      secure_get,
      secure_delete,
      get_settings,
      save_settings,
      export_bundle,
      import_bundle
    ])
    .run(generate_context!())
    .expect("error while running Lucidia Desktop");
}
