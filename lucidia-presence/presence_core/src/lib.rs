#![forbid(unsafe_code)]

use bevy::prelude::*;

pub struct PresenceCorePlugin;

impl Plugin for PresenceCorePlugin {
    fn build(&self, app: &mut App) {
        app.add_systems(Startup, setup);
    }
}

fn setup(mut commands: Commands) {
    commands.spawn(Camera3dBundle::default());
}
