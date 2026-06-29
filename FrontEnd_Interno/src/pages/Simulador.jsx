/**
 * Simulador de Cotizaciones — Wizard dinámico de 5 pasos.
 *
 * Paso 1: Seleccionar producto (carga tipo_calculo y documentos_requeridos)
 * Paso 2: Cliente (nuevo o existente)
 * Paso 3: Bien asegurado (vehículo si tipo_bien='vehiculo', sino datos del asegurado)
 * Paso 4: Tarifario / Plan (driven by producto.tipo_calculo)
 * Paso 5: Documentos + Resumen + Enviar
 */
import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import {
  ShieldCheck, Calculator, Check, ArrowRight, ArrowLeft,
  Car, User, Shield, FileCheck, X, Info, CheckCircle, Pencil,
  Download, Trash2, Clock, XCircle, Search, UserCheck, Plus,
  DollarSign, Package, Users, FileText, Upload, AlertTriangle,
  Layers, ClipboardList, ChevronDown, Star, SlidersHorizontal,
  Eye, FolderOpen,
} from 'lucide-react'
import { useApp } from '../context/AppContext.jsx'
import { fmtMonto, convertirMoneda, fmtTasa, pdfPage, pdfHdr, pdfSec, pdfRow, pdfTotal, pdfFooterSimple, useModalLock, filtrarCedula, filtrarTelefono } from '../utils/helpers.jsx'
import { useInputLimits } from '../utils/inputLimits.js'
import { buscarClientes, createCliente } from '../api/clientes.js'
import { fetchTasas } from '../api/tasas.js'
import { fetchProductos } from '../api/productos.js'
import { fetchTarifario } from '../api/tarifario.js'
import { fetchCotizaciones, createCotizacion, updateCotizacion, deleteCotizacion } from '../api/solicitudes.js'
import { createBien, updateBien } from '../api/bienes.js'
import { fetchVehiculosCatalogo } from '../api/vehiculosCatalogo.js'
import { fetchUnderwriting, createUnderwriting } from '../api/underwriting.js'
import { fetchDocumentosCliente, uploadDocumentoCliente, deleteDocumentoCliente } from '../api/clienteDocumentos.js'
import { BIEN_TIPO_PRESETS } from '../utils/bienPresets.js'
import { ciudadesDe, TEL_VE_DEFAULT } from '../utils/venezuela.js'

// ── Helpers ───────────────────────────────────────────────────────────────────
const STATUS_BADGE = {
  'en_revision': 'bg-amber-100 text-amber-700',
  'aprobado': 'bg-blue-100 text-blue-700',
  'emitida': 'bg-emerald-100 text-emerald-700',
  'rechazado': 'bg-rose-100 text-rose-700',
  'pendiente': 'bg-slate-100 text-slate-500',
}
const STATUS_LABEL = {
  'en_revision': 'En Revisión',
  'aprobado': 'Aprobado',
  'emitida': 'Emitida',
  'rechazado': 'Rechazado',
  'pendiente': 'Pendiente',
}

function StatusBadge({ status }) {
  return (
    <span className={`text-xs font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${STATUS_BADGE[status] ?? 'bg-slate-100 text-slate-500'}`}>
      {STATUS_LABEL[status] ?? status}
    </span>
  )
}

function freshState() {
  return {
    // Paso 1
    producto_id: null,
    producto: null,
    // Paso 2
    cliente_id: null,
    cliente_nuevo: false,
    nombre: '', ci: '', tel: '', email: '',
    direccion: '', nacimiento: '', sexo: 'M',
    // Paso 3 — bien asegurado vinculado
    bien_asegurado_id: null,
    // Paso 3 — vehículo
    placa: '', marca: '', modelo: '', año: '',
    color: '', uso: 'Particular', valor: 15000,
    clase: 'Automóvil', version: '', puestos: '', serial_carroceria: '', serial_motor: '',
    // Paso 3 — asegurado, si es distinto del tomador
    asegurado_nombre: '', asegurado_ci: '', asegurado_telefono: '', asegurado_direccion: '',
    // Paso 3 — campos propios del preset del tipo de bien (bicicleta, mascota, etc.)
    bienCampos: {},
    // Paso 3 — observaciones libres sobre el bien ("Otros" en el cuadro póliza)
    bien_observaciones: '',
    vehiculos_adicionales: [],
    // Paso 4 — tarifario
    tarifario_id: null,
    tarifa: null,
    // Paso 4 — por_valor
    valor_declarado: 0,
    // Coberturas calculadas (snapshot)
    coberturas: {},
  }
}

function simFromCot(q) {
  const cobs = q.coberturas || {}
  const attr = q.bien_atributos || {}
  return {
    producto_id: q.producto_id ?? null,
    producto: null,
    cliente_id: q.cliente_id,
    cliente_nuevo: false,
    nombre: q.nombre || '',
    ci: q.ci || '',
    tel: '', email: '', direccion: '', nacimiento: '', sexo: 'M',
    bien_asegurado_id: q.bien_asegurado_id || null,
    placa: attr.placa || '',
    marca: attr.marca || cobs.marca || 'Toyota',
    modelo: attr.modelo || cobs.modelo || '',
    año: String(attr.anio || cobs.año || new Date().getFullYear()),
    color: attr.color || cobs.color || '',
    uso: attr.uso || cobs.uso || 'Particular',
    valor: parseFloat(cobs.valor_mercado) || 15000,
    clase: attr.clase || 'Automóvil',
    version: attr.version || '',
    puestos: attr.puestos || '',
    serial_carroceria: attr.serial_carroceria || '',
    serial_motor: attr.serial_motor || '',
    asegurado_nombre: q.asegurado_nombre || '',
    asegurado_ci: q.asegurado_ci || '',
    asegurado_telefono: q.asegurado_telefono || '',
    asegurado_direccion: q.asegurado_direccion || '',
    bienCampos: attr,
    bien_observaciones: q.bien_observaciones || '',
    vehiculos_adicionales: cobs.vehiculos_adicionales || [],
    tarifario_id: q.tarifario_id ?? null,
    tarifa: null,
    valor_declarado: parseFloat(cobs.valor_declarado) || 0,
    coberturas: cobs,
  }
}

// ── Barra de pasos ────────────────────────────────────────────────────────────
const STEPS = [
  { label: 'Producto', Icon: Shield },
  { label: 'Cliente', Icon: User },
  { label: 'Bien', Icon: Car },
  { label: 'Tarifa', Icon: Calculator },
  { label: 'Confirmar', Icon: FileCheck },
]

