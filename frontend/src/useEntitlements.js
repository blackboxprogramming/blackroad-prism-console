import { useEffect, useState } from 'react';
import axios from 'axios';
import { API_BASE } from './api';

function dive(obj, path) {
  return path.split('.').reduce((acc, key) => (acc ? acc[key] : undefined), obj);
}

export default function useEntitlements() {
  const [data, setData] = useState(null);

  useEffect(() => {
    axios
      .get(`${API_BASE}/api/billing/entitlements/me`)
      .then((res) => setData(res.data))
      .catch(() => {});
  }, []);

  return {
    planName: data?.planName || 'Free',
    has(cap) {
      return !!dive(data?.entitlements, cap);
    },
    limit(path) {
      return dive(data?.entitlements, path);
    },
  };
}
