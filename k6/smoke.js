import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 1,
  iterations: 10,
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<800']
  }
};

const BASE = __ENV.TARGET_URL;

export default function () {
  const res = http.get(`${BASE}`);
  check(res, { 'status 200': (r) => r.status === 200 });
  sleep(1);
}
