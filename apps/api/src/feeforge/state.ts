import { createHash } from "node:crypto";
import { promises as fs } from "node:fs";
import { resolve } from "node:path";
import {
  AccountFeePlan,
  FeeAccrualRecord,
  FeeSchedule,
  ExceptionRecord,
  InMemoryExceptionQueue,
} from "@lucidia/core";
import { WormBlock } from "@blackroad/worm";

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

export interface StoredInvoice {
  id: string;
  status: "Draft" | "Issued" | "Paid" | "PartiallyPaid";
  evidencePath?: string;
  data: InvoiceDataSnapshot;
}

export interface ApiFeeForgeState {
  schedules: Record<string, FeeSchedule>;
  plans: Record<string, AccountFeePlan>;
  accruals: FeeAccrualRecord[];
  invoices: StoredInvoice[];
  exceptions: ExceptionRecord[];
  worm: WormBlock[];
}

const STATE_FILE = resolve(process.cwd(), ".feeforge-api-state.json");

export async function loadApiState(): Promise<ApiFeeForgeState> {
  try {
    const raw = await fs.readFile(STATE_FILE, "utf-8");
    const parsed = JSON.parse(raw);
    return {
      schedules: parsed.schedules ?? {},
      plans: parsed.plans ?? {},
      accruals: parsed.accruals ?? [],
      invoices: parsed.invoices ?? [],
      exceptions: parsed.exceptions ?? [],
      worm: parsed.worm ?? [],
    } satisfies ApiFeeForgeState;
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

export async function saveApiState(state: ApiFeeForgeState): Promise<void> {
  await fs.writeFile(STATE_FILE, JSON.stringify(state, null, 2));
}

export function appendApiWorm(state: ApiFeeForgeState, payload: unknown): WormBlock {
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

export function createExceptionQueue(state: ApiFeeForgeState): InMemoryExceptionQueue {
  const queue = new InMemoryExceptionQueue();
  for (const exception of state.exceptions) {
    if (exception.status === "Open") {
      queue.enqueue({
        code: exception.code as any,
        severity: exception.severity,
        message: exception.details as any,
      });
    }
  }
  return queue;
}

export function snapshotInvoice(invoice: {
  id: string;
  status: StoredInvoice["status"];
  evidencePath?: string;
  data: InvoiceDataSnapshot;
}): StoredInvoice {
  return {
    id: invoice.id,
    status: invoice.status,
    evidencePath: invoice.evidencePath,
    data: invoice.data,
  };
}

