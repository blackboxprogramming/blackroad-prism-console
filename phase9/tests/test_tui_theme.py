from tui import app


def test_themes():
    assert app.run("light")["background"] == "white"
    assert app.run("dark")["background"] == "black"
