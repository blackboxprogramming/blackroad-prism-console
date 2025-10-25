import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_BASE || ''

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

export async function fetchAgentRegistry(){
  const { data } = await axios.get(`${API_BASE}/api/agents/registry`)
  return data
}

export async function spawnAgent(payload){
  const { data } = await axios.post(`${API_BASE}/api/agents/spawn`, payload)
  return data
}

export async function updateAgentMetadata(agentId, payload){
  const { data } = await axios.patch(`${API_BASE}/api/agents/${agentId}`, payload)
  return data.agent
}

export async function revertAgentRegistration(agentId){
  const { data } = await axios.post(`${API_BASE}/api/agents/${agentId}/revert`)
  return data
}

export async function fetchOrchestratorAgents(){
  const { data } = await axios.get(`${API_BASE}/api/orchestrator/agents`)
  return data.agents
}

export async function controlAgent(id, action){
  const { data } = await axios.post(`${API_BASE}/api/orchestrator/control/${id}`, { action })
  return data
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

export async function fetchGuardianStatus(){
  const { data } = await axios.get(`${API_BASE}/api/guardian/status`)
  return data
}

export async function fetchGuardianAlerts(){
  const { data } = await axios.get(`${API_BASE}/api/guardian/alerts`)
  return data.alerts
}

export async function resolveGuardianAlert(id, status = 'resolved'){
  const { data } = await axios.post(`${API_BASE}/api/guardian/alerts/${id}/resolve`, { status })
  return data.alert
}

export async function resolveGuardianAlert(id, status='resolved'){
export async function resolveGuardianAlert(id, status = 'resolved') {
  const { data } = await axios.post(`${API_BASE}/api/guardian/alerts/${id}/resolve`, { status })
  return data.alert
}

export async function fetchDashboardSystem() {
  const { data } = await axios.get(`${API_BASE}/api/dashboard/system`)
  return data
}

export async function fetchDashboardFeed() {
  const { data } = await axios.get(`${API_BASE}/api/dashboard/feed`)
  return data.events
}

export async function fetchProfile() {
  const { data } = await axios.get(`${API_BASE}/api/you/profile`)
  return data.profile
}

  return data
}

export async function claudeChat(prompt) {
  const { data } = await axios.post(`${API_BASE}/api/claude/chat`, { prompt })
  return data
}

export async function fetchClaudeHistory() {
  const { data } = await axios.get(`${API_BASE}/api/claude/history`)
  return data.history
}

export async function runCodex(prompt){
export async function runCodex(prompt) {
  const { data } = await axios.post(`${API_BASE}/api/codex/run`, { prompt })
  return data
}

export async function fetchCodexHistory() {
  const { data } = await axios.get(`${API_BASE}/api/codex/history`)
  return data.runs
}

export async function fetchRoadbookChapters(){
export async function fetchRoadbookChapters() {
  const { data } = await axios.get(`${API_BASE}/api/roadbook/chapters`)
  return data.chapters
}

export async function fetchRoadbookChapter(id) {
  const { data } = await axios.get(`${API_BASE}/api/roadbook/chapter/${id}`)
  return data.chapter
}

export async function searchRoadbook(term) {
  const { data } = await axios.get(`${API_BASE}/api/roadbook/search`, { params: { q: term } })
  return data.results
}

export async function fetchRoadviewStreams(){
export async function fetchRoadviewStreams() {
  const { data } = await axios.get(`${API_BASE}/api/roadview/list`)
  return data.streams
}

export async function fetchManifesto(){
  const { data } = await axios.get(`${API_BASE}/api/manifesto`)
  return data.content
}

export async function fetchAutohealEvents(){
  const { data } = await axios.get(`${API_BASE}/api/autoheal/events`)
  return data.events
}

export async function postAutohealEscalation(note){
  const { data } = await axios.post(`${API_BASE}/api/autoheal/escalations`, { note })
  return data.event
}

export async function fetchSecuritySpotlights(){
  const { data } = await axios.get(`${API_BASE}/api/security/spotlights`)
  return data.spotlights
}

export async function updateSecuritySpotlight(panel, payload){
  const { data } = await axios.post(`${API_BASE}/api/security/spotlights/${panel}`, payload)
  return data
}

export async function infer(x, y){
  const { data } = await axios.post(`${API_BASE}/api/mini/infer`, { x, y })
export async function restartService(name){
  const { data } = await axios.post(`${API_BASE}/api/autoheal/restart/${name}`)
  return data
}

export async function rollbackLatest(){
  const { data } = await axios.post(`${API_BASE}/api/rollback/latest`)
  return data
}

export async function rollbackTo(id){
export async function fetchSnapshots() {
  const { data } = await axios.get(`${API_BASE}/api/snapshots`)
  return data.snapshots
}

export async function createSnapshot() {
  const { data } = await axios.post(`${API_BASE}/api/snapshots`)
  return data.snapshot
}

export async function rollbackSnapshot(id) {
  const { data } = await axios.post(`${API_BASE}/api/rollback/${id}`)
  return data
}

export async function purgeContradictions(){
  const { data } = await axios.delete(`${API_BASE}/api/contradictions/all`)
  return data
}

export async function injectContradictionTest(){
  const { data } = await axios.post(`${API_BASE}/api/contradictions/test`)
  return data
export async function fetchSnapshotLogs() {
  const { data } = await axios.get(`${API_BASE}/api/snapshots/logs`)
  return data.logs
}

export async function fetchRollbackLogs() {
  const { data } = await axios.get(`${API_BASE}/api/rollback/logs`)
  return data.logs
export async function fetchPiStatus(){
  const { data } = await axios.get(`${API_BASE}/api/pi/status`)
  return data
}

export { API_BASE }
