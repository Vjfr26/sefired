import { API_BASE_URL } from '../config.js'

function authHeaders(extra = {}) {
  const token = localStorage.getItem('auth_token')
  return { Accept: 'application/json', Authorization: `Bearer ${token}`, ...extra }
}

export async function fetchUnderwriting(solicitudId) {
  const res = await fetch(`${API_BASE_URL}/api/cotizaciones/${solicitudId}/underwriting`, {
    headers: authHeaders(),
  })
  if (!res.ok) throw new Error('Error al cargar evaluaciones')
  return res.json()
}

export async function createUnderwriting(solicitudId, data) {
  const res = await fetch(`${API_BASE_URL}/api/cotizaciones/${solicitudId}/underwriting`, {
    method: 'POST',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(data),
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(json.message || json.error || 'Error al guardar evaluación')
  return json
}

export async function updateUnderwriting(id, data) {
  const res = await fetch(`${API_BASE_URL}/api/underwriting/${id}`, {
    method: 'PUT',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(data),
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(json.message || json.error || 'Error al actualizar evaluación')
  return json
}
