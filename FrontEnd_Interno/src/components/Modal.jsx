/**
 * Modal — Sistema centralizado de ventanas emergentes.
 *
 * Todas las ventanas modales de la aplicación viven aquí.
 * El componente Modal() al final del archivo actúa como despachador:
 * lee el tipo del modal activo desde AppContext y renderiza el componente correcto.
 *
 * Para abrir un modal desde cualquier página:
 *   const { showModal } = useApp()
 *   showModal('editForm', { title: '…', fields: […], onSave: async (data) => {…} })
 *
 * ── Tipos de modal disponibles ───────────────────────────────────────────────
 *   confirmDelete  → Diálogo de confirmación antes de eliminar un registro
 *   editForm       → Formulario genérico de crear/editar (usa FormGrid)
 *   renovar        → Resumen de renovación de póliza de un cliente
 *   vehiculoDetail → Ficha completa de un vehículo
 *   productoDetail → Ficha completa de un producto/cobertura
 *   clienteDetail  → Ficha completa de un cliente
 *   blockCliente   → Confirmar activar o desactivar un cliente
 *   newUser        → Formulario para crear un usuario del sistema
 *   editUser       → Formulario para editar un usuario
 *   changeRole     → Selector de rol para un usuario
 *   userPerms      → Listado de permisos por módulo de un usuario
 *   blockUser      → Confirmar bloquear o desbloquear un usuario
 *
 * ── Estructura de ModalShell ─────────────────────────────────────────────────
 * Todos los modales usan ModalShell como base, que provee:
 *   - Fondo oscuro semitransparente con blur
 *   - Contenedor blanco redondeado centrado en pantalla
 *   - Título y botón X de cierre
 *   - Área de acciones al pie (botones Cancelar / Guardar / etc.)
 *   - Cierre al hacer clic fuera del modal
 */
