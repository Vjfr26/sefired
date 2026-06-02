import { useState, useEffect, useCallback } from 'react'
import { CheckCircle, XCircle, RefreshCw, Clock } from 'lucide-react'
import { useApp } from '../context/AppContext.jsx'
import { badge } from '../utils/helpers.jsx'
import DataTable from '../components/DataTable.jsx'
import SearchBar from '../components/SearchBar.jsx'
import { fetchRenovaciones, autorizarRenovacion, rechazarRenovacion } from '../api/renovaciones.js'

const STATUS_OPTS = ['', 'PENDIENTE', 'AUTORIZADA', 'RECHAZADA']

const statusBadge = s => badge(s,
  s === 'PENDIENTE'  ? 'yellow' :
  s === 'AUTORIZADA' ? 'green'  : 'red'
)

const monedaBadge = m => badge(m,
  m === 'USD' ? 'green' : m === 'EUR' ? 'amber' : 'blue'
)

export default function Renovaciones() {
  const { showModal, showToast, canAct } = useApp()

  const [rows,    setRows]    = useState([])
  const [total,   setTotal]   = useState(0)
  const [page,    setPage]    = useState(1)
  const [loading, setLoading] = useState(true)
  const [filter,  setFilter]  = useState({ status: 'PENDIENTE', q: '' })

  const load = useCallback(async (p = page, f = filter) => {
    setLoading(true)
    try {
      const res = await fetchRenovaciones({ status: f.status, q: f.q, page: p })
      setRows(res.data)
      setTotal(res.total)
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setLoading(false)
    }
  }, [page, filter, showToast])

  useEffect(() => { load(1, filter) }, [filter]) // eslint-disable-line

  const handleAutorizar = (row) => {
    showModal('editForm', {
      title: `Autorizar Renovación — ${row.nro_contrato}`,
      fields: [
        { label: 'Tasa BCV Bs./USD',  fname: 'tasa_bcv', type: 'number', req: true, ph: 'Ej. 36.5000' },
        { label: 'Tasa BCV Bs./EUR',  fname: 'tasa_eur', type: 'number', req: false, ph: 'Dejar vacío para usar tasa USD' },
      ],
      saveLabel: 'Autorizar y Renovar',
      onSave: async ({ tasa_bcv, tasa_eur }) => {
        await autorizarRenovacion(row.id, {
          tasa_bcv: parseFloat(tasa_bcv),
          tasa_eur: tasa_eur ? parseFloat(tasa_eur) : undefined,
        })
        showToast(`Póliza renovada correctamente`, 'success')
        load(1, filter)
      },
    })
  }

  const handleRechazar = (row) => {
    showModal('editForm', {
      title: `Rechazar Solicitud — ${row.nro_contrato}`,
      fields: [
        { label: 'Motivo (opcional)', fname: 'nota', type: 'textarea', ph: 'Ej. Referencia no verificada…' },
      ],
      saveLabel: 'Confirmar Rechazo',
      onSave: async ({ nota }) => {
        await rechazarRenovacion(row.id, nota)
        showToast('Solicitud rechazada', 'success')
        load(1, filter)
      },
    })
  }

  const canEmit = canAct('cotizaciones', 'emit')
  const canEdit = canAct('cotizaciones', 'edit')

  const dataRows = rows.map(r => ({
    ...r,
    f:      r.fecha,
    pol:    <span className="font-bold text-jm-blue">{r.nro_contrato}</span>,
    cli:    r.nombre,
    tel:    r.telefono,
    met: (
      <div className="space-y-0.5">
        {(r.pagos || []).map((p, i) => (
          <div key={i} className="text-xs text-slate-600">
            {p.metodo}{p.banco ? ` · ${p.banco}` : ''}
          </div>
        ))}
      </div>
    ),
    ref: (
      <div className="space-y-0.5">
        {(r.pagos || []).map((p, i) => (
          <div key={i} className="font-mono text-xs">{p.referencia}</div>
        ))}
      </div>
    ),
    monto: (
      <div className="space-y-0.5 text-right">
        {(r.pagos || []).map((p, i) => (
          <div key={i} className="text-xs font-bold">
            {p.moneda === 'USD' ? '$' : p.moneda === 'EUR' ? '€' : 'Bs.'}{' '}
            {Number(p.monto).toFixed(2)} {monedaBadge(p.moneda)}
          </div>
        ))}
      </div>
    ),
    est:    statusBadge(r.status),
    acc: r.status === 'PENDIENTE' ? (
      <div className="flex gap-1 justify-center">
        {canEmit && (
          <button
            onClick={() => handleAutorizar(r)}
            className="p-2 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition"
            title="Autorizar renovación"
          >
            <CheckCircle className="w-4 h-4" />
          </button>
        )}
        {canEdit && (
          <button
            onClick={() => handleRechazar(r)}
            className="p-2 rounded-lg bg-rose-50 text-rose-500 hover:bg-rose-100 transition"
            title="Rechazar solicitud"
          >
            <XCircle className="w-4 h-4" />
          </button>
        )}
      </div>
    ) : (
      <span className="text-xs text-slate-400">{r.procesado_por_nombre ?? '—'}</span>
    ),
  }))

  if (!canAct('cotizaciones', 'view')) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
        <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center">
          <RefreshCw className="w-6 h-6 text-slate-400" />
        </div>
        <p className="font-semibold text-slate-600">Sin acceso</p>
        <p className="text-xs text-slate-400">No tienes permiso para ver este módulo.</p>
      </div>
    )
  }

  const pendientes = rows.filter(r => r.status === 'PENDIENTE').length

  return (
    <div>
      {/* ── Alerta de pendientes ── */}
      {filter.status === 'PENDIENTE' && !loading && pendientes > 0 && (
        <div className="mb-5 flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          <Clock className="w-5 h-5 text-amber-500 shrink-0" />
          <p className="text-sm text-amber-800 font-medium">
            Hay <strong>{pendientes}</strong> solicitud{pendientes !== 1 ? 'es' : ''} de renovación pendiente{pendientes !== 1 ? 's' : ''} de revisión.
          </p>
        </div>
      )}

      {/* ── Filtros ── */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <SearchBar
          value={filter.q}
          onChange={q => setFilter(f => ({ ...f, q }))}
          placeholder="Buscar por póliza, nombre o teléfono…"
        />
        <select
          value={filter.status}
          onChange={e => setFilter(f => ({ ...f, status: e.target.value }))}
          className="input-field w-auto text-sm"
        >
          {STATUS_OPTS.map(s => (
            <option key={s} value={s}>{s || 'Todos los estados'}</option>
          ))}
        </select>
        <button
          onClick={() => load(1, filter)}
          className="p-2 rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200 transition"
          title="Recargar"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* ── Tabla ── */}
      {loading ? (
        <div className="flex justify-center items-center py-16 text-slate-400 text-sm gap-2">
          <div className="w-4 h-4 border-2 border-slate-300 border-t-jm-blue rounded-full animate-spin" />
          Cargando solicitudes…
        </div>
      ) : rows.length === 0 ? (
        <div className="text-center py-16 text-slate-400 text-sm">
          No hay solicitudes {filter.status ? `con estado ${filter.status}` : ''}.
        </div>
      ) : (
        <DataTable
          cols={[
            { k: 'f',     l: 'Fecha',        nw: true, hide: 'md' },
            { k: 'pol',   l: 'Póliza',        nw: true, bold: true },
            { k: 'cli',   l: 'Solicitante',   tr: true },
            { k: 'tel',   l: 'Teléfono',      hide: 'sm' },
            { k: 'met',   l: 'Método',        hide: 'lg' },
            { k: 'ref',   l: 'Referencia',    hide: 'md' },
            { k: 'monto', l: 'Monto',         r: true, nw: true },
            { k: 'est',   l: 'Estado',        nw: true },
            { k: 'acc',   l: '',              acc: true },
          ]}
          rows={dataRows}
        />
      )}

      {/* ── Paginación simple ── */}
      {total > 20 && (
        <div className="flex justify-center gap-2 mt-4">
          <button
            disabled={page <= 1}
            onClick={() => { setPage(p => p - 1); load(page - 1, filter) }}
            className="px-3 py-1 rounded-lg text-sm bg-slate-100 disabled:opacity-40"
          >← Anterior</button>
          <span className="px-3 py-1 text-sm text-slate-500">Página {page}</span>
          <button
            disabled={rows.length < 20}
            onClick={() => { setPage(p => p + 1); load(page + 1, filter) }}
            className="px-3 py-1 rounded-lg text-sm bg-slate-100 disabled:opacity-40"
          >Siguiente →</button>
        </div>
      )}
    </div>
  )
}
