import './style.css';
import {
  createIcons,
  BookOpen, Car, FilePlus, ClipboardCheck, ShieldCheck,
  Receipt, TrendingUp, BarChart3, DollarSign,
  ChevronDown, ChevronRight, Layers, FileText,
  Users, UserCog, Wrench, Tag, Hash, Percent, Globe,
  Wallet, BadgeCheck, ClipboardList, FileCheck, Calculator,
  Building, UserPlus, Truck, Gauge, Settings2,
  Eye, Pencil, Plus, X, Check, AlertCircle, AlertTriangle,
  Clock, RefreshCw, Calendar, Filter, Download, Settings,
  LogOut, Bell, Search, Shield, UserCheck, Building2,
  CheckCircle, Info, Printer, Send, CreditCard,
  User, Home, KeyRound, Monitor, Database, Activity, History,
  UserX, Power, Plane, Heart, Package, FileSearch
} from 'lucide';

// ── NAV CONFIG ──────────────────────────────────────────────
const NAV = [
  { id: 'home', label: 'Inicio', icon: 'home', direct: true, viewId: 'home' },
  { id: 'productos', label: 'Productos', icon: 'package', direct: true, viewId: 'cat-productos' },
  { id: 'clientes', label: 'Clientes', icon: 'users', direct: true, viewId: 'cli-cliente' },
  { id: 'vehiculos', label: 'Vehículos', icon: 'car', direct: true, viewId: 'cli-vehiculo' },
  { id: 'emision', label: 'Emisión de Pólizas', icon: 'shield-check', direct: true, viewId: 'emi-generacion' },
  { id: 'reportes', label: 'Reportes', icon: 'bar-chart-3', direct: true, viewId: 'rep-ventas' },
  { id: 'tasas', label: 'Tasas del Día', icon: 'dollar-sign', direct: true, viewId: 'tas-registro' },
  { id: 'config', label: 'Configuración', icon: 'settings', direct: true, viewId: 'cat-config' },
];

// ── STATE ────────────────────────────────────────────────────
let openGroup = 'catalogos';
let activeView = 'cat-productos';

// ── HELPERS ──────────────────────────────────────────────────
const usd = n => '$' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const bs = (n, r = 38.54) => 'Bs. ' + (n * r).toLocaleString('es-VE', { minimumFractionDigits: 2 });

function badge(text, color = 'slate') {
  return `<span class="badge badge-${color}">${text}</span>`;
}
const STATUS_COLOR = {
  'Activo': 'green', 'Activa': 'green', 'Vigente': 'green', 'Emitida': 'green', 'Aprobado': 'green', 'Cobrado': 'green',
  'Inactivo': 'slate', 'Vencida': 'slate', 'Cerrado': 'slate', 'Cancelada': 'slate',
  'Pendiente': 'amber', 'En Revisión': 'amber', 'Por Vencer': 'amber', 'Parcial': 'amber',
  'Rechazado': 'red', 'Anulada': 'red',
  'Asignado': 'blue', 'En Proceso': 'blue', 'Generada': 'blue',
};
const sbadge = s => badge(s, STATUS_COLOR[s] || 'slate');

const actions = () => `
  <div class="flex gap-1 justify-center">
    <button onclick="showToast('Abriendo detalle…','info')" class="p-1.5 hover:bg-blue-50 text-slate-400 hover:text-blue-600 rounded-lg transition" title="Ver">
      <i data-lucide="eye" class="w-3.5 h-3.5"></i>
    </button>
    <button onclick="showToast('Editando registro…','info')" class="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-lg transition" title="Editar">
      <i data-lucide="pencil" class="w-3.5 h-3.5"></i>
    </button>
  </div>`;

function tbl(cols, rows, footer = '') {
  const head = cols.map(c => `<th class="th-cell ${c.r ? 'text-right' : 'text-left'}">${c.l}</th>`).join('');
  const body = rows.map(r =>
    `<tr class="hover:bg-slate-50 transition-colors">${cols.map(c => `<td class="td-cell${c.r ? ' text-right' : ''}${c.m ? ' font-mono text-xs' : ''}">${r[c.k] ?? '—'}</td>`).join('')
    }</tr>`
  ).join('');
  return `<div class="card overflow-hidden">
    <div class="overflow-x-auto">
      <table class="w-full text-sm">
        <thead class="bg-slate-50 text-slate-400 text-xs font-semibold uppercase tracking-wider"><tr>${head}</tr></thead>
        <tbody class="divide-y divide-slate-100">${body || '<tr><td colspan="99" class="td-cell text-center text-slate-400">Sin registros</td></tr>'}</tbody>
      </table>
    </div>
    <div class="px-5 py-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
      <span>${rows.length} registros</span>${footer}
    </div>
  </div>`;
}

function searchBar(id, ph, extra = '') {
  return `<div class="card p-3.5 mb-4 flex flex-wrap items-center gap-3">
    <div class="relative flex-1 min-w-44">
      <input id="${id}" type="text" placeholder="${ph}" class="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition">
      <i data-lucide="search" class="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"></i>
    </div>${extra}</div>`;
}

function formGrid(fields) {
  return fields.map(f => `
    <div class="${f.span ? 'col-span-2' : ''}">
      <label class="field-label">${f.label}</label>
      ${f.type === 'select'
      ? `<select class="select-field">${(f.opts || []).map(o => `<option>${o}</option>`).join('')}</select>`
      : f.type === 'textarea'
        ? `<textarea rows="3" placeholder="${f.ph || ''}" class="input-field resize-none">${f.val || ''}</textarea>`
        : `<input type="${f.type || 'text'}" value="${f.val || ''}" placeholder="${f.ph || ''}" class="input-field" ${f.ro ? 'readonly' : ''}>`
    }
    </div>`).join('');
}

function formCard(fields, btn = 'Guardar', action = "showToast('Datos guardados','success')", extra = '') {
  return `<div class="card p-6">
    <div class="grid grid-cols-2 gap-4 mb-5">${formGrid(fields)}</div>
    ${extra}
    <button onclick="${action}" class="btn-primary mt-2"><i data-lucide="check" class="w-4 h-4"></i>${btn}</button>
  </div>`;
}

function sectionTop(btn = '', btn2 = '') {
  return `<div class="flex items-center justify-end gap-3 mb-5">${btn}${btn2}</div>`;
}

function cotSteps(active) {
  const steps = ['Nueva Solicitud', 'Vehículo', 'Conductor', 'Coberturas', 'Cálculo'];
  const dots = steps.map((s, i) => {
    const n = i + 1;
    const cls = n < active ? 'done' : n === active ? 'active' : 'pending';
    const lineCls = n < active ? 'done' : '';
    return `<div class="step-item flex-1 ${i < steps.length - 1 ? '' : ''}">
      <div class="flex flex-col items-center gap-1">
        <div class="step-dot ${cls}">${n < active ? '✓' : n}</div>
        <span class="text-[10px] ${n === active ? 'text-blue-600 font-semibold' : 'text-slate-400'} text-center leading-tight w-14">${s}</span>
      </div>
    </div>${i < steps.length - 1 ? `<div class="step-line ${lineCls} mt-3.5"></div>` : ''}`;
  }).join('');
  return `<div class="card p-4 mb-6 flex items-start">${dots}</div>`;
}

// ── VIEWS ────────────────────────────────────────────────────

// 1. CATÁLOGOS Y PARÁMETROS
function catProductos() {
  const rows = [
    { cod: 'AP', nom: 'Accidentes Personales', tipo: 'Personas', tasa: '$12.00/occ', desc: 'Por ocupante del vehículo', est: sbadge('Activo') },
    { cod: 'RCV', nom: 'Resp. Civil Voluntaria', tipo: 'Responsabilidad', tasa: 'Variable', desc: 'Suma asegurada a convenir', est: sbadge('Activo') },
    { cod: 'CASCO-PT', nom: 'Casco Pérdida Total', tipo: 'Vehículo', tasa: '1.80 %', desc: 'Valor de mercado del vehículo', est: sbadge('Activo') },
    { cod: 'CASCO-PP', nom: 'Casco Pérdida Parcial', tipo: 'Vehículo', tasa: '0.80 %', desc: 'Daños físicos reparables', est: sbadge('Activo') },
    { cod: 'ROBO', nom: 'Robo y Hurto', tipo: 'Vehículo', tasa: '0.60 %', desc: 'Robo total o parcial', est: sbadge('Activo') },
    { cod: 'RC-OBL', nom: 'RC Obligatoria', tipo: 'Responsabilidad', tasa: 'UT × Factor', desc: 'Obligatoria SUDEASEG', est: sbadge('Activo') },
    { cod: 'ASIST', nom: 'Asistencia en Carretera', tipo: 'Servicio', tasa: '$8.00/año', desc: 'Grúa, batería, llantas', est: sbadge('Activo') },
  ];
  return searchBar('s-prod', 'Buscar cobertura o código…',
    `<button onclick="showToast('Formulario de nueva cobertura','info')" class="btn-primary ml-auto"><i data-lucide="plus" class="w-4 h-4"></i>Nueva Cobertura</button>`) +
    tbl([
      { l: 'Código', k: 'cod', m: true }, { l: 'Nombre', k: 'nom' }, { l: 'Tipo', k: 'tipo' },
      { l: 'Prima / Tasa', k: 'tasa', r: true }, { l: 'Descripción', k: 'desc' }, { l: 'Estado', k: 'est' },
      { l: '', k: 'acc' },
    ], rows.map(r => ({ ...r, acc: actions() })));
}

function catTipos() {
  const tipos = [
    { tip: 'VEH-SED', 'nom': 'Sedán', uso: 'Particular' },
    { tip: 'VEH-RUS', 'nom': 'Rústico / SUV', uso: 'Particular' },
    { tip: 'VEH-CMT', 'nom': 'Camioneta', uso: 'Particular / Carga ligera' },
    { tip: 'VEH-COM', 'nom': 'Comercial', uso: 'Carga / Transporte' },
    { tip: 'VEH-MOT', 'nom': 'Motocicleta', uso: 'Particular' },
  ];
  const marcas = [
    { mar: 'Toyota' }, { mar: 'Chevrolet' }, { mar: 'Ford' }, { mar: 'Hyundai' },
    { mar: 'Kia' }, { mar: 'Nissan' }, { mar: 'Volkswagen' }, { mar: 'Mitsubishi' },
  ];
  const modelos = [
    { mod: 'Corolla', marc: 'Toyota', año: '2018–2024' },
    { mod: 'Avanza', marc: 'Toyota', año: '2012–2022' },
    { mod: 'Spark', marc: 'Chevrolet', año: '2015–2024' },
    { mod: 'Aveo', marc: 'Chevrolet', año: '2010–2020' },
    { mod: 'Tucson', marc: 'Hyundai', año: '2016–2024' },
  ];
  return `<div class="flex gap-2 mb-4" id="tab-tipos">
    <button onclick="setTab('tipos')" class="btn-primary text-xs px-3 py-2" id="tab-btn-tipos">Tipos</button>
    <button onclick="setTab('marcas')" class="btn-secondary text-xs px-3 py-2" id="tab-btn-marcas">Marcas</button>
    <button onclick="setTab('modelos')" class="btn-secondary text-xs px-3 py-2" id="tab-btn-modelos">Modelos</button>
    <button onclick="showToast('Nuevo registro','info')" class="btn-primary ml-auto"><i data-lucide="plus" class="w-4 h-4"></i>Nuevo</button>
  </div>
  <div id="tab-tipos-c">${tbl([{ l: 'Código', k: 'tip', m: true }, { l: 'Nombre', k: 'nom' }, { l: 'Uso', k: 'uso' }, { l: '', k: 'acc' }], tipos.map(r => ({ ...r, acc: actions() })))}</div>
  <div id="tab-marcas-c" class="hidden">${tbl([{ l: 'Marca', k: 'mar' }, { l: '', k: 'acc' }], marcas.map(r => ({ ...r, acc: actions() })))}</div>
  <div id="tab-modelos-c" class="hidden">${tbl([{ l: 'Modelo', k: 'mod' }, { l: 'Marca', k: 'marc' }, { l: 'Años', k: 'año' }, { l: '', k: 'acc' }], modelos.map(r => ({ ...r, acc: actions() })))}</div>`;
}

