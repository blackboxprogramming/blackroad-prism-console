import { describe, it, expect, beforeEach } from "vitest";
import { Decimal } from "decimal.js";
import { InMemoryWormLedger } from "../../worm/src/index.js";
import {
  TradeOS,
  TradeOSDependencies,
  ClientOSGateway,
  ComplianceOSGateway,
  CustodySyncGateway,
  SurveillanceHubGateway,
  RegDeskGateway,
  FeeForgeGateway,
  OrderInput,
  RoutingAdapters,
  Execution,
} from "../src/index.js";

class InMemoryClientOS implements ClientOSGateway {
  constructor(private readonly gates: Record<string, any>) {}
  async getAccountGates(accountId: string) {
    return this.gates[accountId];
  }
  async verifyWallet(accountId: string, address: string): Promise<boolean> {
    const account = this.gates[accountId];
    const wallet = account.wallets[address];
    return wallet?.whitelisted ?? false;
  }
}

interface ComplianceState {
  restrictedSymbols: Set<string>;
  ipoCoolingOff: Record<string, { effectiveDate: Date; tombstoneOnly?: boolean }>;
  marketingHold: boolean;
  amlFlag: boolean;
  requiresU4Amendment?: boolean;
}

class InMemoryComplianceOS implements ComplianceOSGateway {
  constructor(public readonly state: Record<string, ComplianceState>, private readonly alerts: string[]) {}
  async getSnapshot(accountId: string, instrumentId: string) {
    return this.state[accountId] ?? {
      restrictedSymbols: new Set<string>(),
      ipoCoolingOff: {},
      marketingHold: false,
      amlFlag: false,
    };
  }
  async isSymbolRestricted(symbol: string) {
    const entry = Object.values(this.state).find((snap) => snap.restrictedSymbols.has(symbol));
    if (entry) {
      this.alerts.push(`restricted:${symbol}`);
      return { restricted: true, reason: "Restricted" };
    }
    return { restricted: false };
  }
  async recordOverride(): Promise<void> {
    // noop for tests
  }
}

class InMemoryCustodySync implements CustodySyncGateway {
  cash = new Map<string, Decimal>();
  positions = new Map<string, Map<string, Decimal>>();
  lots = new Map<string, Map<string, Decimal[]>>();

  async getSnapshot(accountId: string, instrumentId: string) {
    return {
      cash: this.cash.get(accountId) ?? new Decimal(0),
      positions: Object.fromEntries((this.positions.get(accountId)?.entries() ?? []).map(([k, v]) => [k, v])),
      lots: Object.fromEntries((this.lots.get(accountId)?.entries() ?? []).map(([k, v]) => [k, v])),
    };
  }

  async updatePosition(input: { accountId: string; instrumentId: string; quantity: Decimal; cashDelta: Decimal; avgPrice: Decimal; }) {
    const positionMap = this.positions.get(input.accountId) ?? new Map<string, Decimal>();
    const current = positionMap.get(input.instrumentId) ?? new Decimal(0);
    positionMap.set(input.instrumentId, current.plus(input.quantity));
    this.positions.set(input.accountId, positionMap);

    const currentCash = this.cash.get(input.accountId) ?? new Decimal(0);
    this.cash.set(input.accountId, currentCash.plus(input.cashDelta));
  }
}

class InMemorySurveillance implements SurveillanceHubGateway {
  constructor(private readonly insiders: Set<string>) {}
  async isInsider(accountId: string, instrumentId: string) {
    return this.insiders.has(`${accountId}:${instrumentId}`);
  }
}

class InMemoryRegDesk implements RegDeskGateway {
  public readonly confirms: string[] = [];
  async logConfirm(confirm: any): Promise<void> {
    this.confirms.push(confirm.id);
  }
}

class InMemoryFeeForge implements FeeForgeGateway {
  constructor(private readonly rules: Record<string, { popOnly: boolean; breakpointEligible: boolean }>) {}
  async getMutualFundRules(symbol: string) {
    return this.rules[symbol] ?? { popOnly: true, breakpointEligible: false };
  }
}

