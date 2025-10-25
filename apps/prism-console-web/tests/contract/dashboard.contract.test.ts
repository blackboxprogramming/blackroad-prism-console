import { describe, expect, it } from 'vitest';
import { dashboardSchema } from '@/features/dashboard-api';
import payload from '../../mocks/dashboard.json';

describe('dashboard contract', () => {
  it('matches the expected schema', () => {
    const result = dashboardSchema.safeParse(payload);
    expect(result.success).toBe(true);
  });

  it('fails when shortcuts drift', () => {
    const broken = {
      ...payload,
      shortcuts: [{ id: '1', title: 'bad', icon: 'x', url: 'not-a-url' }]
    };
    const result = dashboardSchema.safeParse(broken);
    expect(result.success).toBe(false);
  });
});
