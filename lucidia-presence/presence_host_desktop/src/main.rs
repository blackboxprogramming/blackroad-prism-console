#![forbid(unsafe_code)]

use presence_core::PresenceCorePlugin;

fn main() {
    tauri::Builder::default()
        .setup(|_app| {
            // Initialize Bevy app inside Tauri
            let mut app = bevy::prelude::App::new();
            app.add_plugins(bevy::DefaultPlugins);
            app.add_plugins(PresenceCorePlugin);
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
