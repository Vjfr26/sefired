/**
 * App — Componente raíz de la aplicación.
 *
 * Gestiona el único estado de autenticación de toda la app: si el usuario
 * está logueado o no. Según ese valor muestra una de dos cosas:
 *   - Login: pantalla de inicio de sesión
 *   - AppProvider + Layout: el panel completo con sidebar, header y contenido
 *
 * AppProvider envuelve el Layout para que todos los componentes internos
 * puedan acceder al estado global (modales, toasts, navegación, etc.).
 * Al cerrar sesión se destruye AppProvider y se vuelve al estado inicial.
 */
import { useState } from 'react'
import Login from './pages/Login.jsx'
import Layout from './pages/Layout.jsx'
import { AppProvider } from './context/AppContext.jsx'

export default function App() {
  const [loggedIn, setLoggedIn] = useState(false)

  // Si no está logueado, solo se ve la pantalla de login
  if (!loggedIn) {
    return <Login onLogin={() => setLoggedIn(true)} />
  }

  // Una vez autenticado, se provee el contexto global y se muestra el panel
  return (
    <AppProvider onLogout={() => setLoggedIn(false)}>
      <Layout />
    </AppProvider>
  )
}
