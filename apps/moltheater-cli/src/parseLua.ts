import luaparse from "luaparse";

export interface Perf {
  bpm: number;
  time: string;
  quant: string;
  voice?: string;
  key?: string;
  swing?: number;
}

export interface Say {
  t: string;
  pace: number;
  emph: number;
  pitch: number;
  beat?: string;
  overlay?: string;
  gesture?: string;
}

export type PostEvent =
  | { kind: "pause"; ms: number; beat?: string }
  | { kind: "stinger"; type: string; dur_ms: number; beat?: string; overlay?: string };

type LuaField = {
  key?: { name?: string; value?: string };
  value?: { type: string; value?: unknown };
};

type LuaCallExpression = {
  type: string;
  expression?: {
    base?: { name?: string };
    arguments?: Array<{ type: string; fields?: LuaField[] }>;
  };
};

export function parseLua(source: string): { header: Perf; seq: Say[]; post: PostEvent[] } {
  const ast = luaparse.parse(source, {
    comments: false,
    locations: false,
    luaVersion: "5.3",
  }) as { body?: LuaCallExpression[] };

  const seq: Say[] = [];
  const post: PostEvent[] = [];
  let header: Perf = { bpm: 120, time: "4/4", quant: "1/16" };

  const objFromFields = (fields: LuaField[] = []): Record<string, unknown> => {
    const out: Record<string, unknown> = {};
    for (const field of fields) {
      const key = field.key?.name ?? field.key?.value;
      if (!key) continue;
      const valueType = field.value?.type;
      if (valueType === "NumericLiteral" || valueType === "BooleanLiteral") {
        out[key] = field.value?.value;
      } else if (valueType === "StringLiteral") {
        out[key] = field.value?.value ?? "";
      }
    }
    return out;
  };

  const body = ast.body ?? [];
  for (const node of body) {
    if (node.type !== "CallStatement") continue;
    const expression = node.expression;
    const name = expression?.base?.name;
    const arg = expression?.arguments?.[0];
    if (!name || !arg || arg.type !== "TableConstructorExpression") continue;

    const obj = objFromFields(arg.fields ?? []);
    if (name === "perf") {
      header = {
        bpm: Number(obj.bpm ?? 120),
        time: String(obj.time ?? "4/4"),
        quant: String(obj.quant ?? "1/16"),
        voice: typeof obj.voice === "string" ? obj.voice : undefined,
        key: typeof obj.key === "string" ? obj.key : undefined,
        swing: typeof obj.swing === "number" ? (obj.swing as number) : undefined,
      };
    } else if (name === "say") {
      const word: Say = {
        t: String(obj.t ?? ""),
        pace: Number(obj.pace ?? 1.0),
        emph: Number(obj.emph ?? 0),
        pitch: Number(obj.pitch ?? 0),
        beat: typeof obj.beat === "string" ? obj.beat : undefined,
        overlay: typeof obj.overlay === "string" ? obj.overlay : undefined,
        gesture: typeof obj.gesture === "string" ? obj.gesture : undefined,
      };
      seq.push(word);
    } else if (name === "pause") {
      post.push({
        kind: "pause",
        ms: Number(obj.ms ?? 120),
        beat: typeof obj.beat === "string" ? obj.beat : undefined,
      });
    } else if (name === "stinger") {
      post.push({
        kind: "stinger",
        type: typeof obj.kind === "string" ? (obj.kind as string) : "hit",
        dur_ms: Number(obj.dur_ms ?? 120),
        beat: typeof obj.beat === "string" ? obj.beat : undefined,
        overlay: typeof obj.overlay === "string" ? obj.overlay : undefined,
      });
    }
  }

  return { header, seq, post };
}
