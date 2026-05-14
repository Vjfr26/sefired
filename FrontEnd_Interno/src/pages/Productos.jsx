import { useState } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { useApp } from '../context/AppContext.jsx'
import { rsbadge } from '../utils/helpers.jsx'
import SearchBar from '../components/SearchBar.jsx'
import DataTable from '../components/DataTable.jsx'

const rows = [
  { cod: 'AP',       nom: 'Accidentes Personales',    tipo: 'Personas',         tasa: '$12.00/occ',  desc: 'Por ocupante del vehículo',    est: 'Activo' },
  { cod: 'RCV',      nom: 'Resp. Civil Voluntaria',   tipo: 'Responsabilidad',  tasa: 'Variable',    desc: 'Suma asegurada a convenir',    est: 'Activo' },
  { cod: 'CASCO-PT', nom: 'Casco Pérdida Total',      tipo: 'Vehículo',         tasa: '1.80 %',      desc: 'Valor de mercado del vehículo',est: 'Activo' },
  { cod: 'CASCO-PP', nom: 'Casco Pérdida Parcial',    tipo: 'Vehículo',         tasa: '0.80 %',      desc: 'Daños físicos reparables',     est: 'Activo' },
  { cod: 'ROBO',     nom: 'Robo y Hurto',             tipo: 'Vehículo',         tasa: '0.60 %',      desc: 'Robo total o parcial',         est: 'Activo' },
  { cod: 'RC-OBL',   nom: 'RC Obligatoria',           tipo: 'Responsabilidad',  tasa: 'UT × Factor', desc: 'Obligatoria SUDEASEG',         est: 'Activo' },
  { cod: 'ASIST',    nom: 'Asistencia en Carretera',  tipo: 'Servicio',         tasa: '$8.00/año',   desc: 'Grúa, batería, llantas',       est: 'Activo' },
]

const COLS = [
  { k: 'cod',  l: 'Código',       m: true, hide: 'lg' },
  { k: 'nom',  l: 'Nombre',       tr: true },
  { k: 'tipo', l: 'Tipo',         hide: 'sm' },
  { k: 'tasa', l: 'Prima / Tasa', r: true, hide: 'md' },
  { k: 'desc', l: 'Descripción',  hide: 'lg', tr: true },
  { k: 'est',  l: 'Estado' },
  { k: 'acc',  l: '',             acc: true },
]

export default function Productos() {
  const { showModal, showToast } = useApp()
  const [search, setSearch] = useState('')
  const [tipoFilter, setTipoFilter] = useState('')

  const filtered = rows.filter(r => {
    const matchTipo = !tipoFilter || r.tipo === tipoFilter
    const q = search.toLowerCase()
    const matchSearch = !q || r.cod.toLowerCase().includes(q) || r.nom.toLowerCase().includes(q) ||
      r.tipo.toLowerCase().includes(q) || r.desc.toLowerCase().includes(q)
    return matchTipo && matchSearch
  })

  const dataRows = filtered.map(r => ({
    ...r,
    est: rsbadge(r.est),
    acc: (
      <div className="flex gap-1 justify-center flex-nowrap max-w-none">
        <button
          onClick={() => showModal('editForm', {
            title: 'Editar Cobertura',
            fields: [
              { label: 'Código',      val: r.cod },
              { label: 'Nombre',      val: r.nom },
              { label: 'Tipo',        val: r.tipo },
              { label: 'Tasa',        val: r.tasa },
              { label: 'Descripción', val: r.desc, span: true },
            ],
          })}
          className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition"
          title="Editar"
        >
          <Pencil className="w-4 h-4" />
        </button>
        <button
          onClick={() => showModal('confirmDelete', { name: r.nom })}
          className="p-2 rounded-lg bg-rose-50 text-rose-500 hover:bg-rose-100 transition"
          title="Eliminar"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    ),
  }))

  return (
    <div>
      <SearchBar
        placeholder="Buscar cobertura o código…"
        onSearch={setSearch}
        extra={
          <>
            <select
              className="text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
              onChange={e => setTipoFilter(e.target.value)}
            >
              <option value="">Todos los tipos</option>
              <option>Personas</option>
              <option>Vehículo</option>
              <option>Responsabilidad</option>
              <option>Servicio</option>
            </select>
            <button
              onClick={() => showModal('editForm', {
                title: 'Nueva Cobertura',
                fields: [
                  { label: 'Código',      ph: 'COD' },
                  { label: 'Nombre',      ph: 'Nombre de cobertura' },
                  { label: 'Tipo',        ph: 'Tipo' },
                  { label: 'Tasa',        ph: '0.00%' },
                  { label: 'Descripción', ph: 'Descripción', span: true },
                ],
              })}
              className="btn-primary ml-auto"
            >
              <Plus className="w-4 h-4" />Agregar
            </button>
          </>
        }
      />
      <DataTable cols={COLS} rows={dataRows} />
    </div>
  )
}
