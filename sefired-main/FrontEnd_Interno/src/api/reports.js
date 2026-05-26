/** Servicio de API para los reportes y logs del sistema. */

import { API_BASE_URL } from '../config.js'

const API_LOGS = `${API_BASE_URL}/api/reports/logs`
const API_STATS = `${API_BASE_URL}/api/reports/stats`

function getAuthHeaders() {
  const token = localStorage.getItem('auth_token')
  return {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  }
}

export async function fetchLogs(params = {}) {
  const query = new URLSearchParams(params).toString()
  const url = query ? `${API_LOGS}?${query}` : API_LOGS
  const res = await fetch(url, {
    cache: 'no-store',
    headers: getAuthHeaders()
  })
  if (!res.ok) throw new Error('Error al cargar los logs')
  return res.json()
}

export async function fetchStats() {
  const res = await fetch(API_STATS, {
    cache: 'no-store',
    headers: getAuthHeaders()
  })
  if (!res.ok) throw new Error('Error al cargar las estadísticas')
  return res.json()
}
