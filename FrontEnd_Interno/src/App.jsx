import { useState } from 'react'
import Login from './pages/Login.jsx'
import Layout from './pages/Layout.jsx'
import { AppProvider } from './context/AppContext.jsx'

export default function App() {
  const [loggedIn, setLoggedIn] = useState(false)

  if (!loggedIn) {
    return <Login onLogin={() => setLoggedIn(true)} />
  }

  return (
    <AppProvider onLogout={() => setLoggedIn(false)}>
      <Layout />
    </AppProvider>
  )
}
