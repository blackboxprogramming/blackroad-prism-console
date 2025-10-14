import { randomUUID } from "node:crypto";
import { VenueSelectionRequest, VenueSelectionResult, WormJournal } from "./types.js";
import { createWormEvent } from "./journal.js";

export class BestExecutionEngine {
  constructor(private readonly worm: WormJournal) {}

  async selectVenue(request: VenueSelectionRequest): Promise<VenueSelectionResult> {
    if (request.venues.length === 0) {
      throw new Error("No venues provided for best-ex evaluation");
    }
    const direction = request.block.side.startsWith("SELL") ? "SELL" : "BUY";
    const bestPrice = direction === "BUY"
      ? Math.min(...request.venues.map((v) => v.price))
      : Math.max(...request.venues.map((v) => v.price));
    const maxSize = Math.max(...request.venues.map((v) => v.size));
    const maxLiquidity = Math.max(...request.venues.map((v) => v.liquidity));
    const maxSpeed = Math.max(...request.venues.map((v) => v.speed));
    const maxHistory = Math.max(...request.venues.map((v) => v.historicalFill));

    const scores = request.venues.reduce<Record<string, number>>((acc, venue) => {
      const priceRatio = direction === "BUY" ? bestPrice / venue.price : venue.price / bestPrice;
      const priceScore = priceRatio * 40;
      const sizeScore = (venue.size / maxSize) * 15;
      const liquidityScore = (venue.liquidity / maxLiquidity) * 15;
      const speedScore = (venue.speed / maxSpeed) * 10;
      const historyScore = (venue.historicalFill / maxHistory) * 10;
      const feeScore = (venue.rebate - venue.fees) * 5;
      const slippagePenalty = venue.slippage ? venue.slippage * 5 : 0;
      const reliabilityScore = venue.reliability ? venue.reliability * 5 : 0;
      acc[venue.venue] = priceScore + sizeScore + liquidityScore + speedScore + historyScore + feeScore + reliabilityScore - slippagePenalty;
      return acc;
    }, {});

    const machineChosen = Object.entries(scores).sort((a, b) => b[1] - a[1])[0];
    if (!machineChosen) {
      throw new Error("Unable to compute best-ex venue");
    }

    let chosenVenue = machineChosen[0];
    let reason = `Auto-selected ${chosenVenue} with score ${machineChosen[1].toFixed(2)}`;
    let overridden = false;
    let approverId: string | undefined;

    if (request.override) {
      if (!request.override.approverId) {
        throw new Error("Best-ex override requires approverId (four-eyes)");
      }
      overridden = true;
      approverId = request.override.approverId;
      chosenVenue = request.override.venue;
      reason = request.override.reason;
      await this.worm.append(
        createWormEvent("bestex.recorded", {
          blockId: request.block.id,
          override: true,
          approverId,
          reason,
          chosenVenue,
          considered: request.venues.map((v) => v.venue),
        }),
      );
    }

    const record = {
      id: randomUUID(),
      blockId: request.block.id,
      considered: request.venues.map((v) => v.venue),
      chosen: chosenVenue,
      score: scores,
      reason,
      overridden,
      approverId,
      createdAt: new Date(),
    } satisfies VenueSelectionResult["record"];

    if (!overridden) {
      await this.worm.append(
        createWormEvent("bestex.recorded", {
          blockId: request.block.id,
          override: false,
          chosenVenue,
          reason,
          score: scores[chosenVenue],
        }),
      );
    }

    return { record };
  }
}