function catTasas() {
  const rows = [
    { cob: 'CASCO-PT', nom: 'Casco Pérdida Total', base: '1.80%', min: '1.50%', max: '2.50%', und: '% sobre valor' },
    { cob: 'CASCO-PP', nom: 'Casco Pérdida Parcial', base: '0.80%', min: '0.60%', max: '1.20%', und: '% sobre valor' },
    { cob: 'ROBO', nom: 'Robo y Hurto', base: '0.60%', min: '0.40%', max: '1.00%', und: '% sobre valor' },
    { cob: 'RCV', nom: 'Resp. Civil Voluntaria', base: '0.15%', min: '0.10%', max: '0.30%', und: '% sobre suma' },
    { cob: 'AP', nom: 'Acc. Personales', base: '$12.00', min: '$8.00', max: '$20.00', und: 'USD por ocupante' },
    { cob: 'RC-OBL', nom: 'RC Obligatoria', base: '0.5 UT', min: '0.5 UT', max: '0.5 UT', und: 'Factor × UT' },
  ];
  return `<div class="grid grid-cols-2 gap-5 mb-6">
    <div class="card p-5">
      <p class="text-xs text-slate-500 mb-1 font-semibold uppercase tracking-wide">Unidad Tributaria (UT) Vigente</p>
      <p class="text-3xl font-bold text-slate-800 mt-1">Bs. 9.00</p>
      <p class="text-xs text-slate-400 mt-1">Gaceta Oficial N° 42.647 · SENIAT</p>
      <button onclick="showToast('Actualizando UT…','info')" class="btn-secondary text-xs mt-4 px-3 py-2">Actualizar UT</button>
    </div>
    <div class="card p-5">
      <p class="text-xs text-slate-500 mb-1 font-semibold uppercase tracking-wide">Tasa BCV del Día</p>
      <p class="text-3xl font-bold text-blue-600 mt-1">38.54 Bs/$</p>
      <p class="text-xs text-slate-400 mt-1">02/05/2026 · Banco Central de Venezuela</p>
      <button onclick="navigateTo('tas-registro')" class="btn-primary text-xs mt-4 px-3 py-2">Ver Tasas</button>
    </div>
  </div>
  <div class="flex justify-between items-center mb-4">
    <h4 class="font-semibold text-slate-700">Tasas Base por Cobertura</h4>
    <button onclick="showToast('Editando tasas','info')" class="btn-primary text-xs px-3 py-2"><i data-lucide="pencil" class="w-3.5 h-3.5"></i>Editar</button>
  </div>` +
    tbl([{ l: 'Código', k: 'cob', m: true }, { l: 'Cobertura', k: 'nom' }, { l: 'Tasa Base', k: 'base', r: true }, { l: 'Mínimo', k: 'min', r: true }, { l: 'Máximo', k: 'max', r: true }, { l: 'Unidad', k: 'und' }, { l: '', k: 'acc' }],
      rows.map(r => ({ ...r, acc: actions() })));
}

function catParams() {
  return `<div class="grid grid-cols-2 gap-6">
    ${formCard([
    { label: 'Comisión Agente (%)', val: '10.00', type: 'number' },
    { label: 'Comisión Corredor (%)', val: '5.00', type: 'number' },
    { label: 'IVA (%)', val: '16.00', type: 'number' },
    { label: 'Impuesto a las Primas (%)', val: '1.00', type: 'number' },
    { label: 'Derecho de Póliza (USD)', val: '5.00', type: 'number' },
    { label: 'Vigencia Estándar (meses)', val: '12', type: 'number' },
    { label: 'Moneda Principal', type: 'select', opts: ['USD', 'EUR', 'BS'] },
    { label: 'Factor RC Obligatoria', val: '0.50', type: 'number' },
  ], 'Guardar Parámetros')}
    <div class="space-y-4">
      <div class="card p-5">
        <h4 class="font-semibold text-slate-700 mb-3 text-sm">Valores por Defecto</h4>
        <div class="space-y-3">
          ${formGrid([
    { label: 'Ocupantes por defecto', val: '4', type: 'number' },
    { label: 'Uso del vehículo', type: 'select', opts: ['Particular', 'Comercial'] },
    { label: 'Suma AP por ocupante', val: '10000', type: 'number' },
  ])}
        </div>
      </div>
      <div class="card p-5">
        <h4 class="font-semibold text-slate-700 mb-3 text-sm">Numeración de Pólizas</h4>
        <div class="space-y-3">
          ${formGrid([
    { label: 'Prefijo', val: 'SEF', ro: true },
    { label: 'Correlativo actual', val: '00847', ro: true },
    { label: 'Formato', val: 'SEF-AAAA-RAM-NNNNN', ro: true, span: true },
  ])}
        </div>
      </div>
    </div>
  </div>`;
}

function catConfig() {
  return formCard([
    { label: 'Razón Social', val: 'Seguros Sefired C.A.', span: true },
    { label: 'RIF', val: 'J-30012345-6' },
    { label: 'Regulador', val: 'SUDEASEG', ro: true },
    { label: 'Dirección', val: 'Av. Principal, Caracas', span: true },
    { label: 'Teléfono', val: '+58 212-555-0100' },
    { label: 'Email', val: 'info@sefired.com' },
    { label: 'Moneda Base', val: 'USD', ro: true },
    { label: 'País', val: 'Venezuela', ro: true },
  ], 'Guardar Configuración');
}

// 2. CLIENTES Y VEHÍCULOS
function cliCliente() {
  const rows = [
    { id: 'CLI-0001', nom: 'Carlos Eduardo Rodríguez García', ci: 'V-12.345.678', tel: '+58 414-123-4567', email: 'c.rodriguez@gmail.com', est: sbadge('Activo') },
    { id: 'CLI-0002', nom: 'María Alejandra González Pérez', ci: 'V-11.234.567', tel: '+58 424-234-5678', email: 'm.gonzalez@gmail.com', est: sbadge('Activo') },
    { id: 'CLI-0003', nom: 'José Luis Martínez Hernández', ci: 'V-10.345.678', tel: '+58 416-345-6789', email: 'j.martinez@hotmail.com', est: sbadge('Activo') },
    { id: 'CLI-0004', nom: 'Ana Carolina López Ramírez', ci: 'V-13.456.789', tel: '+58 412-456-7890', email: 'a.lopez@outlook.com', est: sbadge('Activo') },
    { id: 'CLI-0005', nom: 'Pedro Antonio Díaz Morales', ci: 'J-30.567.890', tel: '+58 414-567-8901', email: 'pdiaz@empresa.com', est: sbadge('Activo') },
    { id: 'CLI-0006', nom: 'Sofía Isabel Torres Vargas', ci: 'V-14.678.901', tel: '+58 424-678-9012', email: 's.torres@gmail.com', est: sbadge('Inactivo') },
    { id: 'CLI-0007', nom: 'Luis Fernando Castillo Medina', ci: 'J-20.789.012', tel: '+58 416-789-0123', email: 'lcastillo@corp.com', est: sbadge('Activo') },
    { id: 'CLI-0008', nom: 'Valentina Beatriz Ramos Soto', ci: 'V-15.890.123', tel: '+58 412-890-1234', email: 'v.ramos@gmail.com', est: sbadge('Activo') },
  ];
  return searchBar('s-cli', 'Buscar por nombre, CI/RIF o email…',
    `<button onclick="showToast('Formulario de nuevo cliente','info')" class="btn-primary ml-auto"><i data-lucide="plus" class="w-4 h-4"></i>Nuevo Cliente</button>`) +
    tbl([{ l: 'ID', k: 'id', m: true }, { l: 'Nombre Completo', k: 'nom' }, { l: 'CI / RIF', k: 'ci', m: true }, { l: 'Teléfono', k: 'tel' }, { l: 'Email', k: 'email' }, { l: 'Estado', k: 'est' }, { l: '', k: 'acc' }],
      rows.map(r => ({ ...r, acc: actions() })));
}

function cliTomador() {
  return searchBar('s-tom', 'Buscar tomador…',
    `<button onclick="showToast('Nuevo tomador','info')" class="btn-primary ml-auto"><i data-lucide="plus" class="w-4 h-4"></i>Nuevo Tomador</button>`) +
    tbl([{ l: 'CI/RIF', k: 'ci', m: true }, { l: 'Nombre', k: 'nom' }, { l: 'Dirección', k: 'dir' }, { l: 'Teléfono', k: 'tel' }, { l: 'Estado', k: 'est' }, { l: '', k: 'acc' }], [
      { ci: 'V-12.345.678', nom: 'Carlos E. Rodríguez', dir: 'Urb. Las Mercedes, Caracas', tel: '+58 414-123-4567', est: sbadge('Activo') },
      { ci: 'V-11.234.567', nom: 'María A. González', dir: 'La California Norte, Caracas', tel: '+58 424-234-5678', est: sbadge('Activo') },
      { ci: 'J-20.789.012', nom: 'Castillo Medina C.A.', dir: 'Av. Libertador, Caracas', tel: '+58 416-789-0123', est: sbadge('Activo') },
      { ci: 'V-13.456.789', nom: 'Ana C. López Ramírez', dir: 'El Cafetal, Miranda', tel: '+58 412-456-7890', est: sbadge('Activo') },
    ].map(r => ({ ...r, acc: actions() })));
}

function cliConductor() {
  return searchBar('s-cond', 'Buscar conductor…',
    `<button onclick="showToast('Nuevo conductor','info')" class="btn-primary ml-auto"><i data-lucide="plus" class="w-4 h-4"></i>Nuevo Conductor</button>`) +
    tbl([{ l: 'CI', k: 'ci', m: true }, { l: 'Nombre', k: 'nom' }, { l: 'Licencia', k: 'lic' }, { l: 'Categoría', k: 'cat' }, { l: 'Vencimiento', k: 'venc' }, { l: 'Estado', k: 'est' }, { l: '', k: 'acc' }], [
      { ci: 'V-12.345.678', nom: 'Carlos E. Rodríguez', lic: '12345678', cat: '3ra', venc: '15/06/2028', est: sbadge('Activo') },
      { ci: 'V-11.234.567', nom: 'María A. González', lic: '11234567', cat: '3ra', venc: '22/09/2027', est: sbadge('Activo') },
      { ci: 'V-10.345.678', nom: 'José L. Martínez', lic: '10345678', cat: '4ta', venc: '10/03/2026', est: sbadge('Por Vencer') },
      { ci: 'V-15.890.123', nom: 'Valentina B. Ramos', lic: '15890123', cat: '3ra', venc: '05/11/2029', est: sbadge('Activo') },
      { ci: 'V-16.901.234', nom: 'Ricardo A. Moreno', lic: '16901234', cat: '3ra', venc: '18/08/2027', est: sbadge('Activo') },
    ].map(r => ({ ...r, acc: actions() })));
}

function cliVehiculo() {
  return searchBar('s-veh', 'Buscar por placa, marca o propietario…',
    `<button onclick="showToast('Nuevo vehículo','info')" class="btn-primary ml-auto"><i data-lucide="plus" class="w-4 h-4"></i>Nuevo Vehículo</button>`) +
    tbl([{ l: 'Placa', k: 'placa', m: true }, { l: 'Marca / Modelo', k: 'marca' }, { l: 'Año', k: 'año', r: true }, { l: 'Color', k: 'color' }, { l: 'Tipo', k: 'tipo' }, { l: 'Propietario', k: 'prop' }, { l: 'Estado', k: 'est' }, { l: '', k: 'acc' }], [
      { placa: 'ABC-123', marca: 'Toyota Corolla', año: 2022, color: 'Blanco', tipo: 'Sedán', prop: 'C. Rodríguez', est: sbadge('Activo') },
      { placa: 'XYZ-456', marca: 'Ford Explorer', año: 2020, color: 'Negro', tipo: 'Rústico', prop: 'M. González', est: sbadge('Activo') },
      { placa: 'DEF-789', marca: 'Chevrolet Spark', año: 2019, color: 'Rojo', tipo: 'Sedán', prop: 'J. Martínez', est: sbadge('Activo') },
      { placa: 'GHI-321', marca: 'Hyundai Tucson', año: 2021, color: 'Plata', tipo: 'SUV', prop: 'A. López', est: sbadge('Activo') },
      { placa: 'JKL-654', marca: 'Kia Sportage', año: 2023, color: 'Azul', tipo: 'SUV', prop: 'L. Castillo', est: sbadge('Activo') },
      { placa: 'MNO-987', marca: 'Nissan Sentra', año: 2018, color: 'Gris', tipo: 'Sedán', prop: 'V. Ramos', est: sbadge('Activo') },
    ].map(r => ({ ...r, acc: actions() })));
}

// 3. COTIZACIÓN / SOLICITUD
function cotNueva() {
  return cotSteps(1) + formCard([
    { label: 'Nº de Solicitud', val: 'SOL-2026-00312', ro: true },
    { label: 'Fecha de Solicitud', val: '02/05/2026', ro: true },
    { label: 'Agente / Corredor', type: 'select', opts: ['Pedro Salazar · AG-001', 'Luis Romero · COR-005', 'Ana Suárez · AG-018'] },
    { label: 'Oficina', type: 'select', opts: ['Caracas Principal', 'Valencia', 'Maracaibo'] },
    { label: 'Tipo de Solicitud', type: 'select', opts: ['Nueva Póliza', 'Renovación', 'Endoso', 'Rehabilitación'] },
    { label: 'Tipo de Seguro', type: 'select', opts: ['Vehículo Particular', 'Vehículo Comercial', 'Flota Vehicular'] },
    { label: 'Observaciones', type: 'textarea', ph: 'Observaciones adicionales…', span: true },
  ], 'Siguiente → Vehículo', "navigateTo('cot-vehiculo')");
}

