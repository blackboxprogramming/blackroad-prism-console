import type { ValueIterationConfig, Vector } from '../types.js';

export interface GreedyPolicyResult {
  actions: Vector[];
  ties: number;
}

export function extractGreedyPolicy(config: ValueIterationConfig, value: number[]): GreedyPolicyResult {
  const actions: Vector[] = new Array(config.states.length).fill(0).map(() => new Array(config.actions[0].length).fill(0));
  let ties = 0;
  for (let s = 0; s < config.states.length; s += 1) {
    let bestActionIndex = 0;
    let bestValue = Number.POSITIVE_INFINITY;
    let tieCount = 0;
    for (let a = 0; a < config.actions.length; a += 1) {
      const transitions = config.transition(s, a);
      let total = config.reward(s, a);
      for (const [next, probability] of transitions) {
        total += config.discount * probability * value[next];
      }
      if (total < bestValue - 1e-12) {
        bestValue = total;
        bestActionIndex = a;
        tieCount = 0;
      } else if (Math.abs(total - bestValue) <= 1e-12) {
        tieCount += 1;
      }
    }
    if (tieCount > 0) {
      ties += 1;
    }
    actions[s] = config.actions[bestActionIndex].slice();
  }
  return { actions, ties };
}

export function createGreedyPolicy(config: ValueIterationConfig, value: number[]) {
  const { actions } = extractGreedyPolicy(config, value);
  return (state: Vector) => {
    const index = config.states.findIndex((candidate) => candidate.every((v, i) => Math.abs(v - state[i]) < 1e-9));
    if (index === -1) {
      throw new Error('State not present in lattice');
    }
    return actions[index];
  };
}
