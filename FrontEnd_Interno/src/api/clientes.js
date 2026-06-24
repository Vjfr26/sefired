/**
 * Servicio de API para el módulo de Clientes.
 *
 * Formato de respuesta del backend (GET /api/clientes):
 *   { id, nom, ci, tel, email, est, pol, vig, prima }
 */

import { API_BASE_URL } from '../config.js'

const API = `${API_BASE_URL}/api/clientes`

function getAuthHeaders(extra = {}) {
  const token = localStorage.getItem('auth_token')
  return { Accept: 'application/json', Authorization: `Bearer ${token}`, ...extra }
}

/**
 * Obtiene la lista completa de clientes con el resumen de su última póliza.
 * El backend resuelve las relaciones cliente→persona y cliente→solicitudes→polizas.
 */
export async function fetchClientes() {
  const res = await fetch(API, { headers: getAuthHeaders() })
  if (!res.ok) throw new Error('Error al cargar clientes')
  return res.json()
}

/**
 * Búsqueda rápida de clientes EXISTENTES en toda la empresa (no solo los
 * propios) — para el wizard de cotización, donde lo que importa es saber
 * si la persona ya es cliente de cualquier asesor, no gestionar su perfil.
 */
export async function buscarClientes(q) {
  const res = await fetch(`${API}/buscar?q=${encodeURIComponent(q)}`, { headers: getAuthHeaders() })
  if (!res.ok) throw new Error('Error al buscar clientes')
  return res.json()
}

/**
 * Crea una nueva persona y la registra como cliente.
 * El backend crea ambos registros en una sola operación.
 * Devuelve el nuevo cliente en el mismo formato que fetchClientes().
 *
 * @param {{ nombre, cedula, telefono?, correo? }} data
 */
export async function createCliente(data) {
  const res = await fetch(API, {
    method: 'POST',
    headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(data),
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(json.message || 'Error al crear cliente')
  return json
}

/**
 * Actualiza los datos personales de un cliente (nombre, cédula, teléfono, correo).
 * Solo modifica los campos enviados; los omitidos no se tocan.
 *
 * @param {number} id  ID numérico del cliente (no el CLI-XXXX formateado)
 * @param {{ nombre?, cedula?, telefono?, correo? }} data
 */
export async function updateCliente(id, data) {
  const res = await fetch(`${API}/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(data),
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(json.message || 'Error al actualizar cliente')
  return json
}

/**
 * Obtiene todas las facturas de un cliente, ordenadas de más reciente a más antigua.
 * La cadena en backend es: cliente → solicitudes → polizas → facturas.
 *
 * @param {number} id  ID numérico del cliente
 */
export async function fetchFacturasCliente(id) {
  const res = await fetch(`${API}/${id}/facturas`, { cache: 'no-store', headers: getAuthHeaders() })
  if (!res.ok) throw new Error('Error al cargar facturas del cliente')
  return res.json()
}

/**
 * Obtiene todas las cotizaciones de un cliente (todos los estados: En Revisión, Aprobado, Emitida, Rechazado).
 *
 * @param {number} id  ID numérico del cliente
 */
export async function fetchSolicitudesCliente(id) {
  const res = await fetch(`${API}/${id}/solicitudes`, { cache: 'no-store', headers: getAuthHeaders() })
  if (!res.ok) throw new Error('Error al cargar cotizaciones del cliente')
  return res.json()
}

/**
 * Obtiene el historial completo de pólizas de un cliente.
 * La cadena en backend es: cliente → solicitudes → polizas → producto.
 *
 * @param {number} id  ID numérico del cliente
 * @returns {Promise<Array>}  Array de pólizas ordenadas de más reciente a más antigua
 */
export async function fetchPolizasCliente(id) {
  const res = await fetch(`${API}/${id}/polizas`, { cache: 'no-store', headers: getAuthHeaders() })
  if (!res.ok) throw new Error('Error al cargar pólizas del cliente')
  return res.json()
}

/**
 * Activa o desactiva un cliente (toggle del campo activo).
 * Devuelve { message, activo } con el nuevo estado booleano.
 *
 * @param {number} id  ID numérico del cliente
 */
export async function toggleCliente(id, motivo = null) {
  const res = await fetch(`${API}/${id}/toggle`, {
    method: 'PATCH',
    headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ motivo }),
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(json.message || 'Error al cambiar estado del cliente')
  return json
}

/**
 * Elimina un cliente y su persona asociada.
 * El backend rechaza la eliminación (409) si el cliente tiene solicitudes o pólizas.
 *
 * @param {number} id  ID numérico del cliente
 */
export async function deleteCliente(id) {
  const res = await fetch(`${API}/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(json.error || json.message || 'Error al eliminar cliente')
  return json
}
