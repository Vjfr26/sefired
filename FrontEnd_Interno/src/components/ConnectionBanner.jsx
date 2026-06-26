import { useState, useEffect } from 'react'
import { WifiOff } from 'lucide-react'

/**
 * Banner fijo que avisa cuando el navegador pierde la conexión a internet
 * (eventos online/offline). Mientras está offline, las llamadas al backend
 * fallarán; este aviso le da contexto al usuario en vez de errores sueltos.
 */
export default function ConnectionBanner() {
  const [online, setOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true)

  useEffect(() => {
    const goOnline  = () => setOnline(true)
    const goOffline = () => setOnline(false)
    window.addEventListener('online', goOnline)
    window.addEventListener('offline', goOffline)
    return () => {
      window.removeEventListener('online', goOnline)
      window.removeEventListener('offline', goOffline)
    }
  }, [])

  if (online) return null

  return (
    <div className="fixed top-0 inset-x-0 z-[100] bg-rose-600 text-white text-xs sm:text-sm font-semibold py-2 px-4 flex items-center justify-center gap-2 shadow-lg">
      <WifiOff className="w-4 h-4 shrink-0" />
      Sin conexión a internet — algunas acciones no funcionarán hasta reconectarte.
    </div>
  )
}
