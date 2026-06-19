import { useState, useEffect } from 'react'

const fmtDT = (s) => {
  if (!s) return '—'
  const d = new Date(s)
  return d.toLocaleDateString('es-VE', { day: '2-digit', month: '2-digit', year: 'numeric' }) +
    ' ' + d.toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit', hour12: false })
}
import { TrendingUp, Building2, Users, RefreshCw, Search, Download, Check, Calendar, Loader2, Play, CheckCircle2, Car, Filter, ChevronDown, ChevronUp, AlertTriangle, X, Clock, Bookmark, Trash2 } from 'lucide-react'
import {
  fetchExternalReportPolicies,
  exportExternalReport,
  fetchExternalReportSchedules,
  saveExternalReportSchedules,
  fetchExternalReportHistory,
  runExternalReportSchedule,
  downloadExternalReportFile,
  fetchVentasComisiones,
  fetchOficinas,
  fetchPersonal,
  exportVentas,
  exportOficinas,
  exportPersonal,
  fetchUsuariosReport,
  fetchClientesReport,
  fetchVehiculosReport,
  fetchInternalReportSchedules,
  saveInternalReportSchedules,
  fetchInternalReportHistory,
  runInternalReportSchedule,
  downloadInternalReportFile
} from '../api/reportes.js'
import { useApp } from '../context/AppContext.jsx'
import { usd, bs, badge, rsbadge, sbadge } from '../utils/helpers.jsx'
import DataTable from '../components/DataTable.jsx'

// ── Shared report filter bar ─────────────────────────────────
function ReportBar({ children, onExport }) {
  const { showToast, canAct } = useApp()
  const canExport = canAct('reportes', 'export')
  return (
    <div className="card p-3.5 mb-4 flex flex-wrap items-center gap-3">
      <div className="relative flex-1 min-w-44">
        <input type="text" placeholder="Buscar…" className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition" />
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
      </div>
      {children}
      {canExport && (
        <button onClick={() => showToast('Exportando reporte…', 'info')} className="btn-secondary ml-auto shrink-0">
          <Download className="w-4 h-4" />Exportar
        </button>
      )}
    </div>
  )
}

// Helper to get start of current month and today's date dynamically
const getInitialDates = () => {
  const today = new Date()
  const y = today.getFullYear()
  const m = String(today.getMonth() + 1).padStart(2, '0')
  const d = String(today.getDate()).padStart(2, '0')
  return {
    start: `${y}-${m}-01`,
    today: `${y}-${m}-${d}`
  }
}

// Helper to format date range in dd/mm/yyyy format
const formatDateRange = (startStr, endStr) => {
  const fmt = str => str ? str.split('-').reverse().join('/') : '—'
  return `${fmt(startStr)} - ${fmt(endStr)}`
}

// Helper to download a blob as a file
const downloadBlob = (blob, filename) => {
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  window.URL.revokeObjectURL(url)
}

