import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";
import type { Person, LicenseTrack, PlannedTask } from "@blackroad/core";

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = join(__dirname, "..", "data");

function ensureDataDir(): void {
  if (!existsSync(dataDir)) {
    mkdirSync(dataDir, { recursive: true });
  }
}

function readJson<T>(path: string): T | null {
  try {
    const content = readFileSync(path, "utf-8");
    return JSON.parse(content) as T;
  } catch (error) {
    return null;
  }
}

function writeJson(path: string, value: unknown): void {
  ensureDataDir();
  writeFileSync(path, JSON.stringify(value, null, 2), "utf-8");
}

const PERSON_FILE = join(dataDir, "person.json");
const LICENSE_TRACKS_FILE = join(dataDir, "license_tracks.json");
const TASKS_FILE = join(dataDir, "tasks.json");
const BROKERCHECK_FILE = join(dataDir, "brokercheck.json");

export function loadPerson(): Person | null {
  const value = readJson<Person>(PERSON_FILE);
  if (!value) {
    return null;
  }
  return value;
}

export function savePerson(person: Person): void {
  writeJson(PERSON_FILE, person);
}

export function loadLicenseTracks(): LicenseTrack[] {
  const values = readJson<LicenseTrack[]>(LICENSE_TRACKS_FILE);
  if (!values) {
    return [];
  }
  return values.map((track) => ({
    ...track,
    expiration: track.expiration ? new Date(track.expiration) : undefined,
    lastRenewal: track.lastRenewal ? new Date(track.lastRenewal) : undefined,
  }));
}

export function saveLicenseTracks(tracks: LicenseTrack[]): void {
  writeJson(
    LICENSE_TRACKS_FILE,
    tracks.map((track) => ({
      ...track,
      expiration: track.expiration ? track.expiration.toISOString() : undefined,
      lastRenewal: track.lastRenewal ? track.lastRenewal.toISOString() : undefined,
    }))
  );
}

export function loadTasks(): PlannedTask[] {
  const values = readJson<Array<Omit<PlannedTask, "due"> & { due?: string }>>(TASKS_FILE);
  if (!values) {
    return [];
  }
  return values.map((task) => ({
    ...task,
    due: task.due ? new Date(task.due) : null,
  }));
}

export function saveTasks(tasks: PlannedTask[]): void {
  writeJson(
    TASKS_FILE,
    tasks.map((task) => ({
      ...task,
      due: task.due ? task.due.toISOString() : undefined,
    }))
  );
}

export function saveBrokerCheckSummary(summary: unknown): void {
  writeJson(BROKERCHECK_FILE, summary);
}

export function generateId(prefix: string): string {
  return `${prefix}-${randomUUID()}`;
}

export function dataDirectory(): string {
  ensureDataDir();
  return dataDir;
}
