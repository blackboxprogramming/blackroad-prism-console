import asyncio
import ssl
import websockets
from bridge_client import BridgeClient

CA_PATH = "/etc/blackroad/ca.pem"
CERT = "/etc/blackroad/client.pem"
KEY = "/etc/blackroad/client.key"
WS_URL = "wss://mission-control.blackroad.local/gds"

ssl_ctx = ssl.create_default_context(cafile=CA_PATH)
ssl_ctx.load_cert_chain(CERT, KEY)

def sign(msg):
    # TODO: implement signing
    return msg

def verify_and_parse(msg):
    # TODO: verify signature and parse command
    return msg

async def telemetry_task(ws, bridge):
    async for tlm in bridge.subscribe(["*"]):
        await ws.send(sign(tlm))

async def command_task(ws, bridge):
    async for msg in ws:
        cmd = verify_and_parse(msg)
        await bridge.submit(cmd)

async def main():
    bridge = BridgeClient("ipc:///var/run/lucidia_bridge.sock")
    async with websockets.connect(WS_URL, ssl=ssl_ctx) as ws:
        await asyncio.gather(
            telemetry_task(ws, bridge),
            command_task(ws, bridge),
        )

if __name__ == "__main__":
    asyncio.run(main())
