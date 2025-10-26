import { normalizeMessage, containsAny } from "./normalize";
import { shortestResonanceDistance, resonanceFitness } from "./graph";
import { clamp } from "./utils";

export type Breakdown = {
  echo: number;
  resonance: number;
  temporal: number;
  reciprocity: number;
  pattern: number;
  context: number;
  heart_bridge: number;
};

export type ScoreResult = {
  score: number;
  breakdown: Breakdown;
};

const TEMPORAL_MARKERS = ["⏳", "🔆", "🚀"];
const HEART_BRIDGE_TOKEN = "🫀🔮";
const PATTERN_TOKEN = "🧩🌀";
const CONTEXT_TOKEN = "⛰️🪶";
const RECIPROCITY_TOKEN = "🌬️🪞";

export function score(submission: string, rubric: any, peerEmotionChain: string[] = []): ScoreResult {
  const normalized = normalizeMessage(submission);
  const breakdown: Breakdown = {
    echo: echoScore(normalized, peerEmotionChain),
    resonance: resonanceScore(normalized, peerEmotionChain),
    temporal: containsAny(normalized.normalized, TEMPORAL_MARKERS) ? 1 : 0,
    reciprocity: normalized.normalized.includes(RECIPROCITY_TOKEN) ? 1 : 0,
    pattern: normalized.normalized.includes(PATTERN_TOKEN) ? patternCohesion(normalized) : 0,
    context: normalized.normalized.includes(CONTEXT_TOKEN) ? contextDepth(normalized) : contextFromLanguage(normalized),
    heart_bridge: heartBridgeScore(normalized)
  };

  const weights = rubric?.weights ?? {};
  const scoreValue = (Object.keys(breakdown) as (keyof Breakdown)[]).reduce((sum, key) => {
    const weight = typeof weights[key] === "number" ? weights[key]! : 0;
    return sum + weight * breakdown[key];
  }, 0);

  return {
    score: clamp(scoreValue, 0, 1),
    breakdown
  };
}

function echoScore(normalized: ReturnType<typeof normalizeMessage>, chain: string[]): number {
  if (!chain.length) {
    return 0;
  }
  if (!normalized.tokens.length) {
    return 0;
  }
  const headWindow = Math.max(1, Math.ceil(normalized.tokens.length * 0.25));
  const head = normalized.tokens.slice(0, headWindow).join(" ");
  return chain.some((token) => head.includes(token)) ? 1 : 0;
}

function resonanceScore(normalized: ReturnType<typeof normalizeMessage>, chain: string[]): number {
  if (!chain.length) {
    return 0;
  }
  const sender = chain[0];
  const reply = detectDominantEmotion(normalized);
  if (!reply) {
    return 0;
  }
  const distance = shortestResonanceDistance(sender, reply);
  return resonanceFitness(distance);
}

function patternCohesion(normalized: ReturnType<typeof normalizeMessage>): number {
  if (!normalized.normalized.includes(PATTERN_TOKEN)) {
    return 0;
  }
  const connectors = (normalized.normalized.match(/→|map|model|rule|function|bridge/gi) ?? []).length;
  return clamp(0.6 + connectors * 0.1);
}

function contextDepth(normalized: ReturnType<typeof normalizeMessage>): number {
  const anchors = (normalized.normalized.match(/\b(last|since|during|after|before|at)\b/gi) ?? []).length;
  const details = (normalized.normalized.match(/\b(data|ridge|sunset|source|logs|record)\b/gi) ?? []).length;
  return clamp(0.5 + (anchors + details) * 0.1);
}

function contextFromLanguage(normalized: ReturnType<typeof normalizeMessage>): number {
  const grounded = (normalized.normalized.match(/\b(today|tonight|yesterday|last|since)\b/gi) ?? []).length;
  if (!grounded) {
    return 0;
  }
  return clamp(0.3 + grounded * 0.1);
}

function heartBridgeScore(normalized: ReturnType<typeof normalizeMessage>): number {
  if (!normalized.normalized.includes(HEART_BRIDGE_TOKEN)) {
    return 0;
  }
  const bridgeRegex = /🫀🔮[^🧩🪶⛰️🪶🌬️🪞]*((🧩🌀)|⛰️🪶)/u;
  if (bridgeRegex.test(normalized.normalized)) {
    return 1;
  }
  const reverseRegex = /((🧩🌀)|⛰️🪶)[^🫀🔮]*🫀🔮/u;
  if (reverseRegex.test(normalized.normalized)) {
    return 0.8;
  }
  return 0.6;
}

function detectDominantEmotion(normalized: ReturnType<typeof normalizeMessage>): string | null {
  if (normalized.emoji.length) {
    const counts = new Map<string, number>();
    for (const token of normalized.emoji) {
      counts.set(token, (counts.get(token) ?? 0) + 1);
    }
    let top: string | null = null;
    let maxCount = 0;
    for (const [token, count] of counts.entries()) {
      if (count > maxCount) {
        top = token;
        maxCount = count;
      }
    }
    if (top) {
      return top;
    }
  }
  const heuristics: Array<{ pattern: RegExp; token: string }> = [
    { pattern: /(rain|cloud|heavy|weighed)/i, token: "😢" },
    { pattern: /(think|curious|wonder|map)/i, token: "🤔" },
    { pattern: /(sprout|grow|seed|tend|bloom)/i, token: "🌱" },
    { pattern: /(bright|ease|relief|smile|glow)/i, token: "😊" }
  ];
  for (const heuristic of heuristics) {
    if (heuristic.pattern.test(normalized.normalized)) {
      return heuristic.token;
    }
  }
  return null;
}