function SimBar({ active }) {
  return (
    <div className="flex items-center select-none">
      {STEPS.map((s, i) => {
        const n = i + 1, done = n < active, cur = n === active
        return (
          <div key={i} className="flex items-center" style={{ flex: i < STEPS.length - 1 ? '1' : '0 0 auto' }}>
            <div className="flex flex-col items-center" style={{ flexShrink: 0, width: '4.5rem' }}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all ${done ? 'bg-emerald-500 text-white'
                  : cur ? 'bg-jm-blue text-white shadow-[0_0_0_4px_rgba(0,20,99,0.15)]'
                    : 'bg-slate-100 text-slate-400'
                }`}>
                {done ? <Check className="w-3.5 h-3.5" /> : n}
              </div>
              <p className={`text-[9px] font-bold mt-1 text-center leading-tight ${done ? 'text-emerald-500' : cur ? 'text-jm-blue' : 'text-slate-400'
                }`}>{s.label}</p>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 mb-5 mx-1 transition-colors ${done ? 'bg-emerald-400' : 'bg-slate-200'}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── Shell del wizard ──────────────────────────────────────────────────────────
function SimShell({ step, size = 'md', onClose, footer, children }) {
  const maxW = { sm: 'max-w-xl', md: 'max-w-2xl', lg: 'max-w-3xl', xl: 'max-w-4xl', xxl: 'max-w-5xl' }[size] || 'max-w-2xl'
  const panelRef = useRef(null)
  useModalLock(panelRef)
  useInputLimits(panelRef)
  return (
    <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-2 sm:p-4 backdrop-blur-sm">
      <div ref={panelRef} tabIndex={-1} className={`bg-white rounded-3xl shadow-2xl w-full ${maxW} max-h-[95vh] flex flex-col overflow-hidden animate-in zoom-in duration-200 outline-none`}>
        <div className="px-5 sm:px-7 pt-5 pb-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0" style={{ background: 'linear-gradient(135deg,#001463,#000c3b)' }}>
                <Calculator className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Simulador · LA VENEZOLANA DE SEGUROS Y VIDA C.A.</p>
                <h3 className="text-base font-black text-slate-800">Cotización</h3>
              </div>
            </div>
            <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-xl transition shrink-0">
              <X className="w-4 h-4 text-slate-500" />
            </button>
          </div>
          <SimBar active={step} />
        </div>
        <div className="flex-1 overflow-y-auto p-5 sm:p-7">{children}</div>
        {footer && (
          <div className="px-5 sm:px-7 py-4 border-t border-slate-100 flex flex-wrap gap-2 justify-between items-center shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}

function SecLabel({ icon: Icon, label }) {
  return (
    <div className="flex items-center gap-2 mb-3 mt-4 first:mt-0">
      <div className="w-4 h-4 rounded-md bg-slate-100 flex items-center justify-center shrink-0">
        <Icon className="w-2.5 h-2.5 text-slate-500" />
      </div>
      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</span>
    </div>
  )
}

// ── PASO 1: Seleccionar Producto ──────────────────────────────────────────────
const CAT_ICON = { vehicular: Car, bienes: Package, personas: Users }

const CAT_COLOR = {
  vehicular: { bg: 'bg-blue-600', light: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-500' },
  bienes: { bg: 'bg-violet-600', light: 'bg-violet-50', text: 'text-violet-600', border: 'border-violet-500' },
  personas: { bg: 'bg-emerald-600', light: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-500' },
  default: { bg: 'bg-slate-600', light: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-400' },
}

function Step1({ sim, setSim, onNext, onClose, productos }) {
  const [err, setErr] = useState('')
  const [page, setPage] = useState(0)
  const [cols, setCols] = useState(3)

  // Ajuste responsive: 1 col móvil, 2 tablet, 3 desktop
  useEffect(() => {
    const update = () => {
      if (window.innerWidth < 500) setCols(1)
      else if (window.innerWidth < 900) setCols(2)
      else setCols(3)
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  const perPage = cols * 2          // 2 filas siempre
  const totalPages = Math.ceil(productos.length / perPage)
  const pageItems = productos.slice(page * perPage, page * perPage + perPage)

  // Si el producto seleccionado no está en la página actual, ir a su página
  useEffect(() => {
    if (!sim.producto_id || perPage === 0) return
    const idx = productos.findIndex(p => p.id === sim.producto_id)
    if (idx >= 0) setPage(Math.floor(idx / perPage))
  }, [sim.producto_id, productos, perPage])

  const handleNext = () => {
    if (!sim.producto_id) { setErr('Selecciona un tipo de póliza para continuar.'); return }
    setErr('')
    onNext()
  }

  const goPage = (p) => setPage(Math.max(0, Math.min(totalPages - 1, p)))

  return (
    <SimShell step={1} size="xl" onClose={onClose} footer={
      <>
        <button onClick={onClose} className="btn-secondary">Cancelar</button>
        <button onClick={handleNext} className="btn-primary">
          Continuar <ArrowRight className="w-4 h-4" />
        </button>
      </>
    }>
      {err && <p className="mb-3 text-xs text-rose-600 bg-rose-50 border border-rose-100 rounded-xl px-3 py-2">{err}</p>}
      <SecLabel icon={Shield} label="Tipo de póliza" />

      {productos.length === 0 ? (
        <div className="text-center py-12 text-slate-400 text-sm">
          <AlertTriangle className="w-8 h-8 mx-auto mb-2 opacity-30" />
          No hay productos configurados. Un administrador debe crear productos primero.
        </div>
      ) : (
        <>
          {/* Cuadrícula 3×2 con flechas a los lados */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => goPage(page - 1)}
              disabled={page === 0}
              className="w-8 h-8 shrink-0 rounded-full border border-slate-200 bg-white flex items-center justify-center hover:bg-slate-50 disabled:opacity-20 disabled:cursor-not-allowed transition shadow-sm"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-slate-600" />
            </button>

            <div className="grid gap-3 flex-1 min-h-[200px]"
              style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
              {pageItems.map(p => {
                const CatIcon = CAT_ICON[p.categoria] ?? Shield
                const colors = CAT_COLOR[p.categoria] ?? CAT_COLOR.default
                const on = sim.producto_id === p.id
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSim(prev => (prev.producto_id === p.id ? prev : {
                      ...prev,
                      producto_id: p.id,
                      producto: p,
                      // Limpiar selección de tarifa/valor del producto anterior — cada
                      // producto puede tener un tipo_calculo distinto (fijo/por_plan/
                      // por_nivel/por_valor) y arrastrar la tarifa previa daba totales
                      // incorrectos o en $0.
                      tarifario_id: null,
                      tarifa: null,
                      valor_declarado: null,
                    }))}
                    className={`relative flex flex-col rounded-2xl border-2 text-left transition-all duration-200 overflow-hidden
                    ${on
                        ? `${colors.border} ${colors.light} shadow-lg`
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-md'
                      }`}
                  >
                    {/* Header */}
                    <div className={`${on ? colors.bg : 'bg-slate-100'} px-3 pt-3 pb-2.5 transition-colors`}>
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-1.5 ${on ? 'bg-white/20' : 'bg-white'}`}>
                        <CatIcon className={`w-4 h-4 ${on ? 'text-white' : colors.text}`} />
                      </div>
                      <p className={`text-[13px] font-bold leading-tight ${on ? 'text-white' : 'text-slate-800'}`}>{p.nombre}</p>
                    </div>
                    {/* Cuerpo */}
                    <div className="px-3 py-2 flex-1 flex flex-col gap-1.5">
                      <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">{p.descripcion}</p>
                      <div className="flex flex-wrap gap-1 mt-auto">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${on ? `${colors.light} ${colors.text}` : 'bg-slate-100 text-slate-500'}`}>
                          {p.tipo_calculo}
                        </span>
                        {p.tipo_bien && p.tipo_bien !== 'ninguno' && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-sky-100 text-sky-600 font-semibold capitalize">{p.tipo_bien}</span>
                        )}
                        {p.derecho_poliza > 0 && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-semibold">+ {fmtMonto(p.derecho_poliza, p.moneda)}</span>
                        )}
                      </div>
                    </div>
                    {/* Check seleccionado */}
                    {on && (
                      <div className={`absolute top-2 right-2 w-5 h-5 rounded-full ${colors.bg} flex items-center justify-center shadow`}>
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </button>
                )
              })}
              {/* Relleno para completar la última página */}
              {Array.from({ length: perPage - pageItems.length }).map((_, i) => (
                <div key={`empty-${i}`} className="rounded-2xl border-2 border-dashed border-slate-100" />
              ))}
            </div>

            <button
              onClick={() => goPage(page + 1)}
              disabled={page === totalPages - 1}
              className="w-8 h-8 shrink-0 rounded-full border border-slate-200 bg-white flex items-center justify-center hover:bg-slate-50 disabled:opacity-20 disabled:cursor-not-allowed transition shadow-sm"
            >
              <ArrowRight className="w-3.5 h-3.5 text-slate-600" />
            </button>
          </div>

          {/* Indicadores de página */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-3">
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => goPage(i)}
                  className={`rounded-full transition-all duration-200 ${i === page
                      ? 'w-6 h-3 bg-blue-600'
                      : 'w-3 h-3 bg-slate-200 hover:bg-slate-400'
                    }`}
                />
              ))}
            </div>
          )}

          {/* Producto seleccionado */}
          {sim.producto && (
            <div className={`mt-3 px-4 py-2.5 rounded-xl flex items-center gap-3 ${(CAT_COLOR[sim.producto.categoria] ?? CAT_COLOR.default).light} border ${(CAT_COLOR[sim.producto.categoria] ?? CAT_COLOR.default).border}`}>
              <Check className={`w-4 h-4 shrink-0 ${(CAT_COLOR[sim.producto.categoria] ?? CAT_COLOR.default).text}`} />
              <div>
                <p className="text-sm font-bold text-slate-800">{sim.producto.nombre}</p>
                <p className="text-xs text-slate-500">{sim.producto.descripcion}</p>
              </div>
            </div>
          )}
        </>
      )}

      {/* Documentos requeridos */}
      {sim.producto?.documentos_requeridos?.length > 0 && (
        <div className="mt-3 p-3.5 rounded-2xl bg-amber-50 border border-amber-100">
          <p className="text-xs font-bold text-amber-700 mb-2 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5" /> Documentos requeridos para este producto
          </p>
          <div className="flex flex-wrap gap-2">
            {sim.producto.documentos_requeridos.map(d => (
              <span key={d.nombre} className={`text-[11px] px-2 py-1 rounded-lg font-medium ${d.obligatorio ? 'bg-amber-100 text-amber-800' : 'bg-white text-slate-500 border border-slate-200'}`}>
                {d.obligatorio ? '* ' : ''}{d.nombre}
              </span>
            ))}
          </div>
        </div>
      )}
    </SimShell>
  )
}

// ── PASO 2: Cliente ───────────────────────────────────────────────────────────
function Step2({ sim, setSim, onNext, onBack, onClose }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [buscando, setBuscando] = useState(false)
  const [selected, setSelected] = useState(!!sim.cliente_id)
  const [modo, setModo] = useState('buscar') // 'buscar' | 'nuevo'
  const [err, setErr] = useState('')
  const [saving, setSaving] = useState(false)

  const [nuevoForm, setNuevoForm] = useState({
    nombre: sim.nombre || '', ci: sim.ci?.replace(/^[VEJGP]-?/i, '') || '', ciPrefijo: sim.ci?.match(/^([VEJGP])-?/i)?.[1]?.toUpperCase() || 'V',
    tel: sim.tel || TEL_VE_DEFAULT, email: sim.email || '',
    direccion: sim.direccion || '', nacimiento: sim.nacimiento || '',
    sexo: sim.sexo || 'M',
    condicion: '', nacionalidad: 'Venezolano/a',
    estado: 'Distrito Capital', ciudad: '',
  })
  const setNf = (k, v) => setNuevoForm(prev => ({ ...prev, [k]: v }))

  // Búsqueda en el servidor (no solo "mis clientes") — con debounce para no
  // disparar una petición por cada tecla. Busca en TODA la empresa: lo que
  // importa acá es saber si la persona ya es cliente (de cualquier asesor)
  // para no duplicarla, no filtrar por cartera propia.
  useEffect(() => {
    if (!query.trim()) { setResults([]); setBuscando(false); return }
    setBuscando(true)
    const timer = setTimeout(() => {
      buscarClientes(query.trim())
        .then(setResults)
        .catch(() => setResults([]))
        .finally(() => setBuscando(false))
    }, 300)
    return () => clearTimeout(timer)
  }, [query])

  const selectClient = (c) => {
    setSim(prev => ({ ...prev, cliente_id: c.id, cliente_nuevo: false, nombre: c.nom || c.nombre, ci: c.ci || c.cedula, tel: c.tel || c.celular || '', email: c.email || c.correo || '' }))
    setSelected(true); setQuery(''); setResults([])
  }

  const clearClient = () => {
    setSim(prev => ({ ...prev, cliente_id: null, cliente_nuevo: false, nombre: '', ci: '', tel: '', email: '' }))
    setSelected(false)
  }

  const crearCliente = async () => {
    if (!nuevoForm.nombre.trim()) { setErr('El nombre es obligatorio.'); return }
    if (!nuevoForm.ci.trim()) { setErr('La cédula / RIF es obligatoria.'); return }
    if (!nuevoForm.condicion) { setErr('La condición civil es obligatoria.'); return }
    if (!nuevoForm.email.trim()) { setErr('El correo electrónico es obligatorio.'); return }
    if (!nuevoForm.tel.trim()) { setErr('El teléfono es obligatorio.'); return }
    if (!nuevoForm.estado) { setErr('Selecciona el estado.'); return }
    if (!nuevoForm.ciudad.trim()) { setErr('La ciudad es obligatoria.'); return }
    if (!nuevoForm.direccion.trim()) { setErr('La dirección es obligatoria.'); return }
    if (!nuevoForm.nacimiento) { setErr('La fecha de nacimiento es obligatoria.'); return }
    const cedulaCompleta = `${nuevoForm.ciPrefijo}-${nuevoForm.ci.replace(/\D/g, '')}`
    setSaving(true); setErr('')
    try {
      const res = await createCliente({
        nombre: nuevoForm.nombre, cedula: cedulaCompleta,
        telefono: nuevoForm.tel, correo: nuevoForm.email,
        direccion: nuevoForm.direccion, nacimiento: nuevoForm.nacimiento,
        sexo: nuevoForm.sexo === 'M' ? 'Masculino' : 'Femenino',
        condicion: nuevoForm.condicion,
        nacionalidad: nuevoForm.nacionalidad,
        estado: nuevoForm.estado,
        ciudad: nuevoForm.ciudad,
      })
      // ci debe quedar con el prefijo (nuevoForm.ci es solo dígitos); sin esto
      // el envío mandaba ci_tomador sin la letra y fallaba la validación.
      setSim(prev => ({ ...prev, cliente_id: res.id, cliente_nuevo: true, ...nuevoForm, ci: cedulaCompleta }))
      setSelected(true); setModo('buscar')
    } catch (e) {
      setErr(e.message || 'Error al crear cliente')
    } finally {
      setSaving(false)
    }
  }

  const handleNext = () => {
    if (!sim.cliente_id) { setErr('Debes seleccionar o crear un cliente.'); return }
    setErr(''); onNext()
  }

  const inp = 'input-field text-sm'
  const lbl = 'field-label'

  return (
    <SimShell step={2} size="xl" onClose={onClose} footer={
      <>
        <button onClick={onBack} className="btn-secondary"><ArrowLeft className="w-4 h-4" /> Anterior</button>
        {sim.cliente_id && (
          <button onClick={handleNext} className="btn-primary">Continuar <ArrowRight className="w-4 h-4" /></button>
        )}
      </>
    }>
      {/* Producto seleccionado — resumen */}
      {sim.producto && (
        <div className="mb-4 p-3 rounded-2xl border border-slate-200 bg-slate-50/70 flex items-center gap-3">
          <Shield className="w-4 h-4 text-jm-blue shrink-0" />
          <p className="text-sm font-bold text-slate-700 truncate">{sim.producto.nombre}</p>
        </div>
      )}

      {err && <p className="mb-3 text-xs text-rose-600 bg-rose-50 border border-rose-100 rounded-xl px-3 py-2">{err}</p>}

      {/* Tabs: buscar | nuevo */}
      {!selected && (
        <div className="flex gap-1 mb-4 bg-slate-100 p-1 rounded-2xl w-fit">
          {[['buscar', 'Cliente existente'], ['nuevo', 'Nuevo cliente']].map(([m, label]) => (
            <button
              key={m}
              onClick={() => { setModo(m); setErr('') }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${modo === m ? 'bg-white text-jm-blue shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {selected ? (
        <div className="p-4 rounded-2xl border-2 border-emerald-200 bg-emerald-50/40">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
              <UserCheck className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-slate-800 truncate">{sim.nombre}</p>
              <p className="text-xs font-mono text-slate-500">{sim.ci}</p>
              {sim.cliente_nuevo && <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">Nuevo</span>}
            </div>
            <button onClick={clearClient} className="p-1.5 hover:bg-emerald-100 rounded-xl transition shrink-0">
              <X className="w-4 h-4 text-emerald-600" />
            </button>
          </div>
        </div>
      ) : modo === 'buscar' ? (
        <div>
          <SecLabel icon={Search} label="Buscar cliente existente" />
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input className="input-field pl-9" placeholder="Buscar por nombre o CI…" value={query} onChange={e => setQuery(e.target.value)} autoFocus />
          </div>
          {results.length > 0 && (
            <div className="mt-1 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden">
              {results.map(c => (
                <button key={c.id} onClick={() => selectClient(c)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition text-left border-b border-slate-50 last:border-0">
                  <div className="w-8 h-8 rounded-full bg-jm-blue/10 flex items-center justify-center shrink-0">
                    <User className="w-4 h-4 text-jm-blue" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-800 truncate">{c.nom}</p>
                    <p className="text-xs font-mono text-slate-400">{c.ci}</p>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${c.est === 'Activo' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>{c.est}</span>
                </button>
              ))}
            </div>
          )}
          {query && !buscando && results.length === 0 && (
            <p className="mt-2 text-xs text-slate-400 text-center">No se encontró ningún cliente con ese criterio.</p>
          )}
        </div>
      ) : (
        <div>
          <SecLabel icon={Users} label="Datos del nuevo cliente" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="col-span-2 sm:col-span-3">
              <label className={lbl}>Nombre completo <span className="text-rose-500">*</span></label>
              <input className={inp} value={nuevoForm.nombre} onChange={e => setNf('nombre', e.target.value)} placeholder="Juan Pérez" />
            </div>
            <div>
              <label className={lbl}>Cédula / RIF <span className="text-rose-500">*</span></label>
              <div className="flex gap-1">
                <select
                  className="select-field text-sm font-bold w-16 shrink-0"
                  value={nuevoForm.ciPrefijo}
                  onChange={e => {
                    setNf('ciPrefijo', e.target.value)
                    setNf('nacionalidad', e.target.value === 'V' ? 'Venezolano/a' : e.target.value === 'E' ? 'Extranjero/a' : 'Venezolano/a')
                  }}
                >
                  <option value="V">V</option>
                  <option value="E">E</option>
                  <option value="J">J</option>
                  <option value="G">G</option>
                  <option value="P">P</option>
                </select>
                <input className={`${inp} font-mono flex-1`} value={nuevoForm.ci} onChange={e => setNf('ci', e.target.value.replace(/\D/g, ''))} placeholder="12345678" maxLength={10} />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">V=venezolano · E=extranjero · J/G=empresa · P=pasaporte</p>
            </div>
            <div>
              <label className={lbl}>Sexo</label>
              <select className="select-field text-sm" value={nuevoForm.sexo} onChange={e => setNf('sexo', e.target.value)}>
                <option value="M">Masculino</option>
                <option value="F">Femenino</option>
              </select>
            </div>
            <div>
              <label className={lbl}>Condición civil <span className="text-rose-500">*</span></label>
              <select className="select-field text-sm" value={nuevoForm.condicion} onChange={e => setNf('condicion', e.target.value)}>
                <option value="">— Seleccionar —</option>
                {['Soltero/a', 'Casado/a', 'Viudo/a', 'Divorciado/a', 'Concubino/a'].map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <label className={lbl}>Nacimiento <span className="text-rose-500">*</span></label>
              <input className={inp} type="date" value={nuevoForm.nacimiento} onChange={e => setNf('nacimiento', e.target.value)} />
            </div>
            <div>
              <label className={lbl}>Nacionalidad</label>
              <select className="select-field text-sm" value={nuevoForm.nacionalidad} onChange={e => setNf('nacionalidad', e.target.value)}>
                {['Venezolano/a', 'Extranjero/a'].map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <label className={lbl}>Teléfono <span className="text-rose-500">*</span></label>
              <input className={inp} value={nuevoForm.tel} onChange={e => setNf('tel', filtrarTelefono(e.target.value))} placeholder="+58 414-1234567" />
            </div>
            <div className="col-span-2">
              <label className={lbl}>Correo <span className="text-rose-500">*</span></label>
              <input className={inp} type="email" value={nuevoForm.email} onChange={e => setNf('email', e.target.value)} placeholder="correo@email.com" />
            </div>
            <div>
              <label className={lbl}>Estado <span className="text-rose-500">*</span></label>
              <select className="select-field text-sm" value={nuevoForm.estado} onChange={e => setNf('estado', e.target.value)}>
                {['Amazonas', 'Anzoátegui', 'Apure', 'Aragua', 'Barinas', 'Bolívar', 'Carabobo', 'Cojedes', 'Delta Amacuro', 'Distrito Capital', 'Falcón', 'Guárico', 'Lara', 'Mérida', 'Miranda', 'Monagas', 'Nueva Esparta', 'Portuguesa', 'Sucre', 'Táchira', 'Trujillo', 'La Guaira', 'Yaracuy', 'Zulia'].map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <label className={lbl}>Ciudad <span className="text-rose-500">*</span></label>
              <input className={inp} list="ciudades-sim" value={nuevoForm.ciudad} onChange={e => setNf('ciudad', e.target.value)} placeholder="Caracas" autoComplete="off" />
              <datalist id="ciudades-sim">
                {ciudadesDe(nuevoForm.estado).map(c => <option key={c} value={c} />)}
              </datalist>
            </div>
            <div className="col-span-2 sm:col-span-3">
              <label className={lbl}>Dirección <span className="text-rose-500">*</span></label>
              <input className={inp} value={nuevoForm.direccion} onChange={e => setNf('direccion', e.target.value)} placeholder="Av. Libertador, Edif. Centro…" />
            </div>
          </div>
          <button onClick={crearCliente} disabled={saving} className="btn-primary w-full justify-center mt-4 disabled:opacity-50">
            {saving ? 'Creando…' : <><Plus className="w-4 h-4" /> Crear cliente</>}
          </button>
        </div>
      )}
    </SimShell>
  )
}

// ── PASO 3: Bien asegurado ────────────────────────────────────────────────────
const USOS = ['Particular', 'Ejecutivo / Transporte de personal', 'Carga liviana', 'Carga pesada', 'Colectivo / Minibús', 'Rústico / Pickup', 'Oficial']

function Step3({ sim, setSim, onNext, onBack, onClose, vehiculosCatalogo }) {
  const tipoBien = sim.producto?.tipo_bien ?? 'ninguno'
  const requiereVehiculo = tipoBien === 'vehiculo'
  const preset = BIEN_TIPO_PRESETS[tipoBien] ?? null
  const setCampo = (key, val) => setSim(p => ({ ...p, bienCampos: { ...p.bienCampos, [key]: val } }))
  const [err, setErr] = useState('')

  // Filtrado en cascada para el vehículo principal
  const marcasDisponibles = useMemo(() => {
    if (!vehiculosCatalogo) return []
    const list = vehiculosCatalogo.filter(item => item.tipo === sim.clase)
    return [...new Set(list.map(item => item.marca))].sort()
  }, [vehiculosCatalogo, sim.clase])

  const modelosDisponibles = useMemo(() => {
    if (!vehiculosCatalogo || !sim.marca) return []
    const list = vehiculosCatalogo.filter(item => item.tipo === sim.clase && item.marca === sim.marca)
    return [...new Set(list.map(item => item.modelo))].sort()
  }, [vehiculosCatalogo, sim.clase, sim.marca])

  const añosDisponibles = useMemo(() => {
    if (!vehiculosCatalogo || !sim.marca || !sim.modelo) {
      const curYear = new Date().getFullYear()
      return Array.from({ length: 35 }, (_, i) => String(curYear + 1 - i))
    }
    const match = vehiculosCatalogo.find(item => item.tipo === sim.clase && item.marca === sim.marca && item.modelo === sim.modelo)
    if (!match) {
      const curYear = new Date().getFullYear()
      return Array.from({ length: 35 }, (_, i) => String(curYear + 1 - i))
    }
    const list = []
    for (let y = match.anio_fin; y >= match.anio_inicio; y--) {
      list.push(String(y))
    }
    return list
  }, [vehiculosCatalogo, sim.clase, sim.marca, sim.modelo])

  const canContinueAdicionales = (sim.vehiculos_adicionales || []).every(
    v => v.placa.trim().length >= 4 && v.marca && v.modelo && v.año && v.valor > 0
  )
  const canContinue = !requiereVehiculo || (
    sim.placa.trim().length >= 4 && sim.marca && sim.modelo && sim.año && sim.valor > 0 && canContinueAdicionales
  )

  const handleNext = () => { setErr(''); onNext() }

  return (
    <SimShell step={3} size="xl" onClose={onClose} footer={
      <>
        <button onClick={onBack} className="btn-secondary"><ArrowLeft className="w-4 h-4" /> Anterior</button>
        {canContinue && (
          <button onClick={handleNext} className="btn-primary">Continuar <ArrowRight className="w-4 h-4" /></button>
        )}
      </>
    }>
      {err && <p className="mb-3 text-xs text-rose-600 bg-rose-50 border border-rose-100 rounded-xl px-3 py-2">{err}</p>}

      {requiereVehiculo ? (
        <>
          <SecLabel icon={Car} label="Datos del vehículo" />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="field-label">Tipo de vehículo <span className="text-rose-500">*</span></label>
              <select className="select-field" value={sim.clase} onChange={e => {
                const newClase = e.target.value;
                setSim(p => ({ ...p, clase: newClase, marca: '', modelo: '', año: '' }));
              }}>
                <option value="Automóvil">Automóvil</option>
                <option value="Camioneta">Camioneta</option>
                <option value="Motocicleta">Motocicleta</option>
                <option value="Camión / Carga">Camión / Carga</option>
              </select>
            </div>
            <div>
              <label className="field-label">Placa <span className="text-rose-500">*</span></label>
              <input className="input-field font-mono uppercase" placeholder="ABC-123" value={sim.placa} maxLength={8}
                onChange={e => setSim(p => ({ ...p, placa: e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, '') }))} />
            </div>
            <div>
              <label className="field-label">Marca <span className="text-rose-500">*</span></label>
              <select className="select-field" value={sim.marca} onChange={e => {
                const newMarca = e.target.value;
                setSim(p => ({ ...p, marca: newMarca, modelo: '', año: '' }));
              }}>
                <option value="">Seleccione marca...</option>
                {marcasDisponibles.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="field-label">Modelo <span className="text-rose-500">*</span></label>
              <select className="select-field" value={sim.modelo} onChange={e => {
                const newModelo = e.target.value;
                setSim(p => ({ ...p, modelo: newModelo, año: '' }));
              }} disabled={!sim.marca}>
                <option value="">Seleccione modelo...</option>
                {modelosDisponibles.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="field-label">Año <span className="text-rose-500">*</span></label>
              <select className="select-field" value={sim.año} onChange={e => setSim(p => ({ ...p, año: e.target.value }))} disabled={!sim.modelo}>
                <option value="">Seleccione año...</option>
                {añosDisponibles.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <div>
              <label className="field-label">Color</label>
              <input className="input-field" placeholder="Blanco perla" value={sim.color}
                onChange={e => setSim(p => ({ ...p, color: e.target.value }))} />
            </div>
            <div>
              <label className="field-label">Uso</label>
              <select className="select-field" value={sim.uso} onChange={e => setSim(p => ({ ...p, uso: e.target.value }))}>
                {USOS.map(u => <option key={u}>{u}</option>)}
              </select>
            </div>
            <div>
              <label className="field-label">Versión</label>
              <input className="input-field" placeholder="EX, LE, Sport…" value={sim.version}
                onChange={e => setSim(p => ({ ...p, version: e.target.value }))} />
            </div>
            <div>
              <label className="field-label">N° de puestos</label>
              <input type="number" min="1" className="input-field" placeholder="5" value={sim.puestos}
                onChange={e => setSim(p => ({ ...p, puestos: e.target.value }))} />
            </div>
            <div>
              <label className="field-label">Serial de carrocería</label>
              <input className="input-field font-mono uppercase" value={sim.serial_carroceria}
                onChange={e => setSim(p => ({ ...p, serial_carroceria: e.target.value.toUpperCase() }))} />
            </div>
            <div>
              <label className="field-label">Serial de motor</label>
              <input className="input-field font-mono uppercase" value={sim.serial_motor}
                onChange={e => setSim(p => ({ ...p, serial_motor: e.target.value.toUpperCase() }))} />
            </div>
          </div>
          <div className="mt-3">
            <label className="field-label">Valor de mercado (USD) <span className="text-rose-500">*</span></label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm pointer-events-none">$</span>
              <input type="number" min="500" step="500" className="input-field pl-7" placeholder="15000"
                value={sim.valor} onChange={e => setSim(p => ({ ...p, valor: parseFloat(e.target.value) || 0 }))} />
            </div>
          </div>
          <div className="mt-4">
            <SecLabel icon={User} label="Asegurado (solo si es distinto del tomador)" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="field-label">Nombre del asegurado</label>
                <input className="input-field" placeholder="Nombre completo" value={sim.asegurado_nombre}
                  onChange={e => setSim(p => ({ ...p, asegurado_nombre: e.target.value }))} />
              </div>
              <div>
                <label className="field-label">Cédula del asegurado</label>
                <input className="input-field font-mono" placeholder="V-12345678" maxLength={12} value={sim.asegurado_ci}
                  onChange={e => setSim(p => ({ ...p, asegurado_ci: filtrarCedula(e.target.value) }))} />
              </div>
              <div>
                <label className="field-label">Teléfono del asegurado</label>
                <input className="input-field" placeholder="0414-1234567" value={sim.asegurado_telefono}
                  onChange={e => setSim(p => ({ ...p, asegurado_telefono: filtrarTelefono(e.target.value) }))} />
              </div>
              <div>
                <label className="field-label">Dirección del asegurado</label>
                <input className="input-field" placeholder="Dirección completa" value={sim.asegurado_direccion}
                  onChange={e => setSim(p => ({ ...p, asegurado_direccion: e.target.value }))} />
              </div>
            </div>
          </div>

          {sim.producto?.permite_multiples_bienes && (
            <div className="mt-6 pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between mb-3">
                <SecLabel icon={Car} label="Vehículos Adicionales" />
                <span className="text-xs text-slate-500 font-medium">
                  {(sim.vehiculos_adicionales?.length || 0) + 1} / {sim.producto.max_bienes || '∞'} permitidos
                </span>
              </div>

              {(sim.vehiculos_adicionales || []).map((v, i) => {
                const addMarcasUnicas = (() => {
                  const list = (vehiculosCatalogo || [])
                    .filter(item => item.tipo === v.clase)
                    .map(item => item.marca);
                  return [...new Set(list)].sort();
                })();

                const addModelosUnicos = (() => {
                  if (!v.marca) return [];
                  const list = (vehiculosCatalogo || [])
                    .filter(item => item.tipo === v.clase && item.marca === v.marca)
                    .map(item => item.modelo);
                  return [...new Set(list)].sort();
                })();

                const addAños = (() => {
                  if (!v.marca || !v.modelo) {
                    const curYear = new Date().getFullYear();
                    return Array.from({ length: 35 }, (_, idx) => String(curYear + 1 - idx));
                  }
                  const match = (vehiculosCatalogo || []).find(item => item.tipo === v.clase && item.marca === v.marca && item.modelo === v.modelo);
                  if (!match) {
                    const curYear = new Date().getFullYear();
                    return Array.from({ length: 35 }, (_, idx) => String(curYear + 1 - idx));
                  }
                  const list = [];
                  for (let y = match.anio_fin; y >= match.anio_inicio; y--) {
                    list.push(String(y));
                  }
                  return list;
                })();

                return (
                  <div key={i} className="mb-4 p-4 bg-slate-50 border border-slate-200 rounded-2xl relative">
                    <div className="absolute top-3 right-3 flex items-center gap-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Vehículo #{i + 2}</span>
                      <button onClick={() => {
                        const arr = [...sim.vehiculos_adicionales]; arr.splice(i, 1);
                        setSim(p => ({ ...p, vehiculos_adicionales: arr }));
                      }} className="p-1 hover:bg-rose-100 text-rose-500 rounded-md transition" title="Eliminar vehículo">
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
                      <div>
                        <label className="field-label">Tipo de vehículo <span className="text-rose-500">*</span></label>
                        <select className="select-field" value={v.clase} onChange={e => {
                          const arr = [...sim.vehiculos_adicionales];
                          arr[i].clase = e.target.value;
                          arr[i].marca = '';
                          arr[i].modelo = '';
                          arr[i].año = '';
                          setSim(p => ({ ...p, vehiculos_adicionales: arr }));
                        }}>
                          <option value="Automóvil">Automóvil</option>
                          <option value="Camioneta">Camioneta</option>
                          <option value="Motocicleta">Motocicleta</option>
                          <option value="Camión / Carga">Camión / Carga</option>
                        </select>
                      </div>
                      <div>
                        <label className="field-label">Placa <span className="text-rose-500">*</span></label>
                        <input className="input-field font-mono uppercase" placeholder="ABC-123" value={v.placa} maxLength={8}
                          onChange={e => {
                            const arr = [...sim.vehiculos_adicionales];
                            arr[i].placa = e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, '');
                            setSim(p => ({ ...p, vehiculos_adicionales: arr }));
                          }} />
                      </div>
                      <div>
                        <label className="field-label">Marca <span className="text-rose-500">*</span></label>
                        <select className="select-field" value={v.marca} onChange={e => {
                          const arr = [...sim.vehiculos_adicionales];
                          arr[i].marca = e.target.value;
                          arr[i].modelo = '';
                          arr[i].año = '';
                          setSim(p => ({ ...p, vehiculos_adicionales: arr }));
                        }}>
                          <option value="">Seleccione marca...</option>
                          {addMarcasUnicas.map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="field-label">Modelo <span className="text-rose-500">*</span></label>
                        <select className="select-field" value={v.modelo} onChange={e => {
                          const arr = [...sim.vehiculos_adicionales];
                          arr[i].modelo = e.target.value;
                          arr[i].año = '';
                          setSim(p => ({ ...p, vehiculos_adicionales: arr }));
                        }} disabled={!v.marca}>
                          <option value="">Seleccione modelo...</option>
                          {addModelosUnicos.map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="field-label">Año <span className="text-rose-500">*</span></label>
                        <select className="select-field" value={v.año} onChange={e => {
                          const arr = [...sim.vehiculos_adicionales];
                          arr[i].año = e.target.value;
                          setSim(p => ({ ...p, vehiculos_adicionales: arr }));
                        }} disabled={!v.modelo}>
                          <option value="">Seleccione año...</option>
                          {addAños.map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="field-label">Color</label>
                        <input className="input-field" placeholder="Blanco perla" value={v.color}
                          onChange={e => {
                            const arr = [...sim.vehiculos_adicionales];
                            arr[i].color = e.target.value;
                            setSim(p => ({ ...p, vehiculos_adicionales: arr }));
                          }} />
                      </div>
                      <div>
                        <label className="field-label">Valor de mercado <span className="text-rose-500">*</span></label>
                        <input type="number" min="500" step="500" className="input-field" placeholder="15000"
                          value={v.valor} onChange={e => {
                            const arr = [...sim.vehiculos_adicionales];
                            arr[i].valor = parseFloat(e.target.value) || 0;
                            setSim(p => ({ ...p, vehiculos_adicionales: arr }));
                          }} />
                      </div>
                    </div>
                  </div>
                )
              })}

              {(!sim.producto.max_bienes || (sim.vehiculos_adicionales?.length || 0) + 1 < sim.producto.max_bienes) && (
                <button
                  onClick={() => setSim(p => ({
                    ...p,
                    vehiculos_adicionales: [
                      ...(p.vehiculos_adicionales || []),
                      { placa: '', marca: '', modelo: '', año: '', color: '', uso: 'Particular', valor: 15000, clase: 'Automóvil', version: '', puestos: '', serial_carroceria: '', serial_motor: '' }
                    ]
                  }))}
                  className="mt-2 w-full py-2.5 border-2 border-dashed border-slate-200 text-slate-500 font-semibold rounded-2xl hover:border-jm-blue hover:text-jm-blue hover:bg-blue-50 transition-colors flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Añadir otro vehículo
                </button>
              )}
            </div>
          )}
        </>
      ) : preset ? (
        <>
          <SecLabel icon={Package} label={`Datos de: ${preset.label}`} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {preset.campos.map(c => (
              <div key={c.key}>
                <label className="field-label">{c.label}</label>
                {c.type === 'select' ? (
                  <select className="select-field" value={sim.bienCampos[c.key] ?? ''} onChange={e => setCampo(c.key, e.target.value)}>
                    <option value="">— Seleccionar —</option>
                    {c.opciones.map(o => <option key={o}>{o}</option>)}
                  </select>
                ) : (
                  <input
                    type={c.type === 'number' ? 'number' : 'text'}
                    className="input-field"
                    placeholder={c.placeholder || ''}
                    value={sim.bienCampos[c.key] ?? ''}
                    onChange={e => setCampo(c.key, e.target.value)}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="field-label">Nombre del asegurado (si es distinto del tomador)</label>
              <input className="input-field" placeholder="Nombre completo" value={sim.asegurado_nombre}
                onChange={e => setSim(p => ({ ...p, asegurado_nombre: e.target.value }))} />
            </div>
            <div>
              <label className="field-label">Teléfono del asegurado</label>
              <input className="input-field" placeholder="0414-1234567" value={sim.asegurado_telefono}
                onChange={e => setSim(p => ({ ...p, asegurado_telefono: filtrarTelefono(e.target.value) }))} />
            </div>
            <div>
              <label className="field-label">Dirección del asegurado</label>
              <input className="input-field" placeholder="Dirección completa" value={sim.asegurado_direccion}
                onChange={e => setSim(p => ({ ...p, asegurado_direccion: e.target.value }))} />
            </div>
          </div>
        </>
      ) : (
        <>
          <SecLabel icon={User} label="Datos del asegurado" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="field-label">Nombre del asegurado</label>
              <input className="input-field" placeholder="Nombre completo" value={sim.asegurado_nombre}
                onChange={e => setSim(p => ({ ...p, asegurado_nombre: e.target.value }))} />
            </div>
            <div>
              <label className="field-label">Cédula del asegurado</label>
              <input className="input-field font-mono" placeholder="V-12345678" maxLength={12} value={sim.asegurado_ci}
                onChange={e => setSim(p => ({ ...p, asegurado_ci: filtrarCedula(e.target.value) }))} />
            </div>
            <div>
              <label className="field-label">Teléfono del asegurado</label>
              <input className="input-field" placeholder="0414-1234567" value={sim.asegurado_telefono}
                onChange={e => setSim(p => ({ ...p, asegurado_telefono: filtrarTelefono(e.target.value) }))} />
            </div>
            <div>
              <label className="field-label">Dirección del asegurado</label>
              <input className="input-field" placeholder="Dirección completa" value={sim.asegurado_direccion}
                onChange={e => setSim(p => ({ ...p, asegurado_direccion: e.target.value }))} />
            </div>
          </div>
          <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
            <p className="text-xs text-slate-500 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5" />
              Si el asegurado es el mismo tomador, deja estos campos en blanco.
            </p>
          </div>
        </>
      )}

      {tipoBien !== 'ninguno' && (
        <div className="mt-4">
          <label className="field-label">Otros / Observaciones del bien</label>
          <textarea className="input-field resize-none" rows={2} placeholder="Detalles adicionales sobre el bien asegurado…"
            value={sim.bien_observaciones} onChange={e => setSim(p => ({ ...p, bien_observaciones: e.target.value }))} />
          <p className="text-[10px] text-slate-400 mt-1">Aparece en el campo "Otros" del cuadro póliza.</p>
        </div>
      )}
    </SimShell>
  )
}

// ── PASO 4: Tarifario / Plan ──────────────────────────────────────────────────
// `producto` trae la config real de IVA — antes el 16% estaba fijo en el
// código sin importar el producto, así que TODAS las cotizaciones llevaban
// IVA aunque el producto no lo tuviera configurado (o llevaban el % equivocado).
function calcTotal(tarifa, tipoCalculo, valorDeclarado, derecho, producto) {
  if (!tarifa) return { prima: 0, total: 0 }
  const d = tarifa.datos || {}
  let prima = 0

  if (tipoCalculo === 'fijo') {
    prima = parseFloat(d.prima_anual) || 0
  } else if (tipoCalculo === 'por_plan') {
    prima = Object.values(d).reduce((s, v) => {
      if (v && typeof v === 'object' && v.prima) return s + parseFloat(v.prima)
      return s
    }, 0)
  } else if (tipoCalculo === 'por_nivel') {
    prima = parseFloat(d.prima) || 0
  } else if (tipoCalculo === 'por_valor') {
    prima = Math.round(valorDeclarado * (parseFloat(d.tasa_pct) || 0) / 100 * 100) / 100
  }

  const ivaPct = producto?.iva_aplica ? (parseFloat(producto.iva_porcentaje) || 0) : 0
  const iva = Math.round(prima * ivaPct) / 100
  const total = prima + iva + (parseFloat(derecho) || 0)
  return { prima, iva, ivaPct, total }
}

function Step4({ sim, setSim, tasaBcv, tasaEur, onNext, onBack, onClose }) {
  const producto = sim.producto
  const moneda = producto?.moneda || 'USD'
  const tipoCalculo = producto?.tipo_calculo || 'fijo'
  const [tarifas, setTarifas] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!producto?.id) return
    fetchTarifario(producto.id)
      .then(res => setTarifas(res.tarifario.filter(t => t.activo)))
      .catch(() => { })
      .finally(() => setLoading(false))
  }, [producto?.id])

  // Para tipo fijo o por_valor: auto-seleccionar la única tarifa disponible
  // (por_valor necesita su tarifa cargada en `sim.tarifa` para leer tasa_pct;
  // sin esto calcTotal() siempre devuelve 0 sin importar el valor declarado).
  useEffect(() => {
    if ((tipoCalculo === 'fijo' || tipoCalculo === 'por_valor') && tarifas.length >= 1 && !sim.tarifario_id) {
      setSim(p => ({ ...p, tarifario_id: tarifas[0].id, tarifa: tarifas[0] }))
    }
  }, [tarifas, tipoCalculo, sim.tarifario_id, setSim])

  const { prima, iva, ivaPct, total } = calcTotal(sim.tarifa, tipoCalculo, sim.valor_declarado, producto?.derecho_poliza, producto)
  const totBs = convertirMoneda(total, moneda, 'BS', tasaBcv, tasaEur)

  const canNext = tarifas.length > 0 && (tipoCalculo === 'por_valor'
    ? (sim.valor_declarado > 0)
    : !!sim.tarifario_id)

  const renderDatos = (d) => {
    if (tipoCalculo === 'fijo') {
      const filas = [
        d.suma_persona && ['Suma asegurada personas', fmtMonto(d.suma_persona, moneda)],
        d.suma_cosa && ['Suma asegurada cosas', fmtMonto(d.suma_cosa, moneda)],
        d.prima_persona && ['Prima personas', fmtMonto(d.prima_persona, moneda)],
        d.prima_cosa && ['Prima cosas', fmtMonto(d.prima_cosa, moneda)],
      ].filter(Boolean)
      return filas.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 mt-2 text-xs text-slate-500">
          {filas.map(([k, v]) => <><span key={k}>{k}</span><span className="font-semibold text-slate-700">{v}</span></>)}
        </div>
      ) : null
    }
    if (tipoCalculo === 'por_plan') {
      const coberturas = Object.entries(d).filter(([, v]) => v && typeof v === 'object' && v.prima)
      return (
        <div className="mt-2 space-y-1">
          {coberturas.map(([k, v]) => (
            <div key={k} className="flex justify-between text-xs text-slate-500">
              <span className="capitalize">{k.replace(/_/g, ' ')}</span>
              <span className="font-semibold text-slate-700">{fmtMonto(v.prima, moneda)}{v.suma ? <span className="text-slate-400 font-normal"> · suma {fmtMonto(v.suma, moneda)}</span> : ''}</span>
            </div>
          ))}
        </div>
      )
    }
    if (tipoCalculo === 'por_nivel') {
      return (
        <div className="flex justify-between text-xs text-slate-500 mt-2">
          {d.suma && <span>Suma: <strong className="text-slate-700">{fmtMonto(d.suma, moneda)}</strong></span>}
          {d.prima && <span>Prima: <strong className="text-slate-700">{fmtMonto(d.prima, moneda)}</strong></span>}
        </div>
      )
    }
    return null
  }

  // por_valor también depende de una tarifa (tasa_pct) — sin ella la prima
  // siempre calcularía 0, así que se bloquea igual que los demás tipos.
  const sinTarifas = !loading && tarifas.length === 0

  // Panel de resumen financiero (reutilizado en ambas columnas según layout)
  const ResumenFinanciero = () => (
    <div className="rounded-2xl overflow-hidden shrink-0" style={{ background: 'linear-gradient(135deg,#001463,#000c3b)' }}>
      <div className="px-4 py-3 space-y-2 border-b border-white/10">
        <div className="flex justify-between text-xs"><span className="text-white/50">Prima Neta</span><span className="text-white/80 font-semibold">{fmtMonto(prima, moneda)}</span></div>
        {producto?.iva_aplica && (
          <div className="flex justify-between text-xs"><span className="text-white/50">IVA ({ivaPct}%)</span><span className="text-white/80 font-semibold">{fmtMonto(iva || 0, moneda)}</span></div>
        )}
        <div className="flex justify-between text-xs"><span className="text-white/50">Derecho de Póliza</span><span className="text-white/80 font-semibold">{fmtMonto(producto?.derecho_poliza || 0, moneda)}</span></div>
      </div>
      <div className="px-4 py-4">
        <p className="text-xs font-bold text-white/60 mb-0.5">Total Anual ({moneda})</p>
        <p className="text-2xl font-black text-white">{fmtMonto(total, moneda)}</p>
        {moneda !== 'BS' && totBs > 0 && <p className="text-[10px] text-white/40 mt-1.5">Bs. {totBs.toLocaleString('es-VE', { minimumFractionDigits: 2 })} · BCV {fmtTasa(moneda === 'EUR' ? tasaEur : tasaBcv)}</p>}
      </div>
    </div>
  )

  return (
    <SimShell step={4} size="xxl" onClose={onClose} footer={
      <>
        <button onClick={onBack} className="btn-secondary"><ArrowLeft className="w-4 h-4" /> Anterior</button>
        {canNext && (
          <button onClick={onNext} className="btn-primary">Ver Resumen <ArrowRight className="w-4 h-4" /></button>
        )}
      </>
    }>

      {sinTarifas ? (
        <div className="flex flex-col items-center justify-center py-10 text-center gap-3">
          <AlertTriangle className="w-10 h-10 text-amber-400" />
          <p className="font-semibold text-slate-700">Tarifario no configurado</p>
          <p className="text-sm text-slate-400 max-w-sm">
            Este producto aún no tiene tarifas activas. Un administrador debe configurar el tarifario antes de poder cotizar.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_240px] gap-5">

          {/* Izquierda: selector de tarifa / valor */}
          <div>
            {tipoCalculo === 'por_valor' ? (
              <>
                <SecLabel icon={DollarSign} label="Valor declarado del bien" />
                <div className="relative max-w-xs">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold pointer-events-none">$</span>
                  <input type="number" min="1" step="100" className="input-field pl-7"
                    placeholder="0.00"
                    value={sim.valor_declarado || ''} onChange={e => setSim(p => ({ ...p, valor_declarado: parseFloat(e.target.value) || 0 }))} />
                </div>
                {tarifas[0]?.datos?.tasa_pct && (
                  <p className="text-xs text-slate-400 mt-2">Tasa aplicada: {tarifas[0].datos.tasa_pct}% sobre el valor declarado</p>
                )}
              </>
            ) : loading ? (
              <div className="flex justify-center py-12 text-slate-400 text-sm gap-2">
                <div className="w-4 h-4 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
                Cargando planes…
              </div>
            ) : tipoCalculo === 'fijo' ? (
              /* Precio fijo: mostrar info sin picker */
              <>
                <SecLabel icon={Shield} label="Precio fijo del producto" />
                <div className="p-4 rounded-2xl border-2 border-emerald-200 bg-emerald-50/40 flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
                    <Check className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-slate-800">{tarifas[0]?.nombre}</p>
                    {renderDatos(tarifas[0]?.datos || {})}
                  </div>
                </div>
              </>
            ) : (
              /* Por plan o por nivel: mostrar selector */
              <>
                <SecLabel icon={Layers} label={tipoCalculo === 'por_plan' ? 'Selecciona el plan' : 'Selecciona el nivel de cobertura'} />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {tarifas.map(t => {
                    const on = sim.tarifario_id === t.id
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setSim(p => ({ ...p, tarifario_id: t.id, tarifa: t }))}
                        className={`w-full text-left p-4 rounded-2xl border-2 transition-all ${on ? 'border-jm-blue bg-blue-50/50' : 'border-slate-200 hover:border-slate-300'}`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <p className={`text-sm font-bold ${on ? 'text-jm-blue' : 'text-slate-800'}`}>{t.nombre}</p>
                          {on && <Check className="w-4 h-4 text-jm-blue shrink-0" />}
                        </div>
                        {renderDatos(t.datos || {})}
                      </button>
                    )
                  })}
                </div>
              </>
            )}
          </div>

          {/* Derecha: resumen financiero */}
          <ResumenFinanciero />
        </div>
      )}
    </SimShell>
  )
}

// ── PASO 5: Documentos + Confirmar ────────────────────────────────────────────
function Step5({ sim, tasaBcv, tasaEur, editId, onBack, onClose, onSaved, showToast, currentUser }) {
  const isEdit = !!editId
  const prod = sim.producto
  const moneda = prod?.moneda || 'USD'
  const { prima, iva, ivaPct, total } = calcTotal(sim.tarifa, prod?.tipo_calculo, sim.valor_declarado, prod?.derecho_poliza, prod)
  const totBs = convertirMoneda(total, moneda, 'BS', tasaBcv, tasaEur)
  const hoy = new Date()
  const fechaISO = hoy.toISOString().slice(0, 10)
  const fecha = `${String(hoy.getDate()).padStart(2, '0')}/${String(hoy.getMonth() + 1).padStart(2, '0')}/${hoy.getFullYear()}`
  const nroPreview = isEdit
    ? 'COT-' + hoy.getFullYear() + '-' + String(editId).padStart(5, '0')
    : 'COT-' + hoy.getFullYear() + '-XXXXX'

  const [docs, setDocs] = useState([])
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadNombre, setUploadNombre] = useState('')
  const [uploadFile, setUploadFile] = useState(null)
  const [showUpload, setShowUpload] = useState(false)
  const fileRef = useRef(null)

  const loadDocs = useCallback(async () => {
    if (!sim.cliente_id) return
    try { setDocs(await fetchDocumentosCliente(sim.cliente_id)) } catch { }
  }, [sim.cliente_id])

  useEffect(() => { loadDocs() }, [loadDocs])

  const docsRequeridos = prod?.documentos_requeridos || []
  const docsFaltantes = docsRequeridos.filter(dr => dr.obligatorio && !docs.find(d => d.nombre === dr.nombre))

  const handleUpload = async () => {
    if (!uploadFile || !uploadNombre.trim()) return
    setUploading(true)
    try {
      await uploadDocumentoCliente(sim.cliente_id, uploadNombre.trim(), uploadFile)
      setUploadFile(null); setUploadNombre(''); setShowUpload(false)
      fileRef.current && (fileRef.current.value = '')
      await loadDocs()
    } catch (e) {
      showToast(e.message, 'error')
    } finally {
      setUploading(false)
    }
  }

  const handleDeleteDoc = async (doc) => {
    try { await deleteDocumentoCliente(sim.cliente_id, doc.id); await loadDocs() }
    catch (e) { showToast(e.message, 'error') }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const coberturas = {
        // La tasa de la moneda nativa del producto — nunca mezclar USD/EUR.
        tasaBCV: moneda === 'EUR' ? tasaEur : tasaBcv,
        subtotal: prima, iva: iva || 0,
        derecho_poliza: prod?.derecho_poliza || 0,
        total, total_bs: totBs,
        tipo_calculo: prod?.tipo_calculo,
        documentos_requeridos: prod?.documentos_requeridos || [],
        valor_mercado: sim.valor,
        valor_declarado: sim.valor_declarado,
        tarifa: sim.tarifa ? { id: sim.tarifa.id, nombre: sim.tarifa.nombre, datos: sim.tarifa.datos } : null,
        vehiculos_adicionales: sim.vehiculos_adicionales || [],
      }

      // Crear o actualizar el bien_asegurado según el tipo del producto
      let bienId = sim.bien_asegurado_id || null
      const tipoBien = prod?.tipo_bien ?? 'ninguno'
      let bienes_adicionales_ids = []

      if (tipoBien === 'vehiculo' && sim.placa.trim()) {
        const bienData = {
          tipo: 'vehiculo',
          atributos: {
            placa: sim.placa.trim().toUpperCase(),
            marca: sim.marca,
            modelo: sim.modelo,
            anio: sim.año,
            color: sim.color,
            uso: sim.uso,
            valor_mercado: sim.valor,
            clase: sim.clase,
            version: sim.version,
            puestos: sim.puestos,
            serial_carroceria: sim.serial_carroceria,
            serial_motor: sim.serial_motor,
          },
          valor_declarado: sim.valor || null,
          descripcion: `${sim.marca} ${sim.modelo} ${sim.año}`.trim(),
          observaciones: sim.bien_observaciones || null,
        }
        if (bienId) {
          await updateBien(bienId, bienData)
        } else {
          const nuevo = await createBien(bienData)
          bienId = nuevo.id
        }

        // Crear bienes adicionales
        for (const v of (sim.vehiculos_adicionales || [])) {
          if (v.placa?.trim()) {
            const vData = {
              tipo: 'vehiculo',
              atributos: {
                placa: v.placa.trim().toUpperCase(),
                marca: v.marca,
                modelo: v.modelo,
                anio: v.año,
                color: v.color,
                uso: v.uso,
                valor_mercado: v.valor,
                clase: v.clase,
                version: v.version,
                puestos: v.puestos,
                serial_carroceria: v.serial_carroceria,
                serial_motor: v.serial_motor,
              },
              valor_declarado: v.valor || null,
              descripcion: `${v.marca} ${v.modelo} ${v.año}`.trim(),
              observaciones: null,
            }
            const nBien = await createBien(vData)
            bienes_adicionales_ids.push(nBien.id)
          }
        }
        coberturas.bienes_adicionales_ids = bienes_adicionales_ids
      } else if (tipoBien !== 'ninguno') {
        // Productos no vehiculares (inmueble, bicicleta, mascota, etc.)
        // también deben quedar registrados como bien asegurado — antes solo
        // se hacía para vehículos y el resto nunca aparecía en "Bienes".
        const campos = { ...sim.bienCampos }
        if (sim.asegurado_nombre) campos.asegurado_nombre = sim.asegurado_nombre
        if (sim.asegurado_ci) campos.asegurado_ci = sim.asegurado_ci
        const bienData = {
          tipo: tipoBien,
          atributos: Object.keys(campos).length > 0 ? campos : null,
          valor_declarado: sim.valor_declarado || null,
          descripcion: prod?.nombre || tipoBien,
          observaciones: sim.bien_observaciones || null,
        }
        if (bienId) {
          await updateBien(bienId, bienData)
        } else {
          const nuevo = await createBien(bienData)
          bienId = nuevo.id
        }
      }

      const payload = {
        persona_id: sim.cliente_id || null,
        bien_asegurado_id: bienId,
        producto_id: sim.producto_id,
        tarifario_id: sim.tarifario_id || null,
        total, total_bs: totBs,
        fecha_solicitud: fechaISO,
        coberturas,
        nombre_tomador: sim.nombre,
        ci_tomador: sim.ci,
        asegurado_nombre: sim.asegurado_nombre || null,
        asegurado_ci: sim.asegurado_ci || null,
        asegurado_telefono: sim.asegurado_telefono || null,
        asegurado_direccion: sim.asegurado_direccion || null,
      }
      if (isEdit) await updateCotizacion(editId, payload)
      else await createCotizacion(payload)
      showToast(isEdit ? 'Cotización actualizada' : 'Cotización guardada', 'success')
      onSaved(); onClose()
    } catch (e) {
      showToast(e.message || 'Error al guardar', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <SimShell step={5} size="xxl" onClose={onClose} footer={
      <>
        <button onClick={onBack} className="btn-secondary"><ArrowLeft className="w-4 h-4" /> Anterior</button>
        <button onClick={handleSave} disabled={saving} className="btn-primary disabled:opacity-50">
          <FileCheck className="w-4 h-4" />
          {saving ? 'Enviando…' : isEdit ? 'Actualizar Cotización' : 'Enviar Cotización'}
        </button>
      </>
    }>
      <div className="grid grid-cols-1 md:grid-cols-[1fr_240px] gap-5">
        {/* Izquierda */}
        <div className="space-y-3">
          {/* Banner */}
          <div className={`flex items-center gap-3 p-3 rounded-2xl border ${isEdit ? 'border-blue-200 bg-blue-50' : 'border-emerald-200 bg-emerald-50'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isEdit ? 'bg-blue-500' : 'bg-emerald-500'}`}>
              {isEdit ? <Pencil className="w-3.5 h-3.5 text-white" /> : <Check className="w-3.5 h-3.5 text-white" />}
            </div>
            <div>
              <p className={`text-sm font-black ${isEdit ? 'text-blue-800' : 'text-emerald-800'}`}>
                {isEdit ? `Editando ${nroPreview}` : 'Revisión final'}
              </p>
              <p className={`text-xs ${isEdit ? 'text-blue-500' : 'text-emerald-600'}`}>
                {isEdit ? 'Los cambios reemplazarán la cotización existente.' : 'Se guardará con estado "En Revisión" para revisión.'}
              </p>
            </div>
          </div>

          {/* Datos resumen */}
          <div className="rounded-xl border border-slate-100 overflow-hidden">
            <div className="px-3 py-2 bg-slate-50 border-b border-slate-100 flex items-center gap-2">
              <Shield className="w-3.5 h-3.5 text-slate-400" />
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Producto / Tarifa</p>
            </div>
            <div className="px-3 py-2.5 space-y-1 text-sm">
              <div className="flex justify-between"><span className="text-slate-400">Producto</span><span className="font-semibold text-slate-700">{prod?.nombre || '—'}</span></div>
              {sim.tarifa && <div className="flex justify-between"><span className="text-slate-400">Plan / Tarifa</span><span className="font-semibold text-slate-700">{sim.tarifa.nombre}</span></div>}
              <div className="flex justify-between"><span className="text-slate-400">Tomador</span><span className="font-semibold text-slate-700">{sim.nombre || '—'} · {sim.ci || '—'}</span></div>
              {sim.placa && <div className="flex justify-between"><span className="text-slate-400">Placa / Bien</span><span className="font-mono font-bold text-slate-700">{sim.placa}</span></div>}
              {sim.modelo && <div className="flex justify-between"><span className="text-slate-400">Vehículo</span><span className="text-slate-700">{sim.marca} {sim.modelo} {sim.año}</span></div>}
              {sim.asegurado_nombre && <div className="flex justify-between"><span className="text-slate-400">Asegurado</span><span className="text-slate-700">{sim.asegurado_nombre}</span></div>}
            </div>
          </div>

          {/* Documentos */}
          <div className="rounded-xl border border-slate-100 overflow-hidden">
            <div className="px-3 py-2 bg-slate-50 border-b border-slate-100 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <FileText className="w-3.5 h-3.5 text-slate-400" />
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Documentos del cliente</p>
              </div>
              <button onClick={() => setShowUpload(v => !v)} className="text-xs font-bold text-jm-blue hover:underline flex items-center gap-1">
                <Upload className="w-3 h-3" /> Subir
              </button>
            </div>

            {/* Alertas faltantes */}
            {docsFaltantes.length > 0 && (
              <div className="px-3 py-2 bg-amber-50 border-b border-amber-100">
                <p className="text-xs font-bold text-amber-700 flex items-center gap-1.5 mb-1">
                  <AlertTriangle className="w-3.5 h-3.5" /> Documentos obligatorios faltantes
                </p>
                <div className="flex flex-wrap gap-1">
                  {docsFaltantes.map(d => (
                    <span key={d.nombre} className="text-[10px] px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full font-medium">{d.nombre}</span>
                  ))}
                </div>
              </div>
            )}

            {showUpload && (
              <div className="px-3 py-3 bg-slate-50 border-b border-slate-100 space-y-2">
                <select
                  className="select-field text-sm"
                  value={uploadNombre}
                  onChange={e => setUploadNombre(e.target.value)}
                >
                  <option value="">— Tipo de documento —</option>
                  {docsRequeridos.map(d => <option key={d.nombre} value={d.nombre}>{d.nombre}</option>)}
                  <option value="__custom__">Otro…</option>
                </select>
                {uploadNombre === '__custom__' && (
                  <input className="input-field text-sm" placeholder="Nombre del documento" onChange={e => setUploadNombre(e.target.value)} />
                )}
                <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" className="text-xs text-slate-600"
                  onChange={e => setUploadFile(e.target.files[0] || null)} />
                <button onClick={handleUpload} disabled={uploading || !uploadFile || !uploadNombre || uploadNombre === '__custom__'} className="btn-primary w-full justify-center text-xs disabled:opacity-50">
                  {uploading ? 'Subiendo…' : <><Upload className="w-3.5 h-3.5" /> Subir documento</>}
                </button>
              </div>
            )}

            <div className="px-3 py-2.5 space-y-1.5">
              {docs.length === 0 ? (
                <p className="text-xs text-slate-400 py-2 text-center">Sin documentos subidos aún.</p>
              ) : docs.map(d => (
                <div key={d.id} className="flex items-center gap-2">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <a href={d.url} target="_blank" rel="noreferrer" className="text-xs text-jm-blue hover:underline truncate flex-1">{d.nombre}</a>
                  <button onClick={() => handleDeleteDoc(d)} className="p-1 hover:bg-rose-50 rounded-lg transition" title="Eliminar documento">
                    <X className="w-3 h-3 text-rose-400" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Derecha: financiero */}
        <div>
          <div className="rounded-2xl overflow-hidden" style={{ background: 'linear-gradient(135deg,#001463,#000c3b)' }}>
            <div className="px-4 py-3.5 space-y-2 border-b border-white/10">
              <p className="text-xs font-bold text-white/40 uppercase tracking-widest mb-2">Resumen financiero</p>
              <div className="flex justify-between text-sm"><span className="text-white/50">Prima Neta</span><span className="text-white/80 font-semibold">{fmtMonto(prima, moneda)}</span></div>
              {prod?.iva_aplica && (
                <div className="flex justify-between text-sm"><span className="text-white/50">IVA ({ivaPct}%)</span><span className="text-white/80 font-semibold">{fmtMonto(iva || 0, moneda)}</span></div>
              )}
              <div className="flex justify-between text-sm"><span className="text-white/50">Derecho de Póliza</span><span className="text-white/80 font-semibold">{fmtMonto(prod?.derecho_poliza || 0, moneda)}</span></div>
            </div>
            <div className="px-4 py-4">
              <p className="text-sm font-bold text-white/60 mb-1">Total Prima Anual ({moneda})</p>
              <p className="text-3xl font-black text-white">{fmtMonto(total, moneda)}</p>
              {moneda !== 'BS' && totBs > 0 && (
                <p className="text-xs text-white/35 mt-1.5">
                  Bs. {totBs.toLocaleString('es-VE', { minimumFractionDigits: 2 })}<br />
                  Tasa BCV {fmtTasa(moneda === 'EUR' ? tasaEur : tasaBcv)}
                </p>
              )}
            </div>
            {currentUser && (
              <div className="px-4 pb-4 border-t border-white/10 pt-3">
                <p className="text-xs text-white/30">Agente: <span className="text-white/50 font-semibold">{currentUser.nombre}</span></p>
                <p className="text-xs text-white/30 font-mono mt-0.5">{fecha}</p>
              </div>
            )}
          </div>
          {docsFaltantes.length > 0 && (
            <div className="mt-3 p-3 bg-amber-50 rounded-xl border border-amber-200 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700">
                La cotización puede enviarse aunque falten documentos. El operador verá la alerta al revisarla.
              </p>
            </div>
          )}
        </div>
      </div>
    </SimShell>
  )
}

// ── Modal: Evaluación de Underwriting ────────────────────────────────────────
const UW_RESULTADO_META = {
  pendiente: { label: 'Pendiente', bg: 'bg-slate-100', text: 'text-slate-600' },
  aprobado: { label: 'Aprobado', bg: 'bg-emerald-100', text: 'text-emerald-700' },
  rechazado: { label: 'Rechazado', bg: 'bg-rose-100', text: 'text-rose-700' },
  observado: { label: 'Observado', bg: 'bg-amber-100', text: 'text-amber-700' },
}

// Opciones de resultado como tarjetas seleccionables (mejor que un <select>)
const UW_RESULTADO_OPTS = [
  {
    value: 'observado', label: 'Observado', desc: 'Requiere más info', icon: Clock,
    base: 'border-amber-200 hover:border-amber-300', active: 'border-amber-400 bg-amber-50 ring-2 ring-amber-100', iconCls: 'text-amber-500',
  },
  {
    value: 'aprobado', label: 'Aprobado', desc: 'Queda aprobada', icon: CheckCircle,
    base: 'border-emerald-200 hover:border-emerald-300', active: 'border-emerald-400 bg-emerald-50 ring-2 ring-emerald-100', iconCls: 'text-emerald-500',
  },
  {
    value: 'rechazado', label: 'Rechazado', desc: 'Queda rechazada', icon: XCircle,
    base: 'border-rose-200 hover:border-rose-300', active: 'border-rose-400 bg-rose-50 ring-2 ring-rose-100', iconCls: 'text-rose-500',
  },
]

// Etiqueta de nivel de riesgo según el score (0–100)
function uwRiskLabel(score) {
  if (score === '' || score == null || isNaN(score)) return null
  const n = Number(score)
  if (n <= 33) return { t: 'Riesgo bajo', c: 'text-emerald-600' }
  if (n <= 66) return { t: 'Riesgo medio', c: 'text-amber-600' }
  return { t: 'Riesgo alto', c: 'text-rose-600' }
}

function UwBadge({ resultado }) {
  const m = UW_RESULTADO_META[resultado] ?? UW_RESULTADO_META.pendiente
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${m.bg} ${m.text}`}>
      {m.label}
    </span>
  )
}

function freshUwForm() {
  return { resultado: 'pendiente', score: '', observaciones: '', motivo_rechazo: '', requiere_inspeccion: false }
}

function UnderwritingModal({ cot, productos = [], onClose, onStatusChanged, showToast }) {
  const panelRef = useRef(null)
  useModalLock(panelRef)
  useInputLimits(panelRef)
  const [evaluaciones, setEvaluaciones] = useState([])
  const [loading, setLoading] = useState(true)
  const [docs, setDocs] = useState([])
  const [loadingDocs, setLoadingDocs] = useState(true)
  const [form, setForm] = useState(freshUwForm())
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')
  const setF = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const load = useCallback(async () => {
    setLoading(true)
    try { setEvaluaciones(await fetchUnderwriting(cot.id)) }
    catch { }
    finally { setLoading(false) }
  }, [cot.id])

  useEffect(() => { load() }, [load])

  // Documentos del cliente asociados a la cotización/emisión
  useEffect(() => {
    if (!cot.persona_id) { setDocs([]); setLoadingDocs(false); return }
    let alive = true
    setLoadingDocs(true)
    fetchDocumentosCliente(cot.persona_id)
      .then(d => { if (alive) setDocs(Array.isArray(d) ? d : []) })
      .catch(() => { if (alive) setDocs([]) })
      .finally(() => { if (alive) setLoadingDocs(false) })
    return () => { alive = false }
  }, [cot.persona_id])

  // Requerimientos del producto: snapshot de la cotización o catálogo de productos
  const required = useMemo(() => {
    const fromSnap = cot.coberturas?.documentos_requeridos
    const fromProd = productos.find(p => p.id === cot.producto_id)?.documentos_requeridos
    return (fromSnap?.length ? fromSnap : fromProd) || []
  }, [cot.coberturas, cot.producto_id, productos])

  const uploadedByName = useMemo(
    () => new Map(docs.map(d => [String(d.nombre).toLowerCase(), d])),
    [docs]
  )
  const requiredNames = useMemo(
    () => new Set(required.map(r => String(r.nombre).toLowerCase())),
    [required]
  )
  const missingObligatory = required.filter(
    r => r.obligatorio && !uploadedByName.has(String(r.nombre).toLowerCase())
  )
  const presentReqCount = required.filter(
    r => uploadedByName.has(String(r.nombre).toLowerCase())
  ).length
  const extraDocs = docs.filter(d => !requiredNames.has(String(d.nombre).toLowerCase()))
  const riesgo = uwRiskLabel(form.score)

  const handleSubmit = async () => {
    if (!form.resultado || form.resultado === 'pendiente') {
      setErr('Selecciona un resultado distinto de "Pendiente" para registrar la evaluación.')
      return
    }
    setSaving(true); setErr('')
    try {
      const payload = {
        resultado: form.resultado,
        observaciones: form.observaciones.trim() || undefined,
        motivo_rechazo: form.resultado === 'rechazado' ? (form.motivo_rechazo.trim() || undefined) : undefined,
        requiere_inspeccion: form.requiere_inspeccion,
        score: form.score !== '' ? parseFloat(form.score) : undefined,
      }
      await createUnderwriting(cot.id, payload)
      showToast('Evaluación registrada correctamente', 'success')
      setForm(freshUwForm())
      await load()
      if (form.resultado === 'aprobado' || form.resultado === 'rechazado') onStatusChanged()
    } catch (e) {
      setErr(e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center p-4 backdrop-blur-sm">
      <div ref={panelRef} tabIndex={-1} className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in duration-200 outline-none">

        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl flex items-center justify-center shrink-0" style={{ background: 'linear-gradient(135deg,#001463,#000c3b)' }}>
              <ClipboardList className="w-4.5 h-4.5 text-white" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Underwriting</p>
              <h3 className="text-sm font-black text-slate-800">{cot.nro} — {cot.nombre}</h3>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge status={cot.status} />
            <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-xl transition">
              <X className="w-4 h-4 text-slate-500" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-[1fr_340px] divide-y md:divide-y-0 md:divide-x divide-slate-100">

          {/* Izquierda: formulario nueva evaluación */}
          <div className="p-6 space-y-5">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-xl bg-jm-blue/10 text-jm-blue flex items-center justify-center shrink-0">
                <ClipboardList className="w-3.5 h-3.5" />
              </span>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Nueva evaluación</p>
            </div>

            {err && (
              <p className="flex items-start gap-2 text-xs text-rose-600 bg-rose-50 border border-rose-100 rounded-xl px-3 py-2">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />{err}
              </p>
            )}

            {/* Resultado — tarjetas seleccionables */}
            <div>
              <label className="field-label">Resultado <span className="text-rose-500">*</span></label>
              <div className="grid grid-cols-3 gap-2">
                {UW_RESULTADO_OPTS.map(o => {
                  const active = form.resultado === o.value
                  const Icon = o.icon
                  return (
                    <button
                      type="button" key={o.value} onClick={() => setF('resultado', o.value)}
                      className={`flex flex-col items-center gap-1 px-2 py-3 rounded-2xl border-2 text-center transition ${active ? o.active : `bg-white ${o.base}`}`}
                    >
                      <Icon className={`w-5 h-5 ${active ? o.iconCls : 'text-slate-300'}`} />
                      <span className="text-xs font-bold text-slate-700">{o.label}</span>
                      <span className="text-[10px] text-slate-400 leading-tight">{o.desc}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Score + inspección */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="field-label">Score de riesgo (0–100)</label>
                <input type="number" min="0" max="100" step="1" className="input-field"
                  placeholder="—" value={form.score}
                  onChange={e => setF('score', e.target.value)} />
                {riesgo && <p className={`text-[10px] font-bold mt-1 ${riesgo.c}`}>{riesgo.t}</p>}
              </div>
              <button
                type="button"
                onClick={() => setF('requiere_inspeccion', !form.requiere_inspeccion)}
                className={`flex items-center gap-2.5 p-3 rounded-2xl border-2 transition text-left self-start ${form.requiere_inspeccion ? 'border-orange-300 bg-orange-50' : 'border-slate-200 bg-white hover:border-slate-300'}`}
              >
                <span className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${form.requiere_inspeccion ? 'bg-orange-100 text-orange-600' : 'bg-slate-100 text-slate-400'}`}>
                  <Search className="w-4 h-4" />
                </span>
                <span className="min-w-0">
                  <span className="block text-xs font-bold text-slate-700">Requiere inspección</span>
                  <span className="block text-[10px] text-slate-400">{form.requiere_inspeccion ? 'Sí, agendar inspección' : 'No es necesaria'}</span>
                </span>
              </button>
            </div>

            {/* Observaciones */}
            <div>
              <label className="field-label">Observaciones</label>
              <textarea className="input-field resize-none text-sm normal-case" rows={3}
                placeholder="Notas del evaluador…"
                value={form.observaciones} onChange={e => setF('observaciones', e.target.value)} />
            </div>

            {form.resultado === 'rechazado' && (
              <div>
                <label className="field-label">Motivo de rechazo <span className="text-rose-500">*</span></label>
                <textarea className="input-field resize-none text-sm normal-case border-rose-200 focus:ring-rose-300" rows={2}
                  placeholder="Motivo formal del rechazo…"
                  value={form.motivo_rechazo} onChange={e => setF('motivo_rechazo', e.target.value)} />
              </div>
            )}

            {(form.resultado === 'aprobado' || form.resultado === 'rechazado') && (
              <div className={`flex items-start gap-2 p-3 rounded-xl text-xs border ${form.resultado === 'aprobado' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-rose-50 border-rose-200 text-rose-700'}`}>
                <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                {form.resultado === 'aprobado'
                  ? 'La cotización pasará automáticamente a estado "Aprobado".'
                  : 'La cotización pasará automáticamente a estado "Rechazado".'}
              </div>
            )}

            {/* Aviso de documentos obligatorios pendientes, junto a la acción */}
            {!loadingDocs && missingObligatory.length > 0 && (
              <div className="flex items-start gap-2 p-3 rounded-xl text-xs border bg-amber-50 border-amber-200 text-amber-700">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span>
                  Faltan <strong>{missingObligatory.length}</strong> documento{missingObligatory.length !== 1 ? 's' : ''} obligatorio{missingObligatory.length !== 1 ? 's' : ''} del cliente
                  {form.resultado === 'aprobado' ? ' — revísalos antes de aprobar.' : '.'}
                </span>
              </div>
            )}

            <button onClick={handleSubmit} disabled={saving} className="btn-primary w-full justify-center disabled:opacity-50">
              {saving ? 'Guardando…' : <><ClipboardList className="w-4 h-4" /> Registrar evaluación</>}
            </button>
          </div>

          {/* Derecha: documentos de la emisión + historial */}
          <div className="p-6 space-y-6">

            {/* Documentos asociados al cliente / emisión */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-1.5">
                  <FolderOpen className="w-3.5 h-3.5 text-slate-400" />
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Documentos</p>
                </div>
                {required.length > 0 && (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${missingObligatory.length ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-700'}`}>
                    {presentReqCount}/{required.length}
                  </span>
                )}
              </div>

              {loadingDocs ? (
                <div className="flex justify-center py-6">
                  <div className="w-5 h-5 border-2 border-slate-300 border-t-jm-blue rounded-full animate-spin" />
                </div>
              ) : !cot.persona_id ? (
                <div className="text-center py-6 text-slate-400">
                  <FolderOpen className="w-7 h-7 mx-auto mb-2 opacity-30" />
                  <p className="text-xs">Cliente no registrado — sin documentos asociados.</p>
                </div>
              ) : required.length === 0 && docs.length === 0 ? (
                <div className="text-center py-6 text-slate-400">
                  <FileText className="w-7 h-7 mx-auto mb-2 opacity-30" />
                  <p className="text-xs">Este producto no exige documentos.</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {/* Resumen de faltantes */}
                  {missingObligatory.length > 0 ? (
                    <div className="flex items-start gap-2 p-2.5 rounded-xl bg-rose-50 border border-rose-200">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                      <p className="text-[11px] font-semibold text-rose-700 leading-snug">
                        {missingObligatory.length} obligatorio{missingObligatory.length !== 1 ? 's' : ''} pendiente{missingObligatory.length !== 1 ? 's' : ''}: {missingObligatory.map(d => d.nombre).join(' · ')}
                      </p>
                    </div>
                  ) : required.length > 0 ? (
                    <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <p className="text-[11px] font-semibold text-emerald-700">Documentación obligatoria completa.</p>
                    </div>
                  ) : null}

                  {/* Checklist de documentos requeridos */}
                  {required.map(r => {
                    const up = uploadedByName.get(String(r.nombre).toLowerCase())
                    const present = !!up
                    return (
                      <div key={r.nombre} className={`flex items-center gap-2 px-2.5 py-2 rounded-xl border ${present ? 'bg-emerald-50/60 border-emerald-100' : r.obligatorio ? 'bg-rose-50/60 border-rose-100' : 'bg-slate-50 border-slate-100'}`}>
                        {present
                          ? <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                          : r.obligatorio
                            ? <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                            : <Clock className="w-4 h-4 text-slate-300 shrink-0" />}
                        <span className={`flex-1 min-w-0 text-[11px] font-medium truncate ${present ? 'text-emerald-700' : r.obligatorio ? 'text-rose-700' : 'text-slate-500'}`}>
                          {r.nombre}
                          {r.obligatorio && <span className="text-[8px] font-bold ml-1 align-middle opacity-60">OBL</span>}
                        </span>
                        {present ? (
                          <a href={up.url} target="_blank" rel="noopener noreferrer" title="Ver documento"
                            className="p-1.5 rounded-lg text-indigo-500 hover:bg-indigo-50 transition shrink-0">
                            <Eye className="w-3.5 h-3.5" />
                          </a>
                        ) : (
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0 whitespace-nowrap ${r.obligatorio ? 'bg-rose-100 text-rose-600' : 'bg-slate-100 text-slate-400'}`}>
                            {r.obligatorio ? 'Falta' : 'Opcional'}
                          </span>
                        )}
                      </div>
                    )
                  })}

                  {/* Otros documentos cargados (no exigidos por el producto) */}
                  {extraDocs.length > 0 && (
                    <div className="pt-1">
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Otros cargados</p>
                      <div className="space-y-1.5">
                        {extraDocs.map(d => (
                          <div key={d.id} className="flex items-center gap-2 px-2.5 py-2 rounded-xl border border-slate-100 bg-slate-50">
                            <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="flex-1 min-w-0 text-[11px] font-medium text-slate-600 truncate">{d.nombre}</span>
                            <a href={d.url} target="_blank" rel="noopener noreferrer" title="Ver documento"
                              className="p-1.5 rounded-lg text-indigo-500 hover:bg-indigo-50 transition shrink-0">
                              <Eye className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Historial de evaluaciones */}
            <div className="pt-5 border-t border-slate-100">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">
              Historial ({evaluaciones.length})
            </p>
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="w-5 h-5 border-2 border-slate-300 border-t-jm-blue rounded-full animate-spin" />
              </div>
            ) : evaluaciones.length === 0 ? (
              <div className="text-center py-10 text-slate-400">
                <ClipboardList className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Sin evaluaciones aún.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {evaluaciones.map(ev => (
                  <div key={ev.id} className="p-3.5 rounded-2xl border border-slate-200 bg-white">
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <UwBadge resultado={ev.resultado} />
                        {ev.score != null && (
                          <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                            <Star className="w-3 h-3" />{ev.score}/100
                          </span>
                        )}
                        {ev.requiere_inspeccion && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-700">Inspección</span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono shrink-0">{ev.fecha_evaluacion?.slice(0, 10)}</span>
                    </div>
                    {ev.evaluador && <p className="text-[10px] text-slate-400">Evaluador: <span className="font-semibold text-slate-600">{ev.evaluador}</span></p>}
                    {ev.observaciones && <p className="text-xs text-slate-600 mt-1.5 leading-relaxed line-clamp-3">{ev.observaciones}</p>}
                    {ev.motivo_rechazo && (
                      <div className="mt-1.5 p-2 bg-rose-50 rounded-lg border border-rose-100">
                        <p className="text-[10px] font-bold text-rose-600 mb-0.5">Motivo rechazo</p>
                        <p className="text-xs text-rose-700 line-clamp-2">{ev.motivo_rechazo}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Página principal ──────────────────────────────────────────────────────────
export default function Simulador() {
  const { showToast, showModal, currentUser, canAct } = useApp()
  const canCreate = canAct('cotizaciones', 'create')
  const canEdit = canAct('cotizaciones', 'edit')
  const canDelete = canAct('cotizaciones', 'delete')
  const canEmit = canAct('cotizaciones', 'emit')
  const canAdjust = canAct('clientes', 'adjust')
  const canUnderwrite = canAct('cotizaciones', 'underwrite')
  const canViewList = canAct('cotizaciones', 'view_list')
  const hasAnyAction = canEdit || canEmit || canDelete || canAdjust || canUnderwrite

  const [sim, setSim] = useState(freshState())
  const [step, setStep] = useState(0)
  const [editId, setEditId] = useState(null)
  const [tasaBcv, setTasaBcv] = useState(null)
  const [tasaEur, setTasaEur] = useState(null)
  const [productos, setProductos] = useState([])
  const [vehiculosCatalogo, setVehiculosCatalogo] = useState([])

  const [cotizaciones, setCotizaciones] = useState([])
  const [loadingCot, setLoadingCot] = useState(true)
  const [chipActive, setChipActive] = useState(0)
  const [search, setSearch] = useState('')
  const [uwModal, setUwModal] = useState(null) // cotización para underwriting
  const [cotPage, setCotPage] = useState(0)
  const [cotPageSize, setCotPageSize] = useState(20)

  const loadData = useCallback(async () => {
    setLoadingCot(true)
    try {
      const [tasas, cots, prods, vehs] = await Promise.all([
        fetchTasas(),
        fetchCotizaciones(),
        fetchProductos(),
        fetchVehiculosCatalogo()
      ])
      if (tasas?.usd?.valor) setTasaBcv(parseFloat(tasas.usd.valor))
      if (tasas?.eur?.valor) setTasaEur(parseFloat(tasas.eur.valor))
      setCotizaciones(cots)
      setProductos(prods)
      setVehiculosCatalogo(vehs)
    } catch {
      showToast('Error al cargar datos del simulador', 'error')
    } finally {
      setLoadingCot(false)
    }
  }, [showToast])

  useEffect(() => { loadData() }, [loadData])

  const openSim = () => {
    setSim(freshState()); setEditId(null); setStep(1)
  }

  const openEditSim = (q) => {
    const state = simFromCot(q)
    // Reinyectar el objeto producto completo
    const prod = productos.find(p => p.id === q.producto_id) || null
    setSim({ ...state, producto: prod }); setEditId(q.id); setStep(1)
  }

  const closeStep = () => { setStep(0); setEditId(null) }

  const statuses = ['Todos', 'en_revision', 'aprobado', 'emitida', 'rechazado']
  const statusLabels = ['Todos', 'En Revisión', 'Aprobado', 'Emitida', 'Rechazado']

  const byChip = chipActive === 0 ? cotizaciones : cotizaciones.filter(q => q.status === statuses[chipActive])
  const visibleCots = search.trim()
    ? byChip.filter(q => {
      const sq = search.toLowerCase()
      const placaRef = q.bien_atributos?.placa || q.bien_atributos?.descripcion || ''
      return q.nombre.toLowerCase().includes(sq) || q.ci.toLowerCase().includes(sq)
        || placaRef.toLowerCase().includes(sq) || q.nro.toLowerCase().includes(sq)
    })
    : byChip

  const cotTotalPages = Math.max(1, Math.ceil(visibleCots.length / cotPageSize))
  const cotSafePage = Math.min(cotPage, cotTotalPages - 1)
  const cotStart = cotSafePage * cotPageSize
  const pagedCots = visibleCots.slice(cotStart, cotStart + cotPageSize)

  const simEmitidas = cotizaciones.filter(q => q.status === 'emitida').length
  const simEnRevision = cotizaciones.filter(q => q.status === 'en_revision').length
  const simRechazadas = cotizaciones.filter(q => q.status === 'rechazado').length

  const handleDelete = (id, nro) =>
    showModal('confirmDelete', {
      name: `Cotización ${nro}`,
      onConfirm: async () => {
        await deleteCotizacion(id)
        loadData()
      },
    })

  if (!canAct('cotizaciones', 'view')) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
        <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center">
          <Calculator className="w-6 h-6 text-slate-400" />
        </div>
        <p className="font-semibold text-slate-600">Sin acceso</p>
        <p className="text-xs text-slate-400">No tienes permiso para acceder a este módulo.</p>
      </div>
    )
  }

  return (
    <div className="animate-in fade-in duration-500 space-y-5">

      {/* Hero */}
      <div className="relative rounded-[2rem] overflow-hidden" style={{ background: 'linear-gradient(135deg,#001463 0%,#000c3b 55%,#001a6e 100%)' }}>
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 75% 40%,rgba(99,140,255,0.2) 0%,transparent 60%)' }} />
        <div className="relative flex flex-col sm:flex-row sm:items-center gap-6 p-6 sm:p-9">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl sm:text-3xl font-black text-white leading-snug mb-1.5">
              COTIZADOR/<br /><span className="text-emerald-400">EMISION</span>
            </h2>
            {tasaBcv && (
              <p className="text-xs text-white/40 mt-2">
                <DollarSign className="w-3 h-3 inline mr-1" />
                Tasa BCV hoy: <strong className="text-white/60">Bs. {fmtTasa(tasaBcv)}</strong>
              </p>
            )}
          </div>
          {canCreate && (
            <div className="shrink-0">
              <button onClick={openSim} className="flex items-center gap-2.5 bg-white text-jm-blue text-sm font-black px-7 py-4 rounded-2xl hover:bg-blue-50 transition-all shadow-xl shadow-black/25 group">
                <Calculator className="w-5 h-5 group-hover:scale-110 transition-transform" />
                EMITIR
              </button>
            </div>
          )}
        </div>
        <div className="grid grid-cols-3 border-t border-white/10">
          {[
            [`${productos.length} producto${productos.length !== 1 ? 's' : ''}`, 'disponibles', ShieldCheck],
            ['5 pasos', 'wizard dinámico', CheckCircle],
            ['Bs. en tiempo real', 'Tasa BCV hoy', DollarSign],
          ].map(([val, label, Icon]) => (
            <div key={val} className="flex flex-col sm:flex-row items-center sm:gap-2 gap-1 px-4 py-3 text-center sm:text-left">
              <Icon className="w-3.5 h-3.5 text-white/35 shrink-0" />
              <div className="min-w-0">
                <p className="text-xs font-bold text-white/65 truncate">{val}</p>
                <p className="text-[10px] text-white/30">{label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { l: 'Total Simulaciones', v: cotizaciones.length, sub: 'Registradas', Icon: Calculator, bg: 'bg-slate-100', ic: 'text-slate-600' },
          { l: 'Emitidas', v: simEmitidas, sub: 'Pólizas generadas', Icon: FileCheck, bg: 'bg-emerald-100', ic: 'text-emerald-600' },
          { l: 'En Revisión', v: simEnRevision, sub: 'Pendientes', Icon: Clock, bg: 'bg-amber-100', ic: 'text-amber-600' },
          { l: 'Rechazadas', v: simRechazadas, sub: 'Sin aprobación', Icon: XCircle, bg: 'bg-rose-100', ic: 'text-rose-600' },
        ].map(({ l, v, sub, Icon, bg, ic }) => (
          <div key={l} className="card p-4 flex items-start gap-3">
            <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center shrink-0`}>
              <Icon className={`w-4 h-4 ${ic}`} />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-slate-500 font-medium leading-tight">{l}</p>
              <p className="text-xl font-black text-slate-800 mt-0.5 leading-none">{v}</p>
              <p className="text-xs text-slate-400 mt-1">{sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabla de cotizaciones */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-3 px-1 sm:px-0">
          <div className="min-w-0">
            <h3 className="text-base font-black text-slate-800">Cotizaciones registradas</h3>
            <p className="text-xs text-slate-400">{cotizaciones.length} registros</p>
          </div>
          {canViewList && (
            <div className="relative ml-auto w-full sm:w-56">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
              <input className="input-field pl-9 py-2 text-sm w-full" placeholder="Buscar…" value={search} onChange={e => setSearch(e.target.value)} />
              {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"><X className="w-3.5 h-3.5" /></button>}
            </div>
          )}
        </div>

        {!canViewList ? (
          <div className="card flex flex-col items-center justify-center py-16 gap-2 text-center">
            <ClipboardList className="w-6 h-6 text-slate-300" />
            <p className="text-xs text-slate-400">No tienes permiso para ver el listado de cotizaciones.</p>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap gap-2 px-1 sm:px-0">
              {statuses.map((s, i) => {
                const count = i === 0 ? cotizaciones.length : cotizaciones.filter(q => q.status === s).length
                return (
                  <button key={s} onClick={() => setChipActive(i)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${i === chipActive ? 'bg-jm-blue text-white border-jm-blue shadow-sm' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'}`}>
                    {statusLabels[i]}
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${i === chipActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>{count}</span>
                  </button>
                )
              })}
            </div>

            <div className="card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-100">
                    <tr>
                      <th className="th-cell text-left hidden md:table-cell">N° Cotización</th>
                      <th className="th-cell text-left">Cliente</th>
                      <th className="th-cell text-left hidden sm:table-cell">Vendedor</th>
                      <th className="th-cell text-left hidden xl:table-cell">Producto</th>
                      <th className="th-cell text-right hidden sm:table-cell">Total USD</th>
                      <th className="th-cell text-left hidden lg:table-cell">Fecha</th>
                      <th className="th-cell text-left">Estado</th>
                      {hasAnyAction && <th className="th-cell text-center">Acciones</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {loadingCot ? (
                      <tr><td colSpan={hasAnyAction ? 8 : 7} className="td-cell text-center py-10 text-slate-400">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-4 h-4 border-2 border-slate-300 border-t-jm-blue rounded-full animate-spin" />
                          Cargando cotizaciones…
                        </div>
                      </td></tr>
                    ) : visibleCots.length === 0 ? (
                      <tr><td colSpan={hasAnyAction ? 8 : 7} className="td-cell text-center py-10 text-slate-400">
                        {search ? `Sin resultados para "${search}"` : 'No hay cotizaciones registradas.'}
                      </td></tr>
                    ) : pagedCots.map(q => (
                      <tr key={q.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="td-cell hidden md:table-cell"><span className="font-mono font-bold text-xs sm:text-sm text-slate-700">{q.nro}</span></td>
                        <td className="td-cell">
                          <p className="text-xs sm:text-sm font-semibold text-slate-800">{q.nombre}</p>
                          <p className="text-xs sm:text-sm text-slate-400 font-mono">{q.ci}</p>
                          <p className="text-xs sm:text-sm font-mono font-bold text-slate-500 md:hidden mt-0.5">{q.nro}</p>
                        </td>
                        <td className="td-cell text-xs sm:text-sm text-slate-600 hidden sm:table-cell">
                          {q.vendedor_nombre || '—'}
                        </td>
                        <td className="td-cell text-xs sm:text-sm text-slate-600 hidden xl:table-cell">{q.producto || '—'}</td>
                        <td className="td-cell text-right font-bold text-xs sm:text-sm text-slate-800 hidden sm:table-cell">{fmtMonto(q.total, q.moneda_producto)}</td>
                        <td className="td-cell text-xs sm:text-sm text-slate-500 hidden lg:table-cell">{q.fecha}</td>
                        <td className="td-cell"><StatusBadge status={q.status} /></td>
                        {hasAnyAction && (
                          <td className="px-2 sm:px-3 py-2">
                            <div className="flex flex-wrap gap-1.5 justify-center">
                              {canUnderwrite && q.status === 'en_revision' && (
                                <button onClick={() => setUwModal(q)} className="p-2.5 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition" title="Evaluación de Underwriting">
                                  <ClipboardList className="w-[18px] h-[18px]" />
                                </button>
                              )}
                              {canEmit && q.status === 'aprobado' && (
                                <button onClick={() => {
                                  const prod = productos.find(p => p.id === q.producto_id)
                                  showModal('emitirCotizacion', {
                                    cot: { ...q, producto_permite_mensualidades: !!prod?.permite_mensualidades, producto_recargo_mensual_pct: prod?.recargo_mensual_pct },
                                    onSaved: loadData,
                                  })
                                }} className="p-2.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition" title="Emitir póliza">
                                  <FileCheck className="w-[18px] h-[18px]" />
                                </button>
                              )}
                              {canEdit && q.status !== 'emitida' && (
                                <button onClick={() => openEditSim(q)} className="p-2.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition" title="Editar">
                                  <Pencil className="w-[18px] h-[18px]" />
                                </button>
                              )}
                              {canAdjust && q.status === 'emitida' && q.poliza_id && (
                                <button
                                  onClick={() => showModal('ajustarPoliza', {
                                    c: { id: q.persona_id, nombre: q.nombre },
                                    polizaId: q.poliza_id,
                                    onSave: loadData,
                                  })}
                                  className="p-2.5 rounded-lg bg-violet-50 text-violet-600 hover:bg-violet-100 transition"
                                  title="Editar póliza emitida"
                                >
                                  <SlidersHorizontal className="w-[18px] h-[18px]" />
                                </button>
                              )}
                              {canDelete && (
                                <button onClick={() => handleDelete(q.id, q.nro)} className="p-2.5 rounded-lg bg-rose-50 text-rose-500 hover:bg-rose-100 transition" title="Eliminar">
                                  <Trash2 className="w-[18px] h-[18px]" />
                                </button>
                              )}
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="px-4 py-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
                <div className="flex flex-wrap items-center gap-3">
                  <span>
                    {visibleCots.length === 0
                      ? '0 cotizaciones'
                      : `${cotStart + 1}–${Math.min(cotStart + cotPageSize, visibleCots.length)} de ${visibleCots.length}`}
                  </span>
                  <label className="flex items-center gap-1.5">
                    Mostrar
                    <select
                      value={cotPageSize}
                      onChange={e => { setCotPageSize(Number(e.target.value)); setCotPage(0) }}
                      className="border border-slate-200 rounded-lg px-1.5 py-0.5 text-xs bg-white text-slate-600 outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      {[10, 20, 50, 100, 200].map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                  </label>
                </div>
                {cotTotalPages > 1 && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setCotPage(p => Math.max(0, p - 1))}
                      disabled={cotSafePage === 0}
                      className="px-2 py-1 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50 transition"
                    >
                      Anterior
                    </button>
                    <span>Página {cotSafePage + 1} de {cotTotalPages}</span>
                    <button
                      type="button"
                      onClick={() => setCotPage(p => Math.min(cotTotalPages - 1, p + 1))}
                      disabled={cotSafePage >= cotTotalPages - 1}
                      className="px-2 py-1 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50 transition"
                    >
                      Siguiente
                    </button>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Wizard */}
      {step === 1 && (
        <Step1
          sim={sim}
          setSim={setSim}
          onNext={() => setStep(2)}
          onClose={closeStep}
          // Solo se ofrecen productos publicados al cotizar. Si se está
          // editando una cotización cuyo producto ya fue despublicado, se
          // mantiene visible solo ese para no romper la edición existente.
          productos={productos.filter(p => p.publicado || p.id === sim.producto_id)}
        />
      )}
      {step === 2 && <Step2 sim={sim} setSim={setSim} onNext={() => setStep(3)} onBack={() => setStep(1)} onClose={closeStep} />}
      {step === 3 && <Step3 sim={sim} setSim={setSim} onNext={() => setStep(4)} onBack={() => setStep(2)} onClose={closeStep} vehiculosCatalogo={vehiculosCatalogo} />}
      {step === 4 && <Step4 sim={sim} setSim={setSim} tasaBcv={tasaBcv} tasaEur={tasaEur} onNext={() => setStep(5)} onBack={() => setStep(3)} onClose={closeStep} />}
      {step === 5 && (
        <Step5
          sim={sim} tasaBcv={tasaBcv} tasaEur={tasaEur} editId={editId}
          onBack={() => setStep(4)} onClose={closeStep} onSaved={loadData}
          showToast={showToast} currentUser={currentUser}
        />
      )}

      {/* Underwriting modal */}
      {uwModal && (
        <UnderwritingModal
          cot={uwModal}
          productos={productos}
          onClose={() => setUwModal(null)}
          onStatusChanged={() => { loadData(); setUwModal(null) }}
          showToast={showToast}
        />
      )}
    </div>
  )
}
