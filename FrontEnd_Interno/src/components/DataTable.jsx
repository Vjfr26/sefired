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
 *   s     — Campo crudo alterno por el que ordenar cuando la celda `k` es JSX
 *           (badges, montos con estilo). Si se omite, se ordena por `k`.
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

// Construye las clases CSS de una celda según las propiedades de la columna.
// `compact` reduce el padding y estrecha la columna de acciones para tablas
// anchas (muchas columnas) que de otro modo provocan scroll horizontal.
const tdCls = (c, compact = false) =>
  `${compact ? 'td-cell-compact' : 'td-cell'}${c.r ? ' text-right' : ''}` +
  `${c.m           ? ' font-mono text-xs'               : ''}` +
  `${c.bold        ? ' font-bold text-slate-800'        : ''}` +
  `${c.nw          ? ' whitespace-nowrap'               : ''}` +
  `${c.hide        ? ' ' + HIDE[c.hide]                 : ''}` +
  `${c.tr          ? ' max-w-[220px] truncate'          : ''}` +
  `${c.acc         ? ` whitespace-nowrap !overflow-visible ${compact ? 'min-w-[100px]' : 'min-w-[150px]'}` : ''}`

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

// Opciones del selector de "filas por página", disponible en todas las listas.
const PAGE_SIZES = [10, 20, 50, 100, 200]

