import { useState, useEffect, useCallback } from 'react'
import { Check, Pencil, Trash2, Banknote } from 'lucide-react'
import { useApp } from '../context/AppContext.jsx'
import { badge, fmtTasa } from '../utils/helpers.jsx'
import DataTable from '../components/DataTable.jsx'
import { fetchTasas, storeTasas, updateTasa, deleteTasa } from '../api/tasas.js'

// Devuelve hoy en formato YYYY-MM-DD para el input type="date"
const hoy = () => new Date().toISOString().slice(0, 10)

// Badge de moneda: USD = verde (emerald), EUR = ámbar
const monedaBadge = m => badge(m, m === 'USD' ? 'green' : 'amber')

// Variación como texto coloreado: verde si subió, rojo si bajó, gris sin dato
const varText = (texto, color) => (
  <span className={
    color === 'green' ? 'font-bold text-emerald-600' :
    color === 'red'   ? 'font-bold text-rose-500' :
    'text-slate-400 text-xs'
  }>
    {texto}
  </span>
)

export default function Tasas() {
  const { showModal, showToast, refreshTasas, canAct } = useApp()
  const canCreate    = canAct('tasas', 'create')
  const canEdit      = canAct('tasas', 'edit')
  const canDelete    = canAct('tasas', 'delete')
  const canViewCards = canAct('tasas', 'view_cards')
  const canViewList  = canAct('tasas', 'view_list')

  const [data, setData]       = useState({ usd: null, eur: null, historial: [] })
  const [loading, setLoading] = useState(true)
  const [form, setForm]       = useState({ fecha: hoy(), usd: '', eur: '' })

  // Convierte yyyy-mm-dd → dd/mm/yyyy para comparar con el historial
  const fechaFormDDMMYYYY = form.fecha ? form.fecha.split('-').reverse().join('/') : ''
  // true cuando la fecha del formulario ya tiene tasas registradas (indica upsert)
  const fechaYaRegistrada = data.historial.some(r => r.fecha === fechaFormDDMMYYYY)

  // ── Carga de datos ──────────────────────────────────────────────────────────
  const loadTasas = useCallback(async () => {
    setLoading(true)
    try {
      const json = await fetchTasas()
      setData(json)
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setLoading(false)
    }
  }, [showToast])

  useEffect(() => { loadTasas() }, [loadTasas])

  // ── Registrar tasas del día ─────────────────────────────────────────────────
  // Pide confirmación + contraseña antes de aplicar el cambio, ya que afecta
  // todos los cálculos del sistema a partir de este momento.
  const handleRegistrar = (e) => {
    e.preventDefault()
    if (!form.usd || !form.eur) { showToast('Ingresa ambas tasas (USD y EUR)', 'error'); return }
    showModal('confirmTasa', {
      fecha: fechaFormDDMMYYYY,
      usd: form.usd,
      eur: form.eur,
      isUpdate: fechaYaRegistrada,
      onConfirm: async () => {
        await storeTasas({ fecha: form.fecha, usd: parseFloat(form.usd), eur: parseFloat(form.eur) })
        showToast(fechaYaRegistrada ? 'Tasas actualizadas correctamente' : 'Tasas del día registradas y aplicadas', 'success')
        setForm({ fecha: hoy(), usd: '', eur: '' })
        await loadTasas()
        await refreshTasas()
      },
    })
  }

  // ── Filas del historial ─────────────────────────────────────────────────────
  const dataRows = data.historial.map(r => ({
    ...r,
    f:   r.fecha,
    mon: monedaBadge(r.moneda),
    t:   <span className="font-bold">{fmtTasa(r.valor)}</span>,
    v:   varText(r.variacion, r.var_color),
    acc: (
      <div className="flex gap-1.5 justify-center flex-nowrap">
        {canEdit && (
          <button
            onClick={() => showModal('editForm', {
              title: `Editar Tasa ${r.moneda} — ${r.fecha}`,
              fields: [
                { label: `Valor Bs/${r.moneda}`, fname: 'valor', val: r.valor, type: 'number', req: true },
              ],
              onSave: async ({ valor }) => {
                await updateTasa(r.id, parseFloat(valor))
                await loadTasas()
                await refreshTasas()
              },
            })}
            className="p-2.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition"
            title="Editar"
          >
            <Pencil className="w-[18px] h-[18px]" />
          </button>
        )}
        {canDelete && (
          <button
            onClick={() => showModal('confirmDelete', {
              name: `Tasa ${r.moneda} del ${r.fecha}`,
              onConfirm: async () => {
                await deleteTasa(r.id)
                await loadTasas()
                await refreshTasas()
              },
            })}
            className="p-2.5 rounded-lg bg-rose-50 text-rose-500 hover:bg-rose-100 transition"
            title="Eliminar"
          >
            <Trash2 className="w-[18px] h-[18px]" />
          </button>
        )}
      </div>
    ),
  }))

  // ── Card de tasa actual ─────────────────────────────────────────────────────
  const CARD_COLOR = {
    emerald: { border: 'border-l-emerald-500', text: 'text-emerald-500' },
    amber:   { border: 'border-l-amber-500',   text: 'text-amber-500'   },
  }
  const CardTasa = ({ simbolo, label, color, dato }) => {
    const cc = CARD_COLOR[color] ?? CARD_COLOR.emerald
    return (
    <div className={`card p-5 border-l-4 ${cc.border}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className={`text-xl font-extrabold ${cc.text}`}>{simbolo}</span>
          <p className="text-xs text-slate-600 uppercase tracking-wide font-bold">{label} · BCV</p>
        </div>
        <span className="text-xs text-slate-400">
          {dato ? `${dato.fecha} · ${dato.hora}` : '—'}
        </span>
      </div>
      {dato ? (
        <>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-800">
            {fmtTasa(dato.valor)}
            <span className="text-base font-semibold text-slate-400 ml-1">Bs/{simbolo === '$' ? 'USD' : 'EUR'}</span>
          </p>
          {dato.variacion !== 0 ? (
            <p className={`text-xs font-semibold mt-1 ${dato.variacion > 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
              {dato.variacion > 0 ? '↑' : '↓'} {dato.variacion > 0 ? '+' : ''}{dato.variacion}% vs día anterior
            </p>
          ) : (
            <p className="text-xs text-slate-400 mt-1">Sin dato anterior para comparar</p>
          )}
        </>
      ) : (
        <p className="text-sm text-slate-400 mt-2">Sin registro aún</p>
      )}
    </div>
  )
  }

  if (!canAct('tasas', 'view')) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
        <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center">
          <Banknote className="w-6 h-6 text-slate-400" />
        </div>
        <p className="font-semibold text-slate-600">Sin acceso</p>
        <p className="text-xs text-slate-400">No tienes permiso para acceder a este módulo.</p>
      </div>
    )
  }

  return (
    <div className="animate-in fade-in duration-500">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">

        {/* ── Cards de tasas actuales ── */}
        {canViewCards && (
          <div className="space-y-4">
            {loading ? (
              <div className="flex justify-center items-center py-16 text-slate-400 text-sm gap-2">
                <div className="w-4 h-4 border-2 border-slate-300 border-t-jm-blue rounded-full animate-spin" />
                Cargando tasas…
              </div>
            ) : (
              <>
                <CardTasa simbolo="$" label="Dólar USD" color="emerald" dato={data.usd} />
                <CardTasa simbolo="€" label="Euro EUR"  color="amber"   dato={data.eur} />
              </>
            )}
          </div>
        )}

        {/* ── Formulario de registro ── */}
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-7 h-7 rounded-xl bg-jm-blue/10 text-jm-blue flex items-center justify-center shrink-0">
              <Banknote className="w-3.5 h-3.5" />
            </span>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Registrar Tasas del Día</p>
          </div>
          {!canCreate ? (
            <p className="text-xs text-slate-400 text-center py-6">Sin permiso para registrar tasas.</p>
          ) : (
          <form onSubmit={handleRegistrar} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="field-label">Dólar USD (Bs) <span className="text-rose-500">*</span></label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-500 font-extrabold">$</span>
                  <input
                    type="number" step="any" min="0" placeholder="0.00000"
                    className="input-field pl-8"
                    value={form.usd}
                    onChange={e => setForm(f => ({ ...f, usd: e.target.value }))}
                    required
                  />
                </div>
              </div>
              <div>
                <label className="field-label">Euro EUR (Bs) <span className="text-rose-500">*</span></label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-500 font-extrabold">€</span>
                  <input
                    type="number" step="any" min="0" placeholder="0.00000"
                    className="input-field pl-8"
                    value={form.eur}
                    onChange={e => setForm(f => ({ ...f, eur: e.target.value }))}
                    required
                  />
                </div>
              </div>
            </div>
            <div>
              <label className="field-label">Fecha <span className="text-rose-500">*</span></label>
              <input
                type="date"
                className="input-field"
                value={form.fecha}
                max={hoy()}
                onChange={e => setForm(f => ({ ...f, fecha: e.target.value }))}
                required
              />
            </div>
            <button type="submit" className="btn-primary w-full">
              <Check className="w-4 h-4" />{fechaYaRegistrada ? 'Actualizar Tasas' : 'Registrar Tasas'}
            </button>
          </form>
          )}
        </div>
      </div>

      {/* ── Historial ── */}
      {canViewList ? (
        <>
          <h4 className="font-semibold text-slate-700 mb-3">Historial de Tasas Registradas</h4>
          {!loading && data.historial.length === 0 && (
            <p className="text-sm text-slate-400 text-center py-8">No hay tasas registradas aún.</p>
          )}
          {(loading || data.historial.length > 0) && (
            <DataTable
              cols={[
                { k: 'f',   l: 'Fecha',     nw: true },
                // mon/t/v muestran JSX (badge, montos con estilo). Para poder
                // ordenar al hacer clic en el encabezado hay que apuntar al
                // campo crudo con `s`; sin él, DataTable no puede comparar JSX.
                { k: 'mon', l: 'Moneda',    nw: true, s: 'moneda' },
                { k: 't',   l: 'Tasa Bs',   r: true, nw: true, s: 'valor' },
                { k: 'v',   l: 'Variación', hide: 'sm', nw: true, s: 'variacion' },
                { k: 'acc', l: '',          acc: true },
              ]}
              rows={dataRows}
              loading={loading}
            />
          )}
        </>
      ) : (
        <div className="card flex flex-col items-center justify-center py-16 gap-2 text-center">
          <span className="text-2xl">💵</span>
          <p className="text-xs text-slate-400">No tienes permiso para ver el historial de tasas.</p>
        </div>
      )}
    </div>
  )
}
