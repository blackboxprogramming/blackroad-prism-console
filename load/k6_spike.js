import http from 'k6/http';
import { check } from 'k6';
export const options = { stages: [{ duration: '30s', target: 50 }, { duration: '60s', target: 200 }, { duration: '15s', target: 0 }] };
export default function () {
  const res = http.get(`${__ENV.BASE_URL || 'https://blackroad.io'}/api/reco`);
  check(res, { '200': r => r.status === 200 });
}
