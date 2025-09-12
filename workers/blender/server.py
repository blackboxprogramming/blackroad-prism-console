from http.server import BaseHTTPRequestHandler, HTTPServer
import json, os

class Handler(BaseHTTPRequestHandler):
    def do_POST(self):
        length = int(self.headers.get('Content-Length', 0))
        self.rfile.read(length)  # ignore body for now
        out_dir = os.path.join(os.getcwd(), 'public', 'renders')
        os.makedirs(out_dir, exist_ok=True)
        out_file = os.path.join(out_dir, 'blender.mp4')
        open(out_file, 'wb').close()
        self.send_response(200)
        self.end_headers()
        self.wfile.write(json.dumps({'ok': True, 'path': out_file}).encode())

def run():
    port = int(os.environ.get('PORT', '3000'))
    with HTTPServer(('', port), Handler) as httpd:
        httpd.serve_forever()

if __name__ == '__main__':
    run()
