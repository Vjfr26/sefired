import { X, Trash2, Check, Lock, LockOpen, ShieldCheck, Building, UserCheck, Truck, UserCog } from 'lucide-react'
import { useApp } from '../context/AppContext.jsx'
import FormGrid from './FormGrid.jsx'

// ── Modal overlay shell ──────────────────────────────────────
function ModalShell({ title, children, footer, wide = false }) {
  const { closeModal } = useApp()
  return (
    <div
      className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4 sm:p-6 backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget) closeModal() }}
    >
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

// ── Confirm delete ───────────────────────────────────────────
function ConfirmDeleteModal({ name }) {
  const { closeModal, showToast } = useApp()
  return (
    <ModalShell title="Confirmar eliminación" footer={
      <>
        <button onClick={closeModal} className="btn-secondary">Cancelar</button>
        <button onClick={() => { closeModal(); showToast('Registro eliminado', 'error') }} className="btn-danger">
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

// ── Delete vehicle ───────────────────────────────────────────
function DeleteVehModal({ placa }) {
  const { closeModal, showToast } = useApp()
  return (
    <ModalShell title="Confirmar eliminación" footer={
      <>
        <button onClick={closeModal} className="btn-secondary">Cancelar</button>
        <button onClick={() => { closeModal(); showToast('Vehículo eliminado', 'error') }} className="btn-danger">
          <Trash2 className="w-4 h-4" />Eliminar
        </button>
      </>
    }>
      <div className="flex flex-col items-center text-center gap-4 py-2">
        <div className="w-14 h-14 rounded-full bg-rose-100 flex items-center justify-center">
          <Trash2 className="w-7 h-7 text-rose-600" />
        </div>
        <div>
          <p className="font-semibold text-slate-800 mb-1">¿Eliminar vehículo <em>{placa}</em>?</p>
          <p className="text-sm text-slate-500">Esta acción no se puede deshacer.</p>
        </div>
      </div>
    </ModalShell>
  )
}

// ── Generic edit form ────────────────────────────────────────
function EditFormModal({ title, fields }) {
  const { closeModal, showToast } = useApp()
  return (
    <ModalShell title={title} footer={
      <>
        <button onClick={closeModal} className="btn-secondary">Cancelar</button>
        <button onClick={() => { closeModal(); showToast('Cambios guardados', 'success') }} className="btn-primary">
          <Check className="w-4 h-4" />Guardar
        </button>
      </>
    }>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormGrid fields={fields} />
      </div>
    </ModalShell>
  )
}

// ── New vehicle ──────────────────────────────────────────────
const MARCAS_VEH = ['Toyota','Chevrolet','Ford','Hyundai','Kia','Jeep','Nissan','Honda','Renault','Mazda','Volkswagen','Mitsubishi','Otro']
const TIPOS_VEH  = ['Sedán','SUV / Rústico','Camioneta','Comercial','Motocicleta']
const AÑOS_VEH   = Array.from({length: 14}, (_, i) => String(2025 - i))

function NewVehModal() {
  const { closeModal, showToast } = useApp()
  const fields = [
    { label: 'Placa', ph: 'ABC-123' },
    { label: 'Marca', type: 'select', opts: MARCAS_VEH },
    { label: 'Modelo', ph: 'Ej. Corolla, Spark…' },
    { label: 'Año', type: 'select', opts: AÑOS_VEH },
    { label: 'Color', ph: 'Ej. Blanco, Negro…' },
    { label: 'Tipo', type: 'select', opts: TIPOS_VEH },
    { label: 'Propietario', ph: 'Nombre del propietario', span: true },
    { label: 'Estado', type: 'select', opts: ['Activo','Inactivo'] },
  ]
  return (
    <ModalShell title="Registrar Vehículo" footer={
      <>
        <button onClick={closeModal} className="btn-secondary">Cancelar</button>
        <button onClick={() => { closeModal(); showToast('Vehículo registrado correctamente', 'success') }} className="btn-primary">
          <Check className="w-4 h-4" />Registrar
        </button>
      </>
    }>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormGrid fields={fields} />
      </div>
    </ModalShell>
  )
}

// ── Edit vehicle ─────────────────────────────────────────────
function EditVehModal({ placa, marca, modelo, año, color, tipo, prop, est }) {
  const { closeModal, showToast } = useApp()
  const fields = [
    { label: 'Placa', val: placa, ro: true },
    { label: 'Marca', type: 'select', opts: MARCAS_VEH, val: marca },
    { label: 'Modelo', val: modelo },
    { label: 'Año', type: 'select', opts: AÑOS_VEH, val: String(año) },
    { label: 'Color', val: color },
    { label: 'Tipo', type: 'select', opts: TIPOS_VEH, val: tipo },
    { label: 'Propietario', val: prop, span: true },
    { label: 'Estado', type: 'select', opts: ['Activo','Inactivo'], val: est },
  ]
  return (
    <ModalShell title={`Editar Vehículo — ${placa}`} footer={
      <>
        <button onClick={closeModal} className="btn-secondary">Cancelar</button>
        <button onClick={() => { closeModal(); showToast('Vehículo actualizado correctamente', 'success') }} className="btn-primary">
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

// ── Renovar póliza ───────────────────────────────────────────
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

// ── New user ─────────────────────────────────────────────────
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

// ── Edit user ────────────────────────────────────────────────
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

// ── Change role ──────────────────────────────────────────────
const ROLE_OPTIONS = [
  { key: 'Admin',             Icon: ShieldCheck, desc: 'Acceso total. Gestiona usuarios, configuración y todos los módulos del sistema.' },
  { key: 'Oficina',           Icon: Building,    desc: 'Acceso a cotizaciones, clientes, pólizas y reportes. Sin gestión de usuarios.' },
  { key: 'Vendedor Sucursal', Icon: UserCheck,   desc: 'Crea cotizaciones y gestiona clientes asignados a su sucursal.' },
  { key: 'Vendedor Calle',    Icon: Truck,       desc: 'Cotizaciones básicas y consulta de clientes. Acceso limitado desde campo.' },
]

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

// ── User permissions ─────────────────────────────────────────
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

// ── Block / unblock user ─────────────────────────────────────
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

// ── Modal dispatcher ─────────────────────────────────────────
export default function Modal() {
  const { modal } = useApp()
  if (!modal) return null

  const { type, props } = modal
  switch (type) {
    case 'confirmDelete': return <ConfirmDeleteModal {...props} />
    case 'deleteVeh':     return <DeleteVehModal {...props} />
    case 'editForm':      return <EditFormModal {...props} />
    case 'newVeh':        return <NewVehModal />
    case 'editVeh':       return <EditVehModal {...props} />
    case 'renovar':       return <RenovarModal {...props} />
    case 'newUser':       return <NewUserModal />
    case 'editUser':      return <EditUserModal {...props} />
    case 'changeRole':    return <ChangeRoleModal {...props} />
    case 'userPerms':     return <UserPermsModal {...props} />
    case 'blockUser':     return <BlockUserModal {...props} />
    default:              return null
  }
}
