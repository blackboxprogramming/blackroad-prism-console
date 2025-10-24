import { ControlPlaneStore } from '../store';
import { awsAdapter } from './deployments/aws';
import { flyAdapter } from './deployments/fly';
import { StubIncidentAdapter } from './incidents/stub';
import { DeployAdapter, IncidentAdapter } from './types';

const deployAdapters: Record<string, DeployAdapter> = {
  aws: awsAdapter,
  fly: flyAdapter
};

export function getDeployAdapter(name: string): DeployAdapter {
  const adapter = deployAdapters[name];
  if (!adapter) {
    throw new Error(`Unknown deploy adapter: ${name}`);
  }
  return adapter;
}

export function createIncidentAdapter(store: ControlPlaneStore): IncidentAdapter {
  return new StubIncidentAdapter(store);
}
