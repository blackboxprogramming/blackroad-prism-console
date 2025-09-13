import requests

class BlackRoad:
    def __init__(self, base_url:str, api_key:str):
        self.base = base_url.rstrip('/')
        self.key = api_key

    def ping(self):
        r = requests.get(f"{self.base}/api/public/ping", timeout=10)
        r.raise_for_status()
        return r.json()

    def enqueue_webhook(self, url:str, event:str, data=None):
        data = data or {}
        r = requests.post(f"{self.base}/api/partner/enqueue", json={"url":url,"event":event,"data":data}, headers={"x-br-key": self.key}, timeout=15)
        r.raise_for_status()
        return r.json()
