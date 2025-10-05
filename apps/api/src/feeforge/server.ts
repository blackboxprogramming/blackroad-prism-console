import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import { resolve } from "node:path";
import Fastify from "fastify";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import { ZodTypeProvider } from "@fastify/type-provider-zod";
import { z } from "zod";
import {
  AccountFeePlan,
  FeeAccrualRecord,
  FeeSchedule,
  computeDailyAccrual,
  generateInArrearsInvoice,
} from "@lucidia/core";
import { enforceFeeCap, requireCustodyAuthorization } from "@blackroad/policies";
import { renderInvoicePdf, submitCustodyDeduction } from "@blackroad/integrations";
import {
  ApiFeeForgeState,
  appendApiWorm,
  loadApiState,
  saveApiState,
  snapshotInvoice,
  StoredInvoice,
  InvoiceDataSnapshot,
} from "./state.js";

const MarketValueSchema = z.object({
  accountId: z.string(),
  marketValue: z.number(),
  cryptoMarketValue: z.number().optional(),
});

function planToHouseholdTotal(state: ApiFeeForgeState, market: z.infer<typeof MarketValueSchema>[], plan: AccountFeePlan): number | undefined {
  if (!plan.billingGroupId) return undefined;
  const relatedAccounts = Object.values(state.plans)
    .filter((p) => p.billingGroupId === plan.billingGroupId)
    .map((p) => p.accountId);
  return market
    .filter((entry) => relatedAccounts.includes(entry.accountId))
    .reduce((sum, entry) => sum + entry.marketValue + (entry.cryptoMarketValue ?? 0), 0);
}

function toInvoiceSnapshot(draft: ReturnType<typeof generateInArrearsInvoice>): InvoiceDataSnapshot {
  return {
    billingPeriodStart: draft.billingPeriodStart.toISOString(),
    billingPeriodEnd: draft.billingPeriodEnd.toISOString(),
    billingGroupId: draft.billingGroupId ?? null,
    accountId: draft.accountId ?? null,
    currency: draft.currency,
    amount: draft.amount,
    lines: draft.lines,
    minimumAppliedUSD: draft.minimumAppliedUSD,
  };
}

