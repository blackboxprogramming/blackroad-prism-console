#![forbid(unsafe_code)]

use presence_core::PresenceCorePlugin;
use wasm_bindgen::prelude::*;

#[wasm_bindgen(start)]
pub fn run() {
    console_error_panic_hook::set_once();
    let mut app = bevy::prelude::App::new();
    app.add_plugins(bevy::DefaultPlugins);
    app.add_plugins(PresenceCorePlugin);
}
