/**
 * helpers.jsx — Utilidades compartidas por toda la aplicación.
 *
 * Contiene:
 *   - getUserIcon / UserAvatar: avatar del usuario según su rol y género
 *   - usd / bs: formateadores de moneda (dólar y bolívar)
 *   - STATUS_COLOR / STATUS_ICONCLS: mapas de estado → color para badges e íconos
 *   - Badge / badge / sbadge / rsbadge: componentes de etiqueta de estado
 *   - NAV: definición de los ítems del menú lateral
 *   - VIEW_META: títulos y subtítulos de cada vista del panel
 *   - pdfPage / pdfHdr / pdfSec / pdfRow / pdfTotal / pdfFooter / pdfFooterSimple:
 *     funciones para construir el HTML de documentos PDF imprimibles
 */

import { useState } from 'react'
import { CheckCircle, Clock, AlertCircle } from 'lucide-react'

// ── Avatares de usuario ──────────────────────────────────────────────────────

/**
 * Devuelve la ruta de la imagen de avatar según el rol y género del usuario.
 * Los archivos de ícono deben estar en /public/iconos/.
 */
export function getUserIcon(rol, genero) {
  if (rol === 'Admin') return '/iconos/admin.png'
  const isVendedor = rol === 'Vendedor Sucursal' || rol === 'Vendedor Calle'
  if (isVendedor) return genero === 'F' ? '/iconos/vendedora.png' : '/iconos/vendedor.png'
  return genero === 'F' ? '/iconos/ejecutiva.png' : '/iconos/ejecutivo.png'
}

/**
 * Componente de avatar de usuario. Si la imagen no existe muestra un ícono genérico.
 *
 * @param {string}  rol       Rol del usuario (Admin, Oficina, Vendedor…)
 * @param {string}  genero    'M' o 'F'
 * @param {string}  className Clases Tailwind adicionales (tamaño, forma, etc.)
 * @param {boolean} blocked   Si true, el avatar aparece en gris semitransparente
 */
export function UserAvatar({ rol, genero, className = '', blocked = false }) {
  const [src, setSrc] = useState(() => getUserIcon(rol, genero))
  return (
    <div className={`overflow-hidden shrink-0 ring-1 ring-slate-900/10 ${blocked ? 'grayscale opacity-50' : ''} ${className}`}>
      <img
        src={src}
        alt="Avatar"
        onError={() => setSrc('/iconos/not-found.png')}   // fallback si el archivo no existe
        className="w-full h-full object-contain p-1"
      />
    </div>
  )
}

// ── Formateadores de moneda ──────────────────────────────────────────────────

/** Formatea un número como dólares: "$1,234.56" */
export const usd = n => '$' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

/**
 * Convierte un monto en dólares a bolívares usando la tasa dada.
 * El parámetro `r` es la tasa BCV del día; se puede pasar desde el contexto.
 * La tasa por defecto es aproximada y solo se usa si no se pasa ninguna.
 */
export const bs = (n, r = 38.54) => 'Bs. ' + (n * r).toLocaleString('es-VE', { minimumFractionDigits: 2 })

// ── Colores e íconos de estado ───────────────────────────────────────────────

/**
 * Mapa de texto de estado → color base del badge.
 * Los colores corresponden a las clases CSS badge-{color} definidas en el CSS global.
 */
export const STATUS_COLOR = {
  'Activo': 'green', 'Activa': 'green', 'Vigente': 'green', 'Emitida': 'green', 'Aprobado': 'green', 'Cobrado': 'green',
  'Pagada': 'green', 'Pagado': 'green', 'Completado': 'green', 'Completada': 'green', 'Cumplida': 'green', 'Generado': 'green',
  'Inactivo': 'slate', 'Vencida': 'slate', 'Cerrado': 'slate', 'Cancelada': 'slate',
  'Pendiente': 'amber', 'En Revisión': 'amber', 'Por Vencer': 'amber', 'Parcial': 'amber',
  'Rechazado': 'red', 'Anulada': 'red', 'Bloqueado': 'red', 'En riesgo': 'red',
  'Cliente Bloqueado': 'amber',
  'Asignado': 'blue', 'En Proceso': 'blue', 'Generada': 'blue', 'En curso': 'blue',
}