// Tarjeta de una fila en móvil/tablet: título + campos clave; los campos
// secundarios (los marcados `hide`) se ocultan tras un botón "Ver más".
function MobileCard({ r, titleCol, alwaysCols, moreCols, accCols }) {
  const [open, setOpen] = useState(false)
  const Field = ({ c }) => (
    <div className="min-w-0">
      {c.l && <dt className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{c.l}</dt>}
      <dd className={`text-sm text-slate-700 break-words ${c.m ? 'font-mono text-xs' : ''}`}>{r[c.k] ?? '—'}</dd>
    </div>
  )
  return (
    <div className="p-4">
      {titleCol && (
        <div className={`text-sm font-bold text-slate-800 mb-2 break-words ${titleCol.m ? 'font-mono' : ''}`}>
          {r[titleCol.k] ?? '—'}
        </div>
      )}
      {alwaysCols.length > 0 && (
        <dl className="grid grid-cols-2 gap-x-3 gap-y-2">
          {alwaysCols.map(c => <Field key={c.k} c={c} />)}
        </dl>
      )}
      {open && moreCols.length > 0 && (
        <dl className="grid grid-cols-2 gap-x-3 gap-y-2 mt-2 animate-in fade-in slide-in-from-top-1 duration-200">
          {moreCols.map(c => <Field key={c.k} c={c} />)}
        </dl>
      )}
      {moreCols.length > 0 && (
        <button type="button" onClick={() => setOpen(o => !o)}
          className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-jm-blue">
          {open ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          {open ? 'Ver menos' : `Ver más (${moreCols.length})`}
        </button>
      )}
      {accCols.length > 0 && (
        <div className="mt-3 pt-3 border-t border-slate-100">
          {accCols.map(c => <div key={c.k}>{r[c.k]}</div>)}
        </div>
      )}
    </div>
  )
}

export default function DataTable({ cols, rows, footer = null, id, searchable = false, loading = false, skeletonRows = 6, compact = false }) {
  const [search,   setSearch]   = useState('')
  const [sortKey,  setSortKey]  = useState(null)   // clave de la columna activa para ordenar
  const [sortDir,  setSortDir]  = useState('asc')  // 'asc' o 'desc'
  const [pageSize, setPageSize] = useState(20)
  const [page,     setPage]     = useState(0)

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
    // La celda visible puede ser JSX (badges, montos con estilo), que no se
    // puede comparar. La columna puede declarar `s` para apuntar al campo
    // crudo (string/número) por el que se debe ordenar en su lugar.
    const accessor = cols.find(c => c.k === sortKey)?.s ?? sortKey
    visible = [...visible].sort((a, b) => {
      const va = sortVal(a[accessor])
      const vb = sortVal(b[accessor])
      if (va < vb) return sortDir === 'asc' ? -1 : 1
      if (va > vb) return sortDir === 'asc' ?  1 : -1
      return 0
    })
  }

  // 3. Paginar el resultado ya filtrado/ordenado. Si el set de datos se
  // achica (ej. una búsqueda) y la página actual queda fuera de rango,
  // se recalcula sin necesidad de un efecto aparte.
  const totalPages = Math.max(1, Math.ceil(visible.length / pageSize))
  const safePage   = Math.min(page, totalPages - 1)
  const start      = safePage * pageSize
  const paged      = visible.slice(start, start + pageSize)

  if (loading) {
    return (
      <div className="card overflow-hidden mx-2 sm:mx-0 px-3 sm:px-0" id={id} aria-busy="true">
        {/* Móvil/tablet: skeleton de tarjetas */}
        <div className="lg:hidden divide-y divide-slate-100">
          {Array.from({ length: skeletonRows }).map((_, ri) => (
            <div key={ri} className="p-4 space-y-2.5">
              <Skel className="h-4 w-32 rounded" />
              <div className="grid grid-cols-2 gap-2">
                {Array.from({ length: 4 }).map((_, ci) => <Skel key={ci} className="h-3 w-20 rounded" />)}
              </div>
            </div>
          ))}
        </div>
        {/* Escritorio: skeleton de tabla */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-100 text-slate-600 text-xs font-semibold uppercase tracking-wider">
              <tr>
                {cols.map((c, i) => (
                  <th key={c.k} className={`${compact ? 'th-cell-compact' : 'th-cell'}${c.hide ? ' ' + HIDE[c.hide] : ''}`}>
                    <Skel className="h-3 rounded" style={{ width: SKEL_WIDTHS[i % SKEL_WIDTHS.length] }} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {Array.from({ length: skeletonRows }).map((_, ri) => (
                <tr key={ri}>
                  {cols.map((c, ci) => (
                    <td key={c.k} className={tdCls(c, compact)}>
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

  // Columnas de datos vs. de acciones — para el render en tarjetas (móvil).
  // El título de la tarjeta es la columna marcada `primary` (o la primera).
  const accCols   = cols.filter(c => c.acc)
  const dataCols  = cols.filter(c => !c.acc)
  const titleCol  = dataCols.find(c => c.primary) ?? dataCols[0]
  const fieldCols = dataCols.filter(c => c !== titleCol)
  // Campos clave (los que se ven hasta en pantalla chica) vs. secundarios
  // (los marcados hide:md/lg/xl) que van tras "Ver más" en la tarjeta.
  const alwaysCols = fieldCols.filter(c => !c.hide || c.hide === 'sm')
  const moreCols   = fieldCols.filter(c => c.hide && c.hide !== 'sm')

  return (
    <div className="card overflow-hidden mx-2 sm:mx-0 px-3 sm:px-0" id={id}>
      {/* ── Móvil/tablet: cada fila como tarjeta compacta ── */}
      <div className="lg:hidden divide-y divide-slate-100">
        {paged.length === 0 ? (
          <p className="text-center text-slate-400 text-sm py-6">Sin registros</p>
        ) : paged.map((r, i) => (
          <MobileCard key={i} r={r} titleCol={titleCol} alwaysCols={alwaysCols} moreCols={moreCols} accCols={accCols} />
        ))}
      </div>

      {/* ── Escritorio: tabla ── */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-100 text-slate-600 text-xs font-semibold uppercase tracking-wider">
            <tr>
              {cols.map(c => {
                const sortable = !c.acc   // las columnas de acción no se pueden ordenar
                const active   = sortKey === c.k
                // La columna título (nombre) absorbe el espacio sobrante para que
                // las demás no queden muy separadas; los extremos llevan un poco
                // más de padding para que el contenido no quede pegado al borde.
                const isTitle  = !c.acc && c === titleCol
                const thCls    =
                  `${compact ? 'th-cell-compact' : 'th-cell'} ${c.r ? 'text-right' : 'text-left'}` +
                  ' first:pl-4 sm:first:pl-6 last:pr-4 sm:last:pr-6' +
                  `${isTitle && compact ? ' w-full' : ''}` +
                  `${c.hide   ? ' ' + HIDE[c.hide] : ''}` +
                  `${c.acc    ? (compact ? ' min-w-[100px]' : ' min-w-[150px]') : ''}` +
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
            {paged.length === 0 ? (
              <tr>
                <td colSpan={99} className="td-cell text-center text-slate-400">Sin registros</td>
              </tr>
            ) : (
              paged.map((r, i) => (
                <tr key={i} className="hover:bg-slate-50/80 transition-colors">
                  {cols.map(c => (
                    <td key={c.k} className={`${tdCls(c, compact)} first:pl-4 sm:first:pl-6 last:pr-4 sm:last:pr-6${!c.acc && c === titleCol && compact ? ' w-full' : ''}`} title={c.tr && typeof r[c.k] === 'string' ? r[c.k] : undefined}>
                      {/* tr: texto largo en una línea con elipsis (max-w + truncate en td) */}
                      {/* Columnas de acción (botones): si no hay botón, celda vacía —
                          no un "—", que parecería un botón roto. El guion solo tiene
                          sentido como "sin valor" en columnas de datos. */}
                      {c.acc ? (r[c.k] ?? null) : (r[c.k] ?? '—')}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {/* Pie de tabla: contador + selector de filas por página + paginación + contenido extra opcional */}
      <div className="px-5 py-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
        <div className="flex flex-wrap items-center gap-3">
          <span>
            {visible.length === 0
              ? '0 registros'
              : `${start + 1}–${Math.min(start + pageSize, visible.length)} de ${visible.length}`}
          </span>
          <label className="flex items-center gap-1.5">
            Mostrar
            <select
              value={pageSize}
              onChange={e => { setPageSize(Number(e.target.value)); setPage(0) }}
              className="border border-slate-200 rounded-lg px-1.5 py-0.5 text-xs bg-white text-slate-600 outline-none focus:ring-1 focus:ring-blue-500"
            >
              {PAGE_SIZES.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </label>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={safePage === 0}
              className="px-2 py-1 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50 transition"
            >
              Anterior
            </button>
            <span>Página {safePage + 1} de {totalPages}</span>
            <button
              type="button"
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={safePage >= totalPages - 1}
              className="px-2 py-1 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50 transition"
            >
              Siguiente
            </button>
          </div>
        )}
        {footer}
      </div>
    </div>
  )
}
