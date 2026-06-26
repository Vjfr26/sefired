import { AlertTriangle } from 'lucide-react'

/**
 * Pantalla de estado reutilizable (404, sin conexión, error genérico).
 * No usa el contexto de la app, así que puede mostrarse incluso fuera del
 * AppProvider (ej. en App.jsx, antes de tener sesión).
 *
 * @param {Component} icon       Ícono de lucide (default: AlertTriangle)
 * @param {string}    iconBg     Clases de fondo del ícono
 * @param {string}    iconColor  Clases de color del ícono
 * @param {string}    title      Título
 * @param {string}    message    Mensaje
 * @param {ReactNode} actions    Botones de acción
 * @param {boolean}   fullscreen Si true, ocupa toda la pantalla y centra (para App.jsx)
 */
export default function StatusScreen({
  icon: Icon = AlertTriangle,
  iconBg = 'bg-rose-100',
  iconColor = 'text-rose-600',
  title,
  message,
  actions = null,
  fullscreen = false,
}) {
  const wrap = fullscreen
    ? 'min-h-screen flex items-center justify-center bg-jm-light p-4'
    : 'py-12 sm:py-16 px-4'

  return (
    <div className={wrap}>
      <div className="card p-8 sm:p-12 flex flex-col items-center text-center gap-4 max-w-lg mx-auto w-full">
        <div className={`w-16 h-16 rounded-2xl ${iconBg} flex items-center justify-center`}>
          <Icon className={`w-8 h-8 ${iconColor}`} />
        </div>
        <div>
          <p className="text-lg font-black text-slate-800 mb-1">{title}</p>
          <p className="text-sm text-slate-500 leading-relaxed">{message}</p>
        </div>
        {actions && <div className="flex flex-wrap gap-2 justify-center mt-2">{actions}</div>}
      </div>
    </div>
  )
}
