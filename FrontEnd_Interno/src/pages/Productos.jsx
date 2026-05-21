import { useState, useEffect, useCallback, useRef } from 'react'
import { Pencil, Plus, Trash2, Shield, ShieldCheck, TrendingUp, DollarSign, Eye, Euro, Banknote, ChevronDown } from 'lucide-react'
import { useApp } from '../context/AppContext.jsx'
import { usd, fmtMonto, fmtMontoAbrev } from '../utils/helpers.jsx'
import SearchBar from '../components/SearchBar.jsx'
import DataTable from '../components/DataTable.jsx'
import { fetchProductos, createProducto, updateProducto, deleteProducto } from '../api/productos.js'

const fmtId = id => 'PRO-' + String(id).padStart(4, '0')

const MONEDAS = ['USD', 'BS', 'EUR']

// Todos los campos son obligatorios en Agregar y Editar
const productoFields = (p = {}) => [
  { label: 'Nombre del producto',        fname: 'nombre',      val: p.nombre      || '', ph: 'Ej. Casco Pérdida Total',               req: true, span: true },
  { label: 'Descripción',                fname: 'descripcion', val: p.descripcion || '', ph: 'Descripción detallada de la cobertura',  type: 'textarea', req: true, span: true },
  { label: 'Prima Base',                 fname: 'prima',       val: p.prima       || '', ph: '270.00', type: 'number', step: '0.01',   req: true },
  { label: 'Cobertura / Suma Asegurada', fname: 'cobertura',   val: p.cobertura   || '', ph: '15000.00', type: 'number', step: '0.01', req: true },
  { label: 'Moneda',                     fname: 'moneda',      val: p.moneda      || 'USD', type: 'select', opts: MONEDAS,             req: true },
]

const COLS = [
  { k: 'displayId', l: 'ID',           m: true, hide: 'lg' },
  { k: 'nombre',    l: 'Producto',     tr: true },
  { k: 'desc',      l: 'Descripción',  hide: 'sm', tr: true },
  { k: 'primab',    l: 'Prima base',   r: true, nw: true },
  { k: 'cob',       l: 'Cobertura',    r: true, nw: true, hide: 'md' },
  { k: 'mon',       l: 'Moneda',       hide: 'lg' },
  { k: 'acc',       l: '',             acc: true },
]

const parsePayload = data => ({
  ...data,
  prima:     parseFloat(data.prima)     || 0,
  cobertura: parseFloat(data.cobertura) || 0,
})

