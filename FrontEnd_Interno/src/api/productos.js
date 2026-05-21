/**
 * Servicio de API para el módulo de Productos (coberturas).
 *
 * Todas las peticiones van a /api/productos (sin CSRF, definidas en Backend/routes/api.php).
 * En desarrollo, Vite hace proxy de /api → http://localhost:8000 (ver vite.config.js).
 *
 * Un "producto" en Sefired es una cobertura de seguro que se puede contratar
 * (ej. Casco Pérdida Total, Responsabilidad Civil Voluntaria).
 *
 * Formato de respuesta del backend (GET /api/productos — array de objetos):
 *   { id, nombre, descripcion, prima, cobertura, moneda }
 *   prima    → costo anual de la cobertura
 *   cobertura → suma máxima asegurada
 *   moneda   → 'USD' o 'BS'
 */

const API = '/api/productos'

/** Obtiene todos los productos ordenados alfabéticamente por nombre. */
export async function fetchProductos() {
  const res = await fetch(API, { cache: 'no-store', headers: { Accept: 'application/json' } })
  if (!res.ok) throw new Error('Error al cargar productos')
  return res.json()
}

/**
 * Crea un nuevo producto en el catálogo de coberturas.
 * @param {{ nombre, descripcion, prima, cobertura, moneda }} data
 */
export async function createProducto(data) {
  const res = await fetch(API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(data),
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(json.error || json.message || 'Error al crear producto')
  return json
}

/**
 * Actualiza los datos de un producto existente.
 * Solo se envían los campos que cambiaron.
 *
 * @param {number} id    ID del producto
 * @param {Object} data  Campos a actualizar
 */
export async function updateProducto(id, data) {
  const res = await fetch(`${API}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(data),
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(json.error || json.message || 'Error al actualizar producto')
  return json
}

/**
 * Elimina un producto del catálogo.
 * El backend rechaza la eliminación (error 409) si el producto tiene pólizas asociadas,
 * para no perder el historial de contratos que ya lo usaron.
 *
 * @param {number} id  ID del producto a eliminar
 */
export async function deleteProducto(id) {
  const res = await fetch(`${API}/${id}`, {
    method: 'DELETE',
    headers: { Accept: 'application/json' },
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(json.error || json.message || 'Error al eliminar producto')
  return json
}
