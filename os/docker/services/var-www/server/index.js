import express from "express";

const app = express();
const PORT = process.argv.includes("--port")
  ? process.argv[process.argv.indexOf("--port") + 1]
  : process.env.PORT || 9000;

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "var-www" });
});

app.get("/", (_req, res) => {
  res.json({
    message: "BlackRoad Web UI stub",
    todo: "Replace with built UI or reverse proxy to Next.js/React app",
  });
});

app.listen(PORT, () => {
  console.log(`var-www listening on port ${PORT}`);
});
