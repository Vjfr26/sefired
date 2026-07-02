import { useState, useEffect, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Pencil, Trash2, Eye, Car, Package, Users, ShieldCheck, AlertTriangle, X, Check, Home, FileText, FolderOpen, Download, Bike, PawPrint, Anchor, Laptop, Gem } from 'lucide-react'
import { useApp } from '../context/AppContext.jsx'
import SearchBar from '../components/SearchBar.jsx'
import DataTable from '../components/DataTable.jsx'
import { fetchBienes, updateBien, deleteBien } from '../api/bienes.js'
import { downloadPolizaPdf } from '../api/polizas.js'
import { useModalLock } from '../utils/helpers.jsx'
import { useInputLimits } from '../utils/inputLimits.js'
import { BIEN_TIPO_PRESETS } from '../utils/bienPresets.js'

const TIPO_ICON  = { vehiculo: Car, inmueble: Home, bien: Package, vida: Users, bicicleta: Bike, mascota: PawPrint, embarcacion: Anchor, equipo_electronico: Laptop, joya: Gem }
const TIPO_LABEL = { vehiculo: 'Vehículo', inmueble: 'Inmueble', bien: 'Bien', vida: 'Vida/Personas', bicicleta: 'Bicicleta', mascota: 'Mascota', embarcacion: 'Embarcación', equipo_electronico: 'Equipo electrónico', joya: 'Joya' }

function bienRef(b) {
  const a = b.atributos || {}
  if (b.tipo === 'vehiculo') {
    const parts = [a.placa, a.marca, a.modelo, a.anio].filter(Boolean)
    return parts.length ? parts.join(' · ') : b.descripcion || '—'
  }
  return a.descripcion || b.descripcion || '—'
}

