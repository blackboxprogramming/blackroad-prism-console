import { valueIteration } from '../src/mdp/vi.js';
import { extractGreedyPolicy } from '../src/mdp/greedy.js';

describe('value iteration', () => {
  it('finds optimal policy driving towards origin', () => {
    const states = [[-1], [0], [1]];
    const actions = [[-1], [0], [1]];
    const transition = (stateIndex: number, actionIndex: number) => {
      const action = actions[actionIndex][0];
      const current = states[stateIndex][0];
      const nextState = Math.max(-1, Math.min(1, current + action));
      const nextIndex = states.findIndex((candidate) => candidate[0] === nextState);
      return [[nextIndex, 1]] as Array<[number, number]>;
    };
    const reward = (stateIndex: number, actionIndex: number) => {
      const x = states[stateIndex][0];
      const u = actions[actionIndex][0];
      return 0.5 * (x * x + u * u);
    };

    const result = valueIteration({
      states,
      actions,
      transition,
      reward,
      discount: 0.9,
      tolerance: 1e-6,
      maxIterations: 500
    });

    expect(result.residual).toBeLessThan(1e-4);
    const policy = extractGreedyPolicy({ states, actions, transition, reward, discount: 0.9 }, result.value);
    expect(policy.actions[0][0]).toBe(1);
    expect(policy.actions[2][0]).toBe(-1);
  });
});
