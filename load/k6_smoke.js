import http from 'k6/http';
import { check, sleep } from 'k6';
export const options = { vus: 5, duration: '1m' };
export default function () {
  const res = http.get(`${__ENV.BASE_URL || 'https://blackroad.io'}/api/health`);
  check(res, { '200': r => r.status === 200 });
  sleep(1);
}
