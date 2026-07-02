/**
 * App — Componente raíz de la aplicación.
 *
 * Gestiona el único estado de autenticación de toda la app: si el usuario
 * está logueado o no. Según ese valor muestra una de dos cosas:
 *   - Login: pantalla de inicio de sesión
 *   - AppProvider + Layout: el panel completo con sidebar, header y contenido
 *
 * Al arrancar, si hay un token almacenado se valida contra el backend antes
 * de mostrar cualquier dato. Si el token es inválido o expirado se limpia y
 * se redirige al login. Nunca se muestra el panel sin autenticación verificada.
 */
import { useState, useEffect, useCallback, useRef } from 'react'
import { WifiOff, RefreshCw } from 'lucide-react'
import Login from './pages/Login.jsx'
import Layout from './pages/Layout.jsx'
import StatusScreen from './components/StatusScreen.jsx'
import { AppProvider } from './context/AppContext.jsx'

const API_BASE = import.meta.env.VITE_API_URL || ''

// Pantalla animada (logo + anillo giratorio + dots). Se usa tanto al verificar
// la sesión al arrancar como al cerrarla (takeover / expiración).
function Splash({ text }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-jm-light">
      <div className="flex flex-col items-center gap-5">
        <div className="relative flex items-center justify-center w-24 h-24">
          <svg className="absolute w-24 h-24 animate-spin" style={{ animationDuration: '2s' }} viewBox="0 0 80 80">
            <circle cx="40" cy="40" r="36" fill="none" stroke="#001463" strokeWidth="2.5"
              strokeDasharray="56 170" strokeLinecap="round" />
          </svg>
          <img src="/logo-sinfondo.png" alt="Logo J&amp;M" className="w-14 h-14 object-contain animate-pulse select-none" />
        </div>
        <p className="text-xs text-slate-400 font-medium">{text}</p>
        <div className="flex gap-1.5">
          {[0, 1, 2].map(i => (
            <span key={i} className="w-1.5 h-1.5 rounded-full bg-jm-blue/40"
              style={{ animation: `app-pulse 1.2s ease-in-out ${i * 0.2}s infinite` }} />
          ))}
        </div>
      </div>
    </div>
  )
}

export default function App() {
  // null  → validando token (aún no sabemos si hay sesión)
  // false → no autenticado → mostrar login
  // true  → autenticado y verificado → mostrar panel
  const [loggedIn, setLoggedIn] = useState(null)
  // true → no se pudo contactar al backend al validar la sesión (sin conexión /
  // servidor caído). Distinto de "no autenticado": aquí NO se borra el token,
  // se ofrece reintentar para no echar al usuario por una caída momentánea.
  const [connError, setConnError] = useState(false)
  // Cierre de sesión en curso (takeover / expiración) → muestra la animación
  // "Cerrando sesión…" antes de redirigir al login. `sessionMsg` es el aviso
  // que verá el usuario en la pantalla de login.
  const [loggingOut, setLoggingOut] = useState(false)
  const [sessionMsg, setSessionMsg] = useState('')
  const loggingOutRef = useRef(false)

  // Escucha el evento global disparado por el interceptor (main.jsx) cuando el
  // backend responde con X-Session-Expired.
  useEffect(() => {
    const onEnded = (e) => {
      if (loggingOutRef.current) return
      loggingOutRef.current = true

      const motivo = e.detail?.motivo
      const msg = motivo === 'nueva_sesion'
        ? 'Se inició sesión con tu usuario en otro dispositivo, por lo que esta sesión se cerró.'
        : motivo === 'expirada'
          ? 'Tu sesión expiró por inactividad. Inicia sesión de nuevo.'
          : 'Tu sesión finalizó. Inicia sesión de nuevo.'

      setLoggingOut(true)
      // Deja ver la animación un momento y luego redirige al login.
      setTimeout(() => {
        localStorage.removeItem('auth_token')
        localStorage.removeItem('user')
        setSessionMsg(msg)
        setLoggingOut(false)
        setLoggedIn(false)
        loggingOutRef.current = false
      }, 1600)
    }
    window.addEventListener('jm-session-ended', onEnded)
    return () => window.removeEventListener('jm-session-ended', onEnded)
  }, [])

  const checkSession = useCallback(() => {
    setConnError(false)
    const token = localStorage.getItem('auth_token')

    if (!token) {
      setLoggedIn(false)
      return
    }

    setLoggedIn(null)
    // Validar el token contra el backend antes de mostrar cualquier dato
    fetch(`${API_BASE}/api/user`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      },
    })
      .then(res => {
        if (res.ok) {
          setLoggedIn(true)
        } else {
          // Token inválido/expirado → cerrar sesión y mostrar login
          localStorage.removeItem('auth_token')
          localStorage.removeItem('user')
          setLoggedIn(false)
        }
      })
      .catch(() => {
        // Falla de red / backend caído → no desloguear, ofrecer reintentar
        setConnError(true)
      })
  }, [])

  useEffect(() => { checkSession() }, [checkSession])

  // Cierre de sesión en curso → animación "Cerrando sesión…"
  if (loggingOut) {
    return <Splash text="Cerrando sesión…" />
  }

  // Pantalla de error de conexión con la opción de reintentar
  if (connError) {
    return (
      <StatusScreen
        fullscreen
        icon={WifiOff}
        title="No se pudo conectar"
        message="No pudimos contactar al servidor. Verifica tu conexión a internet e inténtalo de nuevo."
        actions={
          <button onClick={checkSession} className="btn-primary">
            <RefreshCw className="w-4 h-4" /> Reintentar
          </button>
        }
      />
    )
  }

  // Pantalla de carga mientras se verifica la sesión — sin datos visibles
  if (loggedIn === null) {
    return <Splash text="Verificando sesión…" />
  }

  // Sin autenticación → solo login, sin ningún dato precargado
  if (!loggedIn) {
    return <Login onLogin={() => { setSessionMsg(''); setLoggedIn(true) }} msg={sessionMsg} />
  }

  // Una vez autenticado y verificado, se provee el contexto global y se muestra el panel
  return (
    <AppProvider onLogout={() => setLoggedIn(false)}>
      <Layout />
    </AppProvider>
  )
}