function createAdapters(): RoutingAdapters {
  return {
    equity: async ({ block }) => [createExecution(block, "NYSE")],
    etf: async ({ block }) => [createExecution(block, "ARCA")],
    options: async ({ block }) => [createExecution(block, "CBOE")],
    bond: async ({ block }) => [createExecution(block, "TRACE")],
    mutualFund: async ({ block }) => [createExecution(block, "MF_DESK")],
    crypto: {
      rfq: async ({ block }) => ({
        execution: createExecution(block, "RFQ:VENUEX"),
        quotes: [{ venue: "VENUEX", price: new Decimal(100) }],
      }),
      dex: async ({ block }) => ({
        execution: createExecution(block, "DEX:UNISWAP"),
        route: "USDC-ETH",
      }),
    },
  };
}

function createExecution(block: any, venue: string): Execution {
  return {
    id: `EXEC-${block.id}`,
    orderId: "",
    venue,
    execId: `X-${block.id}`,
    qty: new Decimal(block.totalQty),
    price: new Decimal(100),
    ts: new Date(),
  };
}

interface TestContext {
  tradeOS: TradeOS;
  custody: InMemoryCustodySync;
  regdesk: InMemoryRegDesk;
  worm: InMemoryWormLedger<any>;
  alerts: string[];
  deps: TradeOSDependencies;
}

function setup(): TestContext {
  const worm = new InMemoryWormLedger<any>();
  const custody = new InMemoryCustodySync();
  custody.cash.set("ACC-1", new Decimal(100000));
  custody.cash.set("ACC-2", new Decimal(100000));
  custody.cash.set("ACC-3", new Decimal(100000));
  const regdesk = new InMemoryRegDesk();
  const alerts: string[] = [];

  const deps: TradeOSDependencies = {
    clientOS: new InMemoryClientOS({
      "ACC-1": {
        accountId: "ACC-1",
        kycCleared: true,
        amlCleared: true,
        suitability: true,
        optionsLevel: 1,
        marginApproved: true,
        cryptoEnabled: true,
        wallets: {
          "0xverified": { whitelisted: true },
        },
      },
      "ACC-2": {
        accountId: "ACC-2",
        kycCleared: true,
        amlCleared: true,
        suitability: true,
        optionsLevel: 3,
        marginApproved: true,
        cryptoEnabled: true,
        wallets: {
          "0xverified": { whitelisted: true },
        },
      },
      "ACC-3": {
        accountId: "ACC-3",
        kycCleared: true,
        amlCleared: true,
        suitability: true,
        optionsLevel: 3,
        marginApproved: true,
        cryptoEnabled: true,
        wallets: {
          "0xverified": { whitelisted: true },
        },
      },
    }),
    complianceOS: new InMemoryComplianceOS(
      {
        "ACC-1": {
          restrictedSymbols: new Set<string>(),
          ipoCoolingOff: {},
          marketingHold: false,
          amlFlag: false,
        },
        "ACC-2": {
          restrictedSymbols: new Set<string>(),
          ipoCoolingOff: {},
          marketingHold: false,
          amlFlag: false,
        },
        "ACC-3": {
          restrictedSymbols: new Set<string>(),
          ipoCoolingOff: {},
          marketingHold: false,
          amlFlag: false,
        },
      },
      alerts,
    ),
    custodySync: custody,
    surveillanceHub: new InMemorySurveillance(new Set()),
    regDesk: regdesk,
    feeForge: new InMemoryFeeForge({}),
    worm,
    adapters: createAdapters(),
  };

  return {
    tradeOS: new TradeOS(deps),
    custody,
    regdesk,
    worm,
    alerts,
    deps,
  };
}

function createOrderInput(overrides: Partial<OrderInput> = {}): OrderInput {
  return {
    clientId: "CLIENT-1",
    accountId: "ACC-1",
    traderId: "TRADER-1",
    side: "BUY",
    instrumentId: "AAPL",
    assetClass: "EQUITY",
    qty: new Decimal(100),
    priceType: "MKT",
    timeInForce: "DAY",
    meta: { estimatedPrice: 100 },
    ...overrides,
  } as OrderInput;
}

