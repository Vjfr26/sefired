/** Solicitudes de contacto capturadas por el chatbot del portal público. */

import { API_BASE_URL } from '../config.js'

const API = `${API_BASE_URL}/api/solicitudes-contacto`

function getAuthHeaders() {
  const token = localStorage.getItem('auth_token')
  return { Accept: 'application/json', 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
}

export async function fetchSolicitudesContacto(params = {}) {
  const qs = new URLSearchParams(Object.fromEntries(Object.entries(params).filter(([, v]) => v != null && v !== '')))
  const url = qs.toString() ? `${API}?${qs}` : API
  const res = await fetch(url, { cache: 'no-store', headers: getAuthHeaders() })
  if (!res.ok) throw new Error('Error al cargar las solicitudes de contacto')
  return res.json()
}

export async function actualizarSolicitudContacto(id, status) {
  const res = await fetch(`${API}/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify({ status }),
  })
  if (!res.ok) throw new Error('Error al actualizar la solicitud')
  return res.json()
}