function cotVehiculo() {
  return cotSteps(2) +
    `<div class="grid grid-cols-2 gap-6">
    <div>
      ${searchBar('s-cveh', 'Buscar vehículo por placa…')}
      <div class="card p-5 border-2 border-blue-500">
        <div class="flex items-center justify-between mb-3">
          <span class="text-xs font-semibold text-blue-600 uppercase tracking-wide">Vehículo Seleccionado</span>
          ${badge('Activo', 'green')}
        </div>
        <div class="grid grid-cols-2 gap-y-2 text-sm">
          <span class="text-slate-500">Placa</span><span class="font-semibold text-slate-800">ABC-123</span>
          <span class="text-slate-500">Marca</span><span class="font-semibold">Toyota</span>
          <span class="text-slate-500">Modelo</span><span class="font-semibold">Corolla XLi</span>
          <span class="text-slate-500">Año</span><span class="font-semibold">2022</span>
          <span class="text-slate-500">Color</span><span class="font-semibold">Blanco</span>
          <span class="text-slate-500">Uso</span><span class="font-semibold">Particular</span>
          <span class="text-slate-500">Valor de Mercado</span><span class="font-bold text-blue-700">${usd(15000)}</span>
        </div>
      </div>
    </div>
    <div class="space-y-4">
      <div class="card p-5">
        <h4 class="font-semibold text-slate-700 text-sm mb-3">Valor del Vehículo</h4>
        ${formGrid([
      { label: 'Valor de Mercado (USD)', val: '15,000.00', type: 'number' },
      { label: 'Valor de Reposición', val: '16,500.00', type: 'number' },
      { label: 'Suma Asegurada Propuesta', val: '15,000.00', type: 'number' },
      { label: 'Moneda de Tasación', type: 'select', opts: ['USD', 'EUR'] },
    ])}
      </div>
    </div>
  </div>
  <div class="flex justify-between mt-6">
    <button onclick="navigateTo('cot-nueva')" class="btn-secondary">← Anterior</button>
    <button onclick="navigateTo('cot-conductor')" class="btn-primary">Siguiente → Conductor</button>
  </div>`;
}

function cotConductor() {
  return cotSteps(3) +
    `<div class="grid grid-cols-2 gap-6">
    <div>
      ${searchBar('s-ccond', 'Buscar conductor por CI…')}
      <div class="card p-5 border-2 border-blue-500">
        <div class="flex items-center justify-between mb-3">
          <span class="text-xs font-semibold text-blue-600 uppercase tracking-wide">Conductor Principal</span>
          ${badge('Activo', 'green')}
        </div>
        <div class="grid grid-cols-2 gap-y-2 text-sm">
          <span class="text-slate-500">CI</span><span class="font-semibold">V-12.345.678</span>
          <span class="text-slate-500">Nombre</span><span class="font-semibold">Carlos E. Rodríguez</span>
          <span class="text-slate-500">Licencia Nº</span><span class="font-semibold">12345678</span>
          <span class="text-slate-500">Categoría</span><span class="font-semibold">3ra</span>
          <span class="text-slate-500">Vencimiento</span><span class="font-semibold">15/06/2028</span>
          <span class="text-slate-500">Edad</span><span class="font-semibold">34 años</span>
        </div>
      </div>
    </div>
    <div class="card p-5">
      <h4 class="font-semibold text-slate-700 text-sm mb-3">Número de Ocupantes Asegurados</h4>
      ${formGrid([
      { label: 'Total de ocupantes (AP)', val: '4', type: 'number' },
      { label: 'Suma AP por ocupante (USD)', val: '10,000.00', type: 'number' },
    ])}
      <div class="mt-4 p-3 bg-blue-50 rounded-xl text-sm text-blue-800">
        <strong>AP Total:</strong> 4 ocupantes × $10,000 = $40,000 suma asegurada<br>
        <strong>Prima AP:</strong> 4 × $12.00 = $48.00
      </div>
    </div>
  </div>
  <div class="flex justify-between mt-6">
    <button onclick="navigateTo('cot-vehiculo')" class="btn-secondary">← Anterior</button>
    <button onclick="navigateTo('cot-coberturas')" class="btn-primary">Siguiente → Coberturas</button>
  </div>`;
}

function cotCoberturas() {
  return cotSteps(4) +
    `<div class="card p-6 mb-5">
    <h4 class="font-semibold text-slate-800 mb-4">Selección de Coberturas y Planes</h4>
    <div class="space-y-3">
      ${[
      { cod: 'CASCO-PT', nom: 'Casco Pérdida Total', tasa: '1.80%', prima: '$270.00', checked: true },
      { cod: 'CASCO-PP', nom: 'Casco Pérdida Parcial', tasa: '0.80%', prima: '$120.00', checked: true },
      { cod: 'ROBO', nom: 'Robo y Hurto', tasa: '0.60%', prima: '$90.00', checked: true },
      { cod: 'AP', nom: 'Acc. Personales (4 occ)', tasa: '$12/occ', prima: '$48.00', checked: true },
      { cod: 'RCV', nom: 'Resp. Civil Voluntaria', tasa: '0.15%', prima: '$45.00', checked: false },
      { cod: 'RC-OBL', nom: 'RC Obligatoria', tasa: '0.5 UT', prima: '$4.50', checked: true },
      { cod: 'ASIST', nom: 'Asistencia en Carretera', tasa: 'Fija', prima: '$8.00', checked: false },
    ].map(c => `<label class="flex items-center gap-4 p-3 rounded-xl border ${c.checked ? 'border-blue-200 bg-blue-50/50' : 'border-slate-200'} cursor-pointer hover:border-blue-300 transition">
        <input type="checkbox" ${c.checked ? 'checked' : ''} class="w-4 h-4 accent-blue-600">
        <span class="text-xs font-mono text-slate-500 w-16 shrink-0">${c.cod}</span>
        <span class="flex-1 text-sm font-medium text-slate-700">${c.nom}</span>
        <span class="text-xs text-slate-500 w-20 text-right">${c.tasa}</span>
        <span class="text-sm font-bold text-slate-800 w-20 text-right">${c.prima}</span>
      </label>`).join('')}
    </div>
  </div>
  <div class="flex justify-between">
    <button onclick="navigateTo('cot-conductor')" class="btn-secondary">← Anterior</button>
    <button onclick="navigateTo('cot-calculo')" class="btn-primary">Siguiente → Cálculo de Prima</button>
  </div>`;
}

function cotCalculo() {
  return cotSteps(5) +
    `<div class="grid grid-cols-3 gap-5 mb-6">
    <div class="card p-4 text-center"><p class="text-xs text-slate-500">Vehículo</p><p class="font-bold text-slate-800 mt-1">Toyota Corolla 2022</p><p class="text-xs text-slate-400">ABC-123</p></div>
    <div class="card p-4 text-center"><p class="text-xs text-slate-500">Valor Asegurado</p><p class="font-bold text-blue-700 mt-1 text-lg">${usd(15000)}</p></div>
    <div class="card p-4 text-center"><p class="text-xs text-slate-500">Tasa BCV</p><p class="font-bold text-slate-800 mt-1">38.54 Bs/$</p><p class="text-xs text-slate-400">02/05/2026</p></div>
  </div>
  <div class="card overflow-hidden mb-5">
    <div class="px-5 py-3 border-b border-slate-100 font-semibold text-slate-700 text-sm">Desglose de Prima</div>
    <table class="w-full text-sm">
      <thead class="bg-slate-50 text-slate-400 text-xs font-semibold uppercase tracking-wider">
        <tr>
          <th class="th-cell text-left">Cobertura</th>
          <th class="th-cell text-right">Suma Asegurada</th>
          <th class="th-cell text-right">Tasa</th>
          <th class="th-cell text-right">Prima Neta</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-slate-100">
        ${[
      ['CASCO Pérdida Total', usd(15000), '1.80%', usd(270)],
      ['CASCO Pérdida Parcial', usd(15000), '0.80%', usd(120)],
      ['Robo y Hurto', usd(15000), '0.60%', usd(90)],
      ['AP (4 ocupantes)', usd(40000), '$12/occ', usd(48)],
      ['RC Obligatoria', '—', '0.5 UT', usd(4.50)],
    ].map(([cob, sa, tasa, prima]) => `
          <tr class="hover:bg-slate-50">
            <td class="td-cell">${cob}</td>
            <td class="td-cell text-right text-slate-600">${sa}</td>
            <td class="td-cell text-right text-slate-600">${tasa}</td>
            <td class="td-cell text-right font-semibold">${prima}</td>
          </tr>`).join('')}
        <tr class="bg-slate-50 font-semibold"><td class="td-cell">Subtotal Prima Neta</td><td></td><td></td><td class="td-cell text-right">${usd(532.50)}</td></tr>
        <tr><td class="td-cell text-slate-500">IVA (16%)</td><td></td><td></td><td class="td-cell text-right">${usd(85.20)}</td></tr>
        <tr><td class="td-cell text-slate-500">Derecho de Póliza</td><td></td><td></td><td class="td-cell text-right">${usd(5.00)}</td></tr>
        <tr class="bg-blue-50 font-bold text-blue-800"><td class="td-cell text-base">TOTAL USD</td><td></td><td></td><td class="td-cell text-right text-base">${usd(622.70)}</td></tr>
        <tr class="bg-slate-50 text-slate-600"><td class="td-cell">Total Bolívares (38.54 Bs/$)</td><td></td><td></td><td class="td-cell text-right font-semibold">${bs(622.70)}</td></tr>
      </tbody>
    </table>
  </div>
  <div class="flex justify-between">
    <button onclick="navigateTo('cot-coberturas')" class="btn-secondary">← Anterior</button>
    <button onclick="navigateTo('rev-validacion');showToast('Solicitud SOL-2026-00312 enviada a revisión','success')" class="btn-success"><i data-lucide="send" class="w-4 h-4"></i>Enviar a Revisión</button>
  </div>`;
}

// 4. REVISIÓN Y APROBACIÓN
function revValidacion() {
  const checks = [
    { ok: true, item: 'Datos del vehículo completos', det: 'Toyota Corolla 2022 · ABC-123' },
    { ok: true, item: 'Conductor registrado y vigente', det: 'Carlos E. Rodríguez · Lic. 3ra' },
    { ok: true, item: 'Tomador identificado', det: 'CI V-12.345.678' },
    { ok: true, item: 'Coberturas seleccionadas', det: 'CASCO PT, CASCO PP, Robo, AP, RC-OBL' },
    { ok: true, item: 'Prima calculada', det: '$622.70 USD' },
    { ok: false, item: 'Documento de identidad adjunto', det: 'Falta adjuntar copia del CI' },
    { ok: false, item: 'Certificado de circulación', det: 'Falta documento oficial' },
    { ok: true, item: 'Valores dentro de límites', det: 'Suma asegurada aprobada' },
  ];
  return `<div class="card p-6 mb-5">
    <h4 class="font-semibold text-slate-800 mb-4">Lista de Verificación · SOL-2026-00312</h4>
    <div class="space-y-2">
      ${checks.map(c => `<div class="flex items-start gap-3 p-3 rounded-xl ${c.ok ? 'bg-emerald-50' : 'bg-rose-50'}">
        <div class="w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${c.ok ? 'bg-emerald-500' : 'bg-rose-500'} text-white">
          <i data-lucide="${c.ok ? 'check' : 'x'}" class="w-3.5 h-3.5"></i>
        </div>
        <div>
          <p class="text-sm font-semibold ${c.ok ? 'text-emerald-800' : 'text-rose-800'}">${c.item}</p>
          <p class="text-xs ${c.ok ? 'text-emerald-600' : 'text-rose-600'} mt-0.5">${c.det}</p>
        </div>
      </div>`).join('')}
    </div>
  </div>
  <div class="flex gap-3">
    <button onclick="showToast('Solicitud de documentos enviada al cliente','info')" class="btn-secondary"><i data-lucide="send" class="w-4 h-4"></i>Solicitar Documentos</button>
    <button onclick="navigateTo('rev-coberturas')" class="btn-primary ml-auto">Continuar Revisión →</button>
  </div>`;
}

function revCoberturas() {
  return `<div class="card p-6 mb-5">
    <div class="flex justify-between items-center mb-4">
      <div>
        <h4 class="font-semibold text-slate-800">Coberturas · SOL-2026-00312</h4>
        <p class="text-xs text-slate-500 mt-0.5">Toyota Corolla 2022 · ABC-123</p>
      </div>
      ${badge('En Revisión', 'amber')}
    </div>` +
    tbl([{ l: 'Cobertura', k: 'cob' }, { l: 'Suma Asegurada', k: 'sa', r: true }, { l: 'Tasa', k: 'tasa', r: true }, { l: 'Prima', k: 'prima', r: true }, { l: 'Observación', k: 'obs' }], [
      { cob: 'CASCO Pérdida Total', sa: usd(15000), tasa: '1.80%', prima: usd(270), obs: '—' },
      { cob: 'CASCO Pérdida Parcial', sa: usd(15000), tasa: '0.80%', prima: usd(120), obs: '—' },
      { cob: 'Robo y Hurto', sa: usd(15000), tasa: '0.60%', prima: usd(90), obs: '—' },
      { cob: 'AP (4 ocupantes)', sa: usd(40000), tasa: '$12/occ', prima: usd(48), obs: '—' },
      { cob: 'RC Obligatoria', sa: '—', tasa: '0.5 UT', prima: usd(4.50), obs: 'SUDEASEG obligatoria' },
    ]) + `</div>
  <div class="flex justify-between">
    <button onclick="navigateTo('rev-validacion')" class="btn-secondary">← Anterior</button>
    <button onclick="navigateTo('rev-evaluacion')" class="btn-primary">Continuar →</button>
  </div>`;
}

