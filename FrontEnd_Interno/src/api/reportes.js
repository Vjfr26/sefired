import { API_BASE_URL } from '../config.js'

function getAuthHeaders() {
  const token = localStorage.getItem('auth_token')
  return { Accept: 'application/json', Authorization: `Bearer ${token}` }
}

export async function fetchStats() {
  const res = await fetch(`${API_BASE_URL}/api/reports/stats`, { headers: getAuthHeaders() })
  if (!res.ok) throw new Error('Error al cargar estadísticas')
  return res.json()
}

export async function fetchLogs(params = {}) {
  const qs = new URLSearchParams(Object.fromEntries(Object.entries(params).filter(([, v]) => v != null && v !== '')))
  const res = await fetch(`${API_BASE_URL}/api/reports/logs?${qs}`, { headers: getAuthHeaders() })
  if (!res.ok) throw new Error('Error al cargar logs')
  return res.json()
}

export async function fetchExternalReportPolicies(params = {}) {
  const qs = new URLSearchParams(Object.fromEntries(Object.entries(params).filter(([, v]) => v != null && v !== '')))
  const res = await fetch(`${API_BASE_URL}/api/reportes/externos/politicas?${qs}`, { headers: getAuthHeaders() })
  if (!res.ok) throw new Error('Error al cargar pólizas')
  return res.json()
}

export async function exportExternalReport(params = {}) {
  const token = localStorage.getItem('auth_token')
  const res = await fetch(`${API_BASE_URL}/api/reportes/externos/exportar`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': '*/*',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(params)
  })
  if (!res.ok) throw new Error('Error al exportar reporte')
  return res.blob()
}

export async function fetchExternalReportSchedules() {
  const res = await fetch(`${API_BASE_URL}/api/reportes/externos/programaciones`, { headers: getAuthHeaders() })
  if (!res.ok) throw new Error('Error al cargar programaciones')
  return res.json()
}

export async function saveExternalReportSchedules(schedules) {
  const token = localStorage.getItem('auth_token')
  const res = await fetch(`${API_BASE_URL}/api/reportes/externos/programaciones`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ schedules })
  })
  if (!res.ok) throw new Error('Error al guardar programaciones')
  return res.json()
}

export async function fetchExternalReportHistory() {
  const res = await fetch(`${API_BASE_URL}/api/reportes/externos/historial`, { headers: getAuthHeaders() })
  if (!res.ok) throw new Error('Error al cargar historial')
  return res.json()
}

export async function runExternalReportSchedule(scheduleId) {
  const token = localStorage.getItem('auth_token')
  const res = await fetch(`${API_BASE_URL}/api/reportes/externos/historial/ejecutar`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ schedule_id: scheduleId })
  })
  if (!res.ok) throw new Error('Error al ejecutar programación')
  return res.json()
}

export async function downloadExternalReportFile(id) {
  const token = localStorage.getItem('auth_token')
  const res = await fetch(`${API_BASE_URL}/api/reportes/externos/descargar/${id}`, {
    headers: {
      'Accept': '*/*',
      'Authorization': `Bearer ${token}`
    }
  })
  if (!res.ok) throw new Error('Error al descargar el archivo')
  return res.blob()
}

export async function fetchVentasComisiones(params = {}) {
  const qs = new URLSearchParams(Object.fromEntries(Object.entries(params).filter(([, v]) => v != null && v !== '')))
  const res = await fetch(`${API_BASE_URL}/api/reports/ventas-comisiones?${qs}`, { headers: getAuthHeaders() })
  if (!res.ok) throw new Error('Error al cargar ventas y comisiones')
  return res.json()
}

export async function fetchOficinas(params = {}) {
  const qs = new URLSearchParams(Object.fromEntries(Object.entries(params).filter(([, v]) => v != null && v !== '')))
  const res = await fetch(`${API_BASE_URL}/api/reports/oficinas?${qs}`, { headers: getAuthHeaders() })
  if (!res.ok) throw new Error('Error al cargar reporte de oficinas')
  return res.json()
}

export async function fetchOficinaUsuarios(sede) {
  const qs = new URLSearchParams({ sede: sede ?? '' })
  const res = await fetch(`${API_BASE_URL}/api/reports/oficinas/usuarios?${qs}`, { headers: getAuthHeaders() })
  if (!res.ok) throw new Error('Error al cargar los usuarios de la oficina')
  return res.json()
}

export async function fetchOficinasPagos(params = {}) {
  const qs = new URLSearchParams(Object.fromEntries(Object.entries(params).filter(([, v]) => v != null && v !== '')))
  const res = await fetch(`${API_BASE_URL}/api/reports/oficinas/pagos?${qs}`, { headers: getAuthHeaders() })
  if (!res.ok) throw new Error('Error al cargar reporte de pólizas cobradas')
  return res.json()
}

/**
 * Marca (o desmarca) el retiro de efectivo de una oficina/forma de pago
 * para un período dado, con notas y documento de entrega opcionales.
 */