import { useRef, useState, useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { X, Trash2, Pencil, Check, Lock, LockOpen, ShieldCheck, Building, UserCheck, Truck, UserCog, Car, Shield, DollarSign, RotateCcw, FileText, SlidersHorizontal, Receipt, FileCheck, Eye, Upload, ClipboardList, Search, AlertTriangle, AlertCircle, CheckCircle, Clock, User, Phone, MapPin, Briefcase, Download, RefreshCw, Users, Plus, ChevronRight, Package, MessageSquareText, Printer } from 'lucide-react'
import { useApp } from '../context/AppContext.jsx'
import FormGrid from './FormGrid.jsx'
import { useInputLimits } from '../utils/inputLimits.js'
import { Switch, Segmented, PasswordInput } from './FormControls.jsx'
import { fmtMonto, fmtTasa, convertirMoneda, monedaOpcion, badge, PERMISOS_POR_ROL, getEffectivePerms, getEffectivePermsObj, PERMS_CATALOG, PERMS_ORDER, LOCKED_PERMS, pdfPage, pdfHdr, pdfSec, pdfRow, pdfTotal, pdfFooterSimple, useModalLock, filtrarCedula, filtrarTelefono, filtrarSoloDigitos } from '../utils/helpers.jsx'
import { TIPOS_PRODUCTO, TIPOS_CALCULO, tipoBadge } from '../utils/productos.jsx'
import { storeUsuario, updateUsuario, verifyPassword, fetchVendedoresDisponibles } from '../api/usuarios.js'
import { uploadDocumentoProducto, deleteDocumentoProducto } from '../api/productos.js'
import { fetchPolizasCliente, fetchFacturasCliente, fetchSolicitudesCliente } from '../api/clientes.js'
import { fetchDocumentosCliente, uploadDocumentoCliente, deleteDocumentoCliente } from '../api/clienteDocumentos.js'
import { fetchProductos } from '../api/productos.js'
import { ciudadesDe } from '../utils/venezuela.js'
import { updatePoliza, renovarPoliza, fetchRenovacionInfo, downloadPolizaPdf, fetchBeneficiarios, createBeneficiario, updateBeneficiario, deleteBeneficiario, fetchBienesPoliza, agregarBienPoliza, quitarBienPoliza, fetchCuotas, pagarCuota } from '../api/polizas.js'
import { fetchBienes, createBien } from '../api/bienes.js'
import { fetchVehiculosCatalogo } from '../api/vehiculosCatalogo.js'
import { BIEN_TIPO_PRESETS } from '../utils/bienPresets.js'
import { emitirCotizacion, registrarPagoCotizacion } from '../api/solicitudes.js'
import { fetchTasas } from '../api/tasas.js'

// ── Estructura base de todos los modales ────────────────────────────────────
function ModalShell({ title, children, footer, wide = false, maxW, Icon, eyebrow }) {
  const { closeModal } = useApp()
  const sizeClass = maxW || (wide ? 'max-w-2xl' : 'max-w-xl')
  const panelRef = useRef(null)

  // Mientras el modal está abierto: el fondo no debe scrollear ni recibir
  // foco por teclado (Tab no debe poder "escapar" hacia botones de atrás).
  useModalLock(panelRef)
  // Límite de caracteres central a todos los campos de cualquier modal.
  useInputLimits(panelRef)

  return (
    // Fondo oscuro — no cierra al hacer clic; solo la X o "Cancelar/Cerrar" cierran el modal
    // z-[90]: por encima de los modales de página (z-[80]) — confirmDelete y
    // demás modales globales se abren también desde dentro de esos modales.
    <div
      className="fixed inset-0 bg-black/50 z-[90] flex items-center justify-center p-4 sm:p-6 backdrop-blur-sm"
    >
      <div ref={panelRef} tabIndex={-1} className={`bg-white rounded-3xl shadow-2xl w-full ${sizeClass} max-h-[90vh] overflow-y-auto animate-in zoom-in duration-200 outline-none`}>
        <div className="p-6 sm:p-8">
          <div className="flex items-start justify-between gap-3 mb-5">
            <div className="flex items-center gap-3 min-w-0">
              {Icon && (
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0" style={{ background: 'linear-gradient(135deg,#001463,#000c3b)' }}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
              )}
              <div className="min-w-0">
                {eyebrow && <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{eyebrow}</p>}
                <h3 className="text-base sm:text-lg font-bold text-slate-800 truncate">{title}</h3>
              </div>
            </div>
            <button onClick={closeModal} className="p-1.5 hover:bg-slate-100 rounded-xl transition shrink-0">
              <X className="w-5 h-5 text-slate-500" />
            </button>
          </div>
          <div>{children}</div>
          {footer && <div className="flex flex-wrap gap-3 justify-end mt-6">{footer}</div>}
        </div>
      </div>
    </div>
  )
}

// ── Elegir moneda para imprimir/exportar el PDF de una póliza ────────────────
/**
 * Pregunta en qué moneda se quiere el documento antes de generarlo. El PDF
 * sale con TODOS los montos convertidos a la moneda elegida (el backend usa
 * la tasa BCV de emisión de la póliza, o la del día si no la tiene).
 *
 * @param {string}   monedaNativa Moneda nativa de la póliza (preseleccionada)
 * @param {Function} onSelect     Recibe la moneda elegida ('BS'|'USD'|'EUR')
 */
function ElegirMonedaPdfModal({ monedaNativa = 'BS', onSelect }) {
  const { closeModal } = useApp()
  const nativa = (monedaNativa || 'BS').toUpperCase() === 'BS.' ? 'BS' : (monedaNativa || 'BS').toUpperCase()
  const opciones = [
    { m: 'BS',  label: 'Bolívares', simbolo: 'Bs.', cls: 'border-blue-500 bg-blue-50 text-blue-700 hover:bg-blue-100' },
    { m: 'USD', label: 'Dólares',   simbolo: '$',   cls: 'border-emerald-500 bg-emerald-50 text-emerald-700 hover:bg-emerald-100' },
    { m: 'EUR', label: 'Euros',     simbolo: '€',   cls: 'border-amber-500 bg-amber-50 text-amber-700 hover:bg-amber-100' },
  ]
  const elegir = (m) => { closeModal(); onSelect?.(m) }
  return (
    <ModalShell title="¿En qué moneda imprimir?" Icon={Printer} eyebrow="Imprimir póliza">
      <p className="text-sm text-slate-500 mb-4">
        Todos los montos del documento saldrán en la moneda elegida.
      </p>
      <div className="grid grid-cols-3 gap-3">
        {opciones.map(({ m, label, simbolo, cls }) => (
          <button key={m} type="button" onClick={() => elegir(m)}
            className={`flex flex-col items-center gap-1 py-4 rounded-2xl border-2 font-bold transition ${cls}`}>
            <span className="text-2xl font-black">{simbolo}</span>
            <span className="text-xs">{label}</span>
            {m === nativa && <span className="text-[10px] font-semibold opacity-70">(moneda de la póliza)</span>}
          </button>
        ))}
      </div>
    </ModalShell>
  )
}

// ── Confirmación de eliminación ──────────────────────────────────────────────
/**
 * Muestra una advertencia antes de eliminar un registro.
 * Si el backend rechaza la eliminación (ej. tiene datos relacionados),
 * muestra el mensaje de error como toast en lugar de cerrar el modal.
 *
 * @param {string}   name       Nombre del registro que se va a eliminar (para el mensaje)
 * @param {Function} onConfirm  Función async que llama al backend; lanza Error si falla
 */
function ConfirmDeleteModal({ name, onConfirm }) {
  const { closeModal, showToast } = useApp()
  const [password, setPassword] = useState('')
  const [passErr,  setPassErr]  = useState('')
  const [saving,   setSaving]   = useState(false)
  // Aviso devuelto por el backend cuando el registro tiene pólizas/cotizaciones
  // asociadas: se muestra y se exige la contraseña una SEGUNDA vez antes de
  // eliminar en cascada.
  const [warn, setWarn] = useState('')

  const handleDelete = async () => {
    if (!password.trim()) { setPassErr('Ingresa tu contraseña para confirmar.'); return }
    setSaving(true); setPassErr('')
    try {
      await verifyPassword(password)
    } catch (err) {
      setPassErr(err.message || 'Contraseña incorrecta.')
      setSaving(false)
      return
    }
    try {
      if (onConfirm) await onConfirm(warn ? { force: true, password } : undefined)
      closeModal()
      showToast(`${name} eliminado`, 'error')
    } catch (err) {
      if (err.requiereConfirmacion && !warn) {
        setWarn(err.message)
        setPassword('')
        setSaving(false)
        return
      }
      showToast(err.message || 'Error al eliminar', 'error')
      setSaving(false)
    }
  }

  return (
    <ModalShell title="Confirmar eliminación" footer={
      <>
        <button onClick={closeModal} disabled={saving} className="btn-secondary">Cancelar</button>
        <button onClick={handleDelete} disabled={saving} className="btn-danger disabled:opacity-50">
          {saving
            ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            : <Trash2 className="w-4 h-4" />}
          {saving ? 'Verificando…' : 'Eliminar'}
        </button>
      </>
    }>
      <div className="flex flex-col items-center text-center gap-4 py-2">
        <div className="w-14 h-14 rounded-full bg-rose-100 flex items-center justify-center">
          <Trash2 className="w-7 h-7 text-rose-600" />
        </div>
        <div>
          <p className="font-semibold text-slate-800 mb-1">¿Eliminar <em>{name}</em>?</p>
          <p className="text-sm text-slate-500">Esta acción no se puede deshacer.</p>
        </div>
        {warn && (
          <div className="w-full p-3 bg-amber-50 border border-amber-300 rounded-xl text-left">
            <p className="text-xs font-bold text-amber-800 mb-1">⚠️ Atención</p>
            <p className="text-xs text-amber-800">{warn}</p>
            <p className="text-xs text-amber-700 mt-1.5 font-semibold">
              Para continuar, vuelve a ingresar tu contraseña.
            </p>
          </div>
        )}
        <div className="w-full text-left">
          <label className="field-label">Contraseña <span className="text-rose-500">*</span></label>
          <input
            type="password"
            className={`input-field ${passErr ? 'border-rose-400' : ''}`}
            placeholder={warn ? 'Confirma nuevamente tu contraseña' : 'Ingresa tu contraseña para confirmar'}
            value={password}
            onChange={e => { setPassword(e.target.value); setPassErr('') }}
            onKeyDown={e => e.key === 'Enter' && handleDelete()}
            autoFocus
          />
          {passErr && <p className="text-xs text-rose-600 mt-1">{passErr}</p>}
        </div>
      </div>
    </ModalShell>
  )
}

// ── Confirmar registro/actualización de tasas del día ───────────────────────
function ConfirmTasaModal({ fecha, usd, eur, isUpdate, onConfirm }) {
  const { closeModal, showToast } = useApp()
  const [password, setPassword] = useState('')
  const [passErr,  setPassErr]  = useState('')
  const [saving,   setSaving]   = useState(false)

  const handleConfirm = async () => {
    if (!password.trim()) { setPassErr('Ingresa tu contraseña para confirmar.'); return }
    setSaving(true); setPassErr('')
    try {
      await verifyPassword(password)
    } catch (err) {
      setPassErr(err.message || 'Contraseña incorrecta.')
      setSaving(false)
      return
    }
    try {
      await onConfirm()
      closeModal()
    } catch (err) {
      showToast(err.message || 'Error al guardar las tasas', 'error')
      setSaving(false)
    }
  }

  return (
    <ModalShell title={isUpdate ? 'Confirmar actualización de tasas' : 'Confirmar registro de tasas'} footer={
      <>
        <button onClick={closeModal} disabled={saving} className="btn-secondary">Cancelar</button>
        <button onClick={handleConfirm} disabled={saving} className="btn-primary disabled:opacity-50">
          {saving
            ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            : <Check className="w-4 h-4" />}
          {saving ? 'Verificando…' : isUpdate ? 'Actualizar Tasas' : 'Registrar Tasas'}
        </button>
      </>
    }>
      <div className="flex flex-col items-center text-center gap-4 py-2">
        <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center">
          <DollarSign className="w-7 h-7 text-emerald-600" />
        </div>
        <div>
          <p className="font-semibold text-slate-800 mb-1">
            {isUpdate ? 'Vas a actualizar las tasas de' : 'Vas a registrar las tasas de'} {fecha}
          </p>
          <p className="text-sm text-slate-500">Este valor se aplicará a todos los cálculos del sistema a partir de ahora.</p>
        </div>
        <div className="w-full flex items-center justify-center gap-4">
          <div className="px-4 py-2 rounded-xl bg-slate-50 border border-slate-100">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">USD</p>
            <p className="text-sm font-bold text-emerald-600">{usd}</p>
          </div>
          <div className="px-4 py-2 rounded-xl bg-slate-50 border border-slate-100">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">EUR</p>
            <p className="text-sm font-bold text-amber-600">{eur}</p>
          </div>
        </div>
        <div className="w-full text-left">
          <label className="field-label">Contraseña <span className="text-rose-500">*</span></label>
          <input
            type="password"
            className={`input-field ${passErr ? 'border-rose-400' : ''}`}
            placeholder="Ingresa tu contraseña para confirmar"
            value={password}
            onChange={e => { setPassword(e.target.value); setPassErr('') }}
            onKeyDown={e => e.key === 'Enter' && handleConfirm()}
            autoFocus
          />
          {passErr && <p className="text-xs text-rose-600 mt-1">{passErr}</p>}
        </div>
      </div>
    </ModalShell>
  )
}

// ── Confirmar una acción sensible genérica + contraseña ─────────────────────
/**
 * Para acciones que no son "eliminar" pero igual cambian algo visible
 * públicamente o de forma delicada (ej. publicar/despublicar un producto en
 * el portal). Mismo patrón de ConfirmDeleteModal: mensaje + contraseña.
 *
 * @param {string}   title
 * @param {string}   message
 * @param {Component} icon
 * @param {string}   color        nombre de color tailwind (bg-{color}-100 / text-{color}-600)
 * @param {string}   confirmLabel texto del botón de confirmar
 * @param {Function} onConfirm
 */
function ConfirmActionModal({ title, message, icon: Icon = CheckCircle, color = 'blue', confirmLabel = 'Confirmar', onConfirm,
  withNote = false, noteLabel = 'Observación', notePlaceholder = '', noteRequired = false, noteMax = 500 }) {
  const { closeModal, showToast } = useApp()
  const [password, setPassword] = useState('')
  const [passErr,  setPassErr]  = useState('')
  const [note,     setNote]     = useState('')
  const [noteErr,  setNoteErr]  = useState('')
  const [saving,   setSaving]   = useState(false)
  // Tailwind no resuelve clases armadas con template strings en build time:
  // hay que listar las combinaciones completas para que el JIT las incluya.
  const COLOR = {
    blue:    'bg-blue-100 text-blue-600',
    emerald: 'bg-emerald-100 text-emerald-600',
    amber:   'bg-amber-100 text-amber-600',
    rose:    'bg-rose-100 text-rose-600',
    slate:   'bg-slate-100 text-slate-600',
  }
  const [bgCls, textCls] = (COLOR[color] ?? COLOR.blue).split(' ')

  const handleConfirm = async () => {
    if (withNote && noteRequired && !note.trim()) { setNoteErr(`${noteLabel} requerida.`); return }
    if (!password.trim()) { setPassErr('Ingresa tu contraseña para confirmar.'); return }
    setSaving(true); setPassErr('')
    try {
      await verifyPassword(password)
    } catch (err) {
      setPassErr(err.message || 'Contraseña incorrecta.')
      setSaving(false)
      return
    }
    try {
      await onConfirm(withNote ? note.trim() : undefined)
      closeModal()
    } catch (err) {
      showToast(err.message || 'Error al confirmar la acción', 'error')
      setSaving(false)
    }
  }

  return (
    <ModalShell title={title} footer={
      <>
        <button onClick={closeModal} disabled={saving} className="btn-secondary">Cancelar</button>
        <button onClick={handleConfirm} disabled={saving} className="btn-primary disabled:opacity-50">
          {saving
            ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            : <Icon className="w-4 h-4" />}
          {saving ? 'Verificando…' : confirmLabel}
        </button>
      </>
    }>
      <div className="flex flex-col items-center text-center gap-4 py-2">
        <div className={`w-14 h-14 rounded-full ${bgCls} flex items-center justify-center`}>
          <Icon className={`w-7 h-7 ${textCls}`} />
        </div>
        <p className="text-sm text-slate-600">{message}</p>
        {withNote && (
          <div className="w-full text-left">
            <label className="field-label">{noteLabel} {noteRequired && <span className="text-rose-500">*</span>}</label>
            <textarea
              rows={2}
              maxLength={noteMax}
              className={`input-field resize-none ${noteErr ? 'border-rose-400' : ''}`}
              placeholder={notePlaceholder}
              value={note}
              onChange={e => { setNote(e.target.value); setNoteErr('') }}
            />
            {noteErr && <p className="text-xs text-rose-600 mt-1">{noteErr}</p>}
          </div>
        )}
        <div className="w-full text-left">
          <label className="field-label">Contraseña <span className="text-rose-500">*</span></label>
          <input
            type="password"
            className={`input-field ${passErr ? 'border-rose-400' : ''}`}
            placeholder="Ingresa tu contraseña para confirmar"
            value={password}
            onChange={e => { setPassword(e.target.value); setPassErr('') }}
            onKeyDown={e => e.key === 'Enter' && handleConfirm()}
            autoFocus
          />
          {passErr && <p className="text-xs text-rose-600 mt-1">{passErr}</p>}
        </div>
      </div>
    </ModalShell>
  )
}

/**
 * Modal de solo lectura para mostrar una nota/observación (ej. la observación
 * registrada al pagar una comisión). Sin contraseña ni acciones — solo cierra.
 */
function NoteViewModal({ title = 'Observación', note, empty = 'Sin observación.' }) {
  const { closeModal } = useApp()
  return (
    <ModalShell title={title} footer={
      <button onClick={closeModal} className="btn-primary">Cerrar</button>
    }>
      <div className="flex gap-3 py-2">
        <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center shrink-0">
          <MessageSquareText className="w-5 h-5" />
        </div>
        <p className={`text-sm whitespace-pre-wrap break-words ${note ? 'text-slate-700' : 'text-slate-400 italic'}`}>
          {note || empty}
        </p>
      </div>
    </ModalShell>
  )
}

// ── Detalle de un registro de auditoría ─────────────────────────────────────
/**
 * Vista de solo lectura del registro completo de auditoría seleccionado en la
 * lista (resumen de actividad, cambios detallados o logs de correos). Muestra
 * todos los campos —incluidos los que en la tabla van truncados u ocultos por
 * espacio (descripción larga, user-agent, huella de dispositivo, cambios
 * campo a campo)—.
 *
 * @param {string} title    Título del modal
 * @param {string} eyebrow  Etiqueta pequeña sobre el título
 * @param {Array}  fields   [{ label, value, mono }] — value puede ser texto o JSX
 */
function AuditoriaDetailModal({ title = 'Detalle del registro', eyebrow = 'Auditoría', fields = [] }) {
  const { closeModal } = useApp()
  const visibles = fields.filter(Boolean)
  return (
    <ModalShell title={title} eyebrow={eyebrow} Icon={FileText} wide footer={
      <button onClick={closeModal} className="btn-primary">Cerrar</button>
    }>
      <dl className="divide-y divide-slate-100">
        {visibles.map(({ label, value, mono }) => (
          <div key={label} className="py-2.5 grid grid-cols-1 sm:grid-cols-3 gap-0.5 sm:gap-3">
            <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{label}</dt>
            <dd className={`sm:col-span-2 text-sm text-slate-700 break-words whitespace-pre-wrap ${mono ? 'font-mono text-xs' : ''}`}>
              {value === null || value === undefined || value === '' ? <span className="text-slate-300">—</span> : value}
            </dd>
          </div>
        ))}
      </dl>
    </ModalShell>
  )
}

// ── Desbloquear usuario: elegir alcance (usuario / IP / ambos) ──────────────
function DesbloquearUsuarioModal({ nom, onConfirm, mostrarScopeIp = true }) {
  const { closeModal, showToast } = useApp()
  const [saving, setSaving] = useState('')
  const [password, setPassword] = useState('')
  const [passErr, setPassErr] = useState('')
  const run = async (scope) => {
    // Igual que eliminar u otras acciones sensibles: exige la contraseña del
    // usuario logueado antes de desbloquear (usuario / IP / ambos).
    if (!password.trim()) { setPassErr('Ingresa tu contraseña para confirmar.'); return }
    setSaving(scope); setPassErr('')
    try {
      await verifyPassword(password)
    } catch (err) {
      setPassErr(err.message || 'Contraseña incorrecta.')
      setSaving('')
      return
    }
    try { await onConfirm(scope); closeModal() }
    catch (e) { showToast(e.message || 'Error al desbloquear', 'error'); setSaving('') }
  }
  const opt = (scope, titulo, desc) => (
    <button
      type="button"
      disabled={!!saving}
      onClick={() => run(scope)}
      className="w-full text-left p-3 rounded-2xl border border-slate-200 hover:border-jm-blue/40 hover:bg-slate-50 transition disabled:opacity-50 flex items-center gap-3"
    >
      <span className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
        {saving === scope ? <div className="w-4 h-4 border-2 border-emerald-300 border-t-emerald-600 rounded-full animate-spin" /> : <LockOpen className="w-4 h-4" />}
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-bold text-slate-800">{titulo}</span>
        <span className="block text-xs text-slate-500">{desc}</span>
      </span>
    </button>
  )
  return (
    <ModalShell title="Desbloquear" eyebrow={nom} Icon={LockOpen} footer={
      <button onClick={closeModal} className="btn-secondary">Cancelar</button>
    }>
      <div className="mb-4 text-left">
        <label className="field-label">Confirma tu contraseña <span className="text-rose-500">*</span></label>
        <input
          type="password"
          className={`input-field ${passErr ? 'border-rose-400' : ''}`}
          placeholder="Tu contraseña"
          value={password}
          onChange={e => { setPassword(e.target.value); setPassErr('') }}
          autoComplete="current-password"
        />
        {passErr && <p className="text-xs text-rose-600 mt-1">{passErr}</p>}
      </div>
      {mostrarScopeIp ? (
        <>
          <p className="text-sm text-slate-600 mb-3">¿Qué deseas desbloquear de <strong>{nom}</strong>?</p>
          <div className="space-y-2">
            {opt('usuario', 'Solo el usuario', 'Reactiva la cuenta; la IP sigue bloqueada')}
            {opt('ip',      'Solo la IP',      'Suelta la IP; la cuenta sigue bloqueada')}
            {opt('ambos',   'Ambos',           'Reactiva la cuenta y suelta la IP')}
          </div>
        </>
      ) : (
        // La IP de este usuario ya no está bloqueada (o no aplica): solo queda
        // reactivar la cuenta. No tiene sentido ofrecer "soltar IP" ni "ambos".
        <>
          <p className="text-sm text-slate-600 mb-3">Se reactivará la cuenta de <strong>{nom}</strong> para que pueda volver a iniciar sesión. No hay ninguna IP bloqueada asociada.</p>
          <div className="space-y-2">
            {opt('usuario', 'Reactivar la cuenta', 'La cuenta podrá iniciar sesión de nuevo')}
          </div>
        </>
      )}
    </ModalShell>
  )
}

// ── Menú de acciones (uso en filas de tabla en pantallas chicas) ────────────
/**
 * En móvil no caben todos los botones de acción de una fila sin desbordar
 * o amontonarse. Este modal centraliza esas mismas acciones como una lista
 * de opciones full-width, tocables, una por línea.
 *
 * @param {string} title    Título del modal (ej. nombre del cliente/fila)
 * @param {Array}  actions  [{ icon: Component, label, onClick, color, disabled? }]
 */
function ActionMenuModal({ title, actions }) {
  const { closeModal } = useApp()
  const COLOR = {
    slate:   'bg-slate-50 text-slate-600',
    indigo:  'bg-indigo-50 text-indigo-600',
    amber:   'bg-amber-50 text-amber-600',
    blue:    'bg-blue-50 text-blue-600',
    teal:    'bg-teal-50 text-teal-600',
    orange:  'bg-orange-50 text-orange-600',
    rose:    'bg-rose-50 text-rose-500',
    emerald: 'bg-emerald-50 text-emerald-600',
    violet:  'bg-violet-50 text-violet-600',
  }
  return (
    <ModalShell title={title} footer={
      <button onClick={closeModal} className="btn-secondary ml-auto">Cerrar</button>
    }>
      <div className="space-y-1.5">
        {actions.filter(Boolean).map((a, i) => (
          <button
            key={i}
            onClick={() => { closeModal(); a.onClick() }}
            disabled={a.disabled}
            className="w-full flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50 transition text-left disabled:opacity-40 disabled:pointer-events-none"
          >
            <span className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${COLOR[a.color] ?? COLOR.slate}`}>
              <a.icon className="w-[18px] h-[18px]" />
            </span>
            <span className="flex-1 text-sm font-semibold text-slate-700">{a.label}</span>
            <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
          </button>
        ))}
      </div>
    </ModalShell>
  )
}

// ── Formulario genérico de crear / editar ───────────────────────────────────
/**
 * Renderiza un formulario basado en el array de descriptores de campo.
 * Antes de llamar a onSave valida los campos required del propio navegador
 * (sin lógica extra, usa la validación nativa HTML5).
 *
 * @param {string}   title    Título del modal (ej. "Nuevo Cliente", "Editar Producto")
 * @param {Array}    fields   Descriptores de campo para FormGrid
 * @param {Function} onSave   Función async llamada con los datos del formulario
 * @param {boolean}  wide     Si true, el modal usa un ancho mayor (para formularios con 2+ columnas)
 */
function EditFormModal({ title, fields, onSave, wide = false }) {
  const { closeModal, showToast } = useApp()
  const formRef = useRef(null)
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!formRef.current.reportValidity()) return

    if (!onSave) {
      closeModal()
      showToast('Cambios guardados', 'success')
      return
    }
    const data = Object.fromEntries(new FormData(formRef.current))
    setSaving(true)
    try {
      await onSave(data)
      closeModal()
      showToast('Cambios guardados', 'success')
    } catch (err) {
      showToast(err.message || 'Error al guardar', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <ModalShell title={title} wide={wide} footer={
      <>
        <button onClick={closeModal} disabled={saving} className="btn-secondary">Cancelar</button>
        <button onClick={handleSave} disabled={saving} className="btn-primary disabled:opacity-60">
          {saving
            ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Guardando…</>
            : <><Check className="w-4 h-4" />Guardar</>
          }
        </button>
      </>
    }>
      <form ref={formRef}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormGrid fields={fields} />
        </div>
      </form>
    </ModalShell>
  )
}

function SeleccionarTarifaRenovacionModal({ client, diasVencimiento, tarifarios, onSaved, onCancel }) {
  const { closeModal, showModal } = useApp()
  const [selectedId, setSelectedId] = useState('')

  const handleContinuar = () => {
    const selected = tarifarios.find(t => t.id === parseInt(selectedId))
    if (!selected) return

    closeModal()
    setTimeout(() => {
      showModal('renovar', {
        client: {
          ...client,
          prima: fmtMonto(selected.prima_anual, client.moneda_producto),
          tarifario_id: selected.id
        },
        diasVencimiento,
        onSaved
      })
    }, 100)
  }

  return (
    <ModalShell title="Seleccionar Tarifa para Renovación" maxW="max-w-md" footer={
      <>
        <button onClick={onCancel || closeModal} className="btn-secondary">Cancelar</button>
        <button onClick={handleContinuar} disabled={!selectedId} className="btn-primary">Continuar</button>
      </>
    }>
      <div className="space-y-4">
        <p className="text-sm text-slate-650 leading-relaxed">
          No se pudo encontrar una tarifa vigente automática para esta póliza. Por favor, seleccione una tarifa activa del producto para calcular el nuevo monto de renovación:
        </p>

        <div className="space-y-2">
          <label className="block text-xs font-semibold text-slate-500 uppercase">Tarifas Disponibles</label>
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="w-full rounded-lg border border-slate-200 p-2.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          >
            <option value="">-- Seleccione una tarifa --</option>
            {tarifarios.map(t => (
              <option key={t.id} value={t.id}>
                {t.nombre} {t.subtipo ? `(${t.subtipo})` : ''} - {fmtMonto(t.prima_anual, client.moneda_producto)}
              </option>
            ))}
          </select>
        </div>
      </div>
    </ModalShell>
  )
}

// ── Renovar póliza ───────────────────────────────────────────────────────────
/**
 * Muestra un resumen de la póliza actual del cliente y un formulario
 * de pago/sede para generar la renovación en el backend.
 *
 * @param {Object} client  Fila del cliente desde index() (nom, pol, vig, prima, poliza_id)
 * @param {Function} onSaved  Callback para refrescar la tabla de clientes
 */
function RenovarModal({ client, diasVencimiento, onSaved, onCancel }) {
  const { closeModal, showToast } = useApp()
  const handleCancel = () => { if (onCancel) onCancel(); else closeModal() }
  const [tasas, setTasas]         = useState({ usd: null, eur: null })
  const [pagos, setPagos]         = useState(() => [{ ...pagoVacio(), moneda: monedaOpcion(client.moneda_producto) }])
  const [frecuencia, setFrecuencia] = useState('Anual')
  const [saving, setSaving]       = useState(false)
  const [formErr, setFormErr]     = useState({})
  const [confirmaVigente, setConfirmaVigente] = useState(false)

  // "Por vencer" = menos de 30 días o ya vencida
  const diasNum    = typeof diasVencimiento === 'number' ? diasVencimiento : null
  const porVencer  = diasNum !== null && diasNum <= 30
  const vigente    = diasNum !== null && diasNum > 30

  useEffect(() => {
    fetchTasas()
      .then(data => setTasas({ usd: data.usd?.valor ?? null, eur: data.eur?.valor ?? null }))
      .catch(() => {})
  }, [])

  if (!client) return null

  const setPago    = (i, field, val) =>
    setPagos(prev => prev.map((p, idx) => idx === i ? { ...p, [field]: val, ...(field === 'forma' ? { referencia: '' } : {}) } : p))
  const addPago    = () => setPagos(p => [...p, { ...pagoVacio(), moneda: monedaOpcion(monedaNativa) }])
  const removePago = i  => setPagos(p => p.filter((_, idx) => idx !== i))

  // La prima de client.prima ya viene en la moneda nativa del producto (no
  // siempre USD) — el nombre "Usd" se conserva por compatibilidad histórica.
  const monedaNativa        = client.moneda_producto || 'USD'
  const primaUsd            = parseFloat(client.prima?.replace(/[^0-9.]/g, '')) || 0
  const permiteMensualidades = !!client.producto_permite_mensualidades
  const recargoMensualPct    = parseFloat(client.producto_recargo_mensual_pct) || 0
  // Al renovar con pago mensual solo se cobra la primera cuota (con su
  // recargo de financiamiento, si el producto tiene uno configurado) — las
  // 11 cuotas restantes se cobran después, fuera de este paso.
  const esMensual = frecuencia === 'Mensual' && permiteMensualidades
  const montoEsperadoUsd = esMensual
    ? Math.round((primaUsd / 12) * (1 + recargoMensualPct / 100) * 100) / 100
    : primaUsd
  // Tope = total financiado (prima*(1+recargo%)) en mensual; la prima en anual.
  const montoMaximo = esMensual
    ? Math.round(primaUsd * (1 + recargoMensualPct / 100) * 100) / 100
    : primaUsd

  // Convierte cada pago a la moneda nativa del producto (no siempre USD)
  // antes de comparar contra el monto esperado — igual que Moneda::convertir() en el backend.
  const pagoEnUsd = (p) => convertirMoneda(parseFloat(p.monto) || 0, p.moneda, monedaNativa, tasas.usd || 0, tasas.eur || 0)

  // El pago puede ir desde la primera cuota (montoEsperadoUsd) hasta el total
  // financiado: se permite adelantar pagos, pero no menos del mes ni más del tope.
  const totalIngresadoUsd = pagos.reduce((sum, p) => sum + pagoEnUsd(p), 0)
  const pagCents          = Math.floor(totalIngresadoUsd * 100 + 1e-6)
  const minCents          = Math.round(montoEsperadoUsd * 100)
  const maxCents          = Math.round(montoMaximo * 100)
  const faltante          = Math.max(0, minCents - pagCents) / 100
  const excedente         = Math.max(0, pagCents - maxCents) / 100
  const adelanto          = Math.max(0, Math.min(pagCents, maxCents) - minCents) / 100
  const totalOk           = pagCents >= minCents && pagCents <= maxCents + 10
  const cuotasCubiertas   = esMensual && montoEsperadoUsd > 0
    ? Math.min(12, Math.floor((pagCents / 100) / (montoMaximo / 12) + 1e-9))
    : 0
  // Igual que en Emitir: el faltante se muestra en cada moneda con la que se
  // está pagando (redondeado hacia arriba = mínimo exacto), no solo en la
  // moneda nativa del producto.
  const faltanteReal = Math.max(0, montoEsperadoUsd - totalIngresadoUsd)
  const monedasPago  = [...new Set(pagos.map(p => p.moneda).filter(Boolean))]
  const faltanteTxt  = (monedasPago.length ? monedasPago : [monedaNativa])
    .map(m => fmtMonto(Math.ceil(convertirMoneda(faltanteReal, monedaNativa, m, tasas.usd || 0, tasas.eur || 0) * 100) / 100, m))
    .join(' · ')

  const handleRenovar = async () => {
    if (!client.poliza_id) { showToast('Este cliente no tiene póliza para renovar', 'error'); return }
    const errs = {}
    pagos.forEach((p, i) => {
      if (!p.monto || parseFloat(p.monto) <= 0) errs[`monto_${i}`] = 'Ingrese el monto.'
      if (!PAGOS_SIN_REF.has(p.forma) && !p.referencia.trim()) errs[`ref_${i}`] = 'Referencia requerida.'
    })
    if (!totalOk) errs.total = faltante > 0
      ? `El pago (${fmtMonto(totalIngresadoUsd, monedaNativa)}) es menor a ${frecuencia === 'Mensual' ? 'la primera cuota mensual' : 'la prima'} (${fmtMonto(montoEsperadoUsd, monedaNativa)}).`
      : `El pago (${fmtMonto(totalIngresadoUsd, monedaNativa)}) supera el ${esMensual ? 'total financiado' : 'total de la prima'} (${fmtMonto(montoMaximo, monedaNativa)}).`
    if (Object.keys(errs).length) { setFormErr(errs); return }
    setSaving(true)
    try {
      const result = await renovarPoliza(client.poliza_id, {
        tasa_bcv: tasas.usd ?? 1,
        tasa_eur: tasas.eur ?? 0,
        frecuencia_pago: frecuencia,
        tarifario_id: client.tarifario_id,
        // La póliza aún no venció: el usuario ya confirmó en este modal que
        // quiere renovarla igual (el backend exige este flag fuera de la
        // ventana de renovación).
        anticipada: diasNum !== null && diasNum > 0,
        pagos,
      })
      showToast(`Póliza ${result.nro_contrato} renovada correctamente`, 'success')
      onSaved?.()
      closeModal()
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <ModalShell title="Renovar Póliza" maxW="max-w-xl" footer={
      <>
        <button onClick={handleCancel} disabled={saving} className="btn-secondary">Cancelar</button>
        {vigente && !confirmaVigente
          ? <button onClick={() => setConfirmaVigente(true)} className="btn-primary">
              <RotateCcw className="w-4 h-4" /> Renovar de todas formas
            </button>
          : <button onClick={handleRenovar} disabled={saving} className="btn-success disabled:opacity-50">
              {saving ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <Check className="w-4 h-4" />}
              {saving ? 'Procesando…' : 'Confirmar Renovación'}
            </button>
        }
      </>
    }>
      <div className="space-y-4">
        {/* Resumen póliza */}
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-slate-500">Cliente</span><span className="font-semibold">{client.nom}</span></div>
          <div className="flex justify-between"><span className="text-slate-500">Póliza actual</span><span className="font-mono font-semibold text-blue-700">{client.pol}</span></div>
          <div className="flex justify-between"><span className="text-slate-500">Vigencia</span><span className="font-semibold">{client.vig}</span></div>
          <div className="flex justify-between"><span className="text-slate-500">Prima anual</span><span className="font-bold text-emerald-700">{client.prima}</span></div>
        </div>

        {/* Aviso según estado */}
        {vigente && !confirmaVigente && (
          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-sm text-emerald-800">
            <p className="font-bold mb-1">✓ La póliza está vigente</p>
            <p className="text-xs text-emerald-700">
              Faltan <strong>{diasNum} días</strong> para el vencimiento ({client.vig?.split(' – ')[1] ?? '—'}).
              No es necesario renovarla aún. Si desea renovarla anticipadamente, haga clic en "Renovar de todas formas".
            </p>
          </div>
        )}
        {(porVencer || confirmaVigente) && (
          <>
            {confirmaVigente && (
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800">
                ⚠️ Está renovando una póliza vigente ({diasNum} días restantes). La póliza actual quedará como <strong>RENOVADA</strong> y la nueva vigencia contará a partir del vencimiento actual (no se pierde cobertura).
              </div>
            )}
            {!confirmaVigente && (
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-100 text-xs text-amber-700">
                Se creará una nueva póliza por un año a partir del vencimiento actual. La póliza actual quedará como RENOVADA.
              </div>
            )}

            {/* Tasas BCV — solo lectura */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Tasas BCV del día (referencia)</p>
              <div className="flex gap-6">
                <div><span className="text-[11px] text-slate-500">Bs. / USD</span>
                  <p className="text-sm font-bold text-slate-800">{tasas.usd ? fmtTasa(tasas.usd) : '—'}</p>
                </div>
                {tasas.eur && <div><span className="text-[11px] text-slate-500">Bs. / EUR</span>
                  <p className="text-sm font-bold text-slate-800">{fmtTasa(tasas.eur)}</p>
                </div>}
              </div>
            </div>

            {/* Frecuencia de pago — Mensual solo si el producto lo admite */}
            <div>
              <label className="field-label">Frecuencia de Pago <span className="text-rose-500">*</span></label>
              {permiteMensualidades ? (
                <div className="flex gap-3 mt-1">
                  {['Anual', 'Mensual'].map(f => (
                    <button key={f} onClick={() => setFrecuencia(f)}
                      className={`flex-1 py-2 rounded-xl text-sm font-semibold border transition ${
                        frecuencia === f
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-slate-600 border-slate-300 hover:border-blue-400'
                      }`}>
                      {f === 'Anual' ? '📅 Un solo pago anual' : '🗓 Pagos mensuales (12 cuotas)'}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 mt-1.5 p-2 bg-slate-50 rounded-xl border border-slate-200">
                  📅 Este producto solo admite pago anual en un solo desembolso.
                </p>
              )}
              {frecuencia === 'Mensual' && permiteMensualidades && primaUsd > 0 && (
                <p className="text-xs text-slate-500 mt-1.5">
                  Primera cuota a cobrar ahora{recargoMensualPct > 0 ? ` (incluye recargo de ${recargoMensualPct}%)` : ''}: <strong>{fmtMonto(montoEsperadoUsd, monedaNativa)}</strong>
                  <span className="block text-[10px] text-slate-400 mt-0.5">Puede pagar solo esta cuota o adelantar más, hasta el total financiado de las 12 cuotas; el excedente cubre los meses siguientes.</span>
                </p>
              )}
            </div>

            {/* Formas de pago */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest">
                  {frecuencia === 'Mensual' ? 'Pago del Primer Mes' : 'Formas de Pago'}
                </p>
                <button onClick={addPago} className="text-xs font-semibold text-blue-600 hover:text-blue-800">
                  + Agregar forma de pago
                </button>
              </div>
              <div className="space-y-3">
                {pagos.map((p, i) => (
                  <div key={i} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-500">Pago {i + 1}</span>
                      {pagos.length > 1 && <button onClick={() => removePago(i)} className="text-xs text-rose-500 hover:text-rose-700 font-semibold">Eliminar</button>}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="field-label">Forma</label>
                        <select className="select-field" value={p.forma} onChange={e => setPago(i, 'forma', e.target.value)}>
                          {PAGOS_OPCIONES.map(o => <option key={o}>{o}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="field-label">Moneda</label>
                        <select className="select-field" value={p.moneda} onChange={e => setPago(i, 'moneda', e.target.value)}>
                          {MONEDAS_OPCIONES.map(m => <option key={m}>{m}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="field-label">Monto <span className="text-rose-500">*</span></label>
                        <input type="number" step="0.01" min="0.01"
                          className={`input-field ${formErr[`monto_${i}`] ? 'border-rose-400' : ''}`}
                          placeholder="0.00" value={p.monto}
                          onChange={e => { setPago(i, 'monto', e.target.value); setFormErr(f => ({ ...f, [`monto_${i}`]: '' })) }} />
                        {formErr[`monto_${i}`] && <p className="text-xs text-rose-600 mt-0.5">{formErr[`monto_${i}`]}</p>}
                      </div>
                      <div>
                        <label className="field-label">Referencia {!PAGOS_SIN_REF.has(p.forma) && <span className="text-rose-500">*</span>}</label>
                        <input className={`input-field ${formErr[`ref_${i}`] ? 'border-rose-400' : ''}`}
                          placeholder={PAGOS_SIN_REF.has(p.forma) ? 'Opcional' : 'N° confirmación'} value={p.referencia}
                          onChange={e => { setPago(i, 'referencia', e.target.value); setFormErr(f => ({ ...f, [`ref_${i}`]: '' })) }} />
                        {formErr[`ref_${i}`] && <p className="text-xs text-rose-600 mt-0.5">{formErr[`ref_${i}`]}</p>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className={`mt-3 p-2.5 rounded-xl border text-xs flex items-center justify-between flex-wrap gap-2 ${
                totalOk ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-rose-50 border-rose-200 text-rose-700'
              }`}>
                <span>
                  {!totalOk && faltante  > 0 && `⚠ Falta ${faltanteTxt} para cubrir ${frecuencia === 'Mensual' ? 'la cuota del mes' : 'la prima'}`}
                  {!totalOk && excedente > 0 && `⚠ Excede el ${esMensual ? 'total financiado' : 'total anual'} por ${fmtMonto(excedente, monedaNativa)}`}
                  {totalOk && (
                    esMensual && adelanto > 0
                      ? `✓ Cubre ${cuotasCubiertas} de 12 cuota${cuotasCubiertas !== 1 ? 's' : ''} · adelanto de ${fmtMonto(adelanto, monedaNativa)}${cuotasCubiertas < 12 ? ' (el resto abona a la siguiente)' : ''}`
                      : adelanto > 0
                        ? `✓ Cuota cubierta · adelanto de ${fmtMonto(adelanto, monedaNativa)}`
                        : '✓ Total cuadra')}
                </span>
                <span className="font-bold font-mono ml-auto">{fmtMonto(pagCents / 100, monedaNativa)} / {fmtMonto(montoMaximo, monedaNativa)}</span>
              </div>
              {formErr.total && <p className="text-xs text-rose-600 mt-1">{formErr.total}</p>}
            </div>
          </>
        )}
      </div>
    </ModalShell>
  )
}

// ── Emitir cotización ────────────────────────────────────────────────────────
/**
 * Formulario para emitir una cotización aprobada como póliza oficial.
 * Crea automáticamente la póliza y el recibo en el backend.
 *
 * @param {Object}   cot      Fila de cotización (id, nro, nombre, placa, total)
 * @param {Function} onSaved  Callback para refrescar la tabla
 */
const PAGOS_OPCIONES = ['Transferencia', 'Zelle', 'Efectivo USD', 'Efectivo Bs.', 'Pago Móvil', 'Divisas']
const MONEDAS_OPCIONES = ['USD', 'EUR', 'Bs.']
const PAGOS_SIN_REF = new Set(['Efectivo USD', 'Efectivo Bs.'])

const pagoVacio = () => ({ forma: 'Transferencia', moneda: 'USD', monto: '', referencia: '' })

// mode: 'registrar' (nuevo flujo — el vendedor registra el pago y pasa a
// evaluación) | 'emitir' (legacy — emite directo desde 'aprobado').
function EmitirCotizacionModal({ cot, onSaved, mode = 'registrar' }) {
  const { closeModal, showToast } = useApp()
  const esRegistro = mode === 'registrar'
  const [tasas, setTasas]         = useState({ usd: null, eur: null })
  const [pagos, setPagos]         = useState(() => [{ ...pagoVacio(), moneda: monedaOpcion(cot.moneda_producto) }])
  const [frecuencia, setFrecuencia] = useState('Anual')
  const [saving, setSaving]       = useState(false)
  const [formErr, setFormErr]     = useState({})

  useEffect(() => {
    fetchTasas()
      .then(data => setTasas({ usd: data.usd?.valor ?? null, eur: data.eur?.valor ?? null }))
      .catch(() => {})
  }, [])

  if (!cot) return null

  const setPago = (i, field, val) =>
    setPagos(prev => prev.map((p, idx) => idx === i ? { ...p, [field]: val, ...(field === 'forma' ? { referencia: '' } : {}) } : p))

  const addPago    = () => setPagos(p => [...p, { ...pagoVacio(), moneda: monedaOpcion(monedaNativa) }])
  const removePago = i  => setPagos(p => p.filter((_, idx) => idx !== i))

  const monedaNativa = cot.moneda_producto || 'USD'
  // Convierte cada pago a la moneda nativa del producto usando las tasas del día.
  const pagoEnUsd = (p) => convertirMoneda(parseFloat(p.monto) || 0, p.moneda, monedaNativa, tasas.usd || 0, tasas.eur || 0)

  const totalPoliza          = Number(cot.total)
  const permiteMensualidades = !!cot.producto_permite_mensualidades
  const recargoMensualPct    = parseFloat(cot.producto_recargo_mensual_pct) || 0
  // Igual que en renovación: con pago mensual solo se cobra la primera
  // cuota (con su recargo de financiamiento, si aplica) en este paso.
  const esMensual = frecuencia === 'Mensual' && permiteMensualidades
  const montoEsperadoUsd = esMensual
    ? Math.round((totalPoliza / 12) * (1 + recargoMensualPct / 100) * 100) / 100
    : totalPoliza
  // Tope = total financiado (prima*(1+recargo%)) en mensual; el total en anual.
  const montoMaximo = esMensual
    ? Math.round(totalPoliza * (1 + recargoMensualPct / 100) * 100) / 100
    : totalPoliza

  const totalIngresadoUsd = pagos.reduce((sum, p) => sum + pagoEnUsd(p), 0)
  // El pago puede ir desde la primera cuota (montoEsperadoUsd) hasta el total
  // financiado: se permite adelantar, pero no menos del mes ni más del tope.
  const pagCents   = Math.floor(totalIngresadoUsd * 100 + 1e-6)
  const minCents   = Math.round(montoEsperadoUsd * 100)
  const maxCents   = Math.round(montoMaximo * 100)
  const faltante   = Math.max(0, minCents - pagCents) / 100
  const excedente  = Math.max(0, pagCents - maxCents) / 100
  const adelanto   = Math.max(0, Math.min(pagCents, maxCents) - minCents) / 100
  const totalOk    = pagCents >= minCents && pagCents <= maxCents + 10
  // En mensual: cuántas cuotas de 12 cubre el monto pagado (la cuota del mes
  // más las que alcance el excedente). El resto abona a la siguiente cuota.
  const cuotasCubiertas = esMensual && montoEsperadoUsd > 0
    ? Math.min(12, Math.floor((pagCents / 100) / (montoMaximo / 12) + 1e-9))
    : 0
  // Brecha REAL (no en centavos redondeados): lo que falta exactamente para
  // llegar a la cuota. Se usa para mostrar el faltante en cada moneda como el
  // MÍNIMO exacto — pagar menos que eso (aunque sea por 0.01 Bs) no cuadra.
  const faltanteReal = Math.max(0, montoEsperadoUsd - totalIngresadoUsd)
  // El faltante se calcula en la moneda nativa del producto, pero el usuario
  // puede estar pagando en Bs./€: lo mostramos en cada moneda que se está
  // usando para pagar, para que sepa cuánto falta en esas monedas, no solo en $.
  const monedasPago = [...new Set(pagos.map(p => p.moneda).filter(Boolean))]
  const faltanteTxt = (monedasPago.length ? monedasPago : [monedaNativa])
    // Se redondea el faltante HACIA ARRIBA a la moneda, para que sea el mínimo
    // exacto a pagar: al pagar ese monto el total cubre la cuota, y pagar un
    // poco menos (por el redondeo de Bs/€) no cuadra.
    .map(m => fmtMonto(Math.ceil(convertirMoneda(faltanteReal, monedaNativa, m, tasas.usd || 0, tasas.eur || 0) * 100) / 100, m))
    .join(' · ')

  const handleEmitir = async () => {
    const errs = {}
    pagos.forEach((p, i) => {
      if (!p.monto || parseFloat(p.monto) <= 0) errs[`monto_${i}`] = 'Ingrese el monto.'
      if (!PAGOS_SIN_REF.has(p.forma) && !p.referencia.trim()) errs[`ref_${i}`] = 'Referencia requerida.'
    })
    if (!totalOk) errs.total = faltante > 0
      ? `El pago (${fmtMonto(totalIngresadoUsd, monedaNativa)}) es menor a ${frecuencia === 'Mensual' && permiteMensualidades ? 'la primera cuota' : 'la póliza'} (${fmtMonto(montoEsperadoUsd, monedaNativa)}).`
      : `El pago (${fmtMonto(totalIngresadoUsd, monedaNativa)}) supera el ${esMensual ? 'total financiado' : 'total anual'} (${fmtMonto(montoMaximo, monedaNativa)}).`
    if (Object.keys(errs).length) { setFormErr(errs); return }
    setFormErr({})
    setSaving(true)
    try {
      const payload = {
        tasa_bcv: tasas.usd ?? 1,
        tasa_eur: tasas.eur ?? 0,
        frecuencia_pago: frecuencia,
        pagos,
      }
      if (esRegistro) {
        await registrarPagoCotizacion(cot.id, payload)
        showToast('Pago registrado. La cotización pasó a evaluación de la oficina.', 'success')
      } else {
        const result = await emitirCotizacion(cot.id, payload)
        showToast(`Póliza ${result.nro_contrato} emitida correctamente`, 'success')
      }
      onSaved?.()
      closeModal()
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <ModalShell title={esRegistro ? 'Registrar Pago' : 'Emitir Póliza'} maxW="max-w-xl" footer={
      <>
        <button onClick={closeModal} className="btn-secondary">Cancelar</button>
        <button onClick={handleEmitir} disabled={saving} className="btn-success">
          <FileCheck className="w-4 h-4" />
          {esRegistro
            ? (saving ? 'Registrando…' : 'Registrar Pago')
            : (saving ? 'Emitiendo…'   : 'Emitir Póliza')}
        </button>
      </>
    }>
      <div className="space-y-4">
        {/* Resumen */}
        <div className="p-3 bg-blue-50 rounded-xl border border-blue-100 space-y-1">
          <p className="text-xs font-bold text-blue-700 font-mono">{cot.nro}</p>
          <p className="text-xs text-blue-600">{cot.nombre}{cot.bien_atributos?.placa ? ` · Placa: ${cot.bien_atributos.placa}` : ''}</p>
          <p className="text-sm font-bold text-blue-800">{fmtMonto(cot.total, cot.moneda_producto)} {cot.moneda_producto || 'USD'}</p>
        </div>

        {/* Tasas BCV — solo lectura */}
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Tasas BCV del día (referencia)</p>
          <div className="flex gap-6">
            <div>
              <span className="text-[11px] text-slate-500">Bs. / USD</span>
              <p className="text-sm font-bold text-slate-800">{tasas.usd ? fmtTasa(tasas.usd) : <span className="text-slate-400 font-normal">No registrada</span>}</p>
            </div>
            {tasas.eur && (
              <div>
                <span className="text-[11px] text-slate-500">Bs. / EUR</span>
                <p className="text-sm font-bold text-slate-800">{fmtTasa(tasas.eur)}</p>
              </div>
            )}
          </div>
        </div>

        {/* Frecuencia de pago — Mensual solo si el producto lo admite */}
        <div>
          <label className="field-label">Frecuencia de Pago <span className="text-rose-500">*</span></label>
          {permiteMensualidades ? (
            <div className="flex gap-3 mt-1">
              {['Anual', 'Mensual'].map(f => (
                <button key={f} onClick={() => setFrecuencia(f)}
                  className={`flex-1 py-2 rounded-xl text-sm font-semibold border transition ${
                    frecuencia === f ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-300 hover:border-blue-400'
                  }`}>
                  {f === 'Anual' ? '📅 Un solo pago anual' : '🗓 Pagos mensuales (12 cuotas)'}
                </button>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500 mt-1.5 p-2 bg-slate-50 rounded-xl border border-slate-200">
              📅 Este producto solo admite pago anual en un solo desembolso.
            </p>
          )}
          {frecuencia === 'Mensual' && permiteMensualidades && totalPoliza > 0 && (
            <p className="text-xs text-slate-500 mt-1.5">
              Primera cuota a cobrar ahora{recargoMensualPct > 0 ? ` (incluye recargo de ${recargoMensualPct}%)` : ''}: <strong>{fmtMonto(montoEsperadoUsd, monedaNativa)}</strong>
              <span className="block text-[10px] text-slate-400 mt-0.5">Puede pagar solo esta cuota o adelantar más, hasta el total anual; el excedente cubre los meses siguientes.</span>
            </p>
          )}
        </div>

        {/* Formas de pago */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest">
              {frecuencia === 'Mensual' ? 'Pago del Primer Mes' : 'Formas de Pago'}
            </p>
            <button onClick={addPago} className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1">
              + Agregar forma de pago
            </button>
          </div>
          <div className="space-y-3">
            {pagos.map((p, i) => (
              <div key={i} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500">Pago {i + 1}</span>
                  {pagos.length > 1 && (
                    <button onClick={() => removePago(i)} className="text-xs text-rose-500 hover:text-rose-700 font-semibold">
                      Eliminar
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="field-label">Forma</label>
                    <select className="select-field" value={p.forma} onChange={e => setPago(i, 'forma', e.target.value)}>
                      {PAGOS_OPCIONES.map(o => <option key={o}>{o}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="field-label">Moneda</label>
                    <select className="select-field" value={p.moneda} onChange={e => setPago(i, 'moneda', e.target.value)}>
                      {MONEDAS_OPCIONES.map(m => <option key={m}>{m}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="field-label">Monto <span className="text-rose-500">*</span></label>
                    <input
                      type="number" step="0.01" min="0.01"
                      className={`input-field ${formErr[`monto_${i}`] ? 'border-rose-400' : ''}`}
                      placeholder="0.00"
                      value={p.monto}
                      onChange={e => { setPago(i, 'monto', e.target.value); setFormErr(f => ({ ...f, [`monto_${i}`]: '' })) }}
                    />
                    {formErr[`monto_${i}`] && <p className="text-xs text-rose-600 mt-0.5">{formErr[`monto_${i}`]}</p>}
                  </div>
                  <div>
                    <label className="field-label">
                      Referencia {!PAGOS_SIN_REF.has(p.forma) && <span className="text-rose-500">*</span>}
                    </label>
                    <input
                      className={`input-field ${formErr[`ref_${i}`] ? 'border-rose-400' : ''}`}
                      placeholder={PAGOS_SIN_REF.has(p.forma) ? 'Opcional' : 'N° confirmación'}
                      value={p.referencia}
                      onChange={e => { setPago(i, 'referencia', e.target.value); setFormErr(f => ({ ...f, [`ref_${i}`]: '' })) }}
                    />
                    {formErr[`ref_${i}`] && <p className="text-xs text-rose-600 mt-0.5">{formErr[`ref_${i}`]}</p>}
                  </div>
                </div>
              </div>
            ))}
          </div>
          {/* Indicador de total */}
          <div className={`mt-3 p-2.5 rounded-xl border text-xs flex items-center justify-between flex-wrap gap-2 ${
            totalOk ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-rose-50 border-rose-200 text-rose-700'
          }`}>
            <span>
              {!totalOk && faltante  > 0 && `⚠ Falta ${faltanteTxt} para cubrir ${frecuencia === 'Mensual' && permiteMensualidades ? 'la cuota del mes' : 'la póliza'}`}
              {!totalOk && excedente > 0 && `⚠ Excede el ${esMensual ? 'total financiado' : 'total anual'} por ${fmtMonto(excedente, monedaNativa)}`}
              {totalOk && (
                esMensual && adelanto > 0
                  ? `✓ Cubre ${cuotasCubiertas} de 12 cuota${cuotasCubiertas !== 1 ? 's' : ''} · adelanto de ${fmtMonto(adelanto, monedaNativa)}${cuotasCubiertas < 12 ? ' (el resto abona a la siguiente)' : ''}`
                  : adelanto > 0
                    ? `✓ Cuota cubierta · adelanto de ${fmtMonto(adelanto, monedaNativa)}`
                    : '✓ Total cuadra')}
            </span>
            <span className="font-bold font-mono ml-auto">
              {fmtMonto(pagCents / 100, monedaNativa)} / {fmtMonto(montoMaximo, monedaNativa)}
            </span>
          </div>
          {formErr.total && <p className="text-xs text-rose-600 mt-1">{formErr.total}</p>}
        </div>

        <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 text-xs text-emerald-700">
          {esRegistro
            ? 'El pago quedará registrado y la cotización pasará a evaluación de la oficina. La póliza se generará cuando aprueben.'
            : 'Se generará la póliza y el recibo automáticamente. La cotización quedará como Emitida.'}
        </div>
      </div>
    </ModalShell>
  )
}

// ── Nuevo usuario ────────────────────────────────────────────────────────────
const USER_ROLES = ['Admin', 'Oficina', 'Vendedor Sucursal', 'Vendedor Calle']
const USER_SEDES = ['Caracas Principal', 'Valencia', 'Maracaibo']

const SecHdr = ({ Icon, children }) => (
  <div className="flex items-center gap-2 mb-4">
    {Icon && (
      <div className="w-6 h-6 rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0">
        <Icon className="w-3.5 h-3.5 text-jm-blue" />
      </div>
    )}
    <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest leading-none">{children}</span>
    <div className="flex-1 h-px bg-slate-200/70" />
  </div>
)

// Sección agrupada en un panel sutil — da estructura visual a los formularios.
const SecPanel = ({ Icon, title, children, className = '' }) => (
  <div className={`rounded-2xl border border-slate-200 bg-slate-50/60 p-4 ${className}`}>
    <SecHdr Icon={Icon}>{title}</SecHdr>
    {children}
  </div>
)

function NewUserModal({ onSave }) {
  const { closeModal, showToast } = useApp()
  const [form, setForm] = useState({
    nombre: '', nick: '', genero: 'M',
    tipo: 'Vendedor Sucursal', sede: 'Valencia',
    comision_pct: '',
    password: '', password_confirmation: '',
    temp: false, temp_expira_en: '',
  })
  const [saving, setSaving] = useState(false)
  const f = k => e => setForm(p => ({ ...p, [k]: e.target.value }))

  const handleSave = async () => {
    if (!form.nombre.trim()) { showToast('El nombre es obligatorio', 'error'); return }
    if (!form.nick.trim())   { showToast('El usuario (nick) es obligatorio', 'error'); return }
    if (form.password.length < 8) { showToast('La contraseña debe tener al menos 8 caracteres', 'error'); return }
    if (form.password !== form.password_confirmation) { showToast('Las contraseñas no coinciden', 'error'); return }
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(form.password)) {
      showToast('Debe contener al menos una mayúscula, una minúscula y un número', 'error'); return
    }
    if (form.temp && !form.temp_expira_en) { showToast('Indica hasta cuándo dura el acceso temporal', 'error'); return }
    setSaving(true)
    try {
      await storeUsuario({ ...form, cargo: form.tipo, nro_sede: 1 })
      closeModal()
      showToast('Usuario creado correctamente', 'success')
      onSave?.()
    } catch (err) { showToast(err.message || 'Error al crear usuario', 'error') }
    finally { setSaving(false) }
  }

  return (
    <ModalShell title="Nuevo Usuario" eyebrow="Usuario" Icon={User} wide footer={
      <>
        <button onClick={closeModal} disabled={saving} className="btn-secondary">Cancelar</button>
        <button onClick={handleSave} disabled={saving} className="btn-primary disabled:opacity-60">
          {saving ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Guardando…</> : <><Check className="w-4 h-4" />Crear Usuario</>}
        </button>
      </>
    }>
      <div className="space-y-4">
        <SecPanel Icon={User} title="Datos del usuario">
          <div className="space-y-3">
            <div>
              <label className="field-label">Nombre completo <span className="text-rose-500">*</span></label>
              <input className="input-field" value={form.nombre} onChange={f('nombre')} placeholder="Nombre y Apellido" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="field-label">Usuario / Nick <span className="text-rose-500">*</span></label>
                <input className="input-field font-mono" value={form.nick} onChange={f('nick')} placeholder="jdoe" />
              </div>
              <div>
                <label className="field-label">Género <span className="text-rose-500">*</span></label>
                <Segmented value={form.genero} onChange={v => setForm(p => ({ ...p, genero: v }))} options={[{ value: 'M', label: 'Masculino' }, { value: 'F', label: 'Femenino' }]} />
              </div>
            </div>
          </div>
        </SecPanel>

        <SecPanel Icon={Shield} title="Rol y acceso">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="field-label">Rol <span className="text-rose-500">*</span></label>
              <select className="select-field" value={form.tipo} onChange={f('tipo')}>
                {USER_ROLES.map(r => <option key={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label className="field-label">Oficina / Sede <span className="text-rose-500">*</span></label>
              <select className="select-field" value={form.sede} onChange={f('sede')}>
                {USER_SEDES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="field-label">Comisión (%)</label>
              <input type="number" min="0" max="100" step="0.01" className="input-field" value={form.comision_pct} onChange={f('comision_pct')} placeholder="Ej. 5" />
              <p className="text-[10px] text-slate-400 mt-1">Vacío = usa el % por defecto del cargo.</p>
            </div>
          </div>
        </SecPanel>

        <SecPanel Icon={Lock} title="Contraseña de acceso">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="field-label">Contraseña <span className="text-rose-500">*</span></label>
              <PasswordInput value={form.password} onChange={f('password')} placeholder="••••••••" />
            </div>
            <div>
              <label className="field-label">Confirmar <span className="text-rose-500">*</span></label>
              <PasswordInput value={form.password_confirmation} onChange={f('password_confirmation')} placeholder="••••••••" />
            </div>
          </div>
          <p className="text-[10px] text-slate-400 mt-2">Mínimo 8 caracteres · mayúscula, minúscula y número.</p>
        </SecPanel>

        <SecPanel Icon={Clock} title="Acceso temporal">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm text-slate-600">Esta cuenta es temporal (ej. contratista, auditor externo)</span>
            <Switch checked={form.temp} onChange={v => setForm(p => ({ ...p, temp: v }))} />
          </div>
          {form.temp && (
            <div className="mt-3">
              <label className="field-label">Vence el <span className="text-rose-500">*</span></label>
              <input type="date" className="input-field" value={form.temp_expira_en} onChange={f('temp_expira_en')} min={new Date().toISOString().slice(0,10)} />
              <p className="text-[10px] text-slate-400 mt-1">Al llegar esta fecha la cuenta se desactiva automáticamente.</p>
            </div>
          )}
        </SecPanel>
      </div>
    </ModalShell>
  )
}

// ── Editar usuario ───────────────────────────────────────────────────────────
function EditUserModal({ user, onSave }) {
  const { closeModal, showToast } = useApp()
  const [form, setForm] = useState({
    nombre: user.nombre || '', nick: user.nick || '',
    genero: user.genero || 'M', tipo: user.tipo || '',
    sede: user.sede || '', comision_pct: user.comision_pct ?? '', password: '',
    temp: !!user.temp, temp_expira_en: user.temp_expira_en?.slice(0,10) || '',
  })
  const [saving, setSaving] = useState(false)
  const f = k => e => setForm(p => ({ ...p, [k]: e.target.value }))

  const handleSave = async () => {
    if (!form.nombre.trim()) { showToast('El nombre es obligatorio', 'error'); return }
    if (form.password) {
      if (form.password.length < 8) { showToast('La contraseña debe tener al menos 8 caracteres', 'error'); return }
      if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(form.password)) {
        showToast('Debe contener al menos una mayúscula, minúscula y número', 'error'); return
      }
    }
    if (form.temp && !form.temp_expira_en) { showToast('Indica hasta cuándo dura el acceso temporal', 'error'); return }
    setSaving(true)
    const payload = { ...form, cargo: form.tipo, nro_sede: 1 }
    if (!payload.password) delete payload.password
    try {
      await updateUsuario(user.id, payload)
      closeModal()
      showToast('Usuario actualizado', 'success')
      onSave?.()
    } catch (err) { showToast(err.message || 'Error al actualizar', 'error') }
    finally { setSaving(false) }
  }

  return (
    <ModalShell title={`Editar — ${user.nombre}`} eyebrow="Usuario" Icon={UserCog} wide footer={
      <>
        <button onClick={closeModal} disabled={saving} className="btn-secondary">Cancelar</button>
        <button onClick={handleSave} disabled={saving} className="btn-primary disabled:opacity-60">
          {saving ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Guardando…</> : <><Check className="w-4 h-4" />Guardar</>}
        </button>
      </>
    }>
      <div className="space-y-4">
        <SecPanel Icon={User} title="Datos del usuario">
          <div className="space-y-3">
            <div>
              <label className="field-label">Nombre completo <span className="text-rose-500">*</span></label>
              <input className="input-field" value={form.nombre} onChange={f('nombre')} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="field-label">Usuario / Nick</label>
                <input className="input-field font-mono" value={form.nick} onChange={f('nick')} />
              </div>
              <div>
                <label className="field-label">Género</label>
                <Segmented value={form.genero} onChange={v => setForm(p => ({ ...p, genero: v }))} options={[{ value: 'M', label: 'Masculino' }, { value: 'F', label: 'Femenino' }]} />
              </div>
            </div>
          </div>
        </SecPanel>

        <SecPanel Icon={Shield} title="Rol y acceso">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="field-label">Rol</label>
              <select className="select-field" value={form.tipo} onChange={f('tipo')}>
                {USER_ROLES.map(r => <option key={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label className="field-label">Oficina / Sede</label>
              <select className="select-field" value={form.sede} onChange={f('sede')}>
                {USER_SEDES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="field-label">Comisión (%)</label>
              <input type="number" min="0" max="100" step="0.01" className="input-field" value={form.comision_pct} onChange={f('comision_pct')} placeholder="Ej. 5" />
              <p className="text-[10px] text-slate-400 mt-1">Vacío = usa el % por defecto del cargo.</p>
            </div>
          </div>
        </SecPanel>

        <SecPanel Icon={Lock} title="Contraseña (opcional)">
          <label className="field-label">Nueva contraseña</label>
          <PasswordInput value={form.password} onChange={f('password')} placeholder="Dejar vacío para no cambiar" />
          <p className="text-[10px] text-slate-400 mt-2">Mínimo 8 caracteres · mayúscula, minúscula y número.</p>
        </SecPanel>

        <SecPanel Icon={Clock} title="Acceso temporal">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm text-slate-600">Esta cuenta es temporal (ej. contratista, auditor externo)</span>
            <Switch checked={form.temp} onChange={v => setForm(p => ({ ...p, temp: v }))} />
          </div>
          {form.temp && (
            <div className="mt-3">
              <label className="field-label">Vence el <span className="text-rose-500">*</span></label>
              <input type="date" className="input-field" value={form.temp_expira_en} onChange={f('temp_expira_en')} min={new Date().toISOString().slice(0,10)} />
              <p className="text-[10px] text-slate-400 mt-1">Al llegar esta fecha la cuenta se desactiva automáticamente.</p>
            </div>
          )}
        </SecPanel>
      </div>
    </ModalShell>
  )
}

// ── Cambiar rol de usuario ───────────────────────────────────────────────────
// Los cuatro roles disponibles con su descripción de acceso
const ROLE_OPTIONS = [
  { key: 'Admin',             Icon: ShieldCheck, desc: 'Acceso total. Gestiona usuarios, configuración y todos los módulos del sistema.' },
  { key: 'Oficina',           Icon: Building,    desc: 'Acceso a cotizaciones, clientes, pólizas y reportes. Sin gestión de usuarios.' },
  { key: 'Vendedor Sucursal', Icon: UserCheck,   desc: 'Crea cotizaciones y gestiona clientes asignados a su sucursal.' },
  { key: 'Vendedor Calle',    Icon: Truck,       desc: 'Cotizaciones básicas y consulta de clientes. Acceso limitado desde campo.' },
]

/** Selector de rol para un usuario. Muestra los 4 roles con descripción visual. */
function ChangeRoleModal({ user, onSave }) {
  const { closeModal, showToast } = useApp()
  const [newRole, setNewRole] = useState(user.tipo)
  const [password, setPassword] = useState('')
  const [passErr,  setPassErr]  = useState('')
  const [saving,   setSaving]   = useState(false)

  const handleSave = async (e) => {
    e.preventDefault()
    if (!password.trim()) { setPassErr('Ingresa tu contraseña para confirmar.'); return }
    setSaving(true); setPassErr('')
    try {
      await verifyPassword(password)
    } catch (err) {
      setPassErr(err.message || 'Contraseña incorrecta.')
      setSaving(false)
      return
    }
    try {
      await updateUsuario(user.id, { tipo: newRole, cargo: newRole, permisos: null })
      closeModal()
      showToast('Rol actualizado correctamente', 'success')
      if (onSave) onSave()
    } catch (err) {
      showToast(err.message || 'Error al cambiar rol', 'error')
      setSaving(false)
    }
  }

  return (
    <ModalShell title={`Cambiar Rol — ${user.nombre}`} footer={
      <>
        <button type="button" onClick={closeModal} disabled={saving} className="btn-secondary">Cancelar</button>
        <button type="submit" form="change-role-form" disabled={saving} className="btn-primary disabled:opacity-50">
          {saving
            ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            : <Check className="w-4 h-4" />}
          {saving ? 'Verificando…' : 'Cambiar Rol'}
        </button>
      </>
    }>
      <p className="text-xs text-slate-500 mb-4">Rol actual: <strong>{user.tipo}</strong>. Selecciona el nuevo rol para este usuario.</p>
      <form id="change-role-form" onSubmit={handleSave} className="space-y-2.5">
        {ROLE_OPTIONS.map(r => (
          <label key={r.key} className={`flex items-start gap-3 p-4 rounded-2xl border-2 cursor-pointer transition-all ${r.key === newRole ? 'border-jm-blue bg-blue-50/40' : 'border-slate-200 hover:border-slate-300 bg-white'}`}>
            <input
              type="radio"
              name="rol-select"
              value={r.key}
              checked={r.key === newRole}
              onChange={() => setNewRole(r.key)}
              className="mt-0.5 accent-blue-700 shrink-0"
            />
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <r.Icon className="w-4 h-4 text-jm-blue shrink-0" />
                <p className="font-bold text-slate-800 text-sm">{r.key}</p>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">{r.desc}</p>
            </div>
          </label>
        ))}
        <div className="pt-2">
          <label className="field-label">Confirma tu contraseña <span className="text-rose-500">*</span></label>
          <input
            type="password"
            className={`input-field ${passErr ? 'border-rose-400' : ''}`}
            placeholder="Tu contraseña"
            value={password}
            onChange={e => { setPassword(e.target.value); setPassErr('') }}
          />
          {passErr && <p className="text-xs text-rose-600 mt-1">{passErr}</p>}
        </div>
      </form>
    </ModalShell>
  )
}

// ── Permisos de usuario ───────────────────────────────────────────────────────
function UserPermsModal({ user, onSave }) {
  const { closeModal, showToast } = useApp()

  const hasCustomPerms = !!(user.permisos && (
    Array.isArray(user.permisos) ? user.permisos.length > 0 : Object.keys(user.permisos).length > 0
  ))

  const initialPermsObj = () => {
    const obj = getEffectivePermsObj(user)
    return Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, new Set(v)]))
  }
  const [permsObj, setPermsObj] = useState(initialPermsObj)
  // Acordeón: qué módulos están expandidos — independiente de qué permisos
  // tengan marcados. Arranca expandido en los módulos que ya tienen algo
  // asignado, para que al abrir el modal se vea de una vez qué tiene el usuario.
  const [expanded, setExpanded] = useState(() => new Set(PERMS_ORDER.filter(id => (permsObj[id]?.size || 0) > 0)))
  const [saving, setSaving]     = useState(false)
  const [password, setPassword] = useState('')
  const [passErr,  setPassErr]  = useState('')

  const toggleExpanded = (moduleId) => {
    setExpanded(prev => {
      const next = new Set(prev)
      next.has(moduleId) ? next.delete(moduleId) : next.add(moduleId)
      return next
    })
  }

  const toggleAction = (moduleId, actionId) => {
    if (LOCKED_PERMS.has(moduleId)) return
    setPermsObj(prev => {
      const cur = new Set(prev[moduleId] || [])
      cur.has(actionId) ? cur.delete(actionId) : cur.add(actionId)
      return { ...prev, [moduleId]: cur }
    })
  }

  const resetToDefaults = () => {
    const defaults = PERMISOS_POR_ROL[user.tipo] || { home: ['view'] }
    const obj = Object.fromEntries(Object.entries(defaults).map(([k, v]) => [k, new Set(v)]))
    if (!obj.home) obj.home = new Set(['view'])
    setPermsObj(obj)
    setExpanded(new Set(PERMS_ORDER.filter(id => (obj[id]?.size || 0) > 0)))
  }

  const handleSave = async () => {
    if (!password.trim()) { setPassErr('Ingresa tu contraseña para confirmar.'); return }
    setSaving(true); setPassErr('')
    try {
      await verifyPassword(password)
    } catch (err) {
      setPassErr(err.message || 'Contraseña incorrecta.')
      setSaving(false)
      return
    }
    try {
      // Un módulo solo se guarda (y por lo tanto aparece para el usuario) si
      // tiene al menos una casilla VISIBLE marcada (no cuenta un "view"
      // viejo guardado de cuando era interruptor maestro, para módulos
      // como reportes/config que ya no lo listan como casilla propia).
      // Si marcó algo pero no "Ver" puntualmente, se agrega solo: sin
      // "view" el módulo no se mostraría en el menú aunque sí tenga
      // permisos concretos asignados.
      const perms = Object.fromEntries(
        Object.entries(permsObj)
          .filter(([k, s]) => LOCKED_PERMS.has(k) || (PERMS_CATALOG[k]?.actions || []).some(a => s.has(a.id)))
          .map(([k, s]) => [k, [...new Set(['view', ...s])]])
      )
      if (!perms.home) perms.home = ['view']
      await updateUsuario(user.id, { permisos: perms })
      showToast('Permisos actualizados correctamente', 'success')
      closeModal()
      if (onSave) onSave()
    } catch (err) {
      showToast(err.message || 'Error al guardar permisos', 'error')
      setSaving(false)
    }
  }

  return (
    <ModalShell title={`Permisos — ${user.nombre}`} wide footer={
      <>
        <button type="button" onClick={closeModal} className="btn-secondary">Cancelar</button>
        <button
          type="button"
          onClick={resetToDefaults}
          className="btn-secondary flex items-center gap-1.5 text-amber-600 border-amber-200 hover:bg-amber-50"
          title="Restablecer permisos por defecto del rol"
        >
          <RotateCcw className="w-3.5 h-3.5" />Restablecer
        </button>
        <button type="button" onClick={handleSave} disabled={saving} className="btn-primary">
          <Check className="w-4 h-4" />
          {saving ? 'Guardando…' : 'Guardar Permisos'}
        </button>
      </>
    }>
      {/* Info del rol */}
      <div className="mb-4 flex items-center gap-3 p-3 rounded-xl bg-blue-50 border border-blue-200">
        <UserCog className="w-4 h-4 text-blue-600 shrink-0" />
        <div className="text-xs text-blue-700 leading-snug">
          <span>Rol: <strong>{user.tipo}</strong>. </span>
          {hasCustomPerms
            ? <span className="text-amber-700 font-semibold">Este usuario tiene permisos personalizados.</span>
            : <span>Usando permisos por defecto del rol.</span>
          }
        </div>
        <span className="ml-auto text-[10px] text-slate-400 shrink-0 flex items-center gap-1">
          <Lock className="w-3 h-3" /> Inicio siempre activo
        </span>
      </div>

      {/* Lista completa de módulos — un acordeón por apartado. No hay
          interruptor maestro: el apartado "está activo" (y por lo tanto
          visible para el usuario) simplemente cuando tiene al menos un
          permiso marcado adentro; expandir/colapsar es solo para mirar,
          no cambia nada por sí solo. */}
      <div className="space-y-2 max-h-[55vh] overflow-y-auto pr-1">
        {PERMS_ORDER.map(moduleId => {
          const mod      = PERMS_CATALOG[moduleId]
          if (!mod) return null
          const isLocked = LOCKED_PERMS.has(moduleId)
          const actions  = permsObj[moduleId] || new Set()
          // Cuenta solo los checkboxes que de verdad se muestran — algunos
          // usuarios tienen un "view" guardado de antes (cuando era el
          // interruptor maestro) para módulos que ya no lo listan como
          // casilla propia (reportes/config); ignorarlo evita que el
          // módulo se vea "activo" sin ninguna casilla marcada a la vista.
          const visibleCount = mod.actions.filter(a => actions.has(a.id)).length
          const isOn     = isLocked || visibleCount > 0
          const isOpen   = isLocked || expanded.has(moduleId)

          return (
            <div
              key={moduleId}
              className={`rounded-xl border transition-all ${isOn ? 'bg-blue-50 border-blue-200' : 'bg-white border-slate-200'}`}
            >
              {/* Encabezado del acordeón — solo expande/colapsa, no activa nada */}
              <button
                type="button"
                onClick={() => !isLocked && toggleExpanded(moduleId)}
                disabled={isLocked}
                className="w-full flex items-center gap-3 px-4 py-3 text-left"
              >
                <span className="text-base shrink-0">{mod.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold ${isOn ? 'text-blue-800' : 'text-slate-500'}`}>
                    {mod.label}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {isLocked
                      ? 'Siempre visible — no se puede quitar'
                      : isOn
                        ? `${visibleCount} permiso${visibleCount === 1 ? '' : 's'} activo${visibleCount === 1 ? '' : 's'}`
                        : 'Sin permisos — no aparecerá para el usuario'}
                  </p>
                </div>
                {isLocked
                  ? <Lock className="w-4 h-4 text-slate-400 shrink-0" />
                  : (
                    <ChevronRight className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
                  )
                }
              </button>

              {/* Acciones del módulo — visibles al expandir, sin importar si ya tiene algo marcado */}
              {isOpen && (
                <div className="px-4 pb-3 pt-2 border-t border-blue-100">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {mod.actions.map(({ id: aid, label: alabel }) => {
                      const checked = isLocked || actions.has(aid)
                      return (
                        <label key={aid} className={`flex items-center gap-2 select-none ${isLocked ? '' : 'cursor-pointer group'}`}>
                          <input
                            type="checkbox"
                            checked={checked}
                            disabled={isLocked}
                            onChange={() => toggleAction(moduleId, aid)}
                            className="w-3.5 h-3.5 rounded border-slate-300 accent-blue-600 cursor-pointer disabled:cursor-not-allowed"
                          />
                          <span className={`text-xs transition-colors ${checked ? 'text-slate-700 font-medium' : 'text-slate-400'} ${isLocked ? '' : 'group-hover:text-blue-700'}`}>
                            {alabel}
                          </span>
                        </label>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div className="mt-4 pt-4 border-t border-slate-100">
        <label className="field-label">Confirma tu contraseña para guardar <span className="text-rose-500">*</span></label>
        <input
          type="password"
          className={`input-field ${passErr ? 'border-rose-400' : ''}`}
          placeholder="Tu contraseña"
          value={password}
          onChange={e => { setPassword(e.target.value); setPassErr('') }}
          onKeyDown={e => e.key === 'Enter' && handleSave()}
        />
        {passErr && <p className="text-xs text-rose-600 mt-1">{passErr}</p>}
      </div>
    </ModalShell>
  )
}

// ── Ficha de vehículo ────────────────────────────────────────────────────────
/**
 * Muestra todos los datos de un vehículo en un diseño de dos columnas.
 * Se abre al hacer clic en el botón de ojo (👁) en la tabla de Vehículos.
 *
 * @param {Object} v  Datos completos del vehículo (todos los campos del backend)
 */
function VehiculoDetailModal({ v }) {
  const { closeModal } = useApp()
  if (!v) return null

  // Componente local de campo: etiqueta pequeña + valor en negrita
  const Field = ({ label, value }) => (
    <div className="min-w-0">
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">{label}</p>
      <p className="text-sm text-slate-800 font-medium truncate">{value || <span className="text-slate-300 font-normal">—</span>}</p>
    </div>
  )

  // Componente local de sección: título + grilla de campos
  const Section = ({ title, children }) => (
    <div>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pb-1.5 border-b border-slate-100 mb-3">{title}</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">{children}</div>
    </div>
  )

  const estadoColor = v.estado === 'Activo'
    ? 'bg-emerald-100 text-emerald-700'
    : 'bg-slate-100 text-slate-500'

  return (
    <ModalShell title={`Vehículo — ${v.placa}`} wide footer={
      <button onClick={closeModal} className="btn-secondary">Cerrar</button>
    }>
      {/* Cabecera con marca, modelo, año y estado */}
      <div className="flex items-center gap-3 mb-5 p-3 bg-slate-50 rounded-2xl">
        <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
          <Car className="w-5 h-5 text-blue-600" />
        </div>
        <div className="min-w-0">
          <p className="font-bold text-slate-800">{v.marca} {v.modelo} <span className="font-normal text-slate-500">({v.anio})</span></p>
          <p className="text-xs text-slate-500">{v.propietario} · {v.cedula}</p>
        </div>
        <span className={`ml-auto text-xs font-bold px-2.5 py-1 rounded-full shrink-0 ${estadoColor}`}>{v.estado}</span>
      </div>

      <div className="space-y-5">
        <Section title="Datos del Vehículo">
          <Field label="Placa"         value={v.placa} />
          <Field label="Color"         value={v.color} />
          <Field label="Tipo"          value={v.tipo} />
          <Field label="Clase"         value={v.clase} />
          <Field label="Uso"           value={v.uso} />
          <Field label="Puestos"       value={v.puestos} />
          <Field label="Peso (kg)"     value={v.peso} />
          <Field label="Aparcamiento"  value={v.aparcamiento} />
        </Section>

        <Section title="Documentos">
          <Field label="Serial Carrocería"  value={v.serial_carroceria} />
          <Field label="Serial Motor"       value={v.serial_motor} />
          <Field label="Cert. Tránsito"     value={v.certificado_transito} />
          <Field label="Cert. Origen"       value={v.certificado_origen} />
          <Field label="F. Adquisición"     value={v.fecha_adquisicion} />
          <div className="sm:col-span-2">
            <Field label="Título" value={v.titulo} />
          </div>
        </Section>
      </div>
    </ModalShell>
  )
}

// ── Ficha de producto ────────────────────────────────────────────────────────
/**
 * Muestra los detalles de un producto/cobertura: nombre, descripción,
 * prima base y cobertura máxima en tarjetas visuales con colores.
 *
 * @param {Object} p  Datos del producto (id, nombre, descripcion, prima, cobertura, moneda)
 */
function ProductoDetailModal({ p }) {
  const { closeModal } = useApp()
  if (!p) return null

  const fmtId     = id => 'PRO-' + String(id).padStart(4, '0')
  const monedaCls = p.moneda === 'USD' ? 'bg-emerald-100 text-emerald-700'
                  : p.moneda === 'EUR' ? 'bg-amber-100 text-amber-700'
                  :                      'bg-blue-100 text-blue-700'

  const tipoMeta  = TIPOS_PRODUCTO.find(x => x.val === p.tipo)
  const calcMeta  = TIPOS_CALCULO.find(x => x.val === p.tipo_calculo)

  const CATEGORIA_LABEL = { vehicular: 'Vehicular', bienes: 'Bienes', personas: 'Personas' }
  const CATEGORIA_CLS   = { vehicular: 'bg-sky-100 text-sky-700', bienes: 'bg-amber-100 text-amber-700', personas: 'bg-violet-100 text-violet-700' }

  const SectionHeader = ({ label }) => (
    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2.5">{label}</p>
  )

  return (
    <ModalShell title={`Producto — ${fmtId(p.id)}`} wide footer={
      <button onClick={closeModal} className="btn-secondary">Cerrar</button>
    }>
      {/* Cabecera */}
      <div className="flex items-start gap-3 mb-5 p-4 bg-slate-50 rounded-2xl border border-slate-100">
        <div className="w-11 h-11 rounded-2xl bg-indigo-100 flex items-center justify-center shrink-0">
          <Shield className="w-5 h-5 text-indigo-600" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-black text-slate-800 text-base leading-tight">{p.nombre}</p>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <span className="text-xs text-slate-400 font-mono bg-white border border-slate-200 px-2 py-0.5 rounded-lg">{fmtId(p.id)}</span>
            {p.codigo && <span className="text-xs font-mono font-bold text-slate-500">{p.codigo}</span>}
            {tipoMeta
              ? <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${tipoMeta.bg} ${tipoMeta.text}`}>{tipoMeta.label}</span>
              : p.tipo && <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600">{p.tipo}</span>
            }
          </div>
        </div>
        <span className={`text-xs font-bold px-2.5 py-1 rounded-full shrink-0 ${monedaCls}`}>{p.moneda}</span>
      </div>

      {/* Descripción */}
      {p.descripcion && (
        <div className="mb-4">
          <SectionHeader label="Descripción" />
          <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 rounded-xl p-3 border border-slate-100">
            {p.descripcion}
          </p>
        </div>
      )}

      {/* Configuración */}
      <div className="mb-4">
        <SectionHeader label="Configuración" />
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {calcMeta && (
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <p className="text-[10px] text-slate-400 font-medium mb-0.5">Tipo de cálculo</p>
              <p className="text-sm font-bold text-slate-700">{calcMeta.label}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">{calcMeta.desc}</p>
            </div>
          )}
          {p.categoria && (
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <p className="text-[10px] text-slate-400 font-medium mb-0.5">Categoría</p>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${CATEGORIA_CLS[p.categoria] ?? 'bg-slate-100 text-slate-600'}`}>
                {CATEGORIA_LABEL[p.categoria] ?? p.categoria}
              </span>
            </div>
          )}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <p className="text-[10px] text-slate-400 font-medium mb-0.5">Tipo de bien</p>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${p.tipo_bien && p.tipo_bien !== 'ninguno' ? 'bg-sky-100 text-sky-700' : 'bg-slate-100 text-slate-500'} capitalize`}>
              {p.tipo_bien && p.tipo_bien !== 'ninguno' ? p.tipo_bien : 'Ninguno'}
            </span>
          </div>
          {p.derecho_poliza > 0 && (
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <p className="text-[10px] text-slate-400 font-medium mb-0.5">Derecho de póliza</p>
              <p className="text-sm font-black text-slate-700">{fmtMonto(p.derecho_poliza, p.moneda)}</p>
            </div>
          )}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <p className="text-[10px] text-slate-400 font-medium mb-0.5">Estado</p>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${p.activo !== false ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
              {p.activo !== false ? 'Activo' : 'Inactivo'}
            </span>
          </div>
        </div>
      </div>

      {/* Prima base y Cobertura */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl">
          <div className="flex items-center gap-1.5 mb-1.5">
            <DollarSign className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Prima Base Referencial</p>
          </div>
          <p className="text-2xl font-black text-emerald-800">{fmtMonto(p.prima, p.moneda)}</p>
          <p className="text-xs text-emerald-600 mt-1">{p.moneda} · Anual</p>
        </div>
        <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl">
          <div className="flex items-center gap-1.5 mb-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
            <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">Cobertura / Suma Asegurada</p>
          </div>
          <p className="text-2xl font-black text-indigo-800">{fmtMonto(p.cobertura, p.moneda)}</p>
          <p className="text-xs text-indigo-600 mt-1">{p.moneda} · Máxima</p>
        </div>
      </div>

      {/* Documentos requeridos */}
      {Array.isArray(p.documentos_requeridos) && p.documentos_requeridos.length > 0 && (
        <div>
          <SectionHeader label={`Documentos requeridos para la solicitud (${p.documentos_requeridos.length})`} />
          <div className="flex flex-wrap gap-1.5">
            {p.documentos_requeridos.map(d => (
              <span key={d.nombre} className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-medium border ${
                d.obligatorio
                  ? 'bg-blue-50 border-blue-100 text-blue-700'
                  : 'bg-slate-50 border-slate-100 text-slate-500'
              }`}>
                {d.nombre}
                {d.obligatorio && <span className="text-[9px] font-bold text-blue-400 ml-0.5">OBL</span>}
              </span>
            ))}
          </div>
        </div>
      )}
    </ModalShell>
  )
}

// ── Tabla de tasas de un producto ────────────────────────────────────────────
/**
 * Muestra la tabla de tasas importada desde CSV.
 * Las columnas son dinámicas (provienen de la cabecera del CSV).
 *
 * @param {Object} p  Producto con campo `tasas` (array de objetos)
 */
function ProductoTasasModal({ p }) {
  const { closeModal } = useApp()
  if (!p || !p.tasas?.length) return null

  const headers = Object.keys(p.tasas[0])

  return (
    <ModalShell title={`Tasas — ${p.nombre}`} wide footer={
      <button onClick={closeModal} className="btn-secondary">Cerrar</button>
    }>
      <p className="text-xs text-slate-400 mb-3">
        {p.tasas.length} fila{p.tasas.length !== 1 ? 's' : ''} · {headers.length} columnas
      </p>
      {/* Móvil/tablet: cada fila como tarjeta */}
      <div className="lg:hidden space-y-2 max-h-[65vh] overflow-y-auto">
        {p.tasas.map((row, i) => (
          <div key={i} className="rounded-xl border border-slate-100 p-3">
            <dl className="grid grid-cols-2 gap-x-3 gap-y-1.5">
              {headers.map(h => (
                <div key={h} className="min-w-0">
                  <dt className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 truncate">{h}</dt>
                  <dd className="text-sm text-slate-700 break-words">{row[h] ?? '—'}</dd>
                </div>
              ))}
            </dl>
          </div>
        ))}
      </div>
      {/* Escritorio: tabla */}
      <div className="hidden lg:block overflow-x-auto max-h-[65vh] overflow-y-auto rounded-xl border border-slate-100">
        <table className="w-full text-xs border-collapse">
          <thead className="sticky top-0 z-10">
            <tr style={{ background: '#001463' }}>
              {headers.map(h => (
                <th key={h} className="px-3 py-2 text-left font-bold text-white whitespace-nowrap border-r border-white/10 last:border-0">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {p.tasas.map((row, i) => (
              <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                {headers.map(h => (
                  <td key={h} className="px-3 py-2 text-slate-700 border-b border-slate-100 whitespace-nowrap">
                    {row[h] ?? '—'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </ModalShell>
  )
}

// ── Documentos de un producto ────────────────────────────────────────────────
/**
 * Lista todos los documentos del producto con opciones de ver y eliminar.
 * Los administradores también pueden subir nuevos documentos con nombre personalizado.
 *
 * @param {Object}   p        Producto con campo `documentos` (array de {nombre, url, path})
 * @param {Function} onSaved  Callback para refrescar la tabla de productos
 */
function ProductoDocumentosModal({ p, onSaved }) {
  const { closeModal, showToast, canAct } = useApp()
  const [docs, setDocs]             = useState(p?.documentos ?? [])
  const [nombre, setNombre]         = useState('')
  const [file, setFile]             = useState(null)
  const [uploading, setUploading]   = useState(false)
  const [deletingPath, setDeletingPath] = useState(null)
  const [replacingPath, setReplacingPath] = useState(null)
  const fileRef = useRef(null)
  const replaceRef = useRef(null)
  const replaceTargetRef = useRef(null)
  const canManageDocs = canAct('productos', 'manage_docs')

  if (!p) return null

  const handleUpload = async () => {
    if (!file || !nombre.trim()) {
      showToast('Ingresa un nombre y selecciona un archivo PDF', 'error')
      return
    }
    setUploading(true)
    try {
      const result = await uploadDocumentoProducto(p.id, file, nombre.trim())
      setDocs(result.documentos)
      setNombre('')
      setFile(null)
      if (fileRef.current) fileRef.current.value = ''
      showToast('Documento subido' + (result.notificados ? ` · ${result.notificados} cliente(s) notificados` : ''), 'success')
      onSaved?.()
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (path) => {
    setDeletingPath(path)
    try {
      await deleteDocumentoProducto(p.id, path)
      setDocs(prev => prev.filter(d => d.path !== path))
      showToast('Documento eliminado', 'error')
      onSaved?.()
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setDeletingPath(null)
    }
  }

  // Reemplazar = subir el nuevo PDF (mismo nombre; cuenta como documento nuevo y
  // se reenvía a los clientes) y luego eliminar el anterior.
  const startReplace = (doc) => { replaceTargetRef.current = doc; replaceRef.current?.click() }

  const handleReplaceFile = async (e) => {
    const f = e.target.files?.[0]
    e.target.value = ''
    const target = replaceTargetRef.current
    if (!f || !target) return
    setReplacingPath(target.path)
    try {
      const result = await uploadDocumentoProducto(p.id, f, target.nombre)
      await deleteDocumentoProducto(p.id, target.path)
      setDocs((result.documentos || []).filter(d => d.path !== target.path))
      showToast('Documento reemplazado' + (result.notificados ? ` · ${result.notificados} cliente(s) notificados` : ''), 'success')
      onSaved?.()
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setReplacingPath(null)
      replaceTargetRef.current = null
    }
  }

  return (
    <ModalShell title={`Documentos — ${p.nombre}`} wide footer={
      <button onClick={closeModal} className="btn-secondary">Cerrar</button>
    }>
      <div className="space-y-4">
        {docs.length === 0 ? (
          <div className="py-8 text-center">
            <FileText className="w-10 h-10 text-slate-200 mx-auto mb-3" />
            <p className="text-sm text-slate-400">Este producto no tiene documentos cargados.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {docs.map((d, i) => (
              <div key={d.path || i} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div className="w-9 h-9 rounded-xl bg-violet-100 flex items-center justify-center shrink-0">
                  <FileText className="w-4 h-4 text-violet-600" />
                </div>
                <p className="flex-1 min-w-0 text-sm font-semibold text-slate-700 truncate">{d.nombre}</p>
                <div className="flex gap-1.5 shrink-0">
                  <a
                    href={d.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition inline-flex items-center justify-center"
                    title="Ver documento"
                  >
                    <Eye className="w-4 h-4" />
                  </a>
                  {canManageDocs && (
                    <>
                      <button
                        onClick={() => startReplace(d)}
                        disabled={replacingPath === d.path}
                        className="p-2 rounded-lg bg-amber-50 text-amber-600 hover:bg-amber-100 transition inline-flex items-center justify-center disabled:opacity-50"
                        title="Reemplazar documento"
                      >
                        {replacingPath === d.path
                          ? <div className="w-4 h-4 border-2 border-amber-300 border-t-amber-600 rounded-full animate-spin" />
                          : <RefreshCw className="w-4 h-4" />
                        }
                      </button>
                      <button
                        onClick={() => handleDelete(d.path)}
                        disabled={deletingPath === d.path}
                        className="p-2 rounded-lg bg-rose-50 text-rose-500 hover:bg-rose-100 transition inline-flex items-center justify-center disabled:opacity-50"
                        title="Eliminar documento"
                      >
                        {deletingPath === d.path
                          ? <div className="w-4 h-4 border-2 border-rose-300 border-t-rose-600 rounded-full animate-spin" />
                          : <Trash2 className="w-4 h-4" />
                        }
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {canManageDocs && (
          <div className="pt-3 border-t border-slate-100">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Agregar Documento</p>
            <p className="text-[11px] text-slate-400 mb-3">Al subir o reemplazar, se envía por correo (adjunto) a los clientes con póliza activa de este producto que aún no lo tengan.</p>
            <div className="space-y-3">
              <div>
                <label className="field-label">Nombre del documento <span className="text-rose-500">*</span></label>
                <input
                  className="input-field"
                  placeholder="Ej. IPID, FIPC, Nota Informativa…"
                  value={nombre}
                  onChange={e => setNombre(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="flex-1 flex items-center gap-2 p-2.5 rounded-xl border-2 border-dashed border-slate-200 text-slate-500 hover:border-violet-300 hover:text-violet-600 hover:bg-violet-50 transition text-sm"
                >
                  <Upload className="w-4 h-4 shrink-0" />
                  <span className="truncate">{file ? file.name : 'Seleccionar PDF…'}</span>
                </button>
                <button
                  onClick={handleUpload}
                  disabled={uploading || !file || !nombre.trim()}
                  className="btn-primary disabled:opacity-50"
                >
                  {uploading
                    ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    : <Check className="w-4 h-4" />
                  }
                  Subir
                </button>
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={e => setFile(e.target.files?.[0] ?? null)}
              />
            </div>
          </div>
        )}

        {/* Input oculto para "Reemplazar" un documento existente */}
        <input
          ref={replaceRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={handleReplaceFile}
        />
      </div>
    </ModalShell>
  )
}

// ── Activar / desactivar cliente ─────────────────────────────────────────────
/**
 * Pide confirmación antes de cambiar el estado activo/bloqueado de un cliente.
 * El botón de acción cambia de color y texto según si se va a activar o desactivar.
 *
 * @param {string}   nom       Nombre del cliente
 * @param {boolean}  activo    Estado actual: true = activo, false = bloqueado
 * @param {Function} onConfirm Función async que llama al backend (PATCH toggle)
 */
function BlockClienteModal({ nom, activo, onConfirm }) {
  const { closeModal, showToast } = useApp()
  const [motivo,   setMotivo]  = useState('')
  const [password, setPassword] = useState('')
  const [err,      setErr]     = useState('')
  const [passErr,  setPassErr] = useState('')
  const [saving,   setSaving]  = useState(false)
  const isActive = activo !== false   // undefined y true se tratan igual: está activo

  const handleConfirm = async () => {
    if (isActive && !motivo.trim()) { setErr('Debe ingresar el motivo del bloqueo.'); return }
    if (!password.trim()) { setPassErr('Ingresa tu contraseña para confirmar.'); return }
    if (saving) return
    setErr(''); setPassErr('')
    setSaving(true)
    try {
      await verifyPassword(password)
    } catch (e) {
      setPassErr(e.message || 'Contraseña incorrecta.')
      setSaving(false)
      return
    }
    if (onConfirm) {
      try {
        await onConfirm(isActive ? motivo.trim() : null)
        closeModal()
        showToast(isActive ? 'Cliente bloqueado' : 'Cliente activado', isActive ? 'error' : 'success')
      } catch (e) {
        showToast(e.message || 'Error al cambiar estado', 'error')
        setSaving(false)
      }
    } else {
      closeModal()
    }
  }

  return (
    <ModalShell title={isActive ? 'Bloquear cliente' : 'Activar cliente'} footer={
      <>
        <button onClick={closeModal} disabled={saving} className="btn-secondary">Cancelar</button>
        <button onClick={handleConfirm} disabled={saving} className={`${isActive ? 'btn-danger' : 'btn-success'} disabled:opacity-50`}>
          {saving
            ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            : isActive ? <Lock className="w-4 h-4" /> : <LockOpen className="w-4 h-4" />
          }
          {saving ? 'Procesando…' : isActive ? 'Bloquear' : 'Activar'}
        </button>
      </>
    }>
      <div className="flex items-start gap-4 mb-4">
        <div className={`w-12 h-12 rounded-full ${isActive ? 'bg-orange-100' : 'bg-emerald-100'} flex items-center justify-center shrink-0`}>
          {isActive ? <Lock className="w-6 h-6 text-orange-600" /> : <LockOpen className="w-6 h-6 text-emerald-600" />}
        </div>
        <div className="min-w-0">
          <p className="font-bold text-slate-800 mb-1">{isActive ? 'Bloquear' : 'Activar'} a <em>{nom}</em></p>
          <p className="text-sm text-slate-500 leading-relaxed">
            {isActive
              ? 'El cliente quedará como Bloqueado. Sus pólizas y datos se conservarán intactos.'
              : 'El cliente recuperará el estado activo y podrá operar normalmente.'}
          </p>
        </div>
      </div>
      {isActive && (
        <div>
          <label className="field-label">Motivo del bloqueo <span className="text-rose-500">*</span></label>
          <textarea
            rows={3}
            maxLength={255}
            className={`input-field resize-none ${err ? 'border-rose-400 focus:ring-rose-300' : ''}`}
            placeholder="Describe el motivo del bloqueo…"
            value={motivo}
            onChange={e => { setMotivo(e.target.value); setErr('') }}
          />
          {err && <p className="text-xs text-rose-600 mt-1">{err}</p>}
        </div>
      )}
      {/* Confirmación con contraseña — siempre requerida */}
      <div className="mt-2">
        <label className="field-label">Tu contraseña <span className="text-rose-500">*</span></label>
        <input
          type="password"
          className={`input-field ${passErr ? 'border-rose-400' : ''}`}
          placeholder="Ingresa tu contraseña para confirmar"
          value={password}
          onChange={e => { setPassword(e.target.value); setPassErr('') }}
          onKeyDown={e => e.key === 'Enter' && handleConfirm()}
        />
        {passErr && <p className="text-xs text-rose-600 mt-1">{passErr}</p>}
      </div>
    </ModalShell>
  )
}

// ── Ficha completa de cliente ────────────────────────────────────────────────
/**
 * Muestra todos los datos de un cliente organizados en secciones:
 * Datos Personales, Contacto, Dirección, Actividad Económica y Póliza Actual.
 * Se abre al hacer clic en el botón de ojo (👁) en la tabla de Clientes.
 *
 * @param {Object} c  Datos completos del cliente (todos los campos del backend)
 */
function ClienteDetailModal({ c }) {
  const { closeModal } = useApp()

  if (!c) return null

  const fmtId = id => 'CLI-' + String(id).padStart(4, '0')

  const Field = ({ label, value }) => (
    <div className="min-w-0">
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">{label}</p>
      <p className="text-sm text-slate-800 font-medium truncate">{value || <span className="text-slate-300 font-normal">—</span>}</p>
    </div>
  )

  const Section = ({ title, children }) => (
    <div>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pb-1.5 border-b border-slate-100 mb-3">{title}</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">{children}</div>
    </div>
  )

  const estColor = c.est === 'Activo'
    ? 'bg-emerald-100 text-emerald-700'
    : c.est === 'Bloqueado'
      ? 'bg-rose-100 text-rose-700'
      : 'bg-slate-100 text-slate-500'

  return (
    <ModalShell title={`Cliente — ${fmtId(c.id)}`} wide footer={
      <button onClick={closeModal} className="btn-secondary">Cerrar</button>
    }>
      {/* Cabecera: nombre, cédula y estado */}
      <div className="flex items-center gap-3 mb-5 p-3 bg-slate-50 rounded-2xl">
        <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
          <UserCheck className="w-5 h-5 text-blue-600" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-bold text-slate-800 truncate">{c.nombre || c.nom}</p>
          <p className="text-xs text-slate-500 font-mono">{c.ci}</p>
        </div>
        <span className={`text-xs font-bold px-2.5 py-1 rounded-full shrink-0 ${estColor}`}>{c.est}</span>
      </div>

      <div className="space-y-5 max-h-[55vh] overflow-y-auto pr-1">
        <Section title="Cuenta">
          <Field label="Vendedor asignado" value={c.vendedor_nombre} />
          <Field label="Fecha de registro" value={c.fecha_registro} />
          {c.motivo_bloqueo && (
            <div className="sm:col-span-2">
              <Field label="Motivo de bloqueo" value={c.motivo_bloqueo} />
            </div>
          )}
        </Section>

        <Section title="Póliza">
          <Field label="N° de póliza" value={c.pol} />
          <Field label="Prima"        value={c.prima} />
          <div className="sm:col-span-2">
            <Field label="Vigencia"   value={c.vig} />
          </div>
        </Section>

        <Section title="Datos Personales">
          <Field label="Sexo"          value={c.sexo} />
          <Field label="Condición"     value={c.condicion} />
          <Field label="Nacimiento"    value={c.nacimiento} />
          <Field label="Nacionalidad"  value={c.nacionalidad} />
        </Section>

        <Section title="Contacto">
          <Field label="Teléfono"      value={c.telefono} />
          <Field label="Celular"       value={c.celular} />
          <div className="sm:col-span-2">
            <Field label="Correo"      value={c.correo || c.email} />
          </div>
        </Section>

        <Section title="Dirección">
          <Field label="Estado"        value={c.estado} />
          <Field label="Ciudad"        value={c.ciudad} />
          <Field label="Código Postal" value={c.codigo_postal} />
          <div className="sm:col-span-2">
            <Field label="Dirección"   value={c.direccion} />
          </div>
        </Section>

        <Section title="Actividad Económica">
          <Field label="Profesión"     value={c.profesion} />
          <Field label="Actividad"     value={c.actividad} />
        </Section>
      </div>
    </ModalShell>
  )
}

// ── Bloquear / desbloquear usuario ───────────────────────────────────────────
/**
 * Confirma el bloqueo o desbloqueo de un usuario del sistema.
 * Un usuario bloqueado no puede iniciar sesión pero sus datos se conservan.
 * Solo aplica a usuarios (login), no a clientes. Para clientes usar BlockClienteModal.
 *
 * @param {string} nom  Nombre del usuario
 * @param {string} est  Estado actual: 'Bloqueado' o cualquier otro valor
 */
function BlockUserModal({ nom, est, onConfirm }) {
  const { closeModal, showToast } = useApp()
  const isBlocked = est === 'Bloqueado'
  const [motivo,   setMotivo]   = useState('')
  const [password, setPassword] = useState('')
  const [err,      setErr]      = useState('')
  const [passErr,  setPassErr]  = useState('')
  const [saving,   setSaving]   = useState(false)

  const handleConfirm = async () => {
    if (!isBlocked && !motivo.trim()) { setErr('Debe ingresar un motivo para bloquear al usuario.'); return }
    if (!password.trim()) { setPassErr('Ingresa tu contraseña para confirmar.'); return }
    if (saving) return
    setErr(''); setPassErr('')
    setSaving(true)
    try {
      await verifyPassword(password)
    } catch (e) {
      setPassErr(e.message || 'Contraseña incorrecta.')
      setSaving(false)
      return
    }
    if (onConfirm) {
      try {
        await onConfirm(isBlocked ? null : motivo.trim())
        closeModal()
        showToast(isBlocked ? 'Usuario desbloqueado' : 'Usuario bloqueado', isBlocked ? 'success' : 'error')
      } catch (e) {
        showToast(e.message || 'Error al cambiar estado', 'error')
        setSaving(false)
      }
    } else {
      closeModal()
    }
  }

  return (
    <ModalShell title={isBlocked ? 'Desbloquear usuario' : 'Bloquear usuario'} footer={
      <>
        <button onClick={closeModal} disabled={saving} className="btn-secondary">Cancelar</button>
        <button onClick={handleConfirm} disabled={saving} className={`${isBlocked ? 'btn-success' : 'btn-danger'} disabled:opacity-50`}>
          {saving
            ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            : isBlocked ? <LockOpen className="w-4 h-4" /> : <Lock className="w-4 h-4" />
          }
          {saving ? 'Procesando…' : isBlocked ? 'Desbloquear' : 'Bloquear'}
        </button>
      </>
    }>
      <div className="flex items-start gap-4 mb-4">
        <div className={`w-12 h-12 rounded-full ${isBlocked ? 'bg-emerald-100' : 'bg-orange-100'} flex items-center justify-center shrink-0`}>
          {isBlocked ? <LockOpen className="w-6 h-6 text-emerald-600" /> : <Lock className="w-6 h-6 text-orange-600" />}
        </div>
        <div className="min-w-0">
          <p className="font-bold text-slate-800 mb-1">{isBlocked ? 'Desbloquear' : 'Bloquear'} a <em>{nom}</em></p>
          <p className="text-sm text-slate-500 leading-relaxed">
            {isBlocked
              ? 'El usuario recuperará el acceso al sistema con su rol y permisos actuales.'
              : 'El usuario no podrá iniciar sesión. Sus datos, cotizaciones y pólizas se conservarán intactos.'}
          </p>
        </div>
      </div>
      {!isBlocked && (
        <div>
          <label className="field-label">Motivo del bloqueo <span className="text-rose-500">*</span></label>
          <textarea
            rows={3}
            maxLength={255}
            className={`input-field resize-none ${err ? 'border-rose-400 focus:ring-rose-300' : ''}`}
            placeholder="Describe el motivo del bloqueo…"
            value={motivo}
            onChange={e => { setMotivo(e.target.value); setErr('') }}
          />
          {err && <p className="text-xs text-rose-600 mt-1">{err}</p>}
        </div>
      )}
      {/* Confirmación con contraseña — siempre requerida */}
      <div className="mt-2">
        <label className="field-label">Tu contraseña <span className="text-rose-500">*</span></label>
        <input
          type="password"
          className={`input-field ${passErr ? 'border-rose-400' : ''}`}
          placeholder="Ingresa tu contraseña para confirmar"
          value={password}
          onChange={e => { setPassword(e.target.value); setPassErr('') }}
          onKeyDown={e => e.key === 'Enter' && handleConfirm()}
        />
        {passErr && <p className="text-xs text-rose-600 mt-1">{passErr}</p>}
      </div>
    </ModalShell>
  )
}

// ── Documentos de un cliente (lista de pólizas + generar PDF) ────────────────
/**
 * Lista todas las pólizas del cliente como documentos.
 * Cada fila tiene un botón "Ver PDF" que genera la carátula oficial
 * y la abre en el PdfViewer sin cerrar el modal.
 */
function ClienteDocsModal({ c }) {
  const { closeModal, showPdfViewer, currentUser } = useApp()
  const [polizas, setPolizas]   = useState([])
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    if (!c) return
    fetchPolizasCliente(c.id)
      .then(setPolizas)
      .catch(() => setPolizas([]))
      .finally(() => setLoading(false))
  }, [c?.id])

  if (!c) return null

  const logoUrl = window.location.origin + '/logo-sinfondo.png'

  const generatePdf = (pol) => {
    const clienteNombre = c.nombre || c.nom
    const tel  = c.celular || c.telefono || c.tel || '—'
    const mail = c.correo  || c.email    || '—'
    const dir  = c.direccion || '—'

    // La póliza se queda en su moneda nativa de principio a fin — sin tasa
    // BCV ni equivalente en bolívares (no se mezcla con Bs.).

    // Banda de póliza (encabezado secundario prominente)
    const polBanner = `
      <div style="background:#001463;color:white;padding:14px 22px;border-radius:10px;margin-bottom:26px;display:flex;justify-content:space-between;align-items:center">
        <div>
          <p style="font-size:9px;font-weight:700;letter-spacing:2px;opacity:0.65;text-transform:uppercase;margin-bottom:4px">N° de Póliza / Contrato</p>
          <p style="font-size:20px;font-weight:900;font-family:monospace;letter-spacing:2px">${pol.nro_contrato}</p>
        </div>
        <div style="text-align:right">
          <p style="font-size:9px;font-weight:700;letter-spacing:2px;opacity:0.65;text-transform:uppercase;margin-bottom:4px">Estado</p>
          <p style="font-size:15px;font-weight:900;${pol.status === 'ACTIVA' ? 'color:#6ee7b7' : pol.status === 'RENOVADA' ? 'color:#a5b4fc' : pol.status === 'VENCIDA' ? 'color:#fcd34d' : 'color:#fca5a5'}">${pol.status}</p>
        </div>
      </div>`

    // Tabla de coberturas contratadas
    const cobTable = `
      <table style="width:100%;border-collapse:collapse;margin-top:10px;font-size:12px">
        <thead>
          <tr style="background:#001463;color:white">
            <th style="padding:9px 12px;text-align:left;font-size:9px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase">Cobertura / Producto</th>
            <th style="padding:9px 12px;text-align:right;font-size:9px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase">Suma Asegurada</th>
            <th style="padding:9px 12px;text-align:right;font-size:9px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase">Prima (${pol.moneda_producto || 'USD'})</th>
          </tr>
        </thead>
        <tbody>
          <tr style="background:#f8fafc;border-bottom:2px solid #e2e8f0">
            <td style="padding:11px 12px;font-weight:600;color:#1e293b">${pol.producto}</td>
            <td style="padding:11px 12px;text-align:right;font-weight:700;color:#1e293b;font-family:monospace">${fmtMonto(pol.cobertura_dolares, pol.moneda_producto)}</td>
            <td style="padding:11px 12px;text-align:right;font-weight:700;color:#059669;font-family:monospace">${fmtMonto(pol.total, pol.moneda_producto)}</td>
          </tr>
        </tbody>
        <tfoot>
          <tr style="background:#f1f5f9">
            <td style="padding:9px 12px;font-size:10px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:1px">Total</td>
            <td style="padding:9px 12px;text-align:right;font-weight:900;color:#001463;font-family:monospace">${fmtMonto(pol.cobertura_dolares, pol.moneda_producto)}</td>
            <td style="padding:9px 12px;text-align:right;font-size:15px;font-weight:900;color:#059669;font-family:monospace">${fmtMonto(pol.total, pol.moneda_producto)}</td>
          </tr>
        </tfoot>
      </table>`

    // Vigencia visual
    const vigencia = `
      <div style="display:grid;grid-template-columns:1fr auto 1fr;gap:16px;align-items:center;background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:16px 20px;margin-top:10px">
        <div>
          <p style="font-size:9px;font-weight:700;color:#64748b;letter-spacing:1px;text-transform:uppercase;margin-bottom:5px">Inicio de Vigencia</p>
          <p style="font-size:16px;font-weight:900;color:#1e293b">${pol.fecha_emision}</p>
        </div>
        <div style="text-align:center">
          <p style="font-size:9px;font-weight:600;color:#94a3b8;letter-spacing:1px;margin-bottom:5px">DURACIÓN</p>
          <div style="border-top:2px dashed #cbd5e1;width:80px;margin:0 auto 5px"></div>
          <p style="font-size:11px;font-weight:700;color:#64748b">12 meses</p>
          <div style="border-top:2px dashed #cbd5e1;width:80px;margin:5px auto 0"></div>
        </div>
        <div style="text-align:right">
          <p style="font-size:9px;font-weight:700;color:#64748b;letter-spacing:1px;text-transform:uppercase;margin-bottom:5px">Fin de Vigencia</p>
          <p style="font-size:16px;font-weight:900;color:#1e293b">${pol.fecha_vencimiento}</p>
        </div>
      </div>`

    const bienAttr = pol.bien_atributos || {}
    const tieneVehiculo = pol.bien_tipo === 'vehiculo' && bienAttr.placa

    const html = pdfPage(
      pdfHdr(tieneVehiculo ? 'PÓLIZA DE SEGURO VEHICULAR' : 'PÓLIZA DE SEGURO', 'Documento oficial de cobertura', '', new Date().toLocaleDateString('es-VE'), logoUrl) +
      polBanner +

      pdfSec('I. DATOS DEL TOMADOR Y ASEGURADO') +
      pdfRow('Nombre completo',      clienteNombre) +
      pdfRow('Cédula / RIF',         c.ci,  true) +
      pdfRow('Teléfono',             tel) +
      pdfRow('Correo electrónico',   mail) +
      pdfRow('Dirección',            dir) +

      (tieneVehiculo
        ? pdfSec('II. DATOS DEL VEHÍCULO ASEGURADO') +
          pdfRow('Placa',                bienAttr.placa, true) +
          pdfRow('Marca / Modelo',       `${bienAttr.marca ?? ''} ${bienAttr.modelo ?? ''}`.trim() || '—') +
          pdfRow('Año de fabricación',   String(bienAttr.anio ?? '—')) +
          pdfRow('Tipo / Clase',         bienAttr.uso   || '—') +
          pdfRow('Color',                bienAttr.color || '—') +
          (bienAttr.serial_carroceria ? pdfRow('Serial de Carrocería', bienAttr.serial_carroceria, true) : '') +
          (bienAttr.serial_motor      ? pdfRow('Serial de Motor',      bienAttr.serial_motor,      true) : '')
        : '') +

      pdfSec(tieneVehiculo ? 'III. COBERTURAS CONTRATADAS' : 'II. COBERTURAS CONTRATADAS') +
      cobTable +

      pdfSec(tieneVehiculo ? 'IV. CONDICIONES PARTICULARES' : 'III. CONDICIONES PARTICULARES') +
      pdfRow('Tipo de Póliza',       pol.tipo  || '—') +
      pdfRow('Forma de Pago',        pol.pago  || '—') +
      pdfRow('Moneda de Pago',       pol.moneda || 'USD') +
      pdfRow('Sede / Oficina',       pol.sede  || '—') +
      pdfTotal('Prima Anual Total', fmtMonto(pol.total, pol.moneda_producto)) +

      pdfSec(tieneVehiculo ? 'V. PERÍODO DE VIGENCIA' : 'IV. PERÍODO DE VIGENCIA') +
      vigencia +

      pdfFooterSimple()
    )

    closeModal()
    showPdfViewer(`Póliza — ${pol.nro_contrato}`, html)
  }

  const STATUS_STYLE = {
    'ACTIVA':    'bg-emerald-100 text-emerald-700',
    'RENOVADA':  'bg-indigo-100 text-indigo-700',
    'VENCIDA':   'bg-amber-100 text-amber-700',
    'ANULADA':   'bg-rose-100 text-rose-700',
    'RECHAZADA': 'bg-slate-200 text-slate-500',
  }

  const emitidas   = polizas.filter(p => p.status !== 'RECHAZADA')
  const rechazadas = polizas.filter(p => p.status === 'RECHAZADA')

  return (
    <ModalShell title={`Documentos — ${c.nombre || c.nom}`} wide footer={
      <button onClick={closeModal} className="btn-secondary">Cerrar</button>
    }>
      {loading ? (
        <div className="flex items-center gap-2 py-8 text-slate-400 text-sm">
          <div className="w-4 h-4 border-2 border-slate-300 border-t-blue-500 rounded-full animate-spin shrink-0" />
          Cargando documentos…
        </div>
      ) : polizas.length === 0 ? (
        <div className="py-10 text-center">
          <Shield className="w-10 h-10 text-slate-200 mx-auto mb-3" />
          <p className="text-sm text-slate-400">Este cliente no tiene pólizas registradas.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* ── Pólizas emitidas ── */}
          {emitidas.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-slate-400">
                {emitidas.length} póliza{emitidas.length !== 1 ? 's' : ''} — <strong>Ver póliza</strong> abre el documento oficial.
              </p>
              {emitidas.map(pol => (
                <div key={pol.id} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center shrink-0 mt-0.5">
                    <FileText className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <span className="text-xs font-bold text-blue-700 font-mono">{pol.nro_contrato}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_STYLE[pol.status] ?? 'bg-slate-100 text-slate-500'}`}>
                        {pol.status}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-slate-700 truncate">{pol.producto}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
                      {pol.bien_ref && pol.bien_ref !== '—' && <><Car className="w-3 h-3 shrink-0" />{pol.bien_ref} · </>}
                      {pol.fecha_emision} → {pol.fecha_vencimiento}
                    </p>
                  </div>
                  <div className="text-right shrink-0 flex flex-col items-end gap-1">
                    <p className="text-sm font-bold text-slate-800">{fmtMonto(pol.total, pol.moneda_producto)}</p>
                    <button
                      onClick={() => generatePdf(pol)}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      <FileText className="w-3.5 h-3.5 shrink-0" />
                      Ver póliza
                    </button>
                    {pol.producto_documentos?.map((d, i) => (
                      <a
                        key={i}
                        href={d.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-violet-600 hover:text-violet-800 hover:underline"
                      >
                        <FileText className="w-3.5 h-3.5 shrink-0" />
                        {d.nombre}
                      </a>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── Solicitudes rechazadas ── */}
          {rechazadas.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
                Cotizaciones rechazadas ({rechazadas.length})
              </p>
              {rechazadas.map((pol, i) => (
                <div key={`rej-${pol.solicitud_id ?? i}`} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200 opacity-70">
                  <div className="w-9 h-9 rounded-xl bg-slate-200 flex items-center justify-center shrink-0 mt-0.5">
                    <FileText className="w-4 h-4 text-slate-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <span className="text-xs font-bold text-slate-500 font-mono">{pol.nro_contrato}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-500">
                        RECHAZADA
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-slate-500 truncate">{pol.producto}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
                      {pol.bien_ref && pol.bien_ref !== '—' && <><Car className="w-3 h-3 shrink-0" />{pol.bien_ref} · </>}
                      {pol.fecha_emision}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-slate-500">{fmtMonto(pol.total, pol.moneda_producto)}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Sin póliza emitida</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </ModalShell>
  )
}

// ── Facturas de un cliente ───────────────────────────────────────────────────
/**
 * Lista todas las facturas del cliente, ordenadas de más reciente a más antigua.
 * Al hacer clic en una factura se genera el PDF de la misma.
 */
function ClienteFacturasModal({ c }) {
  const { closeModal, showPdfViewer, currentUser } = useApp()
  const [facturas, setFacturas] = useState([])
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const logoUrl = window.location.origin + '/logo-sinfondo.png'

  useEffect(() => {
    if (!c) return
    fetchFacturasCliente(c.id)
      .then(setFacturas)
      .catch(() => setFacturas([]))
      .finally(() => setLoading(false))
  }, [c?.id])

  if (!c) return null

  const clienteNombre = c.nombre || c.nom

  const fmtNum = (n) => Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  const generateFacturaPdf = (f) => {
    const fmtBs = (n) => Number(n).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    const serie = f.numero.split('-')[0]
    const tel   = c.telefono || ''
    const cel   = c.celular  || ''
    const dir   = c.direccion || ''

    // f.valor_bs es el monto realmente pagado (con impuesto incluido si aplica).
    // Se descompone en base + IVA usando el % real del producto de la póliza,
    // en vez del "Impuesto sobre el 0% (IVA): 0 Bs." fijo que mostraba antes
    // sin importar el producto.
    const ivaPct  = f.iva_aplica ? (parseFloat(f.iva_porcentaje) || 0) : 0
    const baseBs  = ivaPct > 0 ? f.valor_bs / (1 + ivaPct / 100) : f.valor_bs
    const ivaBs   = f.valor_bs - baseBs
    const ref   = (f.referencia && f.referencia !== '—') ? f.referencia : ''

    const copy = `
      <div style="border:1px solid #555;padding:14px 18px;font-family:Arial,Helvetica,sans-serif;font-size:11px;color:#000;background:#fff;page-break-inside:avoid">

        <div style="display:flex;align-items:center;margin-bottom:10px;gap:12px;border-bottom:2px solid #001463;padding-bottom:10px">
          <img src="${logoUrl}" alt="Logo" style="height:48px;object-fit:contain" onerror="this.style.display='none'" />
          <div style="flex:1;text-align:center">
            <p style="font-size:13px;font-weight:900;color:#001463;margin:0;line-height:1.2">LA VENEZOLANA DE SEGUROS Y VIDA C.A.</p>
            <p style="font-size:9px;color:#555;margin:2px 0 0">Sistema de Emisión y Registro de Pólizas</p>
          </div>
        </div>

        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px">
          <div>
            <strong>ASESOR:</strong> ${f.cajero}
            &nbsp;&nbsp;&nbsp;
            <strong>SERIE:</strong> ${serie}
          </div>
          <table style="border-collapse:collapse;font-size:11px">
            <tr>
              <td style="border:1px solid #444;padding:3px 10px;font-weight:bold;background:#f0f0f0;white-space:nowrap">RECIBO Nº:</td>
              <td style="border:1px solid #444;padding:3px 14px;font-weight:bold">${f.numero}</td>
            </tr>
            <tr>
              <td style="border:1px solid #444;padding:3px 10px;font-weight:bold;background:#f0f0f0">FECHA:</td>
              <td style="border:1px solid #444;padding:3px 14px">${f.fecha_factura}</td>
            </tr>
          </table>
        </div>

        <table style="width:100%;border-collapse:collapse;font-size:11px;margin-bottom:8px">
          <tr>
            <td style="border:1px solid #aaa;padding:4px 8px;font-weight:bold;width:130px;white-space:nowrap">RAZON SOCIAL:</td>
            <td style="border:1px solid #aaa;padding:4px 8px" colspan="3">${clienteNombre}</td>
          </tr>
          <tr>
            <td style="border:1px solid #aaa;padding:4px 8px;font-weight:bold">Cedula/RIF:</td>
            <td style="border:1px solid #aaa;padding:4px 8px" colspan="3">${c.ci}</td>
          </tr>
          <tr>
            <td style="border:1px solid #aaa;padding:4px 8px;font-weight:bold">DIRECCIÓN:</td>
            <td style="border:1px solid #aaa;padding:4px 8px" colspan="3">${dir}</td>
          </tr>
          <tr>
            <td style="border:1px solid #aaa;padding:4px 8px;font-weight:bold">TELÉFONO:</td>
            <td style="border:1px solid #aaa;padding:4px 8px">${tel}</td>
            <td style="border:1px solid #aaa;padding:4px 8px"><strong>CELULAR:</strong> ${cel}</td>
            <td style="border:1px solid #aaa;padding:4px 8px;white-space:nowrap"><strong>CONDICION DE PAGO:</strong> ${f.fecha_factura}</td>
          </tr>
        </table>

        <table style="width:100%;border-collapse:collapse;font-size:11px;margin-bottom:8px">
          <thead>
            <tr style="background:#222;color:#fff">
              <th style="padding:5px 8px;border:1px solid #333;text-align:center;width:70px">CANTIDAD</th>
              <th style="padding:5px 8px;border:1px solid #333;text-align:left">DESCRIPCIÓN</th>
              <th style="padding:5px 8px;border:1px solid #333;text-align:right;width:200px">PAGO UNITARIO</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="padding:14px 8px;border:1px solid #ccc;text-align:center;vertical-align:top">1</td>
              <td style="padding:14px 8px;border:1px solid #ccc;vertical-align:top">POLIZA NRO: ${f.poliza_nro}</td>
              <td style="padding:14px 8px;border:1px solid #ccc;text-align:right;vertical-align:top">Subtotal Bs.: ${fmtBs(baseBs)}</td>
            </tr>
          </tbody>
        </table>

        <table style="width:100%;border-collapse:collapse;font-size:11px">
          <tr>
            <td style="padding:4px 8px;font-weight:bold;border-top:1px solid #555">ESTE RECIBO VA SIN TACHADURAS NI ENMENDADURAS</td>
            <td style="padding:4px 8px;text-align:right;border-top:1px solid #555;white-space:nowrap">Impuesto sobre el ${ivaPct}% (IVA): ${fmtBs(ivaBs)} Bs.</td>
          </tr>
          <tr>
            <td style="padding:4px 8px">
              <strong>FORMA DE PAGO:</strong> ${f.forma_pago}
              &nbsp;&nbsp;&nbsp;
              <strong>MONEDA:</strong> ${f.moneda || 'USD'}
              &nbsp;&nbsp;&nbsp;
              <strong>REFERENCIA:</strong> ${ref}
            </td>
            <td style="padding:4px 8px;text-align:right;font-weight:bold;white-space:nowrap">Total Bs.: ${fmtBs(f.valor_bs)}</td>
          </tr>
          ${f.tasa_emision > 1 ? `<tr>
            <td style="padding:2px 8px;font-size:10px;color:#555" colspan="2">
              <strong>Tasas BCV al día de pago:</strong>
              &nbsp; Bs./USD: ${fmtTasa(f.tasa_emision)}
              ${f.tasa_emision_eur > 1 ? `&nbsp;&nbsp; Bs./EUR: ${fmtTasa(f.tasa_emision_eur)}` : ''}
              &nbsp;&nbsp; Monto en ${f.moneda_producto || 'USD'}: ${fmtMonto(f.valor, f.moneda_producto)}
            </td>
          </tr>` : ''}
          <tr>
            <td style="padding:6px 8px;border-top:1px solid #aaa"><strong>RECIBI CONFORME:</strong></td>
            <td style="padding:6px 8px;border-top:1px solid #aaa;text-align:right"><strong>FECHA:</strong> ${f.fecha_factura}</td>
          </tr>
        </table>

        <p style="font-size:9px;color:#444;margin:8px 0 0;line-height:1.5">
          APROBADO POR LA SUPERINTENDENCIA DE LA ACTIVIDAD ASEGURADORA MEDIANTE LA PROVIDENCIA 000512 DE FECHA 14 DE FEBRERO
          2014, PUBLICADA EN GACETA OFICIAL DE LA REPÚBLICA BOLIVARIANA DE VENEZUELA N° 40.368, DE FECHA 10 DE MARZO DE 2014
        </p>
      </div>`

    const fullHtml = `<!DOCTYPE html><html><head><meta charset="UTF-8">
      <style>
        body { margin: 16px; background: #fff; font-family: Arial, Helvetica, sans-serif; color: #000; }
        * { box-sizing: border-box; }
        @media print { body { margin: 0; } }
      </style>
    </head><body>${copy}</body></html>`

    closeModal()
    showPdfViewer(`Recibo — ${f.numero}`, fullHtml)
  }

  const STATUS_POLIZA = {
    'ACTIVA':   'bg-emerald-100 text-emerald-700',
    'RENOVADA': 'bg-indigo-100 text-indigo-700',
    'VENCIDA':  'bg-amber-100 text-amber-700',
    'ANULADA':  'bg-rose-100 text-rose-700',
  }

  return (
    <ModalShell title={`Recibos — ${clienteNombre}`} wide footer={
      <button onClick={closeModal} className="btn-secondary">Cerrar</button>
    }>
      {loading ? (
        <div className="flex items-center gap-2 py-8 text-slate-400 text-sm">
          <div className="w-4 h-4 border-2 border-slate-300 border-t-blue-500 rounded-full animate-spin shrink-0" />
          Cargando recibos…
        </div>
      ) : facturas.length === 0 ? (
        <div className="py-10 text-center">
          <Receipt className="w-10 h-10 text-slate-200 mx-auto mb-3" />
          <p className="text-sm text-slate-400">Este cliente no tiene recibos registrados.</p>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center gap-2 mb-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por número de recibo…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <p className="text-xs text-slate-400 whitespace-nowrap shrink-0">
              {facturas.filter(f => !search.trim() || f.numero.toLowerCase().includes(search.trim().toLowerCase())).length} / {facturas.length}
            </p>
          </div>
          {facturas.filter(f => !search.trim() || f.numero.toLowerCase().includes(search.trim().toLowerCase())).map(f => (
            <div key={f.id} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
              <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center shrink-0 mt-0.5">
                <Receipt className="w-4 h-4 text-amber-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-0.5">
                  <span className="text-xs font-bold text-slate-800 font-mono">{f.numero}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_POLIZA[f.poliza_status] ?? 'bg-slate-100 text-slate-500'}`}>
                    {f.poliza_status}
                  </span>
                </div>
                <p className="text-xs font-semibold text-slate-700 truncate">{f.poliza_producto}</p>
                <div className="flex items-center gap-3 text-[11px] text-slate-500 flex-wrap mt-0.5">
                  {f.poliza_bien && f.poliza_bien !== '—' && (
                    <span className="flex items-center gap-1">
                      <Car className="w-3 h-3 shrink-0" />{f.poliza_bien}
                    </span>
                  )}
                  <span>{f.fecha_factura} · {f.sede}</span>
                  <span>{f.forma_pago}</span>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-bold text-slate-800">{fmtMonto(f.valor, f.moneda_producto)}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Bs. {fmtNum(f.valor_bs)}</p>
                <button
                  onClick={() => generateFacturaPdf(f)}
                  className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600 hover:text-amber-800 hover:underline"
                >
                  <Receipt className="w-3.5 h-3.5 shrink-0" />
                  Ver PDF
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </ModalShell>
  )
}

// Espejo de WorkflowService::POLIZA_TRANSITIONS (Backend/app/Services/WorkflowService.php) —
// mantener sincronizado si cambian las transiciones válidas en el backend.
const POLIZA_TRANSITIONS = {
  ACTIVA:     ['VENCIDA', 'ANULADA', 'SUSPENDIDA', 'RENOVADA'],
  SUSPENDIDA: ['ACTIVA', 'ANULADA'],
  VENCIDA:    ['RENOVADA'],
  ANULADA:    [],
  RENOVADA:   [],
}

// ── Editar póliza de un cliente ──────────────────────────────────────────────
/**
 * Muestra la lista de pólizas del cliente. Al seleccionar una, aparece un
 * formulario para editar: status, fecha de vencimiento, prima, forma de pago
 * y el vendedor asignado (reasignación de cartera).
 */
function AjustarPolizaModal({ c, onSave, polizaId, onCancel }) {
  const { closeModal, showToast } = useApp()
  const handleCancel = () => { if (onCancel) onCancel(); else closeModal() }
  const [polizas, setPolizas]   = useState([])
  const [vendedores, setVendedores] = useState([])
  const [loading, setLoading]   = useState(true)
  const [selected, setSelected] = useState(null)
  const [form, setForm]         = useState({})
  const [saving, setSaving]     = useState(false)
  const [searchPol, setSearchPol] = useState('')
  const [password, setPassword] = useState('')
  const [passErr,  setPassErr]  = useState('')

  useEffect(() => {
    if (!c) return
    fetchPolizasCliente(c.id)
      .then(data => {
        setPolizas(data)
        // Auto-seleccionar si se pasa una póliza específica, o si hay solo una
        const presel = polizaId ? data.find(p => p.id === polizaId) : null
        if (presel) selectPoliza(presel)
        else if (data.length === 1) selectPoliza(data[0])
      })
      .catch(() => setPolizas([]))
      .finally(() => setLoading(false))
    fetchVendedoresDisponibles().then(setVendedores).catch(() => setVendedores([]))
  }, [c?.id])

  const selectPoliza = (pol) => {
    setSelected(pol)
    setForm({
      status:            pol.status,
      fecha_vencimiento: pol.fecha_vencimiento_iso,
      fecha_emision:     pol.fecha_emision_iso,
      pago:              pol.pago,
      total:             pol.total,
      total_bs:          pol.total_bs,
      cobertura_dolares: pol.cobertura_dolares,
      cobertura_bs:      pol.cobertura_bs,
      frecuencia_pago:   pol.frecuencia_pago || '',
      tipo:              pol.tipo || '',
      sede_poliza:       pol.sede && pol.sede !== '—' ? pol.sede : '',
      nro_venezolana:    pol.nro_venezolana || '',
      papeleria:         pol.papeleria || '',
      vendedor_id:       pol.vendedor_id ?? '',
      asegurado_nombre:    pol.asegurado_nombre || '',
      asegurado_ci:        pol.asegurado_ci || '',
      asegurado_direccion: pol.asegurado_direccion || '',
      asegurado_telefono:  pol.asegurado_telefono || '',
      tomador_nombre:    pol.tomador_nombre || '',
      tomador_ci:        pol.tomador_ci || '',
      tomador_direccion: pol.tomador_direccion || '',
      tomador_telefono:  pol.tomador_telefono || '',
      bien_marca:        pol.bien_marca || '',
      bien_modelo:       pol.bien_modelo || '',
      bien_anio:         pol.bien_anio || '',
      bien_placa:        pol.bien_placa || '',
      bien_color:        pol.bien_color || '',
      bien_version:      pol.bien_version || '',
      bien_puestos:      pol.bien_puestos || '',
      bien_uso:              pol.bien_uso || '',
      bien_serial_carroceria: pol.bien_serial_carroceria || '',
      bien_serial_motor:      pol.bien_serial_motor || '',
    })
  }

  const handleSave = async () => {
    if (!password.trim()) { setPassErr('Ingresa tu contraseña para confirmar.'); return }
    setSaving(true); setPassErr('')
    try {
      await verifyPassword(password)
    } catch (err) {
      setPassErr(err.message || 'Contraseña incorrecta.')
      setSaving(false)
      return
    }
    try {
      await updatePoliza(selected.id, form)
      showToast('Póliza actualizada correctamente', 'success')
      onSave?.()
      closeModal()
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  if (!c) return null

  const STATUS_STYLE = {
    'ACTIVA':    'bg-emerald-100 text-emerald-700',
    'RENOVADA':  'bg-indigo-100 text-indigo-700',
    'VENCIDA':   'bg-amber-100 text-amber-700',
    'ANULADA':   'bg-rose-100 text-rose-700',
    'RECHAZADA': 'bg-slate-200 text-slate-500',
  }

  return (
    <ModalShell title={`Editar Póliza — ${c.nombre || c.nom}`} wide footer={
      <>
        {selected && !polizaId && polizas.length > 1 && (
          <button onClick={() => setSelected(null)} className="btn-secondary">
            ← Volver
          </button>
        )}
        <button onClick={handleCancel} className="btn-secondary ml-auto">
          {onCancel ? '← Volver' : 'Cancelar'}
        </button>
        {selected && (
          <button onClick={handleSave} disabled={saving} className="btn-primary">
            <Check className="w-4 h-4" />
            {saving ? 'Guardando…' : 'Guardar'}
          </button>
        )}
      </>
    }>
      {loading ? (
        <div className="flex items-center gap-2 py-8 text-slate-400 text-sm">
          <div className="w-4 h-4 border-2 border-slate-300 border-t-blue-500 rounded-full animate-spin shrink-0" />
          Cargando pólizas…
        </div>
      ) : polizas.length === 0 ? (
        <div className="py-10 text-center">
          <Shield className="w-10 h-10 text-slate-200 mx-auto mb-3" />
          <p className="text-sm text-slate-400">Este cliente no tiene pólizas para ajustar.</p>
        </div>
      ) : !selected ? (
        /* ── Paso 1: Seleccionar póliza ── */
        <div className="space-y-2">
          <div className="flex items-center gap-2 mb-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por N° de póliza…"
                value={searchPol}
                onChange={e => setSearchPol(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          {polizas.filter(p => p.status !== 'RECHAZADA' && (!searchPol.trim() || p.nro_contrato?.toLowerCase().includes(searchPol.trim().toLowerCase()))).map(pol => (
            <button
              key={pol.id}
              onClick={() => selectPoliza(pol)}
              className="w-full flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100 hover:border-blue-300 hover:bg-blue-50 transition-colors text-left"
            >
              <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0 mt-0.5">
                <SlidersHorizontal className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-0.5">
                  <span className="text-xs font-bold text-blue-700 font-mono">{pol.nro_contrato}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_STYLE[pol.status] ?? 'bg-slate-100 text-slate-500'}`}>
                    {pol.status}
                  </span>
                </div>
                <p className="text-xs font-semibold text-slate-700 truncate">{pol.producto}</p>
                <p className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
                  {pol.bien_ref && pol.bien_ref !== '—' && <><Car className="w-3 h-3 shrink-0" />{pol.bien_ref} · </>}
                  {pol.fecha_emision} → {pol.fecha_vencimiento}
                </p>
              </div>
              <p className="text-sm font-bold text-slate-700 shrink-0">{fmtMonto(pol.total, pol.moneda_producto)}</p>
            </button>
          ))}
        </div>
      ) : (
        /* ── Paso 2: Formulario de ajuste ── */
        <div className="space-y-4">
          {/* Resumen de la póliza seleccionada */}
          <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-100">
            <p className="text-xs font-bold text-indigo-700 font-mono">{selected.nro_contrato}</p>
            <p className="text-xs text-indigo-500 mt-0.5 flex items-center gap-1">
              {selected.bien_ref && selected.bien_ref !== '—' && <><Car className="w-3 h-3 shrink-0" />{selected.bien_ref} · </>}
              {selected.producto}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Estatus — solo se ofrecen transiciones válidas desde el estado actual */}
            <div className="sm:col-span-2 input-group">
              <label className="input-label">Estatus</label>
              <select
                className="select-field"
                value={form.status ?? ''}
                onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
              >
                <option value={selected.status}>{selected.status} (actual)</option>
                {(POLIZA_TRANSITIONS[selected.status] ?? []).map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              {(POLIZA_TRANSITIONS[selected.status] ?? []).length === 0 && (
                <p className="text-[11px] text-slate-400 mt-1">Este estado es terminal, no admite cambios de estatus.</p>
              )}
            </div>

            {/* Fecha vencimiento */}
            <div className="input-group">
              <label className="input-label">Vencimiento</label>
              <input
                type="date"
                className="input-field"
                value={form.fecha_vencimiento ?? ''}
                min={form.fecha_emision || undefined}
                onChange={e => setForm(f => ({ ...f, fecha_vencimiento: e.target.value }))}
              />
            </div>

            {/* Prima */}
            <div className="input-group">
              <label className="input-label">Prima ({selected.moneda_producto || 'USD'})</label>
              <input
                type="number"
                step="0.01"
                min="0"
                className="input-field"
                value={form.total ?? ''}
                onChange={e => {
                  const nuevoTotal = e.target.value
                  // Al cambiar la prima se recalcula total_bs manteniendo la tasa
                  // implícita de la póliza (total_bs/total). Antes total_bs quedaba
                  // con el valor viejo y la póliza quedaba desincronizada.
                  setForm(f => {
                    const t = parseFloat(nuevoTotal)
                    const oT = parseFloat(selected.total)
                    const oBs = parseFloat(selected.total_bs)
                    const total_bs = (t > 0 && oT > 0 && oBs > 0)
                      ? Math.round(t * (oBs / oT) * 100) / 100
                      : f.total_bs
                    return { ...f, total: nuevoTotal, total_bs }
                  })
                }}
              />
            </div>

            {/* Forma de pago */}
            <div className="sm:col-span-2 input-group">
              <label className="input-label">Forma de Pago</label>
              <input
                type="text"
                className="input-field"
                value={form.pago ?? ''}
                placeholder="Ej. Transferencia, Zelle, Efectivo USD…"
                onChange={e => setForm(f => ({ ...f, pago: e.target.value }))}
              />
            </div>

            {/* N° de póliza asignado por la aseguradora */}
            <div className="input-group">
              <label className="input-label">N° Póliza (La Venezolana)</label>
              <input
                type="text"
                className="input-field"
                value={form.nro_venezolana ?? ''}
                placeholder="Asignado por la aseguradora"
                onChange={e => setForm(f => ({ ...f, nro_venezolana: e.target.value }))}
              />
            </div>

            {/* Papelería / certificado físico usado */}
            <div className="input-group">
              <label className="input-label">Papelería</label>
              <input
                type="text"
                className="input-field"
                value={form.papeleria ?? ''}
                placeholder="N° de certificado físico"
                onChange={e => setForm(f => ({ ...f, papeleria: e.target.value }))}
              />
            </div>

            {/* Vendedor asignado — reasignación de cartera, no se notifica al cliente */}
            <div className="sm:col-span-2 input-group">
              <label className="input-label">Vendedor asignado</label>
              <select
                className="select-field"
                value={form.vendedor_id ?? ''}
                onChange={e => setForm(f => ({ ...f, vendedor_id: e.target.value ? Number(e.target.value) : '' }))}
              >
                <option value="">Sin asignar</option>
                {vendedores.map(v => (
                  <option key={v.id} value={v.id}>{v.nombre} ({v.tipo})</option>
                ))}
              </select>
            </div>

            {/* ── Clasificación / fechas ── */}
            <div className="input-group">
              <label className="input-label">Fecha de emisión</label>
              <input type="date" className="input-field" value={form.fecha_emision ?? ''} onChange={e => setForm(f => ({ ...f, fecha_emision: e.target.value }))} />
            </div>
            <div className="input-group">
              <label className="input-label">Tipo de póliza</label>
              <input type="text" className="input-field" value={form.tipo ?? ''} placeholder="Individual / Colectiva" onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))} />
            </div>
            <div className="input-group">
              <label className="input-label">Oficina / Sede</label>
              <input type="text" className="input-field" value={form.sede_poliza ?? ''} onChange={e => setForm(f => ({ ...f, sede_poliza: e.target.value }))} />
            </div>
            <div className="input-group">
              <label className="input-label">Frecuencia de pago</label>
              <input type="text" className="input-field" value={form.frecuencia_pago ?? ''} placeholder="Anual / Mensual…" onChange={e => setForm(f => ({ ...f, frecuencia_pago: e.target.value }))} />
            </div>
            <div className="input-group">
              <label className="input-label">Cobertura (USD)</label>
              <input type="number" step="0.01" min="0" className="input-field" value={form.cobertura_dolares ?? ''} onChange={e => setForm(f => ({ ...f, cobertura_dolares: e.target.value }))} />
            </div>
            <div className="input-group">
              <label className="input-label">Cobertura (Bs.)</label>
              <input type="number" step="0.01" min="0" className="input-field" value={form.cobertura_bs ?? ''} onChange={e => setForm(f => ({ ...f, cobertura_bs: e.target.value }))} />
            </div>

            {/* ── Asegurado ── */}
            <div className="sm:col-span-2 mt-1 pt-3 border-t border-slate-100"><p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Datos del asegurado</p></div>
            <div className="input-group">
              <label className="input-label">Asegurado — Nombre</label>
              <input type="text" className="input-field" value={form.asegurado_nombre ?? ''} onChange={e => setForm(f => ({ ...f, asegurado_nombre: e.target.value }))} />
            </div>
            <div className="input-group">
              <label className="input-label">Asegurado — Cédula</label>
              <input type="text" className="input-field" value={form.asegurado_ci ?? ''} onChange={e => setForm(f => ({ ...f, asegurado_ci: e.target.value }))} />
            </div>
            <div className="input-group">
              <label className="input-label">Asegurado — Teléfono</label>
              <input type="text" className="input-field" value={form.asegurado_telefono ?? ''} onChange={e => setForm(f => ({ ...f, asegurado_telefono: e.target.value }))} />
            </div>
            <div className="input-group">
              <label className="input-label">Asegurado — Dirección</label>
              <input type="text" className="input-field" value={form.asegurado_direccion ?? ''} onChange={e => setForm(f => ({ ...f, asegurado_direccion: e.target.value }))} />
            </div>

            {/* ── Tomador ── */}
            <div className="sm:col-span-2 mt-1 pt-3 border-t border-slate-100"><p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Datos del tomador</p></div>
            <div className="input-group">
              <label className="input-label">Tomador — Nombre</label>
              <input type="text" className="input-field" value={form.tomador_nombre ?? ''} onChange={e => setForm(f => ({ ...f, tomador_nombre: e.target.value }))} />
            </div>
            <div className="input-group">
              <label className="input-label">Tomador — Cédula</label>
              <input type="text" className="input-field" value={form.tomador_ci ?? ''} onChange={e => setForm(f => ({ ...f, tomador_ci: e.target.value }))} />
            </div>
            <div className="input-group">
              <label className="input-label">Tomador — Teléfono</label>
              <input type="text" className="input-field" value={form.tomador_telefono ?? ''} onChange={e => setForm(f => ({ ...f, tomador_telefono: e.target.value }))} />
            </div>
            <div className="input-group">
              <label className="input-label">Tomador — Dirección</label>
              <input type="text" className="input-field" value={form.tomador_direccion ?? ''} onChange={e => setForm(f => ({ ...f, tomador_direccion: e.target.value }))} />
            </div>

            {/* ── Bien / vehículo (solo si aplica) ── */}
            {selected.bien_ref && selected.bien_ref !== '—' && (
              <>
                <div className="sm:col-span-2 mt-1 pt-3 border-t border-slate-100"><p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Datos del bien</p></div>
                <div className="input-group">
                  <label className="input-label">Marca</label>
                  <input type="text" className="input-field" value={form.bien_marca ?? ''} onChange={e => setForm(f => ({ ...f, bien_marca: e.target.value }))} />
                </div>
                <div className="input-group">
                  <label className="input-label">Modelo</label>
                  <input type="text" className="input-field" value={form.bien_modelo ?? ''} onChange={e => setForm(f => ({ ...f, bien_modelo: e.target.value }))} />
                </div>
                <div className="input-group">
                  <label className="input-label">Año</label>
                  <input type="text" className="input-field" value={form.bien_anio ?? ''} onChange={e => setForm(f => ({ ...f, bien_anio: e.target.value }))} />
                </div>
                <div className="input-group">
                  <label className="input-label">Placa</label>
                  <input type="text" className="input-field" value={form.bien_placa ?? ''} onChange={e => setForm(f => ({ ...f, bien_placa: e.target.value.toUpperCase() }))} />
                </div>
                <div className="input-group">
                  <label className="input-label">Color</label>
                  <input type="text" className="input-field" value={form.bien_color ?? ''} onChange={e => setForm(f => ({ ...f, bien_color: e.target.value }))} />
                </div>
                <div className="input-group">
                  <label className="input-label">Versión</label>
                  <input type="text" className="input-field" value={form.bien_version ?? ''} onChange={e => setForm(f => ({ ...f, bien_version: e.target.value }))} />
                </div>
                <div className="input-group">
                  <label className="input-label">Puestos</label>
                  <input type="text" className="input-field" value={form.bien_puestos ?? ''} onChange={e => setForm(f => ({ ...f, bien_puestos: e.target.value }))} />
                </div>
                <div className="input-group">
                  <label className="input-label">Uso</label>
                  <input type="text" className="input-field" value={form.bien_uso ?? ''} onChange={e => setForm(f => ({ ...f, bien_uso: e.target.value }))} placeholder="Particular" />
                </div>
                <div className="input-group">
                  <label className="input-label">Serial de carrocería</label>
                  <input type="text" className="input-field font-mono uppercase" value={form.bien_serial_carroceria ?? ''} onChange={e => setForm(f => ({ ...f, bien_serial_carroceria: e.target.value.toUpperCase() }))} />
                </div>
                <div className="input-group">
                  <label className="input-label">Serial de motor</label>
                  <input type="text" className="input-field font-mono uppercase" value={form.bien_serial_motor ?? ''} onChange={e => setForm(f => ({ ...f, bien_serial_motor: e.target.value.toUpperCase() }))} />
                </div>
              </>
            )}

          </div>

          {/* Comparación de prima: original vs nuevo */}
          {(() => {
            const orig  = Number(selected.total)
            const nuevo = Number(form.total)
            if (!orig || !nuevo || isNaN(nuevo) || nuevo === orig) return null
            const pct    = ((nuevo - orig) / orig) * 100
            const isPos  = pct > 0
            return (
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Comparación de Prima</p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-slate-400 mb-0.5">Original</p>
                    <p className="text-sm font-bold text-slate-500">{fmtMonto(orig, selected.moneda_producto)}</p>
                  </div>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${isPos ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-600'}`}>
                    {isPos ? '+' : ''}{pct.toFixed(1)}%
                  </span>
                  <div className="text-right">
                    <p className="text-[10px] text-slate-400 mb-0.5">Nuevo</p>
                    <p className="text-sm font-bold text-slate-800">{fmtMonto(nuevo, selected.moneda_producto)}</p>
                  </div>
                </div>
              </div>
            )
          })()}

          <div className="pt-2 border-t border-slate-100">
            <label className="field-label">Confirma tu contraseña para guardar <span className="text-rose-500">*</span></label>
            <input
              type="password"
              className={`input-field ${passErr ? 'border-rose-400' : ''}`}
              placeholder="Tu contraseña"
              value={password}
              onChange={e => { setPassword(e.target.value); setPassErr('') }}
              onKeyDown={e => e.key === 'Enter' && handleSave()}
            />
            {passErr && <p className="text-xs text-rose-600 mt-1">{passErr}</p>}
          </div>
        </div>
      )}
    </ModalShell>
  )
}

// ── Beneficiarios de una póliza ───────────────────────────────────────────────
/**
 * Gestiona los beneficiarios de una póliza (relevante para pólizas de vida,
 * muerte accidental, etc.). El porcentaje total entre todos los beneficiarios
 * no puede exceder 100% — el backend valida esto, aquí solo se muestra el
 * acumulado para guiar al usuario.
 */
function PolizaBeneficiariosModal({ poliza, onClose }) {
  const { closeModal, showToast } = useApp()
  const [items,   setItems]   = useState([])
  const [config,  setConfig]  = useState({ aplica_beneficiarios: true, min_beneficiarios: null, max_beneficiarios: null })
  const [loading, setLoading] = useState(true)
  const [saving,  setSaving]  = useState(false)
  const [editId,  setEditId]  = useState(null)
  const [form,    setForm]    = useState({ nombre: '', cedula: '', parentesco: '', porcentaje: '' })
  const handleClose = () => { if (onClose) onClose(); else closeModal() }

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetchBeneficiarios(poliza.id)
      setItems(res.items || [])
      setConfig(res.config || { aplica_beneficiarios: true, min_beneficiarios: null, max_beneficiarios: null })
    }
    catch (e) { showToast(e.message, 'error') }
    finally { setLoading(false) }
  }
  useEffect(() => { load() }, [poliza.id])

  const limiteAlcanzado = config.max_beneficiarios != null && items.length >= config.max_beneficiarios
  const puedeAgregar    = config.aplica_beneficiarios && !limiteAlcanzado

  const totalAsignado = items.reduce((s, b) => s + Number(b.porcentaje || 0), 0)
  const disponible    = Math.max(0, 100 - totalAsignado + (editId ? Number(items.find(b => b.id === editId)?.porcentaje || 0) : 0))

  const resetForm = () => { setEditId(null); setForm({ nombre: '', cedula: '', parentesco: '', porcentaje: '' }) }

  const startEdit = (b) => {
    setEditId(b.id)
    setForm({ nombre: b.nombre || '', cedula: b.cedula || '', parentesco: b.parentesco || '', porcentaje: String(b.porcentaje ?? '') })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.nombre.trim() || !form.porcentaje) {
      showToast('Nombre y porcentaje son obligatorios.', 'warning')
      return
    }
    setSaving(true)
    try {
      const payload = { ...form, porcentaje: parseFloat(form.porcentaje) }
      if (editId) await updateBeneficiario(poliza.id, editId, payload)
      else        await createBeneficiario(poliza.id, payload)
      showToast(editId ? 'Beneficiario actualizado' : 'Beneficiario agregado', 'success')
      resetForm()
      await load()
    } catch (e) {
      showToast(e.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (b) => {
    try {
      await deleteBeneficiario(poliza.id, b.id)
      showToast('Beneficiario eliminado', 'success')
      if (editId === b.id) resetForm()
      await load()
    } catch (e) {
      showToast(e.message, 'error')
    }
  }

  return (
    <ModalShell title={`Beneficiarios — ${poliza.nro_contrato}`} footer={
      <button onClick={handleClose} className="btn-secondary ml-auto">Cerrar</button>
    }>
      {loading ? (
        <div className="flex items-center gap-2 py-8 text-slate-400 text-sm justify-center">
          <div className="w-4 h-4 border-2 border-slate-300 border-t-blue-500 rounded-full animate-spin" />
          Cargando beneficiarios…
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
            <span className="text-slate-500">
              Porcentaje asignado
              {config.max_beneficiarios != null && <span className="text-slate-400"> · {items.length} de {config.max_beneficiarios} beneficiarios</span>}
              {config.min_beneficiarios != null && items.length < config.min_beneficiarios && <span className="text-amber-600"> · se recomiendan al menos {config.min_beneficiarios}</span>}
            </span>
            <span className={`font-bold ${totalAsignado > 100 ? 'text-rose-600' : 'text-slate-700'}`}>
              {totalAsignado.toFixed(2)}% de 100%
            </span>
          </div>

          {!config.aplica_beneficiarios && (
            <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700">
              <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              El tipo de póliza "{poliza.producto}" no está configurado para admitir beneficiarios. Puedes ver/quitar los ya registrados, pero no agregar nuevos salvo que ajustes el producto.
            </div>
          )}

          {items.length === 0 ? (
            <div className="py-6 text-center">
              <Users className="w-9 h-9 text-slate-200 mx-auto mb-2" />
              <p className="text-sm text-slate-400">Esta póliza aún no tiene beneficiarios registrados.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {items.map(b => (
                <div key={b.id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="w-9 h-9 rounded-xl bg-violet-100 flex items-center justify-center shrink-0">
                    <Users className="w-4 h-4 text-violet-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{b.nombre}</p>
                    <p className="text-[11px] text-slate-400">
                      {b.cedula || '—'}{b.parentesco ? ` · ${b.parentesco}` : ''}
                    </p>
                  </div>
                  <span className="text-sm font-bold text-violet-700 shrink-0">{Number(b.porcentaje).toFixed(2)}%</span>
                  <button onClick={() => startEdit(b)} className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition shrink-0" title="Editar">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(b)} className="p-2 rounded-lg bg-rose-50 text-rose-500 hover:bg-rose-100 transition shrink-0" title="Eliminar">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {(editId || puedeAgregar) && (
          <form onSubmit={handleSubmit} className="p-3 rounded-xl border border-dashed border-slate-200 space-y-2">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">
              {editId ? 'Editar beneficiario' : 'Agregar beneficiario'}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input className="input-field text-sm sm:col-span-2" placeholder="Nombre completo *" value={form.nombre}
                onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} />
              <input className="input-field text-sm" placeholder="Cédula" value={form.cedula} maxLength={12}
                onChange={e => setForm(f => ({ ...f, cedula: filtrarCedula(e.target.value) }))} />
              <input className="input-field text-sm" placeholder="Parentesco" value={form.parentesco}
                onChange={e => setForm(f => ({ ...f, parentesco: e.target.value }))} />
              <input type="number" min="0.01" max="100" step="0.01" className="input-field text-sm sm:col-span-2"
                placeholder={`Porcentaje % (disponible: ${disponible.toFixed(2)}%)`} value={form.porcentaje}
                onChange={e => setForm(f => ({ ...f, porcentaje: e.target.value }))} />
            </div>
            <div className="flex gap-2">
              <button type="submit" disabled={saving} className="btn-primary text-xs !py-1.5 flex-1 justify-center disabled:opacity-50">
                {editId ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                {saving ? 'Guardando…' : editId ? 'Guardar cambios' : 'Agregar'}
              </button>
              {editId && (
                <button type="button" onClick={resetForm} className="btn-secondary text-xs !py-1.5">Cancelar</button>
              )}
            </div>
          </form>
          )}
        </div>
      )}
    </ModalShell>
  )
}

// ── Bienes cubiertos por una póliza ──────────────────────────────────────────

// Clases de vehículo del catálogo (igual que el Simulador) y lista cerrada de
// colores — el color de un vehículo se escoge de una lista, no se escribe libre.
const CLASES_VEHICULO = ['Automóvil', 'Camioneta', 'Motocicleta', 'Camión / Carga']
const COLORES_VEHICULO = [
  'Blanco', 'Negro', 'Gris', 'Plata', 'Rojo', 'Azul', 'Verde', 'Amarillo',
  'Beige', 'Marrón', 'Dorado', 'Naranja', 'Vino tinto', 'Celeste',
]

/**
 * Gestiona los bienes que cubre una póliza (ej. una póliza que admite hasta
 * 5 vehículos pero al solicitarla solo se registró 1). El bien original
 * (es_original=true) viene de la solicitud que emitió la póliza y se
 * identifica con el propio nro_contrato; los agregados después reciben un
 * certificado propio (POL-xxxx-02, -03...).
 */
function PolizaBienesModal({ poliza, personaId, onClose }) {
  const { closeModal, showToast, canAct } = useApp()
  const puedeCrearBien = canAct('cotizaciones', 'create') // crear bien = POST /bienes
  const [items,      setItems]      = useState([])
  const [config,     setConfig]     = useState({ permite_multiples_bienes: true, max_bienes: null })
  const [disponibles, setDisponibles] = useState([])
  const [loading,    setLoading]    = useState(true)
  const [saving,     setSaving]     = useState(false)
  const [seleccion,  setSeleccion]  = useState('')
  const [catalogo,   setCatalogo]   = useState([])
  // Prima adicional al agregar un bien (cobro por la cobertura extra).
  const [prima,   setPrima]   = useState('')
  const [tasa,    setTasa]    = useState('')
  const [tasaEur, setTasaEur] = useState('')
  const [forma,   setForma]   = useState('Transferencia')
  const [refPago, setRefPago] = useState('')
  const handleClose = () => { if (onClose) onClose(); else closeModal() }

  const load = async () => {
    setLoading(true)
    try {
      const [bienesRes, todos] = await Promise.all([
        fetchBienesPoliza(poliza.id),
        personaId ? fetchBienes({ persona_id: personaId }) : Promise.resolve([]),
      ])
      const cubiertos = bienesRes.items || []
      setItems(cubiertos)
      setConfig(bienesRes.config || { permite_multiples_bienes: true, max_bienes: null })
      const idsActuales = new Set(cubiertos.map(b => b.bien_asegurado_id))
      setDisponibles(todos.filter(b => !idsActuales.has(b.id)))
    } catch (e) {
      showToast(e.message, 'error')
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { load() }, [poliza.id])

  // Catálogo de vehículos permitidos (marca/modelo/año) para el formulario de
  // crear un vehículo nuevo y asociarlo. Se carga una sola vez.
  useEffect(() => {
    fetchVehiculosCatalogo().then(setCatalogo).catch(() => setCatalogo([]))
  }, [])

  const limiteAlcanzado = (items.length >= 1 && !config.permite_multiples_bienes) ||
    (config.max_bienes != null && items.length >= config.max_bienes)

  const bienRef = (b) => b.atributos?.placa || b.atributos?.descripcion || b.descripcion || `Bien #${b.id}`

  // Construye el payload de prima adicional. Devuelve {} si no hay prima (no se
  // recalcula nada), null si los datos son inválidos (abortar), o el payload.
  const esMensualPol = config.frecuencia_pago === 'Mensual'
  const buildPrimaPayload = () => {
    const p = parseFloat(prima)
    if (!p || p <= 0) return {}
    const t = parseFloat(tasa)
    if (!t || t <= 0) { showToast('Ingresa la tasa BCV para cobrar la prima adicional', 'error'); return null }
    if (esMensualPol && !config.cuotas_restantes) {
      showToast('No quedan cuotas pendientes donde repartir la prima. Renueva la póliza.', 'error'); return null
    }
    const payload = { prima_adicional: p, tasa_bcv: t }
    if (config.usa_eur && parseFloat(tasaEur) > 0) payload.tasa_eur = parseFloat(tasaEur)
    if (!esMensualPol) {
      payload.forma_pago = forma || 'Transferencia'
      if (refPago.trim()) payload.referencia = refPago.trim()
    }
    return payload
  }
  const resetPrima = () => { setPrima(''); setTasa(''); setTasaEur(''); setRefPago('') }
  const avisoPrima = (res) => {
    if (res?.prima_aplicada == null) return
    showToast(res.recibo ? `Prima cobrada — recibo ${res.recibo}` : 'Prima repartida en las cuotas pendientes', 'success')
  }

  const handleAgregar = async () => {
    if (!seleccion) return
    const primaPayload = buildPrimaPayload()
    if (primaPayload === null) return
    setSaving(true)
    try {
      const res = await agregarBienPoliza(poliza.id, { bien_asegurado_id: Number(seleccion), ...primaPayload })
      showToast('Bien agregado a la póliza', 'success')
      avisoPrima(res)
      setSeleccion('')
      resetPrima()
      await load()
    } catch (e) {
      showToast(e.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleQuitar = async (item) => {
    try {
      await quitarBienPoliza(poliza.id, item.id)
      showToast('Bien quitado de la póliza', 'success')
      await load()
    } catch (e) {
      showToast(e.message, 'error')
    }
  }

  // ── Crear un bien nuevo y asociarlo a la póliza, sin salir del modal ──────────
  // El tipo del bien nuevo debe coincidir con el de la póliza (se toma del bien
  // original; por defecto 'vehiculo', el caso dominante).
  const tipoBien   = items[0]?.tipo ?? 'vehiculo'
  const esVehiculo = tipoBien === 'vehiculo'
  const preset     = BIEN_TIPO_PRESETS[tipoBien] ?? null
  const tipoLabel  = preset?.label ?? (esVehiculo ? 'Vehículo' : tipoBien)
  // Para tipos NO vehículo se mantienen los campos libres del preset.
  const camposCrear = esVehiculo
    ? []
    : preset ? preset.campos : [{ key: 'descripcion', label: 'Descripción' }]

  const [crear,   setCrear]   = useState(false)
  const [creando, setCreando] = useState(false)
  const [nuevo,   setNuevo]   = useState({})
  const setCampo = (k, v) => setNuevo(p => ({ ...p, [k]: v }))
  const cancelarCrear = () => { setCrear(false); setNuevo({}) }

  // Listas en cascada del catálogo de vehículos permitidos (Tipo→Marca→Modelo→Año).
  const claseSel   = nuevo.clase || 'Automóvil'
  // Tipos = base + los que existan en el catálogo (así aparecen los tipos nuevos).
  const tiposCat   = [...new Set([...CLASES_VEHICULO, ...catalogo.map(c => c.tipo).filter(Boolean)])]
  const marcasCat  = esVehiculo
    ? [...new Set(catalogo.filter(c => c.tipo === claseSel).map(c => c.marca))].sort()
    : []
  const modelosCat = esVehiculo && nuevo.marca
    ? [...new Set(catalogo.filter(c => c.tipo === claseSel && c.marca === nuevo.marca).map(c => c.modelo))].sort()
    : []
  const aniosCat = (() => {
    if (!esVehiculo || !nuevo.marca || !nuevo.modelo) return []
    const m = catalogo.find(c => c.tipo === claseSel && c.marca === nuevo.marca && c.modelo === nuevo.modelo)
    if (!m) return []
    const ys = []
    for (let y = m.anio_fin; y >= m.anio_inicio; y--) ys.push(y)
    return ys
  })()

  const handleCrear = async () => {
    let atributos, descripcion
    if (esVehiculo) {
      if (!nuevo.marca || !nuevo.modelo || !nuevo.anio) {
        showToast('Selecciona marca, modelo y año del vehículo', 'error'); return
      }
      atributos = {
        clase:             claseSel,
        marca:             nuevo.marca,
        modelo:            nuevo.modelo,
        anio:              String(nuevo.anio),
        color:             nuevo.color || '',
        placa:             (nuevo.placa || '').trim().toUpperCase(),
        serial_carroceria: (nuevo.serial_carroceria || '').trim().toUpperCase(),
        serial_motor:      (nuevo.serial_motor || '').trim().toUpperCase(),
        uso:               'Particular',
      }
      Object.keys(atributos).forEach(k => { if (atributos[k] === '') delete atributos[k] })
      descripcion = [nuevo.marca, nuevo.modelo, nuevo.anio].filter(Boolean).join(' ')
    } else {
      atributos = {}
      camposCrear.forEach(c => {
        const v = nuevo[c.key]
        if (v == null || String(v).trim() === '') return
        atributos[c.key] = c.upper ? String(v).toUpperCase() : v
      })
      if (Object.keys(atributos).length === 0) {
        showToast('Completa al menos un dato del bien', 'error'); return
      }
      descripcion = atributos.descripcion ?? Object.values(atributos)[0] ?? ''
    }
    // Validar la prima ANTES de crear el bien para no dejar huérfanos si falla.
    const primaPayload = buildPrimaPayload()
    if (primaPayload === null) return
    setCreando(true)
    try {
      // Valor declarado NO se captura aquí: el cobro del bien agregado se
      // calcula al recalcular la prima de la póliza, no como valor del bien.
      const bien = await createBien({
        persona_id:  personaId,
        tipo:        tipoBien,
        atributos,
        descripcion: descripcion || null,
      })
      const res = await agregarBienPoliza(poliza.id, { bien_asegurado_id: bien.id, ...primaPayload })
      showToast('Bien creado y asociado a la póliza', 'success')
      avisoPrima(res)
      cancelarCrear()
      resetPrima()
      await load()
    } catch (e) {
      showToast(e.message, 'error')
    } finally {
      setCreando(false)
    }
  }

  return (
    <ModalShell title={`Bienes Cubiertos — ${poliza.nro_contrato}`} footer={
      <button onClick={handleClose} className="btn-secondary ml-auto">Cerrar</button>
    }>
      {loading ? (
        <div className="flex items-center gap-2 py-8 text-slate-400 text-sm justify-center">
          <div className="w-4 h-4 border-2 border-slate-300 border-t-blue-500 rounded-full animate-spin" />
          Cargando bienes…
        </div>
      ) : (
        <div className="space-y-4">
          <div className="space-y-2">
            {items.map(it => (
              <div key={it.id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
                  {it.tipo === 'vehiculo' ? <Car className="w-4 h-4 text-blue-600" /> : <Package className="w-4 h-4 text-blue-600" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate">{it.referencia}</p>
                  {config.lleva_certificado && (
                    <p className="text-[11px] text-slate-400 font-mono">
                      Certificado {it.certificado}{it.es_original && <span className="text-slate-300"> (original)</span>}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => handleQuitar(it)}
                  className="p-2 rounded-lg bg-rose-50 text-rose-500 hover:bg-rose-100 transition shrink-0"
                  title="Quitar bien de la póliza"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-slate-100">
            <label className="field-label">
              Agregar otro bien de este cliente
              {config.max_bienes != null && <span className="text-slate-400 font-normal"> · {items.length} de {config.max_bienes}</span>}
            </label>
            {limiteAlcanzado ? (
              <div className="flex items-start gap-2 p-3 mt-1 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700">
                <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                {config.permite_multiples_bienes
                  ? `Esta póliza ya alcanzó el máximo de ${config.max_bienes} bienes cubiertos para el tipo "${poliza.producto}".`
                  : `El tipo de póliza "${poliza.producto}" no admite más de un bien cubierto.`}
              </div>
            ) : (
              <>
                {/* Prima adicional por la cobertura del bien que se agrega.
                    Opcional: en blanco no cobra nada. Aplica al asociar o crear. */}
                <div className="mt-1 mb-3 p-3 rounded-xl border border-indigo-100 bg-indigo-50/60 space-y-2">
                  <p className="text-[11px] font-black text-indigo-600 uppercase tracking-widest">Prima adicional (opcional)</p>
                  <p className="text-[11px] text-slate-500 leading-snug">
                    {esMensualPol
                      ? `Se reparte en las ${config.cuotas_restantes ?? 0} cuotas pendientes (con recargo del producto).`
                      : 'Genera un recibo por el cobro adicional.'}
                    {config.prima_sugerida > 0 && <> Sugerido: {config.moneda_simbolo}{config.prima_sugerida}.</>}
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="field-label">Prima adicional ({config.moneda_nativa || 'USD'})</label>
                      <input className="input-field" type="number" min="0" step="0.01"
                        placeholder={config.prima_sugerida ? String(config.prima_sugerida) : '0.00'}
                        value={prima} onChange={e => setPrima(e.target.value)} />
                    </div>
                    <div>
                      <label className="field-label">Tasa BCV</label>
                      <input className="input-field" type="number" min="0" step="0.0001" placeholder="0.0000"
                        value={tasa} onChange={e => setTasa(e.target.value)} />
                    </div>
                    {config.usa_eur && (
                      <div>
                        <label className="field-label">Tasa EUR</label>
                        <input className="input-field" type="number" min="0" step="0.0001" placeholder="0.0000"
                          value={tasaEur} onChange={e => setTasaEur(e.target.value)} />
                      </div>
                    )}
                    {!esMensualPol && (
                      <>
                        <div>
                          <label className="field-label">Forma de pago</label>
                          <input className="input-field" maxLength={30} value={forma} onChange={e => setForma(e.target.value)} />
                        </div>
                        <div className="col-span-2">
                          <label className="field-label">Referencia (opcional)</label>
                          <input className="input-field" maxLength={100} value={refPago} onChange={e => setRefPago(e.target.value)} />
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Asociar un bien ya existente del cliente */}
                {disponibles.length > 0 && !crear && (
                  <div className="flex gap-2 mt-1">
                    <select className="select-field flex-1" value={seleccion} onChange={e => setSeleccion(e.target.value)}>
                      <option value="">— Seleccionar bien existente —</option>
                      {disponibles.map(b => (
                        <option key={b.id} value={b.id}>{bienRef(b)} ({b.tipo})</option>
                      ))}
                    </select>
                    <button onClick={handleAgregar} disabled={!seleccion || saving} className="btn-primary shrink-0 disabled:opacity-50">
                      <Plus className="w-4 h-4" />Agregar
                    </button>
                  </div>
                )}

                {/* Crear un bien nuevo y asociarlo directamente */}
                {!puedeCrearBien ? (
                  disponibles.length === 0 && (
                    <p className="text-xs text-slate-400 mt-2">
                      Este cliente no tiene bienes disponibles para asociar.
                    </p>
                  )
                ) : !crear ? (
                  <button onClick={() => setCrear(true)} className="btn-secondary w-full justify-center mt-2">
                    <Plus className="w-4 h-4" />Crear {tipoLabel.toLowerCase()} nuevo y asociarlo
                  </button>
                ) : (
                  <div className="mt-2 p-3 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Nuevo {tipoLabel}</p>
                      <button onClick={cancelarCrear} className="text-xs font-semibold text-slate-400 hover:text-slate-600">Cancelar</button>
                    </div>
                    {esVehiculo ? (
                      <>
                        {catalogo.length === 0 && (
                          <div className="flex items-start gap-2 p-2 bg-amber-50 border border-amber-200 rounded-lg text-[11px] text-amber-700">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                            No hay vehículos en el catálogo. Agrégalos en Vehículos → Catálogo para poder seleccionarlos.
                          </div>
                        )}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <div>
                            <label className="field-label">Tipo de vehículo</label>
                            <select className="select-field" value={claseSel}
                              onChange={e => setNuevo(p => ({ ...p, clase: e.target.value, marca: '', modelo: '', anio: '' }))}>
                              {tiposCat.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="field-label">Marca</label>
                            <select className="select-field" value={nuevo.marca || ''}
                              onChange={e => setNuevo(p => ({ ...p, marca: e.target.value, modelo: '', anio: '' }))}>
                              <option value="">Seleccione marca…</option>
                              {marcasCat.map(m => <option key={m} value={m}>{m}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="field-label">Modelo</label>
                            <select className="select-field" value={nuevo.modelo || ''} disabled={!nuevo.marca}
                              onChange={e => setNuevo(p => ({ ...p, modelo: e.target.value, anio: '' }))}>
                              <option value="">Seleccione modelo…</option>
                              {modelosCat.map(m => <option key={m} value={m}>{m}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="field-label">Año</label>
                            <select className="select-field" value={nuevo.anio || ''} disabled={!nuevo.modelo}
                              onChange={e => setCampo('anio', e.target.value)}>
                              <option value="">Seleccione año…</option>
                              {aniosCat.map(y => <option key={y} value={y}>{y}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="field-label">Color</label>
                            <select className="select-field" value={nuevo.color || ''} onChange={e => setCampo('color', e.target.value)}>
                              <option value="">Seleccione color…</option>
                              {COLORES_VEHICULO.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="field-label">Placa</label>
                            <input className="input-field font-mono uppercase" placeholder="ABC-123" maxLength={8}
                              value={nuevo.placa || ''} onChange={e => setCampo('placa', e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, ''))} />
                          </div>
                          <div>
                            <label className="field-label">Serial de carrocería</label>
                            <input className="input-field font-mono uppercase" maxLength={30} value={nuevo.serial_carroceria || ''}
                              onChange={e => setCampo('serial_carroceria', e.target.value.toUpperCase())} />
                          </div>
                          <div>
                            <label className="field-label">Serial de motor</label>
                            <input className="input-field font-mono uppercase" maxLength={30} value={nuevo.serial_motor || ''}
                              onChange={e => setCampo('serial_motor', e.target.value.toUpperCase())} />
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {camposCrear.map(c => (
                          <div key={c.key}>
                            <label className="field-label">{c.label}</label>
                            {c.opciones ? (
                              <select className="select-field" value={nuevo[c.key] ?? ''} onChange={e => setCampo(c.key, e.target.value)}>
                                <option value="">—</option>
                                {c.opciones.map(o => <option key={o}>{o}</option>)}
                              </select>
                            ) : (
                              <input
                                className="input-field"
                                type={c.type === 'number' ? 'number' : 'text'}
                                placeholder={c.placeholder ?? ''}
                                value={nuevo[c.key] ?? ''}
                                onChange={e => setCampo(c.key, e.target.value)}
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    <button onClick={handleCrear} disabled={creando} className="btn-primary w-full justify-center disabled:opacity-50">
                      <Plus className="w-4 h-4" />{creando ? 'Creando…' : 'Crear y asociar'}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </ModalShell>
  )
}

// ── Cuotas mensuales de una póliza ───────────────────────────────────────────
/**
 * Muestra el plan de 12 cuotas de una póliza mensual y permite al asesor
 * registrar un cobro (asigna a las cuotas pendientes, emite recibo y notifica).
 */
const CUOTA_BADGE = { PAGADA: 'green', PARCIAL: 'amber', PENDIENTE: 'slate', VENCIDA: 'red' }

function PolizaCuotasModal({ poliza, onClose }) {
  const { closeModal, showToast, canAct } = useApp()
  const [data,    setData]    = useState(null)   // { cuotas, total, pagado, saldo, moneda, moneda_simbolo }
  const [tasas,   setTasas]   = useState({ usd: null, eur: null })
  const [loading, setLoading] = useState(true)
  const [pagos,   setPagos]   = useState(() => [{ ...pagoVacio(), moneda: monedaOpcion(poliza.moneda_producto) }])
  const [saving,  setSaving]  = useState(false)
  const [formErr, setFormErr] = useState({})
  const [cobrar,  setCobrar]  = useState(false)
  const puedeCobrar = canAct('cotizaciones', 'emit')
  const handleClose = () => { if (onClose) onClose(); else closeModal() }

  const load = async () => {
    try { setData(await fetchCuotas(poliza.id)) }
    catch (e) { showToast(e.message, 'error') }
    finally { setLoading(false) }
  }
  useEffect(() => {
    fetchTasas().then(t => setTasas({ usd: t.usd?.valor ?? null, eur: t.eur?.valor ?? null })).catch(() => {})
    load()
  }, [poliza.id])

  const monedaNativa = data?.moneda || poliza.moneda_producto || 'USD'
  const setPago    = (i, f, v) => setPagos(prev => prev.map((p, idx) => idx === i ? { ...p, [f]: v, ...(f === 'forma' ? { referencia: '' } : {}) } : p))
  const addPago    = () => setPagos(p => [...p, { ...pagoVacio(), moneda: monedaOpcion(monedaNativa) }])
  const removePago = i  => setPagos(p => p.filter((_, idx) => idx !== i))

  const pagoEnNativo    = (p) => convertirMoneda(parseFloat(p.monto) || 0, p.moneda, monedaNativa, tasas.usd || 0, tasas.eur || 0)
  const totalIngresado  = pagos.reduce((s, p) => s + pagoEnNativo(p), 0)
  const saldo           = data?.saldo ?? 0
  const excede          = Math.max(0, Math.round((totalIngresado - saldo) * 100) / 100)
  const pagoOk          = totalIngresado > 0 && Math.round(totalIngresado * 100) <= Math.round(saldo * 100) + 10

  const handlePagar = async () => {
    const errs = {}
    pagos.forEach((p, i) => {
      if (!p.monto || parseFloat(p.monto) <= 0) errs[`monto_${i}`] = 'Ingrese el monto.'
      if (!PAGOS_SIN_REF.has(p.forma) && !p.referencia.trim()) errs[`ref_${i}`] = 'Referencia requerida.'
    })
    if (totalIngresado <= 0) errs.total = 'Ingrese un pago.'
    else if (!pagoOk)        errs.total = `El pago (${fmtMonto(totalIngresado, monedaNativa)}) supera el saldo pendiente (${fmtMonto(saldo, monedaNativa)}).`
    if (Object.keys(errs).length) { setFormErr(errs); return }
    setFormErr({})
    setSaving(true)
    try {
      const r = await pagarCuota(poliza.id, { tasa_bcv: tasas.usd ?? 1, tasa_eur: tasas.eur ?? 0, pagos })
      showToast(`Pago registrado · recibo ${r.nro_factura ?? ''}`.trim(), 'success')
      setPagos([pagoVacio()]); setCobrar(false)
      await load()
    } catch (e) { showToast(e.message, 'error') }
    finally { setSaving(false) }
  }

  return (
    <ModalShell title={`Cuotas — ${poliza.nro_contrato}`} maxW="max-w-xl" footer={
      <button onClick={handleClose} className="btn-secondary ml-auto">Cerrar</button>
    }>
      {loading ? (
        <div className="flex items-center gap-2 py-8 text-slate-400 text-sm justify-center">
          <div className="w-4 h-4 border-2 border-slate-300 border-t-blue-500 rounded-full animate-spin" /> Cargando cuotas…
        </div>
      ) : !data || !data.cuotas?.length ? (
        <p className="py-8 text-center text-sm text-slate-400">Esta póliza no tiene cuotas (no es de pago mensual).</p>
      ) : (
        <div className="space-y-4">
          {/* Resumen */}
          <div className="grid grid-cols-3 gap-2">
            {[['Total', data.total], ['Pagado', data.pagado], ['Saldo', data.saldo]].map(([l, v], i) => (
              <div key={l} className={`p-2.5 rounded-xl border text-center ${i === 2 && v > 0 ? 'bg-amber-50 border-amber-200' : 'bg-slate-50 border-slate-100'}`}>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{l}</p>
                <p className={`text-sm font-black ${i === 2 && v > 0 ? 'text-amber-700' : 'text-slate-800'}`}>{fmtMonto(v, monedaNativa)}</p>
              </div>
            ))}
          </div>

          {/* Lista de cuotas */}
          <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
            {data.cuotas.map(c => (
              <div key={c.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center shrink-0 text-xs font-black text-blue-700">{c.numero}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800">{fmtMonto(c.monto, monedaNativa)}
                    {c.saldo > 0 && c.saldo < c.monto && <span className="text-[11px] text-amber-600 font-normal"> · falta {fmtMonto(c.saldo, monedaNativa)}</span>}
                  </p>
                  <p className="text-[11px] text-slate-400">Vence {c.fecha_vencimiento}</p>
                </div>
                {badge(c.status === 'PAGADA' ? 'Pagada' : c.status === 'PARCIAL' ? 'Parcial' : c.status === 'VENCIDA' ? 'Vencida' : 'Pendiente', CUOTA_BADGE[c.status] ?? 'slate')}
              </div>
            ))}
          </div>

          {/* Registrar cobro */}
          {puedeCobrar && data.saldo > 0 && (
            !cobrar ? (
              <button onClick={() => setCobrar(true)} className="btn-primary w-full justify-center">
                <DollarSign className="w-4 h-4" /> Registrar pago de cuota
              </button>
            ) : (
              <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Registrar cobro</p>
                  <button onClick={() => { setCobrar(false); setPagos([pagoVacio()]); setFormErr({}) }} className="text-xs font-semibold text-slate-400 hover:text-slate-600">Cancelar</button>
                </div>
                <p className="text-[11px] text-slate-500">Tasas BCV: USD {tasas.usd ? fmtTasa(tasas.usd) : '—'}{tasas.eur ? ` · EUR ${fmtTasa(tasas.eur)}` : ''}</p>
                {pagos.map((p, i) => (
                  <div key={i} className="p-2.5 bg-white rounded-xl border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-500">Pago {i + 1}</span>
                      {pagos.length > 1 && <button onClick={() => removePago(i)} className="text-xs text-rose-500 hover:text-rose-700 font-semibold">Eliminar</button>}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="field-label">Forma</label>
                        <select className="select-field" value={p.forma} onChange={e => setPago(i, 'forma', e.target.value)}>{PAGOS_OPCIONES.map(o => <option key={o}>{o}</option>)}</select>
                      </div>
                      <div>
                        <label className="field-label">Moneda</label>
                        <select className="select-field" value={p.moneda} onChange={e => setPago(i, 'moneda', e.target.value)}>{MONEDAS_OPCIONES.map(m => <option key={m}>{m}</option>)}</select>
                      </div>
                      <div>
                        <label className="field-label">Monto <span className="text-rose-500">*</span></label>
                        <input type="number" step="0.01" min="0.01" className={`input-field ${formErr[`monto_${i}`] ? 'border-rose-400' : ''}`} placeholder="0.00" value={p.monto}
                          onChange={e => { setPago(i, 'monto', e.target.value); setFormErr(f => ({ ...f, [`monto_${i}`]: '' })) }} />
                      </div>
                      <div>
                        <label className="field-label">Referencia {!PAGOS_SIN_REF.has(p.forma) && <span className="text-rose-500">*</span>}</label>
                        <input className={`input-field ${formErr[`ref_${i}`] ? 'border-rose-400' : ''}`} placeholder={PAGOS_SIN_REF.has(p.forma) ? 'Opcional' : 'N° confirmación'} value={p.referencia}
                          onChange={e => { setPago(i, 'referencia', e.target.value); setFormErr(f => ({ ...f, [`ref_${i}`]: '' })) }} />
                      </div>
                    </div>
                  </div>
                ))}
                <button onClick={addPago} className="text-xs font-semibold text-blue-600 hover:text-blue-800">+ Agregar forma de pago</button>
                <div className={`p-2.5 rounded-xl border text-xs flex items-center justify-between flex-wrap gap-2 ${excede > 0 ? 'bg-rose-50 border-rose-200 text-rose-700' : 'bg-emerald-50 border-emerald-200 text-emerald-700'}`}>
                  <span>{excede > 0 ? `⚠ Excede el saldo por ${fmtMonto(excede, monedaNativa)}` : `Abono: ${fmtMonto(totalIngresado, monedaNativa)}`}</span>
                  <span className="font-bold font-mono ml-auto">{fmtMonto(totalIngresado, monedaNativa)} / {fmtMonto(saldo, monedaNativa)}</span>
                </div>
                {formErr.total && <p className="text-xs text-rose-600">{formErr.total}</p>}
                <button onClick={handlePagar} disabled={saving || !pagoOk} className="btn-success w-full justify-center disabled:opacity-50">
                  {saving ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <Receipt className="w-4 h-4" />}
                  {saving ? 'Registrando…' : 'Registrar y emitir recibo'}
                </button>
              </div>
            )
          )}
          {data.saldo <= 0 && <p className="text-center text-sm text-emerald-600 font-semibold">✓ Todas las cuotas están pagadas.</p>}
        </div>
      )}
    </ModalShell>
  )
}

// ── Cotizaciones del cliente ─────────────────────────────────────────────────
const SOL_STATUS_STYLE = {
  'en_revision': { bg: 'bg-amber-100',  text: 'text-amber-700',  dot: 'bg-amber-500'  },
  'aprobado':    { bg: 'bg-blue-100',   text: 'text-blue-700',   dot: 'bg-blue-500'   },
  'emitida':     { bg: 'bg-emerald-100',text: 'text-emerald-700',dot: 'bg-emerald-500'},
  'vencida':     { bg: 'bg-red-100',    text: 'text-red-700',    dot: 'bg-red-500'    },
  'rechazado':   { bg: 'bg-rose-100',   text: 'text-rose-700',   dot: 'bg-rose-500'   },
  'pendiente':   { bg: 'bg-slate-100',  text: 'text-slate-500',  dot: 'bg-slate-400'  },
}
const SOL_STATUS_LABEL = {
  'en_revision': 'En Revisión',
  'aprobado':    'Aprobado',
  'emitida':     'Emitida',
  'vencida':     'Vencida',
  'rechazado':   'Rechazado',
  'pendiente':   'Pendiente',
}

function ClienteSolicitudesModal({ c }) {
  const { closeModal, showPdfViewer } = useApp()
  const [solicitudes, setSolicitudes] = useState([])
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState(null)
  const [filter, setFilter]           = useState('all')

  useEffect(() => {
    fetchSolicitudesCliente(c.id)
      .then(data => { setSolicitudes(data); setLoading(false) })
      .catch(err => { setError(err.message); setLoading(false) })
  }, [c.id])

  const counts = solicitudes.reduce((acc, s) => {
    acc[s.status] = (acc[s.status] ?? 0) + 1
    return acc
  }, {})

  const visible = filter === 'all' ? solicitudes : solicitudes.filter(s => s.status === filter)

  const FILTERS = [
    { id: 'all',         label: 'Todas',       count: solicitudes.length },
    { id: 'en_revision', label: 'En Revisión', count: counts['en_revision'] ?? 0 },
    { id: 'aprobado',    label: 'Aprobadas',   count: counts['aprobado']    ?? 0 },
    { id: 'emitida',     label: 'Emitidas',    count: counts['emitida']     ?? 0 },
    { id: 'vencida',     label: 'Vencidas',    count: counts['vencida']     ?? 0 },
    { id: 'rechazado',   label: 'Rechazadas',  count: counts['rechazado']   ?? 0 },
    { id: 'pendiente',   label: 'Pendientes',  count: counts['pendiente']   ?? 0 },
  ].filter(f => f.id === 'all' || f.count > 0)

  const generateCotPdf = (s) => {
    const logoUrl = window.location.origin + '/logo-sinfondo.png'
    const cobs    = s.coberturas || {}
    const items   = cobs.items   || []
    const nombre  = s.nombre_tomador || c.nombre || c.nom || '—'
    const ci      = s.ci_tomador     || c.ci      || '—'
    const st      = SOL_STATUS_STYLE[s.status] ?? {}
    const stColor = s.status === 'rechazado' ? '#f43f5e' : s.status === 'vencida' ? '#ef4444' : s.status === 'emitida' ? '#059669' : s.status === 'aprobado' ? '#3b82f6' : '#f59e0b'

    const banner = `
      <div style="background:#001463;color:white;padding:14px 22px;border-radius:10px;margin-bottom:22px;display:flex;justify-content:space-between;align-items:center">
        <div>
          <p style="font-size:9px;font-weight:700;letter-spacing:2px;opacity:0.65;text-transform:uppercase;margin-bottom:4px">N° de Cotización</p>
          <p style="font-size:20px;font-weight:900;font-family:monospace;letter-spacing:2px">${s.nro}</p>
        </div>
        <div style="text-align:right">
          <p style="font-size:9px;font-weight:700;letter-spacing:2px;opacity:0.65;text-transform:uppercase;margin-bottom:4px">Estado</p>
          <p style="font-size:15px;font-weight:900;color:${stColor}">${s.status}</p>
        </div>
      </div>`

    const cobRows = items.map(it =>
      `<tr style="border-bottom:1px solid #f1f5f9">
        <td style="padding:8px 12px;font-size:12px;color:#1e293b">${it.nom}</td>
        <td style="padding:8px 12px;text-align:right;font-size:12px;font-weight:700;color:#059669;font-family:monospace">${fmtMonto(it.prima, s.moneda_producto)}</td>
      </tr>`
    ).join('')

    const cobTable = items.length ? `
      <table style="width:100%;border-collapse:collapse;margin-top:10px">
        <thead>
          <tr style="background:#001463;color:white">
            <th style="padding:9px 12px;text-align:left;font-size:9px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase">Cobertura</th>
            <th style="padding:9px 12px;text-align:right;font-size:9px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase">Prima (${s.moneda_producto || 'USD'})</th>
          </tr>
        </thead>
        <tbody>${cobRows}</tbody>
        <tfoot>
          <tr style="background:#f1f5f9">
            <td style="padding:9px 12px;font-size:10px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:1px">TOTAL</td>
            <td style="padding:9px 12px;text-align:right;font-size:16px;font-weight:900;color:#059669;font-family:monospace">${fmtMonto(s.total, s.moneda_producto)}</td>
          </tr>
        </tfoot>
      </table>` : ''

    const content =
      banner +
      pdfSec('DATOS DEL TOMADOR') +
      pdfRow('Nombre completo', nombre) +
      pdfRow('Cédula / RIF',    ci,  true) +
      (s.bien_tipo === 'vehiculo' && s.bien_atributos?.placa
        ? pdfSec('DATOS DEL VEHÍCULO') +
          pdfRow('Placa',           s.bien_atributos.placa, true) +
          (s.bien_atributos.marca  ? pdfRow('Marca',   s.bien_atributos.marca)  : '') +
          (s.bien_atributos.modelo ? pdfRow('Modelo',  s.bien_atributos.modelo) : '') +
          (s.bien_atributos.anio   ? pdfRow('Año',     String(s.bien_atributos.anio), true) : '') +
          (s.bien_atributos.color  ? pdfRow('Color',   s.bien_atributos.color)  : '') +
          (s.bien_atributos.uso    ? pdfRow('Uso',     s.bien_atributos.uso)    : '') +
          (cobs.valor_mercado ? pdfRow('Valor de Mercado', fmtMonto(cobs.valor_mercado, s.moneda_producto), true) : '')
        : (s.asegurado_nombre
            ? pdfSec('DATOS DEL ASEGURADO') +
              pdfRow('Nombre', s.asegurado_nombre) +
              (s.asegurado_ci ? pdfRow('Cédula', s.asegurado_ci, true) : '')
            : '')
      ) +
      pdfSec('COBERTURAS CONTRATADAS') +
      cobTable +
      pdfFooterSimple()

    closeModal()
    showPdfViewer(`Cotización ${s.nro}`, pdfPage(
      pdfHdr(s.bien_tipo === 'vehiculo' ? 'COTIZACIÓN DE SEGURO VEHICULAR' : 'COTIZACIÓN DE SEGURO', `Fecha: ${s.fecha}`, '', new Date().toLocaleDateString('es-VE'), logoUrl) + content
    ))
  }

  return (
    <ModalShell title={`Cotizaciones — ${c.nom}`} maxW="max-w-3xl">
      {/* Filtros por estado */}
      <div className="flex items-center gap-1.5 mb-5 flex-wrap">
        <ClipboardList className="w-4 h-4 text-slate-400 shrink-0 mr-0.5" />
        {FILTERS.map(f => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition ${
              filter === f.id ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
            }`}
          >
            {f.label}
            <span className={`inline-flex items-center justify-center min-w-[1.1rem] h-4 rounded-full px-1 text-[10px] font-bold ${
              filter === f.id ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
            }`}>{f.count}</span>
          </button>
        ))}
      </div>

      {loading && (
        <div className="flex justify-center items-center py-10 gap-2 text-slate-400 text-sm">
          <div className="w-4 h-4 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
          Cargando cotizaciones…
        </div>
      )}
      {error && !loading && (
        <p className="text-center py-8 text-rose-500 text-sm">{error}</p>
      )}

      {!loading && !error && visible.length === 0 && (
        <div className="text-center py-10">
          <ClipboardList className="w-8 h-8 text-slate-200 mx-auto mb-2" />
          <p className="text-sm text-slate-400">No hay cotizaciones{filter !== 'all' ? ' con este estado' : ''}</p>
        </div>
      )}

      {!loading && !error && visible.length > 0 && (
        <>
          {/* Móvil/tablet: cada cotización como tarjeta */}
          <div className="lg:hidden divide-y divide-slate-100 rounded-xl border border-slate-100">
            {visible.map(s => {
              const st = SOL_STATUS_STYLE[s.status] ?? { bg: 'bg-slate-100', text: 'text-slate-600', dot: 'bg-slate-400' }
              return (
                <div key={s.id} className="p-3.5">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="min-w-0">
                      <p className="font-mono font-bold text-xs text-slate-700">{s.nro}</p>
                      <p className="text-[11px] text-slate-400">{s.fecha}</p>
                    </div>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold shrink-0 ${st.bg} ${st.text}`}>
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${st.dot}`} />
                      {SOL_STATUS_LABEL[s.status] ?? s.status}
                    </span>
                  </div>
                  <dl className="grid grid-cols-2 gap-x-3 gap-y-1.5">
                    <div className="min-w-0"><dt className="text-[10px] uppercase tracking-wide text-slate-400">Bien / Ref.</dt><dd className="text-xs font-mono text-slate-700 break-words">{s.bien_ref && s.bien_ref !== '—' ? s.bien_ref : (s.asegurado_nombre || '—')}</dd></div>
                    <div className="min-w-0"><dt className="text-[10px] uppercase tracking-wide text-slate-400">Producto</dt><dd className="text-sm text-slate-700 break-words">{s.producto}</dd></div>
                    <div className="min-w-0"><dt className="text-[10px] uppercase tracking-wide text-slate-400">Total</dt><dd className="text-sm font-semibold text-slate-700">{fmtMonto(s.total, s.moneda_producto)}</dd></div>
                  </dl>
                  <div className="mt-3 pt-3 border-t border-slate-100">
                    <button onClick={() => generateCotPdf(s)} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition text-xs font-semibold" title="Ver documento">
                      <FileText className="w-4 h-4" /> Ver documento
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
          {/* Escritorio: tabla */}
          <div className="hidden lg:block overflow-x-auto rounded-xl border border-slate-100">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-left">
                <th className="px-3 py-2.5 text-[11px] font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">Nro</th>
                <th className="px-3 py-2.5 text-[11px] font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">Fecha</th>
                <th className="px-3 py-2.5 text-[11px] font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">Bien / Ref.</th>
                <th className="px-3 py-2.5 text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Producto</th>
                <th className="px-3 py-2.5 text-[11px] font-semibold text-slate-500 uppercase tracking-wide text-right whitespace-nowrap">Total</th>
                <th className="px-3 py-2.5 text-[11px] font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">Estado</th>
                <th className="px-3 py-2.5 text-[11px] font-semibold text-slate-500 uppercase tracking-wide text-center whitespace-nowrap">Doc.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {visible.map(s => {
                const st = SOL_STATUS_STYLE[s.status] ?? { bg: 'bg-slate-100', text: 'text-slate-600', dot: 'bg-slate-400' }
                return (
                  <tr key={s.id} className="hover:bg-slate-50/60 transition">
                    <td className="px-3 py-2.5 font-mono font-bold text-[11px] text-slate-700 whitespace-nowrap">{s.nro}</td>
                    <td className="px-3 py-2.5 text-slate-500 text-xs whitespace-nowrap">{s.fecha}</td>
                    <td className="px-3 py-2.5 font-mono font-semibold text-slate-700 text-xs whitespace-nowrap">
                      {s.bien_ref && s.bien_ref !== '—' ? s.bien_ref : (s.asegurado_nombre || '—')}
                    </td>
                    <td className="px-3 py-2.5 text-slate-600 text-xs">{s.producto}</td>
                    <td className="px-3 py-2.5 text-right font-semibold text-slate-700 text-xs whitespace-nowrap">
                      {fmtMonto(s.total, s.moneda_producto)}
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold whitespace-nowrap ${st.bg} ${st.text}`}>
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${st.dot}`} />
                        {SOL_STATUS_LABEL[s.status] ?? s.status}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <button
                        onClick={() => generateCotPdf(s)}
                        className="p-2.5 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition inline-flex items-center justify-center"
                        title="Ver documento"
                      >
                        <FileText className="w-[18px] h-[18px]" />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          </div>
        </>
      )}
    </ModalShell>
  )
}

// ── Pólizas del cliente ───────────────────────────────────────────────────────
function ClienteHistorialModal({ c, onSaved }) {
  const { closeModal, showToast, showModal, canAct } = useApp()
  const canRenew  = canAct('clientes', 'renew')
  const canAdjust = canAct('clientes', 'adjust')
  const canManageBeneficiarios = canAct('clientes', 'manage_beneficiarios')
  const canManageBienes        = canAct('clientes', 'manage_bienes')
  const [polizas, setPolizas]         = useState([])
  const [loading, setLoading]         = useState(true)
  const [search, setSearch]           = useState('')
  const [showRechazadas, setShowRechazadas] = useState(false)
  const [pdfLoading, setPdfLoading]   = useState(null)
  const [renewLoadingId, setRenewLoadingId] = useState(null)
  const [pdfVisor, setPdfVisor]       = useState(null) // { url, title, nro }
  const pdfVisorPanelRef = useRef(null)
  useModalLock(pdfVisorPanelRef, !!pdfVisor)

  const loadPolizas = () => {
    if (!c) return
    setLoading(true)
    fetchPolizasCliente(c.id)
      .then(setPolizas)
      .catch(() => setPolizas([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadPolizas() }, [c?.id])

  const closePdfVisor = () => {
    if (pdfVisor?.url) URL.revokeObjectURL(pdfVisor.url)
    setPdfVisor(null)
  }

  if (!c) return null

  const logoUrl = window.location.origin + '/logo-sinfondo.png'

  // ── PDF póliza — muestra en overlay con iframe ───────────────────────────
  const handleVerPoliza = async (pol) => {
    if (!pol.id) return
    setPdfLoading(pol.id)
    try {
      // Vista de Clientes: póliza completa con todos los bienes y certificados
      // (sin acotar a un bien — eso es solo en la vista de Bienes).
      const blob = await downloadPolizaPdf(pol.id)
      const url  = URL.createObjectURL(blob)
      setPdfVisor({ url, title: `Póliza — ${pol.nro_contrato}`, nro: pol.nro_contrato })
    } catch (err) {
      showToast('No se pudo generar el PDF: ' + err.message, 'error')
    } finally {
      setPdfLoading(null)
    }
  }

  const POL_STATUS_STYLE = {
    'ACTIVA':    'bg-emerald-100 text-emerald-700',
    'RENOVADA':  'bg-indigo-100 text-indigo-700',
    'VENCIDA':   'bg-amber-100 text-amber-700',
    'ANULADA':   'bg-rose-100 text-rose-700',
    'RECHAZADA': 'bg-slate-200 text-slate-500',
  }

  const q            = search.trim().toLowerCase()
  const polEmitidas  = polizas.filter(p => p.status !== 'RECHAZADA')
  const polRechazadas = polizas.filter(p => p.status === 'RECHAZADA')

  const filtrarPol = (lista) =>
    q ? lista.filter(p => p.nro_contrato?.toLowerCase().includes(q)) : lista

  const emitFiltered = filtrarPol(polEmitidas)
  const rejFiltered  = filtrarPol(polRechazadas)

  return (
    <>
    <ModalShell title={`Pólizas — ${c.nombre || c.nom}`} maxW="max-w-2xl" footer={
      <button onClick={closeModal} className="btn-secondary">Cerrar</button>
    }>
      {/* Buscador + toggle rechazadas */}
      <div className="flex items-center gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            className="input-field pl-8 py-1.5 text-sm"
            placeholder="Buscar por N° de póliza…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        {polRechazadas.length > 0 && (
          <button
            onClick={() => setShowRechazadas(v => !v)}
            className={`shrink-0 text-xs font-semibold px-3 py-1.5 rounded-xl border transition ${
              showRechazadas
                ? 'bg-rose-50 text-rose-600 border-rose-200'
                : 'bg-slate-50 text-slate-500 border-slate-200 hover:border-slate-300'
            }`}
          >
            Rechazadas ({polRechazadas.length})
          </button>
        )}
      </div>

      {loading && (
        <div className="flex justify-center items-center py-10 gap-2 text-slate-400 text-sm">
          <div className="w-4 h-4 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
          Cargando pólizas…
        </div>
      )}

      {!loading && polizas.length === 0 && (
        <div className="py-10 text-center">
          <Shield className="w-10 h-10 text-slate-200 mx-auto mb-3" />
          <p className="text-sm text-slate-400">Este cliente no tiene pólizas registradas.</p>
        </div>
      )}

      {!loading && polizas.length > 0 && (
        <div className="space-y-4">
          {/* Pólizas activas / vencidas */}
          {emitFiltered.length > 0 && (
            <div className="space-y-2">
              {emitFiltered.map(pol => (
                <div key={pol.id} className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center shrink-0 mt-0.5">
                      <FileText className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <span className="text-xs font-bold text-blue-700 font-mono">{pol.nro_contrato}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${POL_STATUS_STYLE[pol.status] ?? 'bg-slate-100 text-slate-500'}`}>
                          {pol.status}
                        </span>
                        {pol.bienes_count > 0 && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-100 text-violet-600 inline-flex items-center gap-1">
                            <Package className="w-3 h-3 shrink-0" />{pol.bienes_count} {pol.bienes_count === 1 ? 'bien' : 'bienes'}
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-semibold text-slate-700 truncate">{pol.producto}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
                        {pol.bien_ref && pol.bien_ref !== '—' && <><Car className="w-3 h-3 shrink-0" />{pol.bien_ref} · </>}
                        {pol.fecha_emision} → {pol.fecha_vencimiento}
                      </p>
                    </div>
                    <p className="shrink-0 text-sm font-bold text-slate-800">{fmtMonto(pol.total, pol.moneda_producto)}</p>
                  </div>
                  {/* Acciones — fila propia de ancho completo: con 5 botones posibles
                      (Ver póliza/Renovar/Editar/Beneficiarios/Bienes) nunca caben junto
                      al texto sin aplastarlo a un hilo de unos pocos píxeles. */}
                  <div className="flex items-center gap-1.5 flex-wrap justify-end mt-2.5">
                      {pol.id && (
                        <button
                          onClick={() => handleVerPoliza(pol)}
                          disabled={pdfLoading === pol.id}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-xs font-semibold text-blue-600 hover:bg-blue-100 transition disabled:opacity-50 disabled:cursor-wait whitespace-nowrap"
                        >
                          {pdfLoading === pol.id
                            ? <><div className="w-4 h-4 border border-blue-400 border-t-transparent rounded-full animate-spin" /> Generando…</>
                            : <><FileText className="w-4 h-4 shrink-0" /> Ver póliza</>
                          }
                        </button>
                      )}
                      {(pol.renovable || pol.renovable_anticipada) && pol.id && canRenew && (
                        <button
                          onClick={async () => {
                            if (renewLoadingId) return
                            setRenewLoadingId(pol.id)
                            try {
                              const info = await fetchRenovacionInfo(pol.id)
                              const dias = pol.fecha_vencimiento_iso
                                ? Math.round((new Date(pol.fecha_vencimiento_iso) - new Date()) / 86400000)
                                : null

                              const clientPayload = {
                                ...c,
                                poliza_id: pol.id,
                                nom: c.nombre,
                                pol: pol.nro_contrato,
                                vig: `${pol.fecha_emision} – ${pol.fecha_vencimiento}`,
                                moneda_producto: pol.moneda_producto,
                                producto_permite_mensualidades: pol.producto_permite_mensualidades,
                                producto_recargo_mensual_pct: pol.producto_recargo_mensual_pct,
                              }

                              if (info.valido) {
                                showModal('renovar', {
                                  client: {
                                    ...clientPayload,
                                    prima: fmtMonto(info.tarifario.prima_anual, pol.moneda_producto),
                                    tarifario_id: info.tarifario.id,
                                  },
                                  diasVencimiento: dias,
                                  onSaved: () => { loadPolizas(); onSaved?.() },
                                })
                              } else {
                                showModal('seleccionarTarifaRenovacion', {
                                  client: clientPayload,
                                  diasVencimiento: dias,
                                  tarifarios: info.tarifarios,
                                  onSaved: () => { loadPolizas(); onSaved?.() },
                                })
                              }
                            } catch (err) {
                              showToast(err.message || 'Error al iniciar renovación', 'error')
                            } finally {
                              setRenewLoadingId(null)
                            }
                          }}
                          disabled={renewLoadingId === pol.id}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-xs font-semibold text-emerald-600 hover:bg-emerald-100 transition whitespace-nowrap disabled:opacity-50"
                        >
                          {renewLoadingId === pol.id ? (
                            <><div className="w-4 h-4 border border-emerald-400 border-t-transparent rounded-full animate-spin" /> Cargando…</>
                          ) : (
                            <><RefreshCw className="w-4 h-4 shrink-0" /> Renovar</>
                          )}
                        </button>
                      )}
                      {pol.id && canAdjust && (
                        <button
                          onClick={() => showModal('ajustarPoliza', {
                            c,
                            polizaId: pol.id,
                            onSave: () => { loadPolizas(); onSaved?.() },
                          })}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-50 text-xs font-semibold text-violet-600 hover:bg-violet-100 transition whitespace-nowrap"
                        >
                          <SlidersHorizontal className="w-4 h-4 shrink-0" /> Editar
                        </button>
                      )}
                      {pol.id && canManageBeneficiarios && pol.status !== 'RECHAZADA' && pol.producto_aplica_beneficiarios && (
                        <button
                          onClick={() => showModal('polizaBeneficiarios', { poliza: pol })}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-fuchsia-50 text-xs font-semibold text-fuchsia-600 hover:bg-fuchsia-100 transition whitespace-nowrap"
                        >
                          <Users className="w-4 h-4 shrink-0" /> Beneficiarios
                        </button>
                      )}
                      {pol.id && canManageBienes && pol.status !== 'RECHAZADA' && pol.producto_permite_multiples_bienes && (
                        <button
                          onClick={() => showModal('polizaBienes', { poliza: pol, personaId: c.id })}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-50 text-xs font-semibold text-sky-600 hover:bg-sky-100 transition whitespace-nowrap"
                        >
                          <Package className="w-4 h-4 shrink-0" /> Bienes
                        </button>
                      )}
                      {pol.id && pol.frecuencia_pago === 'Mensual' && pol.status !== 'RECHAZADA' && (
                        <button
                          onClick={() => showModal('polizaCuotas', { poliza: pol })}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-xs font-semibold text-emerald-600 hover:bg-emerald-100 transition whitespace-nowrap"
                        >
                          <Receipt className="w-4 h-4 shrink-0" /> Cuotas
                        </button>
                      )}
                    </div>
                  {pol.producto_documentos?.map((d, i) => (
                    <a key={i} href={d.url} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-violet-600 hover:text-violet-800 hover:underline justify-end mt-1.5"
                    >
                      <FileText className="w-3.5 h-3.5 shrink-0" /> {d.nombre}
                    </a>
                  ))}
                </div>
              ))}
            </div>
          )}

          {emitFiltered.length === 0 && q && (
            <p className="text-sm text-slate-400 text-center py-6">No se encontró ninguna póliza con ese número.</p>
          )}

          {/* Pólizas rechazadas — solo visibles si el toggle está activo */}
          {showRechazadas && rejFiltered.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Rechazadas ({rejFiltered.length})</p>
              {rejFiltered.map((pol, i) => (
                <div key={`rej-${pol.solicitud_id ?? i}`} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200 opacity-70">
                  <div className="w-9 h-9 rounded-xl bg-slate-200 flex items-center justify-center shrink-0 mt-0.5">
                    <FileText className="w-4 h-4 text-slate-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <span className="text-xs font-bold text-slate-500 font-mono">{pol.nro_contrato}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-500">RECHAZADA</span>
                    </div>
                    <p className="text-xs font-semibold text-slate-500 truncate">{pol.producto}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
                      {pol.bien_ref && pol.bien_ref !== '—' && <><Car className="w-3 h-3 shrink-0" />{pol.bien_ref} · </>}
                      {pol.fecha_emision}
                    </p>
                  </div>
                  <p className="text-sm font-bold text-slate-500 shrink-0">{fmtMonto(pol.total, pol.moneda_producto)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </ModalShell>

    {/* Visor PDF — renderizado fuera del ModalShell para evitar overflow:hidden */}
    {pdfVisor && createPortal(
      <div
        className="fixed inset-0 z-[95] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 sm:p-8"
      >
        <div ref={pdfVisorPanelRef} tabIndex={-1} className="flex flex-col w-full max-w-3xl rounded-xl overflow-hidden shadow-2xl outline-none animate-in zoom-in duration-200" style={{ height: '80vh' }}>
          <div className="flex items-center gap-2 px-4 h-11 bg-[#323639] shrink-0">
            <button onClick={closePdfVisor} className="p-1.5 hover:bg-white/10 rounded-lg transition text-white" title="Cerrar">
              <X className="w-4 h-4" />
            </button>
            <p className="flex-1 text-sm font-semibold text-white truncate">{pdfVisor.title}</p>
            <a
              href={pdfVisor.url}
              download={`poliza-${pdfVisor.nro}.pdf`}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-sm text-white transition"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline font-medium">Descargar</span>
            </a>
          </div>
          <iframe src={pdfVisor.url} className="flex-1 w-full border-0 bg-[#525659]" title={pdfVisor.title} />
        </div>
      </div>,
      document.body
    )}
    </>
  )
}

// ── Formulario de vehículo (crear / editar) ──────────────────────────────────
const VEH_MARCAS = ['Toyota','Chevrolet','Ford','Hyundai','Kia','Jeep','Nissan','Honda','Renault','Mazda','Volkswagen','Mitsubishi','Otro']
const VEH_TIPOS  = ['Sedán','SUV / Rústico','Camioneta','Motocicleta','Comercial','Particular','Otro']
const VEH_CLASES = ['Automóvil','Camioneta','Camión','Moto','Autobús','Otro']
const VEH_USOS   = ['Particular','Carga','Transporte Público','Oficial','Otro']
const VEH_AÑOS   = Array.from({ length: new Date().getFullYear() - 1989 }, (_, i) => String(new Date().getFullYear() - i))

function VehiculoFormModal({ v = {}, clienteOpts = [], onSave }) {
  const { closeModal, showToast } = useApp()
  const isNew = !v.id
  const [form, setForm] = useState({
    cliente_id:           v.cliente_id     ? String(v.cliente_id) : '',
    placa:                v.placa          || '',
    marca:                v.marca          || '',
    modelo:               v.modelo         || '',
    anio:                 v.anio           ? String(v.anio) : '',
    color:                v.color          || '',
    tipo:                 v.tipo           || '',
    clase:                v.clase          || '',
    uso:                  v.uso            || '',
    puestos:              v.puestos        ?? '',
    peso:                 v.peso           ?? '',
    aparcamiento:         v.aparcamiento   || '',
    serial_carroceria:    v.serial_carroceria    || '',
    serial_motor:         v.serial_motor         || '',
    certificado_transito: v.certificado_transito || '',
    certificado_origen:   v.certificado_origen   || '',
    fecha_adquisicion:    v.fecha_adquisicion    || '',
    titulo:               v.titulo               || '',
  })
  const [saving, setSaving] = useState(false)

  const set = (k, val) => setForm(f => ({ ...f, [k]: val }))

  const handleSave = async () => {
    if (!form.cliente_id) { showToast('Selecciona el cliente propietario', 'error'); return }
    if (!form.placa.trim()) { showToast('La placa es obligatoria', 'error'); return }
    if (!form.marca) { showToast('Selecciona la marca', 'error'); return }
    if (!form.modelo.trim()) { showToast('El modelo es obligatorio', 'error'); return }
    if (!form.anio) { showToast('Selecciona el año', 'error'); return }
    setSaving(true)
    try {
      const payload = {
        ...form,
        cliente_id: parseInt(form.cliente_id),
        anio: parseInt(form.anio),
        puestos: form.puestos ? parseInt(form.puestos) || null : null,
        peso:    form.peso    ? parseInt(form.peso)    || null : null,
        fecha_adquisicion: form.fecha_adquisicion || null,
      }
      await onSave(payload)
      closeModal()
      showToast(isNew ? 'Vehículo registrado' : 'Vehículo actualizado', 'success')
    } catch (err) {
      showToast(err.message || 'Error al guardar', 'error')
    } finally {
      setSaving(false)
    }
  }

  const Label = ({ children, req }) => (
    <label className="input-label">{children}{req && <span className="text-rose-500 ml-0.5">*</span>}</label>
  )

  const SecTitle = ({ children }) => (
    <p className="col-span-full text-[10px] font-bold text-slate-400 uppercase tracking-widest pb-1.5 border-b border-slate-100 mb-1 mt-2 first:mt-0">
      {children}
    </p>
  )

  return (
    <ModalShell title={isNew ? 'Registrar Vehículo' : `Editar Vehículo — ${v.placa}`} wide footer={
      <>
        <button onClick={closeModal} disabled={saving} className="btn-secondary">Cancelar</button>
        <button onClick={handleSave} disabled={saving} className="btn-primary disabled:opacity-60">
          {saving
            ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Guardando…</>
            : <><Check className="w-4 h-4" />Guardar</>
          }
        </button>
      </>
    }>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {/* Propietario */}
        <SecTitle>Propietario</SecTitle>
        <div className="col-span-full input-group">
          <Label req>Cliente propietario</Label>
          <select className="select-field" value={form.cliente_id} onChange={e => set('cliente_id', e.target.value)}>
            <option value="" disabled>Seleccionar…</option>
            {clienteOpts.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>

        {/* Datos del vehículo */}
        <SecTitle>Datos del Vehículo</SecTitle>
        <div className="input-group">
          <Label req>Placa</Label>
          <input type="text" className="input-field uppercase" placeholder="ABC-123" value={form.placa} onChange={e => set('placa', e.target.value.toUpperCase())} />
        </div>
        <div className="input-group">
          <Label req>Marca</Label>
          <select className="select-field" value={form.marca} onChange={e => set('marca', e.target.value)}>
            <option value="" disabled>Seleccionar…</option>
            {VEH_MARCAS.map(m => <option key={m}>{m}</option>)}
          </select>
        </div>
        <div className="input-group">
          <Label req>Modelo</Label>
          <input type="text" className="input-field" placeholder="Corolla, Spark…" value={form.modelo} onChange={e => set('modelo', e.target.value)} />
        </div>
        <div className="input-group">
          <Label req>Año</Label>
          <select className="select-field" value={form.anio} onChange={e => set('anio', e.target.value)}>
            <option value="" disabled>Año…</option>
            {VEH_AÑOS.map(a => <option key={a}>{a}</option>)}
          </select>
        </div>
        <div className="input-group">
          <Label>Color</Label>
          <input type="text" className="input-field" placeholder="Blanco, Negro…" value={form.color} onChange={e => set('color', e.target.value)} />
        </div>
        <div className="input-group">
          <Label>Tipo</Label>
          <select className="select-field" value={form.tipo} onChange={e => set('tipo', e.target.value)}>
            <option value="">— Sin especificar —</option>
            {VEH_TIPOS.map(t => <option key={t}>{t}</option>)}
          </select>
        </div>
        <div className="input-group">
          <Label>Clase</Label>
          <select className="select-field" value={form.clase} onChange={e => set('clase', e.target.value)}>
            <option value="">— Sin especificar —</option>
            {VEH_CLASES.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div className="input-group">
          <Label>Uso</Label>
          <select className="select-field" value={form.uso} onChange={e => set('uso', e.target.value)}>
            <option value="">— Sin especificar —</option>
            {VEH_USOS.map(u => <option key={u}>{u}</option>)}
          </select>
        </div>
        <div className="input-group">
          <Label>Puestos</Label>
          <input type="number" min="1" max="60" className="input-field" placeholder="5" value={form.puestos} onChange={e => set('puestos', e.target.value)} />
        </div>
        <div className="input-group">
          <Label>Peso (kg)</Label>
          <input type="number" min="0" className="input-field" placeholder="1500" value={form.peso} onChange={e => set('peso', e.target.value)} />
        </div>
        <div className="input-group">
          <Label>Aparcamiento</Label>
          <input type="text" className="input-field" placeholder="Garaje, Calle…" value={form.aparcamiento} onChange={e => set('aparcamiento', e.target.value)} />
        </div>

        {/* Documentos */}
        <SecTitle>Documentos</SecTitle>
        <div className="input-group">
          <Label>Serial Carrocería</Label>
          <input type="text" className="input-field" value={form.serial_carroceria} onChange={e => set('serial_carroceria', e.target.value)} />
        </div>
        <div className="input-group">
          <Label>Serial Motor</Label>
          <input type="text" className="input-field" value={form.serial_motor} onChange={e => set('serial_motor', e.target.value)} />
        </div>
        <div className="input-group">
          <Label>Cert. Tránsito</Label>
          <input type="text" className="input-field" value={form.certificado_transito} onChange={e => set('certificado_transito', e.target.value)} />
        </div>
        <div className="input-group">
          <Label>Cert. Origen</Label>
          <input type="text" className="input-field" value={form.certificado_origen} onChange={e => set('certificado_origen', e.target.value)} />
        </div>
        <div className="input-group">
          <Label>Fecha Adquisición</Label>
          <input type="date" className="input-field" value={form.fecha_adquisicion} onChange={e => set('fecha_adquisicion', e.target.value)} />
        </div>
        <div className="col-span-full input-group">
          <Label>Título</Label>
          <input type="text" className="input-field" value={form.titulo} onChange={e => set('titulo', e.target.value)} />
        </div>
      </div>
    </ModalShell>
  )
}

// ── Panel de documentos del cliente ─────────────────────────────────────────
/**
 * Muestra y gestiona los documentos del perfil del cliente.
 * Carga en paralelo: documentos subidos, solicitudes del cliente y catálogo de
 * productos. Cruza los datos para mostrar qué documentos obligatorios faltan.
 *
 * @param {Object}   c        Fila del cliente (id, nombre/nom, ci, est…)
 * @param {Function} onSaved  Callback para notificar al padre tras subir/eliminar
 */
function ClienteDocumentosPanel({ c, onSaved }) {
  const { closeModal, showToast, canAct } = useApp()
  const canManage = canAct('clientes', 'view_docs')
  const [docs, setDocs]             = useState([])
  const [solicitudes, setSolicitudes] = useState([])
  const [productos, setProductos]   = useState([])
  const [loading, setLoading]       = useState(true)
  const [tipoDoc, setTipoDoc]       = useState('')
  const [customNombre, setCustomNombre] = useState('')
  const [file, setFile]             = useState(null)
  const [uploading, setUploading]   = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const fileRef = useRef(null)

  useEffect(() => {
    if (!c) return
    Promise.all([
      fetchDocumentosCliente(c.id).catch(() => []),
      fetchSolicitudesCliente(c.id).catch(() => []),
      fetchProductos().catch(() => []),
    ]).then(([d, s, p]) => {
      setDocs(d)
      setSolicitudes(s)
      setProductos(p)
      setLoading(false)
    })
  }, [c?.id])

  // Mapa de productos por id para join rápido
  const prodMap = useMemo(() => {
    const m = {}
    for (const p of productos) m[p.id] = p
    return m
  }, [productos])

  // Requerimientos únicos: union de documentos_requeridos de todas las solicitudes.
  // Usa el snapshot en coberturas si existe, sino el catálogo de productos.
  const allRequired = useMemo(() => {
    const seen = new Map()
    for (const s of solicitudes) {
      const fromSnap = s.coberturas?.documentos_requeridos
      const fromProd = prodMap[s.producto_id]?.documentos_requeridos
      const reqs = (fromSnap?.length ? fromSnap : fromProd) || []
      for (const r of reqs) {
        if (!seen.has(r.nombre)) seen.set(r.nombre, r)
      }
    }
    return [...seen.values()]
  }, [solicitudes, prodMap])

  const uploadedNames = useMemo(
    () => new Set(docs.map(d => d.nombre.toLowerCase())),
    [docs]
  )

  const missingObligatory = allRequired.filter(
    r => r.obligatorio && !uploadedNames.has(r.nombre.toLowerCase())
  )

  const handleUpload = async () => {
    const docNombre = (tipoDoc && tipoDoc !== '__custom__') ? tipoDoc : customNombre.trim()
    if (!file || !docNombre) {
      showToast('Selecciona el tipo de documento y el archivo', 'error')
      return
    }
    setUploading(true)
    try {
      const result = await uploadDocumentoCliente(c.id, docNombre, file)
      setDocs(prev => [...prev, result])
      setTipoDoc('')
      setCustomNombre('')
      setFile(null)
      if (fileRef.current) fileRef.current.value = ''
      onSaved?.()
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (id) => {
    setDeletingId(id)
    try {
      await deleteDocumentoCliente(c.id, id)
      setDocs(prev => prev.filter(d => d.id !== id))
      onSaved?.()
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setDeletingId(null)
    }
  }

  if (!c) return null

  const docNombreActual = (tipoDoc && tipoDoc !== '__custom__') ? tipoDoc : customNombre.trim()

  return (
    <ModalShell title={`Documentos — ${c.nombre || c.nom}`} wide footer={
      <button onClick={closeModal} className="btn-secondary">Cerrar</button>
    }>
      {loading ? (
        <div className="flex items-center gap-2 py-8 text-slate-400 text-sm">
          <div className="w-4 h-4 border-2 border-slate-300 border-t-blue-500 rounded-full animate-spin shrink-0" />
          Cargando documentos…
        </div>
      ) : (
        <div className="space-y-5">

          {/* Alerta de documentos obligatorios faltantes */}
          {missingObligatory.length > 0 && (
            <div className="flex items-start gap-2.5 p-3 bg-rose-50 border border-rose-200 rounded-xl">
              <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="text-xs font-bold text-rose-700 mb-1">
                  {missingObligatory.length} documento{missingObligatory.length !== 1 ? 's' : ''} obligatorio{missingObligatory.length !== 1 ? 's' : ''} pendiente{missingObligatory.length !== 1 ? 's' : ''}
                </p>
                <p className="text-xs text-rose-600 leading-relaxed">
                  {missingObligatory.map(d => d.nombre).join(' · ')}
                </p>
              </div>
            </div>
          )}

          {allRequired.length > 0 && missingObligatory.length === 0 && (
            <div className="flex items-center gap-2.5 p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
              <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
              <p className="text-xs font-semibold text-emerald-700">
                Todos los documentos obligatorios están cargados.
              </p>
            </div>
          )}

          {/* Lista de documentos cargados */}
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2.5">
              Documentos cargados ({docs.length})
            </p>
            {docs.length === 0 ? (
              <div className="py-6 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <FileText className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                <p className="text-sm text-slate-400">Sin documentos cargados</p>
              </div>
            ) : (
              <div className="space-y-1.5">
                {docs.map(d => (
                  <div key={d.id} className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center shrink-0">
                      <FileText className="w-3.5 h-3.5 text-indigo-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-700 truncate">{d.nombre}</p>
                      {d.mime && <p className="text-[10px] text-slate-400 mt-0.5">{d.mime}</p>}
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <a
                        href={d.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2.5 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition inline-flex items-center justify-center"
                        title="Ver documento"
                      >
                        <Eye className="w-[18px] h-[18px]" />
                      </a>
                      {canManage && (
                        <button
                          onClick={() => handleDelete(d.id)}
                          disabled={deletingId === d.id}
                          className="p-2.5 rounded-lg bg-rose-50 text-rose-500 hover:bg-rose-100 transition inline-flex items-center justify-center disabled:opacity-50"
                          title="Eliminar"
                        >
                          {deletingId === d.id
                            ? <div className="w-[18px] h-[18px] border-2 border-rose-300 border-t-rose-600 rounded-full animate-spin" />
                            : <Trash2 className="w-[18px] h-[18px]" />
                          }
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Formulario de subida */}
          {canManage && (
          <div className="pt-3 border-t border-slate-100">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Agregar Documento</p>
            <div className="space-y-2.5">
              {allRequired.length > 0 ? (
                <div>
                  <label className="field-label">Tipo de documento <span className="text-rose-500">*</span></label>
                  <select
                    className="select-field"
                    value={tipoDoc}
                    onChange={e => { setTipoDoc(e.target.value); setCustomNombre('') }}
                  >
                    <option value="">— Seleccionar —</option>
                    {allRequired.map(r => (
                      <option key={r.nombre} value={r.nombre}>
                        {r.nombre}{r.obligatorio ? ' *' : ''}
                        {uploadedNames.has(r.nombre.toLowerCase()) ? ' ✓' : ''}
                      </option>
                    ))}
                    <option value="__custom__">Otro (escribir)…</option>
                  </select>
                  {tipoDoc === '__custom__' && (
                    <input
                      className="input-field mt-2"
                      placeholder="Nombre del documento…"
                      value={customNombre}
                      onChange={e => setCustomNombre(e.target.value)}
                    />
                  )}
                </div>
              ) : (
                <div>
                  <label className="field-label">Nombre del documento <span className="text-rose-500">*</span></label>
                  <input
                    className="input-field"
                    placeholder="Ej. Cédula de Identidad, RIF, Carnet de Conducir…"
                    value={customNombre}
                    onChange={e => setCustomNombre(e.target.value)}
                  />
                </div>
              )}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="flex-1 flex items-center gap-2 p-2.5 rounded-xl border-2 border-dashed border-slate-200 text-slate-500 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50 transition text-sm"
                >
                  <Upload className="w-4 h-4 shrink-0" />
                  <span className="truncate">{file ? file.name : 'Seleccionar archivo…'}</span>
                </button>
                <button
                  onClick={handleUpload}
                  disabled={uploading || !file || !docNombreActual}
                  className="btn-primary disabled:opacity-50"
                >
                  {uploading
                    ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    : <Check className="w-4 h-4" />
                  }
                  Subir
                </button>
              </div>
              <input
                ref={fileRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                className="hidden"
                onChange={e => setFile(e.target.files?.[0] ?? null)}
              />
              <p className="text-[10px] text-slate-400">PDF, JPG, PNG, DOC · Máx. 10 MB</p>
            </div>
          </div>
          )}

          {/* Estado de requerimientos */}
          {allRequired.length > 0 && (
            <div className="pt-3 border-t border-slate-100">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2.5">
                Estado de requerimientos
              </p>
              <div className="space-y-1.5">
                {allRequired.map(r => {
                  const present = uploadedNames.has(r.nombre.toLowerCase())
                  return (
                    <div
                      key={r.nombre}
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-xl ${
                        present
                          ? 'bg-emerald-50 border border-emerald-100'
                          : r.obligatorio
                            ? 'bg-rose-50 border border-rose-100'
                            : 'bg-slate-50 border border-slate-100'
                      }`}
                    >
                      {present
                        ? <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                        : r.obligatorio
                          ? <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                          : <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                      }
                      <p className={`flex-1 text-xs font-medium truncate ${
                        present ? 'text-emerald-700' : r.obligatorio ? 'text-rose-700' : 'text-slate-500'
                      }`}>{r.nombre}</p>
                      {r.obligatorio && !present && (
                        <span className="text-[10px] font-bold text-rose-500 bg-rose-100 px-2 py-0.5 rounded-full shrink-0 whitespace-nowrap">
                          Pendiente
                        </span>
                      )}
                      {present && (
                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full shrink-0 whitespace-nowrap">
                          Presente
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
              <p className="text-[10px] text-slate-400 mt-2.5 leading-relaxed">
                * Requerimientos basados en las solicitudes registradas del cliente.
                Los campos marcados con * son obligatorios.
              </p>
            </div>
          )}
        </div>
      )}
    </ModalShell>
  )
}

// ── Constantes del formulario de cliente ─────────────────────────────────────
const ESTADOS_VE_OPT = [
  'Amazonas','Anzoátegui','Apure','Aragua','Barinas','Bolívar','Carabobo',
  'Cojedes','Delta Amacuro','Distrito Capital','Falcón','Guárico','Lara',
  'Mérida','Miranda','Monagas','Nueva Esparta','Portuguesa','Sucre',
  'Táchira','Trujillo','La Guaira','Yaracuy','Zulia',
]
const CL_CONDICION    = ['Soltero/a', 'Casado/a', 'Viudo/a', 'Divorciado/a', 'Concubino/a']
const CL_SEXO         = ['Masculino', 'Femenino']
const CL_NACIONALIDAD = ['Venezolano/a', 'Extranjero/a']

// ── Formulario de cliente (crear / editar) ────────────────────────────────────
// Teléfono venezolano para el formulario de cliente: prefijo "+58" fijo (no se
// puede borrar) + hasta 11 dígitos, solo numérico (sin símbolos).
const soloDigitosVE = (v) => {
  const s = String(v ?? '').trim()
  const rest = s.startsWith('+58') ? s.slice(3) : s
  return rest.replace(/\D/g, '').slice(0, 11)
}
const conPrefijoVE = (digits) => (digits ? '+58 ' + digits : '')

function TelInputVE({ value, onChange, placeholder }) {
  const digits = soloDigitosVE(value)
  return (
    <div className="flex items-stretch">
      <span className="inline-flex items-center px-3 rounded-l-xl border border-r-0 border-slate-200 bg-slate-100 text-slate-500 text-sm font-bold select-none" aria-hidden="true">+58</span>
      <input
        type="tel"
        inputMode="numeric"
        className="input-field rounded-l-none min-w-0"
        value={digits}
        onChange={e => onChange(conPrefijoVE(e.target.value.replace(/\D/g, '').slice(0, 11)))}
        placeholder={placeholder}
        maxLength={11}
      />
    </div>
  )
}

function ClienteFormModal({ cliente, onSave }) {
  const { closeModal, showToast, canAct } = useApp()
  const isNew = !cliente?.id
  const canReasignar = canAct('clientes', 'reasignar')
  const [vendedores, setVendedores] = useState([])
  const [vendedorId, setVendedorId] = useState(cliente?.vendedor_id ?? '')
  const [form, setForm] = useState({
    nombre:        cliente?.nombre || '',
    cedula:        cliente?.cedula || cliente?.ci || '',
    condicion:     cliente?.condicion || '',
    sexo:          cliente?.sexo || '',
    nacimiento:    cliente?.nacimiento || '',
    nacionalidad:  cliente?.nacionalidad || '',
    telefono:      cliente?.telefono || '',
    celular:       cliente?.celular || '',
    correo:        cliente?.correo || cliente?.email || '',
    estado:        cliente?.estado || '',
    ciudad:        cliente?.ciudad || '',
    codigo_postal: cliente?.codigo_postal || '',
    direccion:     cliente?.direccion || '',
    profesion:     cliente?.profesion || '',
    actividad:     cliente?.actividad || '',
  })
  const [saving, setSaving] = useState(false)
  const f = (k, filtro) => e => setForm(p => ({ ...p, [k]: filtro ? filtro(e.target.value) : e.target.value }))

  // Cédula / RIF en dos partes: prefijo (V/E/J/G/P) + dígitos. Se combinan en
  // form.cedula con formato 'V-12345678', evitando que el usuario teclee un
  // formato inválido que el backend rechazaría (regla CedulaValida).
  const ciPrefijo = (form.cedula.match(/^([VEJGP])/i)?.[1] || 'V').toUpperCase()
  const ciNumero  = form.cedula.replace(/^[VEJGP]-?/i, '').replace(/\D/g, '')
  const setCedula = (pref, num) => setForm(p => ({ ...p, cedula: `${pref}-${num}` }))

  // Vendedor asignado: editable solo al editar y con permiso de reasignar.
  useEffect(() => {
    if (!canReasignar || isNew) return
    fetchVendedoresDisponibles().then(setVendedores).catch(() => {})
  }, [canReasignar, isNew])

  const handleSave = async () => {
    if (!form.nombre.trim())    { showToast('El nombre es obligatorio', 'error'); return }
    if (!form.cedula.trim())    { showToast('La cédula / RIF es obligatoria', 'error'); return }
    if (!/^[VEJGP]-?\d{6,9}(-?\d)?$/i.test(form.cedula.trim())) { showToast('Cédula / RIF inválida: debe tener 6 a 9 dígitos (ej. V-12345678).', 'error'); return }
    if (!form.condicion)        { showToast('Selecciona la condición civil', 'error'); return }
    if (!form.sexo)             { showToast('Selecciona el sexo', 'error'); return }
    if (!form.nacimiento)       { showToast('La fecha de nacimiento es obligatoria', 'error'); return }
    if (!form.nacionalidad)     { showToast('Selecciona la nacionalidad', 'error'); return }
    if (!soloDigitosVE(form.celular)) { showToast('El celular es obligatorio', 'error'); return }
    if (!form.correo.trim())    { showToast('El correo electrónico es obligatorio', 'error'); return }
    if (!form.estado)           { showToast('Selecciona el estado', 'error'); return }
    if (!form.ciudad.trim())    { showToast('La ciudad es obligatoria', 'error'); return }
    if (!form.direccion.trim()) { showToast('La dirección es obligatoria', 'error'); return }
    setSaving(true)
    try {
      // El 2º argumento (vendedor) solo se usa al editar; en crear se ignora.
      await onSave(form, canReasignar && !isNew ? vendedorId : undefined)
      closeModal()
      showToast(isNew ? 'Cliente creado correctamente' : 'Cliente actualizado', 'success')
    } catch (err) {
      showToast(err.message || 'Error al guardar', 'error')
    } finally {
      setSaving(false)
    }
  }

  const Lbl = ({ children, req }) => (
    <label className="field-label">{children}{req && <span className="text-rose-500 ml-0.5">*</span>}</label>
  )

  return (
    <ModalShell
      title={isNew ? 'Nuevo Cliente' : `Editar — ${cliente.nombre || cliente.nom}`}
      eyebrow="Cliente"
      Icon={UserCheck}
      maxW="max-w-3xl"
      footer={
        <>
          <button onClick={closeModal} disabled={saving} className="btn-secondary">Cancelar</button>
          <button onClick={handleSave} disabled={saving} className="btn-primary disabled:opacity-60">
            {saving
              ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Guardando…</>
              : <><Check className="w-4 h-4" />{isNew ? 'Crear Cliente' : 'Guardar'}</>}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <SecPanel Icon={UserCheck} title="Datos Personales">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <Lbl req>Nombre completo</Lbl>
              <input className="input-field" value={form.nombre} onChange={f('nombre')} placeholder="Nombre y Apellido" />
            </div>
            <div>
              <Lbl req>CI / RIF</Lbl>
              <div className="flex gap-1">
                <select className="select-field font-bold w-16 shrink-0" value={ciPrefijo} onChange={e => setCedula(e.target.value, ciNumero)}>
                  <option value="V">V</option>
                  <option value="E">E</option>
                  <option value="J">J</option>
                  <option value="G">G</option>
                  <option value="P">P</option>
                </select>
                <input className="input-field font-mono flex-1" value={ciNumero} onChange={e => setCedula(ciPrefijo, e.target.value.replace(/\D/g, ''))} placeholder="12345678" maxLength={10} />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">V=venezolano · E=extranjero · J/G=empresa · P=pasaporte</p>
            </div>
            <div>
              <Lbl req>Condición civil</Lbl>
              <select className="select-field" value={form.condicion} onChange={f('condicion')}>
                <option value="">— Seleccionar —</option>
                {CL_CONDICION.map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <Lbl req>Sexo</Lbl>
              <Segmented value={form.sexo} onChange={v => setForm(p => ({ ...p, sexo: v }))} options={CL_SEXO} />
            </div>
            <div>
              <Lbl req>Fecha de nacimiento</Lbl>
              <input type="date" className="input-field" value={form.nacimiento} onChange={f('nacimiento')}
                max={new Date(Date.now() - 18 * 365.25 * 864e5).toISOString().slice(0, 10)} />
              <p className="text-[10px] text-slate-400 mt-1">El cliente debe ser mayor de edad (18+).</p>
            </div>
            <div className="sm:col-span-2">
              <Lbl req>Nacionalidad</Lbl>
              <select className="select-field" value={form.nacionalidad} onChange={f('nacionalidad')}>
                <option value="">— Seleccionar —</option>
                {CL_NACIONALIDAD.map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
          </div>
        </SecPanel>

        <SecPanel Icon={Phone} title="Contacto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Lbl>Teléfono fijo</Lbl>
              <TelInputVE value={form.telefono} onChange={v => setForm(p => ({ ...p, telefono: v }))} placeholder="0212 1234567" />
            </div>
            <div>
              <Lbl req>Celular</Lbl>
              <TelInputVE value={form.celular} onChange={v => setForm(p => ({ ...p, celular: v }))} placeholder="0414 1234567" />
            </div>
            <div className="sm:col-span-2">
              <Lbl req>Correo electrónico</Lbl>
              <input type="email" className="input-field" value={form.correo} onChange={f('correo')} placeholder="correo@ejemplo.com" />
            </div>
          </div>
        </SecPanel>

        <SecPanel Icon={MapPin} title="Dirección">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Lbl req>Estado</Lbl>
              <select className="select-field" value={form.estado} onChange={f('estado')}>
                <option value="">— Seleccionar —</option>
                {ESTADOS_VE_OPT.map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <Lbl req>Ciudad</Lbl>
              <input className="input-field" list="ciudades-cliente" value={form.ciudad} onChange={f('ciudad')} placeholder="Ciudad o municipio" autoComplete="off" />
              <datalist id="ciudades-cliente">
                {ciudadesDe(form.estado).map(c => <option key={c} value={c} />)}
              </datalist>
            </div>
            <div>
              <Lbl>Código postal</Lbl>
              <input className="input-field" value={form.codigo_postal} onChange={f('codigo_postal', filtrarSoloDigitos)} placeholder="1010" maxLength={10} />
            </div>
            <div className="sm:col-span-2">
              <Lbl req>Dirección</Lbl>
              <textarea rows={2} className="input-field resize-none" value={form.direccion} onChange={f('direccion')} placeholder="Av. Principal, Edif. …" />
            </div>
          </div>
        </SecPanel>

        <SecPanel Icon={Briefcase} title="Actividad Económica">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Lbl>Profesión</Lbl>
              <input className="input-field" value={form.profesion} onChange={f('profesion')} placeholder="Ej. Ingeniero, Médico…" />
            </div>
            <div>
              <Lbl>Actividad económica</Lbl>
              <input className="input-field" value={form.actividad} onChange={f('actividad')} placeholder="Ej. Comercio, Servicios…" />
            </div>
          </div>
        </SecPanel>

        {canReasignar && !isNew && (
          <SecPanel Icon={UserCheck} title="Vendedor asignado">
            <select
              className="select-field"
              value={vendedorId}
              onChange={e => setVendedorId(e.target.value ? Number(e.target.value) : '')}
            >
              <option value="">— Sin asignar —</option>
              {cliente?.vendedor_id && !vendedores.some(v => v.id === cliente.vendedor_id) && (
                <option value={cliente.vendedor_id}>{cliente.vendedor_nombre || `Vendedor #${cliente.vendedor_id}`}</option>
              )}
              {vendedores.map(v => <option key={v.id} value={v.id}>{v.nombre} ({v.tipo})</option>)}
            </select>
            <p className="text-[11px] text-slate-400 mt-1">Al cambiarlo, el cliente y sus datos pasan a ese vendedor.</p>
          </SecPanel>
        )}
      </div>
    </ModalShell>
  )
}

// ── Despachador principal ────────────────────────────────────────────────────
/**
 * Lee el modal activo del contexto global y renderiza el componente correspondiente.
 * Si no hay modal abierto (modal === null) no renderiza nada.
 */
export default function Modal() {
  const { modal } = useApp()
  if (!modal) return null

  const { type, props } = modal
  switch (type) {
    case 'confirmDelete':   return <ConfirmDeleteModal {...props} />
    case 'elegirMonedaPdf': return <ElegirMonedaPdfModal {...props} />
    case 'confirmTasa':     return <ConfirmTasaModal {...props} />
    case 'confirmAction':   return <ConfirmActionModal {...props} />
    case 'noteView':        return <NoteViewModal {...props} />
    case 'auditoriaDetail': return <AuditoriaDetailModal {...props} />
    case 'desbloquearUsuario': return <DesbloquearUsuarioModal {...props} />
    case 'actionMenu':      return <ActionMenuModal {...props} />
    case 'editForm':        return <EditFormModal {...props} />
    case 'renovar':              return <RenovarModal {...props} />
    case 'seleccionarTarifaRenovacion': return <SeleccionarTarifaRenovacionModal {...props} />
    case 'emitirCotizacion':     return <EmitirCotizacionModal {...props} />
    case 'vehiculoForm':    return <VehiculoFormModal {...props} />
    case 'vehiculoDetail':  return <VehiculoDetailModal {...props} />
    case 'productoDetail':  return <ProductoDetailModal {...props} />
    case 'productoTasas':        return <ProductoTasasModal {...props} />
    case 'productoDocumentos':   return <ProductoDocumentosModal {...props} />
    case 'newUser':         return <NewUserModal {...props} />
    case 'editUser':        return <EditUserModal {...props} />
    case 'changeRole':      return <ChangeRoleModal {...props} />
    case 'userPerms':       return <UserPermsModal {...props} />
    case 'blockUser':       return <BlockUserModal {...props} />
    case 'blockCliente':    return <BlockClienteModal {...props} />
    case 'clienteForm':     return <ClienteFormModal {...props} />
    case 'clienteDetail':   return <ClienteDetailModal {...props} />
    case 'clienteDocs':     return <ClienteDocsModal {...props} />
    case 'clienteFacturas': return <ClienteFacturasModal {...props} />
    case 'ajustarPoliza':        return <AjustarPolizaModal {...props} />
    case 'polizaBeneficiarios':  return <PolizaBeneficiariosModal {...props} />
    case 'polizaBienes':         return <PolizaBienesModal {...props} />
    case 'polizaCuotas':         return <PolizaCuotasModal {...props} />
    case 'clienteSolicitudes':  return <ClienteSolicitudesModal {...props} />
    case 'clienteHistorial':      return <ClienteHistorialModal {...props} />
    case 'clienteDocumentos':     return <ClienteDocumentosPanel {...props} />
    default:                      return null
  }
}
