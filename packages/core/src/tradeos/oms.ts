import { randomUUID } from "node:crypto";
import { Decimal } from "decimal.js";
import {
  AllocationMethod,
  AllocationPostResult,
  Block,
  BlockStatus,
  Order,
  OrderInput,
  TradeErrorItem,
  VenueScoreInput,
  TradeOSDependencies,
  VenueSelectionRequest,
  Execution,
} from "./types.js";
import { PreTradeCheckService } from "./pretrade.js";
import { BestExecutionEngine } from "./bestex.js";
import { RoutingEngine } from "./router.js";
import { AllocationEngine } from "./allocator.js";
import { TradeErrorService, TradeErrorOpenInput, TradeErrorCloseInput } from "./errors.js";
import { ConfirmService } from "./confirms.js";
import { BlotterService, BlotterFilter } from "./blotter.js";
import { createWormEvent } from "./journal.js";

export interface BlockBuildCriteria {
  assetClass: string;
  instrumentId?: string;
  side?: string;
}

export interface RouteOptions {
  venues: VenueScoreInput[];
  override?: VenueSelectionRequest["override"];
}

export class TradeOS {
  private readonly preTrade: PreTradeCheckService;
  private readonly bestEx: BestExecutionEngine;
  private readonly router: RoutingEngine;
  private readonly allocator: AllocationEngine;
  private readonly tradeErrors: TradeErrorService;
  private readonly confirms: ConfirmService;
  private readonly blotter: BlotterService;

  private readonly orders = new Map<string, Order>();
  private readonly blocks = new Map<string, Block>();

  constructor(private readonly deps: TradeOSDependencies) {
    this.preTrade = new PreTradeCheckService({
      clientOS: deps.clientOS,
      complianceOS: deps.complianceOS,
      custodySync: deps.custodySync,
      surveillanceHub: deps.surveillanceHub,
      feeForge: deps.feeForge,
      worm: deps.worm,
    });
    this.bestEx = new BestExecutionEngine(deps.worm);
    this.router = new RoutingEngine({
      adapters: deps.adapters,
      custodySync: deps.custodySync,
      complianceOS: deps.complianceOS,
      clientOS: deps.clientOS,
      worm: deps.worm,
    });
    this.allocator = new AllocationEngine({
      custodySync: deps.custodySync,
      worm: deps.worm,
    });
    this.tradeErrors = new TradeErrorService({
      custodySync: deps.custodySync,
      complianceOS: deps.complianceOS,
      worm: deps.worm,
    });
    this.confirms = new ConfirmService({
      regDesk: deps.regDesk,
      worm: deps.worm,
    });
    this.blotter = new BlotterService(deps.worm);
  }

  async createOrder(input: OrderInput): Promise<Order> {
    const id = `ORD-${randomUUID()}`;
    const createdAt = new Date();
    const order = await this.preTrade.hydrate({ ...input, id, createdAt });

    await this.deps.worm.append(
      createWormEvent("order.created", {
        orderId: order.id,
        accountId: order.accountId,
        assetClass: order.assetClass,
        qty: order.qty.toString(),
      }),
    );

    const pretrade = await this.preTrade.evaluate(order);
    if (!pretrade.passed) {
      order.status = "HELD";
      order.heldReasons = pretrade.reasons;
      await this.deps.worm.append(
        createWormEvent("order.held", {
          orderId: order.id,
          reasons: pretrade.reasons,
        }),
      );
    }

    this.orders.set(order.id, order);
    return order;
  }

  async cancelOrder(orderId: string): Promise<Order> {
    const order = this.requireOrder(orderId);
    order.status = "CANCELLED";
    await this.deps.worm.append(
      createWormEvent("order.cancelled", {
        orderId,
      }),
    );
    return order;
  }

  listOrders(): Order[] {
    return [...this.orders.values()];
  }

