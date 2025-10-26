import { clamp } from "./utils";

export type EmotionNode = string;

type Graph = Record<EmotionNode, EmotionNode[]>;

const resonanceGraph: Graph = {
  "😢": ["😔", "🤔", "🌧️"],
  "🌧️": ["😢", "😔", "🌀"],
  "😔": ["😢", "🤔", "🙂"],
  "🤔": ["😢", "😔", "🌱", "😊"],
  "🌱": ["🤔", "😊", "🌿"],
  "😊": ["🙂", "🌱", "😌"],
  "🙂": ["😊", "🤔"],
  "😌": ["😊", "🫀🔮"],
  "🫀🔮": ["😌", "🧩🌀"],
  "🧩🌀": ["🫀🔮", "⛰️🪶", "🤔"],
  "⛰️🪶": ["🧩🌀", "🌱", "🌬️🪞"],
  "🌬️🪞": ["⛰️🪶", "😊"],
  "🌀": ["🌧️", "🤔"],
  "🌿": ["🌱", "😊"],
  "😄": ["😊", "🤔"],
  "😭": ["😢", "🌧️"],
  "🙂️": ["😊"],
  "😕": ["😔", "🤔"]
};

export function shortestResonanceDistance(from: EmotionNode, to: EmotionNode): number {
  if (!from || !to) {
    return Number.POSITIVE_INFINITY;
  }
  if (from === to) {
    return 0;
  }
  const visited = new Set<EmotionNode>();
  const queue: Array<{ node: EmotionNode; distance: number }> = [{ node: from, distance: 0 }];

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) continue;
    if (visited.has(current.node)) {
      continue;
    }
    visited.add(current.node);
    const neighbors = resonanceGraph[current.node] ?? [];
    for (const neighbor of neighbors) {
      if (neighbor === to) {
        return current.distance + 1;
      }
      if (!visited.has(neighbor)) {
        queue.push({ node: neighbor, distance: current.distance + 1 });
      }
    }
  }

  return Number.POSITIVE_INFINITY;
}

export function resonanceFitness(distance: number): number {
  if (!Number.isFinite(distance)) {
    return 0;
  }
  if (distance <= 1) return 1;
  if (distance <= 3) return clamp(1 - (distance - 1) * 0.25);
  if (distance <= 5) return clamp(0.5 - (distance - 3) * 0.2);
  return 0;
}

export function expandChain(chain: string[]): string[] {
  if (!chain.length) {
    return chain;
  }
  const expanded: string[] = [];
  for (const token of chain) {
    expanded.push(token);
    const aliases = resonanceGraph[token] ?? [];
    for (const alias of aliases) {
      if (!expanded.includes(alias)) {
        expanded.push(alias);
      }
    }
  }
  return expanded;
}
