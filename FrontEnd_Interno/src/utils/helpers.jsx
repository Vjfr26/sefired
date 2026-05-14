import { useState } from 'react'
import { CheckCircle, Clock, AlertCircle } from 'lucide-react'

export function getUserIcon(rol, genero) {
  if (rol === 'Admin') return '/iconos/admin.png'
  const isVendedor = rol === 'Vendedor Sucursal' || rol === 'Vendedor Calle'
  if (isVendedor) return genero === 'F' ? '/iconos/vendedora.png' : '/iconos/vendedor.png'
  return genero === 'F' ? '/iconos/ejecutiva.png' : '/iconos/ejecutivo.png'
}

export function UserAvatar({ rol, genero, className = '', blocked = false }) {
  const [src, setSrc] = useState(() => getUserIcon(rol, genero))
  return (
    <div className={`overflow-hidden shrink-0 ${blocked ? 'grayscale opacity-50' : ''} ${className}`}>
      <img
        src={src}
        alt="Avatar"
        onError={() => setSrc('/iconos/not-found.png')}
        className="w-full h-full object-contain p-1"
      />
    </div>
  )
}

export const usd = n => '$' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
export const bs  = (n, r = 38.54) => 'Bs. ' + (n * r).toLocaleString('es-VE', { minimumFractionDigits: 2 })

export const STATUS_COLOR = {
  'Activo': 'green', 'Activa': 'green', 'Vigente': 'green', 'Emitida': 'green', 'Aprobado': 'green', 'Cobrado': 'green',
  'Pagada': 'green', 'Pagado': 'green', 'Completado': 'green', 'Completada': 'green', 'Cumplida': 'green', 'Generado': 'green',
  'Inactivo': 'slate', 'Vencida': 'slate', 'Cerrado': 'slate', 'Cancelada': 'slate',
  'Pendiente': 'amber', 'En Revisión': 'amber', 'Por Vencer': 'amber', 'Parcial': 'amber',
  'Rechazado': 'red', 'Anulada': 'red', 'Bloqueado': 'red', 'En riesgo': 'red',
  'Asignado': 'blue', 'En Proceso': 'blue', 'Generada': 'blue', 'En curso': 'blue',
}

export const STATUS_ICONCLS = {
  green: 'text-emerald-500', amber: 'text-amber-500', red: 'text-rose-500',
  blue: 'text-blue-500', indigo: 'text-indigo-500', slate: 'text-slate-400',
}

const STATUS_ICON_COMP = {
  green: CheckCircle, amber: Clock, red: AlertCircle,
  blue: CheckCircle, indigo: CheckCircle, slate: AlertCircle,
}

export function Badge({ text, color = 'slate' }) {
  return <span className={`badge badge-${color}`}>{text}</span>
}

export const badge = (text, color = 'slate') => <span className={`badge badge-${color}`}>{text}</span>

export const sbadge = (s) => badge(s, STATUS_COLOR[s] || 'slate')

export const rsbadge = (s) => {
  const col = STATUS_COLOR[s] || 'slate'
  const Icon = STATUS_ICON_COMP[col]
  return (
    <>
      <span className="hidden sm:inline">{sbadge(s)}</span>
      <span className="sm:hidden flex items-center justify-center">
        <Icon className={`w-4 h-4 ${STATUS_ICONCLS[col]}`} title={s} />
      </span>
    </>
  )
}

export const NAV = [
  { id: 'home',         label: 'Inicio',            icon: 'home',        viewId: 'home' },
  { id: 'cotizaciones', label: 'Simulador',          icon: 'calculator',  viewId: 'cot-simulador' },
  { id: 'productos',    label: 'Productos',          icon: 'package',     viewId: 'cat-productos' },
  { id: 'usuarios',     label: 'Usuarios',           icon: 'user-cog',    viewId: 'usr-lista' },
  { id: 'clientes',     label: 'Clientes & Pólizas', icon: 'users',       viewId: 'cli-cliente' },
  { id: 'vehiculos',    label: 'Vehículos',          icon: 'car',         viewId: 'cli-vehiculo' },
  { id: 'reportes',     label: 'Reportes',           icon: 'bar-chart-3', viewId: 'rep-menu' },
  { id: 'tasas',        label: 'Tasa del Día',       icon: 'dollar-sign', viewId: 'tas-registro' },
  { id: 'config',       label: 'Configuración',      icon: 'settings',    viewId: 'conf-menu' },
]

