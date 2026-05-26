import { useState, useEffect, useCallback } from 'react'
import { Pencil, Trash2, Plus, Eye, Car, ShieldCheck, AlertTriangle, Layers } from 'lucide-react'
import { useApp } from '../context/AppContext.jsx'
import { rsbadge } from '../utils/helpers.jsx'
import SearchBar from '../components/SearchBar.jsx'
import DataTable from '../components/DataTable.jsx'
import { fetchVehiculos, createVehiculo, updateVehiculo, deleteVehiculo } from '../api/vehiculos.js'
import { fetchClientes } from '../api/clientes.js'

const MARCAS = [
  'Toyota','Chevrolet','Ford','Hyundai','Kia','Jeep','Nissan',
  'Honda','Renault','Mazda','Volkswagen','Mitsubishi','Otro',
]
const TIPOS  = ['Sedán','SUV / Rústico','Camioneta','Motocicleta','Comercial','Particular','Otro']
const CLASES = ['Automóvil','Camioneta','Camión','Moto','Autobús','Otro']
const USOS   = ['Particular','Carga','Transporte Público','Oficial','Otro']
const AÑOS   = Array.from(
  { length: new Date().getFullYear() - 1989 },
  (_, i) => String(new Date().getFullYear() - i)
)

const COLS = [
  { k: 'placa',   l: 'Placa',       m: true, bold: true, nw: true },
  { k: 'disp',    l: 'Marca / Modelo', tr: true },
  { k: 'anio',    l: 'Año',         r: true, nw: true, hide: 'sm' },
  { k: 'tipo',    l: 'Tipo',        nw: true, hide: 'md' },
  { k: 'color',   l: 'Color',       nw: true, hide: 'lg' },
  { k: 'prop',    l: 'Propietario', tr: true, hide: 'sm' },
  { k: 'cedula',  l: 'Cédula',      m: true, nw: true, hide: 'md' },
  { k: 'est',     l: 'Estado',      nw: true },
  { k: 'acc',     l: '',            acc: true },
]

const vehiculoFields = (v = {}, clienteOpts = []) => {
  const isNew = !v.id
  const r = isNew

  return [
    { sep: 'Propietario' },
    { label: 'Cliente propietario', fname: 'cliente_id', type: 'select',
      opts: clienteOpts, val: v.cliente_id ? String(v.cliente_id) : '', req: true, span: true },

    { sep: 'Datos del Vehículo' },
    { label: 'Placa',        fname: 'placa',  val: v.placa  || '', req: true,  ph: 'ABC-123' },
    { label: 'Marca',        fname: 'marca',  type: 'select', opts: MARCAS, val: v.marca  || '', req: true },
    { label: 'Modelo',       fname: 'modelo', val: v.modelo || '', req: true,  ph: 'Corolla, Spark…' },
    { label: 'Año',          fname: 'anio',   type: 'select', opts: AÑOS,   val: v.anio ? String(v.anio) : '', req: true },
    { label: 'Color',        fname: 'color',  val: v.color  || '', req: r,    ph: 'Blanco, Negro…' },
    { label: 'Tipo',         fname: 'tipo',   type: 'select', opts: TIPOS,  val: v.tipo  || '', req: r },
    { label: 'Clase',        fname: 'clase',  type: 'select', opts: CLASES, val: v.clase || '', req: r },
    { label: 'Uso',          fname: 'uso',    type: 'select', opts: USOS,   val: v.uso   || '', req: r },
    { label: 'Puestos',      fname: 'puestos', type: 'number', val: v.puestos ?? '', ph: '5', req: r },
    { label: 'Peso (kg)',    fname: 'peso',    type: 'number', val: v.peso    ?? '',            req: r },
    { label: 'Aparcamiento', fname: 'aparcamiento', val: v.aparcamiento || '', ph: 'Garaje, Calle…', req: r },

    { sep: 'Documentos' },
    { label: 'Serial Carrocería', fname: 'serial_carroceria',    val: v.serial_carroceria    || '', req: r },
    { label: 'Serial Motor',      fname: 'serial_motor',         val: v.serial_motor         || '', req: r },
    { label: 'Cert. Tránsito',    fname: 'certificado_transito', val: v.certificado_transito || '', req: r },
    { label: 'Cert. Origen',      fname: 'certificado_origen',   val: v.certificado_origen   || '', req: r },
    { label: 'Fecha Adquisición', fname: 'fecha_adquisicion', type: 'date', val: v.fecha_adquisicion || '', req: r },
    { label: 'Título',            fname: 'titulo', val: v.titulo || '', span: true, req: r },
  ]
}

const parsePayload = (data) => ({
  ...data,
  anio:              data.anio              ? parseInt(data.anio)    : undefined,
  puestos:           data.puestos           ? parseInt(data.puestos) || null : null,
  peso:              data.peso              ? parseInt(data.peso)    || null : null,
  fecha_adquisicion: data.fecha_adquisicion || null,
})

