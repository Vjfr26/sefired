/**
 * DataTable — Tabla de datos con ordenamiento y búsqueda opcional.
 *
 * Se usa en todas las pantallas de listado (Clientes, Vehículos, Productos, etc.).
 * Recibe dos cosas:
 *   - cols: descripción de las columnas (qué se muestra y cómo)
 *   - rows: los datos ya transformados en objetos planos
 *
 * ── Descriptor de columna (`cols`) ──────────────────────────────────────────
 *   k     — Clave del objeto en `rows` que contiene el valor de esta celda
 *   l     — Etiqueta visible en el encabezado de la columna
 *   r     — Alinear texto a la derecha (útil para cifras monetarias)
 *   m     — Fuente monoespaciada (para IDs, cédulas, seriales)
 *   nw    — whitespace-nowrap: evita que el texto se parta en varias líneas
 *   hide  — Ocultar en pantallas pequeñas: 'sm', 'md' o 'lg'
 *   tr    — Columna con texto largo que puede romperse (usa break-words)
 *   acc   — Columna de acciones (botones). No es ordenable.
 *
 * ── Ordenamiento ─────────────────────────────────────────────────────────────
 * Al hacer clic en el encabezado de cualquier columna que no sea `acc` se activa
 * el ordenamiento. Clic de nuevo en la misma columna invierte la dirección.
 * Los íconos de flecha indican columna activa y dirección actual.
 *
 * ── Búsqueda ─────────────────────────────────────────────────────────────────
 * Si `searchable` es true se activa un filtro interno que busca el texto en
 * todos los campos string de las filas. El ordenamiento se aplica sobre
 * el resultado filtrado.
 *
 * ── Normalización de valores para ordenar ────────────────────────────────────
 * Las celdas pueden tener strings, números o JSX (badges, botones).
 * La función sortVal() los convierte a valores comparables:
 *   - Números → se usan directamente
 *   - "$1,234.56" → 1234.56 (columnas de dinero)
 *   - "07/05/2026" → "20260507" (fechas en formato venezolano dd/mm/yyyy)
 *   - Strings → minúsculas para ordenamiento sin distinguir mayúsculas
 *   - JSX / null → "" (no tiene sentido ordenar por botones o iconos)
 */
import { useState } from 'react'
import { ChevronsUpDown, ChevronUp, ChevronDown } from 'lucide-react'
import { Skel } from './Skeleton.jsx'

// Clases CSS para ocultar columnas según el tamaño de pantalla
const HIDE = {
  sm: 'hidden sm:table-cell',
  md: 'hidden md:table-cell',
  lg: 'hidden lg:table-cell',
  xl: 'hidden xl:table-cell',
}

// Construye las clases CSS de una celda según las propiedades de la columna
const tdCls = c =>
  `td-cell${c.r    ? ' text-right'                      : ''}` +
  `${c.m           ? ' font-mono text-xs'               : ''}` +
  `${c.bold        ? ' font-bold text-slate-800'        : ''}` +
  `${c.nw          ? ' whitespace-nowrap'               : ''}` +
  `${c.hide        ? ' ' + HIDE[c.hide]                 : ''}` +
  `${c.tr          ? ' max-w-0'                         : ''}` +
  `${c.acc         ? ' whitespace-nowrap !overflow-visible' : ''}`

/**
 * Convierte el valor de una celda a un tipo comparable para ordenar.
 * Los valores JSX (componentes React) devuelven "" y quedan sin orden útil.
 */
function sortVal(v) {
  if (typeof v === 'number') return v
  if (typeof v !== 'string') return ''
  // Detecta "$1,234.56" y convierte a número
  if (/^\$/.test(v))         return parseFloat(v.replace(/[$,]/g, '')) || 0
  // Detecta "07/05/2026" (dd/mm/yyyy) y convierte a "20260507" para que ordene correctamente
  const d = v.match(/^(\d{2})\/(\d{2})\/(\d{4})/)
  if (d)                     return `${d[3]}${d[2]}${d[1]}`
  return v.toLowerCase()
}

const SKEL_WIDTHS = [48, 120, 90, 100, 80, 70, 60, 50]

