/**
 * Servicio de API para el módulo de Pólizas.
 *
 * Rutas disponibles:
 *   PUT /api/polizas/{id}  → ajusta campos de una póliza (status, fechas, pago, montos)
 *
 * Para listar pólizas de un cliente usar fetchPolizasCliente() en clientes.js.
 */

import { API_BASE_URL } from '../config.js'

const API = `${API_BASE_URL}/api/polizas`

function getAuthHeaders(extra = {}) {
  const token = localStorage.getItem('auth_token')
  return { Accept: 'application/json', Authorization: `Bearer ${token}`, ...extra }
}

/**
 * Actualiza campos ajustables de una póliza existente.
 *
 * @param {number} id    ID de la póliza
 * @param {Object} data  Campos a modificar: status, fecha_vencimiento, pago, total, total_bs, etc.
 */
export async function renovarPoliza(id, data) {
  const res = await fetch(`${API}/${id}/renovar`, {
    method: 'POST',
    headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(data),
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(json.error || json.message || 'Error al renovar póliza')
  return json
}

export async function updatePoliza(id, data) {
  const res = await fetch(`${API}/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(data),
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(json.error || json.message || 'Error al actualizar póliza')
  return json
}