export const VIEW_META = {
  'home':          { navId: 'home',         title: 'Inicio',             sub: 'Cotizador de Seguros Sefired' },
  'cat-productos': { navId: 'productos',    title: 'Productos',          sub: 'Catálogo de coberturas y servicios' },
  'cli-cliente':   { navId: 'clientes',     title: 'Clientes & Pólizas', sub: 'Gestión de clientes, pólizas y renovaciones' },
  'cli-vehiculo':  { navId: 'vehiculos',    title: 'Vehículos',          sub: 'Registro y consulta de vehículos asegurados' },
  'cot-simulador': { navId: 'cotizaciones', title: 'Simulador',          sub: 'Simulador de cotizaciones de seguros vehiculares' },
  'rep-menu':      { navId: 'reportes',     title: 'Reportes',           sub: 'Generación y exportación de reportes' },
  'tas-registro':  { navId: 'tasas',        title: 'Tasas del Día',      sub: 'Registro de tasas BCV — Dólar y Euro' },
  'usr-lista':     { navId: 'usuarios',     title: 'Usuarios',           sub: 'Gestión de usuarios, roles y permisos' },
  'conf-menu':     { navId: 'config',       title: 'Configuración',      sub: 'Ajustes, seguridad y auditoría del sistema' },
  'cli-tomador':   { navId: 'clientes',     title: 'Clientes & Pólizas', sub: 'Gestión de tomadores' },
  'cli-conductor': { navId: 'clientes',     title: 'Clientes & Pólizas', sub: 'Gestión de conductores' },
  'cat-tipos':     { navId: 'productos',    title: 'Productos',          sub: 'Tipos, marcas y modelos' },
  'cat-tasas':     { navId: 'productos',    title: 'Productos',          sub: 'Tasas por cobertura' },
}

// PDF helpers (inline styles for portability in print windows)
export function pdfPage(content) {
  return `<div class="pdf-page bg-white w-full max-w-[794px] shadow-2xl" style="min-height:1123px;padding:56px 64px;font-family:Inter,system-ui,sans-serif;color:#1e293b">${content}</div>`
}
export function pdfHdr(docTitle, docSub, ref, date) {
  return `<div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:32px;padding-bottom:20px;border-bottom:2px solid #001463">
    <div>
      <p style="font-size:22px;font-weight:900;color:#001463;letter-spacing:-0.5px">SEFIRED</p>
      <p style="font-size:9px;color:#94a3b8;text-transform:uppercase;letter-spacing:2px;margin-top:2px">Cooperativa de Seguros de Vehículos R.L.</p>
      <p style="font-size:9px;color:#94a3b8;margin-top:2px">RIF J-12.345.678-9 · Av. Principal, Caracas 1010</p>
    </div>
    <div style="text-align:right">
      <p style="font-size:16px;font-weight:900;color:#1e293b;text-transform:uppercase;letter-spacing:1px">${docTitle}</p>
      ${docSub ? `<p style="font-size:10px;color:#64748b;margin-top:3px">${docSub}</p>` : ''}
      ${ref   ? `<p style="font-size:11px;font-family:monospace;color:#001463;font-weight:700;margin-top:6px">${ref}</p>` : ''}
      ${date  ? `<p style="font-size:10px;color:#64748b;margin-top:2px">${date}</p>` : ''}
    </div>
  </div>`
}
export function pdfSec(title) {
  return `<p style="font-size:9px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:2px;margin:22px 0 10px;padding-bottom:5px;border-bottom:1px solid #e2e8f0">${title}</p>`
}
export function pdfRow(label, value, mono = false) {
  return `<div style="display:flex;justify-content:space-between;align-items:baseline;padding:4px 0;border-bottom:1px solid #f1f5f9">
    <span style="font-size:11px;color:#64748b">${label}</span>
    <span style="font-size:12px;font-weight:600;color:#1e293b${mono ? ';font-family:monospace' : ''}">${value}</span>
  </div>`
}
export function pdfTotal(label, amount, sub) {
  return `<div style="display:flex;justify-content:space-between;align-items:center;background:#001463;color:white;padding:12px 16px;border-radius:8px;margin-top:14px">
    <span style="font-size:13px;font-weight:700">${label}</span>
    <span style="font-size:22px;font-weight:900">${amount}</span>
  </div>${sub ? `<p style="font-size:9px;color:#64748b;text-align:right;margin-top:5px">${sub}</p>` : ''}`
}
export function pdfFooter(agente, oficina) {
  return `<div style="margin-top:48px;padding-top:18px;border-top:1px solid #e2e8f0">
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:48px">
      <div style="text-align:center">
        <div style="border-top:1px solid #1e293b;padding-top:8px;margin-top:44px">
          <p style="font-size:10px;font-weight:700;color:#1e293b">${agente}</p>
          <p style="font-size:9px;color:#64748b">Agente de Seguros · Sello y Firma</p>
        </div>
      </div>
      <div style="text-align:center">
        <div style="border-top:1px solid #1e293b;padding-top:8px;margin-top:44px">
          <p style="font-size:10px;font-weight:700;color:#1e293b">Supervisor · ${oficina}</p>
          <p style="font-size:9px;color:#64748b">Autorizado · Sello y Firma</p>
        </div>
      </div>
    </div>
    <p style="font-size:8px;color:#94a3b8;text-align:center;margin-top:18px;line-height:1.6">Documento generado por el sistema interno Sefired. Válido únicamente con sello y firma del supervisor autorizado. Autorizado por SUDEASEG.</p>
  </div>`
}
