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

import { useState, useEffect } from 'react'
import { CheckCircle, Clock, AlertCircle } from 'lucide-react'

// ── Bloqueo de fondo para ventanas tipo modal ────────────────────────────────

/**
 * Mientras una ventana modal/overlay está abierta: bloquea el scroll del
 * fondo y atrapa el foco de teclado (Tab) dentro del panel indicado, para
 * que no se puedan "escapar" interacciones hacia elementos de atrás.
 *
 * Usar en CUALQUIER overlay de pantalla completa, no solo en ModalShell —
 * los visores de PDF (PdfViewer, pdfVisor) son overlays igual que un modal
 * y deben comportarse igual.
 *
 * @param {React.RefObject} panelRef  Ref del panel/contenedor focuseable del overlay
 * @param {boolean}         active    Si false, no bloquea nada (para overlays que
 *                                    se montan siempre pero solo se muestran a veces,
 *                                    ej. un visor de PDF condicionado por `pdfVisor &&`)
 */
export function useModalLock(panelRef, active = true) {
  useEffect(() => {
    if (!active) return
    // Bloquear solo <body> no basta: en algunos navegadores la caja de scroll
    // raíz es <html>, así que una rueda del mouse seguía moviendo la página
    // de fondo aunque body tuviera overflow:hidden. Se bloquean ambos.
    const prevBodyOverflow = document.body.style.overflow
    const prevHtmlOverflow = document.documentElement.style.overflow
    document.body.style.overflow = 'hidden'
    document.documentElement.style.overflow = 'hidden'
    panelRef.current?.focus()

    const handleKeyDown = (e) => {
      if (e.key !== 'Tab') return
      const focusables = panelRef.current?.querySelectorAll(
        'a[href], button:not([disabled]), textarea, input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
      if (!focusables || focusables.length === 0) return
      const first = focusables[0]
      const last  = focusables[focusables.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = prevBodyOverflow
      document.documentElement.style.overflow = prevHtmlOverflow
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [panelRef, active])
}

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
  const [hasError, setHasError] = useState(false)
  
  useEffect(() => {
    setHasError(false)
  }, [rol, genero])

  const src = hasError ? '/iconos/not-found.png' : getUserIcon(rol, genero)

  return (
    <div className={`overflow-hidden shrink-0 ring-1 ring-slate-900/10 ${blocked ? 'grayscale opacity-50' : ''} ${className}`}>
      <img
        src={src}
        alt="Avatar"
        onError={() => setHasError(true)}
        className="w-full h-full object-contain p-1"
      />
    </div>
  )
}

// ── Filtros de entrada para formularios ──────────────────────────────────────
// Limpian el valor en cada tecla para que no se pueda ni escribir basura —
// el backend vuelve a validar/normalizar igual (ver App\Rules\CedulaValida,
// TelefonoValido, CodigoPostalValido), esto es solo para que el usuario lo
// vea filtrado de inmediato en vez de enterarse recién al guardar.

/** Cédula/RIF: letra de nacionalidad (V/E/J/G/P) + dígitos + guion opcional. */
export const filtrarCedula = (v) => v.toUpperCase().replace(/[^VEJGP0-9-]/g, '')

/** Teléfono: dígitos, espacios, "+", "-" y paréntesis. */
export const filtrarTelefono = (v) => v.replace(/[^0-9+\-()\s]/g, '')

/** Código postal y otros campos puramente numéricos. */
export const filtrarSoloDigitos = (v) => v.replace(/\D/g, '')

// ── Formateadores de moneda ──────────────────────────────────────────────────

/** Formatea un número como dólares: "$1,234.56" */
export const usd = n => '$' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

/**
 * Colapsa los distintos vocabularios de moneda del proyecto (producto.moneda
 * usa 'BS', pagos.*.moneda usa 'Bs.', datos legacy pueden venir en minúscula)
 * a un código canónico único. Espejo de App\Support\Moneda::normalizar en el backend.
 */
export const normalizarMoneda = (moneda) => {
  const m = String(moneda ?? '').toUpperCase().trim().replace(/[.\s]/g, '')
  if (['BS', 'BOLIVAR', 'BOLIVARES'].includes(m)) return 'BS'
  if (['EUR', 'EURO', 'EUROS'].includes(m))       return 'EUR'
  if (['USD', 'DOLAR', 'DOLARES'].includes(m))    return 'USD'
  return m || 'USD'
}

/** Convierte un monto entre monedas pivoteando por bolívares (Bs.), usando las tasas BCV del día. */
export const convertirMoneda = (valor, desde, hacia, tasaUsd, tasaEur) => {
  const d = normalizarMoneda(desde)
  const h = normalizarMoneda(hacia)
  if (d === h) return valor
  const enBs = d === 'USD' ? (tasaUsd ? valor * tasaUsd : 0)
             : d === 'EUR' ? (tasaEur ? valor * tasaEur : 0)
             : valor
  if (h === 'USD') return tasaUsd ? enBs / tasaUsd : 0
  if (h === 'EUR') return tasaEur ? enBs / tasaEur : 0
  return enBs
}

/**
 * Formatea un monto con el símbolo de la moneda indicada.
 *   USD → "$1,234.56"
 *   BS  → "Bs. 1,234.56"
 *   EUR → "€1,234.56"
 */
export const fmtMonto = (n, moneda) => {
  const num = Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  const m = normalizarMoneda(moneda)
  if (m === 'BS')  return 'Bs. ' + num
  if (m === 'EUR') return '€'    + num
  return '$' + num
}

/**
 * Abrevia magnitudes grandes para mostrar en espacios compactos (cards, tablas en móvil).
 *   < 1 000          → "123.45"
 *   1 000 – 999 999  → "1.23K"
 *   1 M – 999 M      → "1.23M"
 *   ≥ 1 000 M        → "1.23MM"
 */
export const abrevNum = (n) => {
  const v = Number(n)
  if (v >= 1_000_000_000) return (v / 1_000_000_000).toFixed(2) + 'MM'
  if (v >= 1_000_000)     return (v / 1_000_000).toFixed(2)     + 'M'
  if (v >= 1_000)         return (v / 1_000).toFixed(2)         + 'K'
  return v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

/** Igual que fmtMonto pero con el número abreviado. Ideal para cards y columnas compactas. */
export const fmtMontoAbrev = (n, moneda) => {
  const num = abrevNum(n)
  const m = normalizarMoneda(moneda)
  if (m === 'BS')  return 'Bs. ' + num
  if (m === 'EUR') return '€'    + num
  return '$' + num
}

/**
 * Redondea siempre hacia arriba al centavo más cercano (tercer decimal).
 * Ejemplo: 526.863 → 526.87
 */
export const ceilToCents = (n) => Math.ceil(Number(n) * 100) / 100

/**
 * Formatea una tasa de cambio (BCV) redondeando siempre hacia arriba a 2 decimales.
 * Usa coma como separador decimal (formato venezolano).
 * Ejemplo: 1,910987 → "1,92"
 */
export const fmtTasa = (n) => (Math.ceil(Number(n) * 100) / 100).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

/**
 * Convierte un monto en dólares a bolívares usando la tasa dada.
 * Siempre redondea hacia arriba al centavo (tercer decimal → segundo decimal).
 * El parámetro `r` es la tasa BCV del día; se puede pasar desde el contexto.
 */
export const bs = (n, r = 38.54) => 'Bs. ' + ceilToCents(n * r).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

// ── Colores e íconos de estado ───────────────────────────────────────────────

/**
 * Mapa de texto de estado → color base del badge.
 * Los colores corresponden a las clases CSS badge-{color} definidas en el CSS global.
 */
export const STATUS_COLOR = {
  'Activo': 'green', 'Activa': 'green', 'Vigente': 'green', 'Emitida': 'green', 'Aprobado': 'green', 'Cobrado': 'green',
  'Pagada': 'green', 'Pagado': 'green', 'Completado': 'green', 'Completada': 'green', 'Cumplida': 'green', 'Generado': 'green',
  'emitida': 'green', 'aprobado': 'green',
  'Inactivo': 'slate', 'Vencida': 'slate', 'Cerrado': 'slate', 'Cancelada': 'slate',
  'Pendiente': 'amber', 'En Revisión': 'amber', 'Por Vencer': 'amber', 'Parcial': 'amber',
  'pendiente': 'amber', 'en_revision': 'amber',
  'Rechazado': 'red', 'Anulada': 'red', 'Bloqueado': 'red', 'En riesgo': 'red',
  'rechazado': 'red',
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

// ── Catálogo completo de permisos ─────────────────────────────────────────────

/**
 * PERMS_CATALOG — Fuente de verdad de TODAS las acciones posibles por módulo.
 * Cada módulo define sus acciones con id (clave interna) y label (texto en UI).
 * El modal de permisos lo lee para mostrar los controles completos.
 */
export const PERMS_CATALOG = {
  home: {
    label: 'Inicio',
    icon: '🏠',
    locked: true,
    actions: [
      { id: 'view', label: 'Ver panel de inicio y estadísticas' },
    ],
  },
  clientes: {
    label: 'Clientes & Pólizas',
    icon: '🪪',
    actions: [
      { id: 'view',          label: 'Ver listado de clientes' },
      { id: 'view_cards',    label: 'Ver tarjetas de resumen (cards)' },
      { id: 'view_list',     label: 'Ver tabla/listado de clientes' },
      { id: 'view_all',      label: 'Ver TODOS los clientes (no solo los propios)' },
      { id: 'reasignar',     label: 'Reasignar el vendedor (dueño) de un cliente' },
      { id: 'create',        label: 'Registrar nuevo cliente' },
      { id: 'edit',          label: 'Editar datos del cliente' },
      { id: 'delete',        label: 'Eliminar cliente (requiere contraseña)' },
      { id: 'block',         label: 'Bloquear / Desbloquear cliente (requiere contraseña)' },
      { id: 'view_polizas',  label: 'Ver pólizas e historial del cliente' },
      { id: 'view_facturas', label: 'Ver recibos del cliente' },
      { id: 'view_docs',     label: 'Ver documentos del cliente' },
      { id: 'renew',         label: 'Renovar póliza del cliente' },
      { id: 'adjust',        label: 'Ajustar póliza (estado, fechas, prima, vendedor)' },
      { id: 'manage_beneficiarios', label: 'Gestionar beneficiarios de la póliza' },
      { id: 'manage_bienes',        label: 'Gestionar bienes cubiertos por la póliza' },
    ],
  },
  vehiculos: {
    label: 'Bienes Asegurados',
    icon: '🚗',
    actions: [
      { id: 'view',         label: 'Ver listado de bienes asegurados' },
      { id: 'view_cards',   label: 'Ver tarjetas de resumen (cards)' },
      { id: 'view_list',    label: 'Ver tabla/listado de bienes' },
      { id: 'view_poliza',  label: 'Ver póliza del bien (PDF)' },
      { id: 'view_docs',    label: 'Ver documentos del bien' },
      { id: 'edit',         label: 'Editar datos del bien' },
      { id: 'delete',       label: 'Eliminar bien (requiere contraseña)' },
    ],
  },
  cotizaciones: {
    label: 'Simulador / Cotizaciones',
    icon: '🧮',
    actions: [
      { id: 'view',      label: 'Ver cotizaciones guardadas' },
      { id: 'view_list', label: 'Ver tabla/listado de cotizaciones' },
      { id: 'create',    label: 'Crear nueva simulación / cotización' },
      { id: 'edit',      label: 'Editar cotización existente' },
      { id: 'delete',    label: 'Eliminar cotización' },
      { id: 'emit',      label: 'Emitir póliza desde cotización' },
      { id: 'underwrite', label: 'Evaluar underwriting (aprobar/rechazar riesgo)' },
    ],
  },
  productos: {
    label: 'Productos / Coberturas',
    icon: '📦',
    actions: [
      { id: 'view',        label: 'Ver catálogo de productos' },
      { id: 'view_cards',  label: 'Ver tarjetas de resumen (cards)' },
      { id: 'view_list',   label: 'Ver tabla/listado de productos' },
      { id: 'create',      label: 'Crear nuevo producto / variante' },
      { id: 'edit',        label: 'Editar producto existente' },
      { id: 'delete',      label: 'Eliminar producto (requiere contraseña)' },
      { id: 'manage_docs', label: 'Subir / eliminar documentos del producto' },
      { id: 'manage_beneficios', label: 'Gestionar beneficios/coberturas informativas' },
    ],
  },
  'cat-vehiculos': {
    label: 'Catálogo de Vehículos',
    icon: '🚙',
    actions: [
      { id: 'view',   label: 'Ver catálogo de vehículos' },
      { id: 'create', label: 'Añadir nuevo vehículo' },
      { id: 'edit',   label: 'Editar vehículo' },
      { id: 'delete', label: 'Eliminar vehículo' },
    ],
  },
  tasas: {
    label: 'Tasas del Día (BCV)',
    icon: '💵',
    actions: [
      { id: 'view',      label: 'Ver tasas del día' },
      { id: 'view_cards', label: 'Ver tarjetas de resumen (cards)' },
      { id: 'view_list', label: 'Ver tabla/historial de tasas' },
      { id: 'create',    label: 'Registrar nueva tasa' },
      { id: 'edit',      label: 'Editar tasa registrada' },
      { id: 'delete',    label: 'Eliminar tasa (requiere contraseña)' },
    ],
  },
  usuarios: {
    label: 'Usuarios del Sistema',
    icon: '👤',
    actions: [
      { id: 'view',        label: 'Ver listado de usuarios' },
      { id: 'view_cards',  label: 'Ver tarjetas de resumen (cards)' },
      { id: 'view_list',   label: 'Ver tabla/listado de usuarios' },
      { id: 'create',      label: 'Registrar nuevo usuario' },
      { id: 'edit',        label: 'Editar datos del usuario' },
      { id: 'delete',      label: 'Eliminar usuario (requiere contraseña)' },
      { id: 'block',       label: 'Bloquear / Desbloquear usuario (requiere contraseña)' },
      { id: 'perms',       label: 'Gestionar permisos del usuario' },
      { id: 'change_role', label: 'Cambiar rol del usuario' },
    ],
  },
  reportes: {
    label: 'Reportes',
    icon: '📊',
    actions: [
      { id: 'export',           label: 'Exportar e imprimir reportes' },
      { id: 'manage_leads',     label: 'Gestionar solicitudes de contacto (marcar atendidas)' },
      { id: 'manage_schedules', label: 'Gestionar programaciones automáticas y envíos por correo' },
      { id: 'manage_comisiones', label: 'Marcar comisiones como pagadas' },
      { id: 'revertir_comisiones', label: 'Revertir una comisión pagada a pendiente (corrección de errores)' },
      { id: 'manage_oficinas',   label: 'Marcar retiro de efectivo en Oficinas' },
      { id: 'view_ventas',             label: 'Ver pestaña: Ventas / Comisiones' },
      { id: 'view_ventas_todos',       label: 'Ver ventas/comisiones de TODOS los vendedores (sin esto, solo ve lo propio)' },
      { id: 'view_oficinas',           label: 'Ver pestaña: Oficinas' },
      { id: 'view_metrics_personal',   label: 'Ver pestaña: Métricas de Personal' },
      { id: 'view_metrics_personal_todos', label: 'Ver métricas de TODOS los asesores (sin esto, solo ve las propias)' },
      { id: 'view_metrics_clientes',   label: 'Ver pestaña: Métricas de Clientes' },
      { id: 'view_metrics_vehiculos',  label: 'Ver pestaña: Métricas de Vehículos' },
      { id: 'view_leads',              label: 'Ver pestaña: Solicitudes de Contacto' },
      { id: 'view_externos',           label: 'Ver pestaña: Reportes Externos' },
    ],
  },
  config: {
    label: 'Configuración',
    icon: '⚙️',
    locked: true,
    actions: [
      { id: 'change_password',  label: 'Cambiar contraseña propia' },
      { id: 'view_audit',       label: 'Ver auditoría del sistema (logs de actividad e IPs)' },
      { id: 'view_email_logs',  label: 'Ver historial de correos enviados' },
      { id: 'manage_security',  label: 'Desbloquear IPs bloqueadas' },
    ],
  },
}

// Orden en que se muestran los módulos en el modal de permisos
export const PERMS_ORDER = ['home', 'clientes', 'vehiculos', 'cotizaciones', 'productos', 'cat-vehiculos', 'tasas', 'usuarios', 'reportes', 'config']

// Módulos cuya visibilidad no puede quitarse. "config" es selectivo: lo
// decide el Admin por usuario (ver UserPermsModal), no viene forzado.
export const LOCKED_PERMS = new Set(['home'])

/**
 * Permisos por defecto según el rol del usuario.
 * Formato objeto: { moduleId: ['action1', 'action2', ...] }
 * Si el usuario tiene permisos personalizados en BD, estos defaults se ignoran.
 */
export const PERMISOS_POR_ROL = {
  'Admin': {
    home:         ['view'],
    clientes:     ['view', 'view_cards', 'view_list', 'view_all', 'reasignar', 'create', 'edit', 'delete', 'block', 'view_polizas', 'view_facturas', 'view_docs', 'renew', 'adjust', 'manage_beneficiarios', 'manage_bienes'],
    vehiculos:    ['view', 'view_cards', 'view_list', 'view_poliza', 'view_docs', 'edit', 'delete'],
    cotizaciones: ['view', 'view_list', 'create', 'edit', 'delete', 'emit', 'underwrite'],
    productos:    ['view', 'view_cards', 'view_list', 'create', 'edit', 'delete', 'manage_docs', 'manage_beneficios'],
    'cat-vehiculos': ['view', 'create', 'edit', 'delete'],
    tasas:        ['view', 'view_cards', 'view_list', 'create', 'edit', 'delete'],
    usuarios:     ['view', 'view_cards', 'view_list', 'create', 'edit', 'delete', 'block', 'perms', 'change_role'],
    reportes:     ['view', 'export', 'manage_leads', 'manage_schedules', 'manage_comisiones', 'manage_oficinas', 'revertir_comisiones', 'view_ventas', 'view_ventas_todos', 'view_oficinas', 'view_metrics_personal', 'view_metrics_personal_todos', 'view_metrics_clientes', 'view_metrics_vehiculos', 'view_leads', 'view_externos'],
    config:       ['view', 'change_password', 'view_audit', 'view_email_logs', 'manage_security'],
  },
  'Oficina': {
    home:         ['view'],
    clientes:     ['view', 'view_cards', 'view_list', 'view_all', 'reasignar', 'create', 'edit', 'delete', 'block', 'view_polizas', 'view_facturas', 'view_docs', 'renew', 'adjust', 'manage_beneficiarios', 'manage_bienes'],
    vehiculos:    ['view', 'view_cards', 'view_list', 'view_poliza', 'view_docs', 'edit'],
    cotizaciones: ['view', 'view_list', 'create', 'edit', 'emit', 'underwrite'],
    productos:    ['view', 'view_cards', 'view_list'],
    tasas:        ['view', 'view_cards', 'view_list'],
    reportes:     ['view', 'export', 'manage_leads', 'manage_comisiones', 'manage_oficinas', 'view_ventas', 'view_ventas_todos', 'view_oficinas', 'view_metrics_personal', 'view_metrics_personal_todos', 'view_metrics_clientes', 'view_metrics_vehiculos', 'view_leads', 'view_externos'],
    config:       ['view', 'change_password'],
  },
  'Vendedor Sucursal': {
    home:         ['view'],
    clientes:     ['view', 'view_cards', 'view_list', 'create', 'view_polizas', 'view_facturas', 'view_docs'],
    vehiculos:    ['view', 'view_cards', 'view_list', 'view_poliza'],
    cotizaciones: ['view', 'view_list', 'create'],
    productos:    ['view', 'view_cards', 'view_list'],
    tasas:        ['view', 'view_cards', 'view_list'],
    reportes:     ['view', 'view_ventas', 'view_metrics_personal'],
    config:       ['view', 'change_password'],
  },
  'Vendedor Calle': {
    home:         ['view'],
    clientes:     ['view', 'view_cards', 'view_list', 'create', 'view_polizas'],
    vehiculos:    ['view', 'view_cards', 'view_list'],
    cotizaciones: ['view', 'view_list', 'create'],
    productos:    ['view', 'view_cards', 'view_list'],
    tasas:        ['view', 'view_cards', 'view_list'],
    reportes:     ['view', 'view_ventas', 'view_metrics_personal'],
    config:       ['view', 'change_password'],
  },
}

// Kept for legacy code that references it — superseded by PERMS_CATALOG
export const MODULES_WITH_ACTIONS = new Set(['clientes', 'usuarios', 'productos', 'vehiculos', 'cotizaciones', 'tasas', 'reportes'])

/**
 * Convierte permisos almacenados en BD al formato objeto interno.
 * Soporta:
 *   - null/undefined → vacío
 *   - Array de moduleIds (formato muy antiguo) → concede todas las acciones del módulo
 *   - Objeto { moduleId: ['action',...] } → usa directamente, normaliza backward compat
 */
function toPermsObj(perms) {
  if (!perms) return {}
  if (Array.isArray(perms)) {
    // Formato muy antiguo: ['clientes', 'usuarios'] → conceder todas las acciones
    return Object.fromEntries(
      perms.map(id => [id, PERMS_CATALOG[id]?.actions.map(a => a.id) || ['view']])
    )
  }
  // Formato objeto: normalizar backward compat
  const result = {}
  for (const [k, v] of Object.entries(perms)) {
    const actions = Array.isArray(v) ? [...v] : ['view']
    // Backward compat: 'edit' antiguo implica 'create' + 'edit'
    if (actions.includes('edit') && !actions.includes('create') && PERMS_CATALOG[k]?.actions.some(a => a.id === 'create')) {
      actions.push('create')
    }
    result[k] = actions
  }
  return result
}

/**
 * Devuelve los permisos en formato objeto: { moduleId: ['action1', ...] }.
 * Soporta el formato antiguo y el nuevo.
 */
export function getEffectivePermsObj(user) {
  if (!user) return { home: ['view'] }
  const custom = user.permisos
  const isCustom = custom && (
    Array.isArray(custom) ? custom.length > 0 : Object.keys(custom).length > 0
  )
  const base = isCustom ? custom : (PERMISOS_POR_ROL[user.tipo] || { home: ['view'] })
  const obj = toPermsObj(base)
  if (!obj.home) obj.home = ['view']
  return obj
}

/**
 * Devuelve los módulos donde el usuario tiene al menos permiso de visualización.
 */
export function getEffectivePerms(user) {
  if (!user) return ['home']
  const obj = getEffectivePermsObj(user)
  const ids = Object.keys(obj).filter(id => Array.isArray(obj[id]) && obj[id].includes('view'))
  return ids.includes('home') ? ids : ['home', ...ids]
}

/**
 * Comprueba si un usuario puede realizar una acción sobre un módulo.
 * @param {Object} user      - usuario con campo permisos
 * @param {string} moduleId  - id del módulo (ej. 'clientes')
 * @param {string} action    - acción a comprobar (ej. 'view', 'edit', 'delete', 'block', 'emit'…)
 */
export function canAct(user, moduleId, action = 'view') {
  if (!user) return false
  const obj = getEffectivePermsObj(user)
  return !!(obj[moduleId] && Array.isArray(obj[moduleId]) && obj[moduleId].includes(action))
}

// ── Navegación ───────────────────────────────────────────────────────────────

/**
 * Definición de los ítems del menú lateral.
 * icon: nombre del ícono de Lucide (mapeado en Sidebar.jsx a su componente)
 * viewId: identificador de la primera vista que se abre al hacer clic
 */
export const NAV = [
  { id: 'home',          label: 'Inicio',              icon: 'home',          viewId: 'home' },
  { id: 'cotizaciones',  label: 'Cotizador/Emision',    icon: 'calculator',    viewId: 'cot-simulador' },
  { id: 'productos',     label: 'Productos',             icon: 'package',       viewId: 'cat-productos' },
  { id: 'cat-vehiculos', label: 'Vehículos', icon: 'car', viewId: 'cat-vehiculos' },
  { id: 'usuarios',      label: 'Usuarios',             icon: 'user-cog',      viewId: 'usr-lista' },
  { id: 'clientes',      label: 'Clientes & Pólizas',   icon: 'users',         viewId: 'cli-cliente' },
  { id: 'vehiculos',     label: 'Bienes',                icon: 'car',           viewId: 'cli-vehiculo' },
  { id: 'renovaciones',  label: 'Renovaciones QR',      icon: 'refresh-cw',    viewId: 'renovaciones' },
  { id: 'reportes',      label: 'Reportes',             icon: 'bar-chart-3',   viewId: 'rep-menu' },
  { id: 'tasas',         label: 'Tasa del Día',         icon: 'dollar-sign',   viewId: 'tas-registro' },
  { id: 'config',        label: 'Configuración',        icon: 'settings',      viewId: 'conf-menu' },
]

/**
 * Metadatos de cada vista: qué ítem del sidebar resaltar y qué mostrar en el Header.
 * Cuando se navega a una subvista (ej. 'cli-tomador') el sidebar resalta la sección
 * padre ('clientes') aunque el Header muestre el subtítulo específico.
 */
export const VIEW_META = {
  'home':          { navId: 'home',         title: 'Inicio',             sub: 'Cotizador · LA VENEZOLANA DE SEGUROS Y VIDA C.A.' },
  'cat-productos': { navId: 'productos',    title: 'Productos',           sub: 'Catálogo de productos y coberturas' },
  'cat-vehiculos': { navId: 'cat-vehiculos', title: 'Vehículos',          sub: 'Catálogo de vehículos para cotizaciones' },
  'cli-cliente':   { navId: 'clientes',     title: 'Clientes & Pólizas', sub: 'Gestión de clientes, pólizas y renovaciones' },
  'cli-vehiculo':  { navId: 'vehiculos',    title: 'Bienes Asegurados',  sub: 'Registro y consulta de bienes asegurados' },
  'cot-simulador': { navId: 'cotizaciones', title: 'Cotizador/Emision',  sub: 'Simulador de cotizaciones de seguros vehiculares' },
  'rep-menu':      { navId: 'reportes',     title: 'Reportes',           sub: 'Generación y exportación de reportes' },
  'tas-registro':  { navId: 'tasas',        title: 'Tasas del Día',      sub: 'Registro de tasas BCV — Dólar y Euro' },
  'usr-lista':     { navId: 'usuarios',     title: 'Usuarios',           sub: 'Gestión de usuarios, roles y permisos' },
  'conf-menu':     { navId: 'config',        title: 'Configuración',       sub: 'Ajustes, seguridad y auditoría del sistema' },
  'renovaciones':  { navId: 'renovaciones', title: 'Renovaciones QR',     sub: 'Solicitudes de renovación recibidas por código QR' },
  'cli-tomador':   { navId: 'clientes',     title: 'Clientes & Pólizas', sub: 'Gestión de tomadores' },
  'cli-conductor': { navId: 'clientes',     title: 'Clientes & Pólizas', sub: 'Gestión de conductores' },
  'cat-tipos':     { navId: 'productos',    title: 'Productos',           sub: 'Tipos, marcas y modelos' },
  'cat-tasas':     { navId: 'productos',    title: 'Productos',           sub: 'Tasas por cobertura' },
}

// ── Generadores de HTML para documentos PDF ──────────────────────────────────
// Estas funciones construyen fragmentos HTML con estilos inline para que funcionen
// correctamente en ventanas de impresión donde el CSS externo no está disponible.

/** Escapa caracteres HTML para uso seguro en strings interpolados con innerHTML. */
function h(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')
}

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
 *                           Si se omite, solo aparece el texto "J&M"
 */
export function pdfHdr(docTitle, docSub, ref, date, logoUrl = '') {
  return `<div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:32px;padding-bottom:20px;border-bottom:2px solid #001463">
    <div style="display:flex;align-items:center;gap:12px">
      ${logoUrl ? `<img src="${logoUrl}" alt="J&M" style="height:52px;width:auto;object-fit:contain" />` : ''}
      <div>
        <p style="font-size:22px;font-weight:900;color:#001463;letter-spacing:-0.5px">J&M</p>
        <p style="font-size:9px;color:#94a3b8;text-transform:uppercase;letter-spacing:2px;margin-top:2px">LA VENEZOLANA DE SEGUROS Y VIDA C.A.</p>
        <p style="font-size:9px;color:#94a3b8;margin-top:2px">RIF J-12.345.678-9 · Av. Principal, Caracas 1010</p>
      </div>
    </div>
    <div style="text-align:right">
      <p style="font-size:16px;font-weight:900;color:#1e293b;text-transform:uppercase;letter-spacing:1px">${h(docTitle)}</p>
      ${docSub ? `<p style="font-size:10px;color:#64748b;margin-top:3px">${h(docSub)}</p>` : ''}
      ${ref   ? `<p style="font-size:11px;font-family:monospace;color:#001463;font-weight:700;margin-top:6px">${h(ref)}</p>` : ''}
      ${date  ? `<p style="font-size:10px;color:#64748b;margin-top:2px">${h(date)}</p>` : ''}
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
    <p style="font-size:11px;font-weight:700;color:#001463">LA VENEZOLANA DE SEGUROS Y VIDA C.A.</p>
    <p style="font-size:9px;color:#94a3b8;margin-top:4px">RIF J-12.345.678-9 · Av. Principal, Caracas 1010 · Tel. (0212) 000-0000</p>
    <p style="font-size:8px;color:#cbd5e1;margin-top:8px;line-height:1.6">Documento generado el ${now} · Autorizado por SUDEASEG · Válido únicamente con sello oficial.</p>
  </div>`
}

/** Título de sección dentro del documento (línea separadora con texto pequeño en mayúsculas). */
export function pdfSec(title) {
  return `<p style="font-size:9px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:2px;margin:22px 0 10px;padding-bottom:5px;border-bottom:1px solid #e2e8f0">${h(title)}</p>`
}

/**
 * Fila de datos: etiqueta a la izquierda, valor a la derecha.
 * @param {string}  label  Nombre del campo
 * @param {string}  value  Valor a mostrar
 * @param {boolean} mono   Si true, el valor usa fuente monoespaciada (para IDs, cédulas)
 */
export function pdfRow(label, value, mono = false) {
  return `<div style="display:flex;justify-content:space-between;align-items:baseline;padding:4px 0;border-bottom:1px solid #f1f5f9">
    <span style="font-size:11px;color:#64748b">${h(label)}</span>
    <span style="font-size:12px;font-weight:600;color:#1e293b${mono ? ';font-family:monospace' : ''}">${h(value)}</span>
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
    <span style="font-size:13px;font-weight:700">${h(label)}</span>
    <span style="font-size:22px;font-weight:900">${h(amount)}</span>
  </div>${sub ? `<p style="font-size:9px;color:#64748b;text-align:right;margin-top:5px">${h(sub)}</p>` : ''}`
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
          <p style="font-size:10px;font-weight:700;color:#1e293b">${h(agente)}</p>
          <p style="font-size:9px;color:#64748b">Agente de Seguros · Sello y Firma</p>
        </div>
      </div>
      <div style="text-align:center">
        <div style="border-top:1px solid #1e293b;padding-top:8px;margin-top:44px">
          <p style="font-size:10px;font-weight:700;color:#1e293b">Supervisor · ${h(oficina)}</p>
          <p style="font-size:9px;color:#64748b">Autorizado · Sello y Firma</p>
        </div>
      </div>
    </div>
    <p style="font-size:8px;color:#94a3b8;text-align:center;margin-top:18px;line-height:1.6">Documento generado por INVERSIONES J&M, C.A., LA VENEZOLANA DE SEGUROS Y VIDA C.A. (RIF J-00021447-6). Válido únicamente con sello y firma del supervisor autorizado. Autorizado por SUDEASEG.</p>
  </div>`
}
