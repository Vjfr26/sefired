/** Servicio de API para los reportes y logs del sistema. */

import { API_BASE_URL } from '../config.js'

const API_LOGS = `${API_BASE_URL}/api/reports/logs`
const API_STATS = `${API_BASE_URL}/api/reports/stats`
const API_AUDIT_LOG = `${API_BASE_URL}/api/reports/audit-log`
const API_EMAIL_LOGS = `${API_BASE_URL}/api/reports/email-logs`
const API_IPS_BLOQUEADAS = `${API_BASE_URL}/api/reports/ips-bloqueadas`

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

export async function fetchAuditLog(params = {}) {
  const query = new URLSearchParams(params).toString()
  const url = query ? `${API_AUDIT_LOG}?${query}` : API_AUDIT_LOG
  const res = await fetch(url, { cache: 'no-store', headers: getAuthHeaders() })
  if (!res.ok) throw new Error('Error al cargar el historial de cambios')
  return res.json()
}

export async function fetchEmailLogs(params = {}) {
  const query = new URLSearchParams(params).toString()
  const url = query ? `${API_EMAIL_LOGS}?${query}` : API_EMAIL_LOGS
  const res = await fetch(url, { cache: 'no-store', headers: getAuthHeaders() })
  if (!res.ok) throw new Error('Error al cargar el historial de correos')
  return res.json()
}

export async function fetchIpsBloqueadas() {
  const res = await fetch(API_IPS_BLOQUEADAS, { cache: 'no-store', headers: getAuthHeaders() })
  if (!res.ok) throw new Error('Error al cargar las IPs bloqueadas')
  return res.json()
}

export async function desbloquearIp(id) {
  const res = await fetch(`${API_IPS_BLOQUEADAS}/${id}`, { method: 'DELETE', headers: getAuthHeaders() })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(json.message || 'Error al desbloquear la IP')
  return json
}

export async function fetchStats() {
  const res = await fetch(API_STATS, {
    cache: 'no-store',
    headers: getAuthHeaders()
  })
  if (!res.ok) throw new Error('Error al cargar las estadísticas')
  return res.json()
}
