"""Example plugin showcasing the BlackRoad plugin interface."""


def register(plugin_manager):
    """Register plugin components with the plugin manager."""
    plugin_manager.register("example", lambda: None)
