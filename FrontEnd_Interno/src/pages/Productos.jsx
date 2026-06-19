import { useState, useEffect, useCallback, useRef } from 'react'
import {
  Pencil, Plus, Trash2, Shield, ShieldCheck, TrendingUp, DollarSign, Eye,
  Euro, Banknote, ChevronDown, FileText, Settings, ListChecks, X, Check,
  Car, Package, Users, AlertCircle,
} from 'lucide-react'
import { useApp } from '../context/AppContext.jsx'
import { usd, fmtMonto, fmtMontoAbrev } from '../utils/helpers.jsx'
import SearchBar from '../components/SearchBar.jsx'
import DataTable from '../components/DataTable.jsx'
import { fetchProductos, createProducto, updateProducto, deleteProducto } from '../api/productos.js'
import { fetchTarifario, createTarifa, updateTarifa, deleteTarifa } from '../api/tarifario.js'

const MONEDAS  = ['USD', 'BS', 'EUR']
const CATEGORIAS = ['vehicular', 'bienes', 'personas']
import { TIPOS_CALCULO, TIPOS_PRODUCTO, tipoBadge } from '../utils/productos.jsx'
export { TIPOS_CALCULO, TIPOS_PRODUCTO, tipoBadge } from '../utils/productos.jsx'

const fmtId = id => 'PRO-' + String(id).padStart(4, '0')

const CATEGORIA_ICON = { vehicular: Car, bienes: Package, personas: Users }

// ── Documentos requeridos editor ─────────────────────────────────────────────
const DOCS_SUGERIDOS = [
  'Cédula de Identidad', 'RIF', 'Carnet de Circulación',
  'Certificado de Vehículo', 'Certificado de Origen', 'Foto del Vehículo',
  'Serial de Carrocería', 'Inventario de Bienes', 'Factura del Bien',
  'Contrato de Arrendamiento', 'Declaración Jurada',
]

