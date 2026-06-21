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

/**
 * Obtiene el blob PDF oficial de una póliza generado por el backend (diseño La Venezolana).
 * Devuelve el Blob para que el llamador decida si abrir en pestaña o forzar descarga.
 * @param {number} id  ID de la póliza
 */
export async function downloadPolizaPdf(id) {
  const res = await fetch(`${API}/${id}/pdf`, { headers: getAuthHeaders() })
  if (!res.ok) {
    const json = await res.json().catch(() => ({}))
    throw new Error(json.error || json.message || 'Error al generar el PDF')
  }
  return res.blob()
}

// ── Beneficiarios ────────────────────────────────────────────────────────────

export async function fetchBeneficiarios(polizaId) {
  const res = await fetch(`${API}/${polizaId}/beneficiarios`, { headers: getAuthHeaders() })
  if (!res.ok) throw new Error('Error al cargar beneficiarios')
  return res.json()
}

export async function createBeneficiario(polizaId, data) {
  const res = await fetch(`${API}/${polizaId}/beneficiarios`, {
    method: 'POST',
    headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(data),
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(json.error || json.message || 'Error al agregar beneficiario')
  return json
}

export async function updateBeneficiario(polizaId, benId, data) {
  const res = await fetch(`${API}/${polizaId}/beneficiarios/${benId}`, {
    method: 'PUT',
    headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(data),
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(json.error || json.message || 'Error al actualizar beneficiario')
  return json
}

export async function deleteBeneficiario(polizaId, benId) {
  const res = await fetch(`${API}/${polizaId}/beneficiarios/${benId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  })
  if (!res.ok) {
    const json = await res.json().catch(() => ({}))
    throw new Error(json.error || json.message || 'Error al eliminar beneficiario')
  }
}

// ── Bienes cubiertos (pólizas con varios bienes, ej. flota) ──────────────────

export async function fetchBienesPoliza(polizaId) {
  const res = await fetch(`${API}/${polizaId}/bienes`, { headers: getAuthHeaders() })
  if (!res.ok) throw new Error('Error al cargar los bienes de la póliza')
  return res.json()
}

export async function agregarBienPoliza(polizaId, data) {
  const res = await fetch(`${API}/${polizaId}/bienes`, {
    method: 'POST',
    headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(data),
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(json.error || json.message || 'Error al agregar el bien')
  return json
}

export async function quitarBienPoliza(polizaId, polizaBienId) {
  const res = await fetch(`${API}/${polizaId}/bienes/${polizaBienId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  })
  if (!res.ok) {
    const json = await res.json().catch(() => ({}))
    throw new Error(json.error || json.message || 'Error al quitar el bien')
  }
}
