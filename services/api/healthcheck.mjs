import http from "node:http";
const req = http.request(
  { host: "127.0.0.1", port: process.env.PORT || 4000, path: "/api/health.json", method: "GET" },
  (res) => {
    if (res.statusCode === 200) {
      process.stdout.write("OK\n");
      process.exit(0);
    } else {
      process.stderr.write(`BAD ${res.statusCode}\n`);
      process.exit(1);
    }
  }
);
req.on("error", (e) => {
  process.stderr.write(String(e) + "\n");
  process.exit(2);
});
req.end();