function DocsRequeridosEditor({ value = [], onChange }) {
  const [custom, setCustom] = useState('')

  const toggle = (nombre) => {
    const exists = value.find(d => d.nombre === nombre)
    if (exists) {
      onChange(value.filter(d => d.nombre !== nombre))
    } else {
      onChange([...value, { nombre, obligatorio: true }])
    }
  }

  const setObligatorio = (nombre, obligatorio) => {
    onChange(value.map(d => d.nombre === nombre ? { ...d, obligatorio } : d))
  }

  const addCustom = () => {
    const nombre = custom.trim()
    if (!nombre || value.find(d => d.nombre === nombre)) return
    onChange([...value, { nombre, obligatorio: true }])
    setCustom('')
  }

  return (
    <div className="space-y-3">
      {/* Lista predefinida */}
      <div className="flex flex-wrap gap-2">
        {DOCS_SUGERIDOS.map(nombre => {
          const sel = value.find(d => d.nombre === nombre)
          return (
            <button
              key={nombre}
              type="button"
              onClick={() => toggle(nombre)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                sel
                  ? 'bg-jm-blue text-white border-jm-blue'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-jm-blue'
              }`}
            >
              {nombre}
            </button>
          )
        })}
      </div>

      {/* Custom */}
      <div className="flex gap-2">
        <input
          className="input-field flex-1 text-sm"
          placeholder="Agregar documento personalizado…"
          value={custom}
          onChange={e => setCustom(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addCustom())}
        />
        <button type="button" onClick={addCustom} className="btn-primary px-3">
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Seleccionados con toggle obligatorio */}
      {value.length > 0 && (
        <div className="space-y-1.5 pt-1">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Documentos seleccionados</p>
          {value.map(d => (
            <div key={d.nombre} className="flex items-center gap-2 p-2 bg-slate-50 rounded-xl border border-slate-100">
              <span className="flex-1 text-sm text-slate-700 truncate">{d.nombre}</span>
              <label className="flex items-center gap-1.5 text-xs text-slate-500 cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={d.obligatorio}
                  onChange={e => setObligatorio(d.nombre, e.target.checked)}
                  className="w-3.5 h-3.5 accent-jm-blue"
                />
                Obligatorio
              </label>
              <button
                type="button"
                onClick={() => onChange(value.filter(x => x.nombre !== d.nombre))}
                className="p-1 hover:bg-rose-100 rounded-lg transition"
              >
                <X className="w-3.5 h-3.5 text-rose-400" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Modal: Crear / Editar Producto ────────────────────────────────────────────
const ProdSecHdr = ({ Icon, children }) => (
  <div className="flex items-center gap-2 mb-4">
    {Icon && (
      <div className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
        <Icon className="w-3.5 h-3.5 text-slate-500" />
      </div>
    )}
    <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest leading-none">{children}</span>
    <div className="flex-1 h-px bg-slate-100" />
  </div>
)

// ── ComboField: input con sugerencias filtradas ──────────────────────────────
function ComboField({ value, onChange, suggestions, placeholder, className = '' }) {
  const [open, setOpen]   = useState(false)
  const [query, setQuery] = useState(value)
  const ref = useRef(null)

  useEffect(() => { setQuery(value) }, [value])

  useEffect(() => {
    if (!open) return
    const close = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [open])

  const filtered = suggestions.filter(s => s.toLowerCase().includes(query.toLowerCase()) && s !== query)

  return (
    <div ref={ref} className="relative">
      <input
        className={`input-field text-sm ${className}`}
        value={query}
        placeholder={placeholder}
        onChange={e => { setQuery(e.target.value); onChange(e.target.value); setOpen(true) }}
        onFocus={() => setOpen(true)}
      />
      {open && filtered.length > 0 && (
        <ul className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-44 overflow-y-auto">
          {filtered.map(s => (
            <li key={s}>
              <button
                type="button"
                className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 transition capitalize"
                onMouseDown={e => { e.preventDefault(); onChange(s); setQuery(s); setOpen(false) }}
              >
                {s}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function ProductoModal({ producto, productos = [], onClose, onSaved }) {
  const isEdit  = !!producto?.id
  const [form, setForm] = useState({
    es_nuevo:              true,
    publicado:             producto?.publicado    ?? true,
    nombre:                producto?.nombre       || '',
    codigo:                producto?.codigo       || '',
    tipo:                  producto?.tipo         || '',
    categoria:             producto?.categoria    || '',
    tipo_bien:             producto?.tipo_bien    || '',
    tipo_calculo:          producto?.tipo_calculo  || 'fijo',
    derecho_poliza:        producto?.derecho_poliza ?? 0,
    descripcion:           producto?.descripcion  || '',
    prima:                 producto?.prima        ?? 0,
    cobertura:             producto?.cobertura    ?? 0,
    moneda:                producto?.moneda       || 'USD',
    documentos_requeridos: producto?.documentos_requeridos || [],
  })
  const [errors,  setErrors]  = useState({})
  const [saving,  setSaving]  = useState(false)
  const [formErr, setFormErr] = useState('')

  const set = (k, v) => { setForm(prev => ({ ...prev, [k]: v })); setErrors(e => ({ ...e, [k]: '' })) }

  // Sugerencias únicas de productos existentes
  const sugerencias = {
    tipo:      [...new Set(productos.map(p => p.tipo).filter(Boolean))],
    categoria: [...new Set([...CATEGORIAS, ...productos.map(p => p.categoria).filter(Boolean)])],
    tipo_bien: [...new Set(['vehiculo', 'inmueble', 'vida', 'bien', 'ninguno', ...productos.map(p => p.tipo_bien).filter(Boolean)])],
  }

  const validate = () => {
    const e = {}
    if (!form.nombre.trim())      e.nombre      = 'Obligatorio'
    if (!form.tipo.trim())        e.tipo        = 'Obligatorio'
    if (!form.categoria.trim())   e.categoria   = 'Obligatorio'
    if (!form.tipo_bien.trim())   e.tipo_bien   = 'Obligatorio'
    if (!form.descripcion.trim()) e.descripcion = 'Obligatorio'
    if (!(parseFloat(form.prima) > 0))          e.prima     = 'Debe ser mayor a 0'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSave = async () => {
    if (!validate()) { setFormErr('Completa todos los campos obligatorios.'); return }
    setSaving(true)
    setFormErr('')
    try {
      const payload = {
        ...form,
        prima:          parseFloat(form.prima)          || 0,
        cobertura:      parseFloat(form.cobertura)      || 0,
        derecho_poliza: parseFloat(form.derecho_poliza) || 0,
      }
      if (isEdit) await updateProducto(producto.id, payload)
      else        await createProducto(payload)
      onSaved()
      onClose()
    } catch (e) {
      setFormErr(e.message || 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  const inp = (field) => `input-field text-sm ${errors[field] ? 'border-rose-400 focus:ring-rose-300' : ''}`
  const lbl = 'field-label'
  const M   = form.moneda   // alias para etiquetas con moneda

  return (
    <div className="fixed inset-0 bg-black/50 z-[80] flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-jm-blue flex items-center justify-center">
              <Shield className="w-4.5 h-4.5 text-white" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Catálogo de Pólizas</p>
              <h3 className="text-base font-black text-slate-800">{isEdit ? `Editar — ${producto.nombre}` : 'Nueva Póliza'}</h3>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-xl transition">
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {formErr && <p className="text-xs text-rose-600 bg-rose-50 border border-rose-100 rounded-xl px-3 py-2">{formErr}</p>}

          {/* ── ¿Nuevo tipo o tipo existente? ── */}
          {!isEdit && (
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
              <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-3">¿Qué tipo de póliza es?</p>
              <div className="flex gap-3">
                {[
                  { val: true,  label: '✦ Nuevo tipo de póliza', desc: 'Primera póliza de este ramo / categoría' },
                  { val: false, label: '↳ Variante de tipo existente', desc: 'Versión diferente de un ramo ya registrado' },
                ].map(opt => (
                  <button
                    key={String(opt.val)}
                    type="button"
                    onClick={() => set('es_nuevo', opt.val)}
                    className={`flex-1 text-left p-3 rounded-xl border-2 transition-all ${
                      form.es_nuevo === opt.val
                        ? 'border-jm-blue bg-blue-50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <p className={`text-xs font-bold ${form.es_nuevo === opt.val ? 'text-jm-blue' : 'text-slate-700'}`}>{opt.label}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{opt.desc}</p>
                  </button>
                ))}
              </div>
              {!form.es_nuevo && (
                <div className="mt-3">
                  <label className={lbl}>Ramo base <span className="text-rose-500">*</span></label>
                  <select
                    className="select-field text-sm"
                    value={form.tipo}
                    onChange={e => {
                      const ramo = e.target.value
                      // Auto-rellenar categoría y tipo_bien desde el producto base
                      const base = productos.find(p => p.tipo === ramo)
                      setForm(prev => ({
                        ...prev,
                        tipo:      ramo,
                        categoria: base?.categoria ?? prev.categoria,
                        tipo_bien: base?.tipo_bien ?? prev.tipo_bien,
                      }))
                      setErrors(err => ({ ...err, tipo: '', categoria: '', tipo_bien: '' }))
                    }}
                  >
                    <option value="">— Selecciona el ramo base —</option>
                    {[...new Set(productos.map(p => p.tipo).filter(Boolean))].map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Al seleccionar el ramo, Categoría y Tipo de bien se heredan automáticamente.
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-x-6">
            {/* ── Identificación ── */}
            <section>
              <ProdSecHdr Icon={Shield}>Identificación</ProdSecHdr>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className={lbl}>Nombre de la póliza <span className="text-rose-500">*</span></label>
                  <input className={inp('nombre')} value={form.nombre} onChange={e => set('nombre', e.target.value)} placeholder="Ej. RCV Particular Privado" />
                  {errors.nombre && <p className="text-[10px] text-rose-500 mt-0.5">{errors.nombre}</p>}
                </div>
                <div className="col-span-2 flex items-center gap-2 -mt-1">
                  <input type="checkbox" id="prod_publicado" checked={form.publicado} onChange={e => set('publicado', e.target.checked)} className="w-4 h-4 accent-jm-blue" />
                  <label htmlFor="prod_publicado" className="text-xs text-slate-600 cursor-pointer">
                    Publicado en el cotizador público
                    <span className="block text-[10px] text-slate-400">Si lo desactivas, este producto deja de mostrarse a los clientes pero sigue visible aquí.</span>
                  </label>
                </div>
                <div>
                  <label className={lbl}>Código interno</label>
                  <input className={`input-field text-sm font-mono uppercase`} value={form.codigo} onChange={e => set('codigo', e.target.value.toUpperCase())} placeholder="ACC-ORO" maxLength={20} />
                </div>
                <div>
                  <label className={lbl}>Ramo de seguro <span className="text-rose-500">*</span></label>
                  {!form.es_nuevo && !isEdit ? (
                    <div className="input-field text-sm bg-slate-50 text-slate-500 flex items-center gap-2 cursor-not-allowed">
                      <span className="text-slate-400">🔒</span><span>{form.tipo || '—'}</span>
                    </div>
                  ) : (
                    <>
                      <select className={`select-field text-sm ${errors.tipo ? 'border-rose-400' : ''}`} value={form.tipo} onChange={e => set('tipo', e.target.value)}>
                        <option value="">— Selecciona el ramo —</option>
                        {sugerencias.tipo.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                      {errors.tipo && <p className="text-[10px] text-rose-500 mt-0.5">{errors.tipo}</p>}
                    </>
                  )}
                </div>
                <div>
                  <label className={lbl}>Categoría <span className="text-rose-500">*</span></label>
                  {!form.es_nuevo && !isEdit ? (
                    <div className="input-field text-sm bg-slate-50 text-slate-500 flex items-center gap-2 cursor-not-allowed capitalize">
                      <span className="text-slate-400">🔒</span><span>{form.categoria || '—'}</span>
                    </div>
                  ) : (
                    <>
                      <select className={`select-field text-sm ${errors.categoria ? 'border-rose-400' : ''}`} value={form.categoria} onChange={e => set('categoria', e.target.value)}>
                        <option value="">— Selecciona la categoría —</option>
                        {sugerencias.categoria.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                      </select>
                      {errors.categoria && <p className="text-[10px] text-rose-500 mt-0.5">{errors.categoria}</p>}
                    </>
                  )}
                </div>
                <div>
                  <label className={lbl}>Tipo de bien <span className="text-rose-500">*</span></label>
                  {!form.es_nuevo && !isEdit ? (
                    <div className="input-field text-sm bg-slate-50 text-slate-500 flex items-center gap-2 cursor-not-allowed capitalize">
                      <span className="text-slate-400">🔒</span><span>{form.tipo_bien || '—'}</span>
                    </div>
                  ) : (
                    <>
                      <select className={`select-field text-sm ${errors.tipo_bien ? 'border-rose-400' : ''}`} value={form.tipo_bien} onChange={e => set('tipo_bien', e.target.value)}>
                        <option value="">— Selecciona el tipo —</option>
                        {sugerencias.tipo_bien.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                      </select>
                      {errors.tipo_bien && <p className="text-[10px] text-rose-500 mt-0.5">{errors.tipo_bien}</p>}
                    </>
                  )}
                </div>
              </div>
            </section>

            {/* ── Cálculo ── */}
            <section className="pl-6 border-l border-slate-100">
              <ProdSecHdr Icon={Settings}>Cálculo</ProdSecHdr>
              <div className="space-y-3">
                <div>
                  <label className={lbl}>Tipo de cálculo <span className="text-rose-500">*</span></label>
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    {TIPOS_CALCULO.map(t => {
                      const on = form.tipo_calculo === t.val
                      return (
                        <button key={t.val} type="button" onClick={() => set('tipo_calculo', t.val)}
                          className={`flex flex-col items-start p-2.5 rounded-xl border-2 text-left transition-all ${on ? 'border-jm-blue bg-blue-50/50' : 'border-slate-200 hover:border-slate-300'}`}>
                          <p className={`text-xs font-bold ${on ? 'text-jm-blue' : 'text-slate-700'}`}>{t.label}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5 leading-tight">{t.desc}</p>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Moneda base → afecta etiquetas de todos los montos */}
                <div>
                  <label className={lbl}>Moneda base <span className="text-rose-500">*</span></label>
                  <div className="flex gap-2 mt-1">
                    {MONEDAS.map(m => (
                      <button key={m} type="button" onClick={() => set('moneda', m)}
                        className={`flex-1 py-1.5 rounded-xl text-xs font-bold border-2 transition-all ${
                          form.moneda === m
                            ? m === 'USD' ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                            : m === 'EUR' ? 'border-amber-500 bg-amber-50 text-amber-700'
                            : 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-slate-200 text-slate-500 hover:border-slate-300'
                        }`}>
                        {m}
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">Todos los montos se expresan en {M}.</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={lbl}>Derecho póliza ({M})</label>
                    <input type="number" className="input-field text-sm" min="0" step="0.01" value={form.derecho_poliza} onChange={e => set('derecho_poliza', e.target.value)} placeholder="0.00" />
                  </div>
                  <div>
                    <label className={lbl}>Prima base ({M}) <span className="text-rose-500">*</span></label>
                    <input type="number" className={inp('prima')} min="0" step="0.01" value={form.prima} onChange={e => set('prima', e.target.value)} placeholder="0.00" />
                    {errors.prima && <p className="text-[10px] text-rose-500 mt-0.5">{errors.prima}</p>}
                  </div>
                  <div className="col-span-2">
                    <label className={lbl}>Cobertura / Suma asegurada ({M})</label>
                    <input type="number" className="input-field text-sm" min="0" step="0.01" value={form.cobertura} onChange={e => set('cobertura', e.target.value)} placeholder="0.00" />
                  </div>
                </div>

                <div>
                  <label className={lbl}>Descripción <span className="text-rose-500">*</span></label>
                  <textarea className={`${inp('descripcion')} resize-none`} rows={2} value={form.descripcion} onChange={e => set('descripcion', e.target.value)} placeholder="Descripción de la póliza…" />
                  {errors.descripcion && <p className="text-[10px] text-rose-500 mt-0.5">{errors.descripcion}</p>}
                </div>
              </div>
            </section>
          </div>

          {/* ── Documentos (fila completa) ── */}
          <section className="pt-4 border-t border-slate-100">
            <ProdSecHdr Icon={ListChecks}>Documentos requeridos para la solicitud</ProdSecHdr>
            <DocsRequeridosEditor
              value={form.documentos_requeridos}
              onChange={v => set('documentos_requeridos', v)}
            />
          </section>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex justify-between items-center shrink-0">
          <button onClick={onClose} className="btn-secondary">Cancelar</button>
          <button onClick={handleSave} disabled={saving} className="btn-primary disabled:opacity-50">
            <Check className="w-4 h-4" />
            {saving ? 'Guardando…' : isEdit ? 'Guardar cambios' : 'Crear póliza'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Tarifario: helpers de serialización ──────────────────────────────────────
function initDatosForm(tipoCalculo, datos) {
  const d = datos || {}
  switch (tipoCalculo) {
    case 'fijo':
      return {
        prima_anual:    d.prima_anual    ?? d.prima_persona ?? '',
        suma_asegurada: d.suma_asegurada ?? d.suma_persona  ?? '',
        deducible:      d.deducible      ?? '',
      }
    case 'por_plan':
      return {
        planes: Array.isArray(d.planes) && d.planes.length > 0
          ? d.planes
          : [{ nombre: '', prima_anual: '', suma_asegurada: '' }],
      }
    case 'por_nivel':
      return {
        niveles: Array.isArray(d.niveles) && d.niveles.length > 0
          ? d.niveles
          : [{ nombre: '', prima_anual: '', suma_asegurada: '' }],
      }
    case 'por_valor':
      return { tasa_pct: d.tasa_pct ?? '', prima_minima: d.prima_minima ?? '', cobertura_max: d.cobertura_max ?? '' }
    default:
      return {}
  }
}

function serializeDatosForm(tipoCalculo, datosForm) {
  const f = datosForm || {}
  const n = v => parseFloat(v) || 0
  switch (tipoCalculo) {
    case 'fijo':
      return { prima_anual: n(f.prima_anual), suma_asegurada: n(f.suma_asegurada), deducible: n(f.deducible) }
    case 'por_plan':
      return { planes: (f.planes || []).map(p => ({ nombre: p.nombre, prima_anual: n(p.prima_anual), suma_asegurada: n(p.suma_asegurada) })) }
    case 'por_nivel':
      return { niveles: (f.niveles || []).map(p => ({ nombre: p.nombre, prima_anual: n(p.prima_anual), suma_asegurada: n(p.suma_asegurada) })) }
    case 'por_valor':
      return { tasa_pct: n(f.tasa_pct), prima_minima: n(f.prima_minima), cobertura_max: n(f.cobertura_max) }
    default:
      return {}
  }
}

// ── Formulario dinámico de datos tarifarios ───────────────────────────────────
function DatosForm({ tipoCalculo, value, onChange }) {
  const inp = 'input-field text-sm'
  const lbl = 'field-label'
  const numInput = (field, placeholder = '0.00') => (
    <input type="number" min="0" step="0.01" className={inp} placeholder={placeholder}
      value={value[field] ?? ''}
      onChange={e => onChange({ ...value, [field]: e.target.value })} />
  )

  if (tipoCalculo === 'fijo') return (
    <div className="grid grid-cols-2 gap-3">
      <div>
        <label className={lbl}>Prima anual (USD) <span className="text-rose-500">*</span></label>
        {numInput('prima_anual', '180.00')}
      </div>
      <div>
        <label className={lbl}>Suma asegurada (USD)</label>
        {numInput('suma_asegurada', '15000.00')}
      </div>
      <div>
        <label className={lbl}>Deducible (USD)</label>
        {numInput('deducible', '0.00')}
      </div>
    </div>
  )

  if (tipoCalculo === 'por_plan' || tipoCalculo === 'por_nivel') {
    const key   = tipoCalculo === 'por_plan' ? 'planes' : 'niveles'
    const label = tipoCalculo === 'por_plan' ? 'Plan'   : 'Nivel'
    const items = value[key] ?? []
    const updateItem = (i, field, val) => {
      const updated = items.map((it, idx) => idx === i ? { ...it, [field]: val } : it)
      onChange({ ...value, [key]: updated })
    }
    return (
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="p-3 bg-white rounded-xl border border-slate-200">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs font-bold text-slate-500">{label} {i + 1}</span>
              {items.length > 1 && (
                <button type="button" onClick={() => onChange({ ...value, [key]: items.filter((_, j) => j !== i) })}
                  className="p-1 hover:bg-rose-100 rounded transition">
                  <X className="w-3.5 h-3.5 text-rose-400" />
                </button>
              )}
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className={lbl}>Nombre</label>
                <input className={inp} value={item.nombre || ''} placeholder={`${label} Básico`}
                  onChange={e => updateItem(i, 'nombre', e.target.value)} />
              </div>
              <div>
                <label className={lbl}>Prima anual ($)</label>
                <input type="number" min="0" step="0.01" className={inp} value={item.prima_anual || ''}
                  onChange={e => updateItem(i, 'prima_anual', e.target.value)} />
              </div>
              <div>
                <label className={lbl}>Suma asegurada ($)</label>
                <input type="number" min="0" step="0.01" className={inp} value={item.suma_asegurada || ''}
                  onChange={e => updateItem(i, 'suma_asegurada', e.target.value)} />
              </div>
            </div>
          </div>
        ))}
        <button type="button" onClick={() => onChange({ ...value, [key]: [...items, { nombre: '', prima_anual: '', suma_asegurada: '' }] })}
          className="btn-secondary w-full justify-center text-sm">
          <Plus className="w-4 h-4" /> Agregar {label.toLowerCase()}
        </button>
      </div>
    )
  }

  if (tipoCalculo === 'por_valor') return (
    <div className="grid grid-cols-3 gap-3">
      <div>
        <label className={lbl}>Tasa (%) <span className="text-rose-500">*</span></label>
        <input type="number" min="0" step="0.001" className={inp} placeholder="0.500"
          value={value.tasa_pct ?? ''}
          onChange={e => onChange({ ...value, tasa_pct: e.target.value })} />
      </div>
      <div>
        <label className={lbl}>Prima mínima ($)</label>
        {numInput('prima_minima', '50.00')}
      </div>
      <div>
        <label className={lbl}>Cobertura máxima ($)</label>
        {numInput('cobertura_max', '100000.00')}
      </div>
    </div>
  )

  return null
}

// ── Vista compacta de datos tarifarios en la lista ────────────────────────────
function DatosDisplay({ tipoCalculo, datos }) {
  const d = datos || {}
  const fmt  = v => v > 0 ? `$${Number(v).toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '$0.00'
  const fmtP = v => `${Number(v)}%`
  const Tag = ({ label, val }) => (
    <span className="inline-flex items-center gap-1 text-xs text-slate-600">
      <span className="text-slate-400">{label}:</span>
      <strong className="text-slate-700">{val}</strong>
    </span>
  )

  if (tipoCalculo === 'fijo') return (
    <div className="flex flex-wrap gap-4 mt-2 px-1">
      <Tag label="Prima anual" val={fmt(d.prima_anual)} />
      <Tag label="Suma asegurada" val={fmt(d.suma_asegurada)} />
      {d.deducible > 0 && <Tag label="Deducible" val={fmt(d.deducible)} />}
    </div>
  )

  if (tipoCalculo === 'por_plan' || tipoCalculo === 'por_nivel') {
    const key   = tipoCalculo === 'por_plan' ? 'planes' : 'niveles'
    const items = d[key] || []
    return (
      <div className="flex flex-wrap gap-1.5 mt-2">
        {items.map((item, i) => (
          <span key={i} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-50 border border-slate-100 text-xs">
            <span className="font-semibold text-slate-700">{item.nombre || `#${i + 1}`}</span>
            <span className="text-slate-300">·</span>
            <span className="text-emerald-600 font-bold">{fmt(item.prima_anual)}/año</span>
            {item.suma_asegurada > 0 && <>
              <span className="text-slate-300">·</span>
              <span className="text-indigo-600">{fmt(item.suma_asegurada)}</span>
            </>}
          </span>
        ))}
      </div>
    )
  }

  if (tipoCalculo === 'por_valor') return (
    <div className="flex flex-wrap gap-4 mt-2 px-1">
      <Tag label="Tasa" val={fmtP(d.tasa_pct)} />
      <Tag label="Prima mín." val={fmt(d.prima_minima)} />
      {d.cobertura_max > 0 && <Tag label="Cob. máx." val={fmt(d.cobertura_max)} />}
    </div>
  )

  return (
    <pre className="mt-2 text-[10px] font-mono text-slate-400 bg-slate-50 rounded-xl p-2 overflow-x-auto">
      {JSON.stringify(datos, null, 2)}
    </pre>
  )
}

// ── Modal: Gestión de Tarifario ───────────────────────────────────────────────
const ESTADO_TARIFA = {
  vigente:   { label: 'Vigente',   bg: 'bg-emerald-100', text: 'text-emerald-700' },
  borrador:  { label: 'Borrador',  bg: 'bg-amber-100',   text: 'text-amber-700'  },
  archivado: { label: 'Archivado', bg: 'bg-slate-100',   text: 'text-slate-500'  },
}

function TarifarioModal({ producto, onClose }) {
  const { showToast, showModal } = useApp()
  const [tarifas,       setTarifas]       = useState([])
  const [loading,       setLoading]       = useState(true)
  const [showForm,      setShowForm]      = useState(false)
  const [editing,       setEditing]       = useState(null)
  const [form,          setForm]          = useState({ nombre: '', subtipo: '', datosForm: {}, activo: true })
  const [saving,        setSaving]        = useState(false)
  const [err,           setErr]           = useState('')
  const [showArchivado, setShowArchivado] = useState(false)

  const datosChangedFromEditing = editing && (
    JSON.stringify(serializeDatosForm(producto.tipo_calculo, form.datosForm)) !==
    JSON.stringify(editing.datos ?? {})
  )

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetchTarifario(producto.id, showArchivado)
      setTarifas(res.tarifario)
    } catch (e) {
      showToast(e.message, 'error')
    } finally {
      setLoading(false)
    }
  }, [producto.id, showToast, showArchivado])

  useEffect(() => { load() }, [load])

  const openNew = () => {
    setEditing(null)
    setForm({ nombre: '', subtipo: '', datosForm: initDatosForm(producto.tipo_calculo, null), activo: true })
    setErr('')
    setShowForm(true)
  }

  const openEdit = (t) => {
    setEditing(t)
    setForm({ nombre: t.nombre, subtipo: t.subtipo || '', datosForm: initDatosForm(producto.tipo_calculo, t.datos), activo: t.activo })
    setErr('')
    setShowForm(true)
  }

  const handleSave = async () => {
    if (!form.nombre.trim()) { setErr('El nombre es obligatorio.'); return }
    const datos = serializeDatosForm(producto.tipo_calculo, form.datosForm)
    setSaving(true); setErr('')
    try {
      const payload = { nombre: form.nombre, subtipo: form.subtipo, activo: form.activo, datos }
      if (editing) await updateTarifa(editing.id, payload)
      else         await createTarifa(producto.id, payload)
      setShowForm(false)
      await load()
    } catch (e) {
      setErr(e.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = (t) => showModal('confirmDelete', {
    name: t.nombre,
    onConfirm: async () => { await deleteTarifa(t.id); await load() },
  })

  const vigenteCount = tarifas.filter(t => t.estado !== 'archivado').length

  return (
    <div className="fixed inset-0 bg-black/50 z-[80] flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in duration-200">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tarifario</p>
            <h3 className="text-base font-black text-slate-800">{producto.nombre}</h3>
            <p className="text-xs text-slate-400">{producto.tipo_calculo} · {vigenteCount} tarifa{vigenteCount !== 1 ? 's' : ''} vigente{vigenteCount !== 1 ? 's' : ''}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowArchivado(v => !v)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-xl border transition ${showArchivado ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'}`}
            >
              {showArchivado ? 'Ocultar archivadas' : 'Ver historial'}
            </button>
            <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-xl transition">
              <X className="w-4 h-4 text-slate-500" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {!showForm && (
            <button onClick={openNew} className="btn-primary w-full justify-center">
              <Plus className="w-4 h-4" /> Agregar tarifa
            </button>
          )}

          {showForm && (
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
              {err && <p className="text-xs text-rose-600 bg-rose-50 border border-rose-100 rounded-xl px-3 py-2">{err}</p>}

              {/* Versioning warning when editing datos */}
              {editing && datosChangedFromEditing && (
                <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  Al modificar los datos tarifarios, la versión actual (<strong>v{editing.version}</strong>) será archivada automáticamente y se creará una nueva versión. Las pólizas existentes mantendrán su referencia a la versión anterior.
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="field-label">Nombre de la tarifa <span className="text-rose-500">*</span></label>
                  <input className="input-field text-sm" value={form.nombre} onChange={e => setForm(p => ({ ...p, nombre: e.target.value }))} placeholder="Ej. Tarifa Estándar" />
                </div>
                <div>
                  <label className="field-label">Clave interna</label>
                  <input className="input-field text-sm font-mono" value={form.subtipo} onChange={e => setForm(p => ({ ...p, subtipo: e.target.value.toLowerCase() }))} placeholder="estandar" />
                </div>
              </div>
              <div>
                <label className="field-label mb-2">
                  Valores tarifarios <span className="text-rose-500">*</span>
                  <span className="ml-2 text-[10px] font-normal text-slate-400 normal-case tracking-normal">· {producto.tipo_calculo}</span>
                </label>
                <DatosForm
                  tipoCalculo={producto.tipo_calculo}
                  value={form.datosForm}
                  onChange={datosForm => setForm(p => ({ ...p, datosForm }))}
                />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="tar_activo" checked={form.activo} onChange={e => setForm(p => ({ ...p, activo: e.target.checked }))} className="w-4 h-4 accent-jm-blue" />
                <label htmlFor="tar_activo" className="text-sm text-slate-700 cursor-pointer">Activo</label>
              </div>
              <div className="flex gap-2 justify-end pt-1">
                <button onClick={() => setShowForm(false)} className="btn-secondary">Cancelar</button>
                <button onClick={handleSave} disabled={saving} className="btn-primary disabled:opacity-50">
                  {saving ? 'Guardando…' : editing && datosChangedFromEditing ? 'Guardar nueva versión' : editing ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-8 text-slate-400 text-sm">Cargando tarifas…</div>
          ) : tarifas.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-sm">
              <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-30" />
              Sin tarifas. Agrega al menos una para que esta póliza aparezca en el simulador.
            </div>
          ) : (
            <div className="space-y-2">
              {tarifas.map(t => {
                const estadoMeta = ESTADO_TARIFA[t.estado] ?? ESTADO_TARIFA.vigente
                const isArchivado = t.estado === 'archivado'
                return (
                  <div key={t.id} className={`p-3.5 rounded-2xl border transition-opacity ${isArchivado ? 'border-slate-100 bg-slate-50 opacity-60' : t.activo ? 'border-slate-200 bg-white' : 'border-slate-200 bg-slate-50 opacity-75'}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center flex-wrap gap-1.5 mb-0.5">
                          <p className="text-sm font-bold text-slate-800">{t.nombre}</p>
                          <span className="text-[10px] font-bold text-slate-400 font-mono">v{t.version ?? 1}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${estadoMeta.bg} ${estadoMeta.text}`}>{estadoMeta.label}</span>
                          {!t.activo && !isArchivado && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">Inactiva</span>}
                        </div>
                        {t.subtipo && <p className="text-xs font-mono text-slate-400">{t.subtipo}</p>}
                        {t.vigencia_desde && (
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            Desde {t.vigencia_desde}{t.vigencia_hasta ? ` → ${t.vigencia_hasta}` : ''}
                          </p>
                        )}
                      </div>
                      {!isArchivado && (
                        <div className="flex gap-1 shrink-0">
                          <button onClick={() => openEdit(t)} className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition">
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => handleDelete(t)} className="p-1.5 rounded-lg bg-rose-50 text-rose-500 hover:bg-rose-100 transition">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                    <DatosDisplay tipoCalculo={producto.tipo_calculo} datos={t.datos} />
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Columnas de la tabla ──────────────────────────────────────────────────────
const COLS = [
  { k: 'displayId', l: 'ID',          m: true },
  { k: 'tipob',     l: 'Tipo',        nw: true },
  { k: 'nombre',    l: 'Tipo de Póliza', tr: true },
  { k: 'calc',      l: 'Cálculo',     nw: true, hide: 'md' },
  { k: 'primab',    l: 'Prima base',  r: true, nw: true },
  { k: 'cob',       l: 'Cobertura',   r: true, nw: true },
  { k: 'mon',       l: 'Moneda',      nw: true },
  { k: 'est',       l: 'Estado',      nw: true, hide: 'sm' },
  { k: 'acc',       l: '',            acc: true },
]

const CALCULO_BADGE = {
  fijo:      { label: 'Fijo',     bg: 'bg-slate-100',   text: 'text-slate-600' },
  por_plan:  { label: 'Por Plan', bg: 'bg-violet-100',  text: 'text-violet-700' },
  por_nivel: { label: 'Por Nivel',bg: 'bg-amber-100',   text: 'text-amber-700' },
  por_valor: { label: 'Por Valor',bg: 'bg-emerald-100', text: 'text-emerald-700' },
}

export default function Productos() {
  const { showModal, showToast, tasas, canAct } = useApp()
  const [search,        setSearch]        = useState('')
  const [productos,     setProductos]     = useState([])
  const [loading,       setLoading]       = useState(true)
  const [error,         setError]         = useState(null)
  const [monedaDisplay, setMonedaDisplay] = useState('USD')
  const [monedaOpen,    setMonedaOpen]    = useState(false)
  const [modalProd,     setModalProd]     = useState(null)  // null | 'new' | producto
  const [modalTar,      setModalTar]      = useState(null)  // null | producto
  const monedaDropRef = useRef(null)

  useEffect(() => {
    if (!monedaOpen) return
    const close = e => { if (monedaDropRef.current && !monedaDropRef.current.contains(e.target)) setMonedaOpen(false) }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [monedaOpen])

  const CURRENCY_META = {
    USD: { Icon: DollarSign, bg: 'bg-emerald-100', text: 'text-emerald-600', label: 'Dólares'  },
    BS:  { Icon: Banknote,   bg: 'bg-blue-100',    text: 'text-blue-600',   label: 'Bolívares' },
    EUR: { Icon: Euro,       bg: 'bg-amber-100',   text: 'text-amber-600',  label: 'Euros'     },
  }

  const loadProductos = useCallback(async () => {
    setLoading(true); setError(null)
    try { setProductos(await fetchProductos()) }
    catch (err) { setError(err.message); showToast(err.message, 'error') }
    finally { setLoading(false) }
  }, [showToast])

  useEffect(() => { loadProductos() }, [loadProductos])

  const canCreate     = canAct('productos', 'create')
  const canEdit       = canAct('productos', 'edit')
  const canDelete     = canAct('productos', 'delete')
  const canManageDocs = canAct('productos', 'manage_docs')

  const conteosPorTipo = TIPOS_PRODUCTO.reduce((acc, t) => {
    acc[t.val] = productos.filter(p => p.tipo === t.val).length
    return acc
  }, {})

  const tasaUsd = tasas.usd ? Number(tasas.usd.valor) : null
  const tasaEur = tasas.eur ? Number(tasas.eur.valor) : null

  const convertir = (val, desde, hacia) => {
    const inBs = desde === 'USD' ? (tasaUsd ? val * tasaUsd : null)
               : desde === 'EUR' ? (tasaEur ? val * tasaEur : null)
               : val
    if (inBs === null) return 0
    if (hacia === 'USD') return tasaUsd ? inBs / tasaUsd : 0
    if (hacia === 'EUR') return tasaEur ? inBs / tasaEur : 0
    return inBs
  }

  const sumaEnMoneda = (campo, cur) => productos.reduce((sum, p) => {
    const val = p[campo] || 0
    return sum + (p.moneda === cur ? val : convertir(val, p.moneda, cur))
  }, 0)

  const tasasOk         = tasaUsd && tasaEur
  const sumaPrimaActual = sumaEnMoneda('prima',     monedaDisplay)
  const sumaCobActual   = sumaEnMoneda('cobertura', monedaDisplay)

  const filtered = search
    ? productos.filter(p => {
        const q = search.toLowerCase()
        return p.nombre.toLowerCase().includes(q) || p.descripcion?.toLowerCase().includes(q)
      })
    : productos

  const dataRows = filtered.map(p => {
    const calcMeta = CALCULO_BADGE[p.tipo_calculo] ?? CALCULO_BADGE.fijo
    const monColor = p.moneda === 'USD' ? 'green' : p.moneda === 'EUR' ? 'amber' : 'blue'
    return {
      ...p,
      displayId: fmtId(p.id),
      tipob:  tipoBadge(p.tipo),
      calc:   <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-bold ${calcMeta.bg} ${calcMeta.text}`}>{calcMeta.label}</span>,
      primab: fmtMonto(p.prima,     p.moneda),
      cob:    fmtMonto(p.cobertura, p.moneda),
      mon:    <span className={`badge badge-${monColor}`}>{p.moneda}</span>,
      est: p.publicado
        ? <span className="inline-flex px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-700">Publicado</span>
        : <span className="inline-flex px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-500">Borrador</span>,
      acc: (
        <div className="flex gap-1 justify-center flex-wrap items-center">
          <button onClick={() => showModal('productoDetail', { p })} className="p-2 rounded-lg bg-slate-50 text-slate-500 hover:bg-slate-100 transition inline-flex items-center justify-center" title="Ver detalles">
            <Eye className="w-4 h-4" />
          </button>
          {canManageDocs && (
            <button
              onClick={() => showModal('productoDocumentos', { p, onSaved: loadProductos })}
              className={`p-2 rounded-lg transition inline-flex items-center justify-center ${p.documentos?.length > 0 ? 'bg-violet-100 text-violet-700 hover:bg-violet-200' : 'bg-slate-50 text-slate-400 hover:bg-violet-50 hover:text-violet-500'}`}
              title={`Documentos PDF (${p.documentos?.length ?? 0})`}
            >
              <FileText className="w-4 h-4" />
            </button>
          )}
          {/* Tarifario */}
          {canEdit && (
            <button onClick={() => setModalTar(p)} className="p-2 rounded-lg bg-amber-50 text-amber-600 hover:bg-amber-100 transition inline-flex items-center justify-center" title="Gestionar tarifario">
              <Settings className="w-4 h-4" />
            </button>
          )}
          {canEdit && (
            <button onClick={() => setModalProd(p)} className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition inline-flex items-center justify-center" title="Editar">
              <Pencil className="w-4 h-4" />
            </button>
          )}
          {canDelete && (
            <button
              onClick={() => showModal('confirmDelete', { name: p.nombre, onConfirm: async () => { await deleteProducto(p.id); await loadProductos() } })}
              className="p-2 rounded-lg bg-rose-50 text-rose-500 hover:bg-rose-100 transition inline-flex items-center justify-center"
              title="Eliminar"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      ),
    }
  })

  if (!canAct('productos', 'view')) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
        <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center">
          <Shield className="w-6 h-6 text-slate-400" />
        </div>
        <p className="font-semibold text-slate-600">Sin acceso</p>
        <p className="text-xs text-slate-400">No tienes permiso para acceder a este módulo.</p>
      </div>
    )
  }

  return (
    <div className="animate-in fade-in duration-500">
      {/* Selector de moneda + cards */}
      <div className="mb-6">
        <div className="flex justify-end mb-2">
          <div className="relative" ref={monedaDropRef}>
            <button
              onClick={() => setMonedaOpen(o => !o)}
              className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl border transition ${monedaOpen ? 'bg-white border-slate-300 shadow-md' : 'bg-white/70 border-slate-200 hover:bg-white hover:shadow-sm'}`}
            >
              {(() => { const { Icon, text } = CURRENCY_META[monedaDisplay]; return <Icon className={`w-3.5 h-3.5 ${text}`} /> })()}
              <span className="text-slate-600">Ver en:</span>
              <span className={CURRENCY_META[monedaDisplay].text}>{monedaDisplay}</span>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${monedaOpen ? 'rotate-180' : ''}`} />
            </button>
            {monedaOpen && (
              <div className="absolute right-0 top-full mt-1.5 bg-white rounded-2xl shadow-2xl border border-slate-100 z-30 overflow-hidden w-40">
                {MONEDAS.map(c => {
                  const { Icon, text, label } = CURRENCY_META[c]
                  return (
                    <button key={c} onClick={() => { setMonedaDisplay(c); setMonedaOpen(false) }}
                      className={`flex items-center gap-3 w-full px-4 py-3 text-xs font-bold transition-colors ${monedaDisplay === c ? 'bg-slate-50 text-slate-800' : 'text-slate-500 hover:bg-slate-50'}`}>
                      <Icon className={`w-3.5 h-3.5 shrink-0 ${text}`} />
                      <div className="text-left">
                        <p className={`font-black ${monedaDisplay === c ? text : ''}`}>{c}</p>
                        <p className="text-[10px] text-slate-400 font-medium">{label}</p>
                      </div>
                      {monedaDisplay === c && <span className={`ml-auto w-1.5 h-1.5 rounded-full ${text.replace('text-', 'bg-')}`} />}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="card p-4 flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center shrink-0"><Shield className="w-4 h-4 text-slate-600" /></div>
            <div className="min-w-0">
              <p className="text-xs text-slate-500 font-medium leading-tight">Tipos de Póliza</p>
              <p className="text-xl font-black text-slate-800 mt-0.5 leading-none">{productos.length}</p>
              <p className="text-xs text-slate-400 mt-1">Disponibles en el simulador</p>
            </div>
          </div>
          <div className="card p-4 flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center shrink-0"><ShieldCheck className="w-4 h-4 text-slate-600" /></div>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-slate-500 font-medium leading-tight mb-2">Por Tipo</p>
              <div className="flex flex-wrap gap-1">
                {TIPOS_PRODUCTO.filter(t => conteosPorTipo[t.val] > 0).map(t => (
                  <span key={t.val} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${t.bg} ${t.text}`}>
                    {t.label} <span className="opacity-70">{conteosPorTipo[t.val]}</span>
                  </span>
                ))}
              </div>
            </div>
          </div>
          <div className="card p-4 flex items-start gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${CURRENCY_META[monedaDisplay].bg}`}>
              <TrendingUp className={`w-4 h-4 ${CURRENCY_META[monedaDisplay].text}`} />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-slate-500 font-medium leading-tight">Suma Primas</p>
              <p className="text-xl font-black text-slate-800 mt-0.5 leading-none">{fmtMontoAbrev(sumaPrimaActual, monedaDisplay)}</p>
              <p className="text-xs text-slate-400 mt-1">{tasasOk ? 'Al tipo BCV' : 'Solo misma moneda'}</p>
            </div>
          </div>
          <div className="card p-4 flex items-start gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${CURRENCY_META[monedaDisplay].bg}`}>
              <ShieldCheck className={`w-4 h-4 ${CURRENCY_META[monedaDisplay].text}`} />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-slate-500 font-medium leading-tight">Suma Coberturas</p>
              <p className="text-xl font-black text-slate-800 mt-0.5 leading-none">{fmtMontoAbrev(sumaCobActual, monedaDisplay)}</p>
              <p className="text-xs text-slate-400 mt-1">{tasasOk ? 'Al tipo BCV' : 'Solo misma moneda'}</p>
            </div>
          </div>
        </div>
      </div>

      <SearchBar
        placeholder="Buscar por nombre o descripción…"
        onSearch={setSearch}
        extra={
          canCreate && (
            <button onClick={() => setModalProd('new')} className="btn-primary ml-auto">
              <Plus className="w-4 h-4" />Nueva Póliza
            </button>
          )
        }
      />

      {loading && (
        <div className="flex justify-center items-center py-16 text-slate-400 text-sm gap-2">
          <div className="w-4 h-4 border-2 border-slate-300 border-t-jm-blue rounded-full animate-spin" />
          Cargando pólizas…
        </div>
      )}
      {error && !loading && <div className="text-center py-12 text-rose-500 text-sm">{error}</div>}
      {!loading && !error && <DataTable cols={COLS} rows={dataRows} searchable />}

      {/* Modales */}
      {modalProd && (
        <ProductoModal
          producto={modalProd === 'new' ? null : modalProd}
          productos={productos}
          onClose={() => setModalProd(null)}
          onSaved={loadProductos}
        />
      )}
      {modalTar && (
        <TarifarioModal
          producto={modalTar}
          onClose={() => setModalTar(null)}
        />
      )}
    </div>
  )
}
