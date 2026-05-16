import { useState, useEffect, useCallback } from 'react'
import { Pencil, Plus, Trash2, Shield, ShieldCheck, Layers, DollarSign, Eye } from 'lucide-react'
import { useApp } from '../context/AppContext.jsx'
import { usd } from '../utils/helpers.jsx'
import SearchBar from '../components/SearchBar.jsx'
import DataTable from '../components/DataTable.jsx'
import { fetchProductos, createProducto, updateProducto, deleteProducto } from '../api/productos.js'

const fmtId = id => 'PRO-' + String(id).padStart(4, '0')

const MONEDAS = ['USD', 'BS']

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
  const { showModal, showToast } = useApp()
  const [search, setSearch]         = useState('')
  const [productos, setProductos]   = useState([])
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState(null)

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
  const enUSD     = productos.filter(p => p.moneda === 'USD').length
  const promPrima = productos.length ? productos.reduce((s, p) => s + p.prima, 0) / productos.length : 0
  const maxCob    = productos.length ? Math.max(...productos.map(p => p.cobertura)) : 0

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
    primab:    usd(p.prima),
    cob:       usd(p.cobertura),
    mon:       (
      <span className={`badge badge-${p.moneda === 'USD' ? 'blue' : 'amber'}`}>{p.moneda}</span>
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
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
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
        <div className="card p-4 flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
            <DollarSign className="w-4 h-4 text-blue-600" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-slate-500 font-medium leading-tight">En USD</p>
            <p className="text-xl font-black text-slate-800 mt-0.5 leading-none">{enUSD}</p>
            <p className="text-xs text-slate-400 mt-1">Denominados en dólares</p>
          </div>
        </div>
        <div className="card p-4 flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
            <Layers className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-slate-500 font-medium leading-tight">Prima promedio</p>
            <p className="text-xl font-black text-slate-800 mt-0.5 leading-none">{usd(promPrima)}</p>
            <p className="text-xs text-slate-400 mt-1">Prima base promedio</p>
          </div>
        </div>
        <div className="card p-4 flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-slate-500 font-medium leading-tight">Mayor Cobertura</p>
            <p className="text-xl font-black text-slate-800 mt-0.5 leading-none">{usd(maxCob)}</p>
            <p className="text-xs text-slate-400 mt-1">Suma asegurada máx.</p>
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
