import { useState } from 'react'

const HIDE = { sm: 'hidden sm:table-cell', md: 'hidden md:table-cell', lg: 'hidden lg:table-cell' }
const thCls = c => `th-cell ${c.r ? 'text-right' : 'text-left'}${c.hide ? ' ' + HIDE[c.hide] : ''}`
const tdCls = c => `td-cell${c.r ? ' text-right' : ''}${c.m ? ' font-mono text-xs' : ''}${c.nw ? ' whitespace-nowrap' : ''}${c.hide ? ' ' + HIDE[c.hide] : ''}${c.tr ? ' max-w-0' : ''}${c.acc ? ' whitespace-nowrap !overflow-visible' : ''}`

export default function DataTable({ cols, rows, footer = null, id, searchable = false }) {
  const [search, setSearch] = useState('')

  const visibleRows = searchable && search.trim()
    ? rows.filter(r =>
        Object.values(r).some(v =>
          typeof v === 'string' && v.toLowerCase().includes(search.toLowerCase())
        )
      )
    : rows

  return (
    <div className="card overflow-hidden mx-2 sm:mx-0 px-3 sm:px-0" id={id}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-100 text-slate-600 text-xs font-semibold uppercase tracking-wider">
            <tr>
              {cols.map(c => <th key={c.k} className={thCls(c)}>{c.l}</th>)}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {visibleRows.length === 0 ? (
              <tr>
                <td colSpan={99} className="td-cell text-center text-slate-400">Sin registros</td>
              </tr>
            ) : (
              visibleRows.map((r, i) => (
                <tr key={i} className="hover:bg-slate-50/80 transition-colors">
                  {cols.map(c => (
                    <td key={c.k} className={tdCls(c)}>
                      {c.tr
                        ? <span className="break-words">{r[c.k] ?? '—'}</span>
                        : (r[c.k] ?? '—')}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div className="px-5 py-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
        <span>{visibleRows.length} registros</span>
        {footer}
      </div>
    </div>
  )
}