// ── Modal de edición/visualización de bien ────────────────────────────────────
function BienModal({ bien, onClose, onSaved }) {
  const { showToast } = useApp()
  const panelRef = useRef(null)
  useModalLock(panelRef)
  useInputLimits(panelRef)
  const [saving, setSaving] = useState(false)
  const [form, setForm]     = useState(() => {
    const a = bien.atributos || {}
    if (bien.tipo === 'vehiculo') {
      return {
        placa:             a.placa             ?? '',
        marca:             a.marca             ?? '',
        modelo:            a.modelo            ?? '',
        anio:              a.anio              ?? '',
        color:             a.color             ?? '',
        uso:               a.uso               ?? '',
        clase:             a.clase             ?? '',
        puestos:           a.puestos           ?? '',
        serial_carroceria: a.serial_carroceria ?? '',
        serial_motor:      a.serial_motor      ?? '',
        version:           a.version           ?? '',
        valor_declarado:   bien.valor_declarado ?? '',
        descripcion:       bien.descripcion     ?? '',
        observaciones:     bien.observaciones   ?? '',
      }
    }
    return {
      descripcion:     a.descripcion || bien.descripcion || '',
      valor_declarado: bien.valor_declarado ?? '',
      observaciones:   bien.observaciones   ?? '',
      ...a,
    }
  })

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const handleSave = async () => {
    setSaving(true)
    try {
      const atributos = { ...bien.atributos }
      const presetActual = BIEN_TIPO_PRESETS[bien.tipo]
      if (bien.tipo === 'vehiculo') {
        Object.assign(atributos, {
          placa: form.placa?.toUpperCase(), marca: form.marca, modelo: form.modelo,
          anio: form.anio, color: form.color, uso: form.uso, clase: form.clase,
          puestos: form.puestos, serial_carroceria: form.serial_carroceria,
          serial_motor: form.serial_motor, version: form.version,
        })
      } else if (presetActual) {
        presetActual.campos.forEach(c => { atributos[c.key] = form[c.key] ?? '' })
      } else {
        atributos.descripcion = form.descripcion
      }
      await updateBien(bien.id, {
        atributos,
        descripcion:     form.descripcion,
        valor_declarado: parseFloat(form.valor_declarado) || null,
        observaciones:   form.observaciones || null,
      })
      showToast('Bien actualizado correctamente', 'success')
      onSaved()
      onClose()
    } catch (e) {
      showToast(e.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  const inp = 'input-field text-sm'
  const lbl = 'field-label'
  const Icon = TIPO_ICON[bien.tipo] ?? Package
  const preset = BIEN_TIPO_PRESETS[bien.tipo] ?? null

  return (
    <div className="fixed inset-0 bg-black/50 z-[80] flex items-center justify-center p-4 backdrop-blur-sm">
      <div ref={panelRef} tabIndex={-1} className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in duration-200 outline-none">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-blue-600 flex items-center justify-center">
              <Icon className="w-4.5 h-4.5 text-white" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                {TIPO_LABEL[bien.tipo] ?? bien.tipo}
              </p>
              <h3 className="text-base font-black text-slate-800">{bienRef(bien)}</h3>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-xl transition">
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Titular */}
          {bien.persona && (
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                <Users className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-700">{bien.persona.nombre}</p>
                <p className="text-[11px] text-slate-400">{bien.persona.cedula}</p>
              </div>
            </div>
          )}

          {bien.tipo === 'vehiculo' ? (
            <>
              <div>
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3">Datos del Vehículo</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className={lbl}>Placa</label>
                    <input className={`${inp} font-mono uppercase`} value={form.placa} onChange={e => set('placa', e.target.value.toUpperCase())} placeholder="AB123CD" />
                  </div>
                  <div>
                    <label className={lbl}>Marca</label>
                    <input className={inp} value={form.marca} onChange={e => set('marca', e.target.value)} placeholder="Toyota" />
                  </div>
                  <div>
                    <label className={lbl}>Modelo</label>
                    <input className={inp} value={form.modelo} onChange={e => set('modelo', e.target.value)} placeholder="Corolla" />
                  </div>
                  <div>
                    <label className={lbl}>Año</label>
                    <input type="number" className={inp} value={form.anio} onChange={e => set('anio', e.target.value)} placeholder="2022" min="1900" max="2099" />
                  </div>
                  <div>
                    <label className={lbl}>Color</label>
                    <input className={inp} value={form.color} onChange={e => set('color', e.target.value)} placeholder="Blanco" />
                  </div>
                  <div>
                    <label className={lbl}>Uso</label>
                    <input className={inp} value={form.uso} onChange={e => set('uso', e.target.value)} placeholder="Particular" />
                  </div>
                  <div>
                    <label className={lbl}>Clase / Tipo</label>
                    <input className={inp} value={form.clase} onChange={e => set('clase', e.target.value)} placeholder="Automóvil" />
                  </div>
                  <div>
                    <label className={lbl}>N° Pasajeros</label>
                    <input type="number" className={inp} value={form.puestos} onChange={e => set('puestos', e.target.value)} placeholder="5" min="1" />
                  </div>
                  <div>
                    <label className={lbl}>Serial Carrocería</label>
                    <input className={`${inp} font-mono`} value={form.serial_carroceria} onChange={e => set('serial_carroceria', e.target.value)} />
                  </div>
                  <div>
                    <label className={lbl}>Serial Motor</label>
                    <input className={`${inp} font-mono`} value={form.serial_motor} onChange={e => set('serial_motor', e.target.value)} />
                  </div>
                  <div>
                    <label className={lbl}>Versión</label>
                    <input className={inp} value={form.version} onChange={e => set('version', e.target.value)} placeholder="EX" />
                  </div>
                  <div>
                    <label className={lbl}>Valor declarado (USD)</label>
                    <input type="number" className={inp} value={form.valor_declarado} onChange={e => set('valor_declarado', e.target.value)} placeholder="0.00" min="0" step="0.01" />
                  </div>
                </div>
              </div>
            </>
          ) : preset ? (
            <div className="space-y-3">
              <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1">Datos de: {preset.label}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {preset.campos.map(c => (
                  <div key={c.key}>
                    <label className={lbl}>{c.label}</label>
                    {c.type === 'select' ? (
                      <select className="select-field text-sm" value={form[c.key] ?? ''} onChange={e => set(c.key, e.target.value)}>
                        <option value="">— Seleccionar —</option>
                        {c.opciones.map(o => <option key={o}>{o}</option>)}
                      </select>
                    ) : (
                      <input type={c.type === 'number' ? 'number' : 'text'} className={inp} value={form[c.key] ?? ''} onChange={e => set(c.key, e.target.value)} placeholder={c.placeholder || ''} />
                    )}
                  </div>
                ))}
                <div>
                  <label className={lbl}>Valor declarado (USD)</label>
                  <input type="number" className={inp} value={form.valor_declarado} onChange={e => set('valor_declarado', e.target.value)} placeholder="0.00" min="0" step="0.01" />
                </div>
              </div>
              <div>
                <label className={lbl}>Descripción</label>
                <textarea className={`${inp} resize-none`} rows={2} value={form.descripcion} onChange={e => set('descripcion', e.target.value)} placeholder="Descripción del bien…" />
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <label className={lbl}>Descripción</label>
                <textarea className={`${inp} resize-none`} rows={3} value={form.descripcion} onChange={e => set('descripcion', e.target.value)} placeholder="Descripción del bien…" />
              </div>
              <div>
                <label className={lbl}>Valor declarado (USD)</label>
                <input type="number" className={inp} value={form.valor_declarado} onChange={e => set('valor_declarado', e.target.value)} placeholder="0.00" min="0" step="0.01" />
              </div>
            </div>
          )}

          <div>
            <label className={lbl}>Otros / Observaciones</label>
            <textarea className={`${inp} resize-none`} rows={2} value={form.observaciones} onChange={e => set('observaciones', e.target.value)} placeholder="Detalles adicionales: golpes previos, modificaciones, acuerdos con el cliente…" />
            <p className="text-[10px] text-slate-400 mt-1">Aparece en el campo "Otros" del cuadro póliza.</p>
          </div>

          {/* Roles adicionales */}
          {bien.roles?.length > 0 && (
            <div>
              <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">Personas relacionadas</p>
              <div className="space-y-1.5">
                {bien.roles.map(r => (
                  <div key={r.id} className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg text-sm">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 capitalize">{r.rol}</span>
                    <span className="font-medium text-slate-700">{r.persona?.nombre ?? '—'}</span>
                    {r.persona?.cedula && <span className="text-slate-400 text-xs">{r.persona.cedula}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex justify-between items-center shrink-0">
          <button onClick={onClose} className="btn-secondary">Cancelar</button>
          <button onClick={handleSave} disabled={saving} className="btn-primary disabled:opacity-50">
            <Check className="w-4 h-4" />
            {saving ? 'Guardando…' : 'Guardar cambios'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Página Bienes Asegurados ──────────────────────────────────────────────────
const COLS = [
  { k: 'tipo_label',   l: 'Tipo',          nw: true },
  { k: 'ref_cell',     l: 'Identificación', bold: true, tr: true, primary: true },
  { k: 'detalles',     l: 'Detalles',       tr: true,  hide: 'md' },
  { k: 'titular_cell', l: 'Titular',        tr: true,  hide: 'sm' },
  { k: 'vendedor_cell',l: 'Vendedor',       nw: true,  hide: 'lg' },
  { k: 'poliza_cell',  l: 'Póliza',         nw: true,  hide: 'lg' },
  { k: 'vigencia_cell',l: 'Vigencia',       nw: true,  hide: 'xl' },
  { k: 'acc',          l: '',               acc: true },
]

export default function Vehiculos() {
  const { showModal, showToast, canAct } = useApp()
  const canVerPoliza = canAct('vehiculos', 'view_poliza')
  const canVerDocs   = canAct('vehiculos', 'view_docs')
  const canEdit      = canAct('vehiculos', 'edit')
  const canDelete    = canAct('vehiculos', 'delete')
  const canViewCards = canAct('vehiculos', 'view_cards')
  const canViewList  = canAct('vehiculos', 'view_list')

  if (!canAct('vehiculos', 'view')) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
        <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center">
          <ShieldCheck className="w-6 h-6 text-slate-400" />
        </div>
        <p className="font-semibold text-slate-600">Sin acceso</p>
        <p className="text-xs text-slate-400">No tienes permiso para acceder a este módulo.</p>
      </div>
    )
  }

  const [bienes,         setBienes]         = useState([])
  const [loading,        setLoading]        = useState(true)
  const [error,          setError]          = useState(null)
  const [search,         setSearch]         = useState('')
  const [tipo,           setTipo]           = useState('')
  const [claseVeh,       setClaseVeh]       = useState('')   // tipo de vehículo (Automóvil, Camioneta, Moto…)
  const [editBien,       setEditBien]       = useState(null)
  const [pdfLoading,     setPdfLoading]     = useState(null)
  const [pdfVisor,       setPdfVisor]       = useState(null) // { url, title, nro }
  const pdfVisorPanelRef = useRef(null)
  useModalLock(pdfVisorPanelRef, !!pdfVisor)

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    try { setBienes(await fetchBienes({ con_poliza: 1 })) }
    catch (e) { setError(e.message); showToast(e.message, 'error') }
    finally { setLoading(false) }
  }, [showToast])

  useEffect(() => { load() }, [load])

  const handleVerPoliza = async (b) => {
    if (!b.poliza_id) return
    setPdfLoading(b.id)
    try {
      // En la vista de Bienes el documento se acota a ESTE bien (su certificado).
      const blob = await downloadPolizaPdf(b.poliza_id, b.id)
      const url  = URL.createObjectURL(blob)
      setPdfVisor({ url, title: `Póliza — ${b.poliza_nro ?? b.poliza_id}`, nro: b.poliza_nro ?? b.poliza_id })
    } catch (e) {
      showToast(e.message, 'error')
    } finally {
      setPdfLoading(null)
    }
  }

  const closePdfVisor = () => {
    if (pdfVisor?.url) URL.revokeObjectURL(pdfVisor.url)
    setPdfVisor(null)
  }

  const tipos = [...new Set(bienes.map(b => b.tipo).filter(Boolean))]
  // Clases de vehículo presentes (Automóvil, Camioneta, Moto…) — para el 2º filtro.
  const clasesVeh = [...new Set(
    bienes.filter(b => b.tipo === 'vehiculo')
          .map(b => String(b.atributos?.clase || b.atributos?.tipo || '').trim())
          .filter(Boolean)
  )].sort((a, b) => a.localeCompare(b, 'es'))

  const filt = bienes.filter(b => {
    if (tipo === 'otros') { if (['vehiculo', 'inmueble'].includes(b.tipo)) return false }
    else if (tipo && b.tipo !== tipo) return false
    if (claseVeh) {
      if (b.tipo !== 'vehiculo' || String(b.atributos?.clase || b.atributos?.tipo || '').trim() !== claseVeh) return false
    }
    if (!search) return true
    const q = search.toLowerCase()
    const a = b.atributos || {}
    return [bienRef(b), b.descripcion, a.placa, a.marca, a.modelo, b.persona?.nombre, b.persona?.cedula]
      .filter(Boolean).some(v => v.toLowerCase().includes(q))
  })

  const POL_STATUS_COLOR = {
    ACTIVA:   'text-emerald-700 bg-emerald-50',
    RENOVADA: 'text-indigo-700 bg-indigo-50',
    VENCIDA:  'text-amber-700 bg-amber-50',
    ANULADA:  'text-rose-600 bg-rose-50',
  }

  const rows = filt.map(b => {
    const Icon = TIPO_ICON[b.tipo] ?? Package
    const a    = b.atributos || {}

    // Referencia principal
    const refPrincipal = b.tipo === 'vehiculo'
      ? (a.placa ? <span className="font-mono font-bold text-blue-700">{a.placa}</span> : <span className="text-slate-400 italic">Sin placa</span>)
      : (b.descripcion || a.descripcion || '—')

    // Detalles secundarios
    const detalles = b.tipo === 'vehiculo'
      ? [a.marca, a.modelo, a.anio].filter(Boolean).join(' · ') || '—'
      : [a.color, a.uso].filter(Boolean).join(' · ') || b.tipo

    return {
      tipo_label: (
        <span className="inline-flex items-center gap-1.5">
          <Icon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="text-xs sm:text-sm font-semibold text-slate-600">{TIPO_LABEL[b.tipo] ?? b.tipo}</span>
        </span>
      ),
      ref_cell: (
        <div>
          <div className="text-xs sm:text-sm">{refPrincipal}</div>
          {b.tipo === 'vehiculo' && a.serial_carroceria && (
            <div className="text-xs sm:text-sm text-slate-400 font-mono mt-0.5 truncate max-w-[180px]">{a.serial_carroceria}</div>
          )}
        </div>
      ),
      detalles: (
        <div>
          <p className="text-xs sm:text-sm text-slate-700">{detalles}</p>
          {b.tipo === 'vehiculo' && a.uso && (
            <span className="text-xs px-1.5 py-0.5 rounded-full bg-sky-100 text-sky-600 font-semibold mt-0.5 inline-block">{a.uso}</span>
          )}
        </div>
      ),
      titular_cell: b.persona ? (
        <div>
          <p className="text-xs sm:text-sm font-semibold text-slate-700">{b.persona.nombre}</p>
          <p className="text-xs sm:text-sm text-slate-400">{b.persona.cedula}</p>
        </div>
      ) : <span className="text-slate-400 text-xs sm:text-sm">—</span>,
      vendedor_cell: b.persona?.vendedor_nombre
        ? <span className="text-xs sm:text-sm font-medium text-slate-600">{b.persona.vendedor_nombre}</span>
        : <span className="text-slate-300 text-xs sm:text-sm italic">Sin asignar</span>,
      poliza_cell: b.poliza_nro ? (
        <div>
          <p className="text-xs sm:text-sm font-mono font-bold text-slate-700">{b.poliza_nro}</p>
          {b.poliza_status && (
            <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${POL_STATUS_COLOR[b.poliza_status] ?? 'bg-slate-100 text-slate-500'}`}>
              {b.poliza_status}
            </span>
          )}
        </div>
      ) : <span className="text-slate-300 text-xs sm:text-sm">Sin póliza</span>,
      vigencia_cell: b.poliza_fecha_emision ? (
        <div className="leading-tight">
          <p className="text-xs sm:text-sm text-slate-400">{b.poliza_fecha_emision}</p>
          <p className={`text-xs sm:text-sm font-semibold ${b.dias_vencimiento !== null && b.dias_vencimiento < 0 ? 'text-rose-600' : b.dias_vencimiento !== null && b.dias_vencimiento <= 30 ? 'text-amber-600' : 'text-slate-600'}`}>
            {b.poliza_fecha_venc}
          </p>
        </div>
      ) : <span className="text-slate-300 text-xs sm:text-sm">—</span>,
      acc: (
        <div className="flex gap-1.5 justify-center flex-wrap">
          {b.poliza_id && canVerPoliza && (
            <button
              onClick={() => handleVerPoliza(b)}
              disabled={pdfLoading === b.id}
              className="p-2.5 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition disabled:opacity-50"
              title="Ver póliza / certificado"
            >
              {pdfLoading === b.id
                ? <div className="w-[18px] h-[18px] border border-indigo-400 border-t-transparent rounded-full animate-spin" />
                : <FileText className="w-[18px] h-[18px]" />}
            </button>
          )}
          {b.poliza_persona_id && canVerDocs && (
            <button
              onClick={() => showModal('clienteDocumentos', { c: { id: b.poliza_persona_id, nombre: b.persona?.nombre ?? '' } })}
              className="p-2.5 rounded-lg bg-amber-50 text-amber-600 hover:bg-amber-100 transition"
              title="Ver documentos"
            >
              <FolderOpen className="w-[18px] h-[18px]" />
            </button>
          )}
          {canEdit && (
            <button
              onClick={() => setEditBien(b)}
              className="p-2.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition"
              title="Editar"
            >
              <Pencil className="w-[18px] h-[18px]" />
            </button>
          )}
          {canDelete && (
            <button
              onClick={() => showModal('confirmDelete', {
                name: bienRef(b),
                onConfirm: async () => { await deleteBien(b.id); load() },
              })}
              className="p-2.5 rounded-lg bg-rose-50 text-rose-500 hover:bg-rose-100 transition"
              title="Eliminar"
            >
              <Trash2 className="w-[18px] h-[18px]" />
            </button>
          )}
        </div>
      ),
    }
  })

  return (
    <div className="animate-in fade-in duration-500 space-y-5">
      {/* Hero */}
      <div className="relative rounded-[2rem] overflow-hidden" style={{ background: 'linear-gradient(135deg,#001463 0%,#000c3b 55%,#001a6e 100%)' }}>
        <div className="relative flex flex-col sm:flex-row sm:items-center gap-6 p-6 sm:p-9">
          <div className="flex-1 min-w-0">
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/15 rounded-full px-3 py-1.5 mb-3">
              <Package className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-xs font-bold text-white/70 uppercase tracking-wider">Bienes Asegurados</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white leading-snug mb-1.5">
              Bienes <span className="text-emerald-400">asegurados</span>
            </h2>
            <p className="text-sm text-white/50">Vehículos, inmuebles y otros activos registrados en el sistema.</p>
          </div>
        </div>
        {canViewCards && (
          <div className="grid grid-cols-2 sm:grid-cols-4 border-t border-white/10">
            {[
              ['',         `${bienes.length}`,                                         'Total bienes',   ShieldCheck],
              ['vehiculo', `${bienes.filter(b => b.tipo === 'vehiculo').length}`,      'Vehículos',      Car       ],
              ['inmueble', `${bienes.filter(b => b.tipo === 'inmueble').length}`,      'Inmuebles',      Home      ],
              ['otros',    `${bienes.filter(b => !['vehiculo','inmueble'].includes(b.tipo)).length}`, 'Otros tipos', Package],
            ].map(([key, val, label, Icon]) => {
              const on = tipo === key
              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => setTipo(on ? '' : key)}
                  title={key ? `Filtrar: ${label}` : 'Ver todos los bienes'}
                  className={`flex flex-col sm:flex-row items-center sm:gap-2 gap-1 px-4 py-3 text-center sm:text-left transition border-b-2 ${on ? 'bg-white/10 border-emerald-400' : 'border-transparent hover:bg-white/5'}`}
                >
                  <Icon className={`w-3.5 h-3.5 shrink-0 ${on ? 'text-emerald-400' : 'text-white/35'}`} />
                  <div>
                    <p className="text-sm font-black text-white/80">{val}</p>
                    <p className="text-[10px] text-white/30">{label}</p>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Filtros */}
      <SearchBar
        placeholder="Buscar por placa, titular, marca…"
        onSearch={setSearch}
        extra={
          <>
            <select className="select-field text-sm w-auto" value={tipo} onChange={e => setTipo(e.target.value)}>
              <option value="">Todos los tipos</option>
              {tipos.map(t => <option key={t} value={t}>{TIPO_LABEL[t] ?? t}</option>)}
              <option value="otros">Otros tipos</option>
            </select>
            {clasesVeh.length > 0 && (
              <select className="select-field text-sm w-auto" value={claseVeh} onChange={e => setClaseVeh(e.target.value)} title="Filtrar por tipo de vehículo">
                <option value="">Todo tipo de vehículo</option>
                {clasesVeh.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            )}
            <p className="text-xs text-slate-400 whitespace-nowrap">{filt.length} resultado{filt.length !== 1 ? 's' : ''}</p>
          </>
        }
      />

      {error && (
        <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm">
          <AlertTriangle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}

      {canViewList ? (
        <DataTable cols={COLS} rows={rows} loading={loading} emptyMsg="No hay bienes registrados." />
      ) : (
        <div className="card flex flex-col items-center justify-center py-16 gap-2 text-center">
          <ShieldCheck className="w-6 h-6 text-slate-300" />
          <p className="text-xs text-slate-400">No tienes permiso para ver el listado de bienes.</p>
        </div>
      )}

      {/* Modal de edición */}
      {editBien && (
        <BienModal
          bien={editBien}
          onClose={() => setEditBien(null)}
          onSaved={load}
        />
      )}

      {/* Visor PDF — portal para evitar overflow:hidden */}
      {pdfVisor && createPortal(
        <div
          className="fixed inset-0 z-[65] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 sm:p-8"
        >
          <div ref={pdfVisorPanelRef} tabIndex={-1} className="flex flex-col w-full max-w-3xl rounded-xl overflow-hidden shadow-2xl outline-none animate-in zoom-in duration-200" style={{ height: '80vh' }}>
            <div className="flex items-center gap-2 px-4 h-11 bg-[#323639] shrink-0">
              <button onClick={closePdfVisor} className="p-1.5 hover:bg-white/10 rounded-lg transition text-white" title="Cerrar">
                <X className="w-4 h-4" />
              </button>
              <p className="flex-1 text-sm font-semibold text-white truncate">{pdfVisor.title}</p>
              <a
                href={pdfVisor.url}
                download={`poliza-${pdfVisor.nro}.pdf`}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-sm text-white transition"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline font-medium">Descargar</span>
              </a>
            </div>
            <iframe src={pdfVisor.url} className="flex-1 w-full border-0 bg-[#525659]" title={pdfVisor.title} />
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
