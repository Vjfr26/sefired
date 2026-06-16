import { API_BASE_URL } from '../config.js'

const API = `${API_BASE_URL}/api/bienes`

function getAuthHeaders(extra = {}) {
  const token = localStorage.getItem('auth_token')
  return { Accept: 'application/json', Authorization: `Bearer ${token}`, ...extra }
}

export async function fetchBienes(params = {}) {
  const qs = new URLSearchParams(params).toString()
  const res = await fetch(qs ? `${API}?${qs}` : API, { headers: getAuthHeaders() })
  if (!res.ok) throw new Error('Error al cargar bienes')
  return res.json()
}

export async function fetchBien(id) {
  const res = await fetch(`${API}/${id}`, { headers: getAuthHeaders() })
  if (!res.ok) throw new Error('Error al cargar bien')
  return res.json()
}

export async function createBien(data) {
  const res = await fetch(API, {
    method: 'POST',
    headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(data),
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(json.error || json.message || 'Error al crear bien')
  return json
}

export async function updateBien(id, data) {
  const res = await fetch(`${API}/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(data),
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(json.error || json.message || 'Error al actualizar bien')
  return json
}

export async function deleteBien(id) {
  const res = await fetch(`${API}/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(json.error || json.message || 'Error al eliminar bien')
  return json
}