export async function marcarRetiroEfectivo({ sede, forma_pago, fecha_inicio, fecha_fin, retirado, notas, documento }) {
  const token = localStorage.getItem('auth_token')
  const form = new FormData()
  form.append('sede', sede)
  form.append('forma_pago', forma_pago)
  form.append('fecha_inicio', fecha_inicio)
  form.append('fecha_fin', fecha_fin)
  form.append('retirado', retirado ? '1' : '0')
  if (notas != null) form.append('notas', notas)
  if (documento) form.append('documento', documento)

  const res = await fetch(`${API_BASE_URL}/api/reports/oficinas/retiro-efectivo`, {
    method: 'POST',
    headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
    body: form,
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(json.message || 'Error al marcar el retiro de efectivo')
  return json
}

export async function exportVentas(params = {}) {
  const token = localStorage.getItem('auth_token')
  const res = await fetch(`${API_BASE_URL}/api/reports/ventas-comisiones/exportar`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': '*/*', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify(params)
  })
  if (!res.ok) throw new Error('Error al exportar ventas')
  return res.blob()
}

export async function exportOficinas(params = {}) {
  const token = localStorage.getItem('auth_token')
  const res = await fetch(`${API_BASE_URL}/api/reports/oficinas/exportar`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': '*/*', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify(params)
  })
  if (!res.ok) throw new Error('Error al exportar oficinas')
  return res.blob()
}

export async function exportOficinasPagos(params = {}) {
  const token = localStorage.getItem('auth_token')
  const res = await fetch(`${API_BASE_URL}/api/reports/oficinas/pagos/exportar`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': '*/*', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify(params)
  })
  if (!res.ok) throw new Error('Error al exportar pólizas cobradas')
  return res.blob()
}

export async function fetchUsuariosReport(params = {}) {
  const qs = new URLSearchParams(Object.fromEntries(Object.entries(params).filter(([, v]) => v != null && v !== '')))
  const res = await fetch(`${API_BASE_URL}/api/reports/usuarios?${qs}`, { headers: getAuthHeaders() })
  if (!res.ok) throw new Error('Error al cargar reporte de usuarios')
  return res.json()
}

export async function exportUsuariosReport(params = {}) {
  const token = localStorage.getItem('auth_token')
  const res = await fetch(`${API_BASE_URL}/api/reports/usuarios/exportar`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': '*/*', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify(params)
  })
  if (!res.ok) throw new Error('Error al exportar métricas de personal')
  return res.blob()
}

/**
 * Marca una comisión como pagada o la revierte a pendiente.
 * Al marcar pagada se puede adjuntar una observación (nota del pago); al
 * revertir se ignora (el backend la limpia).
 */
export async function marcarComision(id, status, observacion = null) {
  const token = localStorage.getItem('auth_token')
  const res = await fetch(`${API_BASE_URL}/api/reports/comisiones/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ status, observacion })
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(json.message || 'Error al actualizar la comisión')
  return json
}

/**
 * Pago por lotes — marca como pagadas varias comisiones de una vez. El
 * llamador debe haber verificado la contraseña del usuario ANTES de llamar
 * esto (ver verifyPassword en api/usuarios.js), igual que el resto de las
 * acciones sensibles de la app.
 */
export async function pagarLoteComisiones(comisionIds, observacion = null) {
  const token = localStorage.getItem('auth_token')
  const res = await fetch(`${API_BASE_URL}/api/reports/comisiones/pagar-lote`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ comision_ids: comisionIds, observacion })
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(json.message || 'Error al pagar las comisiones por lote')
  return json
}

export async function fetchClientesReport(params = {}) {
  const qs = new URLSearchParams(Object.fromEntries(Object.entries(params).filter(([, v]) => v != null && v !== '')))
  const res = await fetch(`${API_BASE_URL}/api/reports/clientes?${qs}`, { headers: getAuthHeaders() })
  if (!res.ok) throw new Error('Error al cargar reporte de clientes')
  return res.json()
}

export async function exportClientesReport(params = {}) {
  const token = localStorage.getItem('auth_token')
  const res = await fetch(`${API_BASE_URL}/api/reports/clientes/exportar`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': '*/*', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify(params)
  })
  if (!res.ok) throw new Error('Error al exportar métricas de clientes')
  return res.blob()
}

export async function fetchVehiculosReport(params = {}) {
  const qs = new URLSearchParams(Object.fromEntries(Object.entries(params).filter(([, v]) => v != null && v !== '')))
  const res = await fetch(`${API_BASE_URL}/api/reports/vehiculos?${qs}`, { headers: getAuthHeaders() })
  if (!res.ok) throw new Error('Error al cargar reporte de vehículos')
  return res.json()
}

/**
 * Sube un archivo suelto para adjuntarlo a una programación de reportes
 * (interna o externa). Devuelve {nombre, path, mime} para guardarlo en
 * documentos_adicionales al hacer "Guardar Configuración".
 */
export async function uploadReporteAdjunto(file) {
  const token = localStorage.getItem('auth_token')
  const form = new FormData()
  form.append('archivo', file)

  const res = await fetch(`${API_BASE_URL}/api/reportes/adjuntos`, {
    method: 'POST',
    headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
    body: form,
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(json.message || 'Error al subir el adjunto')
  return json
}
