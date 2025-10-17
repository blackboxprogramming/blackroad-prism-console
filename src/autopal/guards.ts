import { Request, Response, NextFunction } from "express";
import { Config } from "./config";

const normalizeKey = (req: Request) => `${req.method.toUpperCase()} ${req.route?.path ?? req.path}`;

export function maintenanceGuard(cfg: Config) {
  return (req: Request, res: Response, next: NextFunction) => {
    const c = cfg.value;
    const on = !!c.feature_flags.global_enabled;
    const allow = new Set<string>(c.maintenance_mode?.allowlist_endpoints ?? []);
    const key = normalizeKey(req);

    if (on || allow.has(key)) {
      res.setHeader("X-AutoPal-Mode", on ? "normal" : "maintenance");
      return next();
    }
    const status = c.maintenance_mode?.status_code ?? 503;
    const retry = c.maintenance_mode?.retry_after_seconds;
    if (retry) res.setHeader("Retry-After", String(retry));
    res.setHeader("X-AutoPal-Mode", "maintenance");

    if (key === "POST /secrets/materialize") {
      return res.status(403).json({
        code: "materialize_disabled",
        message: "Token minting disabled (global switch).",
      });
    }
    return res.status(status).json({
      code: "maintenance_mode",
      message: "AutoPal is paused by ops.",
      hint: "Try later or use runbooks.",
      runbook: "https://runbooks/autopal/maintenance",
    });
  };
}

export function stepUpGuard(cfg: Config) {
  return (req: Request, res: Response, next: NextFunction) => {
    const c = cfg.value;
    const key = normalizeKey(req);
    const rules = (c.step_up?.rules ?? []) as any[];

    const hit = rules.find((r) => r.match?.endpoint === key);
    const required = !!hit?.required || !!hit?.step_up_required;

    if (!required) return next();

    const approved = req.header("X-Step-Up-Approved") === "true";
    if (!approved) {
      return res.status(401).json({
        code: "step_up_required",
        message: "Additional approval needed",
        mechanisms: hit?.mechanisms ?? [],
        runbook: "https://runbooks/step-up",
      });
    }
    return next();
  };
}