export async function buildFeeForgeServer() {
  const server = Fastify().withTypeProvider<ZodTypeProvider>();
  await server.register(swagger, { openapi: { info: { title: "FeeForge API", version: "0.1.0" } } });
  await server.register(swaggerUi, {});

  server.post("/feeschedules", {
    schema: {
      body: z.object({
        name: z.string(),
        status: z.enum(["Active", "Draft", "Retired"]).default("Active"),
        spec: z.record(z.any()),
      }),
      response: {
        200: z.object({ id: z.string(), name: z.string() }),
      },
    },
  }, async (request, reply) => {
    const state = await loadApiState();
    const body = request.body;
    const schedule: FeeSchedule = {
      id: randomUUID(),
      name: body.name,
      status: body.status,
      spec: body.spec as FeeSchedule["spec"],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    state.schedules[schedule.id] = schedule;
    appendApiWorm(state, { type: "API_FEE_SCHEDULE", scheduleId: schedule.id });
    await saveApiState(state);
    return reply.send({ id: schedule.id, name: schedule.name });
  });

  server.post("/plans", {
    schema: {
      body: z.object({
        accountId: z.string(),
        feeScheduleId: z.string(),
        billingGroupId: z.string().optional(),
        startDate: z.string(),
        billFrequency: z.enum(["Monthly", "Quarterly"]),
        billMode: z.enum(["InArrears", "InAdvance"]),
        billCurrency: z.enum(["USD", "CRYPTO_USD_EQ"]).default("USD"),
        custodyDeductionAllowed: z.boolean().default(false),
        performanceFeeAllowed: z.boolean().default(false),
      }),
      response: { 200: z.object({ id: z.string() }) },
    },
  }, async (request, reply) => {
    const state = await loadApiState();
    const schedule = state.schedules[request.body.feeScheduleId];
    if (!schedule) {
      return reply.status(400).send({ error: "Fee schedule not found" });
    }
    const plan: AccountFeePlan = {
      id: randomUUID(),
      accountId: request.body.accountId,
      feeScheduleId: request.body.feeScheduleId,
      billingGroupId: request.body.billingGroupId ?? null,
      startDate: new Date(request.body.startDate),
      endDate: null,
      billFrequency: request.body.billFrequency,
      billMode: request.body.billMode,
      billCurrency: request.body.billCurrency,
      custodyDeductionAllowed: request.body.custodyDeductionAllowed,
      performanceFeeAllowed: request.body.performanceFeeAllowed,
      createdAt: new Date(),
    };
    state.plans[plan.id] = plan;
    appendApiWorm(state, { type: "API_PLAN", planId: plan.id });
    await saveApiState(state);
    return reply.send({ id: plan.id });
  });

  server.post("/accruals/run", {
    schema: {
      querystring: z.object({ asOf: z.string() }),
      body: z.object({ market: z.array(MarketValueSchema) }),
      response: {
        200: z.object({ count: z.number() }),
      },
    },
  }, async (request, reply) => {
    const state = await loadApiState();
    const asOf = new Date(request.query.asOf);
    const accruals: FeeAccrualRecord[] = [];
    for (const plan of Object.values(state.plans)) {
      const schedule = state.schedules[plan.feeScheduleId];
      if (!schedule) continue;
      const mv = request.body.market.find((entry) => entry.accountId === plan.accountId);
      if (!mv) continue;
      const household = planToHouseholdTotal(state, request.body.market, plan);
      const accrual = computeDailyAccrual({
        plan,
        schedule,
        marketValue: {
          accountId: plan.accountId,
          asOf,
          marketValue: mv.marketValue,
          cryptoMarketValue: mv.cryptoMarketValue,
        },
        householdValue: household,
      });
      const capViolation = enforceFeeCap({ effectiveBps: accrual.rateBps, scheduleSpec: schedule.spec });
      if (capViolation) {
        state.exceptions.push({
          id: randomUUID(),
          accountId: plan.accountId,
          invoiceId: null,
          code: capViolation.code,
          severity: capViolation.severity,
          details: capViolation.details ?? {},
          status: "Open",
          createdAt: new Date(),
          resolvedAt: null,
        });
      }
      accruals.push(accrual);
    }
    state.accruals = state.accruals.filter(
      (existing) => new Date(existing.asOf).toISOString() !== asOf.toISOString()
    );
    state.accruals.push(...accruals);
    appendApiWorm(state, { type: "API_ACCRUAL", asOf: asOf.toISOString(), count: accruals.length });
    await saveApiState(state);
    return reply.send({ count: accruals.length });
  });

  server.post("/invoices/generate", {
    schema: {
      querystring: z.object({ period: z.string(), scope: z.string().optional() }),
      response: { 200: z.object({ generated: z.number() }) },
    },
  }, async (request, reply) => {
    const state = await loadApiState();
    const [yearPart, quarterPart] = request.query.period.split("Q");
    const year = Number(yearPart);
    const quarter = Number(quarterPart);
    if (!year || !quarter) {
      return reply.status(400).send({ error: "Invalid period" });
    }
    const startMonth = (quarter - 1) * 3;
    const start = new Date(Date.UTC(year, startMonth, 1));
    const end = new Date(Date.UTC(year, startMonth + 3, 0));
    const invoices: StoredInvoice[] = [];
    for (const plan of Object.values(state.plans)) {
      if (request.query.scope) {
        if (request.query.scope.startsWith("household:") && plan.billingGroupId !== request.query.scope.split(":")[1]) {
          continue;
        }
        if (request.query.scope.startsWith("account:") && plan.accountId !== request.query.scope.split(":")[1]) {
          continue;
        }
      }
      const schedule = state.schedules[plan.feeScheduleId];
      if (!schedule) continue;
      const accruals = state.accruals.filter(
        (record) =>
          record.planId === plan.id &&
          new Date(record.asOf) >= start &&
          new Date(record.asOf) <= end
      );
      if (accruals.length === 0) continue;
      const draft = generateInArrearsInvoice({
        plan,
        schedule,
        accruals,
        billingPeriodStart: start,
        billingPeriodEnd: end,
      });
      const snapshot = toInvoiceSnapshot(draft);
      const invoice: StoredInvoice = {
        id: `INV-${randomUUID()}`,
        status: "Draft",
        data: snapshot,
      };
      invoices.push(invoice);
    }
    state.invoices = state.invoices.filter((existing) =>
      !invoices.some((generated) => generated.data.accountId === existing.data.accountId && generated.data.billingPeriodStart === existing.data.billingPeriodStart)
    );
    state.invoices.push(...invoices.map(snapshotInvoice));
    appendApiWorm(state, { type: "API_INVOICE_GENERATED", count: invoices.length });
    await saveApiState(state);
    return reply.send({ generated: invoices.length });
  });

  server.post("/invoices/:id/issue", {
    schema: {
      params: z.object({ id: z.string() }),
      response: { 200: z.object({ status: z.string(), evidencePath: z.string() }) },
    },
  }, async (request, reply) => {
    const state = await loadApiState();
    const invoice = state.invoices.find((item) => item.id === request.params.id);
    if (!invoice) {
      return reply.status(404).send({ error: "Invoice not found" });
    }
    const pdf = await renderInvoicePdf({
      billingPeriodStart: new Date(invoice.data.billingPeriodStart),
      billingPeriodEnd: new Date(invoice.data.billingPeriodEnd),
      billingGroupId: invoice.data.billingGroupId ?? undefined,
      accountId: invoice.data.accountId ?? undefined,
      currency: invoice.data.currency,
      amount: invoice.data.amount,
      lines: invoice.data.lines as any,
      minimumAppliedUSD: invoice.data.minimumAppliedUSD,
    });
    const outputDir = resolve(process.cwd(), "api-invoices");
    await fs.mkdir(outputDir, { recursive: true });
    const evidencePath = resolve(outputDir, pdf.filename);
    await fs.writeFile(evidencePath, pdf.buffer);
    invoice.status = "Issued";
    invoice.evidencePath = evidencePath;
    appendApiWorm(state, { type: "API_INVOICE_ISSUED", invoiceId: invoice.id, evidencePath });
    await saveApiState(state);
    return reply.send({ status: invoice.status, evidencePath });
  });

  server.post("/payments/record", {
    schema: {
      body: z.object({
        invoiceId: z.string(),
        method: z.enum(["CustodyDeduction", "ACH", "Wire", "Check", "Crypto"]),
        amount: z.number(),
        currency: z.string().default("USD"),
      }),
      response: { 200: z.object({ status: z.string() }) },
    },
  }, async (request, reply) => {
    const state = await loadApiState();
    const invoice = state.invoices.find((item) => item.id === request.body.invoiceId);
    if (!invoice) {
      return reply.status(404).send({ error: "Invoice not found" });
    }
    if (request.body.method === "CustodyDeduction") {
      const plan = Object.values(state.plans).find((p) => p.accountId === invoice.data.accountId);
      if (!plan) {
        return reply.status(400).send({ error: "Plan not found" });
      }
      const violation = requireCustodyAuthorization({ plan, authorization: plan.custodyDeductionAllowed ? { planId: plan.id, granted: true } : null });
      if (violation) {
        return reply.status(400).send({ error: violation.message });
      }
      await submitCustodyDeduction({
        plan,
        invoiceId: invoice.id,
        amount: request.body.amount,
        currency: request.body.currency,
      });
    }
    invoice.status = request.body.amount >= invoice.data.amount ? "Paid" : "PartiallyPaid";
    appendApiWorm(state, { type: "API_PAYMENT", invoiceId: invoice.id, method: request.body.method });
    await saveApiState(state);
    return reply.send({ status: invoice.status });
  });

  server.post("/invoices/:id/reverse", {
    schema: {
      params: z.object({ id: z.string() }),
      body: z.object({ reason: z.string().default("Manual reversal") }),
      response: { 200: z.object({ status: z.string() }) },
    },
  }, async (request, reply) => {
    const state = await loadApiState();
    const invoice = state.invoices.find((item) => item.id === request.params.id);
    if (!invoice) {
      return reply.status(404).send({ error: "Invoice not found" });
    }
    invoice.status = "Draft";
    appendApiWorm(state, { type: "API_INVOICE_REVERSED", invoiceId: invoice.id, reason: request.body.reason });
    await saveApiState(state);
    return reply.send({ status: invoice.status });
  });

  server.get("/exceptions", {
    schema: {
      querystring: z.object({ status: z.string().optional() }),
      response: {
        200: z.object({ exceptions: z.array(z.record(z.any())) }),
      },
    },
  }, async (request, reply) => {
    const state = await loadApiState();
    const exceptions = state.exceptions.filter((item) =>
      request.query.status ? item.status === request.query.status : true
    );
    return reply.send({ exceptions });
  });

  server.post("/exceptions/:id/resolve", {
    schema: {
      params: z.object({ id: z.string() }),
      body: z.object({ action: z.enum(["Approve", "Reject", "Waive"]), note: z.string().optional() }),
      response: { 200: z.object({ status: z.string() }) },
    },
  }, async (request, reply) => {
    const state = await loadApiState();
    const exception = state.exceptions.find((item) => item.id === request.params.id);
    if (!exception) {
      return reply.status(404).send({ error: "Exception not found" });
    }
    exception.status = request.body.action === "Approve" ? "Approved" : request.body.action === "Reject" ? "Rejected" : "Waived";
    exception.resolvedAt = new Date();
    appendApiWorm(state, { type: "API_EXCEPTION_RESOLVED", id: exception.id, action: request.body.action });
    await saveApiState(state);
    return reply.send({ status: exception.status });
  });

  return server;
}

