/**
 * Servicio de API para el módulo de Tasas del Día (BCV).
 *
 * Respuesta de GET /api/tasas:
 *   {
 *     usd: { id, valor, fecha, hora, variacion } | null,
 *     eur: { id, valor, fecha, hora, variacion } | null,
 *     historial: [{ id, fecha, moneda, valor, variacion, var_color }]
 *   }
 */

const API = '/api/tasas'

/** Obtiene las tasas actuales (USD y EUR) y el historial de los últimos 60 días. */
export async function fetchTasas() {
  const res = await fetch(API, { cache: 'no-store', headers: { Accept: 'application/json' } })
  if (!res.ok) throw new Error('Error al cargar tasas')
  return res.json()
}

/**
 * Registra las tasas USD y EUR de un día.
 * El backend crea dos registros en una sola operación.
 *
 * @param {{ fecha: string, usd: number, eur: number }} data
 */
export async function storeTasas(data) {
  const res = await fetch(API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(data),
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(json.error || json.message || 'Error al registrar tasas')
  return json
}

/**
 * Corrige el valor de una tasa ya registrada.
 *
 * @param {number} id     ID del registro en indicador_economico
 * @param {number} valor  Nuevo valor de la tasa
 */
export async function updateTasa(id, valor) {
  const res = await fetch(`${API}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ valor }),
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(json.message || 'Error al actualizar tasa')
  return json
}

/**
 * Elimina un registro del historial de tasas.
 *
 * @param {number} id  ID del registro a eliminar
 */
export async function deleteTasa(id) {
  const res = await fetch(`${API}/${id}`, {
    method: 'DELETE',
    headers: { Accept: 'application/json' },
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(json.message || 'Error al eliminar tasa')
  return json
}
