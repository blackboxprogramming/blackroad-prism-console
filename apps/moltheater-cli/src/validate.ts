import type { Say } from "./parseLua.js";

export interface ClampOptions {
  pace: [number, number];
  pitch: [number, number];
  emphBudget: number;
}

const DEFAULT_OPTIONS: ClampOptions = {
  pace: [0.75, 1.25],
  pitch: [-5, 5],
  emphBudget: 0.35,
};

export function clampPerf(sequence: Say[], options: ClampOptions = DEFAULT_OPTIONS): Say[] {
  const cloned = sequence.map((word) => ({ ...word }));

  for (const word of cloned) {
    word.pace = Math.max(options.pace[0], Math.min(options.pace[1], word.pace));
    word.pitch = Math.max(options.pitch[0], Math.min(options.pitch[1], word.pitch));
    word.emph = Math.max(0, Math.min(1, word.emph));
  }

  const totalEmphasis = cloned.reduce((sum, word) => sum + word.emph, 0);
  if (totalEmphasis > options.emphBudget) {
    const scale = options.emphBudget / (totalEmphasis || 1);
    for (const word of cloned) {
      word.emph = Number((word.emph * scale).toFixed(4));
    }
  }

  return cloned;
}
