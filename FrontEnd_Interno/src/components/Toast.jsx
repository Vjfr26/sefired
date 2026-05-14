import { useApp } from '../context/AppContext.jsx'

const COLORS = {
  success: 'bg-emerald-600',
  error:   'bg-rose-600',
  info:    'bg-blue-600',
  warning: 'bg-amber-500',
}

export default function Toast() {
  const { toasts } = useApp()

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none">
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
