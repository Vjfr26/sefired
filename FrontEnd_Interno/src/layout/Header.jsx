import { useState } from 'react'
import { Menu, ChevronDown, LogOut } from 'lucide-react'
import { useApp } from '../context/AppContext.jsx'
import { VIEW_META, UserAvatar } from '../utils/helpers.jsx'

export default function Header({ onSidebarOpen }) {
  const { currentView, showToast, onLogout } = useApp()
  const [menuOpen, setMenuOpen] = useState(false)

  const meta = VIEW_META[currentView]
  const title    = meta?.title ?? '—'
  const subtitle = meta?.sub   ?? '—'

  const handleLogout = () => {
    setMenuOpen(false)
    showToast('Sesión cerrada correctamente', 'info')
    setTimeout(() => onLogout?.(), 1000)
  }

  return (
    <header className="bg-sefired-light px-4 sm:px-8 lg:px-12 py-5 flex items-center justify-between shrink-0 border-b border-white/40 shadow-sm">
      <div className="flex items-center gap-3 min-w-0">
        <button
          className="lg:hidden p-2 rounded-xl hover:bg-slate-100 transition-colors shrink-0"
          onClick={onSidebarOpen}
          aria-label="Abrir menú"
        >
          <Menu className="w-5 h-5 text-sefired-dark" />
        </button>
        <div className="min-w-0">
          <h2 className="text-lg sm:text-2xl font-black text-sefired-dark tracking-tight truncate">{title}</h2>
          <p className="text-xs sm:text-sm text-slate-600 font-medium mt-0.5 truncate">{subtitle}</p>
        </div>
      </div>

      {/* User menu */}
      <div className="flex items-center shrink-0">
        <div className="relative">
          <button
            onClick={() => setMenuOpen(v => !v)}
            className="flex items-center gap-2 px-2 sm:px-4 py-2 bg-white/50 backdrop-blur-sm rounded-full border border-white/50 cursor-pointer hover:bg-white transition-all shadow-sm"
          >
            <UserAvatar rol="Admin" genero="M" className="w-6 h-6 rounded-full" />
            <span className="hidden sm:inline text-sm font-bold text-sefired-dark">Carlos Ruiz</span>
            <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${menuOpen ? 'rotate-180' : ''}`} />
          </button>

          {menuOpen && (
            <>
              {/* Click-outside backdrop */}
              <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-full mt-2 w-48 sm:w-52 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-50">
                <div className="px-4 py-3 border-b border-slate-100">
                  <p className="text-sm font-bold text-slate-800 truncate">Carlos Ruiz</p>
                  <p className="text-xs text-slate-500">Asesor de Ventas</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-4 py-3 text-sm font-semibold text-rose-600 hover:bg-rose-50 transition-colors whitespace-nowrap"
                >
                  <LogOut className="w-4 h-4 shrink-0" />
                  Cerrar Sesión
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
