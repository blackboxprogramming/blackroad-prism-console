import axios from 'axios';
import { API_BASE } from './api';

export async function fetchPlans() {
  const { data } = await axios.get(`${API_BASE}/api/subscribe/plans`);
  return data;
}

export async function fetchConfig() {
  const { data } = await axios.get(`${API_BASE}/api/subscribe/config`);
  return data;
}

export async function fetchStatus() {
  const { data } = await axios.get(`${API_BASE}/api/subscribe/status`);
  return data;
}

export async function startCheckout(plan, billing_cycle, coupon) {
  const { data } = await axios.post(`${API_BASE}/api/subscribe/checkout`, {
    plan,
    billing_cycle,
    coupon,
  });
  return data;
}

export async function openPortal() {
  const { data } = await axios.get(`${API_BASE}/api/subscribe/portal`);
  return data;
}

export async function fetchFeatureGates() {
  const { data } = await axios.get(`${API_BASE}/api/subscribe/feature-gates`);
  return data;
}

export async function fetchHealth() {
  const { data } = await axios.get(`${API_BASE}/api/subscribe/health`);
  return data;
}
