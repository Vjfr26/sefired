/**
 * Clientes — Módulo de gestión de clientes y sus pólizas.
 *
 * Esta página muestra todos los clientes registrados en el sistema con:
 *   - Tarjetas de resumen (total, activos, bloqueados, con póliza y sin póliza)
 *   - Tabla ordenable y filtrable por nombre, CI o email
 *   - Botón de imprimir: genera un PDF con el listado completo (logo + tabla + pie)
 *   - Botón de agregar: abre el formulario de nuevo cliente
 *   - Por cada fila: Ver detalles, Editar, Renovar póliza, Activar/Desactivar, Eliminar
 *
 * ── Cómo se obtiene el estado del cliente ────────────────────────────────────
 * El backend calcula el estado de cada cliente según dos criterios:
 *   1. Si el campo `activo` es false → "Bloqueado" (desactivado manualmente)
 *   2. Si tiene póliza con status ACTIVA → "Activo"
 *   3. Si no tiene pólizas activas → "Inactivo"
 *
 * ── Flujo del formulario de cliente ─────────────────────────────────────────
 * Los datos del cliente viven en dos tablas: `persona` (datos personales reutilizables)
 * y `cliente` (el rol dentro del sistema). El backend maneja esta separación de forma
 * transparente: el frontend solo envía un objeto plano con todos los campos.
 */
import { useState, useEffect, useCallback } from 'react'
import { Pencil, RefreshCw, Trash2, UserPlus, Users, UserCheck, UserX, ShieldCheck, Eye, Lock, LockOpen, Receipt, ClipboardList, FolderOpen, AlertTriangle, MoreVertical } from 'lucide-react'
import { useApp } from '../context/AppContext.jsx'
import { rsbadge } from '../utils/helpers.jsx'
import SearchBar from '../components/SearchBar.jsx'
import DataTable from '../components/DataTable.jsx'
import { SkeletonStatCards } from '../components/Skeleton.jsx'
import { fetchClientes, createCliente, updateCliente, deleteCliente, toggleCliente } from '../api/clientes.js'

// Convierte el ID numérico del backend al formato visual "CLI-0001"
const fmtId = id => 'CLI-' + String(id).padStart(4, '0')

// ── Opciones de selectores del formulario ────────────────────────────────────
const ESTADOS_VE = [
  'Amazonas','Anzoátegui','Apure','Aragua','Barinas','Bolívar','Carabobo',
  'Cojedes','Delta Amacuro','Distrito Capital','Falcón','Guárico','Lara',
  'Mérida','Miranda','Monagas','Nueva Esparta','Portuguesa','Sucre',
  'Táchira','Trujillo','La Guaira','Yaracuy','Zulia',
]
const OPT_CONDICION    = ['Soltero/a', 'Casado/a', 'Viudo/a', 'Divorciado/a', 'Concubino/a']
const OPT_SEXO         = ['Masculino', 'Femenino']
const OPT_NACIONALIDAD = ['Venezolano/a', 'Extranjero/a']

/**
 * Genera el array de descriptores de campo para el formulario de cliente.
 * Se usa tanto al crear (sin argumentos) como al editar (pasando el objeto del cliente).
 * Los campos están agrupados en secciones visuales (sep) para facilitar la lectura.
 *
 * @param {Object} c  Datos del cliente para pre-llenar al editar (vacío al crear)
 */
const clienteFields = (c = {}) => [
  { sep: 'Datos Personales' },
  { label: 'Nombre completo',   fname: 'nombre',       val: c.nombre,      ph: 'Nombre y Apellido',      span: true, req: true },
  { label: 'CI / RIF',          fname: 'cedula',        val: c.cedula,      ph: 'V-00.000.000',           req: true },
  { label: 'Condición',         fname: 'condicion',     val: c.condicion,   type: 'select', opts: OPT_CONDICION,    req: true },
  { label: 'Sexo',              fname: 'sexo',          val: c.sexo,        type: 'select', opts: OPT_SEXO,         req: true },
  { label: 'Fecha de nacimiento', fname: 'nacimiento',  val: c.nacimiento,  type: 'date',                 req: true },
  { label: 'Nacionalidad',      fname: 'nacionalidad',  val: c.nacionalidad, type: 'select', opts: OPT_NACIONALIDAD, req: true },

  { sep: 'Contacto' },
  { label: 'Teléfono fijo',     fname: 'telefono',      val: c.telefono,    ph: '0212-000-0000' },
  { label: 'Celular',           fname: 'celular',       val: c.celular,     ph: '+58 414-000-0000' },
  { label: 'Correo electrónico', fname: 'correo',       val: c.correo,      ph: 'correo@ejemplo.com', type: 'email', span: true, req: true },

  { sep: 'Dirección' },
  { label: 'Estado',            fname: 'estado',        val: c.estado,      type: 'select', opts: ESTADOS_VE, req: true },
  { label: 'Ciudad',            fname: 'ciudad',        val: c.ciudad,      ph: 'Ciudad o municipio',     req: true },
  { label: 'Código postal',     fname: 'codigo_postal', val: c.codigo_postal, ph: '1010' },
  { label: 'Dirección',         fname: 'direccion',     val: c.direccion,   ph: 'Av. Principal, Edif. …', type: 'textarea', span: true, req: true },

  { sep: 'Actividad' },
  { label: 'Profesión',         fname: 'profesion',     val: c.profesion,   ph: 'Ej. Ingeniero, Médico…' },
  { label: 'Actividad económica', fname: 'actividad',   val: c.actividad,   ph: 'Ej. Comercio, Servicios…' },
]

