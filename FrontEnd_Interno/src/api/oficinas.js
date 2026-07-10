/**
 * Servicio de API para el catálogo de oficinas/sedes.
 */

import { API_BASE_URL } from '../config.js'

const API = `${API_BASE_URL}/api/oficinas`

function getAuthHeaders() {
  const token = localStorage.getItem('auth_token')
  return {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  }
}

export async function fetchOficinas() {
  const res = await fetch(API, {
    cache: 'no-store',
    headers: getAuthHeaders(),
  })
  if (!res.ok) throw new Error('Error al cargar oficinas')
  return res.json()
}

export async function storeOficina(data) {
  const res = await fetch(API, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) {
    if (json.errors) {
      const firstError = Object.values(json.errors)[0][0];
      throw new Error(firstError);
    }
    throw new Error(json.message || 'Error al crear la oficina')
  }
  return json.data
}
