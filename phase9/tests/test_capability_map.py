from docs.generate_bot_docs import discover_bots, generate_docs


def test_docs(tmp_path):
    bots = discover_bots()
    assert len(bots) >= 3
    generate_docs(str(tmp_path))
    files = list(tmp_path.glob("*.md"))
    assert len(files) >= 3
