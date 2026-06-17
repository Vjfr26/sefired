/**
 * Toast — Notificaciones temporales flotantes.
 *
 * Se muestra en la esquina inferior derecha de la pantalla.
 * Cada notificación aparece con una animación de deslizamiento y desaparece sola
 * a los 3.5 segundos (el temporizador lo maneja AppContext, no este componente).
 *
 * Para mostrar un toast desde cualquier parte del sistema:
 *   const { showToast } = useApp()
 *   showToast('Mensaje aquí', 'success')   // success | error | info | warning
 */
import { useApp } from '../context/AppContext.jsx'

// Color de fondo según el tipo de notificación
const COLORS = {
  success: 'bg-emerald-600',   // verde: acción exitosa
  error:   'bg-rose-600',      // rojo: error o eliminación
  info:    'bg-blue-600',      // azul: información neutral
  warning: 'bg-amber-500',     // naranja: advertencia
}

export default function Toast() {
  const { toasts } = useApp()

  return (
    // pointer-events-none en el contenedor para que el fondo no bloquee clics.
    // Cada toast individual vuelve a tener pointer-events-auto por si se agrega un botón de cerrar.
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2 pointer-events-none">
      {toasts.map(t => (
        <div
          key={t.id}
          className={`pointer-events-auto flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg text-sm font-medium text-white max-w-xs animate-in fade-in slide-in-from-bottom-2 duration-300 ${COLORS[t.type] || COLORS.info}`}
        >
          {t.message}
        </div>
      ))}
    </div>
  )
}
