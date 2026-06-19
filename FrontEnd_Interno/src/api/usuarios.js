/**
 * Servicio de API para el módulo de Usuarios.
 */

import { API_BASE_URL } from '../config.js'

const API = `${API_BASE_URL}/api/usuarios`

function getAuthHeaders() {
  const token = localStorage.getItem('auth_token')
  return {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  }
}

export async function fetchUsuarios() {
  const res = await fetch(API, { 
    cache: 'no-store', 
    headers: getAuthHeaders() 
  })
  if (!res.ok) throw new Error('Error al cargar usuarios')
  return res.json()
}

export async function storeUsuario(data) {
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
    throw new Error(json.message || 'Error al registrar usuario')
  }
  return json
}

export async function updateUsuario(id, data) {
  const res = await fetch(`${API}/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) {
    if (json.errors) {
      const firstError = Object.values(json.errors)[0][0];
      throw new Error(firstError);
    }
    throw new Error(json.message || 'Error al actualizar usuario')
  }
  return json
}

export async function deleteUsuario(id) {
  const res = await fetch(`${API}/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(json.message || 'Error al eliminar usuario')
  return json
}

export async function toggleUserStatus(id, data = {}) {
  const res = await fetch(`${API}/${id}/toggle-status`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(json.message || 'Error al cambiar estado del usuario')
  return json
}

export async function changePassword(data) {
  const res = await fetch(`${API_BASE_URL}/api/user/change-password`, {
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
    throw new Error(json.message || 'Error al cambiar la contraseña')
  }
  return json
}

/** Verifica que la contraseña ingresada coincide con la del usuario en sesión.
 *  Lanza error con el motivo real (contraseña incorrecta, sesión expirada,
 *  demasiados intentos, sin conexión) en vez de uno genérico siempre igual. */
export async function verifyPassword(password) {
  let res
  try {
    res = await fetch(`${API_BASE_URL}/api/user/verify-password`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ password }),
    })
  } catch {
    throw new Error('No se pudo conectar con el servidor. Verifica tu conexión.')
  }
  if (!res.ok) {
    if (res.status === 429) throw new Error('Demasiados intentos. Espera un momento e intenta de nuevo.')
    const json = await res.json().catch(() => ({}))
    throw new Error(json.error || json.message || 'Contraseña incorrecta')
  }
  return true
}