/** Clase CSS del ícono según el color base del estado. */
export const STATUS_ICONCLS = {
  green: 'text-emerald-500', amber: 'text-amber-500', red: 'text-rose-500',
  blue: 'text-blue-500', indigo: 'text-indigo-500', slate: 'text-slate-400',
}

// Componente de ícono según color: verde → ✓, ámbar → reloj, rojo/gris → alerta
const STATUS_ICON_COMP = {
  green: CheckCircle, amber: Clock, red: AlertCircle,
  blue: CheckCircle, indigo: CheckCircle, slate: AlertCircle,
}

// ── Componentes de badge (etiqueta de estado) ────────────────────────────────

/** Badge como componente React. */
export function Badge({ text, color = 'slate' }) {
  return <span className={`badge badge-${color}`}>{text}</span>
}

/** Badge como función (para usar dentro de expresiones JSX). */
export const badge = (text, color = 'slate') => <span className={`badge badge-${color}`}>{text}</span>

/** Badge de estado: determina el color automáticamente según el texto. */
export const sbadge = (s) => badge(s, STATUS_COLOR[s] || 'slate')

/**
 * Badge de estado responsivo:
 *   - En pantallas medianas+: muestra el badge con texto completo
 *   - En móvil: muestra solo el ícono de estado (ahorra espacio en la tabla)
 */
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

// ── Navegación ───────────────────────────────────────────────────────────────

/**
 * Definición de los ítems del menú lateral.
 * icon: nombre del ícono de Lucide (mapeado en Sidebar.jsx a su componente)
 * viewId: identificador de la primera vista que se abre al hacer clic
 */
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

/**
 * Metadatos de cada vista: qué ítem del sidebar resaltar y qué mostrar en el Header.
 * Cuando se navega a una subvista (ej. 'cli-tomador') el sidebar resalta la sección
 * padre ('clientes') aunque el Header muestre el subtítulo específico.
 */
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

// ── Generadores de HTML para documentos PDF ──────────────────────────────────
// Estas funciones construyen fragmentos HTML con estilos inline para que funcionen
// correctamente en ventanas de impresión donde el CSS externo no está disponible.

/**
 * Envuelve el contenido en una "hoja" de papel A4 con padding.
 * @param {string} content  HTML del contenido del documento
 */
export function pdfPage(content) {
  return `<div class="pdf-page bg-white w-full max-w-[794px] shadow-2xl" style="min-height:1123px;padding:56px 64px;font-family:Inter,system-ui,sans-serif;color:#1e293b">${content}</div>`
}

/**
 * Cabecera del documento con logo, nombre de la empresa y datos del documento.
 *
 * @param {string} docTitle  Título principal del documento (ej. "LISTADO DE CLIENTES")
 * @param {string} docSub    Subtítulo descriptivo
 * @param {string} ref       Número de referencia o código (opcional)
 * @param {string} date      Fecha del documento (opcional)
 * @param {string} logoUrl   URL absoluta del logo (ej. window.location.origin + '/Logo_sin_fondo.png')
 *                           Si se omite, solo aparece el texto "SEFIRED"
 */
