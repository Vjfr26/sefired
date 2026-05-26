/**
 * Servicio de API para el módulo de Productos (coberturas).
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

import { API_BASE_URL } from '../config.js'

const API = `${API_BASE_URL}/api/productos`

function getAuthHeaders(extra = {}) {
  const token = localStorage.getItem('auth_token')
  return { Accept: 'application/json', Authorization: `Bearer ${token}`, ...extra }
}

/** Obtiene todos los productos ordenados alfabéticamente por nombre. */
export async function fetchProductos() {
  const res = await fetch(API, { cache: 'no-store', headers: getAuthHeaders() })
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
    headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
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
    headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
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
    headers: getAuthHeaders(),
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(json.error || json.message || 'Error al eliminar producto')
  return json
}

/**
 * Agrega un documento PDF al array de documentos del producto.
 * @param {number} id     ID del producto
 * @param {File}   file   Archivo PDF (máx. 10 MB)
 * @param {string} nombre Nombre del documento (IPID, FIPC, Nota Informativa, etc.)
 */
export async function uploadDocumentoProducto(id, file, nombre) {
  const token = localStorage.getItem('auth_token')
  const formData = new FormData()
  formData.append('documento', file)
  formData.append('nombre', nombre)
  const res = await fetch(`${API}/${id}/documento`, {
    method: 'POST',
    headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
    body: formData,
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(json.message || json.error || 'Error al subir documento')
  return json
}

/**
 * Elimina un documento específico del producto por su path en el servidor.
 * @param {number} id    ID del producto
 * @param {string} path  Ruta del archivo a eliminar (campo `path` del documento)
 */
export async function deleteDocumentoProducto(id, path) {
  const token = localStorage.getItem('auth_token')
  const res = await fetch(`${API}/${id}/documento`, {
    method: 'DELETE',
    headers: { Accept: 'application/json', Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ path }),
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(json.message || json.error || 'Error al eliminar documento')
  return json
}

/**
 * Importa la tabla de tasas de un producto desde un CSV con cabecera.
 * @param {number} id    ID del producto
 * @param {File}   file  Archivo CSV (separador coma o tabulador, primera fila = cabecera)
 */
export async function uploadTasasProducto(id, file) {
  const token = localStorage.getItem('auth_token')
  const formData = new FormData()
  formData.append('tasas', file)
  const res = await fetch(`${API}/${id}/tasas`, {
    method: 'POST',
    headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
    body: formData,
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(json.message || json.error || 'Error al cargar tasas')
  return json
}

/**
 * Elimina la tabla de tasas de un producto.
 * @param {number} id  ID del producto
 */
export async function deleteTasasProducto(id) {
  const token = localStorage.getItem('auth_token')
  const res = await fetch(`${API}/${id}/tasas`, {
    method: 'DELETE',
    headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(json.message || json.error || 'Error al eliminar tasas')
  return json
}
