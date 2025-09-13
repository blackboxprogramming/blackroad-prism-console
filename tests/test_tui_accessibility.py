from tui import app


def test_theme_and_keybinds():
    data = app.run(theme="high_contrast", lang="es")
    assert data["theme"]["background"] == "#000000"
    assert "up" in data["keybinds"]
