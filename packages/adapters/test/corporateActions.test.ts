import { describe, it, expect } from 'vitest';
import { loadCorporateAction } from '../src/corporateActions.js';
import { join } from 'path';

describe('Corporate actions', () => {
  it('loads token migration action', async () => {
    const action = await loadCorporateAction(join(process.cwd(), 'samples/erc20_token_migration.json'));
    expect(action.type).toBe('TOKEN_MIGRATION');
    expect(action.details.to).toBe('USDC.e');
  });
});