// Columnas de la tabla. Las columnas menos importantes se ocultan en pantallas pequeñas.
const COLS = [
  { k: 'displayId', l: 'ID',              m: true, bold: true, hide: 'xl' },
  { k: 'nom',       l: 'Nombre Completo', tr: true },
  { k: 'ci',        l: 'CI / RIF',        m: true, bold: true, hide: 'sm' },
  { k: 'vendCell',  l: 'Vendedor',        hide: 'xl', nw: true },
  { k: 'polNum',    l: 'N° Póliza',       hide: 'md' },
  { k: 'primaCell', l: 'Prima',           hide: 'md', nw: true },
  { k: 'vigCell',   l: 'Vigencia',        hide: 'xl', nw: true },
  { k: 'est',       l: 'Estado',          nw: true },
  { k: 'acc',       l: '',                acc: true },
]

export default function Clientes() {
  const { showModal, showToast, canAct } = useApp()
  const [search, setSearch]     = useState('')
  const [soloDocsPend, setSoloDocsPend] = useState(false) // filtrar solo con documentos obligatorios pendientes
  const [clients, setClients]   = useState([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState(null)

  // showToast es estable (memoizado en AppContext) así que incluirlo aquí no provoca bucles
  const loadClientes = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchClientes()
      setClients(data)
    } catch (err) {
      setError(err.message)
      showToast(err.message, 'error')
    } finally {
      setLoading(false)
    }
  }, [showToast])

  // Carga inicial al montar el componente
  useEffect(() => { loadClientes() }, [loadClientes])



  // ── Filtrado local ────────────────────────────────────────────────────────
  // La búsqueda trabaja sobre los datos ya cargados en memoria, sin peticiones adicionales
  const filtered = clients.filter(c => {
    if (soloDocsPend && !c.documentos_faltantes) return false
    if (search) {
      const q = search.toLowerCase()
      return c.nom.toLowerCase().includes(q) || c.ci.toLowerCase().includes(q) || c.email.toLowerCase().includes(q)
    }
    return true
  })

  // ── Estadísticas para los cards ───────────────────────────────────────────
  const activos    = clients.filter(c => c.est === 'Activo').length
  const conPoliza  = clients.filter(c => c.prima && c.prima !== '—').length
  const docsPendientes = clients.filter(c => c.documentos_faltantes).length

  // ── Transformación de datos para la tabla ─────────────────────────────────
  // Se mantiene el objeto original (con todos los campos del backend) y se agregan
  // los campos de visualización: displayId, est (badge responsivo), acc (botones)
  const canEditClientes   = canAct('clientes', 'edit')
  const canDeleteClientes = canAct('clientes', 'delete')
  const canCreateCliente  = canAct('clientes', 'create')
  const canBlockCliente   = canAct('clientes', 'block')
  const canViewPolizas    = canAct('clientes', 'view_polizas')
  const canViewFacturas   = canAct('clientes', 'view_facturas')
  const canViewDocs       = canAct('clientes', 'view_docs')
  const canViewCards      = canAct('clientes', 'view_cards')
  const canViewList       = canAct('clientes', 'view_list')

  if (!canAct('clientes', 'view')) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
        <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center">
          <Lock className="w-6 h-6 text-slate-400" />
        </div>
        <p className="font-semibold text-slate-600">Sin acceso</p>
        <p className="text-xs text-slate-400">No tienes permiso para acceder a este módulo.</p>
      </div>
    )
  }

  const dataRows = filtered.map(c => {
    const tienePoliza = c.pol && c.pol !== '—'
    const isBlocked   = c.activo === false

    const polNum = (
      <span className={`font-mono font-bold text-xs sm:text-sm whitespace-nowrap ${tienePoliza ? 'text-emerald-700' : 'text-slate-400'}`}>
        {tienePoliza ? c.pol : <span className="italic font-normal">Sin póliza</span>}
      </span>
    )

    // Antes se basaba solo en "no subió ningún documento" (documentos_count
    // === 0), así que un cliente cuyo producto no pide documentos también
    // se veía con la advertencia. Ahora el backend ya compara contra los
    // documentos que el producto realmente exige (ver tieneDocumentosFaltantes).
    const sinDocumentos = !!c.documentos_faltantes

    const vendCell = c.vendedor_nombre
      ? <span className="text-xs sm:text-sm font-medium text-slate-600">{c.vendedor_nombre}</span>
      : <span className="text-slate-300 text-xs sm:text-sm italic">Sin asignar</span>

    const primaCell = tienePoliza
      ? <span className="font-semibold text-xs sm:text-sm text-slate-700 whitespace-nowrap">{c.prima}</span>
      : <span className="text-slate-300 text-xs sm:text-sm">—</span>

    const vigCell = (() => {
      if (!tienePoliza || !c.vig || c.vig === '—') return <span className="text-slate-300 text-xs sm:text-sm">—</span>
      const [inicio, fin] = c.vig.split(' – ')
      const vencido = c.dias_vencimiento !== null && c.dias_vencimiento !== undefined && c.dias_vencimiento < 0
      const porVencer = c.dias_vencimiento !== null && c.dias_vencimiento !== undefined && c.dias_vencimiento >= 0 && c.dias_vencimiento <= 30
      return (
        <div className="leading-tight">
          <p className="text-xs sm:text-sm text-slate-400">{inicio}</p>
          <p className={`text-xs sm:text-sm font-semibold ${vencido ? 'text-rose-600' : porVencer ? 'text-amber-600' : 'text-slate-600'}`}>{fin}</p>
        </div>
      )
    })()

    const nomCell = (
      <span className="inline-flex items-center gap-1.5 min-w-0">
        <span className="break-words">{c.nom}</span>
        {sinDocumentos && (
          <span title="Faltan documentos obligatorios por subir" className="inline-flex shrink-0">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
          </span>
        )}
      </span>
    )

    return {
      ...c,
      displayId: fmtId(c.id),
      nom: nomCell,
      polNum,
      primaCell,
      vigCell,
      vendCell,
      est: rsbadge(c.est),
      acc: (() => {
        const actions = [
          { icon: Eye, label: 'Ver detalles', color: 'slate', onClick: () => showModal('clienteDetail', { c }) },
          canViewPolizas && { icon: ClipboardList, label: 'Ver pólizas', color: 'indigo', onClick: () => showModal('clienteHistorial', { c, onSaved: loadClientes }) },
          canViewDocs && { icon: FolderOpen, label: sinDocumentos ? 'Documentos (faltan obligatorios)' : 'Documentos del cliente', color: 'amber', onClick: () => showModal('clienteDocumentos', { c, onSaved: loadClientes }) },
          tienePoliza && canViewFacturas && { icon: Receipt, label: 'Ver recibos', color: 'amber', onClick: () => showModal('clienteFacturas', { c }) },
          canEditClientes && { icon: Pencil, label: 'Editar datos', color: 'blue', onClick: () => showModal('clienteForm', {
            cliente: c,
            onSave: async (data) => { await updateCliente(c.id, data); await loadClientes() },
          }) },
          canBlockCliente && { icon: isBlocked ? LockOpen : Lock, label: isBlocked ? 'Activar cliente' : 'Desactivar cliente', color: isBlocked ? 'teal' : 'orange', onClick: () => showModal('blockCliente', {
            nom: c.nom,
            activo: c.activo,
            onConfirm: async (motivo) => { await toggleCliente(c.id, motivo); await loadClientes() },
          }) },
          canDeleteClientes && { icon: Trash2, label: 'Eliminar cliente', color: 'rose', onClick: () => showModal('confirmDelete', {
            name: c.nom,
            onConfirm: async () => { await deleteCliente(c.id); await loadClientes() },
          }) },
        ].filter(Boolean)

        const BTN_CLS = {
          slate:   'bg-slate-50 text-slate-500 hover:bg-slate-100',
          indigo:  'bg-indigo-50 text-indigo-600 hover:bg-indigo-100',
          amber:   sinDocumentos ? 'bg-amber-100 text-amber-700 hover:bg-amber-200' : 'bg-amber-50 text-amber-600 hover:bg-amber-100',
          blue:    'bg-blue-50 text-blue-600 hover:bg-blue-100',
          teal:    'bg-teal-50 text-teal-600 hover:bg-teal-100',
          orange:  'bg-orange-50 text-orange-600 hover:bg-orange-100',
          rose:    'bg-rose-50 text-rose-500 hover:bg-rose-100',
        }

        return (
          <>
            {/* Desktop/tablet: fila completa de botones */}
            <div className="hidden sm:flex gap-1.5 justify-center flex-wrap items-center">
              {actions.map((a, i) => (
                <button key={i} onClick={a.onClick} className={`p-2.5 rounded-lg transition inline-flex items-center justify-center ${BTN_CLS[a.color]}`} title={a.label}>
                  <a.icon className="w-[18px] h-[18px]" />
                </button>
              ))}
            </div>
            {/* Móvil: un solo botón que abre el menú de acciones */}
            <div className="sm:hidden flex justify-center">
              <button
                onClick={() => showModal('actionMenu', { title: c.nom, actions })}
                className="p-2.5 rounded-lg bg-slate-50 text-slate-500 hover:bg-slate-100 transition inline-flex items-center justify-center"
                title="Más acciones"
              >
                <MoreVertical className="w-[18px] h-[18px]" />
              </button>
            </div>
          </>
        )
      })(),
    }
  })

  return (
    <div className="animate-in fade-in duration-500">
      {/* ── Cards de resumen ── */}
      {canViewCards && (loading ? <SkeletonStatCards count={4} /> : <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="card p-4 flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
            <Users className="w-4 h-4 text-slate-600" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-slate-500 font-medium leading-tight">Total Clientes</p>
            <p className="text-xl font-black text-slate-800 mt-0.5 leading-none">{clients.length}</p>
            <p className="text-xs text-slate-400 mt-1 truncate">Registrados en el sistema</p>
          </div>
        </div>
        <div className="card p-4 flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
            <UserCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-slate-500 font-medium leading-tight">Activos</p>
            <p className="text-xl font-black text-slate-800 mt-0.5 leading-none">{activos}</p>
            <p className="text-xs text-slate-400 mt-1">Con póliza vigente</p>
          </div>
        </div>
        <div className="card p-4 flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-slate-500 font-medium leading-tight">Con Póliza</p>
            <p className="text-xl font-black text-slate-800 mt-0.5 leading-none">{conPoliza}</p>
            <p className="text-xs text-slate-400 mt-1">Seguros vigentes</p>
          </div>
        </div>
        <div className="card p-4 flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-rose-100 flex items-center justify-center shrink-0">
            <UserX className="w-4 h-4 text-rose-600" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-slate-500 font-medium leading-tight">Sin Póliza</p>
            <p className="text-xl font-black text-slate-800 mt-0.5 leading-none">{clients.length - conPoliza}</p>
            <p className="text-xs text-slate-400 mt-1">Sin cobertura</p>
          </div>
        </div>
      </div>)}

      <SearchBar
        placeholder="Buscar por nombre, CI/RIF o email…"
        onSearch={setSearch}
        extra={
          <>
            {canViewDocs && (
              <button
                onClick={() => setSoloDocsPend(v => !v)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition whitespace-nowrap ${
                  soloDocsPend ? 'bg-amber-500 text-white border-amber-500' : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                }`}
                title="Mostrar solo clientes con documentos obligatorios pendientes"
              >
                <FolderOpen className="w-4 h-4 shrink-0" />
                Docs. pendientes{docsPendientes > 0 ? ` (${docsPendientes})` : ''}
              </button>
            )}

            {canCreateCliente && (
              <button
                onClick={() => showModal('clienteForm', {
                  cliente: null,
                  onSave: async (data) => {
                    await createCliente(data)
                    await loadClientes()
                  },
                })}
                className="btn-primary ml-auto"
              >
                <UserPlus className="w-4 h-4" />Agregar Cliente
              </button>
            )}
          </>
        }
      />

      {error && !loading && (
        <div className="text-center py-12 text-rose-500 text-sm">{error}</div>
      )}
      {!error && (canViewList
        ? <DataTable cols={COLS} rows={dataRows} loading={loading} />
        : (
          <div className="card flex flex-col items-center justify-center py-16 gap-2 text-center">
            <Lock className="w-6 h-6 text-slate-300" />
            <p className="text-xs text-slate-400">No tienes permiso para ver el listado de clientes.</p>
          </div>
        )
      )}

    </div>
  )
}
