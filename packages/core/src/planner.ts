import { evaluateRulebook } from "./rules.js";
import { instantiateTask } from "./tasks.js";
import {
  Person,
  LicenseTrack,
  PlannerResult,
  PlanOptions,
  PlanSummary,
  PlannedTask,
  Rulebook,
  TaskTemplateKey,
} from "./types.js";

function dedupe(tasks: PlannedTask[]): PlannedTask[] {
  const seen = new Map<string, PlannedTask>();
  for (const task of tasks) {
    if (!seen.has(task.id)) {
      seen.set(task.id, task);
    }
  }
  return Array.from(seen.values());
}

function addPersonWideTasks(person: Person, options: PlanOptions): PlannedTask[] {
  const baseTasks: TaskTemplateKey[] = [];
  if (options.targetTracks.includes("securities")) {
    baseTasks.push("FETCH_CRD_HISTORY", "PARSE_BROKERCHECK_PDF", "VERIFY_DISCLOSURES");
  }
  return baseTasks.map((template) =>
    instantiateTask({
      template,
      personId: person.id,
      stateCode: person.homeState,
      track: "securities",
      licenseType: "PersonProfile",
      payload: { scope: "person" },
    })
  );
}

export function planReinstatement(params: {
  person: Person;
  licenseTracks: LicenseTrack[];
  rulebooks: Rulebook[];
  options: PlanOptions;
}): PlannerResult {
  const { person, licenseTracks, rulebooks, options } = params;
  const tasks: PlannedTask[] = [];
  const summaries: PlanSummary[] = [];

  tasks.push(...addPersonWideTasks(person, options));

  for (const track of licenseTracks) {
    if (!options.targetTracks.includes(track.track)) {
      continue;
    }
    if (!options.targetStates.includes(track.stateCode)) {
      continue;
    }

    const rulebook = rulebooks.find(
      (candidate) =>
        candidate.stateCode === track.stateCode &&
        candidate.track === track.track &&
        candidate.licenseType === track.licenseType
    );

    if (!rulebook) {
      summaries.push({
        stateCode: track.stateCode,
        track: track.track,
        licenseType: track.licenseType,
        targetStatus: "Requalify",
        blockers: ["Missing rulebook"],
        fees: null,
        tasks: [],
      });
      continue;
    }

    const evaluation = evaluateRulebook({
      personId: person.id,
      licenseTrack: track,
      rulebook,
      now: options.now,
    });

    const riskBlockers: string[] = [];
    if (track.status === "Barred") {
      riskBlockers.push("Track is barred");
    }
    const disclosureBlockers = person.disclosures.filter((disclosure) =>
      /barred|disqualification/i.test(disclosure)
    );
    if (disclosureBlockers.length > 0) {
      riskBlockers.push("Disclosures require review");
    }

    const planTasks = dedupe([...evaluation.tasks]);
    tasks.push(...planTasks);

    summaries.push({
      stateCode: track.stateCode,
      track: track.track,
      licenseType: track.licenseType,
      targetStatus: evaluation.target,
      blockers: dedupeStrings([...evaluation.blockers, ...riskBlockers]),
      fees: evaluation.fees,
      tasks: planTasks,
    });
  }

  const dedupedTasks = dedupe(tasks);

  return {
    tasks: dedupedTasks,
    summaries,
  };
}

function dedupeStrings(values: string[]): string[] {
  const unique = new Set(values.filter(Boolean));
  return Array.from(unique.values());
}

export function mergePlannedTasks(existing: PlannedTask[], incoming: PlannedTask[]): PlannedTask[] {
  const index = new Map(existing.map((task) => [task.id, task] as const));
  for (const task of incoming) {
    if (!index.has(task.id)) {
      index.set(task.id, task);
    }
  }
  return Array.from(index.values());
}

export function planToMarkdown(summaries: PlanSummary[]): string {
  const lines: string[] = ["# Reinstatement Plan", ""];
  for (const summary of summaries) {
    lines.push(`## ${summary.stateCode} · ${summary.track} (${summary.licenseType})`);
    lines.push(`- Target status: **${summary.targetStatus}**`);
    if (summary.blockers.length > 0) {
      lines.push(`- Blockers: ${summary.blockers.join(", ")}`);
    }
    if (summary.fees) {
      const feeParts: string[] = [];
      for (const [key, value] of Object.entries(summary.fees)) {
        if (typeof value === "number") {
          feeParts.push(`${key}: $${value.toFixed(2)}`);
        }
      }
      if (feeParts.length > 0) {
        lines.push(`- Fees: ${feeParts.join(", ")}`);
      }
    }
    lines.push("### Tasks");
    for (const task of summary.tasks) {
      const due = task.due ? ` (due ${task.due.toISOString().split("T")[0]})` : "";
      const blocking = task.blocking ? "⚠️" : "";
      lines.push(`- ${blocking} ${task.title}${due}`);
    }
    lines.push("");
  }
  return lines.join("\n");
}