function revEvaluacion() {
  return `<div class="grid grid-cols-2 gap-6 mb-5">
    <div class="card p-6">
      <h4 class="font-semibold text-slate-800 mb-4 text-sm">Factores de Riesgo</h4>
      <div class="space-y-3">
        ${formGrid([
    { label: 'Antigüedad del vehículo', type: 'select', opts: ['0–2 años (Bajo)', '3–5 años (Medio)', '6–10 años (Alto)'] },
    { label: 'Uso del vehículo', type: 'select', opts: ['Particular (Normal)', 'Comercial (Alto)', 'Transporte (Muy Alto)'] },
    { label: 'Zona geográfica', type: 'select', opts: ['Caracas', 'Miranda', 'Carabobo', 'Zulia'] },
    { label: 'Historial siniestral', type: 'select', opts: ['Sin siniestros', '1 siniestro', '2+ siniestros'] },
  ])}
      </div>
    </div>
    <div class="card p-6">
      <h4 class="font-semibold text-slate-800 mb-4 text-sm">Resultado de Evaluación</h4>
      <div class="text-center py-4">
        <div class="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 mb-3">
          <span class="text-2xl font-bold">78</span>
        </div>
        <p class="font-bold text-emerald-700 text-lg">Riesgo BAJO</p>
        <p class="text-xs text-slate-500 mt-1">Score dentro del rango aprobable (≥70)</p>
      </div>
      <div class="space-y-2 mt-2">
        <div class="flex justify-between text-xs"><span class="text-slate-500">Antigüedad</span><span class="font-medium text-emerald-600">25/30</span></div>
        <div class="flex justify-between text-xs"><span class="text-slate-500">Uso</span><span class="font-medium text-emerald-600">20/20</span></div>
        <div class="flex justify-between text-xs"><span class="text-slate-500">Zona</span><span class="font-medium text-amber-600">18/25</span></div>
        <div class="flex justify-between text-xs"><span class="text-slate-500">Historial</span><span class="font-medium text-emerald-600">15/25</span></div>
      </div>
    </div>
  </div>
  <div class="flex justify-between">
    <button onclick="navigateTo('rev-coberturas')" class="btn-secondary">← Anterior</button>
    <button onclick="navigateTo('rev-decision')" class="btn-primary">Continuar →</button>
  </div>`;
}

function revDecision() {
  const rows = [
    { sol: 'SOL-2026-00312', cli: 'Carlos E. Rodríguez', veh: 'Toyota Corolla 2022', prima: usd(622.70), riesgo: badge('Bajo', 'green'), est: sbadge('En Revisión') },
    { sol: 'SOL-2026-00311', cli: 'Ana C. López', veh: 'Hyundai Tucson 2021', prima: usd(784.20), riesgo: badge('Bajo', 'green'), est: sbadge('En Revisión') },
    { sol: 'SOL-2026-00309', cli: 'Pedro A. Díaz', veh: 'Ford Explorer 2020', prima: usd(1240.00), riesgo: badge('Medio', 'amber'), est: sbadge('En Revisión') },
    { sol: 'SOL-2026-00307', cli: 'Valentina B. Ramos', veh: 'Kia Sportage 2023', prima: usd(540.00), riesgo: badge('Bajo', 'green'), est: sbadge('En Revisión') },
  ];
  return `<div class="card p-6 mb-5 border-l-4 border-l-blue-500">
    <div class="flex items-center justify-between">
      <div>
        <h4 class="font-semibold text-slate-800">Solicitud SOL-2026-00312</h4>
        <p class="text-xs text-slate-500 mt-0.5">Score: 78 · Riesgo Bajo · Prima: ${usd(622.70)}</p>
      </div>
      <div class="flex gap-3">
        <button onclick="showToast('Solicitud rechazada','error')" class="btn-danger"><i data-lucide="x" class="w-4 h-4"></i>Rechazar</button>
        <button onclick="navigateTo('emi-generacion');showToast('Solicitud aprobada — procediendo a emisión','success')" class="btn-success"><i data-lucide="check" class="w-4 h-4"></i>Aprobar</button>
      </div>
    </div>
    <div class="mt-3">
      <label class="field-label">Motivo / Observaciones</label>
      <textarea rows="2" class="input-field resize-none" placeholder="Observaciones del revisor…"></textarea>
    </div>
  </div>
  <h4 class="font-semibold text-slate-700 text-sm mb-3">Solicitudes Pendientes de Decisión</h4>` +
    tbl([{ l: 'Solicitud', k: 'sol', m: true }, { l: 'Cliente', k: 'cli' }, { l: 'Vehículo', k: 'veh' }, { l: 'Prima', k: 'prima', r: true }, { l: 'Riesgo', k: 'riesgo' }, { l: 'Estado', k: 'est' }, { l: '', k: 'acc' }],
      rows.map(r => ({ ...r, acc: actions() })));
}

// 5. EMISIÓN DE PÓLIZA
function emiGeneracion() {
  return `<div class="grid grid-cols-3 gap-5 mb-6">
    <div class="card p-4 text-center col-span-1"><p class="text-xs text-slate-500">Solicitud</p><p class="font-bold text-slate-800 mt-1">SOL-2026-00312</p></div>
    <div class="card p-4 text-center"><p class="text-xs text-slate-500">Estado</p><p class="font-bold text-emerald-700 mt-1">Aprobada</p></div>
    <div class="card p-4 text-center"><p class="text-xs text-slate-500">Prima Total</p><p class="font-bold text-blue-700 mt-1">${usd(622.70)}</p></div>
  </div>
  ${formCard([
    { label: 'Nº de Póliza (auto)', val: 'SEF-2026-VEH-00848', ro: true },
    { label: 'Fecha de Emisión', val: '02/05/2026', ro: true },
    { label: 'Vigencia Desde', val: '03/05/2026', type: 'date' },
    { label: 'Vigencia Hasta', val: '03/05/2027', ro: true },
    { label: 'Asegurado', val: 'Carlos E. Rodríguez', ro: true },
    { label: 'Tomador', val: 'Carlos E. Rodríguez', ro: true },
    { label: 'Vehículo', val: 'Toyota Corolla 2022 · ABC-123', ro: true, span: true },
  ], 'Generar Póliza', "navigateTo('emi-numero');showToast('Póliza SEF-2026-VEH-00848 generada','success')")}`;
}

function emiNumero() {
  return `<div class="card p-8 text-center mb-6">
    <p class="text-xs text-slate-500 mb-2 uppercase tracking-widest">Número de Póliza Asignado</p>
    <p class="text-4xl font-extrabold text-blue-700 tracking-wider mb-3">SEF-2026-VEH-00848</p>
    <div class="flex items-center justify-center gap-6 text-xs text-slate-400 mb-6">
      <span><strong class="text-slate-600">SEF</strong> · Sefired</span>
      <span><strong class="text-slate-600">2026</strong> · Año</span>
      <span><strong class="text-slate-600">VEH</strong> · Ramo Vehículo</span>
      <span><strong class="text-slate-600">00848</strong> · Correlativo</span>
    </div>
    <div class="flex justify-center gap-3">
      <button onclick="showToast('Copiado al portapapeles','success')" class="btn-secondary text-sm px-3 py-2"><i data-lucide="check" class="w-4 h-4"></i>Copiar</button>
      <button onclick="navigateTo('emi-planes')" class="btn-primary">Ver Planes y Coberturas →</button>
    </div>
  </div>`;
}

function emiPlanes() {
  return `<div class="card p-6 mb-5">
    <div class="flex justify-between items-start mb-4">
      <div>
        <h4 class="font-semibold text-slate-800">Póliza SEF-2026-VEH-00848</h4>
        <p class="text-xs text-slate-500 mt-0.5">Toyota Corolla 2022 · ABC-123 · Vigencia: 03/05/2026 – 03/05/2027</p>
      </div>
      ${badge('Vigente', 'green')}
    </div>` +
    tbl([{ l: 'Certificado', k: 'cert', m: true }, { l: 'Cobertura', k: 'cob' }, { l: 'Suma Asegurada', k: 'sa', r: true }, { l: 'Prima', k: 'prima', r: true }, { l: 'Estado', k: 'est' }], [
      { cert: 'CERT-001', cob: 'CASCO Pérdida Total', sa: usd(15000), prima: usd(270), est: badge('Vigente', 'green') },
      { cert: 'CERT-002', cob: 'CASCO Pérdida Parcial', sa: usd(15000), prima: usd(120), est: badge('Vigente', 'green') },
      { cert: 'CERT-003', cob: 'Robo y Hurto', sa: usd(15000), prima: usd(90), est: badge('Vigente', 'green') },
      { cert: 'CERT-004', cob: 'AP (4 ocupantes)', sa: usd(40000), prima: usd(48), est: badge('Vigente', 'green') },
      { cert: 'CERT-005', cob: 'RC Obligatoria', sa: '—', prima: usd(4.50), est: badge('Vigente', 'green') },
    ]) + `</div>
  <div class="flex gap-3">
    <button onclick="navigateTo('emi-recibo')" class="btn-primary"><i data-lucide="printer" class="w-4 h-4"></i>Generar Recibo</button>
    <button onclick="showToast('Descargando certificado PDF','info')" class="btn-secondary"><i data-lucide="download" class="w-4 h-4"></i>Descargar PDF</button>
  </div>`;
}

function emiRecibo() {
  return `<div class="card p-6 max-w-lg mb-5">
    <div class="flex justify-between items-start mb-5 pb-4 border-b border-slate-100">
      <div>
        <h4 class="font-bold text-slate-900 text-base">RECIBO DE PRIMA</h4>
        <p class="text-xs text-slate-500 mt-0.5">Sefired C.A. · RIF J-30012345-6</p>
      </div>
      <div class="text-right">
        <p class="font-semibold text-slate-700 text-sm">REC-2026-00848</p>
        <p class="text-xs text-slate-400">02/05/2026</p>
      </div>
    </div>
    <div class="space-y-1.5 text-sm mb-5">
      <div class="flex justify-between"><span class="text-slate-500">Póliza:</span><span class="font-semibold">SEF-2026-VEH-00848</span></div>
      <div class="flex justify-between"><span class="text-slate-500">Asegurado:</span><span class="font-semibold">Carlos E. Rodríguez</span></div>
      <div class="flex justify-between"><span class="text-slate-500">Vehículo:</span><span class="font-semibold">Toyota Corolla 2022 · ABC-123</span></div>
      <div class="flex justify-between"><span class="text-slate-500">Vigencia:</span><span class="font-semibold">03/05/2026 – 03/05/2027</span></div>
    </div>
    <div class="bg-slate-50 rounded-xl p-4 text-sm space-y-2 mb-4">
      <div class="flex justify-between"><span class="text-slate-600">Prima Neta</span><span>${usd(532.50)}</span></div>
      <div class="flex justify-between"><span class="text-slate-600">IVA 16%</span><span>${usd(85.20)}</span></div>
      <div class="flex justify-between"><span class="text-slate-600">Derecho de Póliza</span><span>${usd(5.00)}</span></div>
      <div class="flex justify-between font-bold text-slate-900 pt-2 border-t border-slate-200"><span>TOTAL USD</span><span>${usd(622.70)}</span></div>
      <div class="flex justify-between text-slate-500"><span>Total Bs (38.54)</span><span>${bs(622.70)}</span></div>
    </div>
    <div class="flex gap-3">
      <button onclick="showToast('Imprimiendo recibo…','info')" class="btn-primary flex-1"><i data-lucide="printer" class="w-4 h-4"></i>Imprimir</button>
      <button onclick="navigateTo('fac-factura');showToast('Procediendo a facturación','info')" class="btn-secondary flex-1">Facturar →</button>
    </div>
  </div>`;
}

// 6. FACTURACIÓN Y COBRO
function facFactura() {
  return `<div class="grid grid-cols-2 gap-6">
    <div class="card p-6">
      <h4 class="font-semibold text-slate-800 mb-4 text-sm">Datos de Factura</h4>
      <div class="grid grid-cols-2 gap-4">
        ${formGrid([
    { label: 'Nº de Factura', val: 'FAC-2026-00848', ro: true },
    { label: 'Fecha', val: '02/05/2026', ro: true },
    { label: 'Póliza', val: 'SEF-2026-VEH-00848', ro: true },
    { label: 'Cliente', val: 'Carlos E. Rodríguez', ro: true },
    { label: 'RIF / CI', val: 'V-12.345.678', ro: true },
    { label: 'Dirección', val: 'Las Mercedes, Caracas' },
  ])}
      </div>
      <button onclick="showToast('Factura generada','success')" class="btn-primary mt-5"><i data-lucide="check" class="w-4 h-4"></i>Generar Factura</button>
    </div>
    <div class="card p-6">
      <h4 class="font-semibold text-slate-800 mb-4 text-sm">Resumen de Cobro</h4>
      <div class="space-y-2 text-sm">
        <div class="flex justify-between py-2 border-b border-slate-100"><span class="text-slate-500">Prima Neta</span><span class="font-medium">${usd(532.50)}</span></div>
        <div class="flex justify-between py-2 border-b border-slate-100"><span class="text-slate-500">IVA (16%)</span><span class="font-medium">${usd(85.20)}</span></div>
        <div class="flex justify-between py-2 border-b border-slate-100"><span class="text-slate-500">Derecho de Póliza</span><span class="font-medium">${usd(5.00)}</span></div>
        <div class="flex justify-between py-2 font-bold text-slate-900 text-base"><span>Total USD</span><span>${usd(622.70)}</span></div>
        <div class="flex justify-between py-1 text-slate-500"><span>Total Bs (38.54)</span><span>${bs(622.70)}</span></div>
      </div>
    </div>
  </div>`;
}

