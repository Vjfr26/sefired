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
import { Pencil, RefreshCw, Trash2, Printer, UserPlus, Users, UserCheck, UserX, ShieldCheck, Eye, Lock, LockOpen } from 'lucide-react'
import { useApp } from '../context/AppContext.jsx'
import { rsbadge, usd, pdfPage, pdfHdr, pdfSec, pdfFooterSimple } from '../utils/helpers.jsx'
import SearchBar from '../components/SearchBar.jsx'
import DataTable from '../components/DataTable.jsx'
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
const OPT_CONDICION    = ['Soltero', 'Soltera', 'Casado', 'Casada', 'Viudo', 'Viuda', 'Divorciado', 'Divorciada', 'Concubino', 'Concubina']
const OPT_SEXO         = ['Masculino', 'Femenino']
const OPT_NACIONALIDAD = ['Venezolano', 'Venezolana', 'Extranjero', 'Extranjera']

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
  { k: 'displayId', l: 'ID',             m: true, hide: 'lg' },
  { k: 'nom',       l: 'Nombre Completo', tr: true },
  { k: 'ci',        l: 'CI / RIF',        m: true, hide: 'sm' },
  { k: 'tel',       l: 'Teléfono',        hide: 'md' },
  { k: 'email',     l: 'Email',           hide: 'lg', tr: true },
  { k: 'est',       l: 'Estado' },
  { k: 'acc',       l: '',               acc: true },
]

