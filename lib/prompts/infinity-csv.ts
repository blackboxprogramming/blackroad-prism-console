import { readFileSync, statSync } from "node:fs";
import { join } from "node:path";

export interface InfinityPromptRecord {
  board: string;
  task: string;
  title: string;
  objective: string;
  stack: string;
  workflow: string;
  verification: string;
}

export interface InfinityPromptOptions {
  board?: string;
  task?: string;
  includeCatalog?: boolean;
}

const CSV_PATH = join(process.cwd(), "data", "infinity_prompts.csv");

let cachedRecords: InfinityPromptRecord[] | null = null;
let cachedMtime = 0;

function parseCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === "\"") {
      if (inQuotes && line[i + 1] === "\"") {
        current += "\"";
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (char === "," && !inQuotes) {
      cells.push(current.trim());
      current = "";
      continue;
    }
    current += char;
  }

  cells.push(current.trim());
  return cells;
}

function parseCsv(content: string): InfinityPromptRecord[] {
  const lines = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith("#"));

  if (lines.length === 0) return [];

  const header = parseCsvLine(lines[0]);
  const expected = [
    "board",
    "task",
    "title",
    "objective",
    "stack",
    "workflow",
    "verification"
  ];
  for (const key of expected) {
    if (!header.includes(key)) {
      throw new Error(`Missing column "${key}" in infinity prompts CSV.`);
    }
  }

  return lines.slice(1).map((line, index) => {
    const row = parseCsvLine(line);
    if (row.length < header.length) {
      throw new Error(`Row ${index + 2} in infinity prompts CSV has too few columns.`);
    }
    const record: Record<string, string> = {};
    header.forEach((key, i) => {
      record[key] = row[i] ?? "";
    });
    return record as InfinityPromptRecord;
  });
}

function loadRecords(): InfinityPromptRecord[] {
  try {
    const stats = statSync(CSV_PATH);
    if (!cachedRecords || cachedMtime !== stats.mtimeMs) {
      const content = readFileSync(CSV_PATH, "utf-8");
      cachedRecords = parseCsv(content);
      cachedMtime = stats.mtimeMs;
    }
    return cachedRecords;
  } catch (error) {
    cachedRecords = [];
    cachedMtime = 0;
    return cachedRecords;
  }
}

export function getInfinityPromptCatalog(): InfinityPromptRecord[] {
  return loadRecords().slice();
}

export function getInfinityPromptRecordsForBoard(board: string): InfinityPromptRecord[] {
  const normalized = board.trim().toLowerCase();
  return loadRecords().filter((record) => record.board.toLowerCase() === normalized);
}

export function findInfinityPromptRecord(board: string, task?: string): InfinityPromptRecord | undefined {
  const records = getInfinityPromptRecordsForBoard(board);
  if (records.length === 0) return undefined;
  if (!task) return records[0];
  const normalizedTask = task.trim().toLowerCase();
  return records.find((record) => record.task.toLowerCase() === normalizedTask);
}

export function buildInfinityPromptContext(options: InfinityPromptOptions): string {
  const { board, task, includeCatalog } = options;
  const catalog = loadRecords();

  if (!catalog.length) {
    if (!board && !includeCatalog) return "";
    return "\nCONTEXT\n- Infinity prompt catalog is empty (data/infinity_prompts.csv).";
  }

  const lines: string[] = [];

  if (board) {
    const matches = getInfinityPromptRecordsForBoard(board);
    if (matches.length === 0) {
      lines.push("CONTEXT");
      lines.push(`- Requested board "${board}" not found in catalog.`);
      if (includeCatalog) {
        lines.push("- Available boards: " + [...new Set(catalog.map((record) => record.board))].sort().join(", "));
      }
    } else if (task) {
      const found = findInfinityPromptRecord(board, task);
      if (found) {
        lines.push("CONTEXT");
        lines.push(`- Board: ${found.board}`);
        lines.push(`- Task: ${found.task} — ${found.title}`);
        lines.push(`- Objective: ${found.objective}`);
        lines.push(`- Stack: ${found.stack}`);
        lines.push(`- Workflow: ${found.workflow}`);
        lines.push(`- Verification: ${found.verification}`);
      } else {
        lines.push("CONTEXT");
        lines.push(`- Board: ${board}`);
        lines.push(`- Task "${task}" not catalogued. Available: ${matches.map((record) => record.task).join(", ")}`);
      }
    } else {
      lines.push("CONTEXT");
      lines.push(`- Board: ${board}`);
      lines.push(
        "- Tasks: " +
          matches
            .map((record) => `${record.task} (${record.title})`)
            .join(", ")
      );
      lines.push(`- Primary objective: ${matches[0].objective}`);
    }
  }

  if (includeCatalog) {
    if (lines.length) lines.push("");
    lines.push("CATALOG");
    const grouped = new Map<string, InfinityPromptRecord[]>();
    for (const record of catalog) {
      const key = record.board;
      const bucket = grouped.get(key) ?? [];
      bucket.push(record);
      grouped.set(key, bucket);
    }
    const sorted = Array.from(grouped.entries()).sort((a, b) => a[0].localeCompare(b[0]));
    for (const [boardName, entries] of sorted) {
      const summary = entries
        .map((entry) => `${entry.task} (${entry.title})`)
        .join("; ");
      lines.push(`- ${boardName}: ${summary}`);
    }
  }

  return lines.length ? `\n${lines.join("\n")}` : "";
}
