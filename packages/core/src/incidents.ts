import { DateTime } from "luxon";
import type { WormLedger } from "@blackroad/worm";
import { DEFAULT_POLICY_CONTEXT } from "./config.js";
import type { GrcRepository } from "./repositories.js";
import { logger } from "./logger.js";
import type { Incident, PolicyContext } from "./types.js";

export interface OpenIncidentInput {
  title: string;
  type: Incident["type"];
  severity: Incident["severity"];
  description: string;
  detectedAt?: Date;
  communications?: unknown;
  relatedIds?: unknown;
}

export interface IncidentMetrics {
  meanTimeToAcknowledge: number;
  meanTimeToResolve: number;
}

export class IncidentService {
  constructor(
    private readonly repo: GrcRepository,
    private readonly worm: WormLedger,
    private readonly policy: PolicyContext = DEFAULT_POLICY_CONTEXT,
  ) {}

  async open(input: OpenIncidentInput): Promise<Incident> {
    const detectedAt = input.detectedAt ?? new Date();
    const payload: Incident = await this.repo.createIncident({
      ...input,
      detectedAt,
      status: "Open",
      acknowledgedAt: null,
      resolvedAt: null,
      communications: input.communications ?? {},
      relatedIds: input.relatedIds ?? {},
    });
    await this.worm.append({
      payload: {
        type: "IncidentOpened",
        incidentId: payload.id,
        severity: payload.severity,
      },
    });
    if (payload.severity === "SEV1") {
      logger.error({ incidentId: payload.id }, "SEV1 incident opened");
    }
    return payload;
  }

  async acknowledge(id: string, userId: string): Promise<Incident> {
    const incident = await this.repo.updateIncident(id, {
      status: "Mitigated",
      acknowledgedAt: new Date(),
    });
    await this.worm.append({
      payload: {
        type: "IncidentAcknowledged",
        incidentId: id,
        userId,
      },
    });
    return incident;
  }

  async resolve(id: string, updates: { rootCause?: string; correctiveActions?: string }): Promise<Incident> {
    const incident = await this.repo.updateIncident(id, {
      status: "Resolved",
      resolvedAt: new Date(),
      rootCause: updates.rootCause,
      correctiveActions: updates.correctiveActions,
    });
    await this.worm.append({
      payload: {
        type: "IncidentResolved",
        incidentId: id,
        rootCause: updates.rootCause,
      },
    });
    return incident;
  }

  async close(id: string): Promise<Incident> {
    const incident = await this.repo.updateIncident(id, {
      status: "Closed",
    });
    await this.worm.append({
      payload: {
        type: "IncidentClosed",
        incidentId: id,
      },
    });
    return incident;
  }

  async metrics(windowDays = 90): Promise<IncidentMetrics> {
    const incidents = await this.repo.listIncidents();
    const cutoff = DateTime.now().minus({ days: windowDays }).toJSDate();
    const recent = incidents.filter((incident) => incident.detectedAt >= cutoff);
    const ackDiffs: number[] = [];
    const resolveDiffs: number[] = [];
    for (const incident of recent) {
      if (incident.acknowledgedAt) {
        ackDiffs.push(
          DateTime.fromJSDate(incident.acknowledgedAt).diff(DateTime.fromJSDate(incident.detectedAt)).as("minutes"),
        );
      }
      if (incident.resolvedAt) {
        resolveDiffs.push(
          DateTime.fromJSDate(incident.resolvedAt).diff(DateTime.fromJSDate(incident.detectedAt)).as("minutes"),
        );
      }
    }
    return {
      meanTimeToAcknowledge: this.mean(ackDiffs),
      meanTimeToResolve: this.mean(resolveDiffs),
    };
  }

  private mean(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((sum, value) => sum + value, 0) / values.length;
  }
}
