import type { Say } from "./parseLua.js";

const TOKEN_REGEX = /\[([^\|\]]+)(?:\|([^\]]+))?\]/g;

export function parseKey(line: string): Say[] {
  const entries: Say[] = [];
  let match: RegExpExecArray | null;

  TOKEN_REGEX.lastIndex = 0;
  while ((match = TOKEN_REGEX.exec(line)) !== null) {
    const word = match[1];
    const rawFields = match[2] ?? "";
    const fields = rawFields.split("|").filter(Boolean);

    let pace = 1.0;
    let emph = 0;
    let pitch = 0;
    let overlay: string | undefined;
    let gesture: string | undefined;
    let beat: string | undefined;

    for (const field of fields) {
      if (field.includes("*")) {
        overlay = "harm";
      }
      if (field.includes("!")) {
        gesture = "microZoom";
      }

      let token = field;
      if (token.includes("@")) {
        const parts = token.split("@");
        token = parts[0] ?? token;
        beat = parts[1] ?? beat;
      }

      const normalized = token.replace(/[*!]/g, "");
      if (/^p-?\d+(?:\.\d+)?$/i.test(normalized)) {
        pace = Number.parseFloat(normalized.slice(1));
        continue;
      }
      if (/^e-?\d+(?:\.\d+)?$/i.test(normalized)) {
        emph = Number.parseFloat(normalized.slice(1));
        continue;
      }
      if (/^p[+-]\d+$/i.test(normalized)) {
        pitch = Number.parseInt(normalized.slice(1), 10);
        continue;
      }
    }

    entries.push({ t: word, pace, emph, pitch, overlay, gesture, beat });
  }

  return entries;
}
