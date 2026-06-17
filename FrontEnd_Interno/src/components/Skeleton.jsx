/**
 * Skeleton — Componentes de carga animada (shimmer).
 *
 * Exports:
 *   Skel           — Bloque base con animación shimmer. Acepta className para tamaño/forma.
 *   SkeletonStatCards — Grid de N tarjetas de estadísticas en estado de carga.
 *   SkeletonPage   — Esqueleto de página completa (cards + tabla) para el lazy-load.
 */

/** Bloque base shimmer. Úsalo con clases de tamaño: `className="h-3 w-24 rounded"` */
export function Skel({ className = '' }) {
  return <div className={`skeleton ${className}`} aria-hidden="true" />
}

/**
 * Grid de tarjetas de estadísticas en estado de carga.
 * Replica la estructura exacta que usan Clientes, Usuarios, Vehículos, etc.
 */
export function SkeletonStatCards({ count = 4 }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6" aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card p-4 flex items-start gap-3">
          <Skel className="w-9 h-9 rounded-xl shrink-0" />
          <div className="flex-1 space-y-2 min-w-0">
            <Skel className="h-3 w-20 rounded" />
            <Skel className="h-6 w-12 rounded" />
            <Skel className="h-2.5 w-28 rounded" />
          </div>
        </div>
      ))}
    </div>
  )
}

/**
 * Esqueleto de página completa: stat cards + barra de búsqueda + tabla.
 * Usado por el Suspense fallback al cargar páginas lazy.
 */
export function SkeletonPage() {
  return (
    <div className="space-y-5 pt-1" aria-hidden="true">
      {/* Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="card p-4 flex items-start gap-3">
            <Skel className="w-9 h-9 rounded-xl shrink-0" />
            <div className="flex-1 space-y-2 min-w-0">
              <Skel className="h-3 w-20 rounded" />
              <Skel className="h-6 w-12 rounded" />
              <Skel className="h-2.5 w-24 rounded" />
            </div>
          </div>
        ))}
      </div>

      {/* SearchBar */}
      <div className="card px-4 py-3 flex items-center gap-3">
        <Skel className="h-4 w-4 rounded shrink-0" />
        <Skel className="h-4 flex-1 rounded" />
        <Skel className="h-8 w-32 rounded-xl" />
      </div>

      {/* Table */}
      <div className="card overflow-hidden mx-2 sm:mx-0 px-3 sm:px-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-100">
              <tr>
                {[60, 140, 90, 100, 80, 70].map((w, i) => (
                  <th key={i} className="th-cell">
                    <Skel className={`h-3 rounded`} style={{ width: w }} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {Array.from({ length: 7 }).map((_, ri) => (
                <tr key={ri}>
                  {[48, 160, 100, 110, 90, 80].map((w, ci) => (
                    <td key={ci} className="td-cell">
                      <Skel className="h-3.5 rounded" style={{ width: w }} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-3 border-t border-slate-100">
          <Skel className="h-3 w-20 rounded" />
        </div>
      </div>
    </div>
  )
}
