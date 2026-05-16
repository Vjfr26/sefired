/**
 * SearchBar — Barra de búsqueda y acciones de cada módulo.
 *
 * Aparece encima de la tabla en todas las páginas de listado.
 * El campo de texto filtra la lista en tiempo real llamando a onSearch con el texto.
 * La prop `extra` permite agregar botones o controles a la derecha (ej. "Agregar Cliente").
 *
 * En pantallas pequeñas los botones extra se muestran debajo del campo de búsqueda;
 * en pantallas medianas y grandes quedan en la misma línea.
 */
import { Search } from 'lucide-react'

export default function SearchBar({ placeholder, onSearch, extra, children }) {
  return (
    <div className="card p-3.5 mb-4 flex flex-wrap items-center gap-3">
      {/* Campo de búsqueda con ícono de lupa decorativo */}
      <div className="relative flex-1 min-w-44">
        <input
          type="text"
          placeholder={placeholder}
          onChange={e => onSearch?.(e.target.value)}
          className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
        />
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
      </div>

      {/* Botones de acción (Agregar, Imprimir, filtros adicionales, etc.) */}
      {(extra || children) && (
        <div className="flex flex-wrap items-center gap-2 sm:ml-auto w-full sm:w-auto">
          {extra}
          {children}
        </div>
      )}
    </div>
  )
}
