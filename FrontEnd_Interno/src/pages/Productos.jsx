import { useState, useEffect, useCallback, useRef } from 'react'
import {
  Pencil, Plus, Trash2, Shield, ShieldCheck, TrendingUp, DollarSign, Eye,
  Euro, Banknote, ChevronDown, FileText, Settings, ListChecks, X, Check,
  Car, Package, Users, AlertCircle, Globe, EyeOff,
  Sparkles, GitBranch, Lock, Percent, Calendar,
} from 'lucide-react'
import { useApp } from '../context/AppContext.jsx'
import { usd, fmtMonto, fmtMontoAbrev, convertirMoneda, useModalLock } from '../utils/helpers.jsx'
import SearchBar from '../components/SearchBar.jsx'
import DataTable from '../components/DataTable.jsx'
import { fetchProductos, createProducto, updateProducto, deleteProducto, createBeneficio, updateBeneficio, deleteBeneficio } from '../api/productos.js'
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

// Interruptor on/off accesible — reemplaza los checkboxes del formulario de póliza.
const Switch = ({ checked, onChange }) => (
  <button
    type="button" role="switch" aria-checked={checked}
    onClick={() => onChange(!checked)}
    className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors outline-none focus-visible:ring-2 focus-visible:ring-jm-blue/40 ${checked ? 'bg-jm-blue' : 'bg-slate-300'}`}
  >
    <span className={`inline-block h-4.5 w-4.5 transform rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-[22px]' : 'translate-x-1'}`} />
  </button>
)

