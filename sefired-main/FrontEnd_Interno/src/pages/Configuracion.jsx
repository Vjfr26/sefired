import { useState, useEffect } from 'react'
import { KeyRound, Activity, Info, Check, CheckCircle, AlertTriangle, Lock } from 'lucide-react'
import { useApp } from '../context/AppContext.jsx'
import { fetchLogs } from '../api/reports.js'
import { changePassword } from '../api/usuarios.js'
import { badge } from '../utils/helpers.jsx'

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
  const tips = [
    
    ['Usa al menos 8 caracteres',                   
    passwords.new_password.length >= 8],
    ['Combina letras, números y símbolos',           
    /[A-Za-z]/.test(passwords.new_password) && /[0-9]/.test(passwords.new_password)],
    ['No uses la misma contraseña en otros sitios',  true],
    ['Cambia tu contraseña cada 90 días',            false],
    ['Activa el cierre de sesión automático',        false],
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
        <div className="space-y-3">
          {tips.map(([tip, ok]) => (
            <div key={tip} className={`flex items-start gap-3 p-3 rounded-xl ${ok ? 'bg-emerald-50' : 'bg-amber-50'}`}>
              {ok ? <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  : <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />}
              <p className={`text-sm ${ok ? 'text-emerald-800' : 'text-amber-800'}`}>{tip}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Change password */}
      <div className="card p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
          <div className="sm:col-span-2">
            <label className="field-label">Contraseña actual <span className="text-rose-500">*</span></label>
            <input type="password" name="current_password" value={passwords.current_password} onChange={handleChange} placeholder="••••••••" className="input-field" disabled={loading} />
          </div>
          <div>
            <label className="field-label">Nueva contraseña <span className="text-rose-500">*</span></label>
            <input type="password" name="new_password" value={passwords.new_password} onChange={handleChange} placeholder="••••••••" className="input-field" disabled={loading} />
          </div>
          <div>
            <label className="field-label">Confirmar contraseña <span className="text-rose-500">*</span></label>
            <input type="password" name="new_password_confirmation" value={passwords.new_password_confirmation} onChange={handleChange} placeholder="••••••••" className="input-field" disabled={loading} />
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
  const { showToast } = useApp()
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadLogs()
  }, [])

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

  return (
    <div>
      <div className="card p-3.5 mb-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-44">
          <input type="text" placeholder="Buscar…" className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition" />
          <Activity className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
        <input type="date" defaultValue="2026-05-01" className="min-w-0 text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500" />
        <input type="date" defaultValue="2026-05-07" className="min-w-0 text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500" />
        <button onClick={() => showToast('Exportando reporte…', 'info')} className="btn-secondary ml-auto shrink-0">Exportar</button>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-100 text-slate-600 text-xs font-semibold uppercase tracking-wider">
              <tr>
                <th className="th-cell text-left hidden sm:table-cell">Fecha/Hora</th>
                <th className="th-cell text-left">Usuario</th>
                <th className="th-cell text-left">Acción</th>
                <th className="th-cell text-left hidden sm:table-cell">Módulo</th>
                <th className="th-cell text-left hidden lg:table-cell">Detalle</th>
                <th className="th-cell text-left hidden lg:table-cell">IP</th>
                <th className="th-cell text-left hidden xl:table-cell">Dispositivo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan="7" className="text-center py-8 text-slate-400">Cargando registros...</td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan="7" className="text-center py-8 text-slate-400">No hay registros de auditoría</td></tr>
              ) : (
                logs.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="td-cell hidden sm:table-cell text-xs whitespace-nowrap">{formatDate(r.created_at)}</td>
                    <td className="td-cell font-mono text-xs">{r.usuario?.nick || r.usuario?.nombre || 'Sistema'}</td>
                    <td className="td-cell">{getActionBadge(r.accion)}</td>
                    <td className="td-cell hidden sm:table-cell text-xs">{r.tabla || 'Sistema'}</td>
                    <td className="td-cell hidden lg:table-cell max-w-0"><span className="break-words">{r.descripcion}</span></td>
                    <td className="td-cell hidden lg:table-cell font-mono text-xs">{r.ip || '—'}</td>
                    <td className="td-cell hidden xl:table-cell text-xs text-slate-500 max-w-[180px] truncate" title={r.user_agent || ''}>{parseUA(r.user_agent)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-3 border-t border-slate-100 text-xs text-slate-400 flex justify-between">
          <span>{logs.length} registros</span>
        </div>
      </div>
    </div>
  )
}

// ── Tab: Acerca de ───────────────────────────────────────────
function TabAbout() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Company info */}
      <div className="card p-6">
        <div className="flex items-center gap-4 mb-6 pb-4 border-b border-slate-100">
          <img src="/logo2.png" alt="J&M" className="h-14 object-contain" />
          <div>
            <h3 className="font-bold text-slate-800 text-lg">Seguros J&M</h3>
            <p className="text-sm text-slate-500">Cooperativa de Seguros de Vehículos R.L.</p>
          </div>
        </div>
        <div className="space-y-3 text-sm">
          {[
            ['RIF',        'J-30012345-6',     'font-mono font-semibold'],
            ['Regulador',  'SUDEASEG',          'font-semibold text-blue-700'],
            ['Registro',   'RSE-2010-00247',    'font-mono text-xs text-slate-600'],
            ['País',       'Venezuela',         'font-semibold'],
            ['Email',      'info@jandm.com',  'text-blue-600'],
            ['Web',        'www.jandm.com',   'text-blue-600'],
          ].map(([label, val, cls]) => (
            <div key={label} className="flex justify-between gap-3 py-2 border-b border-slate-100">
              <span className="text-slate-500">{label}</span>
              <span className={cls}>{val}</span>
            </div>
          ))}
        </div>
      </div>

      {/* System info */}
      <div className="card p-6">
        <h4 className="font-semibold text-slate-800 mb-5">Sistema de Gestión Interno</h4>
        <div className="space-y-3 text-sm">
          {[
            ['Versión',           'v1.0.0-beta',             'font-mono font-semibold text-slate-700'],
            ['Entorno',           null,                       ''],
            ['Desarrollado por',  'Victecnology Lda',         'font-bold text-blue-700'],
            ['Soporte',           'contacto@victecnology.com','text-blue-500 text-xs'],
            ['Módulos activos',   '8',                        'font-semibold'],
            ['Última actualización','07/05/2026',             'font-semibold'],
          ].map(([label, val, cls]) => (
            <div key={label} className="flex justify-between gap-3 py-2 border-b border-slate-100">
              <span className="text-slate-500">{label}</span>
              {val === null ? badge('Producción', 'green') : <span className={cls}>{val}</span>}
            </div>
          ))}
        </div>
        <div className="mt-5 p-4 bg-blue-50 rounded-xl">
          <p className="text-xs font-semibold text-blue-800 mb-1">Licencia de uso</p>
          <p className="text-xs text-blue-600">Este sistema es propiedad de Seguros J&M C.A. Su uso no autorizado está prohibido.</p>
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
    <div>
      <div className="flex flex-wrap gap-2 mb-5">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setActive(t.key)}
            className={`text-xs px-4 py-2 shrink-0 flex items-center gap-1.5 ${active === t.key ? 'btn-primary' : 'btn-secondary'}`}
          >
            <t.Icon className="w-4 h-4" />{t.label}
          </button>
        ))}
      </div>
      <ActiveTab />
    </div>
  )
}
