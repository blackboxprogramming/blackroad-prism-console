import { createHash } from "node:crypto";
import { WordTokenizer } from "natural";
import {
  ClassificationResponse,
  ClassificationSuggestion,
  classificationResponseSchema,
  makePreviewId,
  normaliseScore,
} from "@lucidia/core";

export interface ClassificationRequest {
  text: string;
  seed?: string;
  maxSuggestions?: number;
}

const stopWords = new Set([
  "the",
  "a",
  "an",
  "and",
  "or",
  "but",
  "if",
  "in",
  "on",
  "with",
  "at",
  "by",
  "for",
  "to",
  "from",
  "of",
  "is",
  "are",
  "was",
  "were",
  "be",
  "been",
  "it",
  "this",
  "that",
]);

const tokenizer = new WordTokenizer();

export interface ExplainableSuggestion extends ClassificationSuggestion {
  minimalFeatures: string[];
}

function deterministicShuffle<T>(items: T[], seed: string): T[] {
  const result = [...items];
  let hash = createHash("sha256").update(seed).digest("hex");
  for (let i = result.length - 1; i > 0; i -= 1) {
    const pair = hash.slice((result.length - 1 - i) * 2, (result.length - i) * 2);
    const value = parseInt(pair || "ff", 16);
    const j = value % (i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function extractKeywords(text: string, limit = 5): string[] {
  const tokens = tokenizer
    .tokenize(text.toLowerCase())
    .filter((token) => /[a-z0-9]/.test(token))
    .filter((token) => !stopWords.has(token));

  const counts = new Map<string, number>();
  tokens.forEach((token) => {
    counts.set(token, (counts.get(token) ?? 0) + 1);
  });

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([token]) => token);
}

function scoreForTopic(topic: string, keywords: string[]): number {
  if (!keywords.length) {
    return 0.4;
  }
  const matches = keywords.filter((word) => topic.includes(word)).length;
  return normaliseScore(0.4 + matches / Math.max(5, keywords.length));
}

function buildSuggestion(
  topic: string,
  rationale: string,
  keywords: string[],
  score: number
): ExplainableSuggestion {
  return {
    boxTitle: topic,
    tags: keywords.slice(0, 3),
    score,
    rationale,
    minimalFeatures: keywords.slice(0, 3),
  };
}

const seedTopics: Record<string, string[]> = {
  planning: ["Roadmap", "Milestones", "Timeline"],
  research: ["Research Notes", "Hypotheses", "Findings"],
  people: ["Team", "Stakeholders", "Customers"],
  finance: ["Budget", "Revenue", "Costs"],
};

function candidateTopics(keywords: string[]): string[] {
  if (keywords.length === 0) {
    return ["General Notes", "To Triage"];
  }
  const matches = new Set<string>();
  keywords.forEach((keyword) => {
    Object.entries(seedTopics).forEach(([key, topicList]) => {
      if (keyword.includes(key)) {
        topicList.forEach((topic) => matches.add(topic));
      }
    });
  });
  if (matches.size === 0) {
    matches.add(`${keywords[0][0].toUpperCase()}${keywords[0].slice(1)} Insights`);
  }
  matches.add("Inbox");
  return [...matches];
}

export function classifyText(request: ClassificationRequest): ClassificationResponse {
  const text = request.text.trim();
  const seed = request.seed ?? "lucidia";
  if (!text) {
    return classificationResponseSchema.parse({
      previewId: makePreviewId(seed, text),
      suggestions: [],
      processedCharacters: 0,
    });
  }
  const keywords = extractKeywords(text, 6);
  const topics = deterministicShuffle(candidateTopics(keywords), seed);
  const limitedTopics = topics.slice(0, request.maxSuggestions ?? 4);

  const suggestions = limitedTopics.map((topic) => {
    const score = scoreForTopic(topic.toLowerCase(), keywords);
    const rationaleParts = [
      keywords.length
        ? `matched keywords: ${keywords.slice(0, 3).join(", ")}`
        : "fallback: insufficient keywords",
      `seed: ${seed}`,
    ];
    const rationale = rationaleParts.join("; ");
    return buildSuggestion(topic, rationale, keywords, score);
  });

  return classificationResponseSchema.parse({
    previewId: makePreviewId(seed, text),
    suggestions,
    processedCharacters: text.length,
  });
}

export function explainSuggestion(
  suggestion: ExplainableSuggestion
): Pick<ExplainableSuggestion, "rationale" | "minimalFeatures"> {
  return {
    rationale: suggestion.rationale,
    minimalFeatures: suggestion.minimalFeatures,
  };
}

