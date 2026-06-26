import { SearchX, Home } from 'lucide-react'
import { useApp } from '../context/AppContext.jsx'
import StatusScreen from '../components/StatusScreen.jsx'

/**
 * Página 404: se muestra cuando se navega a una vista que no existe.
 */
export default function NotFound() {
  const { navigateTo } = useApp()
  return (
    <StatusScreen
      icon={SearchX}
      iconBg="bg-amber-100"
      iconColor="text-amber-600"
      title="Página no encontrada (404)"
      message="La sección que buscas no existe, fue movida, o no tienes acceso a ella."
      actions={
        <button onClick={() => navigateTo('home')} className="btn-primary">
          <Home className="w-4 h-4" /> Volver al inicio
        </button>
      }
    />
  )
}
