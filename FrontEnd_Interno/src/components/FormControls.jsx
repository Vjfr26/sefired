/**
 * Controles de formulario compartidos, para un estilo consistente en todos
 * los modales/formularios de la app.
 */
import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

/** Interruptor on/off accesible (reemplaza checkboxes). */
export function Switch({ checked, onChange }) {
  return (
    <button
      type="button" role="switch" aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors outline-none focus-visible:ring-2 focus-visible:ring-jm-blue/40 ${checked ? 'bg-jm-blue' : 'bg-slate-300'}`}
    >
      <span className={`inline-block h-4.5 w-4.5 transform rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-[22px]' : 'translate-x-1'}`} />
    </button>
  )
}

/**
 * Control segmentado: botones para elegir entre 2–4 opciones.
 * `options` puede ser ['A','B'] o [{ value, label }].
 */
export function Segmented({ value, onChange, options }) {
  const opts = options.map(o => (typeof o === 'string' ? { value: o, label: o } : o))
  return (
    <div className="inline-flex w-full rounded-xl border border-slate-200 bg-slate-50 p-0.5">
      {opts.map(o => {
        const on = value === o.value
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className={`flex-1 px-3 py-1.5 rounded-lg text-sm font-semibold transition ${on ? 'bg-white text-jm-blue shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}

/** Input de contraseña con botón mostrar/ocultar. */
export function PasswordInput({ value, onChange, placeholder, className = '', name, disabled, autoComplete }) {
  const [show, setShow] = useState(false)
  return (
    <div className="relative">
      <input
        type={show ? 'text' : 'password'}
        name={name}
        disabled={disabled}
        autoComplete={autoComplete}
        className={`input-field pr-10 ${className}`}
        // .input-field aplica uppercase (para placas/nombres), pero en una
        // contraseña la mayúscula/minúscula importa y confunde ver todo en
        // mayúscula: se fuerza el texto tal cual se teclea.
        style={{ textTransform: 'none' }}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
      />
      <button
        type="button"
        onClick={() => setShow(s => !s)}
        tabIndex={-1}
        disabled={disabled}
        title={show ? 'Ocultar' : 'Mostrar'}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition disabled:opacity-50"
      >
        {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  )
}