// Tarjeta de opción con interruptor: icono + título + switch, descripción y un
// contenido condicional que aparece con transición cuando la opción está activa.
const ToggleCard = ({ Icon, title, desc, checked, onChange, children, className = '' }) => (
  <div className={`rounded-2xl border-2 p-3.5 transition-colors ${className} ${checked ? 'border-jm-blue/30 bg-blue-50/40' : 'border-slate-200 bg-white'}`}>
    <div className="flex items-start gap-3">
      <span className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${checked ? 'bg-jm-blue text-white' : 'bg-slate-100 text-slate-400'}`}>
        <Icon className="w-4 h-4" />
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-bold text-slate-700">{title}</p>
          <Switch checked={checked} onChange={onChange} />
        </div>
        <p className="text-[10px] text-slate-400 mt-0.5 leading-snug">{desc}</p>
      </div>
    </div>
    {checked && children && (
      <div className="mt-3 pl-12 animate-in fade-in slide-in-from-top-1 duration-200">
        {children}
      </div>
    )}
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
  const panelRef = useRef(null)
  useModalLock(panelRef)
  const { showToast } = useApp()
  const isEdit  = !!producto?.id
  const [form, setForm] = useState({
    es_nuevo:              true,
    publicado:             producto?.publicado    ?? true,
    nombre:                producto?.nombre       || '',
    codigo:                producto?.codigo       || '',
    tipo:                  producto?.tipo         || '',
    categoria:             producto?.categoria    || '',
    tipo_bien:             producto?.tipo_bien    || '',
    permite_multiples_bienes: producto?.permite_multiples_bienes ?? false,
    max_bienes:            producto?.max_bienes   ?? '',
    aplica_beneficiarios:  producto?.aplica_beneficiarios ?? false,
    min_beneficiarios:     producto?.min_beneficiarios ?? '',
    max_beneficiarios:     producto?.max_beneficiarios ?? '',
    lleva_certificado:     producto?.lleva_certificado ?? false,
    tipo_calculo:          producto?.tipo_calculo  || 'fijo',
    derecho_poliza:        producto?.derecho_poliza ?? 0,
    descripcion:           producto?.descripcion  || '',
    prima:                 producto?.prima        ?? 0,
    cobertura:             producto?.cobertura    ?? 0,
    moneda:                producto?.moneda       || 'USD',
    iva_aplica:             producto?.iva_aplica ?? false,
    iva_porcentaje:         producto?.iva_porcentaje ?? '',
    permite_mensualidades:  producto?.permite_mensualidades ?? false,
    recargo_mensual_pct:    producto?.recargo_mensual_pct ?? '',
    documentos_requeridos: producto?.documentos_requeridos || [],
  })
  // Datos tarifarios capturados aquí mismo al CREAR un producto nuevo — se
  // usan para generar su primera tarifa automáticamente al guardar, en vez
  // de obligar a abrir "Gestionar Tarifario" como paso aparte. Al EDITAR un
  // producto existente no se muestran (la tarifa real ya vive en sus propias
  // filas de tarifario, gestionadas con ese modal para no pisarlas).
  const [datosForm, setDatosForm] = useState(() => initDatosForm(producto?.tipo_calculo || 'fijo', null, producto?.tipo_bien))
  // Nombre de la tarifa inicial — solo relevante en por_plan/por_nivel,
  // donde cada fila de tarifario representa un plan/nivel con nombre propio
  // (ej. "Plan Básico", "Nivel I"). Se pueden agregar más después desde
  // "Gestionar Tarifario".
  const [tarifaNombre, setTarifaNombre] = useState('')
  const [errors,  setErrors]  = useState({})
  const [saving,  setSaving]  = useState(false)
  const [formErr, setFormErr] = useState('')

  const set = (k, v) => { setForm(prev => ({ ...prev, [k]: v })); setErrors(e => ({ ...e, [k]: '' })) }
  const setTipoCalculo = (val) => { set('tipo_calculo', val); setDatosForm(initDatosForm(val, null, form.tipo_bien)) }
  // Cambiar el tipo de bien también cambia qué campos tiene sentido pedir en
  // 'fijo' (vehículo usa el desglose de coberturas con nombre; el resto, una
  // suma asegurada genérica) — sin esto quedarían datos de la forma anterior
  // ocultos pero guardados por error al enviar.
  const setTipoBien = (val) => { set('tipo_bien', val); if (!isEdit) setDatosForm(initDatosForm(form.tipo_calculo, null, val)) }

  // Sugerencias únicas de productos existentes
  const sugerencias = {
    tipo:      [...new Set(productos.map(p => p.tipo).filter(Boolean))],
    categoria: [...new Set([...CATEGORIAS, ...productos.map(p => p.categoria).filter(Boolean)])],
    tipo_bien: [...new Set(['vehiculo', 'inmueble', 'vida', 'bien', 'ninguno', 'bicicleta', 'mascota', 'embarcacion', 'equipo_electronico', 'joya', ...productos.map(p => p.tipo_bien).filter(Boolean)])],
  }

  // Solo lo que realmente no tiene un valor razonable por defecto es
  // obligatorio. Antes "Prima base" se exigía siempre aunque ese campo no es
  // el que realmente fija el precio en por_plan/por_nivel/por_valor (ahí la
  // tarifa real vive en los planes/niveles/tasa de abajo).
  const requiereNombreTarifa = form.tipo_calculo === 'por_plan' || form.tipo_calculo === 'por_nivel'

  const validate = () => {
    const e = {}
    if (!form.nombre.trim())      e.nombre      = 'Obligatorio'
    if (!form.tipo.trim())        e.tipo        = 'Obligatorio'
    if (!form.categoria.trim())   e.categoria   = 'Obligatorio'
    if (!form.tipo_bien.trim())   e.tipo_bien   = 'Obligatorio'
    if (!form.descripcion.trim()) e.descripcion = 'Obligatorio'
    if (!isEdit) {
      if (form.tipo_calculo === 'fijo' && !(parseFloat(datosForm.prima_anual) > 0)) e.datosForm = 'Indica la prima anual.'
      if (form.tipo_calculo === 'por_valor' && !(parseFloat(datosForm.tasa_pct) > 0)) e.datosForm = 'Indica la tasa (%).'
      if (form.tipo_calculo === 'por_plan' && !(datosForm.coberturas || []).some(c => c.label?.trim() && parseFloat(c.prima) > 0)) e.datosForm = 'Agrega al menos una cobertura con nombre y prima.'
      if (form.tipo_calculo === 'por_nivel' && !(parseFloat(datosForm.prima) > 0)) e.datosForm = 'Indica la prima de este nivel.'
      if (requiereNombreTarifa && !tarifaNombre.trim()) e.tarifaNombre = `Indica el nombre del ${form.tipo_calculo === 'por_plan' ? 'plan' : 'nivel'}.`
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  /** Deriva los valores planos (prima/cobertura) desde lo capturado en datosForm, solo para mostrar un valor de referencia en listados — la tarifa real queda en la fila de tarifario creada abajo. */
  const primaCoberturaDesdeDatos = () => {
    if (form.tipo_calculo === 'fijo') {
      const cobertura = form.tipo_bien === 'vehiculo'
        ? (parseFloat(datosForm.suma_persona) || 0) + (parseFloat(datosForm.suma_cosa) || 0)
        : (parseFloat(datosForm.suma_asegurada) || 0)
      return { prima: parseFloat(datosForm.prima_anual) || 0, cobertura }
    }
    if (form.tipo_calculo === 'por_valor') return { prima: 0, cobertura: parseFloat(datosForm.cobertura_max) || 0 }
    if (form.tipo_calculo === 'por_plan') {
      const cs = datosForm.coberturas || []
      return { prima: cs.reduce((s, c) => s + (parseFloat(c.prima) || 0), 0), cobertura: cs.reduce((s, c) => s + (parseFloat(c.suma) || 0), 0) }
    }
    if (form.tipo_calculo === 'por_nivel') return { prima: parseFloat(datosForm.prima) || 0, cobertura: parseFloat(datosForm.suma) || 0 }
    return { prima: parseFloat(form.prima) || 0, cobertura: parseFloat(form.cobertura) || 0 }
  }

  const handleSave = async () => {
    if (!validate()) { setFormErr('Completa todos los campos obligatorios.'); return }
    setSaving(true)
    setFormErr('')
    try {
      const derivado = !isEdit ? primaCoberturaDesdeDatos() : null
      const payload = {
        ...form,
        prima:          derivado ? derivado.prima     : (parseFloat(form.prima)     || 0),
        cobertura:      derivado ? derivado.cobertura : (parseFloat(form.cobertura) || 0),
        derecho_poliza: parseFloat(form.derecho_poliza) || 0,
        max_bienes:         form.permite_multiples_bienes && form.max_bienes !== '' ? parseInt(form.max_bienes, 10)        : null,
        min_beneficiarios:  form.aplica_beneficiarios     && form.min_beneficiarios !== '' ? parseInt(form.min_beneficiarios, 10) : null,
        max_beneficiarios:  form.aplica_beneficiarios     && form.max_beneficiarios !== '' ? parseInt(form.max_beneficiarios, 10) : null,
        iva_porcentaje:        form.iva_aplica            && form.iva_porcentaje !== ''      ? parseFloat(form.iva_porcentaje)      : null,
        recargo_mensual_pct:   form.permite_mensualidades && form.recargo_mensual_pct !== '' ? parseFloat(form.recargo_mensual_pct) : null,
      }
      let savedProducto
      if (isEdit) savedProducto = await updateProducto(producto.id, payload)
      else        savedProducto = await createProducto(payload)

      // Si al cambiar la moneda se actualizaron cotizaciones por emitir, avisar.
      const nCot = savedProducto?.cotizaciones_actualizadas || 0
      if (isEdit && nCot > 0) {
        showToast(`Moneda actualizada en ${nCot} cotización${nCot !== 1 ? 'es' : ''} por emitir`, 'success')
      }

      // Crear la primera tarifa automáticamente a partir de lo capturado
      // arriba, para que el producto quede listo para cotizar sin un
      // segundo paso obligatorio en "Gestionar Tarifario". Para por_plan/
      // por_nivel se pueden agregar más planes/niveles después desde ahí.
      if (!isEdit) {
        const nombreTarifa = requiereNombreTarifa ? tarifaNombre.trim() : 'Tarifa Base'
        const datos = serializeDatosForm(form.tipo_calculo, datosForm, nombreTarifa, form.tipo_bien)
        await createTarifa(savedProducto.id, {
          nombre: nombreTarifa,
          subtipo: nombreTarifa.toLowerCase().replace(/\s+/g, '_'),
          activo: true,
          datos,
        })
      }

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
      <div ref={panelRef} tabIndex={-1} className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in duration-200 outline-none">
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
                  { val: true,  Icon: Sparkles,  label: 'Nuevo tipo de póliza', desc: 'Primera póliza de este ramo / categoría' },
                  { val: false, Icon: GitBranch, label: 'Variante de tipo existente', desc: 'Versión diferente de un ramo ya registrado' },
                ].map(opt => {
                  const on = form.es_nuevo === opt.val
                  return (
                    <button
                      key={String(opt.val)}
                      type="button"
                      onClick={() => set('es_nuevo', opt.val)}
                      className={`relative flex-1 text-left p-3 rounded-xl border-2 transition-all ${
                        on ? 'border-jm-blue bg-blue-50' : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {on && <Check className="w-3.5 h-3.5 text-jm-blue absolute top-2.5 right-2.5" />}
                      <span className={`w-7 h-7 rounded-lg flex items-center justify-center mb-1.5 transition-colors ${on ? 'bg-jm-blue text-white' : 'bg-slate-100 text-slate-400'}`}>
                        <opt.Icon className="w-4 h-4" />
                      </span>
                      <p className={`text-xs font-bold ${on ? 'text-jm-blue' : 'text-slate-700'}`}>{opt.label}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{opt.desc}</p>
                    </button>
                  )
                })}
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

          <div className="space-y-5">
            {/* ── Identificación ── */}
            <section>
              <ProdSecHdr Icon={Shield}>Identificación</ProdSecHdr>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className={lbl}>Nombre de la póliza <span className="text-rose-500">*</span></label>
                  <input className={inp('nombre')} value={form.nombre} onChange={e => set('nombre', e.target.value)} placeholder="Ej. RCV Particular Privado" />
                  {errors.nombre && <p className="text-[10px] text-rose-500 mt-0.5">{errors.nombre}</p>}
                </div>
                <div className="col-span-2">
                  <div className="flex items-center gap-3 p-2.5 rounded-xl border border-slate-200">
                    <span className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${form.publicado ? 'bg-jm-blue text-white' : 'bg-slate-100 text-slate-400'}`}>
                      <Globe className="w-4 h-4" />
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-700">Publicado en el cotizador público</p>
                      <p className="text-[10px] text-slate-400 leading-snug">Si lo desactivas, deja de mostrarse a los clientes pero sigue visible aquí.</p>
                    </div>
                    <Switch checked={form.publicado} onChange={v => set('publicado', v)} />
                  </div>
                </div>
                <div>
                  <label className={lbl}>Código interno</label>
                  <input className={`input-field text-sm font-mono uppercase`} value={form.codigo} onChange={e => set('codigo', e.target.value.toUpperCase())} placeholder="ACC-ORO" maxLength={20} />
                </div>
                <div>
                  <label className={lbl}>Ramo de seguro <span className="text-rose-500">*</span></label>
                  {!form.es_nuevo && !isEdit ? (
                    <div className="input-field text-sm bg-slate-50 text-slate-500 flex items-center gap-2 cursor-not-allowed">
                      <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" /><span>{form.tipo || '—'}</span>
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
                      <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" /><span>{form.categoria || '—'}</span>
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
                      <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" /><span>{form.tipo_bien || '—'}</span>
                    </div>
                  ) : (
                    <>
                      <select className={`select-field text-sm ${errors.tipo_bien ? 'border-rose-400' : ''}`} value={form.tipo_bien} onChange={e => setTipoBien(e.target.value)}>
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
            <section className="pt-5 border-t border-slate-100">
              <ProdSecHdr Icon={Settings}>Cálculo</ProdSecHdr>
              <div className="space-y-3">
                <div>
                  <label className={lbl}>Tipo de cálculo <span className="text-rose-500">*</span></label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-1">
                    {TIPOS_CALCULO.map(t => {
                      const on = form.tipo_calculo === t.val
                      return (
                        <button key={t.val} type="button" onClick={() => setTipoCalculo(t.val)}
                          className={`flex flex-col items-start p-2.5 rounded-xl border-2 text-left transition-all ${on ? 'border-jm-blue bg-blue-50/50' : 'border-slate-200 hover:border-slate-300'}`}>
                          <p className={`text-xs font-bold ${on ? 'text-jm-blue' : 'text-slate-700'}`}>{t.label}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5 leading-tight">{t.desc}</p>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Campos reales de la tarifa — cambian según el tipo de cálculo elegido arriba.
                    Solo al crear: al editar, la tarifa real se ajusta desde "Gestionar Tarifario". */}
                {!isEdit && (
                  <div className="p-3 rounded-xl border border-dashed border-jm-blue/30 bg-blue-50/30">
                    <p className="text-[11px] font-bold text-jm-blue uppercase tracking-wide mb-2">
                      Tarifa — {TIPOS_CALCULO.find(t => t.val === form.tipo_calculo)?.label}
                    </p>
                    {requiereNombreTarifa && (
                      <div className="mb-2.5">
                        <label className={lbl}>Nombre de este {form.tipo_calculo === 'por_plan' ? 'plan' : 'nivel'} <span className="text-rose-500">*</span></label>
                        <input className={`input-field text-sm ${errors.tarifaNombre ? 'border-rose-400' : ''}`} value={tarifaNombre}
                          placeholder={form.tipo_calculo === 'por_plan' ? 'Plan Básico' : 'Nivel I'}
                          onChange={e => { setTarifaNombre(e.target.value); setErrors(er => ({ ...er, tarifaNombre: '' })) }} />
                        {errors.tarifaNombre && <p className="text-[10px] text-rose-500 mt-0.5">{errors.tarifaNombre}</p>}
                        <p className="text-[10px] text-slate-400 mt-1">Podrás agregar más {form.tipo_calculo === 'por_plan' ? 'planes' : 'niveles'} luego desde "Gestionar Tarifario".</p>
                      </div>
                    )}
                    <DatosForm tipoCalculo={form.tipo_calculo} value={datosForm} onChange={setDatosForm} tipoBien={form.tipo_bien} />
                    {errors.datosForm && <p className="text-[10px] text-rose-500 mt-1">{errors.datosForm}</p>}
                  </div>
                )}

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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className={isEdit ? '' : 'sm:col-span-2'}>
                    <label className={lbl}>Derecho póliza ({M})</label>
                    <input type="number" className="input-field text-sm" min="0" step="0.01" value={form.derecho_poliza} onChange={e => set('derecho_poliza', e.target.value)} placeholder="0.00" />
                  </div>
                  {/* Al crear, prima/cobertura se derivan de la tarifa capturada arriba —
                      mostrarlas también aquí sería un campo duplicado y confuso. */}
                  {isEdit && (
                    <>
                      <div>
                        <label className={lbl}>Prima base ({M})</label>
                        <input type="number" className={inp('prima')} min="0" step="0.01" value={form.prima} onChange={e => set('prima', e.target.value)} placeholder="0.00" />
                      </div>
                      <div className="col-span-2">
                        <label className={lbl}>Cobertura / Suma asegurada ({M})</label>
                        <input type="number" className="input-field text-sm" min="0" step="0.01" value={form.cobertura} onChange={e => set('cobertura', e.target.value)} placeholder="0.00" />
                      </div>
                    </>
                  )}
                </div>

                <div>
                  <label className={lbl}>Descripción <span className="text-rose-500">*</span></label>
                  <textarea className={`${inp('descripcion')} resize-none`} rows={2} value={form.descripcion} onChange={e => set('descripcion', e.target.value)} placeholder="Descripción de la póliza…" />
                  {errors.descripcion && <p className="text-[10px] text-rose-500 mt-0.5">{errors.descripcion}</p>}
                </div>
              </div>
            </section>
          </div>

          {/* ── Bienes y beneficiarios (fila completa) ── */}
          <section className="pt-4 border-t border-slate-100">
            <ProdSecHdr Icon={Package}>Bienes y beneficiarios de esta póliza</ProdSecHdr>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
              <ToggleCard
                Icon={Package}
                title="¿Permite cubrir varios bienes?"
                desc="Ej. una póliza de flota que cubre varios vehículos bajo el mismo contrato."
                checked={form.permite_multiples_bienes}
                onChange={v => set('permite_multiples_bienes', v)}
              >
                <label className={lbl}>Máximo de bienes (vacío = sin límite)</label>
                <input type="number" min="1" className="input-field text-sm" value={form.max_bienes} onChange={e => set('max_bienes', e.target.value)} placeholder="Ej. 5" />
              </ToggleCard>
              <ToggleCard
                Icon={Users}
                title="¿Aplican beneficiarios?"
                desc="Ej. vida o accidentes personales, donde se reparte una suma asegurada entre beneficiarios."
                checked={form.aplica_beneficiarios}
                onChange={v => set('aplica_beneficiarios', v)}
              >
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className={lbl}>Mínimo</label>
                    <input type="number" min="0" className="input-field text-sm" value={form.min_beneficiarios} onChange={e => set('min_beneficiarios', e.target.value)} placeholder="—" />
                  </div>
                  <div>
                    <label className={lbl}>Máximo</label>
                    <input type="number" min="0" className="input-field text-sm" value={form.max_beneficiarios} onChange={e => set('max_beneficiarios', e.target.value)} placeholder="—" />
                  </div>
                </div>
              </ToggleCard>
              <ToggleCard
                className="sm:col-span-2"
                Icon={FileText}
                title="¿Lleva certificado?"
                desc="Pólizas colectivas (varios bienes o beneficiarios). Si no, el cuadro póliza muestra el número de recibo en vez del certificado."
                checked={form.lleva_certificado}
                onChange={v => set('lleva_certificado', v)}
              />
            </div>
          </section>

          {/* ── Impuestos y forma de pago ── */}
          <section className="pt-4 border-t border-slate-100">
            <ProdSecHdr Icon={DollarSign}>Impuestos y forma de pago</ProdSecHdr>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
              <ToggleCard
                Icon={Percent}
                title="¿Aplica IVA?"
                desc="Se calcula sobre la prima al cotizar y aparece desglosado en el documento de la póliza."
                checked={form.iva_aplica}
                onChange={v => set('iva_aplica', v)}
              >
                <label className={lbl}>Porcentaje de IVA</label>
                <div className="relative">
                  <input type="number" min="0" max="100" step="0.01" className="input-field text-sm pr-7" value={form.iva_porcentaje} onChange={e => set('iva_porcentaje', e.target.value)} placeholder="16.00" />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">%</span>
                </div>
              </ToggleCard>
              <ToggleCard
                Icon={Calendar}
                title="¿Admite pago mensual?"
                desc="Si no indicas recargo, la mensualidad es la prima anual dividida en 12 partes iguales."
                checked={form.permite_mensualidades}
                onChange={v => set('permite_mensualidades', v)}
              >
                <label className={lbl}>Recargo por financiamiento mensual (opcional)</label>
                <div className="relative">
                  <input type="number" min="0" max="100" step="0.01" className="input-field text-sm pr-7" value={form.recargo_mensual_pct} onChange={e => set('recargo_mensual_pct', e.target.value)} placeholder="0.00" />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">%</span>
                </div>
              </ToggleCard>
            </div>
          </section>

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
// IMPORTANTE: cada fila de tarifario (una por plan/nivel) ya representa UN
// plan/nivel — su `nombre` es el del plan. Por eso `datos` para por_plan/
// por_nivel NUNCA debe contener una lista de "planes"/"niveles" anidados:
// el motor de cálculo del Simulador (calcTotal) lee directamente
// `datos.prima`/`datos.suma` (por_nivel) o suma los `.prima` de cada
// cobertura nombrada dentro de `datos` (por_plan) — exactamente como ya
// están los datos sembrados originalmente. Antes este formulario guardaba
// otra forma distinta (`{planes:[...]}`) que el Simulador no sabía leer,
// así que cualquier plan/nivel nuevo cotizaba con prima $0 en silencio.
function initDatosForm(tipoCalculo, datos, tipoBien) {
  const d = datos || {}
  switch (tipoCalculo) {
    case 'fijo':
      if (tipoBien === 'vehiculo') {
        return {
          prima_anual:       d.prima_anual       ?? '',
          suma_persona:      d.suma_persona      ?? '',
          suma_cosa:         d.suma_cosa         ?? '',
          deducible:         d.deducible         ?? '',
          asistencia_vial:   d.asistencia_vial   ?? '',
          exceso_limite:     d.exceso_limite     ?? '',
          defensa_penal:     d.defensa_penal     ?? '',
          muerte_invalidez:  d.muerte_invalidez  ?? '',
          gastos_medicos:    d.gastos_medicos    ?? '',
          gastos_funerarios: d.gastos_funerarios ?? '',
        }
      }
      return {
        prima_anual:    d.prima_anual    ?? d.prima_persona ?? d.prima_cosa ?? '',
        suma_asegurada: d.suma_asegurada ?? d.suma_persona  ?? d.suma_cosa  ?? '',
        deducible:      d.deducible      ?? '',
      }
    case 'por_plan': {
      const entradas = Object.entries(d).filter(([k, v]) => v && typeof v === 'object')
      return {
        coberturas: entradas.length > 0
          ? entradas.map(([key, v]) => ({ label: v.label || key.replace(/_/g, ' '), suma: v.suma ?? '', prima: v.prima ?? '' }))
          : [{ label: '', suma: '', prima: '' }],
      }
    }
    case 'por_nivel':
      return { suma: d.suma ?? '', prima: d.prima ?? '' }
    case 'por_valor':
      return { tasa_pct: d.tasa_pct ?? '', prima_minima: d.prima_minima ?? '', cobertura_max: d.cobertura_max ?? '' }
    default:
      return {}
  }
}

// `nombreFila` es el nombre de ESTA fila de tarifario (el plan/nivel que
// representa) — en por_nivel los datos reales sembrados ya lo guardan
// redundantemente como `nivel` (ver docblock de TarifarioController).
// `tipoBien` solo afecta a 'fijo': los vehículos usan el desglose de
// coberturas con nombre propio (Daños a Personas/Cosas, Asistencia Vial…)
// que exige el cuadro póliza estándar; el resto usa una suma asegurada genérica.
function serializeDatosForm(tipoCalculo, datosForm, nombreFila, tipoBien) {
  const f = datosForm || {}
  const n = v => parseFloat(v) || 0
  switch (tipoCalculo) {
    case 'fijo':
      if (tipoBien === 'vehiculo') {
        return {
          prima_anual:       n(f.prima_anual),
          suma_persona:      n(f.suma_persona),
          suma_cosa:         n(f.suma_cosa),
          deducible:         n(f.deducible),
          asistencia_vial:   n(f.asistencia_vial),
          exceso_limite:     n(f.exceso_limite),
          defensa_penal:     n(f.defensa_penal),
          muerte_invalidez:  n(f.muerte_invalidez),
          gastos_medicos:    n(f.gastos_medicos),
          gastos_funerarios: n(f.gastos_funerarios),
        }
      }
      return { prima_anual: n(f.prima_anual), suma_asegurada: n(f.suma_asegurada), deducible: n(f.deducible) }
    case 'por_plan':
      return Object.fromEntries(
        (f.coberturas || [])
          .filter(c => c.label?.trim())
          .map(c => [c.label.trim().toLowerCase().replace(/\s+/g, '_'), { label: c.label.trim(), suma: n(c.suma), prima: n(c.prima) }])
      )
    case 'por_nivel':
      return { nivel: nombreFila ?? f.nivel, suma: n(f.suma), prima: n(f.prima) }
    case 'por_valor':
      return { tasa_pct: n(f.tasa_pct), prima_minima: n(f.prima_minima), cobertura_max: n(f.cobertura_max) }
    default:
      return {}
  }
}

// ── Formulario dinámico de datos tarifarios ───────────────────────────────────
function DatosForm({ tipoCalculo, value, onChange, tipoBien }) {
  const inp = 'input-field text-sm'
  const lbl = 'field-label'
  const numInput = (field, placeholder = '0.00') => (
    <input type="number" min="0" step="0.01" className={inp} placeholder={placeholder}
      value={value[field] ?? ''}
      onChange={e => onChange({ ...value, [field]: e.target.value })} />
  )

  if (tipoCalculo === 'fijo' && tipoBien === 'vehiculo') return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className={lbl}>Prima anual (USD) <span className="text-rose-500">*</span></label>
          {numInput('prima_anual', '180.00')}
        </div>
        <div>
          <label className={lbl}>Deducible (USD)</label>
          {numInput('deducible', '0.00')}
        </div>
      </div>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide pt-1">Coberturas del cuadro póliza</p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className={lbl}>Daños a Personas</label>
          {numInput('suma_persona')}
        </div>
        <div>
          <label className={lbl}>Exceso de Límite</label>
          {numInput('exceso_limite')}
        </div>
        <div>
          <label className={lbl}>Muerte e Invalidez</label>
          {numInput('muerte_invalidez')}
        </div>
        <div>
          <label className={lbl}>Daños a Cosas</label>
          {numInput('suma_cosa')}
        </div>
        <div>
          <label className={lbl}>Defensa Penal</label>
          {numInput('defensa_penal')}
        </div>
        <div>
          <label className={lbl}>Gastos Médicos</label>
          {numInput('gastos_medicos')}
        </div>
        <div>
          <label className={lbl}>Asistencia Vial</label>
          {numInput('asistencia_vial')}
        </div>
        <div></div>
        <div>
          <label className={lbl}>Gastos Funerarios</label>
          {numInput('gastos_funerarios')}
        </div>
      </div>
      <p className="text-[10px] text-slate-400">Déjalas en blanco (0) si esta póliza no incluye esa cobertura — igual aparecerán en el cuadro póliza como "0,00".</p>
    </div>
  )

  if (tipoCalculo === 'fijo') return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

  // por_nivel: esta fila YA ES un nivel (su nombre es el del nivel) — solo
  // hace falta su suma y prima, sin lista anidada.
  if (tipoCalculo === 'por_nivel') return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div>
        <label className={lbl}>Suma asegurada ($) <span className="text-rose-500">*</span></label>
        {numInput('suma', '30000.00')}
      </div>
      <div>
        <label className={lbl}>Prima anual ($) <span className="text-rose-500">*</span></label>
        {numInput('prima', '800.00')}
      </div>
    </div>
  )

  // por_plan: esta fila YA ES un plan — lo que varía dentro de un plan son
  // sus coberturas (Muerte Accidental, Invalidez, Gastos de Sepelio…), cada
  // una con su propia suma y prima.
  if (tipoCalculo === 'por_plan') {
    const coberturas = value.coberturas ?? []
    const update = (i, field, val) => {
      const updated = coberturas.map((c, idx) => idx === i ? { ...c, [field]: val } : c)
      onChange({ ...value, coberturas: updated })
    }
    return (
      <div className="space-y-2">
        {coberturas.map((c, i) => (
          <div key={i} className="p-3 bg-white rounded-xl border border-slate-200">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs font-bold text-slate-500">Cobertura {i + 1}</span>
              {coberturas.length > 1 && (
                <button type="button" onClick={() => onChange({ ...value, coberturas: coberturas.filter((_, j) => j !== i) })}
                  className="p-1 hover:bg-rose-100 rounded transition">
                  <X className="w-3.5 h-3.5 text-rose-400" />
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div>
                <label className={lbl}>Nombre</label>
                <input className={inp} value={c.label || ''} placeholder="Muerte Accidental"
                  onChange={e => update(i, 'label', e.target.value)} />
              </div>
              <div>
                <label className={lbl}>Suma asegurada ($)</label>
                <input type="number" min="0" step="0.01" className={inp} value={c.suma || ''}
                  onChange={e => update(i, 'suma', e.target.value)} />
              </div>
              <div>
                <label className={lbl}>Prima anual ($)</label>
                <input type="number" min="0" step="0.01" className={inp} value={c.prima || ''}
                  onChange={e => update(i, 'prima', e.target.value)} />
              </div>
            </div>
          </div>
        ))}
        <button type="button" onClick={() => onChange({ ...value, coberturas: [...coberturas, { label: '', suma: '', prima: '' }] })}
          className="btn-secondary w-full justify-center text-sm">
          <Plus className="w-4 h-4" /> Agregar cobertura
        </button>
      </div>
    )
  }

  if (tipoCalculo === 'por_valor') return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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

  // 'fijo' tiene 2 formas posibles: suma_asegurada genérica (la mayoría de
  // productos) o el desglose con nombre propio de vehículos (suma_persona,
  // suma_cosa, asistencia_vial…). Se muestran todas las que tengan valor
  // > 0 en vez de asumir una sola forma fija.
  const ETIQUETAS_FIJO = {
    suma_asegurada: 'Suma asegurada', suma_persona: 'Daños a Personas', suma_cosa: 'Daños a Cosas',
    asistencia_vial: 'Asistencia Vial', exceso_limite: 'Exceso de Límite', defensa_penal: 'Defensa Penal',
    muerte_invalidez: 'Muerte e Invalidez', gastos_medicos: 'Gastos Médicos', gastos_funerarios: 'Gastos Funerarios',
  }
  if (tipoCalculo === 'fijo') return (
    <div className="flex flex-wrap gap-4 mt-2 px-1">
      <Tag label="Prima anual" val={fmt(d.prima_anual)} />
      {Object.entries(ETIQUETAS_FIJO).filter(([k]) => (parseFloat(d[k]) || 0) > 0).map(([k, label]) => (
        <Tag key={k} label={label} val={fmt(d[k])} />
      ))}
      {d.deducible > 0 && <Tag label="Deducible" val={fmt(d.deducible)} />}
    </div>
  )

  // Esta fila YA ES un nivel — sus únicos datos son suma + prima.
  if (tipoCalculo === 'por_nivel') return (
    <div className="flex flex-wrap gap-4 mt-2 px-1">
      <Tag label="Prima anual" val={fmt(d.prima)} />
      <Tag label="Suma asegurada" val={fmt(d.suma)} />
    </div>
  )

  // Esta fila YA ES un plan — sus datos son un mapa de coberturas nombradas
  // (ej. muerte_accidental, invalidez_total), cada una con su suma + prima.
  if (tipoCalculo === 'por_plan') {
    const coberturas = Object.entries(d).filter(([, v]) => v && typeof v === 'object')
    return (
      <div className="flex flex-wrap gap-1.5 mt-2">
        {coberturas.map(([key, v], i) => (
          <span key={key} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-50 border border-slate-100 text-xs">
            <span className="font-semibold text-slate-700">{v.label || key.replace(/_/g, ' ')}</span>
            <span className="text-slate-300">·</span>
            <span className="text-emerald-600 font-bold">{fmt(v.prima)}/año</span>
            {v.suma > 0 && <>
              <span className="text-slate-300">·</span>
              <span className="text-indigo-600">{fmt(v.suma)}</span>
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
  const { showToast, showModal, canAct } = useApp()
  const panelRef = useRef(null)
  useModalLock(panelRef)
  const canEdit = canAct('productos', 'edit')
  const [tarifas,       setTarifas]       = useState([])
  const [loading,       setLoading]       = useState(true)
  const [showForm,      setShowForm]      = useState(false)
  const [editing,       setEditing]       = useState(null)
  const [form,          setForm]          = useState({ nombre: '', subtipo: '', datosForm: {}, activo: true })
  const [saving,        setSaving]        = useState(false)
  const [err,           setErr]           = useState('')
  const [showArchivado, setShowArchivado] = useState(false)

  // Compara usando el MISMO nombre en ambos lados — así un simple renombre
  // (que en por_nivel se reflejaría en datos.nivel) no dispara una nueva
  // versión por sí solo; solo cuenta como cambio real si suma/prima difieren.
  const datosChangedFromEditing = editing && (
    JSON.stringify(serializeDatosForm(producto.tipo_calculo, form.datosForm, form.nombre, producto.tipo_bien)) !==
    JSON.stringify(serializeDatosForm(producto.tipo_calculo, initDatosForm(producto.tipo_calculo, editing.datos, producto.tipo_bien), form.nombre, producto.tipo_bien))
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
    setForm({ nombre: '', subtipo: '', datosForm: initDatosForm(producto.tipo_calculo, null, producto.tipo_bien), activo: true })
    setErr('')
    setShowForm(true)
  }

  const openEdit = (t) => {
    setEditing(t)
    setForm({ nombre: t.nombre, subtipo: t.subtipo || '', datosForm: initDatosForm(producto.tipo_calculo, t.datos, producto.tipo_bien), activo: t.activo })
    setErr('')
    setShowForm(true)
  }

  const handleSave = async () => {
    if (!form.nombre.trim()) { setErr('El nombre es obligatorio.'); return }
    const datos = serializeDatosForm(producto.tipo_calculo, form.datosForm, form.nombre, producto.tipo_bien)
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
      <div ref={panelRef} tabIndex={-1} className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in duration-200 outline-none">
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
          {!showForm && canEdit && (
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                  tipoBien={producto.tipo_bien}
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
                      {!isArchivado && canEdit && (
                        <div className="flex gap-1 shrink-0">
                          <button onClick={() => openEdit(t)} className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition" title="Editar tarifa">
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => handleDelete(t)} className="p-1.5 rounded-lg bg-rose-50 text-rose-500 hover:bg-rose-100 transition" title="Eliminar tarifa">
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

// ── Beneficios (coberturas informativas) de un producto ──────────────────────
function BeneficiosModal({ producto, onClose, onSaved }) {
  const { showToast, canAct } = useApp()
  const panelRef = useRef(null)
  useModalLock(panelRef)
  const canEdit = canAct('productos', 'manage_beneficios')
  const [items,   setItems]   = useState(producto.beneficios || [])
  const [saving,  setSaving]  = useState(false)
  const [editId,  setEditId]  = useState(null)
  const [form,    setForm]    = useState({ descripcion: '', monto: '' })

  const resetForm = () => { setEditId(null); setForm({ descripcion: '', monto: '' }) }

  const startEdit = (b) => {
    setEditId(b.id)
    setForm({ descripcion: b.descripcion, monto: String(b.monto) })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.descripcion.trim() || form.monto === '') {
      showToast('Descripción y monto son obligatorios.', 'warning')
      return
    }
    setSaving(true)
    try {
      const payload = { descripcion: form.descripcion.trim(), monto: parseFloat(form.monto) }
      if (editId) {
        const updated = await updateBeneficio(producto.id, editId, payload)
        setItems(prev => prev.map(b => b.id === editId ? updated : b))
      } else {
        const created = await createBeneficio(producto.id, payload)
        setItems(prev => [...prev, created])
      }
      resetForm()
      onSaved?.()
      showToast(editId ? 'Beneficio actualizado' : 'Beneficio agregado', 'success')
    } catch (e) {
      showToast(e.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (b) => {
    try {
      await deleteBeneficio(producto.id, b.id)
      setItems(prev => prev.filter(x => x.id !== b.id))
      if (editId === b.id) resetForm()
      onSaved?.()
      showToast('Beneficio eliminado', 'success')
    } catch (e) {
      showToast(e.message, 'error')
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-[80] flex items-center justify-center p-4 backdrop-blur-sm">
      <div ref={panelRef} tabIndex={-1} className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in duration-200 outline-none">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Beneficios / Coberturas</p>
            <h3 className="text-base font-black text-slate-800">{producto.nombre}</h3>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-xl transition">
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {items.length === 0 ? (
            <div className="py-6 text-center">
              <ListChecks className="w-9 h-9 text-slate-200 mx-auto mb-2" />
              <p className="text-sm text-slate-400">Este producto aún no tiene beneficios listados.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {items.map(b => (
                <div key={b.id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
                    <ListChecks className="w-4 h-4 text-emerald-600" />
                  </div>
                  <p className="flex-1 text-sm font-medium text-slate-700 truncate">{b.descripcion}</p>
                  <span className="text-sm font-bold text-emerald-700 shrink-0">{fmtMonto(b.monto, producto.moneda)}</span>
                  {canEdit && (
                    <>
                      <button onClick={() => startEdit(b)} className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition shrink-0" title="Editar">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(b)} className="p-2 rounded-lg bg-rose-50 text-rose-500 hover:bg-rose-100 transition shrink-0" title="Eliminar">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}

          {canEdit && (
            <form onSubmit={handleSubmit} className="p-3 rounded-xl border border-dashed border-slate-200 space-y-2">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">
                {editId ? 'Editar beneficio' : 'Agregar beneficio'}
              </p>
              <input className="input-field text-sm w-full" placeholder="Descripción (ej: Muerte Accidental) *" value={form.descripcion}
                onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))} />
              <input type="number" min="0" step="0.01" className="input-field text-sm w-full" placeholder="Monto / suma asegurada *" value={form.monto}
                onChange={e => setForm(f => ({ ...f, monto: e.target.value }))} />
              <div className="flex gap-2">
                <button type="submit" disabled={saving} className="btn-primary text-xs !py-1.5 flex-1 justify-center disabled:opacity-50">
                  {editId ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                  {saving ? 'Guardando…' : editId ? 'Guardar cambios' : 'Agregar'}
                </button>
                {editId && (
                  <button type="button" onClick={resetForm} className="btn-secondary text-xs !py-1.5">Cancelar</button>
                )}
              </div>
            </form>
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
  const [modalBenef,    setModalBenef]    = useState(null)  // null | producto
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
  const canViewCards  = canAct('productos', 'view_cards')
  const canViewList   = canAct('productos', 'view_list')

  const conteosPorTipo = TIPOS_PRODUCTO.reduce((acc, t) => {
    acc[t.val] = productos.filter(p => p.tipo === t.val).length
    return acc
  }, {})

  const tasaUsd = tasas.usd ? Number(tasas.usd.valor) : null
  const tasaEur = tasas.eur ? Number(tasas.eur.valor) : null

  const sumaEnMoneda = (campo, cur) => productos.reduce((sum, p) => {
    const val = p[campo] || 0
    return sum + (p.moneda === cur ? val : convertirMoneda(val, p.moneda, cur, tasaUsd, tasaEur))
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
        <div className="flex gap-1.5 justify-center flex-wrap items-center">
          <button onClick={() => showModal('productoDetail', { p })} className="p-2.5 rounded-lg bg-slate-50 text-slate-500 hover:bg-slate-100 transition inline-flex items-center justify-center" title="Ver detalles">
            <Eye className="w-[18px] h-[18px]" />
          </button>
          {canManageDocs && (
            <button
              onClick={() => showModal('productoDocumentos', { p, onSaved: loadProductos })}
              className={`p-2.5 rounded-lg transition inline-flex items-center justify-center ${p.documentos?.length > 0 ? 'bg-violet-100 text-violet-700 hover:bg-violet-200' : 'bg-slate-50 text-slate-400 hover:bg-violet-50 hover:text-violet-500'}`}
              title={`Documentos PDF (${p.documentos?.length ?? 0})`}
            >
              <FileText className="w-[18px] h-[18px]" />
            </button>
          )}
          {/* Tarifario */}
          {canEdit && (
            <button onClick={() => setModalTar(p)} className="p-2.5 rounded-lg bg-amber-50 text-amber-600 hover:bg-amber-100 transition inline-flex items-center justify-center" title="Gestionar tarifario">
              <Settings className="w-[18px] h-[18px]" />
            </button>
          )}
          {/* Beneficios / coberturas */}
          <button onClick={() => setModalBenef(p)} className="p-2.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition inline-flex items-center justify-center" title="Beneficios / coberturas">
            <ListChecks className="w-[18px] h-[18px]" />
          </button>
          {canEdit && (
            <button onClick={() => setModalProd(p)} className="p-2.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition inline-flex items-center justify-center" title="Editar">
              <Pencil className="w-[18px] h-[18px]" />
            </button>
          )}
          {canEdit && (
            <button
              onClick={() => showModal('confirmAction', {
                title: p.publicado ? 'Despublicar producto' : 'Publicar producto',
                message: p.publicado
                  ? `"${p.nombre}" dejará de mostrarse en el portal público de clientes.`
                  : `"${p.nombre}" se mostrará en el portal público de clientes.`,
                icon: p.publicado ? EyeOff : Globe,
                color: p.publicado ? 'amber' : 'emerald',
                confirmLabel: p.publicado ? 'Despublicar' : 'Publicar',
                onConfirm: async () => {
                  await updateProducto(p.id, { publicado: !p.publicado })
                  await loadProductos()
                  showToast(p.publicado ? `"${p.nombre}" ya no aparece en el portal público` : `"${p.nombre}" publicado en el portal público`, 'success')
                },
              })}
              className={`p-2.5 rounded-lg transition inline-flex items-center justify-center ${p.publicado ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
              title={p.publicado ? 'Despublicar (ocultar del portal público)' : 'Publicar (mostrar en el portal público)'}
            >
              {p.publicado ? <Globe className="w-[18px] h-[18px]" /> : <EyeOff className="w-[18px] h-[18px]" />}
            </button>
          )}
          {canDelete && (
            <button
              onClick={() => showModal('confirmDelete', { name: p.nombre, onConfirm: async () => { await deleteProducto(p.id); await loadProductos() } })}
              className="p-2.5 rounded-lg bg-rose-50 text-rose-500 hover:bg-rose-100 transition inline-flex items-center justify-center"
              title="Eliminar"
            >
              <Trash2 className="w-[18px] h-[18px]" />
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

        {canViewCards && (
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
        )}
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
      {!loading && !error && (canViewList ? (
        <DataTable cols={COLS} rows={dataRows} searchable />
      ) : (
        <div className="card flex flex-col items-center justify-center py-16 gap-2 text-center">
          <Shield className="w-6 h-6 text-slate-300" />
          <p className="text-xs text-slate-400">No tienes permiso para ver el listado de productos.</p>
        </div>
      ))}

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
      {modalBenef && (
        <BeneficiosModal
          producto={modalBenef}
          onClose={() => setModalBenef(null)}
          onSaved={loadProductos}
        />
      )}
    </div>
  )
}
