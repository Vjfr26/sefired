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
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-jm-blue/20 border-t-jm-blue rounded-full animate-spin" />
          <p className="text-xs text-slate-400 font-medium tracking-wide">Verificando sesión…</p>
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
