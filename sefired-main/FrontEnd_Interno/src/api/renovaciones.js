import { API_BASE_URL } from '../config.js'

const API = `${API_BASE_URL}/api/renovaciones-qr`

function headers(extra = {}) {
  const token = localStorage.getItem('auth_token')
  return { Accept: 'application/json', Authorization: `Bearer ${token}`, ...extra }
}

export async function fetchRenovaciones({ status = '', q = '', page = 1 } = {}) {
  const params = new URLSearchParams({ page })
  if (status) params.set('status', status)
  if (q)      params.set('q', q)
  const res  = await fetch(`${API}?${params}`, { headers: headers() })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(json.message || 'Error al cargar renovaciones')
  return json
}

export async function autorizarRenovacion(id, { tasa_bcv, tasa_eur }) {
  const res  = await fetch(`${API}/${id}/autorizar`, {
    method: 'POST',
    headers: headers({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ tasa_bcv, tasa_eur }),
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(json.error || json.message || 'Error al autorizar')
  return json
}

export async function rechazarRenovacion(id, nota = '') {
  const res  = await fetch(`${API}/${id}/rechazar`, {
    method: 'POST',
    headers: headers({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ nota }),
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(json.error || json.message || 'Error al rechazar')
  return json
}
