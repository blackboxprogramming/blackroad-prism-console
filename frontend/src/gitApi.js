import axios from 'axios';
import { API_BASE } from './api';

export async function gitHealth() {
  const { data } = await axios.get(`${API_BASE}/api/git/health`);
  return data;
}

export async function gitStatus() {
  const { data } = await axios.get(`${API_BASE}/api/git/status`);
  return data;
}

export async function gitChanges() {
  const { data } = await axios.get(`${API_BASE}/api/git/changes`);
  return data;
}

export async function gitStage(files) {
  const { data } = await axios.post(`${API_BASE}/api/git/stage`, { files });
  return data;
}

export async function gitUnstage(files) {
  const { data } = await axios.post(`${API_BASE}/api/git/unstage`, { files });
  return data;
}

export async function gitCommit(payload) {
  const { data } = await axios.post(`${API_BASE}/api/git/commit`, payload);
  return data;
}
