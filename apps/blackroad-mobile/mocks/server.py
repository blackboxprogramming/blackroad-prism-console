#!/usr/bin/env python3
import http.server
import json
import pathlib

PORT = 5051
ROOT = pathlib.Path(__file__).resolve().parent.parent / "Resources" / "mocks"

class Handler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path == "/api/mobile/dashboard":
            payload = json.loads((ROOT / "dashboard.json").read_text())
            data = json.dumps(payload).encode("utf-8")
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(data)))
            self.end_headers()
            self.wfile.write(data)
        else:
            self.send_response(404)
            self.end_headers()

if __name__ == "__main__":
    server = http.server.ThreadingHTTPServer(("0.0.0.0", PORT), Handler)
    print(f"Mock server listening on http://127.0.0.1:{PORT}")
    server.serve_forever()
