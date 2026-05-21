import { useState } from 'react'
import { Mail, KeyRound } from 'lucide-react'

export default function Login({ onLogin }) {
  const [loading, setLoading] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      onLogin()
    }, 1500)
  }

  return (
    <div className="min-h-screen flex flex-col bg-sefired-light relative">
      {/* Decorative blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-sefired-blue/5 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-sefired-green/5 rounded-full blur-3xl"></div>
      </div>

      {/* Main content */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 pt-1 pb-4 sm:px-6 sm:py-8">
        <div className="w-full max-w-sm sm:max-w-md">

          {/* Logo */}
          <div className="flex flex-col items-center mb-3 sm:mb-6">
            <img src="/logo1%20(Edited).png" alt="Logo Sefired" className="h-20 sm:h-28 lg:h-36 w-auto object-contain" />
            <p className="text-[8px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] text-center mt-2.5">
              Cooperativa de Seguros de Vehículos R.L.
            </p>
          </div>

          {/* Login card */}
          <div className="card p-4 sm:p-8 bg-white/50 backdrop-blur-2xl shadow-2xl shadow-sefired-blue/10 animate-in fade-in zoom-in duration-700">
            <div className="mb-3 sm:mb-6">
              <h1 className="text-lg sm:text-2xl font-black text-slate-800 tracking-tight">Bienvenido</h1>
              <p className="text-xs text-slate-500 font-medium mt-0.5">Ingresa tus credenciales para acceder al panel interno</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-5">
              {/* Email */}
              <div className="input-group">
                <label className="input-label">Correo Electrónico</label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    className="input-control h-10 sm:h-12 pl-10 bg-slate-50/50 border-slate-100 hover:border-sefired-blue/30 transition-all"
                    placeholder="ejemplo@sefired.com"
                  />
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                    <Mail className="w-4 h-4" />
                  </div>
                </div>
              </div>

              {/* Password */}
              <div className="input-group">
                <label className="input-label">Contraseña</label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    className="input-control h-10 sm:h-12 pl-10 bg-slate-50/50 border-slate-100 hover:border-sefired-blue/30 transition-all"
                    placeholder="••••••••"
                  />
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                    <KeyRound className="w-4 h-4" />
                  </div>
                </div>
                <a href="#" className="text-[9px] sm:text-[10px] font-bold text-sefired-blue hover:underline uppercase tracking-tighter mt-1 inline-block">
                  ¿Olvidaste tu contraseña?
                </a>
              </div>

              {/* Remember */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="remember"
                  className="w-3.5 h-3.5 rounded border-slate-300 text-sefired-green focus:ring-sefired-green shrink-0"
                />
                <label htmlFor="remember" className="text-xs text-slate-500 font-medium cursor-pointer select-none">
                  Recordar sesión
                </label>
              </div>

              {/* Cloudflare Turnstile */}
              <div className="flex justify-center overflow-hidden">
                <div className="cf-turnstile w-full" data-sitekey="1x00000000000000000000AA" data-theme="light"></div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-1.5 text-sm font-black rounded-xl shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 disabled:opacity-80 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Autenticando...</span>
                  </div>
                ) : 'Iniciar Sesión'}
              </button>
            </form>
          </div>

          {/* Help */}
          <p className="mt-3 text-center text-xs text-slate-500 font-medium">
            ¿Necesitas ayuda?{' '}
            <a href="#" className="text-sefired-blue font-bold hover:underline">Contactar soporte técnico</a>
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full px-4 py-3 sm:py-5 border-t border-slate-200/60 bg-white/20 backdrop-blur-sm">
        <div className="flex flex-col items-center gap-0.5 text-center px-2">
          <p className="text-[10px] font-bold text-slate-700 uppercase tracking-widest leading-snug">
            © 2024 SEFIRED R.L. — Todos los derechos reservados
          </p>
          <p className="text-[9px] text-slate-400 uppercase tracking-[0.15em] leading-snug">
            V 2.4.0 — Internal System · Made with <span className="text-red-400">❤</span> by Victecnology lda.
          </p>
        </div>
      </footer>
    </div>
  )
}
