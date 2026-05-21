/**
 * Vehiculos — Módulo de gestión de vehículos asegurados.
 *
 * Muestra todos los vehículos registrados en el sistema con:
 *   - Tarjetas de resumen (total, asegurados, tipos distintos, sin cobertura)
 *   - Tabla ordenable con filtro por tipo de vehículo
 *   - Búsqueda por placa, marca o propietario
 *   - Por cada fila: Ver detalles, Editar, Eliminar
 *
 * ── Relación con clientes ─────────────────────────────────────────────────
 * Un vehículo siempre pertenece a un cliente. Al registrar un vehículo nuevo
 * se debe seleccionar el propietario de la lista de clientes existentes.
 * Por eso este módulo hace DOS peticiones al cargar: vehículos y clientes.
 *
 * ── Estado de cobertura ───────────────────────────────────────────────────
 * El backend calcula si el vehículo está "Activo" (tiene póliza vigente)
 * o "Inactivo" (sin cobertura). Este cálculo se hace en el servidor porque
 * requiere revisar la cadena solicitud → poliza, no solo la tabla vehiculo.
 *
 * ── Campos obligatorios vs opcionales ────────────────────────────────────
 * Al registrar un vehículo nuevo, todos los campos son obligatorios.
 * Al editar, solo placa, marca, modelo y año son requeridos.
 * El flag `isNew` en vehiculoFields() gestiona esta diferencia automáticamente.
 */
import { useState, useEffect, useCallback } from 'react'
import { Pencil, Trash2, Plus, Eye, Car, ShieldCheck, AlertTriangle, Layers } from 'lucide-react'
import { useApp } from '../context/AppContext.jsx'
import { rsbadge } from '../utils/helpers.jsx'
import SearchBar from '../components/SearchBar.jsx'
import DataTable from '../components/DataTable.jsx'
import { fetchVehiculos, createVehiculo, updateVehiculo, deleteVehiculo } from '../api/vehiculos.js'
import { fetchClientes } from '../api/clientes.js'

// Listas de opciones para los selectores del formulario
const MARCAS = [
  'Toyota','Chevrolet','Ford','Hyundai','Kia','Jeep','Nissan',
  'Honda','Renault','Mazda','Volkswagen','Mitsubishi','Otro',
]
const TIPOS  = ['Sedán','SUV / Rústico','Camioneta','Motocicleta','Comercial','Particular','Otro']
const CLASES = ['Automóvil','Camioneta','Camión','Moto','Autobús','Otro']
const USOS   = ['Particular','Carga','Transporte Público','Oficial','Otro']
// Genera años desde 1990 hasta el año siguiente al actual
const AÑOS   = Array.from(
  { length: new Date().getFullYear() - 1989 },
  (_, i) => String(new Date().getFullYear() - i)
)

// Columnas de la tabla. Las menos críticas se ocultan en pantallas pequeñas.
const COLS = [
  { k: 'placa',  l: 'Placa',           m: true,  nw: true },
  { k: 'disp',   l: 'Marca / Modelo',  tr: true },
  { k: 'anio',   l: 'Año',             r: true,  nw: true, hide: 'sm' },
  { k: 'tipo',   l: 'Tipo',            nw: true, hide: 'md' },
  { k: 'prop',   l: 'Propietario',     tr: true, hide: 'sm' },
  { k: 'cedula', l: 'Cédula',          m: true,  nw: true, hide: 'md' },
  { k: 'est',    l: 'Estado',          nw: true },
  { k: 'acc',    l: '',                acc: true },
]

/**
 * Genera los descriptores de campo para el formulario de vehículo.
 * El comportamiento cambia según si se está creando o editando:
 *   - Crear (isNew=true):  todos los campos son obligatorios
 *   - Editar (isNew=false): solo placa, marca, modelo y año son requeridos
 *
 * @param {Object} v            Datos del vehículo para pre-llenar al editar
 * @param {Array}  clienteOpts  Lista de clientes en formato {value, label} para el selector
 */
