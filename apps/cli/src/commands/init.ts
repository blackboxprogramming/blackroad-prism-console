import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { loadSeedRulebooks } from "@blackroad/db";
import type { TrackType, LicenseTrack, Person } from "@blackroad/core";
import { generateId, saveLicenseTracks, savePerson } from "../storage.js";

interface InitOptions {
  person: string;
  crd?: string;
  home: string;
  tracks: string;
  states: string;
}

const VALID_TRACKS: TrackType[] = ["securities", "insurance", "real_estate"];

function parseList(input: string): string[] {
  return input
    .split(",")
    .map((value) => value.trim().toUpperCase())
    .filter(Boolean);
}

function parseTracks(input: string): TrackType[] {
  const entries = input
    .split(",")
    .map((value) => value.trim() as TrackType)
    .filter(Boolean);
  for (const entry of entries) {
    if (!VALID_TRACKS.includes(entry)) {
      throw new Error(`Unsupported track: ${entry}`);
    }
  }
  return entries;
}

export function initCommand(options: InitOptions): void {
  const states = parseList(options.states);
  const tracks = parseTracks(options.tracks);
  const person: Person = {
    id: generateId("person"),
    legalName: options.person,
    aka: [],
    crdNumber: options.crd,
    homeState: options.home.toUpperCase(),
    tracks,
    targetStates: states,
    disclosures: [],
    designations: [],
    priorEmployers: [],
  };

  savePerson(person);

  const __dirname = dirname(fileURLToPath(import.meta.url));
  const dbDir = resolve(__dirname, "..", "..", "..", "packages", "db");
  const rulebooks = loadSeedRulebooks(dbDir);

  const licenseTracks: LicenseTrack[] = rulebooks
    .filter((rulebook) => states.includes(rulebook.stateCode) && tracks.includes(rulebook.track))
    .map((rulebook) => ({
      id: generateId("track"),
      personId: person.id,
      track: rulebook.track,
      stateCode: rulebook.stateCode,
      licenseType: rulebook.licenseType,
      status: "Unknown",
      metadata: null,
    }));

  saveLicenseTracks(licenseTracks);

  // eslint-disable-next-line no-console
  console.log(`Initialized person ${person.legalName} with ${licenseTracks.length} license track(s).`);
}
