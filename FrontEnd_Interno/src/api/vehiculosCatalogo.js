/**
 * Servicio de API para el Catálogo de Vehículos (marcas y modelos).
 */

import { API_BASE_URL } from '../config.js'

const API = `${API_BASE_URL}/api/vehiculos-catalogo`

function getAuthHeaders(extra = {}) {
  const token = localStorage.getItem('auth_token')
  return { Accept: 'application/json', Authorization: `Bearer ${token}`, ...extra }
}

/** Obtiene todos los vehículos del catálogo. */
export async function fetchVehiculosCatalogo() {
  const res = await fetch(API, { cache: 'no-store', headers: getAuthHeaders() })
  if (!res.ok) throw new Error('Error al cargar catálogo de vehículos')
  return res.json()
}

/** Crea un nuevo modelo en el catálogo. */
export async function createVehiculoCatalogo(data) {
  const res = await fetch(API, {
    method: 'POST',
    headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(data),
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(json.error || json.message || 'Error al agregar modelo al catálogo')
  return json
}

/** Actualiza un modelo del catálogo. */
export async function updateVehiculoCatalogo(id, data) {
  const res = await fetch(`${API}/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(data),
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(json.error || json.message || 'Error al actualizar modelo del catálogo')
  return json
}

/** Elimina un modelo del catálogo. */
export async function deleteVehiculoCatalogo(id) {
  const res = await fetch(`${API}/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(json.error || json.message || 'Error al eliminar modelo del catálogo')
  return json
}
