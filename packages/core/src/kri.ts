import { Decimal } from "decimal.js";
import type { WormLedger } from "@blackroad/worm";
import { IncidentService } from "./incidents.js";
import type { GrcRepository } from "./repositories.js";
import type { Kri } from "./types.js";

export class KriService {
  private readonly incidentService: IncidentService;

  constructor(
    private readonly repo: GrcRepository,
    private readonly worm: WormLedger,
  ) {
    this.incidentService = new IncidentService(repo, worm);
  }

  async rollup(): Promise<Kri[]> {
    const now = new Date();
    const entries: Kri[] = [];

    const sodConflicts = await this.repo.listSodConflicts();
    entries.push(await this.persist("sod.open_conflicts", "Open SoD Conflicts", sodConflicts.filter((c) => c.status === "Open").length, now));

    const entitlements = await this.repo.listEntitlements();
    const active = entitlements.filter((e) => e.status === "Active");
    const overdue = active.filter((ent) => ent.recertDue && ent.recertDue.getTime() < now.getTime());
    const overduePct = active.length === 0 ? 0 : (overdue.length / active.length) * 100;
    entries.push(await this.persist("entitlements.recert_overdue_pct", "Recertifications Overdue %", overduePct, now));

    const vendors = await this.repo.listVendors();
    let expiredDocs = 0;
    let docCount = 0;
    for (const vendor of vendors) {
      const docs = await this.repo.listVendorDocs(vendor.id);
      for (const doc of docs) {
        docCount += 1;
        if (doc.expiresAt && doc.expiresAt.getTime() < now.getTime()) expiredDocs += 1;
      }
    }
    const docPct = docCount === 0 ? 0 : (expiredDocs / docCount) * 100;
    entries.push(await this.persist("vendors.docs_expired_pct", "Vendor Docs Expired %", docPct, now));

    const rfcs = await this.repo.listRfcs();
    const completed = rfcs.filter((r) => ["Implemented", "Failed", "RolledBack"].includes(r.status));
    const failed = completed.filter((r) => ["Failed", "RolledBack"].includes(r.status));
    const failureRate = completed.length === 0 ? 0 : (failed.length / completed.length) * 100;
    entries.push(await this.persist("change.failure_rate", "Change Failure Rate %", failureRate, now));

    const incidents = await this.repo.listIncidents();
    const sev1or2 = incidents.filter((i) => ["SEV1", "SEV2"].includes(i.severity) && i.status !== "Closed").length;
    entries.push(await this.persist("incidents.open_major", "Open Sev1/Sev2 Incidents", sev1or2, now));

    const metrics = await this.incidentService.metrics();
    entries.push(await this.persist("incidents.mtta_minutes", "MTTA (min)", metrics.meanTimeToAcknowledge, now));
    entries.push(await this.persist("incidents.mttr_minutes", "MTTR (min)", metrics.meanTimeToResolve, now));

    await this.worm.append({
      payload: {
        type: "KriRollup",
        keys: entries.map((entry) => entry.key),
      },
    });

    return entries;
  }

  private async persist(key: string, label: string, value: number, asOf: Date): Promise<Kri> {
    return this.repo.upsertKri({
      key,
      label,
      value: new Decimal(value.toFixed(4)),
      asOf,
      meta: {},
    });
  }
}
