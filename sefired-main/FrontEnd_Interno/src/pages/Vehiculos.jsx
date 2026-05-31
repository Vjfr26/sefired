import { useState, useEffect, useCallback } from 'react'
import { Pencil, Trash2, Eye, Car, Package, Users, ShieldCheck, AlertTriangle } from 'lucide-react'
import { useApp } from '../context/AppContext.jsx'
import SearchBar from '../components/SearchBar.jsx'
import DataTable from '../components/DataTable.jsx'
import { fetchBienes, deleteBien } from '../api/bienes.js'

const TIPO_ICON = { vehiculo: Car, inmueble: Package, bien: Package, vida: Users }
const TIPO_LABEL = { vehiculo: 'Vehículo', inmueble: 'Inmueble', bien: 'Bien', vida: 'Vida', ninguno: 'Otro' }

function bienRef(b) {
  const a = b.atributos || {}
  if (b.tipo === 'vehiculo') return a.placa || a.marca ? `${a.placa ?? ''} ${a.marca ?? ''} ${a.modelo ?? ''}`.trim() : b.descripcion || '—'
  return a.descripcion || b.descripcion || '—'
}

const COLS = [
  { k: 'tipo_label', l: 'Tipo',        nw: true },
  { k: 'ref',        l: 'Referencia',  bold: true, tr: true },
  { k: 'titular',    l: 'Titular',     tr: true, hide: 'sm' },
  { k: 'valor',      l: 'Valor Decl.', r: true,  nw: true, hide: 'md' },
  { k: 'acc',        l: '',            acc: true },
]

export default function Vehiculos() {
  const { showModal, showToast, canAct } = useApp()
  const canDelete = canAct('vehiculos', 'delete')

  const [bienes,  setBienes]  = useState([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)
  const [search,  setSearch]  = useState('')
  const [tipo,    setTipo]    = useState('')

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    try { setBienes(await fetchBienes()) }
    catch (e) { setError(e.message); showToast(e.message, 'error') }
    finally { setLoading(false) }
  }, [showToast])

  useEffect(() => { load() }, [load])

  const tipos   = [...new Set(bienes.map(b => b.tipo).filter(Boolean))]
  const filt    = bienes.filter(b => {
    const matchTipo = !tipo || b.tipo === tipo
    const q = search.toLowerCase()
    const matchQ = !q || bienRef(b).toLowerCase().includes(q) || (b.descripcion || '').toLowerCase().includes(q)
    return matchTipo && matchQ
  })

  const rows = filt.map(b => {
    const Icon = TIPO_ICON[b.tipo] ?? Package
    return {
      tipo_label: (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold">
          <Icon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          {TIPO_LABEL[b.tipo] ?? b.tipo}
        </span>
      ),
      ref:     bienRef(b),
      titular: b.persona?.nombre ?? '—',
      valor:   b.valor_declarado ? `$${Number(b.valor_declarado).toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '—',
      acc: (
        <div className="flex gap-1 justify-center">
          {canDelete && (
            <button
              onClick={() => showModal('confirmDelete', {
                name: `Bien #${b.id}`,
                onConfirm: async () => { await deleteBien(b.id); load() },
              })}
              className="p-1.5 rounded-lg bg-rose-50 text-rose-500 hover:bg-rose-100 transition"
              title="Eliminar"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      ),
    }
  })

  return (
    <div className="animate-in fade-in duration-500 space-y-5">
      {/* Hero */}
      <div className="relative rounded-[2rem] overflow-hidden" style={{ background: 'linear-gradient(135deg,#001463 0%,#000c3b 55%,#001a6e 100%)' }}>
        <div className="relative flex flex-col sm:flex-row sm:items-center gap-6 p-6 sm:p-9">
          <div className="flex-1 min-w-0">
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/15 rounded-full px-3 py-1.5 mb-3">
              <Package className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-xs font-bold text-white/70 uppercase tracking-wider">J&M · Bienes Asegurados</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white leading-snug mb-1.5">
              Bienes <span className="text-emerald-400">asegurados</span>
            </h2>
            <p className="text-sm text-white/50">Vehículos, inmuebles y otros activos registrados en el sistema.</p>
          </div>
        </div>
        <div className="grid grid-cols-3 border-t border-white/10">
          {[
            [`${bienes.length} registros`, 'Total bienes', ShieldCheck],
            [`${bienes.filter(b => b.tipo === 'vehiculo').length} vehículos`, 'Tipo vehículo', Car],
            [`${tipos.length} tipos`, 'Categorías', Package],
          ].map(([val, label, Icon]) => (
            <div key={val} className="flex flex-col sm:flex-row items-center sm:gap-2 gap-1 px-4 py-3 text-center sm:text-left">
              <Icon className="w-3.5 h-3.5 text-white/35 shrink-0" />
              <div>
                <p className="text-xs font-bold text-white/65">{val}</p>
                <p className="text-[10px] text-white/30">{label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-3">
        <SearchBar value={search} onChange={setSearch} placeholder="Buscar por referencia…" className="w-full sm:w-64" />
        <select className="select-field text-sm w-auto" value={tipo} onChange={e => setTipo(e.target.value)}>
          <option value="">Todos los tipos</option>
          {tipos.map(t => <option key={t} value={t}>{TIPO_LABEL[t] ?? t}</option>)}
        </select>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm">
          <AlertTriangle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}

      <DataTable cols={COLS} rows={rows} loading={loading} emptyMsg="No hay bienes registrados." />
    </div>
  )
}
