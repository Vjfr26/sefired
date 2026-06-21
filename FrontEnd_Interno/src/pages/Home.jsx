import { useState, useEffect } from 'react'
import { Users, Calculator, BarChart3, FileCheck, ShieldCheck, TrendingUp, ClipboardList } from 'lucide-react'
import { useApp } from '../context/AppContext.jsx'
import { UserAvatar } from '../utils/helpers.jsx'
import { fetchStats } from '../api/reportes.js'

const QUICK_ITEMS = [
  {
    perm: 'clientes',
    view: 'cli-cliente',
    Icon: Users,
    label: 'Clientes',
    sub: 'Gestionar',
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
    hoverBg: 'hover:bg-blue-50/60',
  },
  {
    perm: 'cotizaciones',
    view: 'cot-simulador',
    Icon: Calculator,
    label: 'Simulador',
    sub: 'Cotizar',
    iconBg: 'bg-emerald-100',
    iconColor: 'text-emerald-600',
    hoverBg: 'hover:bg-emerald-50/60',
  },
  {
    perm: 'reportes',
    view: 'rep-menu',
    Icon: BarChart3,
    label: 'Reportes',
    sub: 'Ver',
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-500',
    hoverBg: 'hover:bg-amber-50/60',
  },
]

export default function Home() {
  const { navigateTo, currentUser, userPerms } = useApp()

  const quickItems = QUICK_ITEMS.filter(item => userPerms.includes(item.perm))

  // Resumen general — solo para roles con acceso a reportes (Admin/Oficina);
  // un vendedor no debe ver totales agregados de toda la cartera.
  const verResumen = userPerms.includes('reportes')
  const [stats, setStats] = useState(null)

  useEffect(() => {
    if (!verResumen) return
    fetchStats().then(setStats).catch(() => {})
  }, [verResumen])

  return (
    <div className="animate-in fade-in duration-700 pt-4 sm:pt-6">
      <div className="card w-full max-w-xl mx-auto overflow-hidden">
        {/* User info */}
        <div className="flex flex-col items-center text-center px-8 sm:px-14 pt-8 sm:pt-10 pb-7 sm:pb-9 border-b border-slate-100">
          <UserAvatar rol={currentUser?.tipo} genero={currentUser?.genero} className="w-20 h-20 rounded-3xl mb-5 shadow-xl shadow-blue-900/20" />
          <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.28em] mb-2">Bienvenido de vuelta</p>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-800 mb-2 tracking-tight">{currentUser?.nombre ?? '—'}</h2>
          <p className="text-sm font-semibold text-slate-500">{currentUser?.cargo ?? '—'} · J&M R.L.</p>
          <p className="text-xs text-slate-400 font-mono mt-1.5">RIF: J-30012345-6 · Caracas Principal</p>
        </div>

        {/* Quick access — solo muestra secciones a las que el usuario tiene acceso */}
        {quickItems.length > 0 && (
          <div className="flex divide-x divide-slate-100">
            {quickItems.map(({ perm, view, Icon, label, sub, iconBg, iconColor, hoverBg }) => (
              <button
                key={perm}
                onClick={() => navigateTo(view)}
                className={`flex-1 flex flex-col items-center gap-2.5 py-8 px-3 ${hoverBg} transition-colors duration-200 group`}
              >
                <div className={`w-11 h-11 rounded-2xl ${iconBg} flex items-center justify-center group-hover:scale-110 transition-transform duration-200`}>
                  <Icon className={`w-5 h-5 ${iconColor}`} />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-700">{label}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{sub}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Resumen general del sistema */}
      {verResumen && stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 max-w-4xl mx-auto mt-6">
          {[
            { label: 'Pólizas Activas',  val: stats.polizas_activas,         Icon: ShieldCheck,    cls: 'border-t-emerald-500', vcls: 'text-emerald-700' },
            { label: 'Cotiz. en Revisión', val: stats.cotizaciones_en_revision, Icon: ClipboardList, cls: 'border-t-amber-500',  vcls: 'text-amber-700' },
            { label: 'Cotiz. Emitidas',  val: stats.cotizaciones_emitidas,   Icon: FileCheck,      cls: 'border-t-blue-500',   vcls: 'text-blue-700' },
            { label: 'Ventas este Mes',  val: stats.ventas_este_mes,         Icon: TrendingUp,     cls: 'border-t-indigo-500', vcls: 'text-indigo-700' },
            { label: 'Clientes',         val: stats.total_clientes,          Icon: Users,          cls: 'border-t-slate-400',  vcls: 'text-slate-700' },
          ].map(c => (
            <div key={c.label} className={`card p-4 text-center border-t-4 ${c.cls}`}>
              <c.Icon className={`w-4 h-4 mx-auto mb-1 ${c.vcls}`} />
              <p className={`text-xl font-black ${c.vcls}`}>{c.val ?? 0}</p>
              <p className="text-[11px] text-slate-500 mt-0.5">{c.label}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
