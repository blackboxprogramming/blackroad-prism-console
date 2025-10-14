import { WormLedger, WormAppendInput, WormBlock } from "@blackroad/worm";
import { WormEvent, WormJournal } from "./types.js";

export class LedgerWormJournal implements WormJournal<WormEvent> {
  constructor(private readonly ledger: WormLedger<WormEvent>) {}

  async append(event: WormEvent): Promise<void> {
    await this.ledger.append({ payload: event } satisfies WormAppendInput<WormEvent>);
  }

  all(): WormBlock<WormEvent>[] {
    return this.ledger.all();
  }

  tail(): WormBlock<WormEvent> | null {
    return this.ledger.tail();
  }
}

export function createWormEvent(type: WormEvent["type"], data: Record<string, unknown>): WormEvent {
  return {
    type,
    timestamp: new Date().toISOString(),
    data,
  };
}