export default function Vehiculos() {
  const { showModal, showToast, canAct } = useApp()
  const canCreate = canAct('vehiculos', 'create')
  const canEdit   = canAct('vehiculos', 'edit')
  const canDelete = canAct('vehiculos', 'delete')

  const [vehiculos,   setVehiculos]   = useState([])
  const [clientes,    setClientes]    = useState([])
  const [loading,     setLoading]     = useState(true)
  const [error,       setError]       = useState(null)
  const [tipoFilter,  setTipoFilter]  = useState('')

  const loadVehiculos = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [vehs, clis] = await Promise.all([fetchVehiculos(), fetchClientes()])
      setVehiculos(vehs)
      setClientes(clis)
    } catch (err) {
      setError(err.message)
      showToast(err.message, 'error')
    } finally {
      setLoading(false)
    }
  }, [showToast])

  useEffect(() => { loadVehiculos() }, [loadVehiculos])

  const clienteOpts = clientes.map(c => ({ value: String(c.id), label: `${c.nom} — ${c.ci}` }))
  const tipoOptions = [...new Set(vehiculos.map(v => v.tipo).filter(Boolean))]
  const filtered    = tipoFilter ? vehiculos.filter(v => v.tipo === tipoFilter) : vehiculos

  const asegurados = vehiculos.filter(v => v.estado === 'Activo').length
  const sinSeguro  = vehiculos.length - asegurados
  const tiposCount = new Set(vehiculos.map(v => v.tipo).filter(Boolean)).size

  const dataRows = filtered.map(v => ({
    placa:  v.placa,
    disp:   `${v.marca} ${v.modelo}`,
    anio:   v.anio,
    tipo:   v.tipo,
    color:  v.color || '—',
    prop:   v.propietario,
    cedula: v.cedula,
    est:    rsbadge(v.estado),
    acc: (
      <div className="flex gap-1 justify-center flex-nowrap">
        <button
          onClick={() => showModal('vehiculoDetail', { v })}
          className="p-1.5 sm:p-2 rounded-lg bg-slate-50 text-slate-500 hover:bg-slate-100 transition inline-flex items-center justify-center"
          title="Ver detalles"
        >
          <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </button>
        {canEdit && (
          <button
            onClick={() => showModal('vehiculoForm', {
              v,
              clienteOpts,
              onSave: async (data) => {
                await updateVehiculo(v.id, data)
                await loadVehiculos()
              },
            })}
            className="p-1.5 sm:p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition inline-flex items-center justify-center"
            title="Editar"
          >
            <Pencil className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        )}
        {canDelete && (
          <button
            onClick={() => showModal('confirmDelete', {
              name: `Vehículo ${v.placa}`,
              onConfirm: async () => {
                await deleteVehiculo(v.id)
                await loadVehiculos()
              },
            })}
            className="p-1.5 sm:p-2 rounded-lg bg-rose-50 text-rose-500 hover:bg-rose-100 transition inline-flex items-center justify-center"
            title="Eliminar"
          >
            <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        )}
      </div>
    ),
  }))

  if (!canAct('vehiculos', 'view')) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
        <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center">
          <Car className="w-6 h-6 text-slate-400" />
        </div>
        <p className="font-semibold text-slate-600">Sin acceso</p>
        <p className="text-xs text-slate-400">No tienes permiso para acceder a este módulo.</p>
      </div>
    )
  }

  return (
    <div className="animate-in fade-in duration-500">
      {/* ── Cards de resumen ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { l: 'Total Vehículos', v: vehiculos.length, sub: `${tiposCount} tipos`,       Icon: Car,           bg: 'bg-slate-100',   ic: 'text-slate-600'   },
          { l: 'Asegurados',      v: asegurados,        sub: 'Con cobertura activa',      Icon: ShieldCheck,   bg: 'bg-emerald-100', ic: 'text-emerald-600' },
          { l: 'Tipos distintos', v: tiposCount,        sub: 'Sedán, SUV, Moto…',         Icon: Layers,        bg: 'bg-blue-100',    ic: 'text-blue-600'    },
          { l: 'Sin Cobertura',   v: sinSeguro,         sub: 'Requieren atención',        Icon: AlertTriangle, bg: 'bg-rose-100',    ic: 'text-rose-600'    },
        ].map(({ l, v, sub, Icon, bg, ic }) => (
          <div key={l} className="card p-4 flex items-start gap-3">
            <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center shrink-0`}>
              <Icon className={`w-4 h-4 ${ic}`} />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-slate-500 font-medium leading-tight">{l}</p>
              <p className="text-xl font-black text-slate-800 mt-0.5 leading-none">{v ?? 0}</p>
              <p className="text-xs text-slate-400 mt-1">{sub}</p>
            </div>
          </div>
        ))}
      </div>

      <SearchBar
        placeholder="Buscar por placa, marca o propietario…"
        extra={
          <>
            {/* Filtro por tipo */}
            <select
              className="text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 min-w-[140px]"
              value={tipoFilter}
              onChange={e => setTipoFilter(e.target.value)}
            >
              <option value="">Todos los tipos</option>
              {tipoOptions.map(t => <option key={t}>{t}</option>)}
            </select>

            {canCreate && (
              <button
                onClick={() => showModal('vehiculoForm', {
                  v: {},
                  clienteOpts,
                  onSave: async (data) => {
                    await createVehiculo(data)
                    await loadVehiculos()
                  },
                })}
                className="btn-primary ml-auto"
              >
                <Plus className="w-4 h-4" />Registrar
              </button>
            )}
          </>
        }
      />

      {loading ? (
        <div className="flex justify-center items-center py-16 text-slate-400 text-sm gap-2">
          <div className="w-4 h-4 border-2 border-slate-300 border-t-sefired-blue rounded-full animate-spin" />
          Cargando vehículos…
        </div>
      ) : error ? (
        <p className="text-center text-rose-500 text-sm py-8">{error}</p>
      ) : (
        <DataTable cols={COLS} rows={dataRows} searchable />
      )}
    </div>
  )
}
