import { randomUUID } from "node:crypto";
import { CommRecord, LexiconDefinition, LexiconHit, SurveillanceAlert } from "../types.js";

export interface LexiconScanOptions {
  boostAmounts?: number;
  boostOffChannel?: number;
  boostMnpi?: number;
}

const defaultOptions: Required<LexiconScanOptions> = {
  boostAmounts: 10,
  boostOffChannel: 15,
  boostMnpi: 12,
};

const scenarioMap: Record<string, string> = {
  PROMISSORY: "PROMISSORY_LANGUAGE",
  GUARANTEE: "PROMISSORY_LANGUAGE",
  OFF_CHANNEL: "OFF_CHANNEL_COMMS",
  MNPI: "MNPI_LEAK",
  CRYPTO_OBFUSCATION: "CRYPTO_OBFUSCATION",
};

export function scanCommunications(
  comms: CommRecord[],
  lexicons: LexiconDefinition[],
  options: LexiconScanOptions = {}
): { hits: LexiconHit[]; alerts: SurveillanceAlert[] } {
  const mergedOptions = { ...defaultOptions, ...options };
  const hits: LexiconHit[] = [];
  const alerts: SurveillanceAlert[] = [];

  for (const comm of comms) {
    const textLower = comm.text.toLowerCase();
    for (const lexicon of lexicons) {
      const scenario = scenarioMap[lexicon.key] ?? lexicon.key;
      const matches = matchLexicon(textLower, comm.text, lexicon);
      for (const match of matches) {
        const risk = computeRisk(match.snippet, lexicon, mergedOptions);
        hits.push({
          commId: comm.id,
          lexiconKey: lexicon.key,
          phrase: match.phrase,
          offsets: match.offsets,
          risk,
          snippet: match.snippet,
        });
        alerts.push({
          id: randomUUID(),
          kind: "COMMS",
          scenario,
          severity: Math.min(100, risk),
          status: "Open",
          key: `${comm.id}|${lexicon.key}|${match.offsets[0]}`,
          signal: {
            commId: comm.id,
            threadId: comm.threadId ?? null,
            lexicon: lexicon.key,
            phrase: match.phrase,
            offsets: match.offsets,
            snippet: match.snippet,
            risk,
          },
          createdAt: comm.ts,
        });
      }
    }
  }

  return { hits, alerts };
}

interface MatchResult {
  phrase: string;
  offsets: [number, number];
  snippet: string;
}

function matchLexicon(textLower: string, original: string, lexicon: LexiconDefinition): MatchResult[] {
  const results: MatchResult[] = [];
  for (const phrase of lexicon.phrases) {
    if (phrase instanceof RegExp) {
      const regex = new RegExp(phrase, phrase.flags.includes("g") ? phrase.flags : `${phrase.flags}g`);
      let exec: RegExpExecArray | null;
      while ((exec = regex.exec(original)) !== null) {
        const snippet = extractSnippet(original, exec.index, exec[0].length, lexicon.proximity);
        results.push({ phrase: exec[0], offsets: [exec.index, exec.index + exec[0].length], snippet });
      }
      continue;
    }
    const normalized = phrase.toLowerCase();
    let start = textLower.indexOf(normalized);
    while (start !== -1) {
      const end = start + normalized.length;
      const snippet = extractSnippet(original, start, normalized.length, lexicon.proximity);
      results.push({ phrase, offsets: [start, end], snippet });
      start = textLower.indexOf(normalized, end);
    }
  }
  return results;
}

function extractSnippet(text: string, index: number, length: number, proximity: number): string {
  const window = Math.max(10, proximity * 5);
  const start = Math.max(0, index - window);
  const end = Math.min(text.length, index + length + window);
  return text.slice(start, end).trim();
}

function computeRisk(snippet: string, lexicon: LexiconDefinition, options: Required<LexiconScanOptions>): number {
  let risk = lexicon.riskBase;
  const snippetLower = snippet.toLowerCase();
  if (/\$\s?\d|\d+%/.test(snippet)) {
    risk += options.boostAmounts;
  }
  if (/(whatsapp|signal|telegram|wechat|delete chat|personal email|text me)/i.test(snippetLower)) {
    risk += options.boostOffChannel;
  }
  if (/(earnings|deal|go private|confidential|under nda|mnpi|client list)/i.test(snippetLower)) {
    risk += options.boostMnpi;
  }
  return risk;
}

export const seedLexicons: LexiconDefinition[] = [
  {
    key: "PROMISSORY",
    phrases: ["guarantee", "promise return", "risk-free", "will make you"],
    proximity: 6,
    riskBase: 70,
  },
  {
    key: "OFF_CHANNEL",
    phrases: ["whatsapp", "signal", "telegram", "use personal email", "text me"],
    proximity: 8,
    riskBase: 65,
  },
  {
    key: "MNPI",
    phrases: ["earnings are", "client list", "confidential", "under NDA"],
    proximity: 8,
    riskBase: 80,
  },
  {
    key: "CRYPTO_OBFUSCATION",
    phrases: ["tumbler", "mixer", "peel", "privacy coin"],
    proximity: 6,
    riskBase: 75,
  },
];