export function pdfHdr(docTitle, docSub, ref, date, logoUrl = '') {
  return `<div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:32px;padding-bottom:20px;border-bottom:2px solid #001463">
    <div style="display:flex;align-items:center;gap:12px">
      ${logoUrl ? `<img src="${logoUrl}" alt="Sefired" style="height:52px;width:auto;object-fit:contain" />` : ''}
      <div>
        <p style="font-size:22px;font-weight:900;color:#001463;letter-spacing:-0.5px">SEFIRED</p>
        <p style="font-size:9px;color:#94a3b8;text-transform:uppercase;letter-spacing:2px;margin-top:2px">Cooperativa de Seguros de Vehículos R.L.</p>
        <p style="font-size:9px;color:#94a3b8;margin-top:2px">RIF J-12.345.678-9 · Av. Principal, Caracas 1010</p>
      </div>
    </div>
    <div style="text-align:right">
      <p style="font-size:16px;font-weight:900;color:#1e293b;text-transform:uppercase;letter-spacing:1px">${docTitle}</p>
      ${docSub ? `<p style="font-size:10px;color:#64748b;margin-top:3px">${docSub}</p>` : ''}
      ${ref   ? `<p style="font-size:11px;font-family:monospace;color:#001463;font-weight:700;margin-top:6px">${ref}</p>` : ''}
      ${date  ? `<p style="font-size:10px;color:#64748b;margin-top:2px">${date}</p>` : ''}
    </div>
  </div>`
}

/**
 * Pie de página simple sin bloques de firma.
 * Ideal para listados generales donde no se necesita autorización manual.
 * Incluye datos de la empresa, fecha de generación y leyenda de SUDEASEG.
 */
export function pdfFooterSimple() {
  const now = new Date().toLocaleDateString('es-VE', { day:'2-digit', month:'long', year:'numeric' })
  return `<div style="margin-top:48px;padding-top:16px;border-top:1px solid #e2e8f0;text-align:center">
    <p style="font-size:11px;font-weight:700;color:#001463">SEFIRED — Cooperativa de Seguros de Vehículos R.L.</p>
    <p style="font-size:9px;color:#94a3b8;margin-top:4px">RIF J-12.345.678-9 · Av. Principal, Caracas 1010 · Tel. (0212) 000-0000</p>
    <p style="font-size:8px;color:#cbd5e1;margin-top:8px;line-height:1.6">Documento generado el ${now} · Autorizado por SUDEASEG · Válido únicamente con sello oficial.</p>
  </div>`
}

/** Título de sección dentro del documento (línea separadora con texto pequeño en mayúsculas). */
export function pdfSec(title) {
  return `<p style="font-size:9px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:2px;margin:22px 0 10px;padding-bottom:5px;border-bottom:1px solid #e2e8f0">${title}</p>`
}

/**
 * Fila de datos: etiqueta a la izquierda, valor a la derecha.
 * @param {string}  label  Nombre del campo
 * @param {string}  value  Valor a mostrar
 * @param {boolean} mono   Si true, el valor usa fuente monoespaciada (para IDs, cédulas)
 */
export function pdfRow(label, value, mono = false) {
  return `<div style="display:flex;justify-content:space-between;align-items:baseline;padding:4px 0;border-bottom:1px solid #f1f5f9">
    <span style="font-size:11px;color:#64748b">${label}</span>
    <span style="font-size:12px;font-weight:600;color:#1e293b${mono ? ';font-family:monospace' : ''}">${value}</span>
  </div>`
}

/**
 * Bloque de total destacado con fondo azul oscuro.
 * @param {string} label   Etiqueta (ej. "Total a Pagar")
 * @param {string} amount  Monto formateado (ej. "$1,234.56")
 * @param {string} sub     Texto pequeño debajo del monto (opcional)
 */
export function pdfTotal(label, amount, sub) {
  return `<div style="display:flex;justify-content:space-between;align-items:center;background:#001463;color:white;padding:12px 16px;border-radius:8px;margin-top:14px">
    <span style="font-size:13px;font-weight:700">${label}</span>
    <span style="font-size:22px;font-weight:900">${amount}</span>
  </div>${sub ? `<p style="font-size:9px;color:#64748b;text-align:right;margin-top:5px">${sub}</p>` : ''}`
}

/**
 * Pie de página con bloques de firma para documentos que requieren autorización manual
 * (ej. cotizaciones, pólizas). Para listados generales usar pdfFooterSimple().
 *
 * @param {string} agente  Nombre del agente de seguros
 * @param {string} oficina Nombre de la oficina/sede
 */
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