// ── Tab: Ventas / Comisiones ─────────────────────────────────
function TabVentas() {
  const { showToast, canAct } = useApp()
  const { start, today } = getInitialDates()
  const [fechaInicio, setFechaInicio] = useState(start)
  const [fechaFin, setFechaFin] = useState(today)
  const [search, setSearch] = useState('')
  const [ventas, setVentas] = useState([])
  const [comisiones, setComisiones] = useState([])
  const [loading, setLoading] = useState(false)
  const [exporting, setExporting] = useState(false)

  const canExport = canAct('reportes', 'export')

  const loadData = async () => {
    setLoading(true)
    try {
      const data = await fetchVentasComisiones({
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin,
        search: search
      })
      setVentas(data.ventas || [])
      setComisiones(data.comisiones || [])
    } catch (err) {
      showToast('Error al cargar ventas y comisiones', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async () => {
    setExporting(true)
    showToast('Exportando reporte de ventas…', 'info')
    try {
      const blob = await exportVentas({
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin
      })
      downloadBlob(blob, `reporte_ventas_${new Date().toISOString().slice(0, 10)}.xlsx`)
      showToast('Reporte de ventas exportado correctamente', 'success')
    } catch (err) {
      showToast('Error al exportar reporte de ventas', 'error')
    } finally {
      setExporting(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [fechaInicio, fechaFin])

  const filteredVentas = ventas.filter(v => 
    v.pol.toLowerCase().includes(search.toLowerCase()) || 
    v.agente.toLowerCase().includes(search.toLowerCase()) ||
    v.tipo.toLowerCase().includes(search.toLowerCase())
  )

  const filteredComisiones = comisiones.filter(c => 
    c.ben.toLowerCase().includes(search.toLowerCase()) || 
    c.rol.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <div className="card p-3.5 mb-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-44">
          <input 
            type="text" 
            placeholder="Buscar…" 
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition" 
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
        <input 
          type="date" 
          value={fechaInicio} 
          onChange={e => setFechaInicio(e.target.value)}
          className="min-w-0 text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500" 
        />
        <input 
          type="date" 
          value={fechaFin} 
          onChange={e => setFechaFin(e.target.value)}
          className="min-w-0 text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500" 
        />
        {canExport && (
          <button 
            onClick={handleExport} 
            disabled={exporting}
            className="btn-secondary ml-auto shrink-0"
          >
            {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            Exportar
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        </div>
      ) : (
        <>
          <h4 className="font-semibold text-slate-700 mb-3 text-sm">Ventas del Período</h4>
          <DataTable
            cols={[
              { k: 'fecha', l: 'Fecha',      hide: 'sm' },
              { k: 'pol',   l: 'Póliza',     m: true, hide: 'md' },
              { k: 'agente',l: 'Agente',     tr: true },
              { k: 'tipo',  l: 'Tipo',       hide: 'lg', tr: true },
              { k: 'prima', l: 'Prima Neta', r: true },
              { k: 'est',   l: 'Estado' },
            ]}
            rows={filteredVentas.map(v => ({
              ...v,
              prima: usd(v.prima),
              est: rsbadge(v.est)
            }))}
          />

          <h4 className="font-semibold text-slate-700 mb-3 mt-6 text-sm">Comisiones del Período</h4>
          <DataTable
            cols={[
              { k: 'ben',  l: 'Beneficiario', tr: true },
              { k: 'rol',  l: 'Rol',          hide: 'sm' },
              { k: 'pol',  l: 'Pólizas',      r: true, hide: 'sm' },
              { k: 'base', l: 'Base',         r: true, hide: 'md' },
              { k: 'tasa', l: 'Tasa',         r: true, hide: 'md' },
              { k: 'com',  l: 'Comisión',     r: true },
              { k: 'est',  l: 'Estado' },
            ]}
            rows={filteredComisiones.map(c => ({
              ...c,
              base: usd(c.base),
              com: usd(c.com),
              est: rsbadge(c.est)
            }))}
          />
        </>
      )}
    </div>
  )
}

// ── Tab: Oficinas ────────────────────────────────────────────
function TabOficinas() {
  const { showToast, canAct } = useApp()
  const { start, today } = getInitialDates()
  const [fechaInicio, setFechaInicio] = useState(start)
  const [fechaFin, setFechaFin] = useState(today)
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [exporting, setExporting] = useState(false)

  const canExport = canAct('reportes', 'export')

  const loadData = async () => {
    setLoading(true)
    try {
      const data = await fetchOficinas({ fecha_inicio: fechaInicio, fecha_fin: fechaFin })
      setRows(data || [])
    } catch (err) {
      showToast('Error al cargar reporte de oficinas', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async () => {
    setExporting(true)
    showToast('Exportando reporte de oficinas…', 'info')
    try {
      const blob = await exportOficinas({
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin
      })
      downloadBlob(blob, `reporte_oficinas_${new Date().toISOString().slice(0, 10)}.xlsx`)
      showToast('Reporte de oficinas exportado correctamente', 'success')
    } catch (err) {
      showToast('Error al exportar reporte de oficinas', 'error')
    } finally {
      setExporting(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [fechaInicio, fechaFin])

  return (
    <div>
      <div className="card p-3.5 mb-4 flex flex-wrap items-center gap-3">
        <input 
          type="date" 
          value={fechaInicio} 
          onChange={e => setFechaInicio(e.target.value)}
          className="min-w-0 text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500" 
        />
        <input 
          type="date" 
          value={fechaFin} 
          onChange={e => setFechaFin(e.target.value)}
          className="min-w-0 text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500" 
        />
        {canExport && (
          <button 
            onClick={handleExport} 
            disabled={exporting}
            className="btn-secondary ml-auto shrink-0"
          >
            {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            Exportar
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        </div>
      ) : (
        <DataTable
          cols={[
            { k: 'ofi',   l: 'Oficina',     tr: true },
            { k: 'ag',    l: 'Agentes',     r: true, hide: 'sm' },
            { k: 'pol',   l: 'Pólizas',     r: true, hide: 'sm' },
            { k: 'prima', l: 'Prima Neta',  r: true },
            { k: 'pct',   l: '% del Total', r: true, hide: 'md' },
            { k: 'est',   l: 'Estado',      hide: 'md' },
          ]}
          rows={rows.map(r => ({
            ...r,
            prima: usd(r.prima),
            est: r.est ? rsbadge(r.est) : ''
          }))}
        />
      )}
    </div>
  )
}

function TabPersonal() {
  const { showToast, canAct } = useApp()
  const { start, today } = getInitialDates()
  const [fechaInicio, setFechaInicio] = useState(start)
  const [fechaFin, setFechaFin] = useState(today)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('Todos los roles')
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [exporting, setExporting] = useState(false)

  const canExport = canAct('reportes', 'export')

  const loadData = async () => {
    setLoading(true)
    try {
      const data = await fetchPersonal({ fecha_inicio: fechaInicio, fecha_fin: fechaFin })
      setRows(data || [])
    } catch (err) {
      showToast('Error al cargar reporte de personal', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async () => {
    setExporting(true)
    showToast('Exportando reporte de personal…', 'info')
    try {
      const blob = await exportPersonal({
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin
      })
      downloadBlob(blob, `reporte_personal_${new Date().toISOString().slice(0, 10)}.xlsx`)
      showToast('Reporte de personal exportado correctamente', 'success')
    } catch (err) {
      showToast('Error al exportar reporte de personal', 'error')
    } finally {
      setExporting(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [fechaInicio, fechaFin])

  const filteredRows = rows.filter(r => {
    const matchSearch = r.nom.toLowerCase().includes(search.toLowerCase()) || 
                        r.ofi.toLowerCase().includes(search.toLowerCase())
    const matchRole = roleFilter === 'Todos los roles' || r.rol === roleFilter
    return matchSearch && matchRole
  })

  return (
    <div>
      <div className="card p-3.5 mb-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-44">
          <input 
            type="text" 
            placeholder="Buscar personal…" 
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition" 
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
        <select 
          value={roleFilter}
          onChange={e => setRoleFilter(e.target.value)}
          className="text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option>Todos los roles</option>
          <option>Agente</option>
          <option>Supervisor</option>
        </select>
        <input 
          type="date" 
          value={fechaInicio} 
          onChange={e => setFechaInicio(e.target.value)}
          className="min-w-0 text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500" 
        />
        <input 
          type="date" 
          value={fechaFin} 
          onChange={e => setFechaFin(e.target.value)}
          className="min-w-0 text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500" 
        />
        {canExport && (
          <button 
            onClick={handleExport} 
            disabled={exporting}
            className="btn-secondary ml-auto shrink-0"
          >
            {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            Exportar
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        </div>
      ) : (
        <DataTable
          cols={[
            { k: 'nom',   l: 'Nombre',          tr: true },
            { k: 'rol',   l: 'Rol',             hide: 'sm' },
            { k: 'ofi',   l: 'Oficina',         hide: 'md' },
            { k: 'pol',   l: 'Pólizas',         r: true, hide: 'sm' },
            { k: 'prima', l: 'Prima Generada',  r: true },
            { k: 'com',   l: 'Comisión',        r: true, hide: 'md' },
            { k: 'est',   l: 'Estado' },
          ]}
          rows={filteredRows.map(r => ({
            ...r,
            prima: typeof r.prima === 'number' ? usd(r.prima) : r.prima,
            com: typeof r.com === 'number' ? usd(r.com) : r.com,
            est: rsbadge(r.est)
          }))}
        />
      )}
    </div>
  )
}

// ── Tab: Automáticos ─────────────────────────────────────────
function TabAutomaticos() {
  const { showToast, canAct } = useApp()
  const canManage = canAct('reportes', 'manage')
  const [schedules, setSchedules] = useState([])
  const [loadingSchedules, setLoadingSchedules] = useState(false)
  const [savingSchedules, setSavingSchedules] = useState(false)
  const [history, setHistory] = useState([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [runningSchedId, setRunningSchedId] = useState(null)

  const loadSchedules = async () => {
    setLoadingSchedules(true)
    try {
      const data = await fetchInternalReportSchedules()
      setSchedules(data || [])
    } catch (err) {
      showToast('Error al cargar programaciones internas', 'error')
    } finally {
      setLoadingSchedules(false)
    }
  }

  const loadHistory = async () => {
    setLoadingHistory(true)
    try {
      const data = await fetchInternalReportHistory()
      setHistory(data || [])
    } catch (err) {
      showToast('Error al cargar historial interno', 'error')
    } finally {
      setLoadingHistory(false)
    }
  }

  useEffect(() => {
    if (canManage) loadSchedules()
    loadHistory()
  }, [])

  const handleToggleSchedule = (id) => {
    setSchedules(prev => prev.map(s => s.id === id ? { ...s, activo: s.activo ? 0 : 1 } : s))
  }

  const handleTimeChange = (id, time) => {
    setSchedules(prev => prev.map(s => s.id === id ? { ...s, hora: time } : s))
  }

  const handleSaveSchedules = async () => {
    setSavingSchedules(true)
    try {
      const payload = schedules.map(s => ({
        id: s.id,
        activo: !!s.activo,
        hora: s.hora,
        nombre: s.nombre,
        frecuencia: s.frecuencia
      }))
      await saveInternalReportSchedules(payload)
      showToast('Programaciones guardadas con éxito', 'success')
      loadSchedules()
    } catch (err) {
      showToast('Error al guardar programaciones', 'error')
    } finally {
      setSavingSchedules(false)
    }
  }

  const handleRunNow = async (id) => {
    setRunningSchedId(id)
    showToast('Ejecutando reporte interno...', 'info')
    try {
      await runInternalReportSchedule(id)
      showToast('Reporte interno ejecutado con éxito', 'success')
      loadHistory()
      loadSchedules()
    } catch (err) {
      showToast('Error al ejecutar reporte', 'error')
    } finally {
      setRunningSchedId(null)
    }
  }

  const handleDownloadHistoryFile = async (id, filename) => {
    showToast('Descargando archivo...', 'info')
    try {
      const blob = await downloadInternalReportFile(id)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename || `reporte_interno_${id}.xlsx`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
      showToast('Archivo descargado con éxito', 'success')
    } catch (err) {
      showToast('El archivo no está disponible. Use "Ejecutar" para regenerarlo.', 'error')
    }
  }

  const formatSize = (bytes) => {
    if (!bytes) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="card p-6">
        <h4 className="font-semibold text-slate-800 mb-5 text-sm">Reportes Programados</h4>
        {loadingSchedules ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
          </div>
        ) : (
          <div className="space-y-3">
            {schedules.map(sched => (
              <div key={sched.id} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/50">
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-700">{sched.nombre}</p>
                  <p className="text-xs text-slate-400 mt-0.5 capitalize">{sched.frecuencia}</p>
                  {sched.ultimo_envio && (
                    <p className="text-xs text-blue-600 font-medium mt-1">
                      Último envío: {fmtDT(sched.ultimo_envio)}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-3 ml-4">
                  <input
                    type="time"
                    value={sched.hora}
                    onChange={e => handleTimeChange(sched.id, e.target.value)}
                    disabled={!canManage}
                    className="px-2 py-1 text-xs border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-blue-500 bg-white disabled:opacity-50"
                  />
                  {canManage && (
                    <button
                      onClick={() => handleRunNow(sched.id)}
                      disabled={runningSchedId === sched.id}
                      className="text-xs btn-secondary px-2.5 py-1.5 flex items-center gap-1"
                    >
                      {runningSchedId === sched.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Play className="w-3.5 h-3.5 text-emerald-600 fill-emerald-600" />
                      )}
                      Ejecutar
                    </button>
                  )}
                  <div className="toggle-wrap">
                    <input
                      type="checkbox"
                      checked={!!sched.activo}
                      onChange={() => handleToggleSchedule(sched.id)}
                      disabled={!canManage}
                      className="toggle-input"
                      id={`toggle-internal-${sched.id}`}
                    />
                    <label htmlFor={`toggle-internal-${sched.id}`} className="toggle-track" />
                  </div>
                </div>
              </div>
            ))}
            {canManage && (
              <button
                onClick={handleSaveSchedules}
                disabled={savingSchedules}
                className="btn-primary mt-5 flex items-center gap-1.5"
              >
                {savingSchedules ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Guardar Configuración
              </button>
            )}
          </div>
        )}
      </div>

      <div className="card p-6">
        <h4 className="font-semibold text-slate-800 mb-5 text-sm">Últimos Reportes Generados</h4>
        {loadingHistory ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
          </div>
        ) : (
          <DataTable
            cols={[
              { k: 'rep',   l: 'Reporte',   tr: true },
              { k: 'fecha', l: 'Fecha/Hora', hide: 'sm' },
              { k: 'est',   l: 'Estado' },
              { k: 'acc',   l: '',          acc: true },
            ]}
            rows={history.map(r => ({
              rep: r.nombre_reporte,
              fecha: fmtDT(r.fecha_generacion),
              est: rsbadge('Generado'),
              acc: (
                <button 
                  onClick={() => handleDownloadHistoryFile(r.id, r.archivo_path.split('/').pop())} 
                  className="text-xs text-blue-600 hover:underline font-semibold flex items-center gap-1 bg-transparent border-none p-0 cursor-pointer"
                >
                  <Download className="w-4 h-4" />Descargar
                </button>
              ),
            }))}
          />
        )}
      </div>
    </div>
  )
}

// ── Tab: Reportes Externos (Carga Masiva) ───────────────────
function TabExternos() {
  const { showToast, API_BASE_URL, canAct } = useApp()
  const canManage = canAct('reportes', 'manage')
  const [policies, setPolicies] = useState([])
  const [loadingPolicies, setLoadingPolicies] = useState(false)
  
  const [schedules, setSchedules] = useState([])
  const [loadingSchedules, setLoadingSchedules] = useState(false)
  const [savingSchedules, setSavingSchedules] = useState(false)
  
  const [history, setHistory] = useState([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  
  const [search, setSearch] = useState('')
  const [fechaInicio, setFechaInicio] = useState('')
  const [fechaFin, setFechaFin] = useState('')
  
  const [ignoredIds, setIgnoredIds] = useState(new Set())
  const [exporting, setExporting] = useState(false)
  const [runningSchedId, setRunningSchedId] = useState(null)

  const loadPolicies = async () => {
    setLoadingPolicies(true)
    try {
      const data = await fetchExternalReportPolicies({
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin,
        search: search
      })
      setPolicies(data)
    } catch (err) {
      showToast('Error al cargar pólizas', 'error')
    } finally {
      setLoadingPolicies(false)
    }
  }

  const loadSchedules = async () => {
    setLoadingSchedules(true)
    try {
      const data = await fetchExternalReportSchedules()
      setSchedules(data)
    } catch (err) {
      showToast('Error al cargar programaciones', 'error')
    } finally {
      setLoadingSchedules(false)
    }
  }

  const loadHistory = async () => {
    setLoadingHistory(true)
    try {
      const data = await fetchExternalReportHistory()
      setHistory(data)
    } catch (err) {
      showToast('Error al cargar historial', 'error')
    } finally {
      setLoadingHistory(false)
    }
  }

  useEffect(() => {
    loadPolicies()
  }, [fechaInicio, fechaFin])

  useEffect(() => {
    if (canManage) loadSchedules()
    loadHistory()
  }, [])

  const handleToggleIgnore = (id) => {
    setIgnoredIds(prev => {
      const copy = new Set(prev)
      if (copy.has(id)) {
        copy.delete(id)
      } else {
        copy.add(id)
      }
      return copy
    })
  }

  const handleSelectAll = () => {
    setIgnoredIds(new Set())
  }

  const handleIgnoreAll = () => {
    const ids = policies.map(p => p.id)
    setIgnoredIds(new Set(ids))
  }

  const handleExport = async () => {
    setExporting(true)
    showToast('Generando reporte externo...', 'info')
    try {
      const blob = await exportExternalReport({
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin,
        ignored_ids: Array.from(ignoredIds)
      })
      
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `reporte_externo_${new Date().toISOString().slice(0, 10)}.xlsx`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
      
      showToast('Reporte exportado correctamente', 'success')
    } catch (err) {
      showToast('Error al exportar reporte', 'error')
    } finally {
      setExporting(false)
    }
  }

  const handleSaveSchedules = async () => {
    setSavingSchedules(true)
    try {
      await saveExternalReportSchedules(schedules)
      showToast('Programaciones guardadas con éxito', 'success')
      loadSchedules()
    } catch (err) {
      showToast('Error al guardar programaciones', 'error')
    } finally {
      setSavingSchedules(false)
    }
  }

  const handleToggleSchedule = (id) => {
    setSchedules(prev => prev.map(s => s.id === id ? { ...s, activo: s.activo ? 0 : 1 } : s))
  }

  const handleTimeChange = (id, time) => {
    setSchedules(prev => prev.map(s => s.id === id ? { ...s, hora: time } : s))
  }

  const handleNameChange = (id, nombre) => {
    setSchedules(prev => prev.map(s => s.id === id ? { ...s, nombre } : s))
  }

  const handleFrecuenciaChange = (id, frecuencia) => {
    setSchedules(prev => prev.map(s => s.id === id ? { ...s, frecuencia } : s))
  }

  const handleDeleteSchedule = (id) => {
    setSchedules(prev => prev.filter(s => s.id !== id))
  }

  const handleAddSchedule = () => {
    setSchedules(prev => [...prev, {
      id: Date.now(),
      nombre: 'Reporte Mensual',
      frecuencia: 'mensual',
      hora: '08:00',
      activo: 1,
      ultimo_envio: null
    }])
  }

  const handleRunNow = async (id) => {
    setRunningSchedId(id)
    showToast('Ejecutando programación de reporte...', 'info')
    try {
      await runExternalReportSchedule(id)
      showToast('Reporte ejecutado y guardado en historial', 'success')
      loadHistory()
      loadSchedules()
    } catch (err) {
      showToast('Error al ejecutar reporte', 'error')
    } finally {
      setRunningSchedId(null)
    }
  }

  const handleDownloadHistoryFile = async (id, filename) => {
    showToast('Descargando archivo...', 'info')
    try {
      const blob = await downloadExternalReportFile(id)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename || `reporte_${id}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
      showToast('Archivo descargado con éxito', 'success')
    } catch (err) {
      showToast('El archivo no está disponible. Use "Ejecutar" para regenerarlo.', 'error')
    }
  }

  const formatSize = (bytes) => {
    if (!bytes) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const cols = [
    { k: 'chk',          l: 'Incluir', nw: true },
    { k: 'nro_contrato', l: 'Póliza', m: true, nw: true },
    { k: 'tomador',      l: 'Tomador' },
    { k: 'ci_tomador',   l: 'Cédula Tomador', m: true, nw: true },
    { k: 'vehiculo',     l: 'Vehículo' },
    { k: 'placa',        l: 'Placa', m: true, nw: true },
    { k: 'vigencia',     l: 'Vigencia', nw: true },
    { k: 'total',        l: 'Monto', r: true, nw: true },
    { k: 'producto',     l: 'Producto' }
  ]

  const rows = policies.map(p => ({
    id: p.id,
    chk: (
      <input
        type="checkbox"
        checked={!ignoredIds.has(p.id)}
        onChange={() => handleToggleIgnore(p.id)}
        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
      />
    ),
    nro_contrato: p.nro_contrato,
    tomador: p.tomador,
    ci_tomador: p.ci_tomador,
    vehiculo: p.vehiculo,
    placa: p.placa,
    vigencia: p.vigencia,
    total: usd(p.total),
    producto: p.producto
  }))

  const token = localStorage.getItem('auth_token')

  return (
    <div className="space-y-6">
      {/* Policy Selection and Filter Bar */}
      <div className="card p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="text-base font-semibold text-slate-800 flex items-center gap-2">
              <span>📋</span> Pólizas para Reporte Externo
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Selecciona las pólizas a exportar. Desmarca las que deseas ignorar del reporte de carga masiva.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleExport}
              disabled={exporting || policies.length === 0}
              className="btn-primary py-2 flex items-center justify-center gap-1.5"
            >
              {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              Generar y Descargar Excel
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-5 items-end">
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-500 mb-1">Buscar Póliza, Cliente o Placa</label>
            <div className="relative">
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && loadPolicies()}
                placeholder="Buscar por póliza, nombre, cédula o placa..."
                className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Desde Emisión</label>
            <input
              type="date"
              value={fechaInicio}
              onChange={e => setFechaInicio(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">Hasta Emisión</label>
            <input
              type="date"
              value={fechaFin}
              onChange={e => setFechaFin(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 mb-4 text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-100">
          <div className="flex gap-2">
            <button onClick={handleSelectAll} className="text-blue-600 hover:underline font-semibold">✓ Mantener Todas</button>
            <span className="text-slate-300">|</span>
            <button onClick={handleIgnoreAll} className="text-slate-600 hover:underline font-semibold">✗ Ignorar Todas</button>
          </div>
          <span className="text-slate-500 font-medium">
            Seleccionadas: <strong className="text-blue-600 font-bold">{policies.length - ignoredIds.size}</strong> de {policies.length} pólizas
          </span>
        </div>

        {loadingPolicies ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
        ) : (
          <DataTable cols={cols} rows={rows} />
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Scheduling Configurations */}
        <div className="card p-6">
          <h3 className="text-base font-semibold text-slate-800 mb-2 flex items-center gap-2">
            <span>⚙️</span> Programación de Reportes Externos
          </h3>
          <p className="text-xs text-slate-400 mb-5">
            Configura las reglas para la generación automática de los reportes masivos por período.
          </p>

          {loadingSchedules ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
            </div>
          ) : (
            <div className="space-y-3">
              {schedules.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                  <Calendar className="w-8 h-8 text-slate-300 mb-2" />
                  <p className="text-sm font-medium text-slate-500">Sin programaciones configuradas</p>
                  <p className="text-xs text-slate-400 mt-1">Agrega una regla para generar reportes automáticamente.</p>
                </div>
              ) : (
                schedules.map(sched => (
                  <div key={sched.id} className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs font-semibold text-slate-500 mb-1">Nombre</label>
                          <input
                            type="text"
                            value={sched.nombre}
                            onChange={e => handleNameChange(sched.id, e.target.value)}
                            disabled={!canManage}
                            className="w-full px-2.5 py-1.5 text-sm border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-blue-500 bg-white disabled:opacity-50"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-500 mb-1">Frecuencia</label>
                          <select
                            value={sched.frecuencia}
                            onChange={e => handleFrecuenciaChange(sched.id, e.target.value)}
                            disabled={!canManage}
                            className="w-full px-2.5 py-1.5 text-sm border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-blue-500 bg-white disabled:opacity-50"
                          >
                            <option value="diario">Diario</option>
                            <option value="semanal">Semanal</option>
                            <option value="mensual">Mensual</option>
                            <option value="trimestral">Trimestral</option>
                          </select>
                        </div>
                      </div>
                      {canManage && (
                        <button
                          onClick={() => handleDeleteSchedule(sched.id)}
                          className="mt-5 p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors shrink-0"
                          title="Eliminar programación"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-3 pt-1 border-t border-slate-100">
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">Hora de ejecución</label>
                        <input
                          type="time"
                          value={sched.hora}
                          onChange={e => handleTimeChange(sched.id, e.target.value)}
                          disabled={!canManage}
                          className="px-2.5 py-1.5 text-sm border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-blue-500 bg-white disabled:opacity-50"
                        />
                      </div>
                      {sched.ultimo_envio && (
                        <p className="text-xs text-blue-600 font-medium self-end pb-1.5">
                          Última corrida: {fmtDT(sched.ultimo_envio)}
                        </p>
                      )}
                      <div className="ml-auto flex items-center gap-3 self-end pb-0.5">
                        {canManage && (
                          <button
                            onClick={() => handleRunNow(sched.id)}
                            disabled={runningSchedId === sched.id}
                            className="text-xs btn-secondary px-2.5 py-1.5 flex items-center gap-1"
                          >
                            {runningSchedId === sched.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Play className="w-3.5 h-3.5 text-emerald-600 fill-emerald-600" />
                            )}
                            Ejecutar ahora
                          </button>
                        )}
                        <div className="toggle-wrap">
                          <input
                            type="checkbox"
                            checked={!!sched.activo}
                            onChange={() => handleToggleSchedule(sched.id)}
                            disabled={!canManage}
                            className="toggle-input"
                            id={`ext-toggle-${sched.id}`}
                          />
                          <label htmlFor={`ext-toggle-${sched.id}`} className="toggle-track" />
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}

              {canManage && (
                <div className="flex items-center gap-3 pt-1">
                  <button
                    onClick={handleAddSchedule}
                    className="btn-secondary flex items-center gap-1.5 text-sm"
                  >
                    <span className="text-base leading-none">+</span> Agregar Programación
                  </button>
                  <button
                    onClick={handleSaveSchedules}
                    disabled={savingSchedules || schedules.length === 0}
                    className="btn-primary flex items-center gap-1.5"
                  >
                    {savingSchedules ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    Guardar Configuración
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Historic logs */}
        <div className="card p-6">
          <h3 className="text-base font-semibold text-slate-800 mb-2 flex items-center gap-2">
            <span>📂</span> Historial de Reportes Generados
          </h3>
          <p className="text-xs text-slate-400 mb-5">
            Descarga los archivos generados en los periodos configurados.
          </p>

          {loadingHistory ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
            </div>
          ) : (
            <DataTable
              cols={[
                { k: 'nombre', l: 'Reporte / Frecuencia' },
                { k: 'fecha',  l: 'Generado el', hide: 'sm' },
                { k: 'size',   l: 'Tamaño' },
                { k: 'action', l: 'Acción', acc: true }
              ]}
              rows={history.map(item => ({
                nombre: item.nombre_reporte,
                fecha: fmtDT(item.fecha_generacion),
                size: formatSize(item.size),
                action: (
                  <button
                    onClick={() => handleDownloadHistoryFile(item.id, item.archivo_path.split('/').pop())}
                    className="text-xs text-blue-600 hover:underline font-semibold flex items-center gap-1 bg-transparent border-none p-0 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />Descargar
                  </button>
                )
              }))}
            />
          )}
        </div>
      </div>
    </div>
  )
}

// ── Tab: Métricas de Personal ───────────────────────────────
function TabUsuariosMetrics() {
  const { showToast, currentUser } = useApp()
  const isVendedor = currentUser?.tipo?.startsWith('Vendedor') || currentUser?.tipo === 'Vendedor' || currentUser?.cargo === 'Agente'
  const { start, today } = getInitialDates()
  const [fechaInicio, setFechaInicio] = useState(start)
  const [fechaFin, setFechaFin] = useState(today)
  const [search, setSearch] = useState('')
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)

  // Para ver el detalle de un usuario
  const [selectedUser, setSelectedUser] = useState(null)
  const [detailData, setDetailData] = useState(null)
  const [loadingDetail, setLoadingDetail] = useState(false)

  const loadData = async () => {
    setLoading(true)
    try {
      const data = await fetchUsuariosReport({
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin,
        search: search
      })
      setRows(data || [])
    } catch (err) {
      showToast('Error al cargar métricas de personal', 'error')
    } finally {
      setLoading(false)
    }
  }

  const loadUserDetail = async (userId) => {
    setLoadingDetail(true)
    try {
      const data = await fetchUsuariosReport({
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin,
        usuario_id: userId
      })
      setDetailData(data)
    } catch (err) {
      showToast('Error al cargar detalle del usuario', 'error')
    } finally {
      setLoadingDetail(false)
    }
  }

  useEffect(() => {
    if (isVendedor && currentUser?.id) {
      setSelectedUser(currentUser.id)
    }
  }, [isVendedor, currentUser, selectedUser])

  useEffect(() => {
    if (selectedUser) {
      loadUserDetail(selectedUser)
    } else {
      loadData()
    }
  }, [fechaInicio, fechaFin, selectedUser])

  const handleSearchSubmit = (e) => {
    e?.preventDefault()
    if (!selectedUser) loadData()
  }

  if (selectedUser && detailData) {
    const { usuario, stats, polizas } = detailData
    return (
      <div>
        <div className="card p-3.5 mb-4 flex items-center gap-3">
          {!isVendedor && (
            <button onClick={() => { setSelectedUser(null); setDetailData(null) }} className="btn-secondary">
              ← Volver a la lista
            </button>
          )}
          <span className="text-sm font-semibold text-slate-700 ml-2">Detalle de {usuario.nombre}</span>
          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">Período:</span>
            <input
              type="date"
              value={fechaInicio}
              onChange={e => setFechaInicio(e.target.value)}
              className="text-xs border border-slate-200 rounded-xl px-2.5 py-1.5 bg-slate-50 text-slate-600 focus:ring-2 focus:ring-blue-500 outline-none"
            />
            <span className="text-xs text-slate-400">—</span>
            <input
              type="date"
              value={fechaFin}
              onChange={e => setFechaFin(e.target.value)}
              className="text-xs border border-slate-200 rounded-xl px-2.5 py-1.5 bg-slate-50 text-slate-600 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>

        {loadingDetail ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
              {[
                { label: 'Pólizas Emitidas', val: stats.total_polizas, sub: 'Ventas del período', cls: 'border-t-blue-500', vcls: 'text-slate-800' },
                { label: 'Prima Emitida', val: usd(stats.total_prima), sub: 'USD', cls: 'border-t-emerald-500', vcls: 'text-emerald-700' },
                { label: 'Prima en Bs', val: bs(stats.total_prima_bs), sub: 'VES', cls: 'border-t-amber-500', vcls: 'text-amber-700' },
                { label: 'Comisión Estimada', val: usd(stats.comision_estimada), sub: `${usuario.cargo === 'Agente' ? '10%' : '5%'} de base`, cls: 'border-t-indigo-500', vcls: 'text-indigo-700' },
              ].map(c => (
                <div key={c.label} className={`card p-4 text-center border-t-4 ${c.cls}`}>
                  <p className="text-xs text-slate-600 uppercase tracking-wide">{c.label}</p>
                  <p className={`text-2xl font-black mt-1 ${c.vcls}`}>{c.val}</p>
                  <p className="text-xs text-slate-400">{c.sub}</p>
                </div>
              ))}
            </div>

            <div className="card p-4 mb-4 border border-slate-100 flex flex-wrap gap-x-8 gap-y-2 text-sm bg-white rounded-xl">
              <div><strong className="text-slate-500">Usuario:</strong> <span className="font-semibold text-slate-800">{usuario.nick}</span></div>
              <div><strong className="text-slate-500">Cargo:</strong> <span className="font-semibold text-slate-800">{usuario.cargo}</span></div>
              <div><strong className="text-slate-500">Sede:</strong> <span className="font-semibold text-slate-800">{usuario.sede ?? 'Sede Central'}</span></div>
              <div><strong className="text-slate-500">Estado:</strong> <span className="font-semibold text-slate-800">{usuario.activo ? 'Activo' : 'Inactivo'}</span></div>
            </div>

            <h4 className="font-semibold text-slate-700 mb-3 text-sm">Pólizas Vendidas</h4>
            <DataTable
              cols={[
                { k: 'fecha_emision', l: 'Fecha Emisión' },
                { k: 'nro_contrato', l: 'Nro. Contrato', m: true },
                { k: 'cliente_nombre', l: 'Asegurado/Cliente', tr: true },
                { k: 'producto_nombre', l: 'Producto' },
                { k: 'total', l: 'Prima (USD)', r: true },
                { k: 'status', l: 'Estado' },
              ]}
              rows={polizas.map(p => ({
                ...p,
                total: usd(p.total),
                status: rsbadge(p.status)
              }))}
            />
          </>
        )}
      </div>
    )
  }

  return (
    <div>
      <form onSubmit={handleSearchSubmit} className="card p-3.5 mb-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-44">
          <input
            type="text"
            placeholder="Buscar por nombre, usuario o cargo..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
        <input
          type="date"
          value={fechaInicio}
          onChange={e => setFechaInicio(e.target.value)}
          className="min-w-0 text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
        />
        <input
          type="date"
          value={fechaFin}
          onChange={e => setFechaFin(e.target.value)}
          className="min-w-0 text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button type="submit" className="btn-primary">Filtrar</button>
      </form>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        </div>
      ) : (
        <DataTable
          cols={[
            { k: 'nom', l: 'Nombre Completo', tr: true },
            { k: 'rol', l: 'Cargo', hide: 'sm' },
            { k: 'ofi', l: 'Sede/Oficina', hide: 'md' },
            { k: 'pol', l: 'Pólizas Vendidas', r: true },
            { k: 'prima', l: 'Prima Generada (USD)', r: true },
            { k: 'com', l: 'Comisión Estimada', r: true, hide: 'md' },
            { k: 'est', l: 'Estado' },
            { k: 'action', l: 'Detalle', acc: true }
          ]}
          rows={rows.map(r => ({
            ...r,
            prima: usd(r.prima),
            com: usd(r.com),
            est: rsbadge(r.est),
            action: (
              <button onClick={() => setSelectedUser(r.id)} className="text-xs text-blue-600 hover:underline font-semibold bg-transparent border-none p-0 cursor-pointer">
                Ver Detalle
              </button>
            )
          }))}
        />
      )}
    </div>
  )
}

// ── Tab: Métricas de Clientes ────────────────────────────────
function TabClientesMetrics() {
  const { showToast } = useApp()
  const { start, today } = getInitialDates()
  const [fechaInicio, setFechaInicio] = useState(start)
  const [fechaFin, setFechaFin] = useState(today)
  const [search, setSearch] = useState('')
  const [stats, setStats] = useState({ nuevos_clientes: 0, total_clientes: 0, clientes_activos: 0, total_polizas: 0, polizas_por_vencer: 0 })
  const [clientes, setClientes] = useState([])
  const [loading, setLoading] = useState(false)

  // Filtros
  const [activeFilter, setActiveFilter] = useState(null)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [filterOptions, setFilterOptions] = useState({ marcas: [], modelos: {} })

  // Filtros avanzados
  const [marca, setMarca] = useState('')
  const [modelo, setModelo] = useState('')
  const [estadoPoliza, setEstadoPoliza] = useState('')
  const [minVehiculos, setMinVehiculos] = useState('')
  const [maxVehiculos, setMaxVehiculos] = useState('')
  const [minPrima, setMinPrima] = useState('')
  const [maxPrima, setMaxPrima] = useState('')

  // Filtros personalizados
  const [customFilters, setCustomFilters] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('custom_client_filters') || '[]')
    } catch (e) {
      return []
    }
  })
  const [isSavingFilter, setIsSavingFilter] = useState(false)
  const [newFilterName, setNewFilterName] = useState('')

  // Detalle de un cliente
  const [selectedClient, setSelectedClient] = useState(null)
  const [clientDetail, setClientDetail] = useState(null)
  const [loadingDetail, setLoadingDetail] = useState(false)

  const buildParams = (overrides = {}) => {
    const p = {
      fecha_inicio: fechaInicio,
      fecha_fin: fechaFin,
      search,
      filtro: overrides.filtro ?? activeFilter ?? '',
      marca: overrides.marca ?? marca,
      modelo: overrides.modelo ?? modelo,
      estado_poliza: overrides.estado_poliza ?? estadoPoliza,
      min_vehiculos: overrides.min_vehiculos ?? minVehiculos,
      max_vehiculos: overrides.max_vehiculos ?? maxVehiculos,
      min_prima: overrides.min_prima ?? minPrima,
      max_prima: overrides.max_prima ?? maxPrima,
    }
    // Remove empty values
    return Object.fromEntries(Object.entries(p).filter(([, v]) => v !== '' && v !== null && v !== undefined))
  }

  const loadData = async (overrides = {}) => {
    setLoading(true)
    try {
      const data = await fetchClientesReport(buildParams(overrides))
      setStats(data.stats || { nuevos_clientes: 0, total_clientes: 0, clientes_activos: 0, total_polizas: 0, polizas_por_vencer: 0 })
      setClientes(data.clientes || [])
      if (data.filtros_opciones) setFilterOptions(data.filtros_opciones)
    } catch (err) {
      showToast('Error al cargar métricas de clientes', 'error')
    } finally {
      setLoading(false)
    }
  }

  const loadClientDetail = async (clientId) => {
    setLoadingDetail(true)
    try {
      const data = await fetchClientesReport({ fecha_inicio: fechaInicio, fecha_fin: fechaFin, persona_id: clientId })
      setClientDetail(data)
    } catch (err) {
      showToast('Error al cargar detalle del cliente', 'error')
    } finally {
      setLoadingDetail(false)
    }
  }

  useEffect(() => {
    if (selectedClient) {
      loadClientDetail(selectedClient)
    } else {
      loadData()
    }
  }, [fechaInicio, fechaFin, selectedClient])

  const handleQuickFilter = (f) => {
    const newFilter = activeFilter === f ? null : f
    setActiveFilter(newFilter)
    loadData({ filtro: newFilter || '' })
  }

  const handleApplyAdvanced = () => {
    loadData()
  }

  const handleClearFilters = () => {
    setActiveFilter(null)
    setMarca('')
    setModelo('')
    setEstadoPoliza('')
    setMinVehiculos('')
    setMaxVehiculos('')
    setMinPrima('')
    setMaxPrima('')
    loadData({ filtro: '', marca: '', modelo: '', estado_poliza: '', min_vehiculos: '', max_vehiculos: '', min_prima: '', max_prima: '' })
  }

  const handleSearchSubmit = (e) => {
    e?.preventDefault()
    if (!selectedClient) loadData()
  }

  const handleSaveCustomFilter = (e) => {
    e?.preventDefault()
    if (!newFilterName.trim()) {
      showToast('Por favor, ingresa un nombre para el filtro', 'warning')
      return
    }
    const newFilter = {
      id: Date.now().toString(),
      name: newFilterName.trim(),
      marca,
      modelo,
      estadoPoliza,
      minVehiculos,
      maxVehiculos,
      minPrima,
      maxPrima,
    }
    const updated = [...customFilters, newFilter]
    setCustomFilters(updated)
    localStorage.setItem('custom_client_filters', JSON.stringify(updated))
    setNewFilterName('')
    setIsSavingFilter(false)
    showToast('Filtro guardado exitosamente', 'success')
  }

  const handleDeleteCustomFilter = (id, e) => {
    e?.stopPropagation()
    const updated = customFilters.filter(f => f.id !== id)
    setCustomFilters(updated)
    localStorage.setItem('custom_client_filters', JSON.stringify(updated))
    if (activeFilter === id) {
      handleClearFilters()
    }
    showToast('Filtro eliminado', 'success')
  }

  const handleApplyCustomFilter = (f) => {
    if (activeFilter === f.id) {
      handleClearFilters()
      return
    }
    setActiveFilter(f.id)
    setMarca(f.marca || '')
    setModelo(f.modelo || '')
    setEstadoPoliza(f.estadoPoliza || '')
    setMinVehiculos(f.minVehiculos || '')
    setMaxVehiculos(f.maxVehiculos || '')
    setMinPrima(f.minPrima || '')
    setMaxPrima(f.maxPrima || '')
    
    loadData({
      filtro: '',
      marca: f.marca || '',
      modelo: f.modelo || '',
      estado_poliza: f.estadoPoliza || '',
      min_vehiculos: f.minVehiculos || '',
      max_vehiculos: f.maxVehiculos || '',
      min_prima: f.minPrima || '',
      max_prima: f.maxPrima || '',
    })
  }

  const hasActiveFilters = activeFilter || marca || modelo || estadoPoliza || minVehiculos || maxVehiculos || minPrima || maxPrima

  // Modelos disponibles según marca seleccionada
  const availableModelos = marca && filterOptions.modelos?.[marca] ? filterOptions.modelos[marca] : []

  // ── DETALLE DE CLIENTE ────────────────────────────────────
  if (selectedClient && clientDetail) {
    const { cliente, vehiculos, polizas } = clientDetail
    return (
      <div>
        <div className="card p-3.5 mb-4 flex items-center gap-3">
          <button onClick={() => { setSelectedClient(null); setClientDetail(null) }} className="btn-secondary">
            ← Volver a la lista
          </button>
          <span className="text-sm font-semibold text-slate-700 ml-2">Historial de {cliente.nombre}</span>
          <span className="text-xs text-slate-400 font-mono ml-auto">Cédula: {cliente.cedula}</span>
        </div>

        {loadingDetail ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
        ) : (
          <>
            <div className="card p-4 mb-5 border border-slate-100 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm bg-white rounded-xl">
              <div><strong className="text-slate-500">Correo Electrónico:</strong> <p className="font-semibold text-slate-800">{cliente.correo}</p></div>
              <div><strong className="text-slate-500">Teléfono / Celular:</strong> <p className="font-semibold text-slate-800">{cliente.telefono} / {cliente.celular}</p></div>
              <div><strong className="text-slate-500">Dirección:</strong> <p className="font-semibold text-slate-800">{cliente.direccion}</p></div>
              <div><strong className="text-slate-500">Ciudad / Estado:</strong> <p className="font-semibold text-slate-800">{cliente.ciudad} / {cliente.estado}</p></div>
              <div><strong className="text-slate-500">Fecha Registro:</strong> <p className="font-semibold text-slate-800">{cliente.fecha_creacion}</p></div>
              <div><strong className="text-slate-500">Estatus Administrativo:</strong> <p className="mt-0.5">{rsbadge(cliente.activo ? 'Activo' : 'Bloqueado')}</p></div>
            </div>

            <h4 className="font-semibold text-slate-700 mb-3 text-sm">Vehículos Registrados</h4>
            <DataTable
              cols={[
                { k: 'placa', l: 'Placa', m: true },
                { k: 'marca', l: 'Marca' },
                { k: 'modelo', l: 'Modelo', tr: true },
                { k: 'anio', l: 'Año', r: true, hide: 'sm' },
                { k: 'color', l: 'Color', hide: 'sm' },
                { k: 'tipo', l: 'Tipo', hide: 'md' },
                { k: 'uso', l: 'Uso', hide: 'md' },
              ]}
              rows={vehiculos}
            />

            <h4 className="font-semibold text-slate-700 mb-3 mt-6 text-sm">Historial de Pólizas</h4>
            <DataTable
              cols={[
                { k: 'nro_contrato', l: 'Nro. Contrato', m: true },
                { k: 'fecha_emision', l: 'Fecha Emisión' },
                { k: 'fecha_vencimiento', l: 'Fecha Vencimiento', hide: 'sm' },
                { k: 'producto', l: 'Producto', tr: true },
                { k: 'total', l: 'Prima USD', r: true },
                { k: 'status', l: 'Estado' }
              ]}
              rows={polizas.map(p => ({
                ...p,
                total: usd(p.total),
                status: rsbadge(p.status)
              }))}
            />
          </>
        )}
      </div>
    )
  }

  // ── QUICK FILTER BUTTONS CONFIG ────────────────────────────
  const quickFilters = [
    { key: 'por_vencer',    label: 'Pólizas por Vencer', Icon: AlertTriangle, color: 'red',     count: stats.polizas_por_vencer },
    { key: 'mas_polizas',   label: 'Más Pólizas',       Icon: TrendingUp,    color: 'blue'    },
    { key: 'por_vehiculos', label: 'Por Vehículos',      Icon: Car,           color: 'indigo'  },
    { key: 'activos',       label: 'Activos',            Icon: CheckCircle2,  color: 'emerald' },
    { key: 'bloqueados',    label: 'Bloqueados',         Icon: X,             color: 'slate'   },
  ]

  const filterBtnCls = (key, color) => {
    const isActive = activeFilter === key
    const colors = {
      red:     isActive ? 'bg-red-50 border-red-300 text-red-700 shadow-sm'     : 'border-slate-200 text-slate-600 hover:border-red-200 hover:text-red-600',
      blue:    isActive ? 'bg-blue-50 border-blue-300 text-blue-700 shadow-sm'   : 'border-slate-200 text-slate-600 hover:border-blue-200 hover:text-blue-600',
      indigo:  isActive ? 'bg-indigo-50 border-indigo-300 text-indigo-700 shadow-sm' : 'border-slate-200 text-slate-600 hover:border-indigo-200 hover:text-indigo-600',
      emerald: isActive ? 'bg-emerald-50 border-emerald-300 text-emerald-700 shadow-sm' : 'border-slate-200 text-slate-600 hover:border-emerald-200 hover:text-emerald-600',
      slate:   isActive ? 'bg-slate-100 border-slate-400 text-slate-700 shadow-sm' : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:text-slate-700',
    }
    return `inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all duration-200 cursor-pointer ${colors[color] || colors.blue}`
  }

  // ── RENDER ─────────────────────────────────────────────────
  return (
    <div className="w-full max-w-full overflow-hidden">
      {/* Search + Date bar */}
      <form onSubmit={handleSearchSubmit} className="card p-3.5 mb-4 flex flex-col md:flex-row items-stretch md:items-center gap-3">
        <div className="relative flex-1 min-w-0">
          <input
            type="text"
            placeholder="Buscar cliente por nombre, cédula, correo o teléfono..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
        <div className="flex flex-col sm:flex-row items-stretch gap-2 shrink-0">
          <input type="date" value={fechaInicio} onChange={e => setFechaInicio(e.target.value)}
            className="text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-auto" />
          <input type="date" value={fechaFin} onChange={e => setFechaFin(e.target.value)}
            className="text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-auto" />
          <button type="submit" className="btn-primary w-full sm:w-auto">Filtrar</button>
        </div>
      </form>

      {/* Quick Filter Buttons */}
      <div className="card p-3.5 mb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-500" />
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Filtros Rápidos</span>
          </div>
          <div className="flex items-center gap-3 self-end sm:self-auto">
            {hasActiveFilters && (
              <button onClick={handleClearFilters} className="text-xs text-slate-400 hover:text-red-500 font-semibold flex items-center gap-1 transition-colors bg-transparent border-none p-0 cursor-pointer">
                <X className="w-3.5 h-3.5" /> Limpiar filtros
              </button>
            )}
            <button onClick={() => setShowAdvanced(v => !v)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border border-dashed border-slate-300 text-slate-500 hover:border-blue-400 hover:text-blue-600 transition-all bg-transparent cursor-pointer">
              <Filter className="w-3.5 h-3.5" />
              Avanzados
              {showAdvanced ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {quickFilters.map(f => (
            <button key={f.key} onClick={() => handleQuickFilter(f.key)} className={filterBtnCls(f.key, f.color)}>
              <f.Icon className="w-3.5 h-3.5" />
              {f.label}
              {f.count != null && <span className="ml-0.5 bg-white/80 text-[10px] font-black px-1.5 py-0.5 rounded-full border border-current/10">{f.count}</span>}
            </button>
          ))}

          {customFilters.map(cf => (
            <div key={cf.id} className="relative group/custom inline-flex items-center">
              <button
                onClick={() => handleApplyCustomFilter(cf)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all duration-200 cursor-pointer ${
                  activeFilter === cf.id
                    ? 'bg-purple-50 border-purple-300 text-purple-700 shadow-sm'
                    : 'border-slate-200 text-slate-600 hover:border-purple-200 hover:text-purple-600'
                }`}
              >
                <Bookmark className="w-3.5 h-3.5" />
                {cf.name}
              </button>
              <button
                type="button"
                onClick={(e) => handleDeleteCustomFilter(cf.id, e)}
                className="absolute -top-1 -right-1 bg-red-100 hover:bg-red-200 text-red-600 rounded-full p-0.5 opacity-0 group-hover/custom:opacity-100 transition-opacity duration-150 border border-white shadow-sm"
                title="Eliminar filtro"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            </div>
          ))}
        </div>

        {/* Advanced Filters Panel */}
        {showAdvanced && (
          <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1 uppercase tracking-wide">Marca Vehículo</label>
              <select value={marca} onChange={e => { setMarca(e.target.value); setModelo('') }}
                className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Todas las marcas</option>
                {filterOptions.marcas.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1 uppercase tracking-wide">Modelo Vehículo</label>
              <select value={modelo} onChange={e => setModelo(e.target.value)} disabled={!marca}
                className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50">
                <option value="">Todos los modelos</option>
                {availableModelos.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1 uppercase tracking-wide">Estado Póliza</label>
              <select value={estadoPoliza} onChange={e => setEstadoPoliza(e.target.value)}
                className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Todos</option>
                <option value="ACTIVA">Activa</option>
                <option value="VENCIDA">Vencida</option>
                <option value="ANULADA">Anulada</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1 uppercase tracking-wide">Rango Vehículos</label>
              <div className="flex gap-1.5">
                <input type="number" min="0" placeholder="Mín" value={minVehiculos} onChange={e => setMinVehiculos(e.target.value)}
                  className="w-1/2 text-sm bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 outline-none focus:ring-2 focus:ring-blue-500" />
                <input type="number" min="0" placeholder="Máx" value={maxVehiculos} onChange={e => setMaxVehiculos(e.target.value)}
                  className="w-1/2 text-sm bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-semibold text-slate-500 mb-1 uppercase tracking-wide">Rango Prima Total (USD)</label>
              <div className="flex gap-1.5">
                <input type="number" min="0" step="0.01" placeholder="Mínimo $" value={minPrima} onChange={e => setMinPrima(e.target.value)}
                  className="w-1/2 text-sm bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 outline-none focus:ring-2 focus:ring-blue-500" />
                <input type="number" min="0" step="0.01" placeholder="Máximo $" value={maxPrima} onChange={e => setMaxPrima(e.target.value)}
                  className="w-1/2 text-sm bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-2">
              <button onClick={handleApplyAdvanced} className="btn-primary flex-1">Aplicar Filtros</button>
              <button onClick={handleClearFilters} className="btn-secondary flex-1">Limpiar</button>
            </div>
          </div>
        )}

        {/* Guardar Filtro Personalizado */}
        {showAdvanced && (marca || modelo || estadoPoliza || minVehiculos || maxVehiculos || minPrima || maxPrima) && (
          <div className="mt-4 pt-3 border-t border-slate-100/60 flex flex-wrap items-center justify-between gap-3">
            {!isSavingFilter ? (
              <button
                type="button"
                onClick={() => setIsSavingFilter(true)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-purple-600 hover:text-purple-700 transition bg-transparent border-none p-0 cursor-pointer"
              >
                <Bookmark className="w-4 h-4" />
                Guardar esta combinación como Filtro Rápido
              </button>
            ) : (
              <form onSubmit={handleSaveCustomFilter} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full max-w-md">
                <input
                  type="text"
                  placeholder="Nombre de tu filtro (ej: Toyotas Activas)..."
                  value={newFilterName}
                  onChange={e => setNewFilterName(e.target.value)}
                  className="flex-1 text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 outline-none focus:ring-2 focus:ring-purple-500 min-w-0"
                  required
                />
                <div className="flex gap-2 shrink-0">
                  <button type="submit" className="btn-primary text-xs !py-1.5 flex-1 sm:flex-none">Guardar</button>
                  <button type="button" onClick={() => { setIsSavingFilter(false); setNewFilterName('') }} className="btn-secondary text-xs !py-1.5 flex-1 sm:flex-none">Cancelar</button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-5">
            {[
              { label: 'Nuevos Clientes', val: stats.nuevos_clientes, sub: 'En período seleccionado', cls: 'border-t-blue-500', vcls: 'text-slate-800' },
              { label: 'Total Clientes', val: stats.total_clientes, sub: 'En el sistema', cls: 'border-t-emerald-500', vcls: 'text-emerald-700' },
              { label: 'Clientes Activos', val: stats.clientes_activos, sub: 'Con pólizas activas', cls: 'border-t-indigo-500', vcls: 'text-indigo-700' },
              { label: 'Pólizas Emitidas', val: stats.total_polizas, sub: 'En período seleccionado', cls: 'border-t-amber-500', vcls: 'text-amber-700' },
              { label: 'Por Vencer', val: stats.polizas_por_vencer, sub: 'Próximos 30 días', cls: 'border-t-red-500', vcls: 'text-red-700' },
            ].map(c => (
              <div key={c.label} className={`card p-4 text-center border-t-4 ${c.cls}`}>
                <p className="text-xs text-slate-600 uppercase tracking-wide">{c.label}</p>
                <p className={`text-2xl font-black mt-1 ${c.vcls}`}>{c.val}</p>
                <p className="text-xs text-slate-400">{c.sub}</p>
              </div>
            ))}
          </div>

          {/* Data Table */}
          <DataTable
            cols={[
              { k: 'ced', l: 'Cédula', m: true, nw: true },
              { k: 'nom', l: 'Nombre Completo', tr: true },
              { k: 'cor', l: 'Correo', hide: 'lg', tr: true },
              { k: 'tel', l: 'Teléfono', hide: 'md', nw: true },
              { k: 'veh', l: 'Vehículos', r: true, hide: 'sm' },
              { k: 'marcas', l: 'Marcas', hide: 'xl', tr: true },
              { k: 'pol', l: 'Pólizas', r: true },
              { k: 'pol_act', l: 'Activas', r: true, hide: 'sm' },
              { k: 'prox_venc', l: 'Próx. Vencimiento', hide: 'md', nw: true },
              { k: 'prima', l: 'Prima Total (USD)', r: true, hide: 'sm' },
              { k: 'est', l: 'Estado' },
              { k: 'action', l: 'Historial', acc: true }
            ]}
            rows={clientes.map(c => ({
              ...c,
              prima: usd(c.prima),
              est: rsbadge(c.est),
              prox_venc: c.prox_venc === '—' ? '—' : (
                <span className={c.prox_venc_sort && c.prox_venc_sort <= new Date(Date.now() + 7*86400000).toISOString().slice(0,10) ? 'text-red-600 font-semibold' : ''}>
                  {c.prox_venc}
                </span>
              ),
              action: (
                <button onClick={() => setSelectedClient(c.id)} className="text-xs text-blue-600 hover:underline font-semibold bg-transparent border-none p-0 cursor-pointer">
                  Ver Historial
                </button>
              )
            }))}
          />
        </>
      )}
    </div>
  )
}

// ── Tab: Métricas de Vehículos ───────────────────────────────
function TabVehiculosMetrics() {
  const { showToast } = useApp()
  const { start, today } = getInitialDates()
  const [fechaInicio, setFechaInicio] = useState(start)
  const [fechaFin, setFechaFin] = useState(today)
  const [search, setSearch] = useState('')
  const [stats, setStats] = useState({ vehiculos_asegurados_periodo: 0, asegurados_esta_semana: 0, distribucion_tipo: {}, distribucion_uso: {} })
  const [vehiculos, setVehiculos] = useState([])
  const [loading, setLoading] = useState(false)

  // Historial de un vehiculo
  const [selectedPlaca, setSelectedPlaca] = useState(null)
  const [vehiculoDetail, setVehiculoDetail] = useState(null)
  const [loadingDetail, setLoadingDetail] = useState(false)

  const loadData = async () => {
    setLoading(true)
    try {
      const data = await fetchVehiculosReport({
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin,
        search: search
      })
      setStats(data.stats || { vehiculos_asegurados_periodo: 0, asegurados_esta_semana: 0, distribucion_tipo: {}, distribucion_uso: {} })
      setVehiculos(data.vehiculos || [])
    } catch (err) {
      showToast('Error al cargar métricas de vehículos', 'error')
    } finally {
      setLoading(false)
    }
  }

  const loadVehiculoDetail = async (placa) => {
    setLoadingDetail(true)
    try {
      const data = await fetchVehiculosReport({
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin,
        placa: placa
      })
      setVehiculoDetail(data)
    } catch (err) {
      showToast('Error al cargar detalle del vehículo', 'error')
    } finally {
      setLoadingDetail(false)
    }
  }

  useEffect(() => {
    if (selectedPlaca) {
      loadVehiculoDetail(selectedPlaca)
    } else {
      loadData()
    }
  }, [fechaInicio, fechaFin, selectedPlaca])

  const handleSearchSubmit = (e) => {
    e?.preventDefault()
    if (!selectedPlaca) loadData()
  }

  if (selectedPlaca && vehiculoDetail) {
    const { vehiculo, propietario, historial } = vehiculoDetail
    return (
      <div>
        <div className="card p-3.5 mb-4 flex items-center gap-3">
          <button onClick={() => { setSelectedPlaca(null); setVehiculoDetail(null) }} className="btn-secondary">
            ← Volver a la lista
          </button>
          <span className="text-sm font-semibold text-slate-700 ml-2">Historial de Vehículo Placa: {vehiculo.placa}</span>
          <span className="text-xs text-slate-400 font-mono ml-auto">Propietario: {propietario.nombre} ({propietario.cedula})</span>
        </div>

        {loadingDetail ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
        ) : (
          <>
            <div className="card p-4 mb-5 border border-slate-100 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm bg-white rounded-xl">
              <div><strong className="text-slate-500">Marca / Modelo:</strong> <p className="font-semibold text-slate-800">{vehiculo.marca} / {vehiculo.modelo}</p></div>
              <div><strong className="text-slate-500">Año / Color:</strong> <p className="font-semibold text-slate-800">{vehiculo.anio} / {vehiculo.color}</p></div>
              <div><strong className="text-slate-500">Uso:</strong> <p className="font-semibold text-slate-800">{vehiculo.uso}</p></div>
              <div><strong className="text-slate-500">Tipo:</strong> <p className="font-semibold text-slate-800">{vehiculo.tipo}</p></div>
              <div><strong className="text-slate-500">Serial de Carrocería:</strong> <p className="font-semibold text-slate-800 font-mono">{vehiculo.serial_carroceria}</p></div>
              <div><strong className="text-slate-500">Serial de Motor:</strong> <p className="font-semibold text-slate-800 font-mono">{vehiculo.serial_motor}</p></div>
            </div>

            <h4 className="font-semibold text-slate-700 mb-3 text-sm">Historial de Pólizas / Coberturas</h4>
            <DataTable
              cols={[
                { k: 'nro_contrato', l: 'Nro. Contrato', m: true },
                { k: 'fecha_emision', l: 'Fecha Emisión' },
                { k: 'fecha_vencimiento', l: 'Fecha Vencimiento', hide: 'sm' },
                { k: 'producto', l: 'Producto', tr: true },
                { k: 'vendedor', l: 'Vendedor/Emisor', hide: 'md' },
                { k: 'total', l: 'Prima USD', r: true },
                { k: 'status', l: 'Estado' }
              ]}
              rows={historial.map(h => ({
                ...h,
                total: usd(h.total),
                status: rsbadge(h.status)
              }))}
            />
          </>
        )}
      </div>
    )
  }

  const tiposTop = Object.entries(stats.distribucion_tipo || {}).sort((a,b)=>b[1]-a[1]).slice(0, 3)
  const usosTop = Object.entries(stats.distribucion_uso || {}).sort((a,b)=>b[1]-a[1]).slice(0, 3)

  return (
    <div>
      <form onSubmit={handleSearchSubmit} className="card p-3.5 mb-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-44">
          <input
            type="text"
            placeholder="Buscar por placa, marca, modelo o propietario..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
        <input
          type="date"
          value={fechaInicio}
          onChange={e => setFechaInicio(e.target.value)}
          className="min-w-0 text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
        />
        <input
          type="date"
          value={fechaFin}
          onChange={e => setFechaFin(e.target.value)}
          className="min-w-0 text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button type="submit" className="btn-primary">Filtrar</button>
      </form>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
            <div className="card p-4 text-center border-t-4 border-t-blue-500">
              <p className="text-xs text-slate-600 uppercase tracking-wide">Vehículos Asegurados</p>
              <p className="text-2xl font-black mt-1 text-slate-800">{stats.vehiculos_asegurados_periodo}</p>
              <p className="text-xs text-slate-400">Pólizas en período</p>
            </div>
            <div className="card p-4 text-center border-t-4 border-t-emerald-500">
              <p className="text-xs text-slate-600 uppercase tracking-wide">Asegurados esta Semana</p>
              <p className="text-2xl font-black mt-1 text-emerald-700">{stats.asegurados_esta_semana}</p>
              <p className="text-xs text-slate-400">Últimos 7 días</p>
            </div>
            <div className="card p-4 border-t-4 border-t-indigo-500">
              <p className="text-xs text-slate-600 uppercase tracking-wide text-center">Top Modelos/Tipos</p>
              <div className="mt-1 text-xs text-slate-700">
                {tiposTop.length > 0 ? tiposTop.map(([tipo, qty]) => (
                  <div key={tipo} className="flex justify-between font-semibold"><span className="capitalize">{tipo}</span><span>{qty} v.</span></div>
                )) : <div className="text-slate-400 text-center py-1">Sin datos</div>}
              </div>
            </div>
            <div className="card p-4 border-t-4 border-t-amber-500">
              <p className="text-xs text-slate-600 uppercase tracking-wide text-center">Top Usos</p>
              <div className="mt-1 text-xs text-slate-700">
                {usosTop.length > 0 ? usosTop.map(([uso, qty]) => (
                  <div key={uso} className="flex justify-between font-semibold"><span className="capitalize">{uso.replace('_',' ')}</span><span>{qty} v.</span></div>
                )) : <div className="text-slate-400 text-center py-1">Sin datos</div>}
              </div>
            </div>
          </div>

          <DataTable
            cols={[
              { k: 'pla', l: 'Placa', m: true },
              { k: 'mar', l: 'Marca' },
              { k: 'mod', l: 'Modelo', tr: true },
              { k: 'ani', l: 'Año', r: true, hide: 'sm' },
              { k: 'col', l: 'Color', hide: 'sm' },
              { k: 'pro', l: 'Propietario', tr: true },
              { k: 'pol', l: 'Última Póliza', m: true, hide: 'md' },
              { k: 'est', l: 'Seguro' },
              { k: 'action', l: 'Historial', acc: true }
            ]}
            rows={vehiculos.map(v => ({
              ...v,
              est: sbadge(v.est === 'Asegurado' ? 'ACTIVA' : 'EXPIRADA'),
              action: (
                <button onClick={() => setSelectedPlaca(v.pla)} className="text-xs text-blue-600 hover:underline font-semibold bg-transparent border-none p-0 cursor-pointer">
                  Ver Historial
                </button>
              )
            }))}
          />
        </>
      )}
    </div>
  )
}

// ── Main Reportes page ───────────────────────────────────────
const TABS = [
  { key: 'ventas',           label: 'Ventas / Comisiones', Icon: TrendingUp,  Component: TabVentas },
  { key: 'oficinas',         label: 'Oficinas',            Icon: Building2,   Component: TabOficinas },
  { key: 'personal',         label: 'Personal',            Icon: Users,       Component: TabPersonal },
  { key: 'usuarios_metrics', label: 'Métricas de Personal',Icon: Users,       Component: TabUsuariosMetrics },
  { key: 'clientes_metrics', label: 'Métricas de Clientes',Icon: Users,       Component: TabClientesMetrics },
  { key: 'vehiculos_metrics',label: 'Métricas de Vehículos',Icon: Car,        Component: TabVehiculosMetrics },
  { key: 'externos',         label: 'Reportes Externos',   Icon: Download,    Component: TabExternos },
  { key: 'automaticos',      label: 'Automáticos',         Icon: RefreshCw,   Component: TabAutomaticos },
]

export default function Reportes() {
  const { canAct, currentUser } = useApp()
  const isVendedor = currentUser?.tipo?.startsWith('Vendedor') || currentUser?.tipo === 'Vendedor' || currentUser?.cargo === 'Agente'

  const activeTabs = isVendedor
    ? TABS.filter(t => t.key === 'ventas')
    : TABS

  const [active, setActive] = useState('ventas')
  const ActiveTab = activeTabs.find(t => t.key === active)?.Component ?? TabVentas

  if (!canAct('reportes', 'view')) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
        <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center">
          <span className="text-2xl">📊</span>
        </div>
        <p className="font-semibold text-slate-600">Sin acceso</p>
        <p className="text-xs text-slate-400">No tienes permiso para acceder a este módulo.</p>
      </div>
    )
  }

  return (
    <div>
      {activeTabs.length > 1 && (
        <div className="flex flex-wrap gap-2 mb-5">
          {activeTabs.map(t => (
            <button key={t.key} onClick={() => setActive(t.key)}
              className={`text-xs px-4 py-2 shrink-0 flex items-center gap-1.5 ${active === t.key ? 'btn-primary' : 'btn-secondary'}`}
            >
              <t.Icon className="w-4 h-4" />{t.key === 'usuarios_metrics' && isVendedor ? 'Mis Métricas' : t.label}
            </button>
          ))}
        </div>
      )}
      <ActiveTab />
    </div>
  )
}
