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
import { Pencil, RefreshCw, Trash2, Printer, UserPlus, Users, UserCheck, UserX, ShieldCheck, Eye, Lock, LockOpen, FileText, SlidersHorizontal, Receipt, ClipboardList, FolderOpen } from 'lucide-react'
import { useApp } from '../context/AppContext.jsx'
import { rsbadge, usd, pdfPage, pdfHdr, pdfSec, pdfRow, pdfTotal, pdfFooterSimple } from '../utils/helpers.jsx'
import SearchBar from '../components/SearchBar.jsx'
import DataTable from '../components/DataTable.jsx'
import { fetchClientes, createCliente, updateCliente, deleteCliente, toggleCliente, fetchPolizasCliente } from '../api/clientes.js'

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
  { k: 'tel',       l: 'Teléfono',        hide: 'lg' },
  { k: 'email',     l: 'Email',           hide: 'xl', nw: true },
  { k: 'polNum',    l: 'N° Póliza',       hide: 'md' },
  { k: 'primaCell', l: 'Prima',           hide: 'md', nw: true },
  { k: 'est',       l: 'Estado',          nw: true },
  { k: 'acc',       l: '',                acc: true },
]

export default function Clientes() {
  const { showModal, showToast, canAct } = useApp()
  const [search, setSearch]     = useState('')
  const [clients, setClients]   = useState([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState(null)
  const [printModal, setPrintModal]   = useState(false)

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

  // ── Helpers de impresión ──────────────────────────────────────────────────
  const openPrintWindow = (title, pagesHtml) => {
    const w = window.open('', '_blank')
    w.document.write(`<!DOCTYPE html><html><head>
      <meta charset="UTF-8"><title>${title}</title>
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

  const handlePrintClientes = (list) => {
    const logoUrl = window.location.origin + '/Logo_sin_fondo.png'
    const estBadge = est => {
      const col = est === 'Activo' ? '#10b981' : est === 'Bloqueado' ? '#f43f5e' : est === 'Rechazado' ? '#f43f5e' : est === 'En Revisión' ? '#f59e0b' : est === 'Aprobado' ? '#3b82f6' : '#94a3b8'
      return `<span style="font-size:10px;font-weight:700;color:white;background:${col};padding:2px 8px;border-radius:999px">${est}</span>`
    }
    const tableRows = list.map(c => `
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
    openPrintWindow('Listado de Clientes', pdfPage(
      pdfHdr('LISTADO DE CLIENTES', `${list.length} clientes`, '', new Date().toLocaleDateString('es-VE'), logoUrl) +
      pdfSec('CLIENTES REGISTRADOS') + table + pdfFooterSimple()
    ))
  }

  const handlePrintPolizas = async (list) => {
    const logoUrl = window.location.origin + '/Logo_sin_fondo.png'

    const polizaPage = (c, pol) => {
      const clienteNombre = c.nombre || c.nom
      const tel  = c.celular || c.telefono || '—'
      const mail = c.correo  || c.email    || '—'
      const dir  = c.direccion || '—'

      const polBanner = `<div style="background:#001463;color:white;padding:14px 22px;border-radius:10px;margin-bottom:26px;display:flex;justify-content:space-between;align-items:center">
        <div><p style="font-size:9px;font-weight:700;letter-spacing:2px;opacity:0.65;text-transform:uppercase;margin-bottom:4px">N° de Póliza / Contrato</p>
          <p style="font-size:20px;font-weight:900;font-family:monospace;letter-spacing:2px">${pol.nro_contrato}</p></div>
        <div style="text-align:right"><p style="font-size:9px;font-weight:700;letter-spacing:2px;opacity:0.65;text-transform:uppercase;margin-bottom:4px">Estado</p>
          <p style="font-size:15px;font-weight:900;${pol.status === 'ACTIVA' ? 'color:#6ee7b7' : pol.status === 'VENCIDA' ? 'color:#fcd34d' : 'color:#fca5a5'}">${pol.status}</p></div>
      </div>`

      const cobTable = `<table style="width:100%;border-collapse:collapse;margin-top:10px;font-size:12px">
        <thead><tr style="background:#001463;color:white">
          <th style="padding:9px 12px;text-align:left;font-size:9px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase">Cobertura / Producto</th>
          <th style="padding:9px 12px;text-align:right;font-size:9px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase">Suma Asegurada</th>
          <th style="padding:9px 12px;text-align:right;font-size:9px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase">Prima (USD)</th>
        </tr></thead>
        <tbody><tr style="background:#f8fafc;border-bottom:2px solid #e2e8f0">
          <td style="padding:11px 12px;font-weight:600;color:#1e293b">${pol.producto}</td>
          <td style="padding:11px 12px;text-align:right;font-weight:700;color:#1e293b;font-family:monospace">$${Number(pol.cobertura_dolares).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
          <td style="padding:11px 12px;text-align:right;font-weight:700;color:#059669;font-family:monospace">$${Number(pol.total).toFixed(2)}</td>
        </tr></tbody>
        <tfoot><tr style="background:#f1f5f9">
          <td style="padding:9px 12px;font-size:10px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:1px">Total</td>
          <td style="padding:9px 12px;text-align:right;font-weight:900;color:#001463;font-family:monospace">$${Number(pol.cobertura_dolares).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
          <td style="padding:9px 12px;text-align:right;font-size:15px;font-weight:900;color:#059669;font-family:monospace">$${Number(pol.total).toFixed(2)}</td>
        </tr></tfoot>
      </table>`

      const vigencia = `<div style="display:grid;grid-template-columns:1fr auto 1fr;gap:16px;align-items:center;background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:16px 20px;margin-top:10px">
        <div><p style="font-size:9px;font-weight:700;color:#64748b;letter-spacing:1px;text-transform:uppercase;margin-bottom:5px">Inicio de Vigencia</p>
          <p style="font-size:16px;font-weight:900;color:#1e293b">${pol.fecha_emision}</p></div>
        <div style="text-align:center"><p style="font-size:9px;font-weight:600;color:#94a3b8;letter-spacing:1px;margin-bottom:5px">DURACIÓN</p>
          <div style="border-top:2px dashed #cbd5e1;width:80px;margin:0 auto 5px"></div>
          <p style="font-size:11px;font-weight:700;color:#64748b">12 meses</p>
          <div style="border-top:2px dashed #cbd5e1;width:80px;margin:5px auto 0"></div></div>
        <div style="text-align:right"><p style="font-size:9px;font-weight:700;color:#64748b;letter-spacing:1px;text-transform:uppercase;margin-bottom:5px">Fin de Vigencia</p>
          <p style="font-size:16px;font-weight:900;color:#1e293b">${pol.fecha_vencimiento}</p></div>
      </div>`

      return pdfPage(
        pdfHdr('PÓLIZA DE SEGURO VEHICULAR', 'Documento oficial de cobertura', '', new Date().toLocaleDateString('es-VE'), logoUrl) +
        polBanner +
        pdfSec('I. DATOS DEL TOMADOR Y ASEGURADO') +
        pdfRow('Nombre completo', clienteNombre) + pdfRow('Cédula / RIF', c.ci, true) +
        pdfRow('Teléfono', tel) + pdfRow('Correo electrónico', mail) + pdfRow('Dirección', dir) +
        pdfSec('II. DATOS DEL VEHÍCULO ASEGURADO') +
        pdfRow('Placa', pol.placa, true) +
        pdfRow('Marca / Modelo', `${pol.veh_marca ?? ''} ${pol.veh_modelo ?? ''}`.trim() || '—') +
        pdfRow('Año de fabricación', String(pol.veh_anio ?? '—')) +
        pdfRow('Tipo / Clase', pol.veh_tipo || '—') + pdfRow('Color', pol.veh_color || '—') +
        (pol.veh_serial_carroceria && pol.veh_serial_carroceria !== '—' ? pdfRow('Serial de Carrocería', pol.veh_serial_carroceria, true) : '') +
        (pol.veh_serial_motor      && pol.veh_serial_motor      !== '—' ? pdfRow('Serial de Motor', pol.veh_serial_motor, true) : '') +
        pdfSec('III. COBERTURAS CONTRATADAS') + cobTable +
        pdfSec('IV. CONDICIONES PARTICULARES') +
        pdfRow('Tipo de Póliza', pol.tipo || '—') + pdfRow('Forma de Pago', pol.pago || '—') +
        pdfRow('Sede / Oficina', pol.sede || '—') +
        (pol.referencia && pol.referencia !== '—' ? pdfRow('Referencia de Pago', pol.referencia, true) : '') +
        vigencia +
        pdfSec('V. RESUMEN FINANCIERO') +
        pdfTotal('Prima Anual Total', `$${Number(pol.total).toFixed(2)}`, pol.total_bs ? `Equivalente a Bs. ${Number(pol.total_bs).toFixed(2)} al cambio del día de emisión` : '') +
        pdfFooterSimple()
      )
    }

    try {
      const allPages = []
      for (const c of list) {
        const polizas = await fetchPolizasCliente(c.id).catch(() => [])
        for (const pol of polizas.filter(p => p.status !== 'RECHAZADA')) {
          allPages.push(polizaPage(c, pol))
        }
      }
      if (allPages.length === 0) return
      openPrintWindow('Pólizas de Clientes', allPages.join(''))
    } catch {
      // silently ignore
    }
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
  const inactivos  = clients.filter(c => c.est === 'Inactivo').length
  const bloqueados = clients.filter(c => c.est === 'Bloqueado').length
  const conPoliza  = clients.filter(c => c.prima && c.prima !== '—').length

  // ── Transformación de datos para la tabla ─────────────────────────────────
  // Se mantiene el objeto original (con todos los campos del backend) y se agregan
  // los campos de visualización: displayId, est (badge responsivo), acc (botones)
  const canEditClientes   = canAct('clientes', 'edit')
  const canDeleteClientes = canAct('clientes', 'delete')
  const canCreateCliente  = canAct('clientes', 'create')
  const canBlockCliente   = canAct('clientes', 'block')
  const canViewPolizas    = canAct('clientes', 'view_polizas')
  const canViewFacturas   = canAct('clientes', 'view_facturas')
  const canRenewPoliza    = canAct('clientes', 'renew')
  const canAdjust         = canAct('clientes', 'adjust')
  const canPrint          = canAct('clientes', 'print')
  const canViewDocs       = canAct('clientes', 'view')

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
      <span className={`font-mono font-bold text-[11px] ${tienePoliza ? 'text-emerald-700' : 'text-slate-400'}`}>
        {tienePoliza ? c.pol : <span className="italic font-normal">Sin póliza</span>}
      </span>
    )

    const primaCell = tienePoliza
      ? <span className="font-semibold text-[12px] text-slate-700 whitespace-nowrap">{c.prima}</span>
      : <span className="text-slate-300 text-[11px]">—</span>

    return {
      ...c,
      displayId: fmtId(c.id),
      polNum,
      primaCell,
      est: rsbadge(c.est),
      acc: (
        <div className="flex flex-nowrap gap-1 items-center justify-center">

          <button
            onClick={() => showModal('clienteDetail', { c })}
            className="p-1.5 sm:p-2 rounded-lg bg-slate-50 text-slate-500 hover:bg-slate-100 transition inline-flex items-center justify-center"
            title="Ver detalles"
          >
            <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>

          {canViewPolizas && (
            <button
              onClick={() => showModal('clienteHistorial', { c })}
              className="p-1.5 sm:p-2 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition inline-flex items-center justify-center"
              title="Ver pólizas"
            >
              <ClipboardList className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          )}

          {canViewDocs && (
            <button
              onClick={() => showModal('clienteDocumentos', { c, onSaved: loadClientes })}
              className="p-1.5 sm:p-2 rounded-lg bg-amber-50 text-amber-600 hover:bg-amber-100 transition inline-flex items-center justify-center"
              title="Documentos del cliente"
            >
              <FolderOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          )}

          {canEditClientes && (
            <button
              onClick={() => showModal('clienteForm', {
                cliente: c,
                onSave: async (data) => {
                  await updateCliente(c.id, data)
                  await loadClientes()
                },
              })}
              className="p-1.5 sm:p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition inline-flex items-center justify-center"
              title="Editar datos"
            >
              <Pencil className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          )}

          {canRenewPoliza && (
            <button
              onClick={() => showModal('renovar', { client: c, onSaved: loadClientes })}
              className="p-1.5 sm:p-2 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition inline-flex items-center justify-center"
              title="Renovar póliza"
            >
              <RefreshCw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          )}

          {tienePoliza && canViewFacturas && (
            <button
              onClick={() => showModal('clienteFacturas', { c })}
              className="p-1.5 sm:p-2 rounded-lg bg-amber-50 text-amber-600 hover:bg-amber-100 transition inline-flex items-center justify-center"
              title="Ver facturas"
            >
              <Receipt className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          )}

          {tienePoliza && canAdjust && (
            <button
              onClick={() => showModal('ajustarPoliza', { c, onSave: loadClientes })}
              className="p-1.5 sm:p-2 rounded-lg bg-violet-50 text-violet-600 hover:bg-violet-100 transition inline-flex items-center justify-center"
              title="Ajustar póliza"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          )}

          {canBlockCliente && (
            <button
              onClick={() => showModal('confirmDelete', {
                name: `${isBlocked ? 'Activar' : 'Desactivar'}: ${c.nom}`,
                onConfirm: async () => { await toggleCliente(c.id); await loadClientes() },
              })}
              className={`p-1.5 sm:p-2 rounded-lg transition inline-flex items-center justify-center ${isBlocked ? 'bg-teal-50 text-teal-600 hover:bg-teal-100' : 'bg-orange-50 text-orange-600 hover:bg-orange-100'}`}
              title={isBlocked ? 'Activar cliente' : 'Desactivar cliente'}
            >
              {isBlocked
                ? <LockOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                : <Lock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
            </button>
          )}

          {canDeleteClientes && (
            <button
              onClick={() => showModal('confirmDelete', {
                name: c.nom,
                onConfirm: async () => { await deleteCliente(c.id); await loadClientes() },
              })}
              className="p-1.5 sm:p-2 rounded-lg bg-rose-50 text-rose-500 hover:bg-rose-100 transition inline-flex items-center justify-center"
              title="Eliminar cliente"
            >
              <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          )}
        </div>
      ),
    }
  })

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
            <p className="text-xs text-slate-400 mt-1">{activos} activos · {inactivos} inactivos · {bloqueados} bloqueados</p>
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
      </div>

      <SearchBar
        placeholder="Buscar por nombre, CI/RIF o email…"
        onSearch={setSearch}
        extra={
          <>
            {canPrint && (
              <button onClick={() => setPrintModal(true)} className="btn-secondary">
                <Printer className="w-4 h-4" />Imprimir
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

      {/* ── Modal de opciones de impresión ── */}
      {printModal && (() => {
        const printList = clients
        const label = `todos los clientes (${clients.length})`
        return (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
            onClick={() => setPrintModal(false)}
          >
            <div
              className="bg-white rounded-2xl shadow-2xl p-6 w-80 flex flex-col gap-3"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center gap-2 mb-1">
                <Printer className="w-5 h-5 text-slate-500" />
                <h3 className="font-bold text-slate-800 text-base">Opciones de impresión</h3>
              </div>
              <p className="text-xs text-slate-500 -mt-1">Imprimiendo: <span className="font-semibold text-slate-700">{label}</span></p>

              <button
                onClick={() => { handlePrintClientes(printList); setPrintModal(false) }}
                className="flex items-center gap-3 px-4 py-3 rounded-xl border border-slate-100 hover:bg-slate-50 transition text-left"
              >
                <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
                  <Users className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">Información de clientes</p>
                  <p className="text-xs text-slate-400">Nombre, CI, teléfono, email, estado</p>
                </div>
              </button>

              <button
                onClick={() => { handlePrintPolizas(printList); setPrintModal(false) }}
                className="flex items-center gap-3 px-4 py-3 rounded-xl border border-slate-100 hover:bg-slate-50 transition text-left"
              >
                <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
                  <FileText className="w-4 h-4 text-indigo-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">Pólizas</p>
                  <p className="text-xs text-slate-400">N° póliza, vigencia, prima, estado</p>
                </div>
              </button>

              <button
                onClick={() => setPrintModal(false)}
                className="mt-1 text-sm text-slate-400 hover:text-slate-600 transition text-center py-1"
              >
                Cancelar
              </button>
            </div>
          </div>
        )
      })()}
    </div>
  )
}
