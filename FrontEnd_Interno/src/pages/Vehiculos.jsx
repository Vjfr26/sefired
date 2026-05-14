import { useState } from 'react'
import { Pencil, Trash2, Plus } from 'lucide-react'
import { useApp } from '../context/AppContext.jsx'
import { rsbadge } from '../utils/helpers.jsx'
import SearchBar from '../components/SearchBar.jsx'
import DataTable from '../components/DataTable.jsx'

const MARCAS = ['Toyota','Chevrolet','Ford','Hyundai','Kia','Jeep','Nissan','Honda','Renault','Mazda','Volkswagen','Mitsubishi','Otro']
const TIPOS  = ['Sedán','SUV / Rústico','Camioneta','Comercial','Motocicleta']
const AÑOS   = Array.from({ length: 14 }, (_, i) => 2025 - i)

const initialVehicles = [
  { placa: 'ABC-123', marca: 'Toyota',    modelo: 'Corolla',  año: 2022, color: 'Blanco', tipo: 'Sedán',         prop: 'C. Rodríguez', est: 'Activo' },
  { placa: 'XYZ-456', marca: 'Ford',      modelo: 'Explorer', año: 2020, color: 'Negro',  tipo: 'SUV / Rústico', prop: 'M. González',  est: 'Activo' },
  { placa: 'DEF-789', marca: 'Chevrolet', modelo: 'Spark',    año: 2019, color: 'Rojo',   tipo: 'Sedán',         prop: 'J. Martínez',  est: 'Activo' },
  { placa: 'GHI-321', marca: 'Hyundai',   modelo: 'Tucson',   año: 2021, color: 'Plata',  tipo: 'SUV / Rústico', prop: 'A. López',     est: 'Activo' },
  { placa: 'JKL-654', marca: 'Kia',       modelo: 'Sportage', año: 2023, color: 'Azul',   tipo: 'SUV / Rústico', prop: 'L. Castillo',  est: 'Activo' },
  { placa: 'MNO-987', marca: 'Nissan',    modelo: 'Sentra',   año: 2018, color: 'Gris',   tipo: 'Sedán',         prop: 'V. Ramos',     est: 'Activo' },
]

const COLS = [
  { k: 'placa', l: 'Placa',           m: true,  hide: 'sm' },
  { k: 'disp',  l: 'Marca / Modelo',  tr: true },
  { k: 'año',   l: 'Año',             r: true,  hide: 'sm' },
  { k: 'color', l: 'Color',           hide: 'lg' },
  { k: 'tipo',  l: 'Tipo',            hide: 'md' },
  { k: 'prop',  l: 'Propietario',     hide: 'md', tr: true },
  { k: 'est',   l: 'Estado' },
  { k: 'acc',   l: '',                acc: true },
]

export default function Vehiculos() {
  const { showModal, showToast } = useApp()
  const [vehicles, setVehicles] = useState(initialVehicles)
  const [tipoFilter, setTipoFilter] = useState('')

  const filtered = tipoFilter
    ? vehicles.filter(v => v.tipo === tipoFilter)
    : vehicles

  const dataRows = filtered.map(v => ({
    ...v,
    disp: `${v.marca} ${v.modelo}`,
    est: rsbadge(v.est),
    acc: (
      <div className="flex gap-1 justify-center flex-nowrap max-w-none">
        <button
          onClick={() => showModal('editVeh', {
            placa: v.placa, marca: v.marca, modelo: v.modelo,
            año: String(v.año), color: v.color, tipo: v.tipo,
            prop: v.prop, est: v.est,
            marcas: MARCAS, tipos: TIPOS, años: AÑOS,
          })}
          className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition inline-flex items-center justify-center"
          title="Editar"
        >
          <Pencil className="w-4 h-4" />
        </button>
        <button
          onClick={() => showModal('deleteVeh', {
            placa: v.placa,
            onConfirm: () => setVehicles(prev => prev.filter(x => x.placa !== v.placa)),
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
    <div>
      <SearchBar
        placeholder="Buscar por placa, marca o propietario…"
        extra={
          <>
            <select
              className="text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 min-w-[150px]"
              value={tipoFilter}
              onChange={e => setTipoFilter(e.target.value)}
            >
              <option value="">Todos los tipos</option>
              {TIPOS.map(t => <option key={t}>{t}</option>)}
            </select>
            <button
              onClick={() => showModal('newVeh', { marcas: MARCAS, tipos: TIPOS, años: AÑOS })}
              className="btn-primary"
            >
              <Plus className="w-4 h-4" />Registrar
            </button>
          </>
        }
      />
      <DataTable cols={COLS} rows={dataRows} searchable />
    </div>
  )
}
