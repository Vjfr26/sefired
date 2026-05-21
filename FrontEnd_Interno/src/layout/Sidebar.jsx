/**
 * Sidebar — Barra de navegación lateral de la aplicación.
 *
 * Muestra el logo de Sefired, los ítems de menú y un widget con las tasas
 * BCV del día (dólar y euro). El diseño tiene dos versiones:
 *
 *   - Escritorio (lg+): el sidebar es fijo y siempre visible a la izquierda.
 *     El logo se muestra en formato cuadrado centrado encima del menú.
 *
 *   - Móvil/tablet (< lg): el sidebar se muestra como panel deslizante.
 *     Se abre desde el botón de hamburguesa del Header y se cierra al
 *     seleccionar una opción o con el overlay de fondo.
 *     El logo se muestra en formato horizontal (logo + texto en línea).
 *
 * La prop `sidebarOpen` es controlada por Layout.jsx (toggle del Header).
 * `onClose` se llama cuando el usuario elige una vista para cerrar el panel en móvil.
 *
 * Las tasas BCV se obtienen automáticamente al iniciar la app (en AppContext)
 * y se muestran directamente desde el estado global sin petición extra.
 */
import {
  Home, Calculator, Package, UserCog, Users, Car,
  BarChart3, DollarSign, Settings,
} from 'lucide-react'
import { useApp } from '../context/AppContext.jsx'
import { NAV } from '../utils/helpers.jsx'

// Mapa de nombre de ícono (string en NAV) → componente de Lucide
const ICON_MAP = {
  home: Home, calculator: Calculator, package: Package,
  'user-cog': UserCog, users: Users, car: Car,
  'bar-chart-3': BarChart3, 'dollar-sign': DollarSign, settings: Settings,
}

export default function Sidebar({ onClose, sidebarOpen = false }) {
  const { activeNavId, navigateTo, tasas } = useApp()

  // Al navegar en móvil/tablet se cierra el sidebar automáticamente
  const handleNav = (viewId) => {
    navigateTo(viewId)
    onClose?.()
  }

  return (
    <aside className={`sidebar-container${sidebarOpen ? ' sidebar-open' : ''}`}>

      {/* ── Logo ── */}
      <div className="px-4 lg:px-5 pt-6 pb-5 shrink-0 border-b border-white/10">
        {/* Versión horizontal para móvil y tablet */}
        <div className="flex lg:hidden items-center gap-3.5 px-1">
          <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center shrink-0 p-1">
            <img src="/logo2.png" alt="Logo" className="w-full h-full object-contain" />
          </div>
          <div className="min-w-0">
            <p className="text-base font-black text-white leading-tight tracking-tight">SEFIRED</p>
            <p className="text-xs font-semibold text-white/60 leading-tight mt-0.5">Cooperativa de Seguros<br />de Vehículos R.L.</p>
          </div>
        </div>
        {/* Versión centrada vertical para escritorio */}
        <div className="hidden lg:flex flex-col items-center text-center gap-3">
          <div className="w-28 h-28 rounded-3xl bg-white/10 border border-white/15 flex items-center justify-center p-1.5 shadow-lg">
            <img src="/logo2.png" alt="Logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <p className="text-xl font-black text-white tracking-tight">SEFIRED</p>
            <p className="text-xs font-semibold text-white/55 mt-1 leading-snug">Cooperativa de Seguros<br />de Vehículos R.L.</p>
          </div>
        </div>
      </div>

      {/* ── Menú de navegación ── */}
      <nav className="flex-1 px-3 py-2 overflow-y-auto sidebar-scroll">
        {NAV.map(g => {
          const Icon = ICON_MAP[g.icon]
          const isActive = activeNavId === g.id
          return (
            <div key={g.id} className="mb-0.5">
              <button
                className={`group-btn ${isActive ? 'group-btn-active' : ''}`}
                onClick={() => handleNav(g.viewId)}
              >
                {Icon && <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-white/50'}`} />}
                <span className="flex-1 leading-tight text-left">{g.label}</span>
              </button>
            </div>
          )
        })}

        {/* ── Widget de tasas BCV ── */}
        {/* Muestra la tasa del dólar y el euro del día actual.
            Si el backend no respondió aún, muestra '—'. */}
        <div className="mt-8 pt-5 border-t border-white/15">
          <p className="text-xs font-bold text-white/45 uppercase tracking-widest px-3 mb-3">Tasas BCV · Hoy</p>
          <div className="space-y-2 px-1">
            <div className="flex items-center justify-between px-3 py-3 rounded-xl bg-emerald-500/15 border border-emerald-500/15">
              <div className="flex items-center gap-2">
                <span className="text-sm font-black text-emerald-400 w-4">$</span>
                <span className="text-sm font-semibold text-white/85">Dólar</span>
              </div>
              <div className="text-right">
                {tasas.usd ? (
                  <>
                    <span className="text-xs font-semibold text-emerald-400/70">Bs. </span>
                    <span className="text-sm font-black text-emerald-300">{Number(tasas.usd.valor).toFixed(4)}</span>
                  </>
                ) : <span className="text-sm font-black text-emerald-300">—</span>}
              </div>
            </div>
            <div className="flex items-center justify-between px-3 py-3 rounded-xl bg-amber-500/15 border border-amber-500/15">
              <div className="flex items-center gap-2">
                <span className="text-sm font-black text-amber-400 w-4">€</span>
                <span className="text-sm font-semibold text-white/85">Euro</span>
              </div>
              <div className="text-right">
                {tasas.eur ? (
                  <>
                    <span className="text-xs font-semibold text-amber-400/70">Bs. </span>
                    <span className="text-sm font-black text-amber-300">{Number(tasas.eur.valor).toFixed(4)}</span>
                  </>
                ) : <span className="text-sm font-black text-amber-300">—</span>}
              </div>
            </div>
          </div>
        </div>
      </nav>
    </aside>
  )
}
