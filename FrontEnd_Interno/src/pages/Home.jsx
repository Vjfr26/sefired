import { Users, Calculator, BarChart3 } from 'lucide-react'
import { useApp } from '../context/AppContext.jsx'

export default function Home() {
  const { navigateTo } = useApp()

  return (
    <div className="animate-in fade-in duration-700 pt-4 sm:pt-6">
      <div className="card w-full max-w-xl mx-auto overflow-hidden">
        {/* User info */}
        <div className="flex flex-col items-center text-center px-8 sm:px-14 pt-8 sm:pt-10 pb-7 sm:pb-9 border-b border-slate-100">
          <div className="w-20 h-20 rounded-3xl bg-sefired-blue flex items-center justify-center text-2xl font-extrabold text-white mb-5 shadow-xl shadow-blue-900/20">
            CR
          </div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.28em] mb-2">Bienvenido de vuelta</p>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-800 mb-2 tracking-tight">Carlos Ruiz</h2>
          <p className="text-sm font-semibold text-slate-500">Asesor de Ventas · Sefired R.L.</p>
          <p className="text-xs text-slate-400 font-mono mt-1.5">RIF: J-30012345-6 · Caracas Principal</p>
        </div>

        {/* Quick access */}
        <div className="grid grid-cols-3 divide-x divide-slate-100">
          <button
            onClick={() => navigateTo('cli-cliente')}
            className="flex flex-col items-center gap-2.5 py-8 px-3 hover:bg-blue-50/60 transition-colors duration-200 group"
          >
            <div className="w-11 h-11 rounded-2xl bg-blue-100 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-700">Clientes</p>
              <p className="text-xs text-slate-400 mt-0.5">Gestionar</p>
            </div>
          </button>

          <button
            onClick={() => navigateTo('cot-simulador')}
            className="flex flex-col items-center gap-2.5 py-8 px-3 hover:bg-emerald-50/60 transition-colors duration-200 group"
          >
            <div className="w-11 h-11 rounded-2xl bg-emerald-100 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
              <Calculator className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-700">Simulador</p>
              <p className="text-xs text-slate-400 mt-0.5">Cotizar</p>
            </div>
          </button>

          <button
            onClick={() => navigateTo('rep-menu')}
            className="flex flex-col items-center gap-2.5 py-8 px-3 hover:bg-amber-50/60 transition-colors duration-200 group"
          >
            <div className="w-11 h-11 rounded-2xl bg-amber-100 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
              <BarChart3 className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-700">Reportes</p>
              <p className="text-xs text-slate-400 mt-0.5">Ver</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  )
}
