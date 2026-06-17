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
import { useState, useEffect } from 'react'
import Login from './pages/Login.jsx'
import Layout from './pages/Layout.jsx'
import { AppProvider } from './context/AppContext.jsx'

const API_BASE = import.meta.env.VITE_API_URL || ''

export default function App() {
  // null  → validando token (aún no sabemos si hay sesión)
  // false → no autenticado → mostrar login
  // true  → autenticado y verificado → mostrar panel
  const [loggedIn, setLoggedIn] = useState(null)

  useEffect(() => {
    const token = localStorage.getItem('auth_token')

    if (!token) {
      setLoggedIn(false)
      return
    }

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
          localStorage.removeItem('auth_token')
          localStorage.removeItem('user')
          setLoggedIn(false)
        }
      })
      .catch(() => {
        // Si no hay conexión, no mostrar el panel — el usuario debe volver a autenticarse
        localStorage.removeItem('auth_token')
        localStorage.removeItem('user')
        setLoggedIn(false)
      })
  }, [])

  // Pantalla de carga mientras se verifica la sesión — sin datos visibles
  if (loggedIn === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-jm-light">
        <div className="flex flex-col items-center gap-5">
          {/* Logo con anillo giratorio */}
          <div className="relative flex items-center justify-center">
            {/* Anillo exterior */}
            <svg className="absolute w-20 h-20 animate-spin" style={{ animationDuration: '2s' }} viewBox="0 0 80 80">
              <circle cx="40" cy="40" r="36" fill="none" stroke="#001463" strokeWidth="2.5"
                strokeDasharray="56 170" strokeLinecap="round" />
            </svg>
            {/* Badge de marca */}
            <div className="w-14 h-14 rounded-2xl bg-jm-blue shadow-xl shadow-jm-blue/30 flex items-center justify-center">
              <span className="text-white font-black text-2xl tracking-tighter select-none">J</span>
            </div>
          </div>
          <div className="flex flex-col items-center gap-1">
            <p className="text-sm font-bold text-jm-blue tracking-wide">J&amp;M Reaseguradora</p>
            <p className="text-xs text-slate-400 font-medium">Verificando sesión…</p>
          </div>
          {/* Dots animados */}
          <div className="flex gap-1.5">
            {[0, 1, 2].map(i => (
              <span
                key={i}
                className="w-1.5 h-1.5 rounded-full bg-jm-blue/40"
                style={{ animation: `app-pulse 1.2s ease-in-out ${i * 0.2}s infinite` }}
              />
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Sin autenticación → solo login, sin ningún dato precargado
  if (!loggedIn) {
    return <Login onLogin={() => setLoggedIn(true)} />
  }

  // Una vez autenticado y verificado, se provee el contexto global y se muestra el panel
  return (
    <AppProvider onLogout={() => setLoggedIn(false)}>
      <Layout />
    </AppProvider>
  )
}