export default function DataTable({ cols, rows, footer = null, id, searchable = false, loading = false, skeletonRows = 6 }) {
  const [search,  setSearch]  = useState('')
  const [sortKey, setSortKey] = useState(null)   // clave de la columna activa para ordenar
  const [sortDir, setSortDir] = useState('asc')  // 'asc' o 'desc'

  // Alterna la dirección si se hace clic en la columna ya activa;
  // si es una columna nueva, la activa y empieza en ascendente.
  const handleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('asc') }
  }

  // 1. Filtrar por texto (solo si searchable está activo y hay algo escrito)
  let visible = searchable && search.trim()
    ? rows.filter(r => Object.values(r).some(v => typeof v === 'string' && v.toLowerCase().includes(search.toLowerCase())))
    : rows

  // 2. Ordenar el resultado del filtro (no el original)
  if (sortKey) {
    visible = [...visible].sort((a, b) => {
      const va = sortVal(a[sortKey])
      const vb = sortVal(b[sortKey])
      if (va < vb) return sortDir === 'asc' ? -1 : 1
      if (va > vb) return sortDir === 'asc' ?  1 : -1
      return 0
    })
  }

  if (loading) {
    return (
      <div className="card overflow-hidden mx-2 sm:mx-0 px-3 sm:px-0" id={id} aria-busy="true">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-100 text-slate-600 text-xs font-semibold uppercase tracking-wider">
              <tr>
                {cols.map((c, i) => (
                  <th key={c.k} className={`th-cell${c.hide ? ' ' + HIDE[c.hide] : ''}`}>
                    <Skel className="h-3 rounded" style={{ width: SKEL_WIDTHS[i % SKEL_WIDTHS.length] }} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {Array.from({ length: skeletonRows }).map((_, ri) => (
                <tr key={ri}>
                  {cols.map((c, ci) => (
                    <td key={c.k} className={tdCls(c)}>
                      <Skel
                        className="h-3.5 rounded"
                        style={{ width: c.acc ? 72 : SKEL_WIDTHS[(ci + ri) % SKEL_WIDTHS.length] }}
                      />
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
    )
  }

  return (
    <div className="card overflow-hidden mx-2 sm:mx-0 px-3 sm:px-0" id={id}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-100 text-slate-600 text-xs font-semibold uppercase tracking-wider">
            <tr>
              {cols.map(c => {
                const sortable = !c.acc   // las columnas de acción no se pueden ordenar
                const active   = sortKey === c.k
                const thCls    =
                  `th-cell ${c.r ? 'text-right' : 'text-left'}` +
                  `${c.hide   ? ' ' + HIDE[c.hide] : ''}` +
                  `${sortable ? ' cursor-pointer select-none hover:bg-slate-200/60 transition-colors group' : ''}`
                return (
                  <th key={c.k} className={thCls} onClick={sortable ? () => handleSort(c.k) : undefined}>
                    {/* En columnas numéricas (alineadas a la derecha) el ícono va a la izquierda del texto,
                        igual que hace Excel. flex-row-reverse invierte el orden dentro del span. */}
                    <span className={`inline-flex items-center gap-1 ${c.r ? 'flex-row-reverse' : ''}`}>
                      {c.l}
                      {sortable && c.l && (
                        active
                          ? sortDir === 'asc'
                              ? <ChevronUp   className="w-3 h-3 text-jm-blue shrink-0" />
                              : <ChevronDown className="w-3 h-3 text-jm-blue shrink-0" />
                          : <ChevronsUpDown className="w-3 h-3 text-slate-300 group-hover:text-slate-400 shrink-0 transition-colors" />
                      )}
                    </span>
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {visible.length === 0 ? (
              <tr>
                <td colSpan={99} className="td-cell text-center text-slate-400">Sin registros</td>
              </tr>
            ) : (
              visible.map((r, i) => (
                <tr key={i} className="hover:bg-slate-50/80 transition-colors">
                  {cols.map(c => (
                    <td key={c.k} className={tdCls(c)}>
                      {/* tr: columnas con texto largo; el span permite que el texto se rompa */}
                      {c.tr ? <span className="break-words">{r[c.k] ?? '—'}</span> : (r[c.k] ?? '—')}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {/* Pie de tabla: contador de registros visibles + contenido extra opcional */}
      <div className="px-5 py-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
        <span>{visible.length} registros</span>
        {footer}
      </div>
    </div>
  )
}