function facImpuestos() {
  return tbl([{ l: 'Concepto', k: 'conc' }, { l: 'Base Imponible', k: 'base', r: true }, { l: '%', k: 'pct', r: true }, { l: 'Monto', k: 'monto', r: true }, { l: 'Normativa', k: 'norm' }], [
    { conc: 'Prima Neta', base: usd(532.50), pct: '—', monto: usd(532.50), norm: 'Base de cálculo' },
    { conc: 'IVA', base: usd(532.50), pct: '16.00%', monto: usd(85.20), norm: 'SENIAT' },
    { conc: 'Derecho de Póliza', base: '—', pct: 'Fijo', monto: usd(5.00), norm: 'Sefired' },
    { conc: 'Impuesto a Primas', base: usd(532.50), pct: '1.00%', monto: usd(5.33), norm: 'Ley de Seguros' },
    { conc: 'TOTAL', base: '—', pct: '—', monto: usd(627.03), norm: '' },
  ]);
}

function facPago() {
  return `<div class="card p-6">
    <h4 class="font-semibold text-slate-800 mb-5 text-sm">Selección de Método de Pago</h4>
    <div class="grid grid-cols-3 gap-3 mb-6">
      ${[
      { id: 'usd-ef', ico: 'dollar-sign', nom: 'Efectivo USD', desc: 'Pago en dólares en caja' },
      { id: 'bs-ef', ico: 'wallet', nom: 'Efectivo Bs', desc: 'A tasa BCV del día' },
      { id: 'transfer', ico: 'send', nom: 'Transferencia Bs', desc: 'Banco a banco' },
      { id: 't-usd', ico: 'send', nom: 'Transferencia USD', desc: 'Zelle / Wire Transfer' },
      { id: 'pdv', ico: 'credit-card', nom: 'Punto de Venta', desc: 'TDC / TDD en Bs' },
      { id: 'pm', ico: 'receipt', nom: 'Pago Móvil', desc: 'Pago Móvil interbancario' },
    ].map((m, i) => `<label class="card p-4 cursor-pointer hover:border-blue-300 hover:bg-blue-50/30 transition border-2 ${i === 0 ? 'border-blue-500 bg-blue-50/50' : 'border-slate-200'}">
        <input type="radio" name="payment" class="sr-only" ${i === 0 ? 'checked' : ''}>
        <div class="flex items-start gap-3">
          <i data-lucide="${m.ico}" class="w-5 h-5 text-blue-600 mt-0.5 shrink-0"></i>
          <div>
            <p class="font-semibold text-slate-800 text-sm">${m.nom}</p>
            <p class="text-xs text-slate-500 mt-0.5">${m.desc}</p>
          </div>
        </div>
      </label>`).join('')}
    </div>
    <button onclick="navigateTo('fac-registro');showToast('Método de pago seleccionado','info')" class="btn-primary"><i data-lucide="check" class="w-4 h-4"></i>Confirmar Método</button>
  </div>`;
}

function facRegistro() {
  return `<div class="grid grid-cols-2 gap-6">
    ${formCard([
    { label: 'Nº Factura', val: 'FAC-2026-00848', ro: true },
    { label: 'Total a Cobrar', val: '$622.70', ro: true },
    { label: 'Método de Pago', type: 'select', opts: ['Efectivo USD', 'Transferencia Bs', 'Pago Móvil', 'Punto de Venta'] },
    { label: 'Monto Recibido', ph: '0.00', type: 'number' },
    { label: 'Referencia / Nº', ph: 'Nº de referencia o transacción' },
    { label: 'Fecha de Pago', val: '02/05/2026', type: 'date' },
    { label: 'Tipo de Pago', type: 'select', opts: ['Pago Total', 'Pago Parcial'] },
    { label: 'Observaciones', ph: 'Notas…', type: 'textarea', span: true },
  ], 'Registrar Pago', "showToast('Pago de $622.70 registrado correctamente','success')")}
    <div>
      <div class="card p-5 mb-4">
        <h4 class="font-semibold text-slate-700 text-sm mb-3">Saldo</h4>
        <div class="space-y-2 text-sm">
          <div class="flex justify-between"><span class="text-slate-500">Total Factura</span><span class="font-semibold">${usd(622.70)}</span></div>
          <div class="flex justify-between"><span class="text-slate-500">Pagado</span><span class="font-semibold text-emerald-600">${usd(0)}</span></div>
          <div class="flex justify-between font-bold pt-2 border-t border-slate-100"><span>Saldo Pendiente</span><span class="text-rose-600">${usd(622.70)}</span></div>
        </div>
      </div>
      <div class="card p-5">
        <h4 class="font-semibold text-slate-700 text-sm mb-3">Historial de Pagos</h4>
        <p class="text-sm text-slate-400 text-center py-4">Sin pagos registrados</p>
      </div>
    </div>
  </div>`;
}

// 7. VENTA Y COMISIONES
function venVenta() {
  return formCard([
    { label: 'Póliza', val: 'SEF-2026-VEH-00848', ro: true },
    { label: 'Prima Neta', val: '$532.50', ro: true },
    { label: 'Vendedor / Agente', type: 'select', opts: ['Pedro Salazar · AG-001', 'Luis Romero · AG-002', 'Ana Suárez · AG-018'] },
    { label: 'Código Agente', val: 'AG-001', ro: true },
    { label: 'Corredor', type: 'select', opts: ['Sin corredor', 'Romero & Asoc. · COR-005'] },
    { label: 'Oficina', type: 'select', opts: ['Caracas Principal', 'Valencia', 'Maracaibo'] },
    { label: 'Canal de Venta', type: 'select', opts: ['Directo', 'Corredor', 'Agente', 'Digital'] },
    { label: 'Fecha de Venta', val: '02/05/2026', type: 'date' },
  ], 'Registrar Venta');
}

function venComisiones() {
  return `<div class="grid grid-cols-3 gap-5 mb-6">
    <div class="card p-5 text-center"><p class="text-xs text-slate-500">Prima Neta</p><p class="text-xl font-bold text-slate-800 mt-1">${usd(532.50)}</p></div>
    <div class="card p-5 text-center border-t-4 border-t-blue-500"><p class="text-xs text-slate-500">Comisión Agente (10%)</p><p class="text-xl font-bold text-blue-700 mt-1">${usd(53.25)}</p></div>
    <div class="card p-5 text-center border-t-4 border-t-indigo-500"><p class="text-xs text-slate-500">Comisión Corredor (5%)</p><p class="text-xl font-bold text-indigo-700 mt-1">${usd(26.63)}</p></div>
  </div>` +
    tbl([{ l: 'Beneficiario', k: 'ben' }, { l: 'Rol', k: 'rol' }, { l: 'Base', k: 'base', r: true }, { l: '%', k: 'pct', r: true }, { l: 'Comisión', k: 'com', r: true }, { l: 'Estado', k: 'est' }], [
      { ben: 'Pedro Salazar', rol: 'Agente', base: usd(532.50), pct: '10.00%', com: usd(53.25), est: badge('Pendiente', 'amber') },
      { ben: 'Romero & Asoc.', rol: 'Corredor', base: usd(532.50), pct: '5.00%', com: usd(26.63), est: badge('Pendiente', 'amber') },
    ]);
}

function venMetas() {
  const agentes = [
    { nom: 'Pedro Salazar', meta: usd(8000), prod: usd(6420), pct: 80, pol: 14, est: badge('En curso', 'blue') },
    { nom: 'Ana Suárez', meta: usd(6000), prod: usd(6180), pct: 103, pol: 18, est: badge('Cumplida', 'green') },
    { nom: 'Luis Romero', meta: usd(10000), prod: usd(7850), pct: 79, pol: 21, est: badge('En curso', 'blue') },
    { nom: 'Carla Mendoza', meta: usd(5000), prod: usd(2100), pct: 42, pol: 6, est: badge('En riesgo', 'red') },
  ];
  return `<div class="card overflow-hidden">
    <div class="px-5 py-4 border-b border-slate-100 font-semibold text-slate-700 text-sm">Producción Mayo 2026</div>
    <table class="w-full text-sm">
      <thead class="bg-slate-50 text-slate-400 text-xs font-semibold uppercase tracking-wider">
        <tr>
          <th class="th-cell text-left">Agente</th>
          <th class="th-cell text-right">Meta</th>
          <th class="th-cell text-right">Producción</th>
          <th class="th-cell text-left">Avance</th>
          <th class="th-cell text-right">Pólizas</th>
          <th class="th-cell text-left">Estado</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-slate-100">
        ${agentes.map(a => `<tr class="hover:bg-slate-50 transition-colors">
          <td class="td-cell font-medium">${a.nom}</td>
          <td class="td-cell text-right">${a.meta}</td>
          <td class="td-cell text-right font-semibold">${a.prod}</td>
          <td class="td-cell">
            <div class="flex items-center gap-2">
              <div class="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                <div class="h-full rounded-full ${a.pct >= 100 ? 'bg-emerald-500' : a.pct >= 70 ? 'bg-blue-500' : 'bg-rose-400'}" style="width:${Math.min(a.pct, 100)}%"></div>
              </div>
              <span class="text-xs font-semibold w-8 ${a.pct >= 100 ? 'text-emerald-600' : a.pct >= 70 ? 'text-blue-600' : 'text-rose-500'}">${a.pct}%</span>
            </div>
          </td>
          <td class="td-cell text-right">${a.pol}</td>
          <td class="td-cell">${a.est}</td>
        </tr>`).join('')}
      </tbody>
    </table>
  </div>`;
}

// 8. REPORTES Y CONSULTAS
function reportBase(title, cols, rows) {
  return `<div class="card p-3.5 mb-4 flex flex-wrap items-center gap-3">
    <div class="relative flex-1 min-w-44">
      <input type="text" placeholder="Buscar…" class="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition">
      <i data-lucide="search" class="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"></i>
    </div>
    <input type="date" value="2026-05-01" class="text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500">
    <input type="date" value="2026-05-02" class="text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500">
    <button onclick="showToast('Exportando reporte…','info')" class="btn-secondary ml-auto"><i data-lucide="download" class="w-4 h-4"></i>Exportar</button>
  </div>` + tbl(cols, rows);
}

function repVentas() {
  return reportBase('Ventas', [{ l: 'Fecha', k: 'fecha' }, { l: 'Póliza', k: 'pol', m: true }, { l: 'Agente', k: 'agente' }, { l: 'Tipo', k: 'tipo' }, { l: 'Prima Neta', k: 'prima', r: true }, { l: 'Estado', k: 'est' }], [
    { fecha: '02/05/2026', pol: 'SEF-2026-VEH-00848', agente: 'Pedro Salazar', tipo: 'Vehículo Particular', prima: usd(532.50), est: sbadge('Vigente') },
    { fecha: '01/05/2026', pol: 'SEF-2026-VEH-00847', agente: 'Ana Suárez', tipo: 'Vehículo Particular', prima: usd(714.20), est: sbadge('Vigente') },
    { fecha: '30/04/2026', pol: 'SEF-2026-VEH-00846', agente: 'Luis Romero', tipo: 'Vehículo Comercial', prima: usd(1240.00), est: sbadge('Vigente') },
    { fecha: '29/04/2026', pol: 'SEF-2026-VEH-00845', agente: 'Carla Mendoza', tipo: 'Vehículo Particular', prima: usd(487.00), est: sbadge('Vigente') },
    { fecha: '28/04/2026', pol: 'SEF-2026-VEH-00844', agente: 'Pedro Salazar', tipo: 'Vehículo Particular', prima: usd(620.80), est: sbadge('Vigente') },
  ]);
}

function repPolizas() {
  return reportBase('Pólizas', [{ l: 'Póliza', k: 'pol', m: true }, { l: 'Asegurado', k: 'asi' }, { l: 'Vehículo', k: 'veh' }, { l: 'Vigencia', k: 'vig' }, { l: 'Prima', k: 'prima', r: true }, { l: 'Estado', k: 'est' }], [
    { pol: 'SEF-2026-VEH-00848', asi: 'Carlos E. Rodríguez', veh: 'Toyota Corolla 2022', vig: '03/05/2026–03/05/2027', prima: usd(622.70), est: sbadge('Vigente') },
    { pol: 'SEF-2026-VEH-00847', asi: 'Ana C. López', veh: 'Hyundai Tucson 2021', vig: '01/05/2026–01/05/2027', prima: usd(784.20), est: sbadge('Vigente') },
    { pol: 'SEF-2026-VEH-00846', asi: 'Luis F. Castillo', veh: 'Ford Explorer 2020', vig: '30/04/2026–30/04/2027', prima: usd(1320.00), est: sbadge('Vigente') },
    { pol: 'SEF-2026-VEH-00845', asi: 'Valentina B. Ramos', veh: 'Kia Sportage 2023', vig: '29/04/2026–29/04/2027', prima: usd(540.00), est: sbadge('Vigente') },
    { pol: 'SEF-2025-VEH-00781', asi: 'Sofía I. Torres', veh: 'Chevrolet Spark 2019', vig: '01/11/2025–01/11/2026', prima: usd(420.00), est: sbadge('Por Vencer') },
  ]);
}

