import { API_BASE_URL } from '../config.js'

function authHeaders(extra = {}) {
  const token = localStorage.getItem('auth_token')
  return { Accept: 'application/json', Authorization: `Bearer ${token}`, ...extra }
}

/** Obtiene las tarifas de un producto. Con historial=true incluye las archivadas. */
export async function fetchTarifario(productoId, historial = false) {
  const qs = historial ? '?historial=1' : ''
  const res = await fetch(`${API_BASE_URL}/api/productos/${productoId}/tarifario${qs}`, {
    headers: authHeaders(),
  })
  if (!res.ok) throw new Error('Error al cargar tarifario')
  return res.json()
}

/** Crea una tarifa para el producto. */
export async function createTarifa(productoId, data) {
  const res = await fetch(`${API_BASE_URL}/api/productos/${productoId}/tarifario`, {
    method: 'POST',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(data),
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(json.message || 'Error al crear tarifa')
  return json
}

/** Actualiza una tarifa existente. */
export async function updateTarifa(id, data) {
  const res = await fetch(`${API_BASE_URL}/api/tarifario/${id}`, {
    method: 'PUT',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(data),
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(json.message || 'Error al actualizar tarifa')
  return json
}

/** Elimina una tarifa. */
export async function deleteTarifa(id) {
  const res = await fetch(`${API_BASE_URL}/api/tarifario/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(json.error || json.message || 'Error al eliminar tarifa')
  return json
}
