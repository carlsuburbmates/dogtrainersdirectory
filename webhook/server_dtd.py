"""
Lightweight local webhook harness for DTD.
- Listens on port 4243
- Accepts POST at /api/webhooks/stripe-dtd and logs headers/body
- Useful for `stripe listen --forward-to http://localhost:4243/api/webhooks/stripe-dtd`
- No dependencies beyond the standard library
"""

from http.server import HTTPServer, BaseHTTPRequestHandler
import json
import sys
from datetime import datetime

HOST = "127.0.0.1"
PORT = 4243
LOG_FILE = "server.log"
PATH = "/api/webhooks/stripe-dtd"


def log(message: str):
    timestamp = datetime.utcnow().isoformat() + "Z"
    line = f"[{timestamp}] {message}\n"
    sys.stdout.write(line)
    sys.stdout.flush()
    with open(LOG_FILE, "a") as f:
        f.write(line)


class Handler(BaseHTTPRequestHandler):
    def do_POST(self):  # noqa: N802
        if self.path != PATH:
            self.send_response(404)
            self.end_headers()
            return

        length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(length).decode("utf-8") if length else ""

        log(f"Headers: {dict(self.headers)}")
        log(f"Body: {body}")

        # Try to parse JSON for readability
        try:
            parsed = json.loads(body)
            log(f"Parsed JSON: {json.dumps(parsed, indent=2)}")
        except Exception:
            pass

        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(b"{\"ok\": true}")

    def log_message(self, format, *args):  # noqa: D401, N802
        # Silence default HTTP logs; we log manually above
        return


def main():
    log(f"Starting webhook harness on http://{HOST}:{PORT}{PATH}")
    server = HTTPServer((HOST, PORT), Handler)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        log("Shutting down server")
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