function repProduccion() {
  return reportBase('Producción', [{ l: 'Agente', k: 'agente' }, { l: 'Pólizas', k: 'pol', r: true }, { l: 'Prima Neta', k: 'prima', r: true }, { l: 'Comisiones', k: 'com', r: true }, { l: 'Meta', k: 'meta', r: true }, { l: '% Cumpl.', k: 'pct', r: true }], [
    { agente: 'Ana Suárez', pol: 18, prima: usd(9840), com: usd(984.00), meta: usd(6000), pct: '103%' },
    { agente: 'Luis Romero', pol: 21, prima: usd(11480), com: usd(1148.00), meta: usd(10000), pct: '115%' },
    { agente: 'Pedro Salazar', pol: 14, prima: usd(7280), com: usd(728.00), meta: usd(8000), pct: '91%' },
    { agente: 'Carla Mendoza', pol: 6, prima: usd(2880), com: usd(288.00), meta: usd(5000), pct: '58%' },
  ]);
}

function repComisiones() {
  return reportBase('Comisiones', [{ l: 'Beneficiario', k: 'ben' }, { l: 'Rol', k: 'rol' }, { l: 'Pólizas', k: 'pol', r: true }, { l: 'Base', k: 'base', r: true }, { l: 'Tasa', k: 'tasa', r: true }, { l: 'Comisión', k: 'com', r: true }, { l: 'Estado', k: 'est' }], [
    { ben: 'Pedro Salazar', rol: 'Agente', pol: 14, base: usd(7280), tasa: '10%', com: usd(728.00), est: badge('Pendiente', 'amber') },
    { ben: 'Ana Suárez', rol: 'Agente', pol: 18, base: usd(9840), tasa: '10%', com: usd(984.00), est: badge('Pagada', 'green') },
    { ben: 'Luis Romero', rol: 'Agente', pol: 21, base: usd(11480), tasa: '10%', com: usd(1148.00), est: badge('Pendiente', 'amber') },
    { ben: 'Romero & Asoc.', rol: 'Corredor', pol: 12, base: usd(6240), tasa: '5%', com: usd(312.00), est: badge('Pagada', 'green') },
  ]);
}

function repTasas() {
  return reportBase('Tasas', [{ l: 'Fecha', k: 'fecha' }, { l: 'Tasa BCV (Bs/$)', k: 'tasa', r: true }, { l: 'Variación', k: 'var' }, { l: 'Fuente', k: 'fuente' }, { l: 'Registrado por', k: 'reg' }], [
    { fecha: '02/05/2026', tasa: '38.5400', var: badge('+0.14%', 'amber'), fuente: 'BCV Oficial', reg: 'Sistema' },
    { fecha: '01/05/2026', tasa: '38.3900', var: badge('+0.21%', 'amber'), fuente: 'BCV Oficial', reg: 'Sistema' },
    { fecha: '30/04/2026', tasa: '38.1800', var: badge('+0.08%', 'slate'), fuente: 'BCV Oficial', reg: 'V. Admin' },
    { fecha: '29/04/2026', tasa: '38.1500', var: badge('0.00%', 'slate'), fuente: 'BCV Oficial', reg: 'Sistema' },
    { fecha: '28/04/2026', tasa: '38.1500', var: badge('-0.05%', 'green'), fuente: 'BCV Oficial', reg: 'Sistema' },
  ]);
}

// 9. TASAS DEL DÍA
function tasRegistro() {
  return `<div class="grid grid-cols-2 gap-6">
    <div>
      <div class="card p-6 mb-5 border-t-4 border-t-blue-600">
        <p class="text-xs text-slate-500 uppercase tracking-wide font-semibold mb-1">Tasa Vigente · 02/05/2026</p>
        <p class="text-4xl font-extrabold text-blue-700">38.54 <span class="text-xl font-semibold text-slate-500">Bs/$</span></p>
        <p class="text-xs text-slate-400 mt-2">Banco Central de Venezuela · Última actualización: 07:45 AM</p>
      </div>
      ${formCard([
    { label: 'Fecha', val: '02/05/2026', type: 'date' },
    { label: 'Tasa BCV (Bs/$)', ph: '0.00000', type: 'number' },
    { label: 'Fuente', type: 'select', opts: ['BCV Oficial', 'BCVDIGITAL', 'Manual'] },
    { label: 'Referencia', ph: 'URL o número de resolución' },
  ], 'Registrar Tasa', "showToast('Tasa del día registrada y aplicada','success')")}
    </div>
    <div class="card p-6">
      <h4 class="font-semibold text-slate-800 mb-4 text-sm">Últimas 5 tasas registradas</h4>
      ${tbl([{ l: 'Fecha', k: 'f' }, { l: 'Tasa Bs/$', k: 't', r: true }, { l: 'Variación', k: 'v' }], [
    { f: '02/05/2026', t: '38.5400', v: badge('+0.14%', 'amber') },
    { f: '01/05/2026', t: '38.3900', v: badge('+0.21%', 'amber') },
    { f: '30/04/2026', t: '38.1800', v: badge('+0.08%', 'slate') },
    { f: '29/04/2026', t: '38.1500', v: badge('0.00%', 'slate') },
    { f: '28/04/2026', t: '38.1500', v: badge('-0.05%', 'green') },
  ])}
    </div>
  </div>`;
}

function tasHistorico() {
  return reportBase('Histórico de Tasas', [{ l: 'Fecha', k: 'f' }, { l: 'Tasa Bs/$', k: 't', r: true }, { l: 'Mínima', k: 'min', r: true }, { l: 'Máxima', k: 'max', r: true }, { l: 'Variación', k: 'v' }, { l: 'Fuente', k: 'fuente' }], [
    { f: '02/05/2026', t: '38.5400', min: '38.4200', max: '38.5400', v: badge('+0.14%', 'amber'), fuente: 'BCV' },
    { f: '01/05/2026', t: '38.3900', min: '38.3500', max: '38.4100', v: badge('+0.21%', 'amber'), fuente: 'BCV' },
    { f: '30/04/2026', t: '38.1800', min: '38.1200', max: '38.2000', v: badge('+0.08%', 'slate'), fuente: 'BCV' },
    { f: '29/04/2026', t: '38.1500', min: '38.0800', max: '38.1700', v: badge('0.00%', 'slate'), fuente: 'BCV' },
    { f: '28/04/2026', t: '38.1500', min: '38.0900', max: '38.1800', v: badge('-0.05%', 'green'), fuente: 'BCV' },
    { f: '25/04/2026', t: '38.1700', min: '38.1200', max: '38.2100', v: badge('+0.11%', 'amber'), fuente: 'BCV' },
    { f: '24/04/2026', t: '38.1200', min: '38.0700', max: '38.1500', v: badge('+0.03%', 'slate'), fuente: 'BCV' },
  ]);
}

function tasAplicacion() {
  return `<div class="grid grid-cols-2 gap-6">
    <div class="card p-6">
      <h4 class="font-semibold text-slate-800 mb-5 text-sm">Configuración de Aplicación Automática</h4>
      <div class="space-y-4">
        ${[
      ['Aplicar a nuevas cotizaciones', true],
      ['Aplicar a recibos pendientes', true],
      ['Aplicar a renovaciones del día', true],
      ['Notificar cambio de tasa', true],
      ['Bloquear cobro si no hay tasa', false],
      ['Permitir tasa manual (emergencia)', false],
    ].map(([lbl, on]) => `<label class="flex items-center justify-between cursor-pointer">
          <span class="text-sm text-slate-700">${lbl}</span>
          <div class="toggle-wrap">
            <input type="checkbox" ${on ? 'checked' : ''} class="toggle-input">
            <span class="toggle-track"></span>
          </div>
        </label>`).join('')}
      </div>
      <button onclick="showToast('Configuración guardada','success')" class="btn-primary mt-6"><i data-lucide="check" class="w-4 h-4"></i>Guardar</button>
    </div>
    <div class="card p-6">
      <h4 class="font-semibold text-slate-800 mb-4 text-sm">Estado del Sistema</h4>
      <div class="space-y-3">
        ${[
      ['Tasa del día registrada', true, '38.54 Bs/$'],
      ['Cotizaciones activas', true, '3 solicitudes'],
      ['Recibos pendientes', true, '7 recibos'],
      ['Última sincronización', true, '07:45 AM hoy'],
    ].map(([lbl, ok, det]) => `<div class="flex items-center gap-3 p-3 rounded-xl ${ok ? 'bg-emerald-50' : 'bg-rose-50'}">
          <div class="w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${ok ? 'bg-emerald-500' : 'bg-rose-500'} text-white">
            <i data-lucide="${ok ? 'check' : 'x'}" class="w-3.5 h-3.5"></i>
          </div>
          <div class="flex-1">
            <p class="text-sm font-semibold ${ok ? 'text-emerald-800' : 'text-rose-800'}">${lbl}</p>
            <p class="text-xs ${ok ? 'text-emerald-600' : 'text-rose-600'}">${det}</p>
          </div>
        </div>`).join('')}
      </div>
    </div>
  </div>`;
}

// HOME
function viewHome() {
  return `
  <div class="animate-in fade-in slide-in-from-bottom-4 duration-700">
    <div class="card p-6 md:p-10">
      <div class="flex items-center justify-between mb-6">
        <h3 class="text-xl font-bold text-slate-800">Simulador de Cotizaciones</h3>
        <span class="text-[9px] font-bold text-slate-400 uppercase tracking-widest">SEFIRED</span>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        <!-- Formulario -->
        <div class="lg:col-span-7 space-y-6">
          <div>
            <p class="input-label mb-3">Tipo de Seguro</p>
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <button class="type-btn active h-20">
                <i data-lucide="car" class="w-6 h-6"></i>
                <span class="text-[11px] font-bold">Auto</span>
              </button>
              <button class="type-btn group h-20">
                <i data-lucide="home" class="w-6 h-6 text-slate-500 group-hover:text-sefired-green"></i>
                <span class="text-[11px] font-bold text-slate-500 group-hover:text-sefired-green">Hogar</span>
              </button>
              <button class="type-btn group h-20">
                <i data-lucide="heart" class="w-6 h-6 text-slate-500 group-hover:text-sefired-green"></i>
                <span class="text-[11px] font-bold text-slate-500 group-hover:text-sefired-green">Vida</span>
              </button>
              <button class="type-btn group h-20">
                <i data-lucide="plane" class="w-6 h-6 text-slate-500 group-hover:text-sefired-green"></i>
                <span class="text-[11px] font-bold text-slate-500 group-hover:text-sefired-green">Viajes</span>
              </button>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="input-group">
              <label class="input-label">Datos del Cliente</label>
              <input type="text" class="input-control h-10" placeholder="Nombre del Cliente" value="Carlos Ruiz">
            </div>
            <div class="input-group">
              <label class="input-label">Identificación</label>
              <input type="text" class="input-control h-10" placeholder="Cédula / RIF" value="V-12.345.678">
            </div>
          </div>
          
          <div class="input-group">
            <label class="input-label">Correo Electrónico</label>
            <input type="text" class="input-control h-10" placeholder="ejemplo@sefired.com" value="cruiz@sefired.com">
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="input-group">
              <label class="input-label">Vehículo a Cotizar</label>
              <input type="text" class="input-control h-10" placeholder="Marca / Modelo" value="Toyota Corolla">
            </div>
            <div class="input-group">
              <label class="input-label">Año</label>
              <select class="input-control h-10">
                <option>2024</option>
                <option>2023</option>
                <option selected>2022</option>
              </select>
            </div>
          </div>

          <div class="input-group">
            <div class="flex justify-between items-center mb-3">
              <label class="input-label text-xs">Suma Asegurada</label>
              <span class="text-lg font-black text-sefired-blue">$ 15.000,00</span>
            </div>
            <input type="range" min="5000" max="100000" step="1000" value="15000" class="w-full">
          </div>
        </div>

        <!-- Resultados -->
        <div class="lg:col-span-5 flex flex-col">
          <div class="results-box flex-1 shadow-2xl bg-white p-6 md:p-8 flex flex-col justify-center rounded-3xl">
            <div class="pb-6 border-b border-slate-100 mb-6">
              <h4 class="text-xl font-bold text-slate-800 mb-6">Resultados</h4>
              
              <div class="space-y-2">
                <p class="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Prima Mensual Estada</p>
                <p class="text-2xl md:text-3xl font-black text-sefired-green tracking-tight">$ 150.00</p>
              </div>
            </div>

            <div class="space-y-2 mb-8">
              <p class="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Prima Anual Estimada</p>
              <p class="text-2xl md:text-3xl font-black text-sefired-green tracking-tight">$ 2.000.00</p>
            </div>

            <button class="btn-primary w-full py-4 text-lg font-black rounded-2xl shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-transform">
              Generar Cotización
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>`;
}