describe("TradeOS", () => {
  let ctx: TestContext;

  beforeEach(() => {
    ctx = setup();
  });

  it("holds options order when options level insufficient", async () => {
    const order = await ctx.tradeOS.createOrder(
      createOrderInput({ assetClass: "OPTION", meta: { requiredOptionsLevel: 3, estimatedPrice: 3 }, qty: new Decimal(10) }),
    );
    expect(order.status).toBe("HELD");
    expect(order.heldReasons).toContain("Options level insufficient");
  });

  it("blocks crypto order without verified wallet", async () => {
    const order = await ctx.tradeOS.createOrder(
      createOrderInput({
        assetClass: "CRYPTO",
        instrumentId: "BTC",
        accountId: "ACC-1",
        meta: { walletAddress: "0xunverified", estimatedPrice: 20000 },
      }),
    );
    expect(order.status).toBe("HELD");
    expect(order.heldReasons).toContain("Wallet not whitelisted");
  });

  it("selects highest scoring venue and enforces override approvals", async () => {
    const order = await ctx.tradeOS.createOrder(createOrderInput({ accountId: "ACC-2" }));
    expect(order.status).toBe("NEW");
    const block = await ctx.tradeOS.buildBlock({ assetClass: "EQUITY", instrumentId: "AAPL" });

    const venues = [
      { venue: "NYSE", price: 100, size: 1000, liquidity: 0.9, fees: 0.002, rebate: 0.001, speed: 0.8, historicalFill: 0.9 },
      { venue: "ARCA", price: 101, size: 500, liquidity: 0.8, fees: 0.001, rebate: 0.0, speed: 0.7, historicalFill: 0.7 },
    ];

    const routed = await ctx.tradeOS.routeBlock(block.id, { venues });
    expect(routed.bestExRecord?.chosen).toBe("NYSE");

    const block2Order = await ctx.tradeOS.createOrder(createOrderInput({ accountId: "ACC-2", instrumentId: "MSFT" }));
    expect(block2Order.status).toBe("NEW");
    const block2 = await ctx.tradeOS.buildBlock({ assetClass: "EQUITY", instrumentId: "MSFT" });

    await expect(
      ctx.tradeOS.routeBlock(block2.id, {
        venues: venues,
        override: { venue: "ARCA", reason: "Manual preference" },
      }),
    ).rejects.toThrow("approverId");

    const routedOverride = await ctx.tradeOS.routeBlock(block2.id, {
      venues,
      override: { venue: "ARCA", reason: "Manual preference", approverId: "SUP-1" },
    });
    expect(routedOverride.bestExRecord?.overridden).toBe(true);
    expect(routedOverride.bestExRecord?.approverId).toBe("SUP-1");
  });

  it("allocates pro-rata across accounts and updates custody", async () => {
    const order1 = await ctx.tradeOS.createOrder(createOrderInput({ accountId: "ACC-1", qty: new Decimal(100) }));
    const order2 = await ctx.tradeOS.createOrder(createOrderInput({ accountId: "ACC-2", qty: new Decimal(50) }));
    const order3 = await ctx.tradeOS.createOrder(createOrderInput({ accountId: "ACC-3", qty: new Decimal(50) }));
    expect(order1.status).toBe("NEW");
    const block = await ctx.tradeOS.buildBlock({ assetClass: "EQUITY", instrumentId: "AAPL" });
    await ctx.tradeOS.routeBlock(block.id, {
      venues: [{ venue: "NYSE", price: 100, size: 1000, liquidity: 1, fees: 0, rebate: 0, speed: 1, historicalFill: 1 }],
    });
    const allocation = await ctx.tradeOS.allocateBlock(block.id);
    expect(allocation.allocations).toHaveLength(3);
    const acc1Position = ctx.custody.positions.get("ACC-1")?.get("AAPL");
    expect(acc1Position?.toNumber()).toBeCloseTo(100);
  });

  it("enforces IPO cooling-off and allows IOI mode", async () => {
    const compliance = ctx.deps.complianceOS as InMemoryComplianceOS;
    compliance.state["ACC-1"].ipoCoolingOff["IPO1"] = { effectiveDate: new Date(Date.now() + 86_400_000) };
    const order = await ctx.tradeOS.createOrder(createOrderInput({ instrumentId: "IPO1" }));
    expect(order.status).toBe("NEW");
    const block = await ctx.tradeOS.buildBlock({ assetClass: "EQUITY", instrumentId: "IPO1" });
    await expect(
      ctx.tradeOS.routeBlock(block.id, {
        venues: [{ venue: "NYSE", price: 10, size: 1000, liquidity: 1, fees: 0, rebate: 0, speed: 1, historicalFill: 1 }],
      }),
    ).rejects.toThrow("IPO cooling-off");

    const orderIOI = await ctx.tradeOS.createOrder(
      createOrderInput({ instrumentId: "IPO1", meta: { primaryMarketMode: "IOI", estimatedPrice: 10 } }),
    );
    const blockIOI = await ctx.tradeOS.buildBlock({ assetClass: "EQUITY", instrumentId: "IPO1" });
    await expect(
      ctx.tradeOS.routeBlock(blockIOI.id, {
        venues: [{ venue: "NYSE", price: 10, size: 1000, liquidity: 1, fees: 0, rebate: 0, speed: 1, historicalFill: 1 }],
      }),
    ).resolves.toBeDefined();
  });

  it("requires four-eyes to close trade errors and computes PnL", async () => {
    const order = await ctx.tradeOS.createOrder(createOrderInput({ accountId: "ACC-2" }));
    const block = await ctx.tradeOS.buildBlock({ assetClass: "EQUITY", instrumentId: "AAPL" });
    const routed = await ctx.tradeOS.routeBlock(block.id, {
      venues: [{ venue: "NYSE", price: 100, size: 1000, liquidity: 1, fees: 0, rebate: 0, speed: 1, historicalFill: 1 }],
    });
    const exec = routed.executions[0];
    const error = await ctx.tradeOS.openTradeError({ order, execution: exec, type: "WRONG_ACCT", correctedPrice: new Decimal(99) });
    expect(error.status).toBe("Segregated");
    await expect(ctx.tradeOS.closeTradeError(error.id, { approverIds: ["SUP-1"], status: "Corrected" })).rejects.toThrow();
    const closed = await ctx.tradeOS.closeTradeError(error.id, { approverIds: ["SUP-1", "SUP-2"], status: "Corrected" });
    expect(closed.status).toBe("Corrected");
    expect(closed.approvals).toHaveLength(2);
  });

  it("denies restricted trades and logs alerts", async () => {
    const compliance = ctx.deps.complianceOS as InMemoryComplianceOS;
    compliance.state["ACC-1"].restrictedSymbols.add("AAPL");
    const order = await ctx.tradeOS.createOrder(createOrderInput());
    expect(order.status).toBe("HELD");
    expect(ctx.alerts).toContain("restricted:AAPL");
  });

  it("produces confirm and blotter export hashes", async () => {
    await ctx.tradeOS.createOrder(createOrderInput({ accountId: "ACC-2" }));
    const block = await ctx.tradeOS.buildBlock({ assetClass: "EQUITY", instrumentId: "AAPL" });
    await ctx.tradeOS.routeBlock(block.id, {
      venues: [{ venue: "NYSE", price: 100, size: 1000, liquidity: 1, fees: 0, rebate: 0, speed: 1, historicalFill: 1 }],
    });
    await ctx.tradeOS.allocateBlock(block.id);
    const confirm = await ctx.tradeOS.generateConfirm(block.orderIds[0]);
    expect(confirm.sha256).toHaveLength(64);
    const export1 = await ctx.tradeOS.exportBlotter({}, "/tmp/blotter.json");
    const export2 = await ctx.tradeOS.exportBlotter({}, "/tmp/blotter.json");
    expect(export1.sha256).toBe(export2.sha256);
  });

  it("avoids duplicate executions on re-route", async () => {
    await ctx.tradeOS.createOrder(createOrderInput({ accountId: "ACC-2" }));
    const block = await ctx.tradeOS.buildBlock({ assetClass: "EQUITY", instrumentId: "AAPL" });
    await ctx.tradeOS.routeBlock(block.id, {
      venues: [{ venue: "NYSE", price: 100, size: 1000, liquidity: 1, fees: 0, rebate: 0, speed: 1, historicalFill: 1 }],
    });
    const executionsBefore = block.executions.length;
    await ctx.tradeOS.routeBlock(block.id, {
      venues: [{ venue: "NYSE", price: 100, size: 1000, liquidity: 1, fees: 0, rebate: 0, speed: 1, historicalFill: 1 }],
    });
    expect(block.executions.length).toBe(executionsBefore);
  });
});
