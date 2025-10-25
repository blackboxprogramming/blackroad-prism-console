import asyncio

from roadglitch.connectors.registry import build_registry


def test_template_connector_registered():
    registry = build_registry()
    connector = registry["connector.template.echo"]

    async def run() -> None:
        result = await connector.execute(context={"run_id": 1}, params={"message": "hi"})
        assert result["echo"] == "hi"
        assert result["context"] == 1

    asyncio.run(run())