const vehiculoFields = (v = {}, clienteOpts = []) => {
  const isNew = !v.id
  const r = isNew  // atajo: req solo aplica para registros nuevos

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

/**
 * Convierte los valores string que llegan de FormData a los tipos
 * correctos que espera el backend (enteros para año, puestos y peso).
 * Los campos vacíos se envían como null para que el backend los trate como opcionales.
 */
const parsePayload = (data) => ({
  ...data,
  anio:              data.anio              ? parseInt(data.anio)    : undefined,
  puestos:           data.puestos           ? parseInt(data.puestos) || null : null,
  peso:              data.peso              ? parseInt(data.peso)    || null : null,
  fecha_adquisicion: data.fecha_adquisicion || null,
})

export default function Vehiculos() {
  const { showModal, showToast } = useApp()

  const [vehiculos, setVehiculos]   = useState([])
  const [clientes, setClientes]     = useState([])
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState(null)
  // Filtro adicional por tipo de vehículo (además de la búsqueda de texto)
  const [tipoFilter, setTipoFilter] = useState('')

  // Carga vehículos y clientes en paralelo (Promise.all) para una sola espera
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

  // Transforma la lista de clientes al formato {value, label} que espera el selector
  const clienteOpts = clientes.map(c => ({ value: String(c.id), label: `${c.nom} — ${c.ci}` }))
  // Extrae los tipos únicos de la lista para el filtro desplegable
  const tipoOptions = [...new Set(vehiculos.map(v => v.tipo).filter(Boolean))]
  const filtered    = tipoFilter ? vehiculos.filter(v => v.tipo === tipoFilter) : vehiculos

  // ── Estadísticas para los cards ───────────────────────────────────────────
  const asegurados  = vehiculos.filter(v => v.estado === 'Activo').length
  const sinSeguro   = vehiculos.length - asegurados
  const tiposCount  = new Set(vehiculos.map(v => v.tipo).filter(Boolean)).size

  // ── Transformación para la tabla ──────────────────────────────────────────
  const dataRows = filtered.map(v => ({
    ...v,
    disp:   `${v.marca} ${v.modelo}`,   // columna combinada de marca y modelo
    ap:     v.aparcamiento,
    s_car:  v.serial_carroceria,
    s_mot:  v.serial_motor,
    cert_t: v.certificado_transito,
    cert_o: v.certificado_origen,
    f_adq:  v.fecha_adquisicion,
    prop:   v.propietario,
    est:    rsbadge(v.estado),          // badge responsivo (texto en md+, ícono en móvil)
    acc: (
      <div className="flex gap-1 justify-center flex-nowrap">
        {/* Ver detalles: ficha completa con todos los datos del vehículo */}
        <button
          onClick={() => showModal('vehiculoDetail', { v })}
          className="p-2 rounded-lg bg-slate-50 text-slate-500 hover:bg-slate-100 transition inline-flex items-center justify-center"
          title="Ver detalles"
        >
          <Eye className="w-4 h-4" />
        </button>
        {/* Editar: pre-llena el formulario con los datos actuales */}
        <button
          onClick={() => showModal('editForm', {
            title: `Editar Vehículo — ${v.placa}`,
            wide: true,
            fields: vehiculoFields(v, clienteOpts),
            onSave: async (data) => {
              await updateVehiculo(v.id, parsePayload(data))
              await loadVehiculos()
            },
          })}
          className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition inline-flex items-center justify-center"
          title="Editar"
        >
          <Pencil className="w-4 h-4" />
        </button>
        {/* Eliminar: bloqueado si el vehículo tiene conductores registrados */}
        <button
          onClick={() => showModal('confirmDelete', {
            name: `Vehículo ${v.placa}`,
            onConfirm: async () => {
              await deleteVehiculo(v.id)
              await loadVehiculos()
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
      {/* ── Cards de resumen ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="card p-4 flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
            <Car className="w-4 h-4 text-slate-600" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-slate-500 font-medium leading-tight">Total Vehículos</p>
            <p className="text-xl font-black text-slate-800 mt-0.5 leading-none">{vehiculos.length}</p>
            <p className="text-xs text-slate-400 mt-1">{tiposCount} tipos</p>
          </div>
        </div>
        <div className="card p-4 flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-slate-500 font-medium leading-tight">Asegurados</p>
            <p className="text-xl font-black text-slate-800 mt-0.5 leading-none">{asegurados}</p>
            <p className="text-xs text-slate-400 mt-1">Con cobertura activa</p>
          </div>
        </div>
        <div className="card p-4 flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
            <Layers className="w-4 h-4 text-blue-600" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-slate-500 font-medium leading-tight">Tipos distintos</p>
            <p className="text-xl font-black text-slate-800 mt-0.5 leading-none">{tiposCount}</p>
            <p className="text-xs text-slate-400 mt-1">Sedán, SUV, Moto…</p>
          </div>
        </div>
        <div className="card p-4 flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-rose-100 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-slate-500 font-medium leading-tight">Sin Cobertura</p>
            <p className="text-xl font-black text-slate-800 mt-0.5 leading-none">{sinSeguro}</p>
            <p className="text-xs text-slate-400 mt-1">Requieren atención</p>
          </div>
        </div>
      </div>

      <SearchBar
        placeholder="Buscar por placa, marca o propietario…"
        extra={
          <>
            {/* Filtro adicional por tipo de vehículo (complementa la búsqueda de texto) */}
            <select
              className="text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 min-w-[150px]"
              value={tipoFilter}
              onChange={e => setTipoFilter(e.target.value)}
            >
              <option value="">Todos los tipos</option>
              {tipoOptions.map(t => <option key={t}>{t}</option>)}
            </select>
            <button
              onClick={() => showModal('editForm', {
                title: 'Registrar Vehículo',
                wide: true,
                fields: vehiculoFields({}, clienteOpts),
                onSave: async (data) => {
                  await createVehiculo(parsePayload(data))
                  await loadVehiculos()
                },
              })}
              className="btn-primary"
            >
              <Plus className="w-4 h-4" />Registrar
            </button>
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
        // searchable=true activa la búsqueda interna de DataTable
        <DataTable cols={COLS} rows={dataRows} searchable />
      )}
    </div>
  )
}
