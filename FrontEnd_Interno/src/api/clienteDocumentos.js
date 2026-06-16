import { API_BASE_URL } from '../config.js'

function authHeaders(extra = {}) {
  const token = localStorage.getItem('auth_token')
  return { Accept: 'application/json', Authorization: `Bearer ${token}`, ...extra }
}

/** Lista los documentos subidos para un cliente. */
export async function fetchDocumentosCliente(clienteId) {
  const res = await fetch(`${API_BASE_URL}/api/clientes/${clienteId}/documentos`, {
    headers: authHeaders(),
  })
  if (!res.ok) throw new Error('Error al cargar documentos del cliente')
  return res.json()
}

/**
 * Sube un documento al perfil del cliente.
 * @param {number} clienteId
 * @param {string} nombre  — Nombre descriptivo (ej: "Cédula de Identidad")
 * @param {File}   file    — Archivo a subir
 */
export async function uploadDocumentoCliente(clienteId, nombre, file) {
  const form = new FormData()
  form.append('nombre', nombre)
  form.append('documento', file)

  const res = await fetch(`${API_BASE_URL}/api/clientes/${clienteId}/documentos`, {
    method: 'POST',
    headers: authHeaders(),
    body: form,
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(json.message || 'Error al subir documento')
  return json
}

/** Elimina un documento del cliente. */
export async function deleteDocumentoCliente(clienteId, docId) {
  const res = await fetch(`${API_BASE_URL}/api/clientes/${clienteId}/documentos/${docId}`, {
    method: 'DELETE',
    headers: authHeaders(),
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(json.message || 'Error al eliminar documento')
  return json
}
