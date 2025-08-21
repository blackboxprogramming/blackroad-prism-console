import asyncio
import json
import os

import requests
import websockets

OLLAMA_URL = os.getenv("OLLAMA_URL", "http://10.0.0.10:11434")

async def handler(ws):
    async for message in ws:
        data = json.loads(message)
        prompt = data.get("prompt", "")
        resp = requests.post(f"{OLLAMA_URL}/api/generate", json={"model": "llama3", "prompt": prompt})
        resp.raise_for_status()
        await ws.send(resp.json().get("response", ""))

async def main():
    async with websockets.serve(handler, "0.0.0.0", 8765):
        await asyncio.Future()

if __name__ == "__main__":
    asyncio.run(main())
