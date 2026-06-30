/**
 * Servicio de API para las sesiones activas del usuario (gestión de dispositivos).
 */

import { API_BASE_URL } from '../config.js'

const API = `${API_BASE_URL}/api/user/sesiones`

function getAuthHeaders() {
  const token = localStorage.getItem('auth_token')
  return {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  }
}

/** Lista las sesiones activas del usuario en sesión. */
export async function fetchSesiones() {
  const res = await fetch(API, { cache: 'no-store', headers: getAuthHeaders() })
  if (!res.ok) throw new Error('Error al cargar las sesiones')
  return res.json()
}

/** Cierra una sesión propia por id. */
export async function cerrarSesion(id) {
  const res = await fetch(`${API}/${id}`, { method: 'DELETE', headers: getAuthHeaders() })
  if (!res.ok) throw new Error('No se pudo cerrar la sesión')
  return res.json()
}

/** Cierra todas las sesiones propias excepto la actual. */
export async function cerrarOtrasSesiones() {
  const res = await fetch(`${API}/cerrar-otras`, { method: 'POST', headers: getAuthHeaders() })
  if (!res.ok) throw new Error('No se pudieron cerrar las otras sesiones')
  return res.json()
}
