import { useState } from 'react'
import { TrendingUp, Shield, Building2, Users, RefreshCw, Search, Download, Check } from 'lucide-react'
import { useApp } from '../context/AppContext.jsx'
import { usd, bs, badge, rsbadge, sbadge } from '../utils/helpers.jsx'
import DataTable from '../components/DataTable.jsx'

// ── Shared report filter bar ─────────────────────────────────
function ReportBar({ children, onExport }) {
  const { showToast, canAct } = useApp()
  const canExport = canAct('reportes', 'export')
  return (
    <div className="card p-3.5 mb-4 flex flex-wrap items-center gap-3">
      <div className="relative flex-1 min-w-44">
        <input type="text" placeholder="Buscar…" className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition" />
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
      </div>
      {children}
      {canExport && (
        <button onClick={() => showToast('Exportando reporte…', 'info')} className="btn-secondary ml-auto shrink-0">
          <Download className="w-4 h-4" />Exportar
        </button>
      )}
    </div>
  )
}

// ── Tab: Ventas / Comisiones ─────────────────────────────────
function TabVentas() {
  return (
    <div>
      <ReportBar>
        <input type="date" defaultValue="2026-05-01" className="min-w-0 text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500" />
        <input type="date" defaultValue="2026-05-07" className="min-w-0 text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500" />
      </ReportBar>

      <h4 className="font-semibold text-slate-700 mb-3 text-sm">Ventas del Período</h4>
      <DataTable
        cols={[
          { k: 'fecha', l: 'Fecha',      hide: 'sm' },
          { k: 'pol',   l: 'Póliza',     m: true, hide: 'md' },
          { k: 'agente',l: 'Agente',     tr: true },
          { k: 'tipo',  l: 'Tipo',       hide: 'lg', tr: true },
          { k: 'prima', l: 'Prima Neta', r: true },
          { k: 'est',   l: 'Estado' },
        ]}
        rows={[
          { fecha: '02/05/2026', pol: 'SEF-2026-VEH-00848', agente: 'Pedro Salazar', tipo: 'Vehículo Particular', prima: usd(532.50), est: rsbadge('Vigente') },
          { fecha: '01/05/2026', pol: 'SEF-2026-VEH-00847', agente: 'Ana Suárez',    tipo: 'Vehículo Particular', prima: usd(714.20), est: rsbadge('Vigente') },
          { fecha: '30/04/2026', pol: 'SEF-2026-VEH-00846', agente: 'Luis Romero',   tipo: 'Vehículo Comercial',  prima: usd(1240.00),est: rsbadge('Vigente') },
          { fecha: '29/04/2026', pol: 'SEF-2026-VEH-00845', agente: 'Carla Mendoza', tipo: 'Vehículo Particular', prima: usd(487.00), est: rsbadge('Vigente') },
        ]}
      />

      <h4 className="font-semibold text-slate-700 mb-3 mt-6 text-sm">Comisiones del Período</h4>
      <DataTable
        cols={[
          { k: 'ben',  l: 'Beneficiario', tr: true },
          { k: 'rol',  l: 'Rol',          hide: 'sm' },
          { k: 'pol',  l: 'Pólizas',      r: true, hide: 'sm' },
          { k: 'base', l: 'Base',         r: true, hide: 'md' },
          { k: 'tasa', l: 'Tasa',         r: true, hide: 'md' },
          { k: 'com',  l: 'Comisión',     r: true },
          { k: 'est',  l: 'Estado' },
        ]}
        rows={[
          { ben: 'Pedro Salazar',  rol: 'Agente',   pol: 14, base: usd(7280),  tasa: '10%', com: usd(728.00),  est: rsbadge('Pendiente') },
          { ben: 'Ana Suárez',     rol: 'Agente',   pol: 18, base: usd(9840),  tasa: '10%', com: usd(984.00),  est: rsbadge('Pagada') },
          { ben: 'Luis Romero',    rol: 'Agente',   pol: 21, base: usd(11480), tasa: '10%', com: usd(1148.00), est: rsbadge('Pendiente') },
          { ben: 'Romero & Asoc.', rol: 'Corredor', pol: 12, base: usd(6240),  tasa: '5%',  com: usd(312.00),  est: rsbadge('Pagada') },
        ]}
      />
    </div>
  )
}

