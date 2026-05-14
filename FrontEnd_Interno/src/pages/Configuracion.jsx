import { useState } from 'react'
import { KeyRound, Activity, Info, Check, CheckCircle, AlertTriangle } from 'lucide-react'
import { useApp } from '../context/AppContext.jsx'
import { badge } from '../utils/helpers.jsx'

// ── Tab: Seguridad ───────────────────────────────────────────
function TabSeguridad() {
  const { showToast } = useApp()
  const tips = [
    ['Usa al menos 8 caracteres',                   true],
    ['Combina letras, números y símbolos',           true],
    ['No uses la misma contraseña en otros sitios',  true],
    ['Cambia tu contraseña cada 90 días',            false],
    ['Activa el cierre de sesión automático',        false],
  ]

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
            <input type="password" placeholder="••••••••" className="input-field" />
          </div>
          <div>
            <label className="field-label">Nueva contraseña</label>
            <input type="password" placeholder="••••••••" className="input-field" />
          </div>
          <div>
            <label className="field-label">Confirmar contraseña</label>
            <input type="password" placeholder="••••••••" className="input-field" />
          </div>
        </div>
        <button onClick={() => showToast('Contraseña actualizada correctamente', 'success')} className="btn-primary mt-2 w-full sm:w-auto">
          <Check className="w-4 h-4" />Actualizar Contraseña
        </button>
      </div>
    </div>
  )
}

// ── Tab: Auditoría ───────────────────────────────────────────
function TabAuditoria() {
  const { showToast } = useApp()
  const rows = [
    { dt: '03/05/2026 09:14', usr: 'vadmin',   acc: badge('Acceso','blue'),      mod: 'Sistema',        det: 'Inicio de sesión exitoso',                       ip: '192.168.1.10' },
    { dt: '03/05/2026 09:18', usr: 'vadmin',   acc: badge('Creación','green'),   mod: 'Cotización',     det: 'SOL-2026-00312 creada',                           ip: '192.168.1.10' },
    { dt: '03/05/2026 09:32', usr: 'vadmin',   acc: badge('Aprobación','green'), mod: 'Revisión',       det: 'SOL-2026-00312 aprobada',                         ip: '192.168.1.10' },
    { dt: '03/05/2026 09:38', usr: 'vadmin',   acc: badge('Creación','green'),   mod: 'Emisión',        det: 'SEF-2026-VEH-00848 emitida',                      ip: '192.168.1.10' },
    { dt: '03/05/2026 09:45', usr: 'psalazar', acc: badge('Creación','green'),   mod: 'Cotización',     det: 'SOL-2026-00313 creada',                           ip: '192.168.1.22' },
    { dt: '03/05/2026 10:02', usr: 'vadmin',   acc: badge('Edición','amber'),    mod: 'Configuración',  det: 'Parámetro comisión agente actualizado',           ip: '192.168.1.10' },
    { dt: '02/05/2026 17:55', usr: 'asuarez',  acc: badge('Cobro','indigo'),     mod: 'Facturación',    det: 'FAC-2026-00846 cobro registrado $487.00',         ip: '192.168.1.15' },
    { dt: '02/05/2026 17:30', usr: 'rcontrol', acc: badge('Consulta','slate'),   mod: 'Reportes',       det: 'Reporte de ventas exportado',                     ip: '192.168.1.18' },
  ]

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
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((r, i) => (
                <tr key={i} className="hover:bg-slate-50/80 transition-colors">
                  <td className="td-cell hidden sm:table-cell text-xs whitespace-nowrap">{r.dt}</td>
                  <td className="td-cell font-mono text-xs">{r.usr}</td>
                  <td className="td-cell">{r.acc}</td>
                  <td className="td-cell hidden sm:table-cell text-xs">{r.mod}</td>
                  <td className="td-cell hidden lg:table-cell max-w-0"><span className="break-words">{r.det}</span></td>
                  <td className="td-cell hidden lg:table-cell font-mono text-xs">{r.ip}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-3 border-t border-slate-100 text-xs text-slate-400">
          {rows.length} registros
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
          <img src="/logo2.png" alt="Sefired" className="h-14 object-contain" />
          <div>
            <h3 className="font-bold text-slate-800 text-lg">Seguros Sefired</h3>
            <p className="text-sm text-slate-500">Cooperativa de Seguros de Vehículos R.L.</p>
          </div>
        </div>
        <div className="space-y-3 text-sm">
          {[
            ['RIF',        'J-30012345-6',     'font-mono font-semibold'],
            ['Regulador',  'SUDEASEG',          'font-semibold text-blue-700'],
            ['Registro',   'RSE-2010-00247',    'font-mono text-xs text-slate-600'],
            ['País',       'Venezuela',         'font-semibold'],
            ['Email',      'info@sefired.com',  'text-blue-600'],
            ['Web',        'www.sefired.com',   'text-blue-600'],
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
          <p className="text-xs text-blue-600">Este sistema es propiedad de Seguros Sefired C.A. Su uso no autorizado está prohibido.</p>
        </div>
      </div>
    </div>
  )
}

// ── Main Configuracion page ──────────────────────────────────
const TABS = [
  { key: 'seguridad', label: 'Seguridad', Icon: KeyRound,  Component: TabSeguridad },
  { key: 'auditoria', label: 'Auditoría', Icon: Activity,  Component: TabAuditoria },
  { key: 'about',     label: 'Acerca de', Icon: Info,      Component: TabAbout },
]

export default function Configuracion() {
  const [active, setActive] = useState('seguridad')
  const ActiveTab = TABS.find(t => t.key === active)?.Component ?? TabSeguridad

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-5">
        {TABS.map(t => (
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