  async buildBlock(criteria: BlockBuildCriteria): Promise<Block> {
    const candidates = [...this.orders.values()].filter((order) => {
      if (order.status !== "NEW") {
        return false;
      }
      if (criteria.assetClass && order.assetClass !== criteria.assetClass) {
        return false;
      }
      if (criteria.instrumentId && order.instrumentId !== criteria.instrumentId) {
        return false;
      }
      if (criteria.side && order.side !== criteria.side) {
        return false;
      }
      return true;
    });

    if (candidates.length === 0) {
      throw new Error("No eligible orders for block build");
    }

    const totalQty = candidates.reduce((acc, order) => acc.plus(order.qty), new Decimal(0));
    const block: Block = {
      id: `BLK-${randomUUID()}`,
      assetClass: candidates[0].assetClass,
      instrumentId: candidates[0].instrumentId,
      side: candidates[0].side,
      totalQty,
      status: "STAGED",
      orderIds: candidates.map((order) => order.id),
      createdAt: new Date(),
      executions: [],
    };

    for (const order of candidates) {
      order.blockId = block.id;
      order.status = "ROUTED"; // staged for routing
    }

    this.blocks.set(block.id, block);

    await this.deps.worm.append(
      createWormEvent("block.built", {
        blockId: block.id,
        orders: block.orderIds,
        totalQty: block.totalQty.toString(),
      }),
    );

    return block;
  }

  async routeBlock(blockId: string, options: RouteOptions): Promise<Block> {
    const block = this.requireBlock(blockId);
    if (block.executions.length > 0) {
      return block;
    }
    const orders = block.orderIds.map((id) => this.requireOrder(id));

    const { record } = await this.bestEx.selectVenue({
      block,
      venues: options.venues,
      override: options.override,
    });
    block.bestExRecord = record;

    const decision = await this.router.route(block, orders, record.chosen);
    this.recordExecutions(block, decision.executions);

    block.status = this.deriveBlockStatus(block, decision.executions);

    return block;
  }

  async allocateBlock(blockId: string, method: AllocationMethod = "PRO_RATA"): Promise<AllocationPostResult> {
    const block = this.requireBlock(blockId);
    const orders = block.orderIds.map((id) => this.requireOrder(id));
    const result = await this.allocator.allocate(block, orders, method);
    block.status = "ALLOCATED";
    return result;
  }

  async openTradeError(input: TradeErrorOpenInput): Promise<TradeErrorItem> {
    return this.tradeErrors.open(input);
  }

  async closeTradeError(id: string, input: TradeErrorCloseInput): Promise<TradeErrorItem> {
    return this.tradeErrors.close(id, input);
  }

  async generateConfirm(orderId: string): Promise<ReturnType<ConfirmService["generate"]>> {
    const order = this.requireOrder(orderId);
    return this.confirms.generate(order, order.executions);
  }

  async exportBlotter(filter: BlotterFilter, outPath: string) {
    return this.blotter.export([...this.orders.values()], filter, outPath);
  }

  private recordExecutions(block: Block, executions: Execution[]): void {
    for (const exec of executions) {
      let remaining = exec.qty;
      for (const orderId of block.orderIds) {
        if (remaining.isZero()) {
          break;
        }
        const order = this.requireOrder(orderId);
        const alreadyFilled = this.totalExecuted(order);
        const orderRemaining = order.qty.minus(alreadyFilled);
        if (orderRemaining.isZero()) {
          continue;
        }
        const fillQty = Decimal.min(orderRemaining, remaining);
        remaining = remaining.minus(fillQty);
        const orderExecution: Execution = {
          ...exec,
          orderId: order.id,
          qty: fillQty,
        };
        order.executions.push(orderExecution);
        const postFill = this.totalExecuted(order);
        if (postFill.equals(order.qty)) {
          order.status = "FILLED";
        } else if (postFill.greaterThan(0)) {
          order.status = "PARTIAL";
        }
      }
    }
  }

  private deriveBlockStatus(block: Block, executions: Execution[]): BlockStatus {
    if (executions.length === 0) {
      return block.status;
    }
    const totalExecQty = executions.reduce((acc, exec) => acc.plus(exec.qty), new Decimal(0));
    if (totalExecQty.greaterThanOrEqualTo(block.totalQty)) {
      return "FILLED";
    }
    return "ROUTED";
  }

  private totalExecuted(order: Order): Decimal {
    if (order.executions.length === 0) {
      return new Decimal(0);
    }
    return order.executions.reduce((acc, exec) => acc.plus(exec.qty), new Decimal(0));
  }

  private requireOrder(orderId: string): Order {
    const order = this.orders.get(orderId);
    if (!order) {
      throw new Error(`Order ${orderId} not found`);
    }
    return order;
  }

  private requireBlock(blockId: string): Block {
    const block = this.blocks.get(blockId);
    if (!block) {
      throw new Error(`Block ${blockId} not found`);
    }
    return block;
  }
}
