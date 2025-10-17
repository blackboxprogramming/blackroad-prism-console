import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  scenarios: {
    ramp: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '1m', target: 10 },
        { duration: '2m', target: 10 }
      ],
      gracefulRampDown: '10s'
    }
  },
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<1000']
  }
};

const BASE = __ENV.TARGET_URL;
const API = __ENV.API_URL;

export default function () {
  const ui = http.get(`${BASE}`);
  check(ui, { 'ui 200': (r) => r.status === 200 });

  const ev = http.get(`${API}/v1/metrics/events?from=-P1D`, {
    headers: { 'X-API-Key': `${__ENV.API_KEY || ''}` }
  });
  check(ev, { 'metrics 200': (r) => r.status === 200 });

  sleep(1);
}
