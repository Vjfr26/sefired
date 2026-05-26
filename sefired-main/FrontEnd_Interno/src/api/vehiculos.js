/**
 * Servicio de API para el módulo de Vehículos.
 *
 * Formato de respuesta del backend (GET /api/vehiculos — array de objetos):
 *   {
 *     id, cliente_id, propietario, cedula,
 *     placa, marca, modelo, clase, tipo, anio, uso, color,
 *     peso, puestos, aparcamiento,
 *     serial_carroceria, serial_motor,
 *     fecha_adquisicion, certificado_transito, certificado_origen, titulo,
 *     estado  ← 'Activo' si tiene póliza vigente, 'Inactivo' si no
 *   }
 */

import { API_BASE_URL } from '../config.js'

const API = `${API_BASE_URL}/api/vehiculos`

function getAuthHeaders(extra = {}) {
  const token = localStorage.getItem('auth_token')
  return { Accept: 'application/json', Authorization: `Bearer ${token}`, ...extra }
}

/** Obtiene todos los vehículos registrados con su propietario y estado. */
export async function fetchVehiculos() {
  const res = await fetch(API, { cache: 'no-store', headers: getAuthHeaders() })
  if (!res.ok) throw new Error('Error al cargar vehículos')
  return res.json()
}

/**
 * Registra un nuevo vehículo asociado a un cliente existente.
 * El backend valida que la placa sea única y que el cliente_id exista.
 *
 * @param {Object} data  Datos del formulario (todos los campos del vehículo)
 */
export async function createVehiculo(data) {
  const res = await fetch(API, {
    method: 'POST',
    headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(data),
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(json.error || json.message || 'Error al registrar vehículo')
  return json
}

/**
 * Actualiza los datos de un vehículo existente.
 * Solo se modifican los campos que se envían (el resto no se toca).
 *
 * @param {number} id    ID numérico del vehículo
 * @param {Object} data  Campos a actualizar
 */
export async function updateVehiculo(id, data) {
  const res = await fetch(`${API}/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(data),
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(json.error || json.message || 'Error al actualizar vehículo')
  return json
}

/**
 * Elimina un vehículo del sistema.
 * El backend rechaza la eliminación (error 409) si el vehículo tiene conductores registrados.
 *
 * @param {number} id  ID numérico del vehículo
 */
export async function deleteVehiculo(id) {
  const res = await fetch(`${API}/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(json.error || json.message || 'Error al eliminar vehículo')
  return json
}
