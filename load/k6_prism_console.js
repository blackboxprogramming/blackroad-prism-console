import http from 'k6/http';
import { check, group, sleep } from 'k6';

const UI_BASE = __ENV.UI_BASE_URL || 'http://127.0.0.1:4173';
const QUANTUM_BASE = __ENV.QUANTUM_BASE_URL || 'http://127.0.0.1:8020';
const MATERIALS_BASE = __ENV.MATERIALS_BASE_URL || 'http://127.0.0.1:8030';
const QUANTUM_TOKEN = __ENV.QUANTUM_TOKEN || 'dev-quantum';
const MATERIALS_POLL_DELAY = Number(__ENV.MATERIALS_POLL_DELAY || 0.5);
const MATERIALS_MAX_POLLS = Math.max(Number(__ENV.MATERIALS_MAX_POLLS || 5), 1);

export const options = {
  scenarios: {
    uiSmoke: {
      executor: 'constant-vus',
      vus: Number(__ENV.UI_VUS || 5),
      duration: __ENV.UI_DURATION || '40s',
      exec: 'uiFlow',
      tags: { component: 'frontend' }
    },
    quantumApi: {
      executor: 'ramping-arrival-rate',
      startRate: Number(__ENV.QUANTUM_START_RATE || 2),
      stages: [
        { duration: '10s', target: Number(__ENV.QUANTUM_TARGET_RATE || 6) },
        { duration: '20s', target: Number(__ENV.QUANTUM_TARGET_RATE || 6) },
        { duration: '10s', target: 0 }
      ],
      timeUnit: '1s',
      preAllocatedVUs: Number(__ENV.QUANTUM_PREALLOCATED_VUS || 8),
      maxVUs: Number(__ENV.QUANTUM_MAX_VUS || 16),
      exec: 'quantumFlow',
      tags: { component: 'quantum-lab' }
    },
    materialsJobs: {
      executor: 'per-vu-iterations',
      vus: Number(__ENV.MATERIALS_VUS || 6),
      iterations: Number(__ENV.MATERIALS_ITERATIONS || 5),
      exec: 'materialsFlow',
      maxDuration: __ENV.MATERIALS_MAX_DURATION || '2m',
      tags: { component: 'materials-service' }
    }
  },
  thresholds: {
    'http_req_failed{component:frontend}': ['rate<0.01'],
    'http_req_duration{component:frontend}': ['p(95)<850', 'p(99)<1500'],
    'http_req_failed{component:quantum-lab}': ['rate<0.02'],
    'http_req_duration{component:quantum-lab}': ['p(95)<1200', 'p(99)<1800'],
    'http_req_duration{component:materials-service}': ['p(95)<1400', 'avg<900']
  }
};

export function uiFlow() {
  group('landing', () => {
    const landing = http.get(`${UI_BASE}/`);
    check(landing, {
      'landing 200': (r) => r.status === 200,
      'serves html': (r) => {
        const contentType = r.headers['Content-Type'] || '';
        return contentType.indexOf('text/html') !== -1;
      }
    });
  });

  group('dashboard bundle', () => {
    const dashboard = http.get(`${UI_BASE}/src/pages/Dashboard.jsx`);
    check(dashboard, {
      'dashboard module ok': (r) => r.status === 200
    });
  });

  sleep(1);
}

export function quantumFlow() {
  const login = http.post(`${QUANTUM_BASE}/api/quantum/login`, null, {
    headers: { 'Content-Type': 'application/json' }
  });
  check(login, {
    'login 200': (r) => r.status === 200,
    'session id issued': (r) => !!r.json('session_id')
  });

  const sim = http.get(`${QUANTUM_BASE}/api/quantum/chsh/simulate`, {
    headers: { 'X-Quantum-Token': QUANTUM_TOKEN }
  });
  check(sim, {
    'simulation 200': (r) => r.status === 200,
    'has estimate': (r) => typeof r.json('S_estimate') === 'number'
  });

  sleep(0.5);
}

export function materialsFlow() {
  const create = http.post(
    `${MATERIALS_BASE}/jobs/grain-coarsening`,
    JSON.stringify({ grid: [8, 8, 8], num_flip_attempts: 500, seed: Math.floor(Math.random() * 1000) }),
    { headers: { 'Content-Type': 'application/json' } }
  );
  check(create, {
    'job created': (r) => r.status === 200,
    'job id present': (r) => !!r.json('id')
  });

  const jobId = create.json('id');
  sleep(MATERIALS_POLL_DELAY);

  let statusResponse = null;
  let jobStatus = 'pending';
  let pollAttempt = 0;

  while (pollAttempt < MATERIALS_MAX_POLLS) {
    statusResponse = http.get(`${MATERIALS_BASE}/jobs/${jobId}`);

    check(statusResponse, {
      'status 200': (r) => r.status === 200
    });

    jobStatus = statusResponse.json('status');
    if (jobStatus !== 'pending') {
      break;
    }

    pollAttempt += 1;
    if (pollAttempt < MATERIALS_MAX_POLLS) {
      sleep(MATERIALS_POLL_DELAY);
    }
  }

  check(statusResponse, {
    'job succeeded': () => jobStatus === 'succeeded'
  });

  sleep(0.5);
}
