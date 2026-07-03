import { useState, useEffect } from 'react'
import { KeyRound, Activity, Info, Check, CheckCircle, AlertTriangle, Lock, Circle, ShieldCheck } from 'lucide-react'
import { useApp } from '../context/AppContext.jsx'
import { fetchLogs, fetchAuditLog, fetchEmailLogs } from '../api/reports.js'
import { changePassword } from '../api/usuarios.js'
import { badge } from '../utils/helpers.jsx'
import DataTable from '../components/DataTable.jsx'
import { PasswordInput } from '../components/FormControls.jsx'

// ── Tab: Seguridad ───────────────────────────────────────────
function TabSeguridad() {
  const { showToast, canAct } = useApp()
  const canChangePassword = canAct('config', 'change_password')
  const [passwords, setPasswords] = useState({
    current_password: '',
    new_password: '',
    new_password_confirmation: ''
  })
  const [loading, setLoading] = useState(false)
  // Chequeos en vivo sobre la nueva contraseña (verde cuando se cumplen).
  const checks = [
    ['Al menos 8 caracteres', passwords.new_password.length >= 8],
    ['Combina letras y números', /[A-Za-z]/.test(passwords.new_password) && /[0-9]/.test(passwords.new_password)],
  ]
  // Consejos generales (informativos, no son advertencias).
  const consejos = [
    'No reutilices la contraseña de otros sitios',
    'Cámbiala periódicamente (cada ~90 días)',
    'Cierra sesión en equipos compartidos',
  ]

  const handleChange = (e) => {
    setPasswords(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async () => {
    if (!passwords.current_password || !passwords.new_password || !passwords.new_password_confirmation) {
      return showToast('Todos los campos son obligatorios', 'error')
    }
    if (passwords.new_password !== passwords.new_password_confirmation) {
      return showToast('Las contraseñas nuevas no coinciden', 'error')
    }

    try {
      setLoading(true)
      await changePassword(passwords)
      showToast('Contraseña actualizada correctamente', 'success')
      setPasswords({ current_password: '', new_password: '', new_password_confirmation: '' })
    } catch (error) {
      showToast(error.message, 'error')
    } finally {
      setLoading(false)
    }
  }


  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Recommendations */}
      <div className="card p-6">
        <h4 className="font-semibold text-slate-700 text-sm mb-4">Recomendaciones de Seguridad</h4>
        <div className="space-y-2.5">
          {checks.map(([txt, ok]) => (
            <div key={txt} className="flex items-center gap-2.5 text-sm">
              {ok
                ? <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                : <Circle className="w-4 h-4 text-slate-300 shrink-0" />}
              <span className={ok ? 'font-medium text-emerald-700' : 'text-slate-500'}>{txt}</span>
            </div>
          ))}
          <div className="pt-2.5 mt-1 border-t border-slate-100 space-y-2">
            {consejos.map(c => (
              <div key={c} className="flex items-start gap-2.5 text-sm text-slate-500">
                <ShieldCheck className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <span>{c}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Change password */}
      <div className="card p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
          <div className="sm:col-span-2">
            <label className="field-label">Contraseña actual <span className="text-rose-500">*</span></label>
            <PasswordInput name="current_password" value={passwords.current_password} onChange={handleChange} placeholder="••••••••" autoComplete="current-password" disabled={loading} />
          </div>
          <div>
            <label className="field-label">Nueva contraseña <span className="text-rose-500">*</span></label>
            <PasswordInput name="new_password" value={passwords.new_password} onChange={handleChange} placeholder="••••••••" autoComplete="new-password" disabled={loading} />
          </div>
          <div>
            <label className="field-label">Confirmar contraseña <span className="text-rose-500">*</span></label>
            <PasswordInput name="new_password_confirmation" value={passwords.new_password_confirmation} onChange={handleChange} placeholder="••••••••" autoComplete="new-password" disabled={loading} />
          </div>
        </div>
        {canChangePassword ? (
          <button onClick={handleSubmit} disabled={loading} className="btn-primary mt-2 w-full sm:w-auto disabled:opacity-50">
            <Check className="w-4 h-4" />{loading ? 'Actualizando...' : 'Actualizar Contraseña'}
          </button>
        ) : (
          <div className="flex items-center gap-2 mt-2 text-xs text-slate-400 p-3 bg-slate-50 rounded-xl">
            <Lock className="w-3.5 h-3.5" />Sin permiso para cambiar contraseña
          </div>
        )}
      </div>
    </div>
  )
}

// ── Tab: Auditoría ───────────────────────────────────────────
function TabAuditoria() {
  const { showToast, showModal, canAct } = useApp()
  const canViewEmailLogs = canAct('config', 'view_email_logs')
  const [vista, setVista] = useState('resumen') // 'resumen' | 'detallado' | 'correos'
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (vista === 'resumen') loadLogs()
  }, [vista])

  const loadLogs = async () => {
    try {
      setLoading(true)
      const data = await fetchLogs()
      setLogs(data.data || [])
    } catch (error) {
      showToast(error.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  const parseUA = (ua) => {
    if (!ua) return '—'
    if (/mobile|android|iphone|ipad/i.test(ua)) {
      if (/android/i.test(ua)) return 'Android · ' + (/Chrome\/[\d.]+/.exec(ua)?.[0] ?? 'Browser')
      if (/iphone|ipad/i.test(ua)) return 'iOS · Safari'
    }
    if (/firefox\/[\d.]+/i.test(ua)) return 'Firefox · ' + (/Windows|Mac|Linux/i.exec(ua)?.[0] ?? 'PC')
    if (/edg\/[\d.]+/i.test(ua)) return 'Edge · ' + (/Windows|Mac|Linux/i.exec(ua)?.[0] ?? 'PC')
    if (/chrome\/[\d.]+/i.test(ua)) return 'Chrome · ' + (/Windows|Mac|Linux/i.exec(ua)?.[0] ?? 'PC')
    if (/safari\/[\d.]+/i.test(ua)) return 'Safari · Mac'
    return ua.slice(0, 40)
  }

  const getActionBadge = (action) => {
    const acc = action?.toLowerCase() || ''
    if (acc.includes('crear') || acc.includes('nuevo') || acc.includes('post')) return badge(action, 'green')
    if (acc.includes('edit') || acc.includes('actualiz') || acc.includes('put')) return badge(action, 'amber')
    if (acc.includes('elimin') || acc.includes('borr') || acc.includes('delete')) return badge(action, 'red')
    if (acc.includes('login') || acc.includes('acces')) return badge(action, 'blue')
    return badge(action, 'slate')
  }

  const formatDate = (dateString) => {
    if (!dateString) return ''
    const d = new Date(dateString)
    return d.toLocaleString('es-VE', { 
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: true
    })
  }

  const openDetail = (r) => showModal('auditoriaDetail', {
    title: `Actividad #${r.id}`,
    eyebrow: 'Resumen de actividad',
    fields: [
      { label: 'Fecha / Hora', value: formatDate(r.created_at) },
      { label: 'Usuario', value: r.usuario?.nick || r.usuario?.nombre || 'Sistema' },
      { label: 'Acción', value: r.accion },
      { label: 'Módulo', value: r.tabla || 'Sistema' },
      { label: 'Detalle', value: r.descripcion },
      { label: 'IP', value: r.ip, mono: true },
      { label: 'Dispositivo', value: parseUA(r.user_agent) },
      { label: 'User-Agent', value: r.user_agent, mono: true },
      r.device_fingerprint ? { label: 'Huella de dispositivo', value: JSON.stringify(r.device_fingerprint, null, 2), mono: true } : null,
    ],
  })

  const rows = logs.map(r => ({
    id: r.id,
    fecha: formatDate(r.created_at),
    usuario: r.usuario?.nick || r.usuario?.nombre || 'Sistema',
    accion: getActionBadge(r.accion),
    tabla: r.tabla || 'Sistema',
    descripcion: r.descripcion || '—',
    ip: r.ip || '—',
    dispositivo: parseUA(r.user_agent),
    ver: (
      <button onClick={() => openDetail(r)} className="text-xs font-semibold text-jm-blue hover:underline bg-transparent border-none p-0 cursor-pointer whitespace-nowrap">
        Ver detalle
      </button>
    ),
  }))

  return (
    <div>
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setVista('resumen')}
          className={`text-xs font-semibold px-3 py-1.5 rounded-xl border transition ${vista === 'resumen' ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'}`}
        >
          Resumen de actividad
        </button>
        <button
          onClick={() => setVista('detallado')}
          className={`text-xs font-semibold px-3 py-1.5 rounded-xl border transition ${vista === 'detallado' ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'}`}
        >
          Cambios detallados
        </button>
        {canViewEmailLogs && (
          <button
            onClick={() => setVista('correos')}
            className={`text-xs font-semibold px-3 py-1.5 rounded-xl border transition ${vista === 'correos' ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'}`}
          >
            Logs de correos
          </button>
        )}
      </div>

      {vista === 'resumen' ? (
        <DataTable
          searchable
          loading={loading}
          cols={[
            { k: 'fecha',       l: 'Fecha/Hora',  hide: 'sm', nw: true },
            { k: 'usuario',     l: 'Usuario',     m: true },
            { k: 'accion',      l: 'Acción' },
            { k: 'tabla',       l: 'Módulo',      hide: 'sm' },
            { k: 'descripcion', l: 'Detalle',     hide: 'lg', tr: true },
            { k: 'ip',          l: 'IP',          hide: 'lg', m: true },
            { k: 'dispositivo', l: 'Dispositivo', hide: 'xl' },
            { k: 'ver',         l: '', acc: true },
          ]}
          rows={rows}
        />
      ) : vista === 'detallado' ? (
        <TabCambiosDetallados />
      ) : canViewEmailLogs ? (
        <TabEmailLogs />
      ) : null}
    </div>
  )
}

// ── Sub-vista: Logs de correos (email_log) ───────────────────
/**
 * Historial de todos los correos que el sistema intentó enviar (bienvenida,
 * cambios de cliente, pólizas/facturas emitidas, recordatorios, reportes
 * programados...). Se registraba en BD desde hace tiempo vía
 * EmailLog::registrar() pero no tenía ninguna vista — quedaba invisible.
 */
function TabEmailLogs() {
  const { showToast, showModal } = useApp()
  const [items, setItems]     = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    (async () => {
      try {
        setLoading(true)
        const data = await fetchEmailLogs()
        setItems(data.data || [])
      } catch (error) {
        showToast(error.message, 'error')
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const formatDate = (dateString) => {
    if (!dateString) return '—'
    return new Date(dateString).toLocaleString('es-VE', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: true
    })
  }

  const openDetail = (e) => showModal('auditoriaDetail', {
    title: `Correo #${e.id}`,
    eyebrow: 'Log de correo',
    fields: [
      { label: 'Fecha / Hora', value: formatDate(e.sent_at) },
      { label: 'Tipo', value: e.tipo },
      { label: 'Destinatario', value: e.destinatario, mono: true },
      { label: 'Asunto', value: e.asunto },
      { label: 'Cliente', value: e.persona?.nombre },
      { label: 'Póliza', value: e.poliza?.nro_contrato },
      { label: 'Estado', value: e.status === 'enviado' ? 'Enviado' : 'Error' },
      { label: 'Mensaje de error', value: e.error_msg },
    ],
  })

  const rows = items.map(e => ({
    id: e.id,
    fecha: formatDate(e.sent_at),
    tipo: badge(e.tipo, 'slate'),
    destinatario: e.destinatario,
    asunto: e.asunto,
    cliente: e.persona?.nombre || '—',
    status: e.status === 'enviado' ? badge('Enviado', 'green') : badge('Error', 'red'),
    error: e.error_msg || '—',
    ver: (
      <button onClick={() => openDetail(e)} className="text-xs font-semibold text-jm-blue hover:underline bg-transparent border-none p-0 cursor-pointer whitespace-nowrap">
        Ver detalle
      </button>
    ),
  }))

  return (
    <DataTable
      searchable
      loading={loading}
      cols={[
        { k: 'fecha',        l: 'Fecha/Hora',    nw: true },
        { k: 'tipo',         l: 'Tipo' },
        { k: 'destinatario', l: 'Destinatario',  m: true, hide: 'sm' },
        { k: 'asunto',       l: 'Asunto',        tr: true },
        { k: 'cliente',      l: 'Cliente',       hide: 'md' },
        { k: 'status',       l: 'Estado' },
        { k: 'error',        l: 'Error',         hide: 'lg', tr: true },
        { k: 'ver',          l: '', acc: true },
      ]}
      rows={rows}
    />
  )
}

// ── Sub-vista: Cambios detallados (audit_log) ────────────────
/**
 * Historial campo a campo de Solicitud/Póliza/Factura/Producto, registrado
 * automáticamente por AuditObserver. Complementa el resumen descriptivo de
 * arriba con el detalle exacto de qué valor cambió a cuál.
 */
function TabCambiosDetallados() {
  const { showToast, showModal } = useApp()
  const [items, setItems]     = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    (async () => {
      try {
        setLoading(true)
        const data = await fetchAuditLog()
        setItems(data.data || [])
      } catch (error) {
        showToast(error.message, 'error')
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const formatDate = (dateString) => {
    if (!dateString) return ''
    const d = new Date(dateString)
    return d.toLocaleString('es-VE', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: true
    })
  }

  const formatCambios = (cambios, accion) => {
    if (accion === 'created') return <span className="text-emerald-600 font-medium">Registro creado</span>
    if (accion === 'deleted') return <span className="text-rose-600 font-medium">Registro eliminado</span>
    if (!cambios?.antes || !cambios?.despues) return '—'
    const campos = Object.keys(cambios.despues)
    if (campos.length === 0) return '—'
    return (
      <div className="space-y-0.5">
        {campos.map(campo => (
          <p key={campo} className="text-xs">
            <span className="font-semibold text-slate-600">{campo}:</span>{' '}
            <span className="text-slate-400">{JSON.stringify(cambios.antes[campo] ?? null)}</span>
            {' → '}
            <span className="text-slate-700 font-medium">{JSON.stringify(cambios.despues[campo] ?? null)}</span>
          </p>
        ))}
      </div>
    )
  }

  const openDetail = (a) => showModal('auditoriaDetail', {
    title: `${a.modelo} #${a.modelo_id ?? '—'}`,
    eyebrow: 'Cambio detallado',
    fields: [
      { label: 'Fecha / Hora', value: formatDate(a.created_at) },
      { label: 'Registro', value: `${a.modelo} #${a.modelo_id ?? '—'}` },
      { label: 'Acción', value: a.accion },
      { label: 'Usuario', value: a.usuario?.nick || a.usuario?.nombre || 'Sistema' },
      { label: 'IP', value: a.ip, mono: true },
      { label: 'Cambios', value: formatCambios(a.cambios, a.accion) },
    ],
  })

  const rows = items.map(a => ({
    id: a.id,
    fecha: formatDate(a.created_at),
    modelo: `${a.modelo} #${a.modelo_id ?? '—'}`,
    accion: badge(a.accion, a.accion === 'created' ? 'green' : a.accion === 'deleted' ? 'red' : 'amber'),
    usuario: a.usuario?.nick || a.usuario?.nombre || 'Sistema',
    cambios: formatCambios(a.cambios, a.accion),
    ip: a.ip || '—',
    ver: (
      <button onClick={() => openDetail(a)} className="text-xs font-semibold text-jm-blue hover:underline bg-transparent border-none p-0 cursor-pointer whitespace-nowrap">
        Ver detalle
      </button>
    ),
  }))

  return (
    <DataTable
      searchable
      loading={loading}
      cols={[
        { k: 'fecha',   l: 'Fecha/Hora', hide: 'sm', nw: true },
        { k: 'modelo',  l: 'Registro',   nw: true },
        { k: 'accion',  l: 'Acción' },
        { k: 'usuario', l: 'Usuario',    m: true, hide: 'sm' },
        { k: 'cambios', l: 'Cambios',    tr: true },
        { k: 'ip',      l: 'IP',         hide: 'lg', m: true },
        { k: 'ver',     l: '', acc: true },
      ]}
      rows={rows}
    />
  )
}

// ── Tab: Acerca de ───────────────────────────────────────────
// Apartado puramente informativo: créditos del software desarrollado y vendido
// por Victecnology, Lda como una venta única (sin soporte ni actualizaciones).
function TabAbout() {
  return (
    <div className="max-w-xl">
      {/* Créditos del software */}
      <div className="card p-6">
        <h4 className="font-semibold text-slate-800 mb-5">Créditos del software</h4>
        <div className="space-y-3 text-sm">
          {[
            ['Versión',              '1.0.1',                     'font-mono font-semibold text-slate-700'],
            ['Fecha de adquisición', '15/07/2026',                'font-semibold'],
            ['Desarrollado por',     'Victecnology, Lda',         'font-bold text-blue-700'],
            ['Contacto',             'contacto@victecnology.com', 'text-blue-500 text-xs'],
          ].map(([label, val, cls]) => (
            <div key={label} className="flex justify-between gap-3 py-2 border-b border-slate-100">
              <span className="text-slate-500">{label}</span>
              <span className={cls}>{val}</span>
            </div>
          ))}
        </div>

        <div className="mt-5 p-4 bg-amber-50 rounded-xl">
          <p className="text-xs font-semibold text-amber-800 mb-1">Venta única</p>
          <p className="text-xs text-amber-700">
            Este software se entregó como una venta única. No incluye soporte técnico ni la integración de nuevas
            actualizaciones.
          </p>
        </div>
      </div>
    </div>
  )
}

// ── Main Configuracion page ──────────────────────────────────
const ALL_TABS = [
  { key: 'seguridad', label: 'Seguridad', Icon: KeyRound,  Component: TabSeguridad, perm: null },
  { key: 'auditoria', label: 'Auditoría', Icon: Activity,  Component: TabAuditoria, perm: 'view_audit' },
  { key: 'about',     label: 'Acerca de', Icon: Info,      Component: TabAbout,     perm: null },
]

export default function Configuracion() {
  const { canAct } = useApp()
  const [active, setActive] = useState('seguridad')

  const tabs = ALL_TABS.filter(t => !t.perm || canAct('config', t.perm))
  const ActiveTab = (tabs.find(t => t.key === active) ?? tabs[0])?.Component ?? TabSeguridad

  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex flex-wrap gap-2 mb-5">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setActive(t.key)}
            className={`text-xs px-4 py-2 shrink-0 flex items-center gap-1.5 ${active === t.key ? 'btn-primary' : 'btn-secondary'}`}
          >
            <t.Icon className="w-4 h-4" />{t.label}
          </button>
        ))}
      </div>
      <div key={active} className="animate-in fade-in duration-300">
        <ActiveTab />
      </div>
    </div>
  )
}
