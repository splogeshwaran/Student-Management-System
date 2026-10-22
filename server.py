"""Serve the student management app and proxy its Coursera course catalog.

Requires only Python's standard library; no virtual environment or packages
need to be installed.

Run with: python server.py
"""

from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen
from urllib.parse import urlsplit


PROJECT_ROOT = Path(__file__).resolve().parent
COURSERA_API = "https://api.coursera.org/api/courses.v1"


class StudentManagementHandler(SimpleHTTPRequestHandler):
    def do_GET(self):
        request_path = urlsplit(self.path)
        if request_path.path != "/api/courses.v1":
            return super().do_GET()

        request = Request(
            COURSERA_API + ("?" + request_path.query if request_path.query else ""),
            headers={"Accept": "application/json"},
        )
        try:
            with urlopen(request, timeout=20) as response:
                body = response.read()
                self.send_response(response.status)
                self.send_header("Content-Type", "application/json; charset=utf-8")
                self.send_header("Cache-Control", "public, max-age=300")
                self.send_header("Content-Length", str(len(body)))
                self.end_headers()
                self.wfile.write(body)
        except HTTPError as error:
            body = error.read()
            self.send_response(error.code)
            self.send_header("Content-Type", error.headers.get("Content-Type", "application/json"))
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
        except (URLError, TimeoutError, OSError) as error:
            self.send_error(502, "Unable to reach Coursera API: " + str(error))


if __name__ == "__main__":
    handler = partial(StudentManagementHandler, directory=str(PROJECT_ROOT))
    server = ThreadingHTTPServer(("127.0.0.1", 8000), handler)
    print("Student Management System running at http://localhost:8000")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStopping server.")
    finally:
        server.server_close()