// CONFIGURACIÓN
function confPerfil() {
  return `<div class="grid grid-cols-3 gap-6">
    <div class="card p-6 col-span-2">
      <h4 class="font-semibold text-slate-800 mb-5">Información Personal</h4>
      <div class="flex items-center gap-5 pb-5 mb-5 border-b border-slate-100">
        <div class="w-16 h-16 rounded-2xl bg-sefired-dark flex items-center justify-center text-xl font-extrabold text-white shrink-0">CR</div>
        <div>
          <p class="font-bold text-slate-800">Carlos Ruiz</p>
          <p class="text-sm text-slate-500">Asesor de Ventas · Sefired R.L.</p>
          <button onclick="showToast('Función de cambio de foto próximamente','info')" class="text-xs text-blue-600 font-semibold hover:underline mt-1">Cambiar foto</button>
        </div>
      </div>
      <div class="grid grid-cols-2 gap-4">
        ${formGrid([
    { label: 'Nombre', val: 'Victor' },
    { label: 'Apellido', val: 'Admin' },
    { label: 'Email', val: 'contacto@victecnology.com' },
    { label: 'Teléfono', val: '+58 414-000-0000' },
    { label: 'Cargo', val: 'Gerente Regional' },
    { label: 'Departamento', val: 'Operaciones' },
    { label: 'Oficina', type: 'select', opts: ['Caracas Principal', 'Valencia', 'Maracaibo'] },
    { label: 'Idioma', type: 'select', opts: ['Español', 'English'] },
  ])}
      </div>
      <button onclick="showToast('Perfil actualizado correctamente','success')" class="btn-primary mt-5"><i data-lucide="check" class="w-4 h-4"></i>Guardar Cambios</button>
    </div>
    <div class="space-y-5">
      <div class="card p-5">
        <h4 class="font-semibold text-slate-700 text-sm mb-3">Información de Acceso</h4>
        <div class="space-y-2 text-sm">
          <div class="flex justify-between"><span class="text-slate-500">Usuario</span><span class="font-mono font-semibold text-slate-700">vadmin</span></div>
          <div class="flex justify-between"><span class="text-slate-500">Rol</span><span class="font-semibold text-blue-700">Gerente Regional</span></div>
          <div class="flex justify-between"><span class="text-slate-500">Último acceso</span><span class="text-slate-600">03/05/2026 09:14</span></div>
          <div class="flex justify-between"><span class="text-slate-500">Estado</span>${badge('Activo', 'green')}</div>
        </div>
      </div>
      <div class="card p-5">
        <h4 class="font-semibold text-slate-700 text-sm mb-3">Permisos Activos</h4>
        <div class="space-y-1.5 text-xs text-slate-600">
          ${['Emitir pólizas', 'Aprobar solicitudes', 'Ver reportes', 'Gestionar clientes', 'Registrar cobros', 'Administrar tasas']
      .map(p => `<div class="flex items-center gap-2"><i data-lucide="check-circle" class="w-3.5 h-3.5 text-emerald-500 shrink-0"></i>${p}</div>`).join('')}
        </div>
      </div>
    </div>
  </div>`;
}

function confSeguridad() {
  return `<div class="grid grid-cols-2 gap-6">
    ${formCard([
    { label: 'Contraseña actual', type: 'password', ph: '••••••••' },
    { label: 'Nueva contraseña', type: 'password', ph: '••••••••' },
    { label: 'Confirmar contraseña', type: 'password', ph: '••••••••', span: true },
  ], 'Actualizar Contraseña', "showToast('Contraseña actualizada correctamente','success')")}

    <div class="space-y-5">
      <div class="card p-5">
        <h4 class="font-semibold text-slate-700 text-sm mb-4">Autenticación de Dos Factores</h4>
        <div class="flex items-center justify-between mb-3">
          <div>
            <p class="text-sm text-slate-700 font-medium">2FA por Email</p>
            <p class="text-xs text-slate-400">Código de verificación al iniciar sesión</p>
          </div>
          <div class="toggle-wrap"><input type="checkbox" class="toggle-input" checked><span class="toggle-track"></span></div>
        </div>
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-slate-700 font-medium">2FA por SMS</p>
            <p class="text-xs text-slate-400">Mensaje de texto al número registrado</p>
          </div>
          <div class="toggle-wrap"><input type="checkbox" class="toggle-input"><span class="toggle-track"></span></div>
        </div>
      </div>
      <div class="card p-5">
        <div class="flex items-center justify-between mb-3">
          <h4 class="font-semibold text-slate-700 text-sm">Sesiones Activas</h4>
          <button onclick="showToast('Todas las otras sesiones cerradas','success')" class="text-xs text-rose-600 font-semibold hover:underline">Cerrar otras</button>
        </div>
        <div class="space-y-2.5">
          ${[
      { dis: 'Chrome — Windows 11', ip: '192.168.1.10', when: 'Ahora', cur: true },
      { dis: 'Firefox — Android 14', ip: '192.168.1.22', when: 'Hace 2 horas', cur: false },
      { dis: 'Safari — iPhone 15', ip: '187.22.101.55', when: 'Hace 4 horas', cur: false },
    ].map(s => `<div class="flex items-center gap-3 p-2.5 rounded-xl ${s.cur ? 'bg-emerald-50' : 'bg-slate-50'}">
            <i data-lucide="monitor" class="w-4 h-4 ${s.cur ? 'text-emerald-600' : 'text-slate-400'} shrink-0"></i>
            <div class="flex-1 min-w-0">
              <p class="text-xs font-semibold text-slate-700 truncate">${s.dis}</p>
              <p class="text-[10px] text-slate-400">${s.ip} · ${s.when}</p>
            </div>
            ${s.cur ? badge('Actual', 'green') : `<button onclick="showToast('Sesión cerrada','success')" class="text-[10px] text-rose-500 hover:underline font-semibold">Cerrar</button>`}
          </div>`).join('')}
        </div>
      </div>
    </div>
  </div>`;
}

function confPrefs() {
  return `<div class="grid grid-cols-2 gap-6">
    <div class="card p-6">
      <h4 class="font-semibold text-slate-800 mb-5 text-sm">Notificaciones</h4>
      <div class="space-y-4">
        ${[
      ['Tasa BCV no registrada al inicio del día', true],
      ['Solicitudes pendientes de revisión', true],
      ['Pólizas próximas a vencer (7 días)', true],
      ['Cobros vencidos sin registrar', true],
      ['Nuevos clientes registrados', false],
      ['Comisiones generadas', true],
      ['Reportes diarios automáticos', false],
      ['Alertas de seguridad (accesos)', true],
    ].map(([lbl, on]) => `<label class="flex items-center justify-between cursor-pointer">
          <span class="text-sm text-slate-700">${lbl}</span>
          <div class="toggle-wrap"><input type="checkbox" ${on ? 'checked' : ''} class="toggle-input"><span class="toggle-track"></span></div>
        </label>`).join('')}
      </div>
      <button onclick="showToast('Preferencias de notificaciones guardadas','success')" class="btn-primary mt-5"><i data-lucide="check" class="w-4 h-4"></i>Guardar</button>
    </div>
    <div class="card p-6">
      <h4 class="font-semibold text-slate-800 mb-5 text-sm">Visualización y Región</h4>
      <div class="grid grid-cols-1 gap-4">
        ${formGrid([
      { label: 'Idioma de la interfaz', type: 'select', opts: ['Español (Venezuela)', 'English (US)'] },
      { label: 'Zona horaria', type: 'select', opts: ['America/Caracas (UTC-4)', 'America/Bogota (UTC-5)'] },
      { label: 'Formato de fecha', type: 'select', opts: ['DD/MM/AAAA', 'MM/DD/AAAA', 'AAAA-MM-DD'] },
      { label: 'Formato de moneda', type: 'select', opts: ['USD $1,234.56', 'USD 1.234,56'] },
      { label: 'Moneda de visualización', type: 'select', opts: ['USD (Dólares)', 'BS (Bolívares)', 'Ambas'] },
      { label: 'Filas por página', type: 'select', opts: ['10', '25', '50', '100'] },
    ])}
      </div>
      <button onclick="showToast('Preferencias de visualización guardadas','success')" class="btn-primary mt-5"><i data-lucide="check" class="w-4 h-4"></i>Guardar</button>
    </div>
  </div>`;
}

function confUsuarios() {
  const usuarios = [
    { usr: 'vadmin', nom: 'Victor Admin', rol: 'Gerente Regional', email: 'vadmin@sefired.com', ult: '03/05/2026', est: badge('Activo', 'green') },
    { usr: 'psalazar', nom: 'Pedro Salazar', rol: 'Agente', email: 'psalazar@sefired.com', ult: '03/05/2026', est: badge('Activo', 'green') },
    { usr: 'asuarez', nom: 'Ana Suárez', rol: 'Agente', email: 'asuarez@sefired.com', ult: '02/05/2026', est: badge('Activo', 'green') },
    { usr: 'lromero', nom: 'Luis Romero', rol: 'Agente', email: 'lromero@sefired.com', ult: '02/05/2026', est: badge('Activo', 'green') },
    { usr: 'cmendoza', nom: 'Carla Mendoza', rol: 'Agente', email: 'cmendoza@sefired.com', ult: '01/05/2026', est: badge('Activo', 'green') },
    { usr: 'rcontrol', nom: 'Rosa Control', rol: 'Supervisor', email: 'rcontrol@sefired.com', ult: '03/05/2026', est: badge('Activo', 'green') },
    { usr: 'jaudit', nom: 'Juan Auditor', rol: 'Solo Lectura', email: 'jaudit@sefired.com', ult: '28/04/2026', est: badge('Activo', 'green') },
    { usr: 'xbaja', nom: 'Xavier Baja', rol: 'Agente', email: 'xbaja@sefired.com', ult: '15/03/2026', est: badge('Inactivo', 'slate') },
  ];
  return searchBar('s-usr', 'Buscar usuario…',
    `<button onclick="showToast('Formulario nuevo usuario','info')" class="btn-primary ml-auto"><i data-lucide="plus" class="w-4 h-4"></i>Nuevo Usuario</button>`) +
    tbl([{ l: 'Usuario', k: 'usr', m: true }, { l: 'Nombre', k: 'nom' }, { l: 'Rol', k: 'rol' }, { l: 'Email', k: 'email' }, { l: 'Último Acceso', k: 'ult' }, { l: 'Estado', k: 'est' }, { l: '', k: 'acc' }],
      usuarios.map(u => ({
        ...u, acc: `<div class="flex gap-1 justify-center">
      <button onclick="showToast('Editando usuario…','info')" class="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-lg transition" title="Editar"><i data-lucide="pencil" class="w-3.5 h-3.5"></i></button>
      <button onclick="showToast('Usuario desactivado','warning')" class="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition" title="Desactivar"><i data-lucide="user-x" class="w-3.5 h-3.5"></i></button>
    </div>`})));
}

