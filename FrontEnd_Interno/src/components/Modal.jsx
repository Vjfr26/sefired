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
import { useRef } from 'react'
import { X, Trash2, Check, Lock, LockOpen, ShieldCheck, Building, UserCheck, Truck, UserCog, Car, Shield, DollarSign } from 'lucide-react'
import { useApp } from '../context/AppContext.jsx'
import FormGrid from './FormGrid.jsx'
import { fmtMonto } from '../utils/helpers.jsx'

// ── Estructura base de todos los modales ────────────────────────────────────
function ModalShell({ title, children, footer, wide = false }) {
  const { closeModal } = useApp()
  return (
    // Fondo oscuro; clic en él cierra el modal
    <div
      className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4 sm:p-6 backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget) closeModal() }}
    >
      {/* wide=true amplía el modal para formularios con más columnas */}
      <div className={`bg-white rounded-3xl shadow-2xl w-full ${wide ? 'max-w-xl' : 'max-w-lg'} max-h-[90vh] overflow-y-auto animate-in zoom-in duration-200`}>
        <div className="p-6 sm:p-8">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-lg font-bold text-slate-800">{title}</h3>
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

  const handleDelete = async () => {
    if (onConfirm) {
      try {
        await onConfirm()
        closeModal()
        showToast(`${name} eliminado`, 'error')
      } catch (err) {
        showToast(err.message || 'Error al eliminar', 'error')
      }
    } else {
      closeModal()
      showToast(`${name} eliminado`, 'error')
    }
  }

  return (
    <ModalShell title="Confirmar eliminación" footer={
      <>
        <button onClick={closeModal} className="btn-secondary">Cancelar</button>
        <button onClick={handleDelete} className="btn-danger">
          <Trash2 className="w-4 h-4" />Eliminar
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

  const handleSave = async () => {
    // Usa la validación nativa del navegador (required, type, etc.)
    if (!formRef.current.reportValidity()) return

    if (!onSave) {
      closeModal()
      showToast('Cambios guardados', 'success')
      return
    }
    // FormData captura todos los campos con su atributo `name` en un solo paso
    const data = Object.fromEntries(new FormData(formRef.current))
    try {
      await onSave(data)
      closeModal()
      showToast('Cambios guardados', 'success')
    } catch (err) {
      showToast(err.message || 'Error al guardar', 'error')
    }
  }

  return (
    <ModalShell title={title} wide={wide} footer={
      <>
        <button onClick={closeModal} className="btn-secondary">Cancelar</button>
        <button onClick={handleSave} className="btn-primary">
          <Check className="w-4 h-4" />Guardar
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

// ── Renovar póliza ───────────────────────────────────────────────────────────
/**
 * Muestra un resumen de la póliza actual del cliente y pide confirmación
 * para renovarla por un período adicional. La renovación real es una operación
 * pendiente de implementar en el backend.
 *
 * @param {Object} client  Datos del cliente (nom, pol, vig, prima)
 */
function RenovarModal({ client }) {
  const { closeModal, showToast } = useApp()
  if (!client) return null
  return (
    <ModalShell title="Renovar Póliza" footer={
      <>
        <button onClick={closeModal} className="btn-secondary">Cancelar</button>
        <button onClick={() => { closeModal(); showToast('Póliza renovada correctamente', 'success') }} className="btn-success">
          <Check className="w-4 h-4" />Confirmar Renovación
        </button>
      </>
    }>
      <div className="space-y-3 text-sm">
        <div className="flex justify-between py-2 border-b border-slate-100"><span className="text-slate-500">Cliente</span><span className="font-semibold">{client.nom}</span></div>
        <div className="flex justify-between py-2 border-b border-slate-100"><span className="text-slate-500">Póliza</span><span className="font-mono font-semibold text-blue-700">{client.pol}</span></div>
        <div className="flex justify-between py-2 border-b border-slate-100"><span className="text-slate-500">Vigencia actual</span><span className="font-semibold">{client.vig}</span></div>
        <div className="flex justify-between py-2"><span className="text-slate-500">Prima</span><span className="font-bold text-emerald-700">{client.prima}</span></div>
        <div className="mt-4 p-3 bg-amber-50 rounded-xl text-xs text-amber-700">Se generará una nueva póliza con las mismas coberturas por un año adicional.</div>
      </div>
    </ModalShell>
  )
}

// ── Nuevo usuario ────────────────────────────────────────────────────────────
/** Formulario para crear un usuario del sistema (administradores, vendedores, etc.) */
function NewUserModal() {
  const { closeModal, showToast } = useApp()
  const fields = [
    { label: 'Nombre completo' },
    { label: 'Correo electrónico', type: 'email', ph: 'usuario@sefired.com' },
    { label: 'Contraseña temporal', type: 'password', ph: '••••••••' },
    { label: 'Confirmar contraseña', type: 'password', ph: '••••••••' },
    { label: 'Rol', type: 'select', opts: ['Admin','Oficina','Vendedor Sucursal','Vendedor Calle'] },
    { label: 'Oficina', type: 'select', opts: ['Caracas Principal','Valencia','Maracaibo'] },
    { label: 'Teléfono', ph: '+58 414-000-0000', span: true },
  ]
  return (
    <ModalShell title="Nuevo Usuario" footer={
      <>
        <button onClick={closeModal} className="btn-secondary">Cancelar</button>
        <button onClick={() => { closeModal(); showToast('Usuario creado correctamente', 'success') }} className="btn-primary">
          <Check className="w-4 h-4" />Crear Usuario
        </button>
      </>
    }>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormGrid fields={fields} />
      </div>
    </ModalShell>
  )
}

// ── Editar usuario ───────────────────────────────────────────────────────────
/** Formulario para modificar los datos de un usuario existente. */
function EditUserModal({ nom, email, rol, oficina }) {
  const { closeModal, showToast } = useApp()
  const fields = [
    { label: 'Nombre completo', val: nom },
    { label: 'Correo electrónico', type: 'email', val: email },
    { label: 'Rol', type: 'select', opts: ['Admin','Oficina','Vendedor Sucursal','Vendedor Calle'], val: rol },
    { label: 'Oficina', type: 'select', opts: ['Caracas Principal','Valencia','Maracaibo'], val: oficina },
    { label: 'Teléfono', ph: '+58 414-000-0000' },
    { label: 'Nueva contraseña', type: 'password', ph: '••••••••' },
  ]
  return (
    <ModalShell title={`Editar Usuario — ${nom}`} footer={
      <>
        <button onClick={closeModal} className="btn-secondary">Cancelar</button>
        <button onClick={() => { closeModal(); showToast('Usuario actualizado correctamente', 'success') }} className="btn-primary">
          <Check className="w-4 h-4" />Guardar Cambios
        </button>
      </>
    }>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormGrid fields={fields} />
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
function ChangeRoleModal({ nom, currentRol }) {
  const { closeModal, showToast } = useApp()
  return (
    <ModalShell title={`Cambiar Rol — ${nom}`} footer={
      <>
        <button onClick={closeModal} className="btn-secondary">Cancelar</button>
        <button onClick={() => { closeModal(); showToast('Rol actualizado correctamente', 'success') }} className="btn-primary">
          <Check className="w-4 h-4" />Cambiar Rol
        </button>
      </>
    }>
      <p className="text-xs text-slate-500 mb-4">Rol actual: <strong>{currentRol}</strong>. Selecciona el nuevo rol para este usuario.</p>
      <div className="space-y-2.5">
        {ROLE_OPTIONS.map(r => (
          <label key={r.key} className={`flex items-start gap-3 p-4 rounded-2xl border-2 cursor-pointer transition-all ${r.key === currentRol ? 'border-sefired-blue bg-blue-50/40' : 'border-slate-200 hover:border-slate-300 bg-white'}`}>
            <input type="radio" name="rol-select" defaultValue={r.key} defaultChecked={r.key === currentRol} className="mt-0.5 accent-blue-700 shrink-0" />
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <r.Icon className="w-4 h-4 text-sefired-blue shrink-0" />
                <p className="font-bold text-slate-800 text-sm">{r.key}</p>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">{r.desc}</p>
            </div>
          </label>
        ))}
      </div>
    </ModalShell>
  )
}

// ── Permisos de usuario ───────────────────────────────────────────────────────
/**
 * Lista los permisos por módulo del usuario y permite ajustarlos individualmente.
 * Los estados iniciales de los checkboxes se derivan del rol del usuario.
 */
function UserPermsModal({ nom, rol }) {
  const { closeModal, showToast } = useApp()
  const isAdmin  = rol === 'Admin'
  const isOfic   = isAdmin || rol === 'Oficina'
  const isVend   = isOfic  || rol.startsWith('Vendedor')
  const isVCalle = rol === 'Vendedor Calle'

  const sections = [
    { label: 'Cotizaciones', perms: [
      { label: 'Ver cotizaciones',          on: isVend },
      { label: 'Crear nuevas cotizaciones', on: isVend },
      { label: 'Aprobar / rechazar',        on: isOfic },
      { label: 'Eliminar cotizaciones',     on: isAdmin },
    ]},
    { label: 'Clientes y Vehículos', perms: [
      { label: 'Ver clientes y vehículos',  on: isVend },
      { label: 'Crear y editar clientes',   on: isVend && !isVCalle },
      { label: 'Gestionar pólizas',         on: isOfic },
      { label: 'Eliminar registros',        on: isAdmin },
    ]},
    { label: 'Reportes', perms: [
      { label: 'Ver reportes',              on: isOfic },
      { label: 'Exportar reportes (PDF/XLS)',on: isAdmin },
    ]},
    { label: 'Parámetros y Configuración', perms: [
      { label: 'Consultar tasas BCV',       on: isVend },
      { label: 'Registrar tasas BCV',       on: isAdmin },
      { label: 'Gestionar productos',       on: isAdmin },
      { label: 'Gestionar usuarios',        on: isAdmin },
      { label: 'Configuración del sistema', on: isAdmin },
    ]},
  ]

  return (
    <ModalShell title={`Permisos — ${nom}`} footer={
      <>
        <button onClick={closeModal} className="btn-secondary">Cancelar</button>
        <button onClick={() => { closeModal(); showToast('Permisos guardados correctamente', 'success') }} className="btn-primary">
          <Check className="w-4 h-4" />Guardar Permisos
        </button>
      </>
    }>
      <div className="mb-4 flex items-center gap-3 p-3 rounded-xl bg-blue-50 border border-blue-200">
        <UserCog className="w-4 h-4 text-blue-600 shrink-0" />
        <p className="text-xs text-blue-700">Permisos base del rol <strong>{rol}</strong>. Puedes ajustarlos individualmente.</p>
      </div>
      <div className="space-y-5 max-h-[55vh] overflow-y-auto pr-1">
        {sections.map(sec => (
          <div key={sec.label}>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">{sec.label}</p>
            <div className="space-y-1.5">
              {sec.perms.map(p => (
                <label key={p.label} className="flex items-center gap-3 p-2.5 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50 transition-colors">
                  <input type="checkbox" defaultChecked={p.on} className="w-4 h-4 accent-blue-700 shrink-0" />
                  <span className="text-sm text-slate-700">{p.label}</span>
                  {!p.on && <span className="ml-auto text-xs font-bold uppercase text-slate-300 tracking-wide shrink-0">Sin acceso</span>}
                </label>
              ))}
            </div>
          </div>
        ))}
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
      <div className="grid grid-cols-2 gap-x-6 gap-y-4">{children}</div>
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
          <div className="col-span-2">
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

  const fmtId = id => 'PRO-' + String(id).padStart(4, '0')

  return (
    <ModalShell title={`Producto — ${fmtId(p.id)}`} wide footer={
      <button onClick={closeModal} className="btn-secondary">Cerrar</button>
    }>
      {/* Cabecera con ícono, nombre y moneda */}
      <div className="flex items-center gap-3 mb-5 p-3 bg-slate-50 rounded-2xl">
        <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
          <Shield className="w-5 h-5 text-indigo-600" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-bold text-slate-800 truncate">{p.nombre}</p>
          <p className="text-xs text-slate-400 font-mono">{fmtId(p.id)}</p>
        </div>
        <span className={`text-xs font-bold px-2.5 py-1 rounded-full shrink-0 ${
          p.moneda === 'USD' ? 'bg-emerald-100 text-emerald-700'
        : p.moneda === 'EUR' ? 'bg-amber-100 text-amber-700'
        :                      'bg-blue-100 text-blue-700'
        }`}>{p.moneda}</span>
      </div>

      <div className="mb-5">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Descripción</p>
        <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 rounded-xl p-3 border border-slate-100">
          {p.descripcion || <span className="text-slate-300">Sin descripción</span>}
        </p>
      </div>

      {/* Tarjetas de cifras clave: prima base y cobertura máxima */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl">
          <div className="flex items-center gap-1.5 mb-2">
            <DollarSign className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Prima Base</p>
          </div>
          <p className="text-2xl font-black text-emerald-800">{fmtMonto(p.prima, p.moneda)}</p>
          <p className="text-xs text-emerald-600 mt-1">{p.moneda} · Anual</p>
        </div>
        <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl">
          <div className="flex items-center gap-1.5 mb-2">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
            <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">Cobertura Máx.</p>
          </div>
          <p className="text-2xl font-black text-indigo-800">{fmtMonto(p.cobertura, p.moneda)}</p>
          <p className="text-xs text-indigo-600 mt-1">{p.moneda} · Suma asegurada</p>
        </div>
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
  const isActive = activo !== false   // undefined y true se tratan igual: está activo

  const handleConfirm = async () => {
    if (onConfirm) {
      try {
        await onConfirm()
        closeModal()
        showToast(isActive ? 'Cliente desactivado' : 'Cliente activado', isActive ? 'error' : 'success')
      } catch (err) {
        showToast(err.message || 'Error al cambiar estado', 'error')
      }
    } else {
      closeModal()
    }
  }

  return (
    <ModalShell title={isActive ? 'Desactivar cliente' : 'Activar cliente'} footer={
      <>
        <button onClick={closeModal} className="btn-secondary">Cancelar</button>
        <button onClick={handleConfirm} className={isActive ? 'btn-danger' : 'btn-success'}>
          {isActive ? <Lock className="w-4 h-4" /> : <LockOpen className="w-4 h-4" />}
          {isActive ? 'Desactivar' : 'Activar'}
        </button>
      </>
    }>
      <div className="flex items-start gap-4">
        <div className={`w-12 h-12 rounded-full ${isActive ? 'bg-orange-100' : 'bg-emerald-100'} flex items-center justify-center shrink-0`}>
          {isActive ? <Lock className="w-6 h-6 text-orange-600" /> : <LockOpen className="w-6 h-6 text-emerald-600" />}
        </div>
        <div className="min-w-0">
          <p className="font-bold text-slate-800 mb-1">{isActive ? 'Desactivar' : 'Activar'} a <em>{nom}</em></p>
          <p className="text-sm text-slate-500 leading-relaxed">
            {isActive
              ? 'El cliente quedará como Bloqueado. Sus pólizas y datos se conservarán intactos.'
              : 'El cliente recuperará el estado activo y podrá operar normalmente.'}
          </p>
        </div>
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
      <div className="grid grid-cols-2 gap-x-6 gap-y-4">{children}</div>
    </div>
  )

  // Color del badge de estado: verde activo, rojo bloqueado, gris inactivo
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
        <Section title="Datos Personales">
          <Field label="Sexo"          value={c.sexo} />
          <Field label="Condición"     value={c.condicion} />
          <Field label="Nacimiento"    value={c.nacimiento} />
          <Field label="Nacionalidad"  value={c.nacionalidad} />
        </Section>

        <Section title="Contacto">
          <Field label="Teléfono"      value={c.telefono} />
          <Field label="Celular"       value={c.celular} />
          <div className="col-span-2">
            <Field label="Correo"      value={c.correo || c.email} />
          </div>
        </Section>

        <Section title="Dirección">
          <Field label="Estado"        value={c.estado} />
          <Field label="Ciudad"        value={c.ciudad} />
          <Field label="Código Postal" value={c.codigo_postal} />
          <div className="col-span-2">
            <Field label="Dirección"   value={c.direccion} />
          </div>
        </Section>

        <Section title="Actividad Económica">
          <Field label="Profesión"     value={c.profesion} />
          <Field label="Actividad"     value={c.actividad} />
        </Section>

        <Section title="Póliza Actual">
          <Field label="Nro. Póliza"   value={c.pol} />
          <Field label="Prima"         value={c.prima} />
          <div className="col-span-2">
            <Field label="Vigencia"    value={c.vig} />
          </div>
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
function BlockUserModal({ nom, est }) {
  const { closeModal, showToast } = useApp()
  const isBlocked = est === 'Bloqueado'
  return (
    <ModalShell title={isBlocked ? 'Desbloquear usuario' : 'Bloquear usuario'} footer={
      <>
        <button onClick={closeModal} className="btn-secondary">Cancelar</button>
        <button
          onClick={() => { closeModal(); showToast(isBlocked ? 'Usuario desbloqueado' : 'Usuario bloqueado correctamente', isBlocked ? 'success' : 'error') }}
          className={isBlocked ? 'btn-success' : 'btn-danger'}
        >
          {isBlocked ? <LockOpen className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
          {isBlocked ? 'Desbloquear' : 'Bloquear'}
        </button>
      </>
    }>
      <div className="flex items-start gap-4">
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
          {!isBlocked && (
            <div className="mt-4">
              <label className="field-label">Motivo del bloqueo <span className="text-rose-500">*</span></label>
              <textarea rows={2} className="input-field resize-none" placeholder="Describe el motivo del bloqueo…" />
            </div>
          )}
        </div>
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
    case 'editForm':        return <EditFormModal {...props} />
    case 'renovar':         return <RenovarModal {...props} />
    case 'vehiculoDetail':  return <VehiculoDetailModal {...props} />
    case 'productoDetail':  return <ProductoDetailModal {...props} />
    case 'newUser':         return <NewUserModal />
    case 'editUser':        return <EditUserModal {...props} />
    case 'changeRole':      return <ChangeRoleModal {...props} />
    case 'userPerms':       return <UserPermsModal {...props} />
    case 'blockUser':       return <BlockUserModal {...props} />
    case 'blockCliente':    return <BlockClienteModal {...props} />
    case 'clienteDetail':   return <ClienteDetailModal {...props} />
    default:                return null
  }
}
