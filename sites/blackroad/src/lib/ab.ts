export function getAssignments(): Record<string, string> {
  try {
    const m = document.cookie.match(/br_ab=([^;]+)/)
    return m ? JSON.parse(decodeURIComponent(m[1])) : {}
  } catch {
    return {}
  }
}
