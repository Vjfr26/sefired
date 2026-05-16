/**
 * Servicio de API para el módulo de Clientes.
 *
 * Todas las peticiones van a /api/clientes (rutas sin CSRF en api.php).
 * En desarrollo, Vite hace proxy de /api → http://localhost:8000.
 * En producción, el frontend y el backend deben servirse desde el mismo dominio
 * o configurar CORS en Laravel.
 *
 * Formato de respuesta del backend (GET /api/clientes):
 *   { id, nom, ci, tel, email, est, pol, vig, prima }
 */

const API = '/api/clientes'

/**
 * Obtiene la lista completa de clientes con el resumen de su última póliza.
 * El backend resuelve las relaciones cliente→persona y cliente→solicitudes→polizas.
 */
export async function fetchClientes() {
  const res = await fetch(API, { headers: { Accept: 'application/json' } })
  if (!res.ok) throw new Error('Error al cargar clientes')
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
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
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
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(data),
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(json.message || 'Error al actualizar cliente')
  return json
}

/**
 * Activa o desactiva un cliente (toggle del campo activo).
 * Devuelve { message, activo } con el nuevo estado booleano.
 *
 * @param {number} id  ID numérico del cliente
 */
export async function toggleCliente(id) {
  const res = await fetch(`${API}/${id}/toggle`, {
    method: 'PATCH',
    headers: { Accept: 'application/json' },
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
    headers: { Accept: 'application/json' },
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(json.error || json.message || 'Error al eliminar cliente')
  return json
}
