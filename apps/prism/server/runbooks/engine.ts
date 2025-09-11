import fs from "fs";
import { Guard, Runbook } from "./schema";

export interface Context {
  stderr: string;
  stdout: string;
  diffs: string[];
  exitCode: number;
  lang: string;
}

export function findCandidates(runbooks: Runbook[], ctx: Context): Runbook[] {
  return runbooks
    .map((rb) => {
      let score = 0;
      for (const m of rb.match) {
        if (m.lang && m.lang.includes(ctx.lang)) score++;
        if (m.exitCode && m.exitCode.includes(ctx.exitCode)) score++;
        if (m.errorRegex) {
          const target = ctx.stderr + ctx.stdout;
          if (m.errorRegex.some((r) => new RegExp(r).test(target))) score++;
        }
        if (m.fileRegex) {
          if (m.fileRegex.some((r) => ctx.diffs.some((p) => new RegExp(r).test(p)))) score++;
        }
      }
      return { rb, score };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .map(({ rb }) => rb);
}

function checkGuard(g: Guard, answers: Record<string, any>) {
  const val = answers[g.answerId];
  if (g.equals !== undefined && val !== g.equals) return false;
  if (g.notEquals !== undefined && val === g.notEquals) return false;
  if (g.regex && !(typeof val === "string" && new RegExp(g.regex).test(val))) return false;
  return true;
}

export async function runProbes(rb: Runbook, ctx: Context): Promise<Record<string, any>> {
  const results: Record<string, any> = {};
  if (!rb.probes) return results;
  for (const p of rb.probes) {
    switch (p.type) {
      case "envPresent": {
        const key = String(p.args.key);
        results[p.set] = process.env[key] !== undefined;
        break;
      }
      case "fileExists": {
        const file = String(p.args.path ?? "");
        results[p.set] = fs.existsSync(file);
        break;
      }
      case "cmdOk": {
        results[p.set] = false;
        break;
      }
      case "portFree": {
        results[p.set] = true;
        break;
      }
    }
  }
  return results;
}

function substitute(tmpl: string, data: Record<string, any>): string {
  return tmpl.replace(/\$\{\{([^}]+)\}\}|\{\{([^}]+)\}\}/g, (_, expr1, expr2) => {
    const expr = (expr1 || expr2).trim();
    const val = expr.split(".").reduce((acc, key) => (acc as any)?.[key], data);
    return val === undefined ? "" : String(val);
  });
}

function guardSatisfied(when: Guard[] | undefined, answers: Record<string, any>) {
  if (!when) return true;
  return when.every((g) => checkGuard(g, answers));
}

export function synthesizePlan(rb: Runbook, answers: Record<string, any>) {
  const diffs: { path: string; content: string }[] = [];
  const cmds: string[] = [];
  const plan = rb.plan;
  for (const step of plan.steps) {
    if (!guardSatisfied(step.when, answers)) continue;
    if (step.kind === "diff") {
      const content = substitute(step.template, { answers });
      diffs.push({ path: step.path, content });
    } else if (step.kind === "cmd") {
      const cmd = substitute(step.cmd, { answers });
      cmds.push(cmd);
    }
  }
  const tests = plan.tests?.map((t) => `${t.framework} ${t.args.join(" ")}`);
  return { diffs, cmds, tests };
}
