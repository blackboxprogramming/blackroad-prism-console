import { EventEnvelope } from '../../../obs-mesh/src/envelope';
import { CorrelationKeyType, CorrelationRule } from '../index';

function isReleaseEvent(event: EventEnvelope): boolean {
  return event.kind === 'audit' && event.attrs?.['action'] === 'deploy.create';
}

function isIncidentEvent(event: EventEnvelope): boolean {
  return event.source === 'gateway' && event.kind === 'log' && event.attrs?.['route'] === '/incidents';
}

export const releaseIncidentJoin: CorrelationRule = {
  name: 'release_incident',
  apply(events: EventEnvelope[], key: string, keyType: CorrelationKeyType): string[] {
    if (keyType !== 'releaseId') {
      return [];
    }

    const relevant = events.filter((event) => event.releaseId === key);
    if (relevant.length === 0) {
      return [];
    }

    const hasDeploy = relevant.some(isReleaseEvent);
    const hasIncident = relevant.some(isIncidentEvent);

    if (hasDeploy && hasIncident) {
      return [`Release ${key} aligns with an incident window; review error rates.`];
    }

    if (hasDeploy && !hasIncident) {
      return [`Release ${key} has no incident records in correlated window.`];
    }

    return [];
  },
};

