import { fetchAgents } from './api';
import { getLocalAgents } from './localAgents';

export async function fetchAllAgents() {
  const [cloud, local] = await Promise.all([
    fetchAgents(),
    getLocalAgents().catch(() => [])
  ]);
  const withLoc = [
    ...cloud.map(a => ({ ...a, location: a.location || 'cloud' })),
    ...local.map(a => ({ ...a, location: 'local' }))
  ];
  return withLoc;
}