// ── Tab: Superintendencia ────────────────────────────────────
function TabSuperintendencia() {
  const { showToast } = useApp()
  return (
    <div>
      <div className="card p-3.5 mb-4 flex flex-wrap items-center gap-3">
        <select className="text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500">
          <option>Mayo 2026</option><option>Abril 2026</option><option>Marzo 2026</option>
        </select>
        <select className="text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500">
          <option>Todos los ramos</option><option>Vehículo Particular</option><option>Vehículo Comercial</option>
        </select>
        <button onClick={() => showToast('Generando reporte SUDEASEG…', 'info')} className="btn-primary ml-auto shrink-0">
          <Download className="w-4 h-4" />Exportar SUDEASEG
        </button>
      </div>
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-5">
        {[
          { label: 'Pólizas Emitidas', val: '59',     sub: 'Mayo 2026',  cls: 'border-t-blue-500',    vcls: 'text-slate-800' },
          { label: 'Prima Total',      val: '$38,480', sub: 'USD',        cls: 'border-t-emerald-500', vcls: 'text-emerald-700' },
          { label: 'RC Obligatoria',   val: '59',      sub: 'pólizas',    cls: 'border-t-amber-500',   vcls: 'text-amber-700' },
          { label: 'Cancelaciones',    val: '3',       sub: 'Mayo 2026',  cls: 'border-t-slate-400',   vcls: 'text-slate-700' },
        ].map(c => (
          <div key={c.label} className={`card p-4 text-center border-t-4 ${c.cls}`}>
            <p className="text-xs text-slate-600 uppercase tracking-wide">{c.label}</p>
            <p className={`text-2xl font-black mt-1 ${c.vcls}`}>{c.val}</p>
            <p className="text-xs text-slate-400">{c.sub}</p>
          </div>
        ))}
      </div>
      <DataTable
        cols={[
          { k: 'ramo',  l: 'Ramo',       tr: true },
          { k: 'pol',   l: 'Pólizas',    r: true, hide: 'sm' },
          { k: 'prima', l: 'Prima Neta', r: true },
          { k: 'rc',    l: 'RC Obl.',    r: true, hide: 'md' },
          { k: 'can',   l: 'Canceladas', r: true, hide: 'md' },
          { k: 'bs2',   l: 'Prima Bs',   r: true, hide: 'sm' },
        ]}
        rows={[
          { ramo: 'Vehículo Particular', pol: 47, prima: usd(28140), rc: 47, can: 2, bs2: bs(28140) },
          { ramo: 'Vehículo Comercial',  pol: 12, prima: usd(10340), rc: 12, can: 1, bs2: bs(10340) },
          { ramo: 'TOTAL',               pol: 59, prima: usd(38480), rc: 59, can: 3, bs2: bs(38480) },
        ]}
      />
    </div>
  )
}

// ── Tab: Oficinas ────────────────────────────────────────────
function TabOficinas() {
  const { showToast } = useApp()
  return (
    <div>
      <div className="card p-3.5 mb-4 flex flex-wrap items-center gap-3">
        <input type="date" defaultValue="2026-05-01" className="min-w-0 text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500" />
        <input type="date" defaultValue="2026-05-07" className="min-w-0 text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500" />
        <select className="text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500">
          <option>Todas las oficinas</option><option>Caracas Principal</option><option>Valencia</option><option>Maracaibo</option>
        </select>
        <button onClick={() => showToast('Exportando reporte de oficinas…', 'info')} className="btn-secondary ml-auto shrink-0">
          <Download className="w-4 h-4" />Exportar
        </button>
      </div>
      <DataTable
        cols={[
          { k: 'ofi',   l: 'Oficina',     tr: true },
          { k: 'ag',    l: 'Agentes',     r: true, hide: 'sm' },
          { k: 'pol',   l: 'Pólizas',     r: true, hide: 'sm' },
          { k: 'prima', l: 'Prima Neta',  r: true },
          { k: 'pct',   l: '% del Total', r: true, hide: 'md' },
          { k: 'est',   l: 'Estado',      hide: 'md' },
        ]}
        rows={[
          { ofi: 'Caracas Principal', ag: 4, pol: 34, prima: usd(22640), pct: '58.8%', est: rsbadge('Activa') },
          { ofi: 'Valencia',          ag: 2, pol: 15, prima: usd(9810),  pct: '25.5%', est: rsbadge('Activa') },
          { ofi: 'Maracaibo',         ag: 2, pol: 10, prima: usd(6030),  pct: '15.7%', est: rsbadge('Activa') },
          { ofi: 'TOTAL',             ag: 8, pol: 59, prima: usd(38480), pct: '100%',  est: '' },
        ]}
      />
    </div>
  )
}

