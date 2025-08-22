import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000'

export function setToken(token){
  axios.defaults.headers.common['Authorization'] = token ? `Bearer ${token}` : ''
}

export async function login(username, password){
  const { data } = await axios.post(`${API_BASE}/api/auth/login`, { username, password })
  return data
}

export async function me(){
  const { data } = await axios.get(`${API_BASE}/api/auth/me`)
  return data.user
}

export async function fetchTimeline(){
  const { data } = await axios.get(`${API_BASE}/api/timeline`)
  return data.timeline
}
export async function fetchTasks(){
  const { data } = await axios.get(`${API_BASE}/api/tasks`)
  return data.tasks
}
export async function fetchCommits(){
  const { data } = await axios.get(`${API_BASE}/api/commits`)
  return data.commits
}
export async function fetchAgents(){
  const { data } = await axios.get(`${API_BASE}/api/agents`)
  return data.agents
}
export async function fetchWallet(){
  const { data } = await axios.get(`${API_BASE}/api/wallet`)
  return data.wallet
}

export async function fetchRoadcoinWallet(){
  const { data } = await axios.get(`${API_BASE}/api/roadcoin/wallet`)
  return data
}

export async function mintRoadcoin(){
  const { data } = await axios.post(`${API_BASE}/api/roadcoin/mint`)
  return data
}
export async function fetchContradictions(){
  const { data } = await axios.get(`${API_BASE}/api/contradictions`)
  return data.contradictions
}
export async function getNotes(){
  const { data } = await axios.get(`${API_BASE}/api/notes`)
  return data.notes
}
export async function setNotes(notes){
  const { data } = await axios.post(`${API_BASE}/api/notes`, { notes })
  return data
}
export async function action(name){
  const { data } = await axios.post(`${API_BASE}/api/actions/${name}`)
  return data
}

export { API_BASE }
