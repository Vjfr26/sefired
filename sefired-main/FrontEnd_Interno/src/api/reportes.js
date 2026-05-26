import { API_BASE_URL } from '../config.js'

function getAuthHeaders() {
  const token = localStorage.getItem('auth_token')
  return { Accept: 'application/json', Authorization: `Bearer ${token}` }
}

export async function fetchStats() {
  const res = await fetch(`${API_BASE_URL}/api/reports/stats`, { headers: getAuthHeaders() })
  if (!res.ok) throw new Error('Error al cargar estadísticas')
  return res.json()
}

export async function fetchLogs(params = {}) {
  const qs = new URLSearchParams(Object.fromEntries(Object.entries(params).filter(([, v]) => v != null && v !== '')))
  const res = await fetch(`${API_BASE_URL}/api/reports/logs?${qs}`, { headers: getAuthHeaders() })
  if (!res.ok) throw new Error('Error al cargar logs')
  return res.json()
}