// ── Tab: Personal ────────────────────────────────────────────
function TabPersonal() {
  const { showToast } = useApp()
  return (
    <div>
      <div className="card p-3.5 mb-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-44">
          <input type="text" placeholder="Buscar personal…" className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition" />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
        <select className="text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500">
          <option>Todos los roles</option><option>Agente</option><option>Supervisor</option><option>Gerente</option>
        </select>
        <button onClick={() => showToast('Exportando reporte de personal…', 'info')} className="btn-secondary ml-auto">
          <Download className="w-4 h-4" />Exportar
        </button>
      </div>
      <DataTable
        cols={[
          { k: 'nom',   l: 'Nombre',          tr: true },
          { k: 'rol',   l: 'Rol',             hide: 'sm' },
          { k: 'ofi',   l: 'Oficina',         hide: 'md' },
          { k: 'pol',   l: 'Pólizas',         r: true, hide: 'sm' },
          { k: 'prima', l: 'Prima Generada',  r: true },
          { k: 'com',   l: 'Comisión',        r: true, hide: 'md' },
          { k: 'est',   l: 'Estado' },
        ]}
        rows={[
          { nom: 'Ana Suárez',    rol: 'Agente',     ofi: 'Caracas',   pol: 18, prima: usd(9840),  com: usd(984),  est: rsbadge('Activo') },
          { nom: 'Luis Romero',   rol: 'Agente',     ofi: 'Caracas',   pol: 21, prima: usd(11480), com: usd(1148), est: rsbadge('Activo') },
          { nom: 'Pedro Salazar', rol: 'Agente',     ofi: 'Valencia',  pol: 14, prima: usd(7280),  com: usd(728),  est: rsbadge('Activo') },
          { nom: 'Carla Mendoza', rol: 'Agente',     ofi: 'Maracaibo', pol: 6,  prima: usd(2880),  com: usd(288),  est: rsbadge('Activo') },
          { nom: 'Rosa Control',  rol: 'Supervisor', ofi: 'Caracas',   pol: '—',prima: '—',        com: '—',       est: rsbadge('Activo') },
        ]}
      />
    </div>
  )
}

// ── Tab: Automáticos ─────────────────────────────────────────
function TabAutomaticos() {
  const { showToast } = useApp()
  const scheduled = [
    ['Reporte diario de ventas',       'Diario 08:00 AM',       true],
    ['Reporte semanal de pólizas',     'Lunes 07:00 AM',        true],
    ['Reporte mensual SUDEASEG',       '1er día del mes 00:01', true],
    ['Pólizas próximas a vencer',      'Diario 09:00 AM',       true],
    ['Reporte de comisiones',          'Quincena (1 y 15)',      false],
    ['Reporte de cobranza pendiente',  'Diario 08:30 AM',       false],
  ]

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="card p-6">
        <h4 className="font-semibold text-slate-800 mb-5 text-sm">Reportes Programados</h4>
        <div className="space-y-3">
          {scheduled.map(([lbl, sched, on]) => (
            <div key={lbl} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/50">
              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-700">{lbl}</p>
                <p className="text-xs text-slate-400 mt-0.5">{sched}</p>
              </div>
              <div className="toggle-wrap ml-4">
                <input type="checkbox" defaultChecked={on} className="toggle-input" />
                <span className="toggle-track" />
              </div>
            </div>
          ))}
        </div>
        <button onClick={() => showToast('Configuración de reportes automáticos guardada', 'success')} className="btn-primary mt-5">
          <Check className="w-4 h-4" />Guardar
        </button>
      </div>

      <div className="card p-6">
        <h4 className="font-semibold text-slate-800 mb-5 text-sm">Últimos Reportes Generados</h4>
        <DataTable
          cols={[
            { k: 'rep',   l: 'Reporte',   tr: true },
            { k: 'fecha', l: 'Fecha/Hora', hide: 'sm' },
            { k: 'est',   l: 'Estado' },
            { k: 'acc',   l: '',          acc: true },
          ]}
          rows={[
            { rep: 'Ventas diarias',       fecha: '07/05/2026 08:00', est: rsbadge('Generado') },
            { rep: 'Pólizas por vencer',   fecha: '07/05/2026 09:00', est: rsbadge('Generado') },
            { rep: 'Ventas diarias',       fecha: '06/05/2026 08:00', est: rsbadge('Generado') },
            { rep: 'SUDEASEG Mayo',        fecha: '01/05/2026 00:01', est: rsbadge('Generado') },
            { rep: 'Comisiones quincenal', fecha: '01/05/2026 00:05', est: rsbadge('Generado') },
          ].map(r => ({
            ...r,
            acc: (
              <button onClick={() => showToast('Descargando reporte', 'info')} className="text-xs text-blue-600 hover:underline font-semibold flex items-center gap-1">
                <Download className="w-4 h-4" />Descargar
              </button>
            ),
          }))}
        />
      </div>
    </div>
  )
}

// ── Main Reportes page ───────────────────────────────────────
const TABS = [
  { key: 'ventas',           label: 'Ventas / Comisiones', Icon: TrendingUp,  Component: TabVentas },
  { key: 'superintendencia', label: 'Superintendencia',    Icon: Shield,      Component: TabSuperintendencia },
  { key: 'oficinas',         label: 'Oficinas',            Icon: Building2,   Component: TabOficinas },
  { key: 'personal',         label: 'Personal',            Icon: Users,       Component: TabPersonal },
  { key: 'automaticos',      label: 'Automáticos',         Icon: RefreshCw,   Component: TabAutomaticos },
]

export default function Reportes() {
  const { canAct } = useApp()
  const [active, setActive] = useState('ventas')
  const ActiveTab = TABS.find(t => t.key === active)?.Component ?? TabVentas

  if (!canAct('reportes', 'view')) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
        <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center">
          <span className="text-2xl">📊</span>
        </div>
        <p className="font-semibold text-slate-600">Sin acceso</p>
        <p className="text-xs text-slate-400">No tienes permiso para acceder a este módulo.</p>
      </div>
    )
  }

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
