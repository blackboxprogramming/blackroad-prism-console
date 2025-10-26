import { stripAnsi } from "./utils";

export type NormalizedMessage = {
  raw: string;
  normalized: string;
  tokens: string[];
  emoji: string[];
};

const emojiAliasMap: Record<string, string> = {
  "😭": "😢",
  "😿": "😢",
  "🙂": "😊",
  "☺️": "😊",
  "😀": "😊",
  "🙂️": "😊"
};

const wordToEmojiMap: Record<string, string> = {
  now: "🔆",
  today: "🔆",
  yesterday: "⏳",
  before: "⏳",
  tomorrow: "🚀",
  later: "🚀",
  future: "🚀"
};

const asciiEmojiMap: Record<string, string> = {
  ":)": "😊",
  ":-)": "😊",
  "(:": "😊",
  ":<": "😢",
  ":-(": "😢",
  ":(": "😢"
};

const skinToneModifiers = /[\u{1F3FB}-\u{1F3FF}]/gu;
const arrowPattern = /->/g;
const whitespacePattern = /\s+/g;

function applyAsciiAliases(input: string): string {
  return Object.entries(asciiEmojiMap).reduce((acc, [pattern, emoji]) => {
    const escaped = pattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return acc.replace(new RegExp(escaped, "g"), emoji);
  }, input);
}

function applyWordAliases(input: string): string {
  return input.replace(/\b[a-zA-Z]+\b/g, (word) => {
    const lower = word.toLowerCase();
    return wordToEmojiMap[lower] ?? word;
  });
}

function applyEmojiAliases(input: string): string {
  return [...input].map((symbol) => emojiAliasMap[symbol] ?? symbol).join("");
}

export function normalizeMessage(input: string): NormalizedMessage {
  const raw = input ?? "";
  const stripped = stripAnsi(raw).normalize("NFC").replace(skinToneModifiers, "");
  const asciiApplied = applyAsciiAliases(stripped);
  const wordMapped = applyWordAliases(asciiApplied);
  const arrowNormalized = wordMapped.replace(arrowPattern, "→");
  const canonical = applyEmojiAliases(arrowNormalized);
  const squished = canonical.replace(whitespacePattern, " ").trim();
  const tokens = squished.length === 0 ? [] : squished.split(/\s+/);
  const emoji = extractEmojiTokens(squished);
  return {
    raw,
    normalized: squished,
    tokens,
    emoji
  };
}

export function extractEmojiTokens(input: string): string[] {
  const emojiRegex = /[\p{Extended_Pictographic}]/gu;
  return [...(input.match(emojiRegex) ?? [])];
}

export function containsAny(text: string, needles: string[]): boolean {
  return needles.some((needle) => text.includes(needle));
}

export function concatenateChannels(content?: {
  text?: string;
  emoji?: string;
  scene_actions?: string[];
}): string {
  if (!content) {
    return "";
  }
  const segments: string[] = [];
  if (content.text) segments.push(content.text);
  if (content.emoji) segments.push(content.emoji);
  if (content.scene_actions?.length) segments.push(content.scene_actions.join(" → "));
  return segments.join(" \n");
}
