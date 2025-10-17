import express from "express";
import { Config } from "./config";
import { maintenanceGuard, stepUpGuard } from "./guards";

const app = express();
app.use(express.json());

const cfg = new Config();

app.use(maintenanceGuard(cfg));

app.get("/health/live", (_req, res) =>
  res.json({ status: "ok", ts: new Date().toISOString() })
);
app.get("/health/ready", (_req, res) =>
  res.json({ status: "ok", deps: ["db", "queue"], ts: new Date().toISOString() })
);

app.post("/secrets/resolve", stepUpGuard(cfg), (req, res) => {
  res.json({
    role: req.body?.role ?? "unknown",
    env: req.body?.env ?? "unknown",
    provenance: "vault_rotation",
    secret_ref: "vault://kv/example",
    expires_at: new Date(Date.now() + 3_600_000).toISOString(),
    least_privilege: true,
    can_materialize: true,
  });
});

app.post("/secrets/materialize", stepUpGuard(cfg), (_req, res) => {
  res.json({
    token: "redacted",
    expires_at: new Date(Date.now() + 1_800_000).toISOString(),
  });
});

app.post("/fossil/override", stepUpGuard(cfg), (_req, res) => {
  res.status(202).json({ granted: "pending_second_approval", ticket: "FX-1243" });
});

const port = Number(process.env.PORT ?? 8080);
app.listen(port, () => console.log(`AutoPal API on :${port}`));
