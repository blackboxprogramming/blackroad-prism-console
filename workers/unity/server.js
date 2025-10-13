import express from "express";
import { createUnityProject } from "./exporter.js";

const app = express();
app.use(express.json());

app.post("/export", async (req, res) => {
  try {
    const { projectName, description } = req.body ?? {};
    const result = await createUnityProject({ projectName, description });
    res.json({ ok: true, ...result });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: error.message,
      details: error.cause ? String(error.cause) : undefined,
    });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log("unity exporter listening on", port));
