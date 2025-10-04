import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { writeFileSync } from "node:fs";
import {
  mergePlannedTasks,
  planReinstatement,
  planToMarkdown,
  type PlanOptions as CorePlanOptions,
  type TrackType,
} from "@blackroad/core";
import { loadSeedRulebooks } from "@blackroad/db";
import {
  dataDirectory,
  loadLicenseTracks,
  loadPerson,
  loadTasks,
  saveTasks,
} from "../storage.js";

interface PlanCommandOptions {
  states: string;
  tracks: string;
  out?: string;
  printMd?: boolean;
}

function parseStates(input: string, fallback: string[]): string[] {
  if (input === "all") {
    return fallback;
  }
  return input
    .split(",")
    .map((value) => value.trim().toUpperCase())
    .filter(Boolean);
}

function parseTracks(input: string, fallback: TrackType[]): TrackType[] {
  if (input === "all") {
    return fallback;
  }
  return input
    .split(",")
    .map((value) => value.trim() as TrackType)
    .filter(Boolean);
}

export function planCommand(options: PlanCommandOptions): void {
  const person = loadPerson();
  if (!person) {
    throw new Error("Person not initialized. Run blackroad-lic init first.");
  }
  const licenseTracks = loadLicenseTracks();
  const states = parseStates(options.states, person.targetStates);
  const tracks = parseTracks(options.tracks, person.tracks);

  const __dirname = dirname(fileURLToPath(import.meta.url));
  const dbDir = resolve(__dirname, "..", "..", "..", "packages", "db");
  const rulebooks = loadSeedRulebooks(dbDir);

  const planOptions: CorePlanOptions = {
    targetStates: states,
    targetTracks: tracks,
  };

  const plan = planReinstatement({
    person,
    licenseTracks,
    rulebooks,
    options: planOptions,
  });

  const existingTasks = loadTasks();
  const mergedTasks = mergePlannedTasks(existingTasks, plan.tasks);
  saveTasks(mergedTasks);

  const payload = {
    generatedAt: new Date().toISOString(),
    person,
    summaries: plan.summaries,
    tasks: mergedTasks,
  };

  if (options.out) {
    writeFileSync(options.out, JSON.stringify(payload, null, 2), "utf-8");
    // eslint-disable-next-line no-console
    console.log(`Plan written to ${options.out}`);
  } else {
    // eslint-disable-next-line no-console
    console.log(JSON.stringify(payload, null, 2));
  }

  if (options.printMd) {
    const markdown = planToMarkdown(plan.summaries);
    // eslint-disable-next-line no-console
    console.log("\n" + markdown);
  }

  // eslint-disable-next-line no-console
  console.log(`Artifacts stored in ${dataDirectory()}`);
}
