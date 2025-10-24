import { ControlPlaneStore } from '../../store';
import { Incident } from '../../domain';
import { IncidentAdapter } from '../types';

export class StubIncidentAdapter implements IncidentAdapter {
  name: 'stub' = 'stub';

  constructor(private readonly store: ControlPlaneStore) {}

  async recent(input: { serviceId: string; limit?: number }): Promise<Incident[]> {
    return this.store.listIncidents(input.serviceId, input.limit);
  }
}
