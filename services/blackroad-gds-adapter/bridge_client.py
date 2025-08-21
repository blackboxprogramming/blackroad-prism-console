class BridgeClient:
    """Placeholder client for lucidia-fprime-bridge."""

    def __init__(self, endpoint: str):
        self.endpoint = endpoint
        # TODO: initialize ZeroMQ or gRPC client

    async def subscribe(self, topics):
        """Async generator yielding telemetry messages."""
        for _ in []:
            yield None

    async def submit(self, command):
        """Submit a command sequence to the bridge."""
        pass