export default function Clientes() {
  const { showModal, showToast } = useApp()
  const [search, setSearch]   = useState('')
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)

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

  // ── Generación del PDF de listado de clientes ─────────────────────────────
  const handlePrintClientes = () => {
    // Se usa la URL absoluta del logo para que funcione en la ventana de impresión,
    // donde las rutas relativas no se resuelven correctamente.
    const logoUrl = window.location.origin + '/Logo_sin_fondo.png'

    // Función interna para generar el badge de estado en HTML con el color correcto
    const estBadge = est => {
      const col = est === 'Activo' ? '#10b981' : est === 'Bloqueado' ? '#f43f5e' : '#94a3b8'
      return `<span style="font-size:10px;font-weight:700;color:white;background:${col};padding:2px 8px;border-radius:999px">${est}</span>`
    }

    const tableRows = clients.map(c => `
      <tr style="border-bottom:1px solid #f1f5f9">
        <td style="padding:6px 4px;font-size:11px;color:#1e293b">${c.nom}</td>
        <td style="padding:6px 4px;font-size:11px;font-family:monospace;color:#475569">${c.ci}</td>
        <td style="padding:6px 4px;font-size:11px;color:#475569">${c.tel}</td>
        <td style="padding:6px 4px;font-size:11px;color:#475569">${c.email}</td>
        <td style="padding:6px 4px;font-size:11px;font-weight:600;color:#1e293b">${c.prima === '—' ? '<span style="color:#94a3b8">Sin póliza</span>' : c.prima}</td>
        <td style="padding:6px 4px;text-align:center">${estBadge(c.est)}</td>
      </tr>`).join('')

    const table = `<table style="width:100%;border-collapse:collapse;margin-top:4px">
      <thead>
        <tr style="background:#f8fafc;border-bottom:2px solid #e2e8f0">
          <th style="padding:7px 4px;font-size:9px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:1px;text-align:left">Nombre</th>
          <th style="padding:7px 4px;font-size:9px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:1px;text-align:left">CI / RIF</th>
          <th style="padding:7px 4px;font-size:9px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:1px;text-align:left">Teléfono</th>
          <th style="padding:7px 4px;font-size:9px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:1px;text-align:left">Email</th>
          <th style="padding:7px 4px;font-size:9px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:1px;text-align:left">Prima</th>
          <th style="padding:7px 4px;font-size:9px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:1px;text-align:center">Estado</th>
        </tr>
      </thead>
      <tbody>${tableRows}</tbody>
    </table>`

    const pagesHtml = pdfPage(
      pdfHdr('LISTADO DE CLIENTES', `${clients.length} clientes registrados`, '', new Date().toLocaleDateString('es-VE'), logoUrl) +
      pdfSec('CLIENTES REGISTRADOS') +
      table +
      pdfFooterSimple()
    )
    const w = window.open('', '_blank')
    w.document.write(`<!DOCTYPE html><html><head>
      <meta charset="UTF-8"><title>Listado de Clientes</title>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
      <style>
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        body{font-family:'Inter',system-ui,sans-serif;background:#525659;padding:32px;display:flex;flex-direction:column;align-items:center;gap:32px}
        .pdf-page{background:white;width:210mm;min-height:297mm;padding:18mm 20mm;box-shadow:0 4px 24px rgba(0,0,0,.3)}
        @media print{body{background:white;padding:0}@page{size:A4;margin:0}.pdf-page{box-shadow:none;page-break-after:always}}
      </style>
    </head><body>${pagesHtml}<script>window.onload=function(){setTimeout(function(){window.print();},600)}<\/script></body></html>`)
    w.document.close()
  }

  // ── Filtrado local ────────────────────────────────────────────────────────
  // La búsqueda trabaja sobre los datos ya cargados en memoria, sin peticiones adicionales
  const filtered = search
    ? clients.filter(c => {
        const q = search.toLowerCase()
        return c.nom.toLowerCase().includes(q) || c.ci.toLowerCase().includes(q) || c.email.toLowerCase().includes(q)
      })
    : clients

  // ── Estadísticas para los cards ───────────────────────────────────────────
  const activos    = clients.filter(c => c.est === 'Activo').length
  const bloqueados = clients.filter(c => c.est === 'Bloqueado').length
  const conPoliza  = clients.filter(c => c.prima && c.prima !== '—').length

  // ── Transformación de datos para la tabla ─────────────────────────────────
  // Se mantiene el objeto original (con todos los campos del backend) y se agregan
  // los campos de visualización: displayId, est (badge responsivo), acc (botones)
  const dataRows = filtered.map(c => ({
    ...c,
    displayId: fmtId(c.id),
    est: rsbadge(c.est),
    acc: (
      // En móvil los botones forman una grilla de 3 columnas; en escritorio una fila
      <div className="grid grid-cols-3 sm:flex sm:flex-nowrap gap-1.5 sm:gap-1 items-center justify-center">

        {/* Ver detalles: abre la ficha completa del cliente */}
        <button
          onClick={() => showModal('clienteDetail', { c })}
          className="p-1.5 sm:p-2 rounded-lg bg-slate-50 text-slate-500 hover:bg-slate-100 transition inline-flex items-center justify-center"
          title="Ver detalles"
        >
          <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </button>

        {/* Editar: pre-llena el formulario con todos los datos actuales del cliente */}
        <button
          onClick={() => showModal('editForm', {
            title: 'Editar Cliente',
            fields: clienteFields(c),
            onSave: async (data) => {
              await updateCliente(c.id, data)
              await loadClientes()
            },
          })}
          className="p-1.5 sm:p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition inline-flex items-center justify-center"
          title="Editar"
        >
          <Pencil className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </button>

        {/* Renovar: abre el resumen de póliza para confirmar la renovación */}
        <button
          onClick={() => showModal('renovar', { client: c })}
          className="p-1.5 sm:p-2 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition inline-flex items-center justify-center"
          title="Renovar"
        >
          <RefreshCw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </button>

        {/* Activar/Desactivar: el ícono y color cambian según el estado actual */}
        <button
          onClick={() => showModal('blockCliente', {
            nom: c.nom,
            activo: c.activo !== false,
            onConfirm: async () => {
              await toggleCliente(c.id)
              await loadClientes()
            },
          })}
          className={`p-1.5 sm:p-2 rounded-lg transition inline-flex items-center justify-center ${
            c.activo === false
              ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
              : 'bg-orange-50 text-orange-500 hover:bg-orange-100'
          }`}
          title={c.activo === false ? 'Activar' : 'Desactivar'}
        >
          {c.activo === false
            ? <LockOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            : <Lock    className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
        </button>

        {/* Eliminar: bloqueado si el cliente tiene solicitudes o pólizas */}
        <button
          onClick={() => showModal('confirmDelete', {
            name: `Cliente ${c.nom}`,
            onConfirm: async () => {
              await deleteCliente(c.id)
              await loadClientes()
            },
          })}
          className="p-1.5 sm:p-2 rounded-lg bg-rose-50 text-rose-500 hover:bg-rose-100 transition inline-flex items-center justify-center"
          title="Eliminar"
        >
          <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
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
            <Users className="w-4 h-4 text-slate-600" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-slate-500 font-medium leading-tight">Total Clientes</p>
            <p className="text-xl font-black text-slate-800 mt-0.5 leading-none">{clients.length}</p>
            <p className="text-xs text-slate-400 mt-1">{activos} activos · {bloqueados} bloqueados</p>
          </div>
        </div>
        <div className="card p-4 flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
            <UserCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-slate-500 font-medium leading-tight">Activos</p>
            <p className="text-xl font-black text-slate-800 mt-0.5 leading-none">{activos}</p>
            <p className="text-xs text-slate-400 mt-1">Cuenta activa</p>
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
      </div>

      <SearchBar
        placeholder="Buscar por nombre, CI/RIF o email…"
        onSearch={setSearch}
        extra={
          <>
            <button onClick={handlePrintClientes} className="btn-secondary">
              <Printer className="w-4 h-4" />Imprimir
            </button>
            <button
              onClick={() => showModal('editForm', {
                title: 'Nuevo Cliente',
                fields: clienteFields(),
                onSave: async (data) => {
                  await createCliente(data)
                  await loadClientes()
                },
              })}
              className="btn-primary ml-auto"
            >
              <UserPlus className="w-4 h-4" />Agregar Cliente
            </button>
          </>
        }
      />

      {loading && (
        <div className="flex justify-center items-center py-16 text-slate-400 text-sm gap-2">
          <div className="w-4 h-4 border-2 border-slate-300 border-t-sefired-blue rounded-full animate-spin" />
          Cargando clientes…
        </div>
      )}
      {error && !loading && (
        <div className="text-center py-12 text-rose-500 text-sm">{error}</div>
      )}
      {!loading && !error && <DataTable cols={COLS} rows={dataRows} />}
    </div>
  )
}
