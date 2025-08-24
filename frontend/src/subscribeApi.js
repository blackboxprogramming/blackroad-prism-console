import axios from 'axios';
import { API_BASE } from './api';

export async function fetchConfig(){
  const { data } = await axios.get(`${API_BASE}/api/subscribe/config`);
  return data;
}

export async function fetchStatus(){
  const { data } = await axios.get(`${API_BASE}/api/subscribe/status`);
  return data;
}

export async function startCheckout(planId, interval, coupon){
  const { data } = await axios.post(`${API_BASE}/api/subscribe/checkout`, { planId, interval, coupon });
  return data;
}

export async function openPortal(){
  const { data } = await axios.get(`${API_BASE}/api/subscribe/portal`);
  return data;
}

export async function fetchFeatureGates(){
  const { data } = await axios.get(`${API_BASE}/api/subscribe/feature-gates`);
  return data;
}
