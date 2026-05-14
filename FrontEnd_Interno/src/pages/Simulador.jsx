import { useState } from 'react'
import { ShieldCheck, Layers, DollarSign, Calculator, Check, ArrowRight, ArrowLeft,
         Car, Truck, User, Shield, FileCheck, X, Info, CheckCircle, Pencil, Send, Download, Trash2, Plus } from 'lucide-react'
import { useApp } from '../context/AppContext.jsx'
import { usd, bs, sbadge, rsbadge, STATUS_COLOR, STATUS_ICONCLS, pdfPage, pdfHdr, pdfSec, pdfRow, pdfTotal, pdfFooter } from '../utils/helpers.jsx'

// ── Simulator step bar ───────────────────────────────────────
const STEPS = [
  { label: 'Vehículo',   Icon: Car },
  { label: 'Tomador',    Icon: User },
  { label: 'Coberturas', Icon: Shield },
  { label: 'Resultado',  Icon: FileCheck },
]

function SimBar({ active }) {
  return (
    <div className="flex items-center select-none">
      {STEPS.map((s, i) => {
        const n = i + 1, done = n < active, cur = n === active
        return (
          <div key={i} className="flex items-center" style={{ flex: i < STEPS.length - 1 ? '1' : '0 0 auto' }}>
            <div className="flex flex-col items-center" style={{ flexShrink: 0, width: '4.5rem' }}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all ${
                done ? 'bg-emerald-500 text-white'
                     : cur  ? 'bg-sefired-blue text-white shadow-[0_0_0_4px_rgba(0,20,99,0.15)]'
                            : 'bg-slate-100 text-slate-400'
              }`}>
                {done ? <Check className="w-3.5 h-3.5" /> : n}
              </div>
              <p className={`text-[9px] font-bold mt-1 text-center leading-tight ${
                done ? 'text-emerald-500' : cur ? 'text-sefired-blue' : 'text-slate-400'
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

// ── Simulator modal shell ────────────────────────────────────
function SimShell({ step, wide, onClose, footer, children }) {
  return (
    <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4 sm:p-6 backdrop-blur-sm">
      <div className={`bg-white rounded-3xl shadow-2xl w-full ${wide ? 'max-w-xl' : 'max-w-lg'} max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in duration-200`}>
        <div className="px-6 sm:px-8 pt-6 pb-5 border-b border-slate-100 shrink-0">
          <div className="flex items-start justify-between gap-3 mb-5">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0" style={{ background: 'linear-gradient(135deg,#001463,#000c3b)' }}>
                <Calculator className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sefired · Seguros Vehiculares</p>
                <h3 className="text-lg font-black text-slate-800 mt-0.5">Simulador de Prima</h3>
              </div>
            </div>
            <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-xl transition shrink-0 mt-1">
              <X className="w-5 h-5 text-slate-500" />
            </button>
          </div>
          <SimBar active={step} />
        </div>
        <div className="flex-1 overflow-y-auto p-6 sm:p-8">
          {children}
        </div>
        {footer && (
          <div className="px-6 sm:px-8 py-4 sm:py-5 border-t border-slate-100 flex flex-wrap gap-3 justify-between items-center shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Section header helper ────────────────────────────────────
function SecHeader({ icon: Icon, label, color = 'slate' }) {
  return (
    <div className="flex items-center gap-2 mb-3 mt-5">
      <div className={`w-4 h-4 rounded-md ${color === 'amber' ? 'bg-amber-50' : 'bg-slate-100'} flex items-center justify-center shrink-0`}>
        <Icon className={`w-2.5 h-2.5 ${color === 'amber' ? 'text-amber-600' : 'text-slate-500'}`} />
      </div>
      <span className={`text-[10px] font-bold ${color === 'amber' ? 'text-amber-600' : 'text-slate-400'} uppercase tracking-widest`}>{label}</span>
    </div>
  )
}

// ── Initial coverages state ──────────────────────────────────
const INIT_COV = {
  'CASCO-PT': { nom: 'Casco Pérdida Total',     prima: 270,  tasa: '1.80% del valor',  chk: false, req: false, desc: 'Pérdida total irrecuperable del vehículo' },
  'CASCO-PP': { nom: 'Casco Pérdida Parcial',   prima: 120,  tasa: '0.80% del valor',  chk: false, req: false, desc: 'Daños físicos reparables al vehículo' },
  'ROBO':     { nom: 'Robo y Hurto',            prima: 90,   tasa: '0.60% del valor',  chk: false, req: false, desc: 'Robo total o parcial del vehículo' },
  'AP':       { nom: 'Acc. Personales',         prima: 48,   tasa: '$12.00/ocupante',  chk: false, req: false, desc: '4 ocupantes · $10,000 c/u suma asegurada' },
  'RC-OBL':   { nom: 'RC Obligatoria',          prima: 4.50, tasa: 'UT × Factor',      chk: true,  req: true,  desc: 'Obligatoria por Ley SUDEASEG' },
  'RCV':      { nom: 'RC Voluntaria',           prima: 45,   tasa: '0.15% de suma',    chk: false, req: false, desc: 'Responsabilidad civil voluntaria ampliada' },
  'ASIST':    { nom: 'Asistencia en Carretera', prima: 8,    tasa: 'Tarifa fija anual', chk: false, req: false, desc: 'Grúa, batería, llantas y emergencias viales' },
}

function freshState() {
  return {
    tipo: 'particular', placa: '', marca: 'Toyota', modelo: '', año: '2022',
    color: '', uso: 'Particular', valor: 15000,
    nombre: '', ci: '', tel: '', email: '',
    coberturas: Object.fromEntries(Object.entries(INIT_COV).map(([k, v]) => [k, { ...v, chk: v.req }])),
  }
}

// ── Recent quotes table ──────────────────────────────────────
const quotes = [
  { id: 'COT-2026-00312', cli: 'Carlos E. Rodríguez', veh: 'Toyota Corolla 2022',      prima: 622.70,  est: 'En Revisión', fecha: '02/05/2026' },
  { id: 'COT-2026-00311', cli: 'Ana C. López',         veh: 'Hyundai Tucson 2021',      prima: 784.20,  est: 'Aprobado',    fecha: '01/05/2026' },
  { id: 'COT-2026-00309', cli: 'Pedro A. Díaz',        veh: 'Ford Explorer 2020',       prima: 1240.00, est: 'En Revisión', fecha: '30/04/2026' },
  { id: 'COT-2026-00307', cli: 'Valentina B. Ramos',   veh: 'Kia Sportage 2023',        prima: 540.00,  est: 'Emitida',     fecha: '28/04/2026' },
  { id: 'COT-2026-00305', cli: 'José M. Pérez',        veh: 'Chevrolet Sail 2021',      prima: 390.00,  est: 'Rechazado',   fecha: '25/04/2026' },
  { id: 'COT-2026-00303', cli: 'María G. Torres',      veh: 'Jeep Grand Cherokee 2019', prima: 1580.00, est: 'Emitida',     fecha: '22/04/2026' },
]

// ── Step 1: Vehicle ──────────────────────────────────────────
function Step1({ sim, setSim, onNext, onClose }) {
  const tipos = [
    { val: 'particular', Icon: Car,    label: 'Particular', desc: 'Uso personal o familiar' },
    { val: 'comercial',  Icon: Truck,  label: 'Comercial',  desc: 'Carga o transporte' },
    { val: 'flota',      Icon: Layers, label: 'Flota',      desc: 'Múltiples unidades' },
  ]
  const years = Array.from({ length: 12 }, (_, i) => 2024 - i)
  const marcas = ['Toyota','Chevrolet','Ford','Hyundai','Kia','Jeep','Nissan','Honda','Renault','Mazda','Volkswagen','Mitsubishi']
  const usos = ['Particular','Transporte de personal','Carga','Colectivo / Minibús']

  const handleNext = () => {
    const valor = Math.max(500, sim.valor)
    setSim(prev => ({
      ...prev,
      coberturas: {
        ...prev.coberturas,
        'CASCO-PT': { ...prev.coberturas['CASCO-PT'], prima: Math.round(valor * 0.018 * 100) / 100 },
        'CASCO-PP': { ...prev.coberturas['CASCO-PP'], prima: Math.round(valor * 0.008 * 100) / 100 },
        'ROBO':     { ...prev.coberturas['ROBO'],     prima: Math.round(valor * 0.006 * 100) / 100 },
      },
    }))
    onNext()
  }

  return (
    <SimShell step={1} onClose={onClose} footer={
      <>
        <button onClick={onClose} className="btn-secondary">Cancelar</button>
        <button onClick={handleNext} className="btn-primary">Continuar <ArrowRight className="w-4 h-4" /></button>
      </>
    }>
      <div className="mb-1">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tipo de póliza</span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {tipos.map(t => {
            const on = sim.tipo === t.val
            return (
              <button key={t.val}
                onClick={() => setSim(prev => ({ ...prev, tipo: t.val }))}
                className={`flex flex-col items-center gap-2 p-3.5 rounded-2xl border-2 transition-all text-center ${on ? 'border-sefired-blue bg-blue-50/50' : 'border-slate-200 hover:border-slate-300'}`}
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${on ? 'bg-sefired-blue' : 'bg-slate-100'}`}>
                  <t.Icon className={`w-4 h-4 ${on ? 'text-white' : 'text-slate-500'}`} />
                </div>
                <div>
                  <p className={`text-xs font-bold ${on ? 'text-sefired-blue' : 'text-slate-700'}`}>{t.label}</p>
                  <p className={`text-[9px] leading-tight mt-0.5 ${on ? 'text-blue-400' : 'text-slate-400'}`}>{t.desc}</p>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      <SecHeader icon={Car} label="Identificación del vehículo" />
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="field-label">Placa <span className="text-rose-500">*</span></label>
          <input className="input-field font-mono uppercase" placeholder="ABC-123" value={sim.placa} maxLength={8}
            onChange={e => setSim(prev => ({ ...prev, placa: e.target.value.toUpperCase() }))} />
        </div>
        <div>
          <label className="field-label">Año <span className="text-rose-500">*</span></label>
          <select className="select-field" value={sim.año} onChange={e => setSim(prev => ({ ...prev, año: e.target.value }))}>
            {years.map(y => <option key={y}>{y}</option>)}
          </select>
        </div>
        <div>
          <label className="field-label">Marca <span className="text-rose-500">*</span></label>
          <select className="select-field" value={sim.marca} onChange={e => setSim(prev => ({ ...prev, marca: e.target.value }))}>
            {marcas.map(m => <option key={m}>{m}</option>)}
          </select>
        </div>
        <div>
          <label className="field-label">Modelo <span className="text-rose-500">*</span></label>
          <input className="input-field" placeholder="Ej: Corolla XLi" value={sim.modelo}
            onChange={e => setSim(prev => ({ ...prev, modelo: e.target.value }))} />
        </div>
        <div>
          <label className="field-label">Color</label>
          <input className="input-field" placeholder="Ej: Blanco perla" value={sim.color}
            onChange={e => setSim(prev => ({ ...prev, color: e.target.value }))} />
        </div>
        <div>
          <label className="field-label">Uso <span className="text-rose-500">*</span></label>
          <select className="select-field" value={sim.uso} onChange={e => setSim(prev => ({ ...prev, uso: e.target.value }))}>
            {usos.map(u => <option key={u}>{u}</option>)}
          </select>
        </div>
      </div>

      <SecHeader icon={DollarSign} label="Valorización del activo" color="amber" />
      <div>
        <label className="field-label">Valor de mercado (USD) <span className="text-rose-500">*</span></label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm pointer-events-none">$</span>
          <input type="number" min="500" step="500" className="input-field pl-7" placeholder="15000"
            value={sim.valor} onChange={e => setSim(prev => ({ ...prev, valor: parseFloat(e.target.value) || 0 }))} />
        </div>
        <p className="text-[10px] text-slate-400 mt-1.5 ml-0.5">Casco PT: 1.80 % · Casco PP: 0.80 % · Robo y Hurto: 0.60 % del valor declarado.</p>
      </div>
    </SimShell>
  )
}

// ── Step 2: Policyholder ─────────────────────────────────────
function Step2({ sim, setSim, onNext, onBack, onClose }) {
  const tipoLabel = { particular: 'Particular', comercial: 'Comercial', flota: 'Flota' }[sim.tipo] || 'Vehículo'

  return (
    <SimShell step={2} onClose={onClose} footer={
      <>
        <button onClick={onBack} className="btn-secondary"><ArrowLeft className="w-4 h-4" /> Anterior</button>
        <button onClick={onNext} className="btn-primary">Continuar <ArrowRight className="w-4 h-4" /></button>
      </>
    }>
      {/* Vehicle summary card */}
      <div className="mb-5 p-4 rounded-2xl border border-slate-200 bg-slate-50/70 flex items-center gap-3.5">
        <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0" style={{ background: 'linear-gradient(135deg,#001463,#000c3b)' }}>
          <Car className="w-5 h-5 text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Vehículo · {tipoLabel}</p>
          <p className="text-sm font-bold text-slate-800">
            {sim.marca} {sim.modelo} {sim.año}
            {sim.placa && <span className="font-mono text-slate-500 text-xs"> · {sim.placa}</span>}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-[10px] text-slate-400 uppercase tracking-wide">Valor</p>
          <p className="text-base font-black text-sefired-blue">{usd(sim.valor)}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-3">
        <div className="w-4 h-4 rounded-md bg-slate-100 flex items-center justify-center shrink-0">
          <User className="w-2.5 h-2.5 text-slate-500" />
        </div>
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Datos del tomador</span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className="field-label">Nombre completo <span className="text-rose-500">*</span></label>
          <input className="input-field" placeholder="Nombre y apellidos" value={sim.nombre}
            onChange={e => setSim(prev => ({ ...prev, nombre: e.target.value }))} />
        </div>
        <div>
          <label className="field-label">Cédula / RIF <span className="text-rose-500">*</span></label>
          <input className="input-field font-mono" placeholder="V-12.345.678" value={sim.ci}
            onChange={e => setSim(prev => ({ ...prev, ci: e.target.value }))} />
        </div>
        <div>
          <label className="field-label">Teléfono</label>
          <input className="input-field" placeholder="+58 414 000 0000" value={sim.tel}
            onChange={e => setSim(prev => ({ ...prev, tel: e.target.value }))} />
        </div>
        <div className="col-span-2">
          <label className="field-label">Correo electrónico</label>
          <input type="email" className="input-field" placeholder="correo@dominio.com" value={sim.email}
            onChange={e => setSim(prev => ({ ...prev, email: e.target.value }))} />
        </div>
      </div>
    </SimShell>
  )
}

// ── Step 3: Coverages ────────────────────────────────────────
function Step3({ sim, setSim, onNext, onBack, onClose }) {
  const chkd = Object.values(sim.coberturas).filter(c => c.chk)
  const sub = chkd.reduce((s, c) => s + c.prima, 0)
  const iva = sub * 0.16
  const tot = sub + iva + 5

  const toggleCov = (cod, chk) => {
    setSim(prev => ({
      ...prev,
      coberturas: { ...prev.coberturas, [cod]: { ...prev.coberturas[cod], chk } },
    }))
  }

  return (
    <SimShell step={3} wide onClose={onClose} footer={
      <>
        <button onClick={onBack} className="btn-secondary"><ArrowLeft className="w-4 h-4" /> Anterior</button>
        <button onClick={onNext} className="btn-primary">Ver Resultado <ArrowRight className="w-4 h-4" /></button>
      </>
    }>
      <div className="flex items-start gap-3 mb-4 p-3.5 bg-amber-50/70 border border-amber-100 rounded-xl">
        <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <p className="text-xs text-amber-700 leading-relaxed"><strong>RC Obligatoria</strong> es requerida por Ley SUDEASEG y no puede deseleccionarse. Las demás coberturas se activan según el perfil de riesgo del cliente.</p>
      </div>

      <div className="flex items-center gap-2 mb-3">
        <div className="w-4 h-4 rounded-md bg-slate-100 flex items-center justify-center shrink-0">
          <Shield className="w-2.5 h-2.5 text-slate-500" />
        </div>
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Coberturas disponibles</span>
      </div>

      <div className="space-y-2 mb-4">
        {Object.entries(sim.coberturas).map(([cod, c]) => (
          <label key={cod} className={`flex items-start gap-3 p-3.5 rounded-2xl border-2 transition-all select-none ${
            c.req ? 'cursor-not-allowed border-rose-200/50 bg-rose-50/20'
                  : c.chk ? 'cursor-pointer border-sefired-blue/25 bg-blue-50/40'
                           : 'cursor-pointer border-slate-200 bg-white hover:border-slate-300'
          }`}>
            <input type="checkbox" checked={c.chk} disabled={c.req}
              onChange={e => toggleCov(cod, e.target.checked)}
              className="mt-0.5 w-4 h-4 accent-blue-700 shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-0.5">
                <p className="text-sm font-semibold text-slate-800">{c.nom}</p>
                {c.req && <span className="text-[9px] font-bold uppercase bg-rose-100 text-rose-600 px-1.5 py-0.5 rounded-full tracking-wide shrink-0">Oblig.</span>}
              </div>
              <p className="text-xs text-slate-400 truncate">{c.desc}</p>
            </div>
            <div className="shrink-0 text-right ml-2">
              <p className="text-sm font-black text-slate-800">{usd(c.prima)}</p>
              <p className="text-[10px] text-slate-400">{c.tasa}</p>
            </div>
          </label>
        ))}
      </div>

      {/* Total summary */}
      <div className="rounded-2xl overflow-hidden" style={{ background: 'linear-gradient(135deg,#001463,#000c3b)' }}>
        <div className="px-5 py-3 space-y-1.5 border-b border-white/10">
          <div className="flex justify-between text-xs"><span className="text-white/50">Prima Neta</span><span className="text-white/70 font-semibold">{usd(sub)}</span></div>
          <div className="flex justify-between text-xs"><span className="text-white/50">IVA (16%)</span><span className="text-white/70 font-semibold">{usd(iva)}</span></div>
          <div className="flex justify-between text-xs"><span className="text-white/50">Derecho de Póliza</span><span className="text-white/70 font-semibold">{usd(5)}</span></div>
        </div>
        <div className="px-5 py-4 flex items-center justify-between">
          <p className="text-sm font-bold text-white/80">Total Anual (USD)</p>
          <p className="text-2xl font-black text-white">{usd(tot)}</p>
        </div>
        <p className="text-[11px] text-white/35 text-right px-5 pb-4">{bs(tot)}</p>
      </div>
    </SimShell>
  )
}

// ── Step 4: Result ───────────────────────────────────────────
function Step4({ sim, onBack, onClose, showToast, showPdfViewer }) {
  const chkd = Object.entries(sim.coberturas).filter(([, c]) => c.chk)
  const sub = chkd.reduce((s, [, c]) => s + c.prima, 0)
  const iva = sub * 0.16
  const pol = 5
  const tot = sub + iva + pol
  const solId = 'COT-2026-0' + (313 + Math.floor(Math.random() * 10))
  const hoy = new Date()
  const fecha = `${String(hoy.getDate()).padStart(2,'0')}/${String(hoy.getMonth()+1).padStart(2,'0')}/${hoy.getFullYear()}`

  const handlePdf = () => {
    const html = pdfPage(
      pdfHdr('COTIZACIÓN DE SEGURO', 'Vehicular · Prima Anual', solId, fecha) +
      pdfSec('DATOS DEL VEHÍCULO') +
      pdfRow('Marca / Modelo', `${sim.marca} ${sim.modelo}`) +
      pdfRow('Año', sim.año) +
      pdfRow('Placa', sim.placa || '—') +
      pdfRow('Valor de Mercado', usd(sim.valor)) +
      pdfSec('TOMADOR') +
      pdfRow('Nombre', sim.nombre || 'Sin especificar') +
      pdfRow('Cédula / RIF', sim.ci || '—') +
      pdfSec('COBERTURAS Y PRIMA') +
      chkd.map(([, c]) => pdfRow(c.nom, usd(c.prima))).join('') +
      pdfTotal(`Total Prima Anual (${fecha})`, usd(tot), bs(tot) + ' · Tasa BCV 38.54') +
      pdfFooter('Carlos Ruiz', 'Caracas Principal')
    )
    showPdfViewer(`Cotización ${solId}`, html)
  }

  return (
    <SimShell step={4} wide onClose={onClose} footer={
      <>
        <button onClick={onBack} className="btn-secondary"><ArrowLeft className="w-4 h-4" /> Ajustar</button>
        <div className="flex gap-2">
          <button onClick={handlePdf} className="btn-secondary" title="Imprimir / exportar PDF">
            <Download className="w-4 h-4" />
          </button>
          <button onClick={() => { onClose(); showToast('Cotización guardada correctamente', 'success') }} className="btn-primary">
            <FileCheck className="w-4 h-4" />Guardar Cotización
          </button>
        </div>
      </>
    }>
      {/* Success header */}
      <div className="flex items-center gap-3.5 mb-5 p-4 rounded-2xl border border-emerald-200" style={{ background: 'linear-gradient(135deg,#ecfdf5,#d1fae5)' }}>
        <div className="w-11 h-11 rounded-full bg-emerald-500 flex items-center justify-center shrink-0 shadow-md shadow-emerald-300/40">
          <Check className="w-6 h-6 text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-black text-emerald-800">Cotización generada</p>
          <p className="text-xs font-mono text-emerald-600 mt-0.5">{solId} · {fecha}</p>
        </div>
        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100 px-2.5 py-1 rounded-full shrink-0 uppercase tracking-wide">Pendiente</span>
      </div>

      {/* Vehicle + policyholder */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-xl">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">Vehículo</p>
          <p className="text-sm font-bold text-slate-800 break-words">{sim.marca} {sim.modelo} {sim.año}</p>
          <p className="text-xs font-mono text-slate-500 mt-0.5">{sim.placa || '—'} · {usd(sim.valor)}</p>
        </div>
        <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-xl">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">Tomador</p>
          <p className="text-sm font-bold text-slate-800 break-words">{sim.nombre || 'Sin especificar'}</p>
          <p className="text-xs font-mono text-slate-500 mt-0.5">{sim.ci || '—'}</p>
        </div>
      </div>

      {/* Coverages list */}
      <div className="space-y-2 mb-4 p-4 bg-slate-50 border border-slate-100 rounded-2xl">
        <div className="flex items-center gap-2 mb-2">
          <ShieldCheck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Coberturas incluidas</p>
        </div>
        {chkd.map(([cod, c]) => (
          <div key={cod} className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span className="text-sm text-slate-700 truncate">{c.nom}</span>
            </div>
            <span className="text-sm font-semibold text-slate-800 shrink-0">{usd(c.prima)}</span>
          </div>
        ))}
      </div>

      {/* Total */}
      <div className="rounded-2xl overflow-hidden" style={{ background: 'linear-gradient(135deg,#001463,#000c3b)' }}>
        <div className="px-5 py-3.5 space-y-1.5 border-b border-white/10">
          <div className="flex justify-between text-xs"><span className="text-white/50">Prima Neta</span><span className="text-white/70 font-semibold">{usd(sub)}</span></div>
          <div className="flex justify-between text-xs"><span className="text-white/50">IVA (16%)</span><span className="text-white/70 font-semibold">{usd(iva)}</span></div>
          <div className="flex justify-between text-xs"><span className="text-white/50">Derecho de Póliza</span><span className="text-white/70 font-semibold">{usd(pol)}</span></div>
        </div>
        <div className="px-5 py-4 flex items-end justify-between gap-2">
          <div>
            <p className="text-sm font-bold text-white/80">Total Prima Anual</p>
            <p className="text-xs text-white/40 mt-0.5">{bs(tot)} · Tasa BCV 38.54</p>
          </div>
          <p className="text-3xl font-black text-white">{usd(tot)}</p>
        </div>
        <div className="px-5 pb-4 flex items-center justify-between border-t border-white/10 pt-3">
          <p className="text-[10px] text-white/30">Agente: <span className="text-white/50 font-semibold">Usuario actual · Caracas Principal</span></p>
          <p className="text-[10px] text-white/30 font-mono">{solId}</p>
        </div>
      </div>
    </SimShell>
  )
}

// ── Main Simulador page ──────────────────────────────────────
export default function Simulador() {
  const { showToast, showModal, showPdfViewer } = useApp()
  const [sim, setSim] = useState(freshState())
  const [step, setStep] = useState(0)
  const [chipActive, setChipActive] = useState(0)
  const [filteredIds, setFilteredIds] = useState(null)

  const statuses = ['Todos', 'En Revisión', 'Aprobado', 'Emitida', 'Rechazado']

  const openSim = () => { setSim(freshState()); setStep(1) }
  const closeModal = () => setStep(0)

  const filterByStatus = (s, i) => {
    setChipActive(i)
    setFilteredIds(s === 'Todos' ? null : quotes.filter(q => q.est === s).map(q => q.id))
  }

  const visibleQuotes = filteredIds ? quotes.filter(q => filteredIds.includes(q.id)) : quotes

  const STATUS_ICON_CLS = {
    green: { icon: CheckCircle, cls: 'text-emerald-500' },
    amber: { icon: Check, cls: 'text-amber-500' },
    red:   { icon: X, cls: 'text-rose-500' },
    blue:  { icon: CheckCircle, cls: 'text-blue-500' },
    slate: { icon: X, cls: 'text-slate-400' },
  }

  return (
    <div className="animate-in fade-in duration-500 space-y-5">
      {/* Hero card */}
      <div className="relative rounded-[2rem] overflow-hidden" style={{ background: 'linear-gradient(135deg,#001463 0%,#000c3b 55%,#001a6e 100%)' }}>
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 75% 40%,rgba(99,140,255,0.2) 0%,transparent 60%)' }} />
        <div className="relative flex flex-col sm:flex-row sm:items-center gap-6 p-7 sm:p-10">
          <div className="flex-1 min-w-0">
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/15 rounded-full px-3 py-1.5 mb-4">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-xs font-bold text-white/70 uppercase tracking-wider">Seguro Vehicular Sefired</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white leading-snug mb-2">
              Simula el costo<br /><span className="text-emerald-400">de tu póliza</span>
            </h2>
            <p className="text-sm text-white/50 max-w-xs">Obtén una cotización personalizada al instante. Elige coberturas, calcula prima y guarda tu simulación.</p>
          </div>
          <div className="shrink-0">
            <button
              onClick={openSim}
              className="flex items-center gap-2.5 bg-white text-sefired-blue text-sm font-black px-7 py-4 rounded-2xl hover:bg-blue-50 transition-all shadow-xl shadow-black/25 group"
            >
              <Calculator className="w-5 h-5 group-hover:scale-110 transition-transform" />
              Iniciar Simulación
            </button>
          </div>
        </div>
        <div className="grid grid-cols-3 border-t border-white/10">
          {[['7 coberturas','disponibles', Layers],['RC incluida','obligatoria', CheckCircle],['USD + Bs.','Tasa BCV hoy', DollarSign]].map(([val, label, Icon]) => (
            <div key={val} className="flex flex-col sm:flex-row items-center sm:gap-2 gap-1 px-4 py-3.5 text-center sm:text-left">
              <Icon className="w-3.5 h-3.5 text-white/35 shrink-0" />
              <div className="min-w-0">
                <p className="text-xs font-bold text-white/65 truncate">{val}</p>
                <p className="text-[10px] text-white/30">{label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chips + table header */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-2 sm:px-0">
        <div>
          <h3 className="text-base font-black text-slate-800">Simulaciones recientes</h3>
          <p className="text-xs text-slate-400 mt-0.5">Mayo 2026 · {quotes.length} registros</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {statuses.map((s, i) => (
            <button key={s} onClick={() => filterByStatus(s, i)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${i === chipActive ? 'bg-sefired-blue text-white border-sefired-blue' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'}`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Quotes table */}
      <div className="card overflow-hidden mx-2 sm:mx-0 px-3 sm:px-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="th-cell text-left hidden md:table-cell">N° Sim.</th>
                <th className="th-cell text-left">Cliente</th>
                <th className="th-cell text-right hidden sm:table-cell">Prima USD</th>
                <th className="th-cell text-left hidden sm:table-cell">Fecha</th>
                <th className="th-cell text-left">Estado</th>
                <th className="th-cell text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {visibleQuotes.map(q => {
                const col = STATUS_COLOR[q.est] || 'slate'
                const { icon: EstIcon, cls: estCls } = STATUS_ICON_CLS[col] || STATUS_ICON_CLS.slate
                return (
                  <tr key={q.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="td-cell font-mono text-xs text-slate-400 hidden md:table-cell whitespace-nowrap">{q.id}</td>
                    <td className="td-cell">
                      <p className="text-xs sm:text-sm font-semibold text-slate-800 break-words">{q.cli}</p>
                      <p className="text-[10px] text-slate-400 break-words sm:hidden">{usd(q.prima)}</p>
                      <p className="text-[10px] text-slate-400 break-words hidden sm:block">{q.veh}</p>
                    </td>
                    <td className="td-cell text-right font-bold text-xs sm:text-sm text-slate-800 whitespace-nowrap hidden sm:table-cell">{usd(q.prima)}</td>
                    <td className="td-cell text-xs text-slate-500 hidden sm:table-cell whitespace-nowrap">{q.fecha}</td>
                    <td className="td-cell">
                      <span className="hidden sm:inline">{sbadge(q.est)}</span>
                      <span className="sm:hidden inline-flex items-center justify-center w-full">
                        <EstIcon className={`w-4 h-4 ${estCls}`} title={q.est} />
                      </span>
                    </td>
                    <td className="px-2 sm:px-3 py-2 sm:py-2.5">
                      <div className="grid grid-cols-2 gap-1">
                        <button onClick={openSim} title="Editar" className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition inline-flex items-center justify-center">
                          <Pencil className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </button>
                        <button onClick={() => showToast('Enviando al cliente…', 'info')} title="Enviar" className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition inline-flex items-center justify-center">
                          <Send className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </button>
                        <button onClick={() => showToast('Descargando PDF…', 'info')} title="PDF" className="p-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition inline-flex items-center justify-center">
                          <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </button>
                        <button onClick={() => showModal('confirmDelete', { name: q.id })} title="Eliminar" className="p-1.5 rounded-lg bg-rose-50 text-rose-500 hover:bg-rose-100 transition inline-flex items-center justify-center">
                          <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between gap-2 text-xs text-slate-400">
          <span>{quotes.length} simulaciones</span>
          <button onClick={openSim} className="flex items-center gap-1 text-sefired-blue font-semibold hover:underline">
            <Plus className="w-3.5 h-3.5" /> Nueva
          </button>
        </div>
      </div>

      {/* Step modals */}
      {step === 1 && <Step1 sim={sim} setSim={setSim} onNext={() => setStep(2)} onClose={closeModal} />}
      {step === 2 && <Step2 sim={sim} setSim={setSim} onNext={() => setStep(3)} onBack={() => setStep(1)} onClose={closeModal} />}
      {step === 3 && <Step3 sim={sim} setSim={setSim} onNext={() => setStep(4)} onBack={() => setStep(2)} onClose={closeModal} />}
      {step === 4 && <Step4 sim={sim} onBack={() => setStep(3)} onClose={closeModal} showToast={showToast} showPdfViewer={showPdfViewer} />}
    </div>
  )
}
