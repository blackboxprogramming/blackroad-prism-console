import os, requests, sys
BASE = "https://analytics.blackroad.io"
TOKEN = os.getenv("MATOMO_TOKEN","")
def track(event, props=None):
  props = props or {}
  r = requests.post(f"{BASE}/track", json={"event":event,"props":props}, headers={"Authorization":f"Bearer {TOKEN}"})
  r.raise_for_status()
if __name__ == "__main__":
  track(sys.argv[1] if len(sys.argv)>1 else "manual")
