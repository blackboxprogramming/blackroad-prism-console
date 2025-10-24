import { ControlPlaneStore } from './store';
import { Environment, Incident, Service } from './domain';

async function seed() {
  const store = new ControlPlaneStore();
  await store.load();

  const stagingEnv: Environment = {
    id: 'env-staging',
    name: 'staging',
    region: 'us-east-1',
    cluster: 'demo-staging',
    policyRefs: ['policy:change-window:weekday']
  };

  const prodEnv: Environment = {
    id: 'env-prod',
    name: 'prod',
    region: 'us-east-1',
    cluster: 'demo-prod',
    policyRefs: ['policy:change-window:weekday']
  };

  store.upsertEnvironment(stagingEnv);
  store.upsertEnvironment(prodEnv);

  const demoService: Service = {
    id: 'svc-demo',
    name: 'Demo Service',
    repo: 'github.com/blackroad/demo-service',
    adapters: { deployments: ['aws', 'fly'] },
    environments: [
      { id: stagingEnv.id, name: stagingEnv.name },
      { id: prodEnv.id, name: prodEnv.name }
    ]
  };

  store.upsertService(demoService);

  store.createRelease({ serviceId: demoService.id, envId: stagingEnv.id, sha: '9f3b7de', version: '2024.10.01', status: 'Active' });

  const incident: Incident = {
    id: 'inc-demo-1',
    serviceId: demoService.id,
    severity: 'medium',
    startedAt: new Date().toISOString(),
    status: 'investigating',
    link: 'https://status.example.com/inc-demo-1'
  };

  store.upsertIncident(incident);

  await store.persist();
  console.log('Seeded control-plane state.');
}

seed().catch((error) => {
  console.error('Failed to seed control-plane data', error);
  process.exit(1);
});
