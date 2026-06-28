import { useState, useEffect } from 'react'

const fmtDT = (s) => {
  if (!s) return '—'
  const d = new Date(s)
  return d.toLocaleDateString('es-VE', { day: '2-digit', month: '2-digit', year: 'numeric' }) +
    ' ' + d.toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit', hour12: false })
}
import { TrendingUp, Building2, Users, Search, Download, Check, Calendar, Loader2, Play, CheckCircle2, Car, Package, Filter, ChevronDown, ChevronUp, AlertTriangle, X, Clock, Bookmark, Trash2 } from 'lucide-react'
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
  fetchOficinasPagos,
  exportVentas,
  exportOficinas,
  exportOficinasPagos,
  marcarRetiroEfectivo,
  fetchUsuariosReport,
  exportUsuariosReport,
  marcarComision,
  pagarLoteComisiones,
  fetchClientesReport,
  fetchVehiculosReport,
  uploadReporteAdjunto
} from '../api/reportes.js'
import { fetchClientes } from '../api/clientes.js'
import { fetchDocumentosCliente } from '../api/clienteDocumentos.js'
import { fetchSolicitudesContacto, actualizarSolicitudContacto } from '../api/solicitudesContacto.js'
import { useApp } from '../context/AppContext.jsx'
import { usd, bs, fmtMonto, badge, rsbadge, sbadge } from '../utils/helpers.jsx'
import DataTable from '../components/DataTable.jsx'
import { Paperclip, FileText, UserSearch, MessageCircle } from 'lucide-react'

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
  const { showToast, showModal, canAct } = useApp()
  const { start, today } = getInitialDates()
  const [fechaInicio, setFechaInicio] = useState(start)
  const [fechaFin, setFechaFin] = useState(today)
  const [search, setSearch] = useState('')
  const [ventas, setVentas] = useState([])
  const [resumen, setResumen] = useState({ comision_generada: 0, comision_pagada: 0, comision_pendiente: 0, pct_pagado: 0 })
  const [loading, setLoading] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [selected, setSelected] = useState(new Set())

  const canExport = canAct('reportes', 'export')
  const canManageComisiones = canAct('reportes', 'manage_comisiones')
  const canRevertirComisiones = canAct('reportes', 'revertir_comisiones')

  const loadData = async () => {
    setLoading(true)
    try {
      const data = await fetchVentasComisiones({
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin,
        search: search
      })
      setVentas(data.ventas || [])
      setResumen(data.resumen || { comision_generada: 0, comision_pagada: 0, comision_pendiente: 0, pct_pagado: 0 })
      setSelected(new Set())
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
        fecha_fin: fechaFin,
        search: search
      })
      downloadBlob(blob, `reporte_ventas_${new Date().toISOString().slice(0, 10)}.xlsx`)
      showToast('Reporte de ventas exportado correctamente', 'success')
    } catch (err) {
      showToast('Error al exportar reporte de ventas', 'error')
    } finally {
      setExporting(false)
    }
  }

  // Pagar es de un solo sentido: pendiente → pagada, con confirmación (y la
  // contraseña del usuario, vía ConfirmActionModal). Revertir una ya pagada
  // es una corrección de errores aparte, solo para quien tenga el permiso
  // `revertir_comisiones` (por defecto, Admin).
  const handleMarcarPagada = (venta) => {
    showModal('confirmAction', {
      title: 'Marcar comisión como pagada',
      message: `¿Confirmas que la comisión de la póliza ${venta.pol} (${usd(venta.comision_monto)}) fue pagada? No podrás revertirlo desde aquí.`,
      confirmLabel: 'Marcar pagada',
      color: 'emerald',
      icon: CheckCircle2,
      onConfirm: async () => {
        await marcarComision(venta.comision_id, 'PAGADA')
        showToast('Comisión marcada como pagada', 'success')
        loadData()
      },
    })
  }

  const handleRevertirComision = (venta) => {
    showModal('confirmAction', {
      title: 'Revertir pago de comisión',
      message: `¿Revertir a pendiente la comisión de la póliza ${venta.pol}? Usa esto solo para corregir un error.`,
      confirmLabel: 'Revertir',
      color: 'amber',
      icon: AlertTriangle,
      onConfirm: async () => {
        await marcarComision(venta.comision_id, 'PENDIENTE')
        showToast('Comisión revertida a pendiente', 'success')
        loadData()
      },
    })
  }

  const toggleSelected = (comisionId) => {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(comisionId) ? next.delete(comisionId) : next.add(comisionId)
      return next
    })
  }

  const handlePagarLote = () => {
    const ids = Array.from(selected)
    const totalLote = ventas
      .filter(v => selected.has(v.comision_id))
      .reduce((sum, v) => sum + (v.comision_monto || 0), 0)
    showModal('confirmAction', {
      title: 'Pagar comisiones seleccionadas',
      message: `Se marcarán ${ids.length} comisiones como pagadas por un total de ${usd(totalLote)}. No podrás revertirlo desde aquí.`,
      confirmLabel: 'Pagar lote',
      color: 'emerald',
      icon: CheckCircle2,
      onConfirm: async () => {
        const res = await pagarLoteComisiones(ids)
        showToast(`${res.pagadas} comisiones marcadas como pagadas`, 'success')
        loadData()
      },
    })
  }

  useEffect(() => {
    loadData()
  }, [fechaInicio, fechaFin])

  // El filtro de texto ya se envía al backend (search) — se vuelve a aplicar
  // aquí mismo solo para que escribir se sienta instantáneo sin esperar la
  // respuesta del servidor en cada tecla.
  const filteredVentas = ventas.filter(v =>
    v.pol.toLowerCase().includes(search.toLowerCase()) ||
    v.agente.toLowerCase().includes(search.toLowerCase()) ||
    v.tipo.toLowerCase().includes(search.toLowerCase())
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
            onKeyDown={e => e.key === 'Enter' && loadData()}
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
          {/* Resumen general: lo generado, lo pagado y lo pendiente de TODOS los vendedores del período filtrado */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
            {[
              { label: 'Comisión Generada', val: usd(resumen.comision_generada), sub: 'Total del período', cls: 'border-t-indigo-500', vcls: 'text-indigo-700' },
              { label: 'Comisión Pagada', val: usd(resumen.comision_pagada), sub: `${resumen.pct_pagado}% del total`, cls: 'border-t-emerald-500', vcls: 'text-emerald-700' },
              { label: 'Comisión Pendiente', val: usd(resumen.comision_pendiente), sub: `${(100 - resumen.pct_pagado).toFixed(1)}% del total`, cls: 'border-t-amber-500', vcls: 'text-amber-700' },
            ].map(c => (
              <div key={c.label} className={`card p-4 text-center border-t-4 ${c.cls}`}>
                <p className="text-xs text-slate-600 uppercase tracking-wide">{c.label}</p>
                <p className={`text-2xl font-black mt-1 ${c.vcls}`}>{c.val}</p>
                <p className="text-xs text-slate-400">{c.sub}</p>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-slate-700 text-sm">Ventas del Período</h4>
            {canManageComisiones && selected.size > 0 && (
              <button
                onClick={handlePagarLote}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 text-xs font-semibold text-white hover:bg-emerald-700 transition whitespace-nowrap"
              >
                <CheckCircle2 className="w-4 h-4 shrink-0" /> Pagar seleccionadas ({selected.size})
              </button>
            )}
          </div>
          <DataTable
            cols={[
              ...(canManageComisiones ? [{ k: 'sel', l: 'Sel.', acc: true }] : []),
              { k: 'fecha', l: 'Fecha',      hide: 'sm' },
              { k: 'pol',   l: 'Póliza',     m: true, hide: 'md' },
              { k: 'agente',l: 'Agente',     tr: true },
              { k: 'tipo',  l: 'Tipo',       hide: 'lg', tr: true },
              { k: 'prima', l: 'Prima Neta', r: true },
              { k: 'est',   l: 'Estado' },
              { k: 'comision_monto', l: 'Comisión (individual)', r: true },
              { k: 'comision_status', l: 'Comisión' },
              ...(canManageComisiones || canRevertirComisiones ? [{ k: 'accion', l: '', acc: true }] : []),
            ]}
            rows={filteredVentas.map(v => ({
              ...v,
              prima: usd(v.prima),
              est: rsbadge(v.est),
              comision_monto: v.comision_monto != null ? `${usd(v.comision_monto)} (${v.comision_tasa_pct}%)` : '—',
              comision_status: v.comision_status
                ? badge(v.comision_status === 'PAGADA' ? 'Pagada' : 'Pendiente', v.comision_status === 'PAGADA' ? 'green' : 'amber')
                : '—',
              sel: v.comision_id && v.comision_status === 'PENDIENTE' && canManageComisiones ? (
                <input
                  type="checkbox"
                  checked={selected.has(v.comision_id)}
                  onChange={() => toggleSelected(v.comision_id)}
                  className="w-4 h-4 accent-jm-blue cursor-pointer"
                />
              ) : null,
              accion: v.comision_id && v.comision_status === 'PENDIENTE' && canManageComisiones ? (
                <button
                  onClick={() => handleMarcarPagada(v)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-xs font-semibold text-emerald-600 hover:bg-emerald-100 transition whitespace-nowrap"
                >
                  Marcar pagada
                </button>
              ) : v.comision_id && v.comision_status === 'PAGADA' && canRevertirComisiones ? (
                <button
                  onClick={() => handleRevertirComision(v)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 text-xs font-semibold text-amber-600 hover:bg-amber-100 transition whitespace-nowrap"
                >
                  Revertir
                </button>
              ) : null,
            }))}
          />
        </>
      )}
    </div>
  )
}

// Modal de notas/documento de entrega para un retiro de efectivo
function RetiroEfectivoModal({ row, fechaInicio, fechaFin, onClose, onSaved }) {
  const { showToast } = useApp()
  const [notas, setNotas] = useState(row.notas || '')
  const [documento, setDocumento] = useState(null)
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      await marcarRetiroEfectivo({
        sede: row.ofi,
        forma_pago: row.forma_pago,
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin,
        retirado: row.retirado,
        notas,
        documento,
      })
      showToast('Retiro de efectivo actualizado', 'success')
      onSaved()
      onClose()
    } catch (err) {
      showToast(err.message || 'Error al guardar el retiro de efectivo', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-[80] flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in duration-200">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{row.ofi}</p>
            <h3 className="text-base font-black text-slate-800">{row.forma_pago}</h3>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-xl transition">
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div>
            <label className="field-label">Notas</label>
            <textarea
              className="input-field text-sm min-h-[90px]"
              value={notas}
              onChange={e => setNotas(e.target.value)}
              placeholder="Observaciones sobre el retiro de efectivo…"
            />
          </div>
          <div>
            <label className="field-label">Documento de entrega</label>
            <input
              type="file"
              onChange={e => setDocumento(e.target.files?.[0] || null)}
              className="input-field text-sm"
            />
            {row.documento_url && !documento && (
              <a
                href={row.documento_url}
                target="_blank"
                rel="noreferrer"
                className="mt-1.5 inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
              >
                <Paperclip className="w-3.5 h-3.5" /> {row.documento_nombre || 'Ver documento actual'}
              </a>
            )}
          </div>
        </div>
        <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-2 shrink-0">
          <button onClick={onClose} className="btn-secondary">Cancelar</button>
          <button onClick={handleSave} disabled={saving} className="btn-primary">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Guardar'}
          </button>
        </div>
      </div>
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

  const [pagosRows, setPagosRows] = useState([])
  const [pagosLoading, setPagosLoading] = useState(false)
  const [pagosExporting, setPagosExporting] = useState(false)
  const [retiroEdit, setRetiroEdit] = useState(null)

  const canExport = canAct('reportes', 'export')
  const canManageOficinas = canAct('reportes', 'manage_oficinas')

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

  const loadPagosData = async () => {
    setPagosLoading(true)
    try {
      const data = await fetchOficinasPagos({ fecha_inicio: fechaInicio, fecha_fin: fechaFin })
      setPagosRows(data || [])
    } catch (err) {
      showToast('Error al cargar reporte de pólizas cobradas', 'error')
    } finally {
      setPagosLoading(false)
    }
  }

  const handleToggleRetirado = async (row) => {
    try {
      await marcarRetiroEfectivo({
        sede: row.ofi,
        forma_pago: row.forma_pago,
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin,
        retirado: !row.retirado,
        notas: row.notas,
      })
      showToast(row.retirado ? 'Marcado como pendiente de retiro' : 'Efectivo marcado como retirado', 'success')
      loadPagosData()
    } catch (err) {
      showToast(err.message || 'Error al actualizar el retiro de efectivo', 'error')
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

  const handleExportPagos = async () => {
    setPagosExporting(true)
    showToast('Exportando pólizas cobradas…', 'info')
    try {
      const blob = await exportOficinasPagos({
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin
      })
      downloadBlob(blob, `reporte_oficinas_pagos_${new Date().toISOString().slice(0, 10)}.xlsx`)
      showToast('Pólizas cobradas exportadas correctamente', 'success')
    } catch (err) {
      showToast('Error al exportar pólizas cobradas', 'error')
    } finally {
      setPagosExporting(false)
    }
  }

  useEffect(() => {
    loadData()
    loadPagosData()
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

      <div className="flex items-center justify-between mt-6 mb-3">
        <h3 className="text-sm font-semibold text-slate-700">Pólizas cobradas por forma de pago</h3>
        {canExport && (
          <button
            onClick={handleExportPagos}
            disabled={pagosExporting}
            className="btn-secondary shrink-0"
          >
            {pagosExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            Exportar
          </button>
        )}
      </div>

      {pagosLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        </div>
      ) : (
        <DataTable
          cols={[
            { k: 'ofi',        l: 'Oficina',          tr: true },
            { k: 'forma_pago', l: 'Forma de Pago' },
            { k: 'pol',        l: 'Pólizas Cobradas', r: true },
            { k: 'prima',      l: 'Prima Neta',       r: true, hide: 'sm' },
            { k: 'retirado',   l: 'Efectivo Retirado' },
            ...(canManageOficinas ? [{ k: 'acciones', l: '', acc: true }] : []),
          ]}
          rows={pagosRows.map(r => {
            const esEfectivo = r.retirado !== undefined
            return {
              ...r,
              prima: usd(r.prima),
              retirado: esEfectivo ? (r.retirado ? badge('Retirado', 'green') : badge('Pendiente', 'amber')) : '—',
              acciones: esEfectivo && canManageOficinas ? (
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleToggleRetirado(r)}
                    className={`text-xs font-semibold px-2.5 py-1 rounded-lg transition whitespace-nowrap ${
                      r.retirado ? 'bg-amber-50 text-amber-600 hover:bg-amber-100' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                    }`}
                  >
                    {r.retirado ? 'Marcar pendiente' : 'Marcar retirado'}
                  </button>
                  <button
                    onClick={() => setRetiroEdit(r)}
                    title="Notas / documento de entrega"
                    className="p-1.5 rounded-lg hover:bg-slate-100 transition"
                  >
                    <Paperclip className={`w-4 h-4 ${r.documento_url ? 'text-blue-600' : 'text-slate-400'}`} />
                  </button>
                </div>
              ) : null,
            }
          })}
        />
      )}

      {retiroEdit && (
        <RetiroEfectivoModal
          row={retiroEdit}
          fechaInicio={fechaInicio}
          fechaFin={fechaFin}
          onClose={() => setRetiroEdit(null)}
          onSaved={loadPagosData}
        />
      )}
    </div>
  )
}

// ── Tab: Automáticos ─────────────────────────────────────────
const FRECUENCIAS = [
  { v: 'diario',     l: 'Diario' },
  { v: 'semanal',    l: 'Semanal' },
  { v: 'mensual',    l: 'Mensual' },
  { v: 'trimestral', l: 'Trimestral' },
]

/**
 * Tarjeta reutilizable para gestionar programaciones de envío automático
 * de reportes externos. Cada programación agrupa varios destinatarios, y
 * cada destinatario tiene su PROPIA frecuencia — el mismo reporte puede
 * llegarle a uno todos los días y a otro solo una vez al mes.
 */
function SchedulesManager({ title, hint, schedules, setSchedules, canManage, saving, onSave, runningSchedId, onRun, tipoOptions = null }) {
  const { showToast } = useApp()
  const [nuevoEmail, setNuevoEmail] = useState({})       // { [scheduleId]: 'texto en el input' }
  const [nuevaFrecuencia, setNuevaFrecuencia] = useState({}) // { [scheduleId]: 'diario' }
  const [uploadingId, setUploadingId] = useState(null)

  const updateSchedule = (id, field, value) => {
    setSchedules(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s))
  }

  const addSchedule = () => {
    setSchedules(prev => [...prev, {
      id: `tmp-${Date.now()}`,
      nombre: 'Nuevo Reporte',
      hora: '08:00',
      tipo: 'ventas',
      activo: true,
      destinatarios: [],
      documentos_adicionales: [],
      cliente_documento_ids: [],
      cliente_documentos_info: [],
    }])
  }

  const deleteSchedule = (id) => {
    setSchedules(prev => prev.filter(s => s.id !== id))
  }

  const addDestinatario = (schedId) => {
    const email = (nuevoEmail[schedId] || '').trim()
    if (!email) return
    const frecuencia = nuevaFrecuencia[schedId] || 'diario'
    setSchedules(prev => prev.map(s => s.id === schedId
      ? { ...s, destinatarios: [...(s.destinatarios || []), { id: `tmp-${Date.now()}`, email, frecuencia, activo: true }] }
      : s
    ))
    setNuevoEmail(p => ({ ...p, [schedId]: '' }))
  }

  const updateDestinatario = (schedId, destId, field, value) => {
    setSchedules(prev => prev.map(s => s.id !== schedId ? s : {
      ...s,
      destinatarios: s.destinatarios.map(d => d.id === destId ? { ...d, [field]: value } : d),
    }))
  }

  const deleteDestinatario = (schedId, destId) => {
    setSchedules(prev => prev.map(s => s.id !== schedId ? s : {
      ...s,
      destinatarios: s.destinatarios.filter(d => d.id !== destId),
    }))
  }

  const handleUpload = async (schedId, file) => {
    if (!file) return
    setUploadingId(schedId)
    try {
      const subido = await uploadReporteAdjunto(file)
      setSchedules(prev => prev.map(s => s.id !== schedId ? s : {
        ...s,
        documentos_adicionales: [...(s.documentos_adicionales || []), subido],
      }))
      showToast('Documento adjuntado. Recuerda Guardar Configuración.', 'success')
    } catch (err) {
      showToast(err.message || 'Error al subir el documento', 'error')
    } finally {
      setUploadingId(null)
    }
  }

  const removeAdjunto = (schedId, idx) => {
    setSchedules(prev => prev.map(s => s.id !== schedId ? s : {
      ...s,
      documentos_adicionales: (s.documentos_adicionales || []).filter((_, i) => i !== idx),
    }))
  }

  const addClienteDocumento = (schedId, doc, clienteNombre) => {
    setSchedules(prev => prev.map(s => {
      if (s.id !== schedId) return s
      if ((s.cliente_documento_ids || []).includes(doc.id)) return s
      return {
        ...s,
        cliente_documento_ids: [...(s.cliente_documento_ids || []), doc.id],
        cliente_documentos_info: [...(s.cliente_documentos_info || []), { id: doc.id, nombre: doc.nombre, cliente_nombre: clienteNombre }],
      }
    }))
  }

  const removeClienteDocumento = (schedId, docId) => {
    setSchedules(prev => prev.map(s => s.id !== schedId ? s : {
      ...s,
      cliente_documento_ids: (s.cliente_documento_ids || []).filter(id => id !== docId),
      cliente_documentos_info: (s.cliente_documentos_info || []).filter(d => d.id !== docId),
    }))
  }

  return (
    <div className="card p-6">
      <h4 className="font-semibold text-slate-800 mb-1 text-sm">{title}</h4>
      {hint && <p className="text-xs text-slate-400 mb-5">{hint}</p>}

      <div className="space-y-4">
        {schedules.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
            <Calendar className="w-8 h-8 text-slate-300 mb-2" />
            <p className="text-sm font-medium text-slate-500">Sin programaciones configuradas</p>
          </div>
        )}

        {schedules.map(sched => (
          <div key={sched.id} className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 space-y-3">
            {/* ── Cabecera: nombre, hora, activo, eliminar ── */}
            <div className="flex items-start justify-between gap-2 flex-wrap">
              <div className={`flex-1 min-w-[160px] grid grid-cols-1 sm:grid-cols-2 gap-2 ${tipoOptions ? 'lg:grid-cols-3' : ''}`}>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Nombre</label>
                  <input
                    type="text"
                    value={sched.nombre}
                    onChange={e => updateSchedule(sched.id, 'nombre', e.target.value)}
                    disabled={!canManage}
                    className="w-full px-2.5 py-1.5 text-sm border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-blue-500 bg-white disabled:opacity-50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Hora de revisión</label>
                  <input
                    type="time"
                    value={sched.hora}
                    onChange={e => updateSchedule(sched.id, 'hora', e.target.value)}
                    disabled={!canManage}
                    className="w-full px-2.5 py-1.5 text-sm border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-blue-500 bg-white disabled:opacity-50"
                  />
                </div>
                {tipoOptions && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Contenido a reportar</label>
                    <select
                      value={sched.tipo || 'ventas'}
                      onChange={e => updateSchedule(sched.id, 'tipo', e.target.value)}
                      disabled={!canManage}
                      className="w-full px-2.5 py-1.5 text-sm border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-blue-500 bg-white disabled:opacity-50"
                    >
                      {tipoOptions.map(t => <option key={t.v} value={t.v}>{t.l}</option>)}
                    </select>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-3 mt-5">
                {canManage && (
                  <button
                    onClick={() => onRun(sched.id)}
                    disabled={runningSchedId === sched.id || String(sched.id).startsWith('tmp-')}
                    title={String(sched.id).startsWith('tmp-') ? 'Guarda primero para poder ejecutar' : 'Enviar ahora a todos los destinatarios activos'}
                    className="text-xs btn-secondary px-2.5 py-1.5 flex items-center gap-1 disabled:opacity-40"
                  >
                    {runningSchedId === sched.id
                      ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      : <Play className="w-3.5 h-3.5 text-emerald-600 fill-emerald-600" />}
                    Ejecutar ahora
                  </button>
                )}
                <div className="toggle-wrap">
                  <input
                    type="checkbox"
                    checked={!!sched.activo}
                    onChange={() => updateSchedule(sched.id, 'activo', !sched.activo)}
                    disabled={!canManage}
                    className="toggle-input"
                    id={`toggle-${sched.id}`}
                  />
                  <label htmlFor={`toggle-${sched.id}`} className="toggle-track" />
                </div>
                {canManage && (
                  <button
                    onClick={() => deleteSchedule(sched.id)}
                    className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title="Eliminar programación"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* ── Destinatarios: cada uno con su propia frecuencia ── */}
            <div className="pt-2 border-t border-slate-100">
              <p className="text-xs font-semibold text-slate-500 mb-2">Destinatarios</p>
              {(sched.destinatarios || []).length === 0 && (
                <p className="text-xs text-slate-400 mb-2">Aún no hay correos asignados a este reporte.</p>
              )}
              <div className="space-y-1.5">
                {(sched.destinatarios || []).map(d => (
                  <div key={d.id} className="flex items-center gap-2 bg-white rounded-lg border border-slate-200 px-2.5 py-1.5">
                    <span className="flex-1 text-xs font-mono text-slate-700 truncate">{d.email}</span>
                    <select
                      value={d.frecuencia}
                      onChange={e => updateDestinatario(sched.id, d.id, 'frecuencia', e.target.value)}
                      disabled={!canManage}
                      className="text-xs border border-slate-200 rounded-lg px-1.5 py-1 bg-white disabled:opacity-50"
                    >
                      {FRECUENCIAS.map(f => <option key={f.v} value={f.v}>{f.l}</option>)}
                    </select>
                    {d.ultimo_envio && (
                      <span className="text-[10px] text-blue-600 font-medium whitespace-nowrap hidden sm:inline">
                        Últ: {fmtDT(d.ultimo_envio)}
                      </span>
                    )}
                    <div className="toggle-wrap shrink-0">
                      <input
                        type="checkbox"
                        checked={!!d.activo}
                        onChange={() => updateDestinatario(sched.id, d.id, 'activo', !d.activo)}
                        disabled={!canManage}
                        className="toggle-input"
                        id={`dest-toggle-${d.id}`}
                      />
                      <label htmlFor={`dest-toggle-${d.id}`} className="toggle-track" />
                    </div>
                    {canManage && (
                      <button onClick={() => deleteDestinatario(sched.id, d.id)} className="p-1 text-slate-400 hover:text-red-500 shrink-0">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {canManage && (
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <input
                    type="email"
                    placeholder="correo@empresa.com"
                    value={nuevoEmail[sched.id] || ''}
                    onChange={e => setNuevoEmail(p => ({ ...p, [sched.id]: e.target.value }))}
                    onKeyDown={e => e.key === 'Enter' && addDestinatario(sched.id)}
                    className="flex-1 min-w-[160px] px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                  />
                  <select
                    value={nuevaFrecuencia[sched.id] || 'diario'}
                    onChange={e => setNuevaFrecuencia(p => ({ ...p, [sched.id]: e.target.value }))}
                    className="text-xs border border-slate-200 rounded-lg px-1.5 py-1.5 bg-white"
                  >
                    {FRECUENCIAS.map(f => <option key={f.v} value={f.v}>{f.l}</option>)}
                  </select>
                  <button onClick={() => addDestinatario(sched.id)} className="btn-secondary text-xs px-2.5 py-1.5 flex items-center gap-1">
                    <span className="text-base leading-none">+</span> Agregar correo
                  </button>
                </div>
              )}
            </div>

            {/* ── Documentos adicionales: archivos sueltos para esta programación ── */}
            <div className="pt-2 border-t border-slate-100">
              <p className="text-xs font-semibold text-slate-500 mb-2">Documentos adicionales a enviar</p>
              {(sched.documentos_adicionales || []).length === 0 && (
                <p className="text-xs text-slate-400 mb-2">Sin documentos adicionales.</p>
              )}
              <div className="space-y-1.5 mb-2">
                {(sched.documentos_adicionales || []).map((doc, idx) => (
                  <div key={idx} className="flex items-center gap-2 bg-white rounded-lg border border-slate-200 px-2.5 py-1.5">
                    <Paperclip className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="flex-1 text-xs text-slate-700 truncate">{doc.nombre}</span>
                    {canManage && (
                      <button onClick={() => removeAdjunto(sched.id, idx)} className="p-1 text-slate-400 hover:text-red-500 shrink-0">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              {canManage && (
                <label className={`btn-secondary text-xs px-2.5 py-1.5 inline-flex items-center gap-1 cursor-pointer ${uploadingId === sched.id ? 'opacity-50 pointer-events-none' : ''}`}>
                  {uploadingId === sched.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <span className="text-base leading-none">+</span>}
                  Adjuntar documento
                  <input type="file" className="hidden" onChange={e => handleUpload(sched.id, e.target.files?.[0])} />
                </label>
              )}
            </div>

            {/* ── Documentos de un cliente: adjunta algo ya subido al perfil de un cliente ── */}
            <div className="pt-2 border-t border-slate-100">
              <p className="text-xs font-semibold text-slate-500 mb-2">Documentos de un cliente a enviar</p>
              {(sched.cliente_documentos_info || []).length === 0 && (
                <p className="text-xs text-slate-400 mb-2">Sin documentos de clientes seleccionados.</p>
              )}
              <div className="space-y-1.5 mb-2">
                {(sched.cliente_documentos_info || []).map(doc => (
                  <div key={doc.id} className="flex items-center gap-2 bg-white rounded-lg border border-slate-200 px-2.5 py-1.5">
                    <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="flex-1 text-xs text-slate-700 truncate">{doc.nombre} <span className="text-slate-400">— {doc.cliente_nombre}</span></span>
                    {canManage && (
                      <button onClick={() => removeClienteDocumento(sched.id, doc.id)} className="p-1 text-slate-400 hover:text-red-500 shrink-0">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              {canManage && (
                <ClienteDocPicker
                  excludeIds={sched.cliente_documento_ids || []}
                  onPick={(doc, clienteNombre) => addClienteDocumento(sched.id, doc, clienteNombre)}
                />
              )}
            </div>
          </div>
        ))}

        {canManage && (
          <div className="flex items-center gap-3 pt-1">
            <button onClick={addSchedule} className="btn-secondary flex items-center gap-1.5 text-sm">
              <span className="text-base leading-none">+</span> Agregar Programación
            </button>
            <button onClick={onSave} disabled={saving} className="btn-primary flex items-center gap-1.5">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              Guardar Configuración
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * Busca un cliente por nombre/CI y muestra sus documentos ya subidos para
 * poder elegir cuáles adjuntar a una programación de reportes.
 */
function ClienteDocPicker({ excludeIds, onPick }) {
  const [clientes, setClientes] = useState([])
  const [query, setQuery] = useState('')
  const [cliente, setCliente] = useState(null)
  const [docs, setDocs] = useState([])
  const [loadingDocs, setLoadingDocs] = useState(false)

  useEffect(() => { fetchClientes().then(setClientes).catch(() => {}) }, [])

  const results = query.trim()
    ? clientes.filter(c =>
        c.nom.toLowerCase().includes(query.toLowerCase()) || c.ci.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 6)
    : []

  const selectCliente = async (c) => {
    setCliente(c); setQuery(''); setLoadingDocs(true)
    try {
      setDocs(await fetchDocumentosCliente(c.id))
    } catch {
      setDocs([])
    } finally {
      setLoadingDocs(false)
    }
  }

  return (
    <div className="space-y-2">
      {!cliente ? (
        <div className="relative">
          <UserSearch className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar cliente por nombre o cédula…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full pl-8 pr-2.5 py-1.5 text-xs border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-blue-500 bg-white"
          />
          {results.length > 0 && (
            <div className="absolute z-10 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden">
              {results.map(c => (
                <button key={c.id} type="button" onClick={() => selectCliente(c)}
                  className="w-full flex items-center justify-between gap-2 px-3 py-2 text-xs hover:bg-slate-50 text-left border-b border-slate-50 last:border-0">
                  <span className="font-medium text-slate-700 truncate">{c.nom}</span>
                  <span className="text-slate-400 font-mono shrink-0">{c.ci}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-lg p-2.5">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-xs font-semibold text-slate-700 truncate">{cliente.nom}</span>
            <button type="button" onClick={() => { setCliente(null); setDocs([]) }} className="text-slate-400 hover:text-red-500">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          {loadingDocs ? (
            <div className="flex items-center gap-2 text-xs text-slate-400 py-1">
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Cargando documentos…
            </div>
          ) : docs.length === 0 ? (
            <p className="text-xs text-slate-400">Este cliente no tiene documentos subidos.</p>
          ) : (
            <div className="space-y-1">
              {docs.map(d => {
                const yaElegido = excludeIds.includes(d.id)
                return (
                  <button
                    key={d.id}
                    type="button"
                    disabled={yaElegido}
                    onClick={() => onPick(d, cliente.nom)}
                    className="w-full flex items-center gap-2 px-2 py-1.5 text-xs rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-left"
                  >
                    <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="flex-1 truncate">{d.nombre}</span>
                    {yaElegido && <span className="text-[10px] text-emerald-600 font-semibold shrink-0">Agregado</span>}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Tab: Solicitudes de Contacto (leads del chatbot del portal) ─────────────
/**
 * El chatbot del portal público (FrontEnd_Clientes) captura el correo y
 * motivo (cotizar/póliza/siniestro/técnico) de quien quiere ser contactado,
 * pero hasta ahora esas solicitudes solo quedaban en la tabla
 * solicitudes_contacto sin ninguna vista — nadie las veía ni las marcaba
 * como atendidas.
 */
const MOTIVO_LABEL = { cotizar: 'Cotizar', poliza: 'Consulta de póliza', siniestro: 'Siniestro', tecnico: 'Soporte técnico' }

function TabLeads() {
  const { showToast, canAct } = useApp()
  const canManage = canAct('reportes', 'manage_leads')
  const [items, setItems]     = useState([])
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro]   = useState('pendiente')

  const load = async () => {
    setLoading(true)
    try {
      const data = await fetchSolicitudesContacto(filtro ? { status: filtro } : {})
      setItems(data.data || [])
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [filtro])

  const marcar = async (id, status) => {
    try {
      await actualizarSolicitudContacto(id, status)
      showToast(status === 'atendido' ? 'Marcada como atendida' : 'Reabierta', 'success')
      load()
    } catch (err) {
      showToast(err.message, 'error')
    }
  }

  const rows = items.map(s => ({
    id: s.id,
    fecha: fmtDT(s.created_at),
    email: s.email,
    motivo: badge(MOTIVO_LABEL[s.motivo] ?? s.motivo, s.motivo === 'siniestro' ? 'red' : s.motivo === 'tecnico' ? 'amber' : 'blue'),
    destino: s.destino === 'tecnico' ? 'Soporte técnico' : 'Asesor comercial',
    status: s.status === 'atendido' ? badge('Atendido', 'green') : badge('Pendiente', 'amber'),
    accion: canManage && (
      <button
        onClick={() => marcar(s.id, s.status === 'atendido' ? 'pendiente' : 'atendido')}
        className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition ${s.status === 'atendido' ? 'bg-slate-100 text-slate-500 hover:bg-slate-200' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'}`}
        title={s.status === 'atendido' ? 'Reabrir solicitud' : 'Marcar como atendida'}
      >
        {s.status === 'atendido' ? 'Reabrir' : 'Marcar atendida'}
      </button>
    ),
  }))

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-4">
        {[['pendiente', 'Pendientes'], ['atendido', 'Atendidas'], ['', 'Todas']].map(([val, label]) => (
          <button
            key={label}
            onClick={() => setFiltro(val)}
            className={`text-xs font-semibold px-3 py-1.5 rounded-xl border transition ${filtro === val ? 'bg-jm-blue text-white border-jm-blue' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'}`}
          >
            {label}
          </button>
        ))}
      </div>
      <DataTable
        searchable
        loading={loading}
        cols={[
          { k: 'fecha',   l: 'Fecha/Hora', nw: true },
          { k: 'email',   l: 'Correo',     tr: true },
          { k: 'motivo',  l: 'Motivo' },
          { k: 'destino', l: 'Se dirige a', hide: 'sm' },
          { k: 'status',  l: 'Estado' },
          { k: 'accion',  l: '', acc: true },
        ]}
        rows={rows}
      />
    </div>
  )
}

// ── Tab: Reportes Externos (Carga Masiva) ───────────────────
function TabExternos() {
  const { showToast, API_BASE_URL, canAct } = useApp()
  const canManage = canAct('reportes', 'manage_schedules')
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
      const payload = schedules.map(s => ({
        id: String(s.id).startsWith('tmp-') ? undefined : s.id,
        activo: !!s.activo,
        hora: s.hora,
        nombre: s.nombre,
        documentos_adicionales: s.documentos_adicionales || [],
        cliente_documento_ids: s.cliente_documento_ids || [],
        destinatarios: (s.destinatarios || []).map(d => ({
          id: String(d.id).startsWith('tmp-') ? undefined : d.id,
          email: d.email,
          frecuencia: d.frecuencia,
          activo: !!d.activo,
        })),
      }))
      await saveExternalReportSchedules(payload)
      showToast('Programaciones guardadas con éxito', 'success')
      loadSchedules()
    } catch (err) {
      showToast(err.message || 'Error al guardar programaciones', 'error')
    } finally {
      setSavingSchedules(false)
    }
  }

  const handleRunNow = async (id) => {
    setRunningSchedId(id)
    showToast('Ejecutando programación de reporte...', 'info')
    try {
      const res = await runExternalReportSchedule(id)
      showToast(`Reporte enviado a ${res.enviados ?? 0} destinatario(s)`, 'success')
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
    { k: 'bien',         l: 'Bienes' },
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
    bien: p.bien,
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
        {loadingSchedules ? (
          <div className="card p-6 flex items-center justify-center py-6">
            <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
          </div>
        ) : (
          <SchedulesManager
            title="Programación de Reportes Externos"
            hint="Reportes masivos de pólizas que se generan y envían automáticamente por período."
            schedules={schedules}
            setSchedules={setSchedules}
            canManage={canManage}
            saving={savingSchedules}
            onSave={handleSaveSchedules}
            runningSchedId={runningSchedId}
            onRun={handleRunNow}
          />
        )}

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
  const { showToast, showModal, currentUser, canAct } = useApp()
  // Sin este permiso, el usuario solo puede ver sus propias métricas — no
  // se ata al rol (un Admin lo puede otorgar/quitar a quien quiera).
  const canViewTodos = canAct('reportes', 'view_metrics_personal_todos')
  const canExport = canAct('reportes', 'export')
  const canManageComisiones = canAct('reportes', 'manage_comisiones')
  const canRevertirComisiones = canAct('reportes', 'revertir_comisiones')
  const { start, today } = getInitialDates()
  const [fechaInicio, setFechaInicio] = useState(start)
  const [fechaFin, setFechaFin] = useState(today)
  const [search, setSearch] = useState('')
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [exporting, setExporting] = useState(false)

  // Para ver el detalle de un usuario
  const [selectedUser, setSelectedUser] = useState(null)
  const [detailData, setDetailData] = useState(null)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [selected, setSelected] = useState(new Set())

  const loadData = async () => {
    setLoading(true)
    try {
      const data = await fetchUsuariosReport({
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin,
        search: search
      })
      // El backend devuelve un objeto de detalle (no una lista) cuando el
      // usuario no tiene view_metrics_personal_todos; nunca debe entrar a rows.
      setRows(Array.isArray(data) ? data : [])
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
      setSelected(new Set())
    } catch (err) {
      showToast('Error al cargar detalle del usuario', 'error')
    } finally {
      setLoadingDetail(false)
    }
  }

  useEffect(() => {
    if (!canViewTodos && currentUser?.id) {
      setSelectedUser(currentUser.id)
    }
  }, [canViewTodos, currentUser, selectedUser])

  useEffect(() => {
    if (selectedUser) {
      loadUserDetail(selectedUser)
    } else if (canViewTodos) {
      // Solo quien ve todos carga el listado. Sin ese permiso, el efecto de
      // arriba fija selectedUser = su propio id y se carga el detalle — el
      // backend devuelve el DETALLE (no una lista) y romper aquí causaba el
      // crash de la sección al entrar como vendedor.
      loadData()
    }
  }, [fechaInicio, fechaFin, selectedUser, canViewTodos])

  const handleSearchSubmit = (e) => {
    e?.preventDefault()
    if (!selectedUser) loadData()
  }

  const handleExport = async () => {
    setExporting(true)
    showToast('Exportando métricas de personal…', 'info')
    try {
      const blob = await exportUsuariosReport({
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin,
        ...(selectedUser ? { usuario_id: selectedUser } : { search })
      })
      downloadBlob(blob, `metricas_personal_${new Date().toISOString().slice(0, 10)}.xlsx`)
      showToast('Métricas de personal exportadas correctamente', 'success')
    } catch (err) {
      showToast(err.message || 'Error al exportar métricas de personal', 'error')
    } finally {
      setExporting(false)
    }
  }

  const handleMarcarPagada = (poliza) => {
    showModal('confirmAction', {
      title: 'Marcar comisión como pagada',
      message: `¿Confirmas que la comisión de la póliza ${poliza.nro_contrato} (${usd(poliza.comision_monto)}) fue pagada? No podrás revertirlo desde aquí.`,
      confirmLabel: 'Marcar pagada',
      color: 'emerald',
      icon: CheckCircle2,
      onConfirm: async () => {
        await marcarComision(poliza.comision_id, 'PAGADA')
        showToast('Comisión marcada como pagada', 'success')
        loadUserDetail(selectedUser)
      },
    })
  }

  const handleRevertirComision = (poliza) => {
    showModal('confirmAction', {
      title: 'Revertir pago de comisión',
      message: `¿Revertir a pendiente la comisión de la póliza ${poliza.nro_contrato}? Usa esto solo para corregir un error.`,
      confirmLabel: 'Revertir',
      color: 'amber',
      icon: AlertTriangle,
      onConfirm: async () => {
        await marcarComision(poliza.comision_id, 'PENDIENTE')
        showToast('Comisión revertida a pendiente', 'success')
        loadUserDetail(selectedUser)
      },
    })
  }

  const toggleSelected = (comisionId) => {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(comisionId) ? next.delete(comisionId) : next.add(comisionId)
      return next
    })
  }

  const handlePagarLote = (polizas) => {
    const ids = Array.from(selected)
    const totalLote = polizas
      .filter(p => selected.has(p.comision_id))
      .reduce((sum, p) => sum + (p.comision_monto || 0), 0)
    showModal('confirmAction', {
      title: 'Pagar comisiones seleccionadas',
      message: `Se marcarán ${ids.length} comisiones como pagadas por un total de ${usd(totalLote)}. No podrás revertirlo desde aquí.`,
      confirmLabel: 'Pagar lote',
      color: 'emerald',
      icon: CheckCircle2,
      onConfirm: async () => {
        const res = await pagarLoteComisiones(ids)
        showToast(`${res.pagadas} comisiones marcadas como pagadas`, 'success')
        loadUserDetail(selectedUser)
      },
    })
  }

  // Pagar de una vez todas las comisiones pendientes de un vendedor, desde
  // la fila resumen del listado (sin entrar al detalle).
  const handlePagarPendientesVendedor = (row) => {
    const ids = row.comision_ids_pendientes || []
    if (ids.length === 0) return
    showModal('confirmAction', {
      title: 'Pagar comisiones pendientes',
      message: `Se marcarán ${ids.length} comisiones de ${row.nom} como pagadas por un total de ${usd(row.com_pend)}. No podrás revertirlo desde aquí.`,
      confirmLabel: 'Pagar pendientes',
      color: 'emerald',
      icon: CheckCircle2,
      onConfirm: async () => {
        const res = await pagarLoteComisiones(ids)
        showToast(`${res.pagadas} comisiones de ${row.nom} marcadas como pagadas`, 'success')
        loadData()
      },
    })
  }

  if (selectedUser && detailData) {
    const { usuario, stats, polizas } = detailData
    return (
      <div>
        <div className="card p-3.5 mb-4 flex items-center gap-3">
          {canViewTodos && (
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
            {canExport && (
              <button onClick={handleExport} disabled={exporting} className="btn-secondary shrink-0">
                {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                Exportar
              </button>
            )}
          </div>
        </div>

        {loadingDetail ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-3">
              {[
                { label: 'Pólizas Emitidas', val: stats.total_polizas, sub: 'Ventas del período', cls: 'border-t-blue-500', vcls: 'text-slate-800' },
                { label: 'Prima Emitida', val: usd(stats.total_prima), sub: 'USD equivalente', cls: 'border-t-emerald-500', vcls: 'text-emerald-700' },
                { label: 'Comisión Generada', val: usd(stats.comision_generada), sub: `${usuario.cargo === 'Agente' ? '10%' : '5%'} de base`, cls: 'border-t-indigo-500', vcls: 'text-indigo-700' },
                { label: 'Comisión Pendiente', val: usd(stats.comision_pendiente), sub: `Pagada: ${usd(stats.comision_pagada)}`, cls: 'border-t-amber-500', vcls: 'text-amber-700' },
              ].map(c => (
                <div key={c.label} className={`card p-4 text-center border-t-4 ${c.cls}`}>
                  <p className="text-xs text-slate-600 uppercase tracking-wide">{c.label}</p>
                  <p className={`text-2xl font-black mt-1 ${c.vcls}`}>{c.val}</p>
                  <p className="text-xs text-slate-400">{c.sub}</p>
                </div>
              ))}
            </div>

            {/* Prima por moneda nativa — sin convertir, a diferencia del total USD de arriba */}
            {Object.keys(stats.primas_por_moneda || {}).length > 0 && (
              <div className="card p-3 mb-4 border border-slate-100 flex flex-wrap gap-x-6 gap-y-1.5 text-sm bg-white rounded-xl">
                <span className="text-xs text-slate-400 uppercase tracking-wide font-semibold">Prima por moneda (sin convertir):</span>
                {Object.entries(stats.primas_por_moneda).map(([moneda, d]) => (
                  <span key={moneda} className="text-sm">
                    <strong className="text-slate-700">{fmtMonto(d.monto, moneda)}</strong>
                    <span className="text-slate-400"> ({d.polizas} póliza{d.polizas === 1 ? '' : 's'})</span>
                  </span>
                ))}
              </div>
            )}

            <div className="card p-4 mb-4 border border-slate-100 flex flex-wrap gap-x-8 gap-y-2 text-sm bg-white rounded-xl">
              <div><strong className="text-slate-500">Usuario:</strong> <span className="font-semibold text-slate-800">{usuario.nick}</span></div>
              <div><strong className="text-slate-500">Cargo:</strong> <span className="font-semibold text-slate-800">{usuario.cargo}</span></div>
              <div><strong className="text-slate-500">Sede:</strong> <span className="font-semibold text-slate-800">{usuario.sede ?? 'Sede Central'}</span></div>
              <div><strong className="text-slate-500">Estado:</strong> <span className="font-semibold text-slate-800">{usuario.activo ? 'Activo' : 'Inactivo'}</span></div>
            </div>

            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-slate-700 text-sm">Pólizas Vendidas</h4>
              {canManageComisiones && selected.size > 0 && (
                <button
                  onClick={() => handlePagarLote(polizas)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 text-xs font-semibold text-white hover:bg-emerald-700 transition whitespace-nowrap"
                >
                  <CheckCircle2 className="w-4 h-4 shrink-0" /> Pagar seleccionadas ({selected.size})
                </button>
              )}
            </div>
            <DataTable
              cols={[
                ...(canManageComisiones ? [{ k: 'sel', l: 'Sel.', acc: true }] : []),
                { k: 'fecha_emision', l: 'Fecha Emisión' },
                { k: 'nro_contrato', l: 'Nro. Contrato', m: true },
                { k: 'cliente_nombre', l: 'Asegurado/Cliente', tr: true },
                { k: 'producto_nombre', l: 'Producto' },
                { k: 'total', l: 'Prima', r: true },
                { k: 'status', l: 'Estado' },
                { k: 'comision_monto', l: 'Comisión', r: true },
                { k: 'comision_status', l: 'Estado Comisión' },
                ...(canManageComisiones || canRevertirComisiones ? [{ k: 'accion', l: '', acc: true }] : []),
              ]}
              rows={polizas.map(p => ({
                ...p,
                total: fmtMonto(p.total, p.moneda_producto),
                status: rsbadge(p.status),
                comision_monto: p.comision_monto != null ? usd(p.comision_monto) : '—',
                comision_status: p.comision_status
                  ? badge(p.comision_status === 'PAGADA' ? 'Pagada' : 'Pendiente', p.comision_status === 'PAGADA' ? 'green' : 'amber')
                  : '—',
                sel: p.comision_id && p.comision_status === 'PENDIENTE' && canManageComisiones ? (
                  <input
                    type="checkbox"
                    checked={selected.has(p.comision_id)}
                    onChange={() => toggleSelected(p.comision_id)}
                    className="w-4 h-4 accent-jm-blue cursor-pointer"
                  />
                ) : null,
                accion: p.comision_id && p.comision_status === 'PENDIENTE' && canManageComisiones ? (
                  <button
                    onClick={() => handleMarcarPagada(p)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-xs font-semibold text-emerald-600 hover:bg-emerald-100 transition whitespace-nowrap"
                  >
                    Marcar pagada
                  </button>
                ) : p.comision_id && p.comision_status === 'PAGADA' && canRevertirComisiones ? (
                  <button
                    onClick={() => handleRevertirComision(p)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 text-xs font-semibold text-amber-600 hover:bg-amber-100 transition whitespace-nowrap"
                  >
                    Revertir
                  </button>
                ) : null,
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
        {canExport && (
          <button type="button" onClick={handleExport} disabled={exporting} className="btn-secondary shrink-0">
            {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            Exportar
          </button>
        )}
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
            { k: 'com_gen', l: 'Com. Generada', r: true, hide: 'md' },
            { k: 'com_pagada', l: 'Com. Pagada', r: true, hide: 'md' },
            { k: 'com_pend', l: 'Com. Pendiente', r: true, hide: 'md' },
            { k: 'est', l: 'Estado' },
            { k: 'action', l: '', acc: true }
          ]}
          rows={rows.map(r => ({
            ...r,
            nom: r.id === null ? <strong>{r.nom}</strong> : r.nom,
            prima: usd(r.prima),
            com_gen: usd(r.com_gen),
            com_pagada: usd(r.com_pagada),
            com_pend: usd(r.com_pend),
            est: r.est ? rsbadge(r.est) : '',
            action: r.id !== null ? (
              <div className="flex flex-col items-start gap-1">
                <button onClick={() => setSelectedUser(r.id)} className="text-xs text-blue-600 hover:underline font-semibold bg-transparent border-none p-0 cursor-pointer whitespace-nowrap">
                  Ver Detalle
                </button>
                {canManageComisiones && r.comision_ids_pendientes?.length > 0 && (
                  <button
                    onClick={() => handlePagarPendientesVendedor(r)}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-50 text-[11px] font-semibold text-emerald-600 hover:bg-emerald-100 transition whitespace-nowrap"
                  >
                    Pagar
                  </button>
                )}
              </div>
            ) : null
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
  const [minBienes, setMinVehiculos] = useState('')
  const [maxBienes, setMaxVehiculos] = useState('')
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
      min_bienes: overrides.min_bienes ?? minBienes,
      max_bienes: overrides.max_bienes ?? maxBienes,
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
    loadData({ filtro: '', marca: '', modelo: '', estado_poliza: '', min_bienes: '', max_bienes: '', min_prima: '', max_prima: '' })
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
      minBienes,
      maxBienes,
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
    setMinVehiculos(f.minBienes || '')
    setMaxVehiculos(f.maxBienes || '')
    setMinPrima(f.minPrima || '')
    setMaxPrima(f.maxPrima || '')
    
    loadData({
      filtro: '',
      marca: f.marca || '',
      modelo: f.modelo || '',
      estado_poliza: f.estadoPoliza || '',
      min_bienes: f.minBienes || '',
      max_bienes: f.maxBienes || '',
      min_prima: f.minPrima || '',
      max_prima: f.maxPrima || '',
    })
  }

  const hasActiveFilters = activeFilter || marca || modelo || estadoPoliza || minBienes || maxBienes || minPrima || maxPrima

  // Modelos disponibles según marca seleccionada
  const availableModelos = marca && filterOptions.modelos?.[marca] ? filterOptions.modelos[marca] : []

  // ── DETALLE DE CLIENTE ────────────────────────────────────
  if (selectedClient) {
    const cliente   = clientDetail?.cliente
    const vehiculos = clientDetail?.vehiculos ?? []
    const polizas   = clientDetail?.polizas ?? []
    return (
      <div className="animate-in fade-in duration-300">
        <div className="card p-3.5 mb-4 flex items-center gap-3">
          <button onClick={() => { setSelectedClient(null); setClientDetail(null) }} className="btn-secondary">
            ← Volver a la lista
          </button>
          <span className="text-sm font-semibold text-slate-700 ml-2">{cliente ? `Historial de ${cliente.nombre}` : 'Cargando historial…'}</span>
          {cliente && <span className="text-xs text-slate-400 font-mono ml-auto">Cédula: {cliente.cedula}</span>}
        </div>

        {loadingDetail || !clientDetail ? (
          <div className="flex items-center justify-center py-20 animate-in fade-in duration-200">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
        ) : (
          <div className="animate-in fade-in duration-300">
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
          </div>
        )}
      </div>
    )
  }

  // ── QUICK FILTER BUTTONS CONFIG ────────────────────────────
  const quickFilters = [
    { key: 'por_vencer',    label: 'Pólizas por Vencer', Icon: AlertTriangle, color: 'red',     count: stats.polizas_por_vencer },
    { key: 'mas_polizas',   label: 'Más Pólizas',       Icon: TrendingUp,    color: 'blue'    },
    { key: 'por_bienes', label: 'Por Bienes',         Icon: Package,       color: 'indigo'  },
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
    <div className="w-full max-w-full">
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
              <label className="block text-[11px] font-semibold text-slate-500 mb-1 uppercase tracking-wide">Rango Bienes</label>
              <div className="flex gap-1.5">
                <input type="number" min="0" placeholder="Mín" value={minBienes} onChange={e => setMinVehiculos(e.target.value)}
                  className="w-1/2 text-sm bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 outline-none focus:ring-2 focus:ring-blue-500" />
                <input type="number" min="0" placeholder="Máx" value={maxBienes} onChange={e => setMaxVehiculos(e.target.value)}
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
        {showAdvanced && (marca || modelo || estadoPoliza || minBienes || maxBienes || minPrima || maxPrima) && (
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 mb-5">
            {[
              { label: 'Nuevos Clientes', val: stats.nuevos_clientes, sub: 'En período seleccionado', cls: 'border-t-blue-500', vcls: 'text-slate-800' },
              { label: 'Total Clientes', val: stats.total_clientes, sub: 'En el sistema', cls: 'border-t-emerald-500', vcls: 'text-emerald-700' },
              { label: 'Clientes Activos', val: stats.clientes_activos, sub: 'Con pólizas activas', cls: 'border-t-indigo-500', vcls: 'text-indigo-700' },
              { label: 'Pólizas Emitidas', val: stats.total_polizas, sub: 'En período seleccionado', cls: 'border-t-amber-500', vcls: 'text-amber-700' },
              { label: 'Por Vencer', val: stats.polizas_por_vencer, sub: 'Próximos 30 días', cls: 'border-t-red-500', vcls: 'text-red-700' },
            ].map(c => (
              <div key={c.label} className={`card p-4 text-center border-t-4 min-w-0 ${c.cls}`}>
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
              { k: 'bienes', l: 'Bienes', r: true, hide: 'sm' },
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
  const [tipoFiltro, setTipoFiltro] = useState('')
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
        search: search,
        tipo_veh: tipoFiltro
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
  }, [fechaInicio, fechaFin, selectedPlaca, tipoFiltro])

  const handleSearchSubmit = (e) => {
    e?.preventDefault()
    if (!selectedPlaca) loadData()
  }

  if (selectedPlaca) {
    const vehiculo    = vehiculoDetail?.vehiculo
    const propietario = vehiculoDetail?.propietario
    const historial    = vehiculoDetail?.historial ?? []
    return (
      <div className="animate-in fade-in duration-300">
        <div className="card p-3.5 mb-4 flex items-center gap-3">
          <button onClick={() => { setSelectedPlaca(null); setVehiculoDetail(null) }} className="btn-secondary">
            ← Volver a la lista
          </button>
          <span className="text-sm font-semibold text-slate-700 ml-2">{vehiculo ? `Historial de Vehículo Placa: ${vehiculo.placa}` : 'Cargando historial…'}</span>
          {propietario && <span className="text-xs text-slate-400 font-mono ml-auto">Propietario: {propietario.nombre} ({propietario.cedula})</span>}
        </div>

        {loadingDetail || !vehiculoDetail ? (
          <div className="flex items-center justify-center py-20 animate-in fade-in duration-200">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
        ) : (
          <div className="animate-in fade-in duration-300">
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
          </div>
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
        <select
          value={tipoFiltro}
          onChange={e => setTipoFiltro(e.target.value)}
          className="text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Todos los tipos</option>
          {Object.keys(stats.distribucion_tipo || {}).sort().map(tipo => (
            <option key={tipo} value={tipo}>{tipo}</option>
          ))}
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
              { k: 'tip', l: 'Tipo', hide: 'md' },
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
// Cada pestaña tiene su propio permiso view_* — el admin puede mostrar/ocultar
// cada una individualmente por usuario desde el modal de Permisos, en vez de
// que 'reportes.view' revele las 9 de golpe (algunas, como Ventas/Comisiones
// o Personal, exponen datos de desempeño de otros empleados).
const TABS = [
  { key: 'ventas',           label: 'Ventas / Comisiones', Icon: TrendingUp,  Component: TabVentas,           viewPerm: 'view_ventas' },
  { key: 'oficinas',         label: 'Oficinas',            Icon: Building2,   Component: TabOficinas,         viewPerm: 'view_oficinas' },
  { key: 'usuarios_metrics', label: 'Métricas de Personal',Icon: Users,       Component: TabUsuariosMetrics,  viewPerm: 'view_metrics_personal' },
  { key: 'clientes_metrics', label: 'Métricas de Clientes',Icon: Users,       Component: TabClientesMetrics,  viewPerm: 'view_metrics_clientes' },
  { key: 'vehiculos_metrics',label: 'Métricas de Vehículos',Icon: Car,        Component: TabVehiculosMetrics, viewPerm: 'view_metrics_vehiculos' },
  { key: 'leads',            label: 'Solicitudes de Contacto', Icon: MessageCircle, Component: TabLeads,      viewPerm: 'view_leads' },
  { key: 'externos',         label: 'Reportes Externos',   Icon: Download,    Component: TabExternos,        viewPerm: 'view_externos' },
]

export default function Reportes() {
  const { canAct } = useApp()
  // Sin "ver de todos" solo ve sus propias métricas — la pestaña se renombra
  // para que quede claro que el detalle es siempre el propio.
  const soloPropiasMetricas = !canAct('reportes', 'view_metrics_personal_todos')

  const activeTabs = TABS.filter(t => canAct('reportes', t.viewPerm))

  const [active, setActive] = useState('ventas')
  const ActiveTab = (activeTabs.find(t => t.key === active) ?? activeTabs[0])?.Component

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

  if (!ActiveTab) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
        <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center">
          <span className="text-2xl">📊</span>
        </div>
        <p className="font-semibold text-slate-600">Sin pestañas habilitadas</p>
        <p className="text-xs text-slate-400">Tu cuenta no tiene acceso a ninguna pestaña de este módulo. Pide a un administrador que te asigne al menos una.</p>
      </div>
    )
  }

  return (
    <div className="animate-in fade-in duration-500">
      {activeTabs.length > 1 && (
        <div className="flex flex-wrap gap-2 mb-5">
          {activeTabs.map(t => (
            <button key={t.key} onClick={() => setActive(t.key)}
              className={`text-xs px-4 py-2 shrink-0 flex items-center gap-1.5 ${active === t.key ? 'btn-primary' : 'btn-secondary'}`}
            >
              <t.Icon className="w-4 h-4" />{t.key === 'usuarios_metrics' && soloPropiasMetricas ? 'Mis Métricas' : t.label}
            </button>
          ))}
        </div>
      )}
      <div key={active} className="animate-in fade-in duration-300">
        <ActiveTab />
      </div>
    </div>
  )
}
