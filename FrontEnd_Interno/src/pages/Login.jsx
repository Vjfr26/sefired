import { useState, useEffect } from 'react'
import { User, KeyRound } from 'lucide-react'

export default function Login({ onLogin }) {
  const [nick, setNick] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Carga dinámica del script de Turnstile si no existe
    const scriptId = 'cloudflare-turnstile-script'
    let script = document.getElementById(scriptId)
    if (!script) {
      script = document.createElement('script')
      script.id = scriptId
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
      script.async = true
      script.defer = true
      document.head.appendChild(script)
    }

    let widgetId = null

    const renderWidget = () => {
      if (window.turnstile && !widgetId) {
        try {
          widgetId = window.turnstile.render('#turnstile-container', {
            sitekey: import.meta.env.VITE_TURNSTILE_SITE_KEY,
            theme: 'light',
          })
        } catch {
          // silencioso — Turnstile no disponible
        }
      }
    }

    if (window.turnstile) {
      renderWidget()
    } else {
      const interval = setInterval(() => {
        if (window.turnstile) {
          clearInterval(interval)
          renderWidget()
        }
      }, 100)
      return () => {
        clearInterval(interval)
        if (window.turnstile && widgetId !== null) {
          try {
            window.turnstile.remove(widgetId)
          } catch (e) {
            console.error('Turnstile remove error:', e)
          }
        }
      }
    }

    return () => {
      if (window.turnstile && widgetId !== null) {
        try {
          window.turnstile.remove(widgetId)
        } catch {
          // silencioso
        }
      }
    }
  }, [])

  // Solo caracteres seguros en el nick: letras, números, punto, guión, underscore
  const NICK_REGEX = /^[a-zA-Z0-9._-]+$/

  const [loginError, setLoginError] = useState('')

  const resetTurnstile = () => {
    if (typeof window.turnstile !== 'undefined') {
      try { window.turnstile.reset() } catch {}
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoginError('')

    // ── Validación local antes de enviar al servidor ─────────────────────────
    if (!nick.trim()) {
      setLoginError('Ingresa tu usuario.')
      return
    }
    if (!NICK_REGEX.test(nick)) {
      setLoginError('El usuario no puede contener comillas ni caracteres especiales.')
      return
    }
    if (nick.length > 50) {
      setLoginError('El usuario es demasiado largo.')
      return
    }
    if (!password) {
      setLoginError('Ingresa tu contraseña.')
      return
    }
    if (password.length > 255) {
      setLoginError('La contraseña introducida es demasiado larga.')
      return
    }

    const turnstileToken = typeof window.turnstile !== 'undefined' ? window.turnstile.getResponse() : null
    if (!turnstileToken) {
      setLoginError('Por favor, completa la verificación de seguridad.')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ nick: nick.trim(), password, turnstile_token: turnstileToken }),
      })

      const data = await response.json()

      if (response.ok) {
        localStorage.setItem('auth_token', data.access_token)
        localStorage.setItem('user', JSON.stringify(data.user))
        if (onLogin) onLogin()
        else window.location.href = '/index.html'
      } else {
        setLoginError(data.message || 'Error al iniciar sesión.')
        resetTurnstile()
      }
    } catch {
      setLoginError('No se pudo conectar con el servidor. Verifica tu conexión.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-jm-light relative">
      {/* DECORATIVE BACKGROUND BLOBS */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-jm-blue/5 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-jm-green/5 rounded-full blur-3xl"></div>
      </div>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 pt-1 pb-4 sm:px-6 sm:py-8">
        <div className="w-full max-w-sm sm:max-w-md">
          
          {/* LOGO */}
          <div className="flex flex-col items-center mb-3 sm:mb-6">
            <img src="/logo-sinfondo.png" alt="Logo J&M" className="h-20 sm:h-28 lg:h-36 w-auto object-contain" />
            <p className="text-[8px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] text-center mt-2.5">
              La Venezolana de Seguros y Vida
            </p>
          </div>

          {/* LOGIN CARD */}
          <div className="card p-4 sm:p-8 bg-white/50 backdrop-blur-2xl shadow-2xl shadow-jm-blue/10 animate-in fade-in zoom-in duration-700">
            <div className="mb-3 sm:mb-6">
              <h1 className="text-lg sm:text-2xl font-black text-slate-800 tracking-tight">Bienvenido</h1>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Ingresa tus credenciales para acceder al panel interno
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-5">
              {/* Nick/Usuario */}
              <div className="input-group">
                <label className="input-label">Usuario / Nick</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={nick}
                    maxLength={50}
                    autoComplete="username"
                    onChange={(e) => {
                      // Filtrar en tiempo real: solo caracteres permitidos
                      const safe = e.target.value.replace(/[^a-zA-Z0-9._-]/g, '')
                      setNick(safe)
                      setLoginError('')
                    }}
                    className="input-control h-10 sm:h-12 pl-10 bg-slate-50/50 border-slate-100 hover:border-jm-blue/30 transition-all"
                    placeholder="Tu usuario"
                  />
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                    <User className="w-4 h-4" />
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
                    value={password}
                    maxLength={255}
                    autoComplete="current-password"
                    onChange={(e) => { setPassword(e.target.value); setLoginError('') }}
                    className="input-control h-10 sm:h-12 pl-10 bg-slate-50/50 border-slate-100 hover:border-jm-blue/30 transition-all"
                    placeholder="••••••••"
                  />
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                    <KeyRound className="w-4 h-4" />
                  </div>
                </div>
              </div>

              {/* Mensaje de error */}
              {loginError && (
                <p className="text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2">
                  {loginError}
                </p>
              )}

              {/* Cloudflare Turnstile */}
              <div className="flex justify-center overflow-hidden">
                <div id="turnstile-container" className="w-full flex justify-center"></div>
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
                ) : (
                  'Iniciar Sesión'
                )}
              </button>
            </form>
          </div>

        </div>
      </main>

      {/* FOOTER */}
      <footer className="w-full px-4 py-3 sm:py-5 border-t border-slate-200/60 bg-white/20 backdrop-blur-sm">
        <div className="flex flex-col items-center gap-0.5 text-center px-2">
          <p className="text-[10px] font-bold text-slate-700 uppercase tracking-widest leading-snug">
            © 2024 J&M R.L. — Todos los derechos reservados
          </p>
          <p className="text-[9px] text-slate-400 uppercase tracking-[0.15em] leading-snug">
            V 2.4.0 — Internal System · Made with <span className="text-red-400">❤</span> by Victecnology lda.
          </p>
        </div>
      </footer>
    </div>
  )
}