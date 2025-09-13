import { Router } from "express";
import { pushMatomo } from "../lib/metrics.js";
export const router = Router();
router.post("/matomo", async (req, res) => {
  try {
    // forward minimal GitHub event info
    const token = process.env.MATOMO_TOKEN || "";
    await pushMatomo("track", { event: req.body?.action || "push", payload: req.body }, token);
    res.json({ ok: true });
  } catch (e:any) {
    res.status(500).json({ ok:false, error: e.message });
  }
});
