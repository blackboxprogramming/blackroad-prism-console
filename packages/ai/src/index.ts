import seedrandom from "seedrandom";
import {
  ClassificationResponse,
  ClassifiedBoxSuggestion,
} from "@lucidia/core";

export interface ClassificationOptions {
  seed?: number;
  maxSuggestions?: number;
}

interface BoxDefinition {
  id: string;
  title: string;
  tags: string[];
  keywords: string[];
  description: string;
}

const BOX_LIBRARY: BoxDefinition[] = [
  {
    id: "actions",
    title: "Action Items",
    tags: ["todo", "next"],
    keywords: ["todo", "follow", "call", "email", "schedule", "send"],
    description: "Tracks follow-ups and commitments.",
  },
  {
    id: "ideas",
    title: "Ideas",
    tags: ["idea", "brainstorm"],
    keywords: ["idea", "brainstorm", "concept", "vision", "maybe", "someday"],
    description: "Captures brainstorming snippets and future possibilities.",
  },
  {
    id: "research",
    title: "Research",
    tags: ["learn", "read"],
    keywords: ["research", "paper", "article", "study", "learn", "reading"],
    description: "Keeps references and learning targets organized.",
  },
  {
    id: "notes",
    title: "Meeting Notes",
    tags: ["meeting", "note"],
    keywords: ["meeting", "notes", "discussion", "agenda", "summary", "minutes"],
    description: "Summaries from meetings or conversations.",
  },
];

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
}

function scoreBox(tokens: string[], box: BoxDefinition) {
  const matches = box.keywords.filter((keyword) => tokens.includes(keyword));
  if (matches.length === 0) {
    return null;
  }

  const uniqueMatches = new Set(matches);
  const rawScore = Math.min(1, uniqueMatches.size / Math.max(box.keywords.length / 2, 1));
  return {
    box,
    score: rawScore,
    features: Array.from(uniqueMatches),
  };
}

function toSuggestion(
  entry: ReturnType<typeof scoreBox>,
  jitter: number
): ClassifiedBoxSuggestion {
  if (!entry) {
    throw new Error("Unexpected empty entry");
  }

  const score = Math.min(1, Math.max(0, entry.score * 0.85 + jitter * 0.15));
  const rationale = `matched keywords: ${entry.features.join(", ")}; score ${score
    .toFixed(2)
    .replace(/0+$/, "")}`;

  return {
    boxId: entry.box.id,
    title: entry.box.title,
    score,
    rationale,
    tags: entry.box.tags,
  };
}

export function classifyText(
  text: string,
  options: ClassificationOptions = {}
): ClassificationResponse {
  const tokens = tokenize(text);
  const seed =
    typeof options.seed === "number" && options.seed >= 0
      ? options.seed
      : Math.floor(Date.now() / 1000);
  const rng = seedrandom(String(seed));
  const results = BOX_LIBRARY.map((box) => scoreBox(tokens, box)).filter(
    (value): value is NonNullable<typeof value> => Boolean(value)
  );

  const suggestions = results
    .map((result) => toSuggestion(result, rng.quick()))
    .sort((a, b) => b.score - a.score)
    .slice(0, options.maxSuggestions ?? 4);

  return { suggestions, seed };
}
