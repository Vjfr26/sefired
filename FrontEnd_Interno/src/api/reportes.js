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

export async function fetchPersonal(params = {}) {
  const qs = new URLSearchParams(Object.fromEntries(Object.entries(params).filter(([, v]) => v != null && v !== '')))
  const res = await fetch(`${API_BASE_URL}/api/reports/personal?${qs}`, { headers: getAuthHeaders() })
  if (!res.ok) throw new Error('Error al cargar reporte de personal')
  return res.json()
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

export async function exportPersonal(params = {}) {
  const token = localStorage.getItem('auth_token')
  const res = await fetch(`${API_BASE_URL}/api/reports/personal/exportar`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': '*/*', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify(params)
  })
  if (!res.ok) throw new Error('Error al exportar personal')
  return res.blob()
}

export async function fetchUsuariosReport(params = {}) {
  const qs = new URLSearchParams(Object.fromEntries(Object.entries(params).filter(([, v]) => v != null && v !== '')))
  const res = await fetch(`${API_BASE_URL}/api/reports/usuarios?${qs}`, { headers: getAuthHeaders() })
  if (!res.ok) throw new Error('Error al cargar reporte de usuarios')
  return res.json()
}

export async function fetchClientesReport(params = {}) {
  const qs = new URLSearchParams(Object.fromEntries(Object.entries(params).filter(([, v]) => v != null && v !== '')))
  const res = await fetch(`${API_BASE_URL}/api/reports/clientes?${qs}`, { headers: getAuthHeaders() })
  if (!res.ok) throw new Error('Error al cargar reporte de clientes')
  return res.json()
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
