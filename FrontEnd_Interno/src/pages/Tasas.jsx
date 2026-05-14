import { Check, Pencil, Trash2 } from 'lucide-react'
import { useApp } from '../context/AppContext.jsx'
import { badge } from '../utils/helpers.jsx'
import DataTable from '../components/DataTable.jsx'

function TasaActions({ name }) {
  const { showModal } = useApp()
  return (
    <div className="flex gap-1 justify-center flex-nowrap max-w-none">
      <button onClick={() => showModal('editForm', { title: 'Editar', fields: [{ label: 'Valor', val: name }] })}
        className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition" title="Editar">
        <Pencil className="w-4 h-4" />
      </button>
      <button onClick={() => showModal('confirmDelete', { name })}
        className="p-2 rounded-lg bg-rose-50 text-rose-500 hover:bg-rose-100 transition" title="Eliminar">
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  )
}

const histRows = [
  { f: '07/05/2026', mon: badge('USD','blue'),   t: '38.5400', v: badge('+0.14%','amber'), name: 'Tasa USD 07/05/2026' },
  { f: '07/05/2026', mon: badge('EUR','indigo'), t: '42.1800', v: badge('+0.22%','amber'), name: 'Tasa EUR 07/05/2026' },
  { f: '06/05/2026', mon: badge('USD','blue'),   t: '38.3900', v: badge('+0.21%','amber'), name: 'Tasa USD 06/05/2026' },
  { f: '06/05/2026', mon: badge('EUR','indigo'), t: '41.9600', v: badge('+0.15%','amber'), name: 'Tasa EUR 06/05/2026' },
  { f: '05/05/2026', mon: badge('USD','blue'),   t: '38.1800', v: badge('+0.08%','slate'), name: 'Tasa USD 05/05/2026' },
  { f: '05/05/2026', mon: badge('EUR','indigo'), t: '41.8100', v: badge('+0.05%','slate'), name: 'Tasa EUR 05/05/2026' },
]

export default function Tasas() {
  const { showToast } = useApp()

  const dataRows = histRows.map(r => ({
    ...r,
    acc: <TasaActions name={r.name} />,
  }))

  return (
    <div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
        {/* Rate display cards */}
        <div className="space-y-4">
          <div className="card p-5 border-l-4 border-l-emerald-500">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-xl font-extrabold text-emerald-500">$</span>
                <p className="text-xs text-slate-600 uppercase tracking-wide font-bold">Dólar · BCV</p>
              </div>
              <span className="text-xs text-slate-400">07/05/2026 · 07:45 AM</span>
            </div>
            <p className="text-2xl sm:text-3xl font-extrabold text-slate-800">38.54 <span className="text-base font-semibold text-slate-400">Bs/$</span></p>
            <p className="text-xs text-emerald-600 font-semibold mt-1">↑ +0.14% vs ayer</p>
          </div>

          <div className="card p-5 border-l-4 border-l-amber-500">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-xl font-extrabold text-amber-500">€</span>
                <p className="text-xs text-slate-600 uppercase tracking-wide font-bold">Euro · BCV</p>
              </div>
              <span className="text-xs text-slate-400">07/05/2026 · 07:45 AM</span>
            </div>
            <p className="text-2xl sm:text-3xl font-extrabold text-slate-800">42.18 <span className="text-base font-semibold text-slate-400">Bs/€</span></p>
            <p className="text-xs text-amber-600 font-semibold mt-1">↑ +0.22% vs ayer</p>
          </div>
        </div>

        {/* Registration form */}
        <div className="card p-6">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Registrar Tasas del Día</p>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="field-label">Dólar USD (Bs) <span className="text-rose-500">*</span></label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-500 font-extrabold">$</span>
                  <input type="number" step="0.00001" placeholder="0.00000" className="input-field pl-8" required />
                </div>
              </div>
              <div>
                <label className="field-label">Euro EUR (Bs) <span className="text-rose-500">*</span></label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-500 font-extrabold">€</span>
                  <input type="number" step="0.00001" placeholder="0.00000" className="input-field pl-8" required />
                </div>
              </div>
            </div>
            <div>
              <label className="field-label">Fecha <span className="text-rose-500">*</span></label>
              <input type="date" defaultValue="2026-05-07" className="input-field" required />
            </div>
            <button onClick={() => showToast('Tasas del día registradas y aplicadas', 'success')} className="btn-primary w-full">
              <Check className="w-4 h-4" />Registrar Tasas
            </button>
          </div>
        </div>
      </div>

      <h4 className="font-semibold text-slate-700 mb-3">Historial de Tasas Registradas</h4>
      <DataTable
        cols={[
          { k: 'f',   l: 'Fecha',     nw: true },
          { k: 'mon', l: 'Moneda',    nw: true },
          { k: 't',   l: 'Tasa Bs',   r: true, nw: true },
          { k: 'v',   l: 'Variación', hide: 'sm', nw: true },
          { k: 'acc', l: '',          acc: true },
        ]}
        rows={dataRows}
      />
    </div>
  )
}