function confRoles() {
  const roles = [
    { rol: 'Administrador', usuarios: 1, desc: 'Acceso total al sistema' },
    { rol: 'Gerente Regional', usuarios: 2, desc: 'Supervisión y aprobaciones' },
    { rol: 'Supervisor', usuarios: 1, desc: 'Revisión y cotización' },
    { rol: 'Agente', usuarios: 4, desc: 'Cotización, emisión y cobro' },
    { rol: 'Solo Lectura', usuarios: 1, desc: 'Consultas y reportes' },
  ];
  const perms = ['Catálogos', 'Clientes', 'Cotización', 'Revisión', 'Emisión', 'Facturación', 'Comisiones', 'Reportes', 'Tasas', 'Config.'];
  const matrix = {
    'Administrador': [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    'Gerente Regional': [1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
    'Supervisor': [0, 1, 1, 1, 1, 1, 0, 1, 1, 0],
    'Agente': [0, 1, 1, 0, 1, 1, 1, 1, 0, 0],
    'Solo Lectura': [0, 0, 0, 0, 0, 0, 0, 1, 0, 0],
  };
  return `<div class="grid grid-cols-5 gap-6">
    <div class="col-span-2">` +
    tbl([{ l: 'Rol', k: 'rol' }, { l: 'Usuarios', k: 'usuarios', r: true }, { l: 'Descripción', k: 'desc' }], roles) +
    `<button onclick="showToast('Nuevo rol','info')" class="btn-primary mt-4"><i data-lucide="plus" class="w-4 h-4"></i>Nuevo Rol</button>
    </div>
    <div class="col-span-3 card overflow-hidden">
      <div class="px-5 py-3 border-b border-slate-100 font-semibold text-slate-700 text-sm">Matriz de Permisos</div>
      <div class="overflow-x-auto">
        <table class="w-full text-xs">
          <thead class="bg-slate-50 text-slate-400 font-semibold uppercase tracking-wider">
            <tr>
              <th class="th-cell text-left">Rol</th>
              ${perms.map(p => `<th class="th-cell text-center px-2">${p}</th>`).join('')}
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            ${roles.map(r => `<tr class="hover:bg-slate-50">
              <td class="td-cell font-semibold text-slate-700 whitespace-nowrap">${r.rol}</td>
              ${matrix[r.rol].map(v => `<td class="td-cell text-center px-2">
                <div class="w-5 h-5 rounded mx-auto flex items-center justify-center ${v ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-300'}">
                  <i data-lucide="${v ? 'check' : 'x'}" class="w-3 h-3"></i>
                </div>
              </td>`).join('')}
            </tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>
  </div>`;
}

function confEmpresa() {
  return `<div class="grid grid-cols-2 gap-6">
    ${formCard([
    { label: 'Razón Social', val: 'Seguros Sefired C.A.', span: true },
    { label: 'RIF', val: 'J-30012345-6' },
    { label: 'Registro SUDEASEG', val: 'RSE-2010-00247' },
    { label: 'Dirección', val: 'Av. Francisco de Miranda, Torre empresarial, Caracas', span: true },
    { label: 'Teléfono Principal', val: '+58 212-555-0100' },
    { label: 'Teléfono Secundario', val: '+58 212-555-0101' },
    { label: 'Email Corporativo', val: 'info@sefired.com' },
    { label: 'Sitio Web', val: 'www.sefired.com' },
  ], 'Guardar Datos Empresa')}

    <div class="space-y-5">
      <div class="card p-5">
        <h4 class="font-semibold text-slate-700 text-sm mb-4">Regulación</h4>
        <div class="space-y-2.5 text-sm">
          <div class="flex justify-between"><span class="text-slate-500">Organismo</span><span class="font-semibold text-blue-700">SUDEASEG</span></div>
          <div class="flex justify-between"><span class="text-slate-500">Resolución</span><span class="font-mono text-xs text-slate-600">RSE-2010-00247</span></div>
          <div class="flex justify-between"><span class="text-slate-500">Moneda base</span><span class="font-semibold">USD</span></div>
          <div class="flex justify-between"><span class="text-slate-500">País</span><span class="font-semibold">Venezuela</span></div>
          <div class="flex justify-between"><span class="text-slate-500">Vigencia</span><span class="font-semibold text-emerald-700">Vigente</span></div>
        </div>
      </div>
      <div class="card p-5">
        <h4 class="font-semibold text-slate-700 text-sm mb-4">Información del Sistema</h4>
        <div class="space-y-2.5 text-sm">
          <div class="flex justify-between"><span class="text-slate-500">Versión</span><span class="font-mono text-xs text-slate-700">v1.0.0-beta</span></div>
          <div class="flex justify-between"><span class="text-slate-500">Entorno</span>${badge('Producción', 'green')}</div>
          <div class="flex justify-between"><span class="text-slate-500">Desarrollado por</span><span class="font-semibold text-blue-700">Victecnology Lda</span></div>
          <div class="flex justify-between"><span class="text-slate-500">Soporte</span><span class="text-xs text-blue-500">contacto@victecnology.com</span></div>
        </div>
      </div>
    </div>
  </div>`;
}

function confAuditoria() {
  return reportBase('Auditoría', [
    { l: 'Fecha/Hora', k: 'dt' }, { l: 'Usuario', k: 'usr', m: true }, { l: 'Acción', k: 'acc' }, { l: 'Módulo', k: 'mod' }, { l: 'Detalle', k: 'det' }, { l: 'IP', k: 'ip', m: true }
  ], [
    { dt: '03/05/2026 09:14', usr: 'vadmin', acc: badge('Acceso', 'blue'), mod: 'Sistema', det: 'Inicio de sesión exitoso', ip: '192.168.1.10' },
    { dt: '03/05/2026 09:18', usr: 'vadmin', acc: badge('Creación', 'green'), mod: 'Cotización', det: 'SOL-2026-00312 creada', ip: '192.168.1.10' },
    { dt: '03/05/2026 09:32', usr: 'vadmin', acc: badge('Aprobación', 'green'), mod: 'Revisión', det: 'SOL-2026-00312 aprobada', ip: '192.168.1.10' },
    { dt: '03/05/2026 09:38', usr: 'vadmin', acc: badge('Creación', 'green'), mod: 'Emisión', det: 'SEF-2026-VEH-00848 emitida', ip: '192.168.1.10' },
    { dt: '03/05/2026 09:45', usr: 'psalazar', acc: badge('Creación', 'green'), mod: 'Cotización', det: 'SOL-2026-00313 creada', ip: '192.168.1.22' },
    { dt: '03/05/2026 10:02', usr: 'vadmin', acc: badge('Edición', 'amber'), mod: 'Configuración', det: 'Parámetro comisión agente actualizado', ip: '192.168.1.10' },
    { dt: '02/05/2026 17:55', usr: 'asuarez', acc: badge('Cobro', 'indigo'), mod: 'Facturación', det: 'FAC-2026-00846 cobro registrado $487.00', ip: '192.168.1.15' },
    { dt: '02/05/2026 17:30', usr: 'rcontrol', acc: badge('Consulta', 'slate'), mod: 'Reportes', det: 'Reporte de ventas exportado', ip: '192.168.1.18' },
  ]);
}

function confRespaldo() {
  return `<div class="grid grid-cols-2 gap-6">
    <div class="card p-6">
      <h4 class="font-semibold text-slate-800 mb-5 text-sm">Respaldo Manual</h4>
      <div class="p-5 bg-slate-50 rounded-xl mb-5 text-sm space-y-2">
        <div class="flex justify-between"><span class="text-slate-500">Último respaldo</span><span class="font-semibold">02/05/2026 23:00</span></div>
        <div class="flex justify-between"><span class="text-slate-500">Tamaño</span><span class="font-semibold">14.2 MB</span></div>
        <div class="flex justify-between"><span class="text-slate-500">Estado</span>${badge('Completado', 'green')}</div>
        <div class="flex justify-between"><span class="text-slate-500">Ubicación</span><span class="font-mono text-xs text-slate-600">/backups/sefired_20260502.tar.gz</span></div>
      </div>
      <div class="flex gap-3">
        <button onclick="showToast('Generando respaldo…','info')" class="btn-primary flex-1"><i data-lucide="database" class="w-4 h-4"></i>Respaldar Ahora</button>
        <button onclick="showToast('Descargando último respaldo','info')" class="btn-secondary flex-1"><i data-lucide="download" class="w-4 h-4"></i>Descargar</button>
      </div>
    </div>
    <div class="card p-6">
      <h4 class="font-semibold text-slate-800 mb-5 text-sm">Respaldo Automático</h4>
      <div class="space-y-4 mb-5">
        ${formGrid([
    { label: 'Frecuencia', type: 'select', opts: ['Diario (23:00)', 'Cada 12 horas', 'Semanal (Domingo)', 'Mensual'] },
    { label: 'Retención', type: 'select', opts: ['7 días', '15 días', '30 días', '90 días'] },
    { label: 'Ruta de destino', val: '/backups/sefired/', span: true },
  ])}
        <label class="flex items-center justify-between cursor-pointer">
          <span class="text-sm text-slate-700">Respaldo automático activo</span>
          <div class="toggle-wrap"><input type="checkbox" checked class="toggle-input"><span class="toggle-track"></span></div>
        </label>
      </div>
      <button onclick="showToast('Configuración de respaldo guardada','success')" class="btn-primary"><i data-lucide="check" class="w-4 h-4"></i>Guardar</button>
    </div>
    <div class="card p-6 col-span-2">
      <h4 class="font-semibold text-slate-800 mb-4 text-sm">Historial de Respaldos</h4>` +
    tbl([{ l: 'Fecha', k: 'f' }, { l: 'Hora', k: 'h' }, { l: 'Tamaño', k: 'tam' }, { l: 'Tipo', k: 'tipo' }, { l: 'Estado', k: 'est' }, { l: '', k: 'acc' }], [
      { f: '02/05/2026', h: '23:00', tam: '14.2 MB', tipo: badge('Automático', 'blue'), est: badge('Completado', 'green') },
      { f: '01/05/2026', h: '23:00', tam: '13.9 MB', tipo: badge('Automático', 'blue'), est: badge('Completado', 'green') },
      { f: '30/04/2026', h: '23:00', tam: '13.8 MB', tipo: badge('Automático', 'blue'), est: badge('Completado', 'green') },
      { f: '29/04/2026', h: '11:32', tam: '13.6 MB', tipo: badge('Manual', 'amber'), est: badge('Completado', 'green') },
    ].map(r => ({ ...r, acc: `<button onclick="showToast('Descargando respaldo','info')" class="text-xs text-blue-600 hover:underline font-semibold">Descargar</button>` }))) +
    `</div>
  </div>`;
}

// ── VIEWS MAP ────────────────────────────────────────────────
const VIEWS = {
  'cat-productos': catProductos, 'cat-tipos': catTipos,
  'cat-tasas': catTasas, 'cat-params': catParams,
  'cat-config': catConfig,
  'cli-cliente': cliCliente, 'cli-tomador': cliTomador,
  'cli-conductor': cliConductor, 'cli-vehiculo': cliVehiculo,
  'cot-nueva': cotNueva, 'cot-vehiculo': cotVehiculo,
  'cot-conductor': cotConductor, 'cot-coberturas': cotCoberturas,
  'cot-calculo': cotCalculo,
  'rev-validacion': revValidacion, 'rev-coberturas': revCoberturas,
  'rev-evaluacion': revEvaluacion, 'rev-decision': revDecision,
  'emi-generacion': emiGeneracion, 'emi-numero': emiNumero,
  'emi-planes': emiPlanes, 'emi-recibo': emiRecibo,
  'fac-factura': facFactura, 'fac-impuestos': facImpuestos,
  'fac-pago': facPago, 'fac-registro': facRegistro,
  'ven-venta': venVenta, 'ven-comisiones': venComisiones,
  'ven-metas': venMetas,
  'rep-ventas': repVentas, 'rep-polizas': repPolizas,
  'rep-produccion': repProduccion, 'rep-comisiones': repComisiones,
  'rep-tasas': repTasas,
  'tas-registro': tasRegistro, 'tas-historico': tasHistorico,
  'tas-aplicacion': tasAplicacion,
  'home': viewHome,
  'conf-perfil': confPerfil, 'conf-seguridad': confSeguridad,
  'conf-prefs': confPrefs, 'conf-usuarios': confUsuarios,
  'conf-roles': confRoles, 'conf-empresa': confEmpresa,
  'conf-auditoria': confAuditoria, 'conf-respaldo': confRespaldo,
};

// ── SIDEBAR ──────────────────────────────────────────────────
function renderSidebarNav() {
  const nav = document.getElementById('sidebar-nav');
  if (!nav) return;
  nav.innerHTML = NAV.map(g => {
    const isActive = activeView === g.viewId;
    return `
    <div class="mb-1">
      <button class="group-btn ${isActive ? 'group-btn-active' : ''}" data-view="${g.viewId}">
        <i data-lucide="${g.icon}" class="w-5 h-5 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}"></i>
        <span class="flex-1 leading-tight text-left">${g.label}</span>
      </button>
    </div>`;
  }).join('');

  createIcons({ icons: ALL_ICONS });

  nav.querySelectorAll('[data-view]').forEach(btn => {
    btn.addEventListener('click', () => navigateTo(btn.dataset.view));
  });
}

// ── NAVIGATION ───────────────────────────────────────────────
const ALL_ICONS = {
  BookOpen, Car, FilePlus, ClipboardCheck, ShieldCheck, Receipt,
  TrendingUp, BarChart3, DollarSign, ChevronDown, ChevronRight,
  Layers, FileText, Users, UserCog, Wrench, Tag,
  Hash, Percent, Globe, Wallet, BadgeCheck, ClipboardList,
  FileCheck, Calculator, Building, UserPlus, Truck, Gauge, Settings2,
  Eye, Pencil, Plus, X, Check, AlertCircle, AlertTriangle,
  Clock, RefreshCw, Calendar, Filter, Download, Settings,
  LogOut, Bell, Search, Shield, UserCheck, Building2,
  CheckCircle, Info, Printer, Send, CreditCard,
  User, Home, KeyRound, Monitor, Database, Activity, History, UserX, Power, Plane, Heart, Package, FileSearch
};

function navigateTo(viewId) {
  const item = NAV.find(n => n.viewId === viewId);
  if (!item) return;

  activeView = viewId;
  renderSidebarNav();

  document.getElementById('page-title').textContent = item.label;
  document.getElementById('page-subtitle').textContent = 'Escritorio de Trabajo: Panel de Ventas';

  const area = document.getElementById('content-area');
  if (area) {
    const fn = VIEWS[viewId];
    area.innerHTML = fn ? fn() : `<div class="card p-8 text-center text-slate-400">Vista en construcción: ${viewId}</div>`;
    createIcons({ icons: ALL_ICONS });
    setupTabListeners();
  }
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

window.navigateTo = navigateTo;

// ── TAB HELPER (cat-tipos) ────────────────────────────────────
function setupTabListeners() {
  window.setTab = function (name) {
    ['tipos', 'marcas', 'modelos'].forEach(t => {
      document.getElementById(`tab-${t}-c`)?.classList.toggle('hidden', t !== name);
      const btn = document.getElementById(`tab-btn-${t}`);
      if (btn) { btn.className = t === name ? 'btn-primary text-xs px-3 py-2' : 'btn-secondary text-xs px-3 py-2'; }
    });
  };
}

// ── USER MENU ────────────────────────────────────────────────
function setupUserMenu() {
  document.getElementById('menu-logout')?.addEventListener('click', () => {
    showToast('Sesión cerrada correctamente', 'info');
  });
}

// ── TOAST ────────────────────────────────────────────────────
window.showToast = function (message, type = 'info') {
  const c = document.getElementById('toast-container');
  if (!c) return;
  const colors = { success: 'bg-emerald-600', error: 'bg-rose-600', info: 'bg-blue-600', warning: 'bg-amber-500' };
  const el = document.createElement('div');
  el.className = `pointer-events-auto flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg text-sm font-medium text-white max-w-xs transition-all duration-300 opacity-0 translate-y-2 ${colors[type] || colors.info}`;
  el.textContent = message;
  c.appendChild(el);
  requestAnimationFrame(() => el.classList.remove('opacity-0', 'translate-y-2'));
  setTimeout(() => { el.classList.add('opacity-0', 'translate-y-2'); setTimeout(() => el.remove(), 300); }, 3200);
};

// ── INIT ─────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  createIcons({ icons: ALL_ICONS });
  renderSidebarNav();
  setupUserMenu();
  setupTabListeners();
  navigateTo('home');
});
