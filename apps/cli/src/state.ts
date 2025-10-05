import { createHash } from "node:crypto";
import { promises as fs } from "node:fs";
import { resolve } from "node:path";
import {
  AccountFeePlan,
  FeeAccrualRecord,
  FeeSchedule,
  ExceptionRecord,
} from "@lucidia/core";
import { WormBlock } from "@blackroad/worm";

export interface StoredInvoice {
  id: string;
  status: "Draft" | "Issued" | "Paid" | "PartiallyPaid";
  evidencePath?: string;
  data: InvoiceDataSnapshot;
}

export interface InvoiceDataSnapshot {
  billingPeriodStart: string;
  billingPeriodEnd: string;
  billingGroupId?: string | null;
  accountId?: string | null;
  currency: string;
  amount: number;
  lines: unknown;
  minimumAppliedUSD?: number;
}

export interface FeeForgeState {
  schedules: Record<string, FeeSchedule>;
  plans: Record<string, AccountFeePlan>;
  accruals: FeeAccrualRecord[];
  invoices: StoredInvoice[];
  exceptions: ExceptionRecord[];
  worm: WormBlock[];
}

const STATE_FILE = resolve(process.cwd(), ".feeforge-state.json");

export async function loadState(): Promise<FeeForgeState> {
  try {
    const data = await fs.readFile(STATE_FILE, "utf-8");
    const parsed = JSON.parse(data);
    return {
      schedules: parsed.schedules ?? {},
      plans: parsed.plans ?? {},
      accruals: parsed.accruals ?? [],
      invoices: parsed.invoices ?? [],
      exceptions: parsed.exceptions ?? [],
      worm: parsed.worm ?? [],
    } satisfies FeeForgeState;
  } catch (error) {
    return {
      schedules: {},
      plans: {},
      accruals: [],
      invoices: [],
      exceptions: [],
      worm: [],
    };
  }
}

export async function saveState(state: FeeForgeState): Promise<void> {
  const serialized = JSON.stringify(state, null, 2);
  await fs.writeFile(STATE_FILE, serialized, "utf-8");
}

export function appendWorm(state: FeeForgeState, payload: unknown): WormBlock {
  const prev = state.worm[state.worm.length - 1] ?? null;
  const prevHash = prev?.hash ?? "GENESIS";
  const idx = prev ? prev.idx + 1 : 1;
  const ts = new Date();
  const hash = createHash("sha256")
    .update(JSON.stringify({ prevHash, payload }))
    .digest("hex");
  const block: WormBlock = { idx, ts, payload, prevHash, hash };
  state.worm.push(block);
  return block;
}

