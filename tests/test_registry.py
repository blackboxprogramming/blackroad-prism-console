from orchestrator import registry


def test_registry_discovery():
    names = {bot.NAME for bot in registry.list()}
    assert {"Treasury-BOT", "RevOps-BOT", "SRE-BOT"}.issubset(names)
    assert registry.get("RevOps-BOT").NAME == "RevOps-BOT"