export default function Productos() {
  const { showModal, showToast, tasas } = useApp()
  const [search, setSearch]         = useState('')
  const [productos, setProductos]   = useState([])
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState(null)
  const [monedaDisplay, setMonedaDisplay] = useState('USD')
  const [monedaOpen,    setMonedaOpen]    = useState(false)
  const monedaDropRef = useRef(null)

  useEffect(() => {
    if (!monedaOpen) return
    const close = (e) => { if (monedaDropRef.current && !monedaDropRef.current.contains(e.target)) setMonedaOpen(false) }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [monedaOpen])

  const CURRENCY_META = {
    USD: { Icon: DollarSign, bg: 'bg-emerald-100', text: 'text-emerald-600', label: 'Dólares'   },
    BS:  { Icon: Banknote,   bg: 'bg-blue-100',    text: 'text-blue-600',   label: 'Bolívares'  },
    EUR: { Icon: Euro,       bg: 'bg-amber-100',   text: 'text-amber-600',  label: 'Euros'      },
  }

  const loadProductos = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchProductos()
      setProductos(data)
    } catch (err) {
      setError(err.message)
      showToast(err.message, 'error')
    } finally {
      setLoading(false)
    }
  }, [showToast])

  useEffect(() => { loadProductos() }, [loadProductos])

  // ── Stats ──────────────────────────────────────────────────────────────────
  const tasaUsd = tasas.usd ? Number(tasas.usd.valor) : null
  const tasaEur = tasas.eur ? Number(tasas.eur.valor) : null

  // Convierte un monto a la moneda destino pasando por Bs. como intermediario.
  const convertir = (val, desde, hacia) => {
    const inBs = desde === 'USD' ? (tasaUsd ? val * tasaUsd : null)
               : desde === 'EUR' ? (tasaEur ? val * tasaEur : null)
               : val
    if (inBs === null) return 0
    if (hacia === 'USD') return tasaUsd ? inBs / tasaUsd : 0
    if (hacia === 'EUR') return tasaEur ? inBs / tasaEur : 0
    return inBs
  }

  // Suma cualquier campo numérico del producto convertido a la moneda elegida
  const sumaEnMoneda = (campo, cur) => productos.reduce((sum, p) => {
    const val = p[campo] || 0
    return sum + (p.moneda === cur ? val : convertir(val, p.moneda, cur))
  }, 0)

  const totalDenominados = productos.filter(p => p.moneda === monedaDisplay).length
  const sumaPrimaActual  = sumaEnMoneda('prima',     monedaDisplay)
  const sumaCobActual    = sumaEnMoneda('cobertura', monedaDisplay)
  const tasasOk          = tasaUsd && tasaEur

  // ── Filtrado local ─────────────────────────────────────────────────────────
  const filtered = search
    ? productos.filter(p => {
        const q = search.toLowerCase()
        return p.nombre.toLowerCase().includes(q) || p.descripcion?.toLowerCase().includes(q)
      })
    : productos

  const dataRows = filtered.map(p => ({
    ...p,
    displayId: fmtId(p.id),
    desc:      p.descripcion,
    primab:    fmtMontoAbrev(p.prima,     p.moneda),
    cob:       fmtMontoAbrev(p.cobertura, p.moneda),
    mon:       (
      <span className={`badge badge-${p.moneda === 'USD' ? 'green' : p.moneda === 'EUR' ? 'amber' : 'blue'}`}>{p.moneda}</span>
    ),
    acc: (
      <div className="flex gap-1 justify-center flex-nowrap">
        <button
          onClick={() => showModal('productoDetail', { p })}
          className="p-2 rounded-lg bg-slate-50 text-slate-500 hover:bg-slate-100 transition inline-flex items-center justify-center"
          title="Ver detalles"
        >
          <Eye className="w-4 h-4" />
        </button>
        <button
          onClick={() => showModal('editForm', {
            title: `Editar — ${p.nombre}`,
            fields: productoFields(p),
            onSave: async (data) => {
              await updateProducto(p.id, parsePayload(data))
              await loadProductos()
            },
          })}
          className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition inline-flex items-center justify-center"
          title="Editar"
        >
          <Pencil className="w-4 h-4" />
        </button>
        <button
          onClick={() => showModal('confirmDelete', {
            name: p.nombre,
            onConfirm: async () => {
              await deleteProducto(p.id)
              await loadProductos()
            },
          })}
          className="p-2 rounded-lg bg-rose-50 text-rose-500 hover:bg-rose-100 transition inline-flex items-center justify-center"
          title="Eliminar"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    ),
  }))

  return (
    <div className="animate-in fade-in duration-500">
      {/* ── Selector global de moneda + Cards ── */}
      <div className="mb-6">
        {/* Selector: aparece encima del grid, alineado a la derecha */}
        <div className="flex justify-end mb-2">
          <div className="relative" ref={monedaDropRef}>
            <button
              onClick={() => setMonedaOpen(o => !o)}
              className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl border transition ${
                monedaOpen ? 'bg-white border-slate-300 shadow-md' : 'bg-white/70 border-slate-200 hover:bg-white hover:shadow-sm'
              }`}
            >
              {(() => { const { Icon, text } = CURRENCY_META[monedaDisplay]; return <Icon className={`w-3.5 h-3.5 ${text}`} /> })()}
              <span className="text-slate-600">Ver en:</span>
              <span className={CURRENCY_META[monedaDisplay].text}>{monedaDisplay}</span>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${monedaOpen ? 'rotate-180' : ''}`} />
            </button>

            {monedaOpen && (
              <div className="absolute right-0 top-full mt-1.5 bg-white rounded-2xl shadow-2xl border border-slate-100 z-30 overflow-hidden w-40">
                {MONEDAS.map(c => {
                  const { Icon, text, label } = CURRENCY_META[c]
                  return (
                    <button
                      key={c}
                      onClick={() => { setMonedaDisplay(c); setMonedaOpen(false) }}
                      className={`flex items-center gap-3 w-full px-4 py-3 text-xs font-bold transition-colors ${
                        monedaDisplay === c ? 'bg-slate-50 text-slate-800' : 'text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      <Icon className={`w-3.5 h-3.5 shrink-0 ${text}`} />
                      <div className="text-left">
                        <p className={`font-black ${monedaDisplay === c ? text : ''}`}>{c}</p>
                        <p className="text-[10px] text-slate-400 font-medium">{label}</p>
                      </div>
                      {monedaDisplay === c && <span className={`ml-auto w-1.5 h-1.5 rounded-full ${text.replace('text-', 'bg-')}`} />}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Cards — los tres últimos reaccionan al monedaDisplay seleccionado */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total fijo, no cambia con la moneda */}
          <div className="card p-4 flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
              <Shield className="w-4 h-4 text-slate-600" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-slate-500 font-medium leading-tight">Total Productos</p>
              <p className="text-xl font-black text-slate-800 mt-0.5 leading-none">{productos.length}</p>
              <p className="text-xs text-slate-400 mt-1">Registrados en sistema</p>
            </div>
          </div>

          {/* Card 2: Denominados en la moneda seleccionada */}
          <div className="card p-4 flex items-start gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${CURRENCY_META[monedaDisplay].bg}`}>
              {(() => { const { Icon, text } = CURRENCY_META[monedaDisplay]; return <Icon className={`w-4 h-4 ${text}`} /> })()}
            </div>
            <div className="min-w-0">
              <p className="text-xs text-slate-500 font-medium leading-tight">Denominados</p>
              <p className="text-xl font-black text-slate-800 mt-0.5 leading-none">{totalDenominados}</p>
              <p className="text-xs text-slate-400 mt-1">En {monedaDisplay} · {CURRENCY_META[monedaDisplay].label}</p>
            </div>
          </div>

          {/* Card 3: Suma de primas convertida a la moneda seleccionada */}
          <div className="card p-4 flex items-start gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${CURRENCY_META[monedaDisplay].bg}`}>
              <TrendingUp className={`w-4 h-4 ${CURRENCY_META[monedaDisplay].text}`} />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-slate-500 font-medium leading-tight">Suma Primas</p>
              <p className="text-xl font-black text-slate-800 mt-0.5 leading-none">{fmtMontoAbrev(sumaPrimaActual, monedaDisplay)}</p>
              <p className="text-xs text-slate-400 mt-1">{tasasOk ? 'Al tipo BCV' : 'Solo misma moneda'}</p>
            </div>
          </div>

          {/* Card 4: Suma de coberturas convertida a la moneda seleccionada */}
          <div className="card p-4 flex items-start gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${CURRENCY_META[monedaDisplay].bg}`}>
              <ShieldCheck className={`w-4 h-4 ${CURRENCY_META[monedaDisplay].text}`} />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-slate-500 font-medium leading-tight">Suma Coberturas</p>
              <p className="text-xl font-black text-slate-800 mt-0.5 leading-none">{fmtMontoAbrev(sumaCobActual, monedaDisplay)}</p>
              <p className="text-xs text-slate-400 mt-1">{tasasOk ? 'Al tipo BCV' : 'Solo misma moneda'}</p>
            </div>
          </div>
        </div>
      </div>

      <SearchBar
        placeholder="Buscar por nombre o descripción…"
        onSearch={setSearch}
        extra={
          <button
            onClick={() => showModal('editForm', {
              title: 'Nuevo Producto',
              fields: productoFields(),
              onSave: async (data) => {
                await createProducto(parsePayload(data))
                await loadProductos()
              },
            })}
            className="btn-primary ml-auto"
          >
            <Plus className="w-4 h-4" />Agregar
          </button>
        }
      />

      {loading && (
        <div className="flex justify-center items-center py-16 text-slate-400 text-sm gap-2">
          <div className="w-4 h-4 border-2 border-slate-300 border-t-sefired-blue rounded-full animate-spin" />
          Cargando productos…
        </div>
      )}
      {error && !loading && (
        <div className="text-center py-12 text-rose-500 text-sm">{error}</div>
      )}
      {!loading && !error && <DataTable cols={COLS} rows={dataRows} searchable />}
    </div>
  )
}
