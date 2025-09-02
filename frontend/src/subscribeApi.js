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

export async function startConnector(service){
  const { data } = await axios.get(`${API_BASE}/api/connect/google/start?service=${service}`);
  return data;
}

export async function revokeConnector(service){
  const { data } = await axios.post(`${API_BASE}/api/connect/google/revoke`, { service });
  return data;
}

export async function fetchOnboardingSlots(){
  const { data } = await axios.get(`${API_BASE}/api/subscribe/onboarding/slots`);
  return data;
}

export async function bookOnboarding(slot){
  const { data } = await axios.post(`${API_BASE}/api/subscribe/onboarding/book`, { slot });
  return data;
}
