/**
 * Servicio de API para el módulo de Cotizaciones (Simulador).
 *
 * Rutas:
 *   GET    /api/cotizaciones        → listado de todas las cotizaciones
 *   POST   /api/cotizaciones        → guardar nueva cotización
 *   PUT    /api/cotizaciones/{id}   → actualizar status
 *   DELETE /api/cotizaciones/{id}   → eliminar
 */

import { API_BASE_URL } from '../config.js'

const API = `${API_BASE_URL}/api/cotizaciones`

function getAuthHeaders(extra = {}) {
  const token = localStorage.getItem('auth_token')
  return { Accept: 'application/json', Authorization: `Bearer ${token}`, ...extra }
}

export async function fetchCotizaciones() {
  const res = await fetch(API, { headers: getAuthHeaders() })
  if (!res.ok) throw new Error('Error al cargar cotizaciones')
  return res.json()
}

export async function createCotizacion(data) {
  const res = await fetch(API, {
    method: 'POST',
    headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(data),
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(json.message || json.error || 'Error al guardar cotización')
  return json
}

export async function updateCotizacion(id, data) {
  const res = await fetch(`${API}/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(data),
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(json.message || 'Error al actualizar cotización')
  return json
}

export async function emitirCotizacion(id, data) {
  const res = await fetch(`${API}/${id}/emitir`, {
    method: 'POST',
    headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(data),
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(json.error || json.message || 'Error al emitir cotización')
  return json
}

// NUEVO FLUJO: el vendedor registra el pago; la cotización pasa a evaluación.
export async function registrarPagoCotizacion(id, data) {
  const res = await fetch(`${API}/${id}/registrar-pago`, {
    method: 'POST',
    headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(data),
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(json.error || json.message || 'Error al registrar el pago')
  return json
}

export async function deleteCotizacion(id) {
  const res = await fetch(`${API}/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(json.error || json.message || 'Error al eliminar cotización')
  return json
}
