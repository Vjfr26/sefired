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
  UserX, Power, Plane, Heart, Package, FileSearch, Menu,
  ArrowLeft, ArrowRight,
  Lock, LockOpen, Trash2
} from 'lucide';

// ── NAV CONFIG ──────────────────────────────────────────────
const NAV = [
  { id: 'home', label: 'Inicio', icon: 'home', viewId: 'home' },
  { id: 'cotizaciones', label: 'Simulador', icon: 'calculator', viewId: 'cot-simulador' },
  { id: 'productos', label: 'Productos', icon: 'package', viewId: 'cat-productos' },
  { id: 'usuarios', label: 'Usuarios', icon: 'user-cog', viewId: 'usr-lista' },
  { id: 'clientes', label: 'Clientes & Pólizas', icon: 'users', viewId: 'cli-cliente' },
  { id: 'vehiculos', label: 'Vehículos', icon: 'car', viewId: 'cli-vehiculo' },
  { id: 'reportes', label: 'Reportes', icon: 'bar-chart-3', viewId: 'rep-menu' },
  { id: 'tasas', label: 'Tasa del Día', icon: 'dollar-sign', viewId: 'tas-registro' },
  { id: 'config', label: 'Configuración', icon: 'settings', viewId: 'conf-menu' },
];

const VIEW_META = {
  'home': { navId: 'home', title: 'Inicio', sub: 'Cotizador de Seguros J&M' },
  'cat-productos': { navId: 'productos', title: 'Productos', sub: 'Catálogo de coberturas y servicios' },
  'cli-cliente': { navId: 'clientes', title: 'Clientes & Pólizas', sub: 'Gestión de clientes, pólizas y renovaciones' },
  'cli-vehiculo': { navId: 'vehiculos', title: 'Vehículos', sub: 'Registro y consulta de vehículos asegurados' },
  'cot-simulador': { navId: 'cotizaciones', title: 'Simulador', sub: 'Simulador de cotizaciones de seguros vehiculares' },
  'rep-menu': { navId: 'reportes', title: 'Reportes', sub: 'Generación y exportación de reportes' },
  'tas-registro': { navId: 'tasas', title: 'Tasas del Día', sub: 'Registro de tasas BCV — Dólar y Euro' },
  'usr-lista': { navId: 'usuarios', title: 'Usuarios', sub: 'Gestión de usuarios, roles y permisos' },
  'conf-menu': { navId: 'config', title: 'Configuración', sub: 'Ajustes, seguridad y auditoría del sistema' },
};

// ── STATE ────────────────────────────────────────────────────
let activeNavId = 'home';
let activeView = 'home';

// ── HELPERS ──────────────────────────────────────────────────
const usd = n => '$' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const bs = (n, r = 38.54) => 'Bs. ' + (n * r).toLocaleString('es-VE', { minimumFractionDigits: 2 });

function badge(text, color = 'slate') {
  return `<span class="badge badge-${color}">${text}</span>`;
}
const STATUS_COLOR = {
  'Activo': 'green', 'Activa': 'green', 'Vigente': 'green', 'Emitida': 'green', 'Aprobado': 'green', 'Cobrado': 'green',
  'Pagada': 'green', 'Pagado': 'green', 'Completado': 'green', 'Completada': 'green', 'Cumplida': 'green', 'Generado': 'green',
  'Inactivo': 'slate', 'Vencida': 'slate', 'Cerrado': 'slate', 'Cancelada': 'slate',
  'Pendiente': 'amber', 'En Revisión': 'amber', 'Por Vencer': 'amber', 'Parcial': 'amber',
  'Rechazado': 'red', 'Anulada': 'red', 'Bloqueado': 'red', 'En riesgo': 'red',
  'Asignado': 'blue', 'En Proceso': 'blue', 'Generada': 'blue', 'En curso': 'blue',
};
const sbadge = s => badge(s, STATUS_COLOR[s] || 'slate');
const STATUS_ICON = { green: 'check-circle', amber: 'clock', red: 'alert-circle', blue: 'check-circle', indigo: 'check-circle', slate: 'alert-circle' };
const STATUS_ICONCLS = { green: 'text-emerald-500', amber: 'text-amber-500', red: 'text-rose-500', blue: 'text-blue-500', indigo: 'text-indigo-500', slate: 'text-slate-400' };
const rsbadge = s => {
  const col = STATUS_COLOR[s] || 'slate';
  return `<span class="hidden sm:inline">${sbadge(s)}</span><span class="sm:hidden flex items-center justify-center"><i data-lucide="${STATUS_ICON[col]}" class="w-4 h-4 ${STATUS_ICONCLS[col]}" title="${s}"></i></span>`;
};

const actions = (name = 'este registro') => `
  <div class="flex gap-1 justify-center flex-nowrap max-w-none">
    <button onclick="showEditForm('Editar registro','<div class=\\'field-label\\'>Nombre</div><input class=\\'input-field sm:col-span-2\\' value=\\'${name}\\'>')"
      class="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition" title="Editar">
      <i data-lucide="pencil" class="w-4 h-4"></i>
    </button>
    <button onclick="showConfirmDelete('${name}')"
      class="p-2 rounded-lg bg-rose-50 text-rose-500 hover:bg-rose-100 transition" title="Eliminar">
      <i data-lucide="trash-2" class="w-4 h-4"></i>
    </button>
  </div>`;

function tbl(cols, rows, footer = '', id = '') {
  const HIDE = { sm: 'hidden sm:table-cell', md: 'hidden md:table-cell', lg: 'hidden lg:table-cell' };
  const thCls = c => `th-cell ${c.r ? 'text-right' : 'text-left'}${c.hide ? ' ' + HIDE[c.hide] : ''}`;
  const tdCls = c => `td-cell${c.r ? ' text-right' : ''}${c.m ? ' font-mono text-xs' : ''}${c.nw ? ' whitespace-nowrap' : ''}${c.hide ? ' ' + HIDE[c.hide] : ''}${c.tr ? ' max-w-0' : ''}${c.acc ? ' whitespace-nowrap !overflow-visible' : ''}`;
  const cell = (c, val) => c.tr ? `<span class="break-words">${val}</span>` : val;
  const head = cols.map(c => `<th class="${thCls(c)}">${c.l}</th>`).join('');
  const body = rows.map((r, i) =>
    `<tr data-row="${i}" class="hover:bg-slate-50/80 transition-colors">${cols.map(c => `<td class="${tdCls(c)}">${cell(c, r[c.k] ?? '—')}</td>`).join('')}</tr>`
  ).join('');
  return `<div class="card overflow-hidden mx-2 sm:mx-0 px-3 sm:px-0"${id ? ` id="${id}"` : ''}>
    <div class="overflow-x-auto">
      <table class="w-full text-sm">
        <thead class="bg-slate-100 text-slate-600 text-xs font-semibold uppercase tracking-wider"><tr>${head}</tr></thead>
        <tbody class="divide-y divide-slate-100">${body || '<tr><td colspan="99" class="td-cell text-center text-slate-400">Sin registros</td></tr>'}</tbody>
      </table>
    </div>
    <div class="px-5 py-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
      <span>${rows.length} registros</span>${footer}
    </div>
  </div>`;
}

function searchBar(id, ph, extra = '', tblId = '') {
  return `<div class="card p-3.5 mb-4 flex flex-wrap items-center gap-3">
    <div class="relative flex-1 min-w-44">
      <input id="${id}" type="text" placeholder="${ph}"${tblId ? ` data-search-target="${tblId}"` : ''} class="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition">
      <i data-lucide="search" class="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"></i>
    </div>${extra ? `<div class="flex flex-wrap items-center gap-2 sm:ml-auto w-full sm:w-auto">${extra}</div>` : ''}</div>`;
}

function formGrid(fields) {
  return fields.map(f => `
    <div class="${f.span ? 'sm:col-span-2' : ''}">
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
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">${formGrid(fields)}</div>
    ${extra}
    <button onclick="${action}" class="btn-primary mt-2 w-full sm:w-auto"><i data-lucide="check" class="w-4 h-4"></i>${btn}</button>
  </div>`;
}

function sectionTop(btn = '', btn2 = '') {
  return `<div class="flex flex-wrap items-center justify-end gap-3 mb-5">${btn}${btn2}</div>`;
}

// ── SIMULADOR — Estado y helpers ──────────────────────────────

let simState = {
  tipo: 'particular',
  placa: '', marca: 'Toyota', modelo: '', año: '2022', color: '', uso: 'Particular', valor: 15000,
  nombre: '', ci: '', tel: '', email: '',
  coberturas: {
    'CASCO-PT': { nom: 'Casco Pérdida Total', prima: 270, tasa: '1.80% del valor', chk: false, req: false, desc: 'Pérdida total irrecuperable del vehículo' },
    'CASCO-PP': { nom: 'Casco Pérdida Parcial', prima: 120, tasa: '0.80% del valor', chk: false, req: false, desc: 'Daños físicos reparables al vehículo' },
    'ROBO': { nom: 'Robo y Hurto', prima: 90, tasa: '0.60% del valor', chk: false, req: false, desc: 'Robo total o parcial del vehículo' },
    'AP': { nom: 'Acc. Personales', prima: 48, tasa: '$12.00/ocupante', chk: false, req: false, desc: '4 ocupantes · $10,000 c/u suma asegurada' },
    'RC-OBL': { nom: 'RC Obligatoria', prima: 4.50, tasa: 'UT × Factor', chk: true, req: true, desc: 'Obligatoria por Ley SUDEASEG' },
    'RCV': { nom: 'RC Voluntaria', prima: 45, tasa: '0.15% de suma', chk: false, req: false, desc: 'Responsabilidad civil voluntaria ampliada' },
    'ASIST': { nom: 'Asistencia en Carretera', prima: 8, tasa: 'Tarifa fija anual', chk: false, req: false, desc: 'Grúa, batería, llantas y emergencias viales' },
  },
};

function simBar(active) {
  const steps = [
    { label: 'Vehículo', icon: 'car' },
    { label: 'Tomador', icon: 'user' },
    { label: 'Coberturas', icon: 'shield' },
    { label: 'Resultado', icon: 'file-check' },
  ];
  return `<div class="flex items-center select-none">${steps.map((s, i) => {
    const n = i + 1, done = n < active, cur = n === active;
    const dot = `<div class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all ${done ? 'bg-emerald-500 text-white'
        : cur ? 'bg-jm-blue text-white shadow-[0_0_0_4px_rgba(0,20,99,0.15)]'
          : 'bg-slate-100 text-slate-400'
      }">${done ? '<i data-lucide="check" class="w-3.5 h-3.5"></i>' : n}</div>`;
    const lbl = `<p class="text-[9px] font-bold mt-1 text-center leading-tight ${done ? 'text-emerald-500' : cur ? 'text-jm-blue' : 'text-slate-400'
      }">${s.label}</p>`;
    const line = i < steps.length - 1
      ? `<div class="flex-1 h-0.5 mb-5 mx-1 transition-colors ${done ? 'bg-emerald-400' : 'bg-slate-200'}"></div>`
      : '';
    return `<div class="flex flex-col items-center" style="flex:0 0 4.5rem">${dot}${lbl}</div>${line}`;
  }).join('')
    }</div>`;
}

function simModal(step, body, footer, wide = false) {
  const box = document.getElementById('modal-box');
  box.className = `bg-white rounded-3xl shadow-2xl w-full ${wide ? 'max-w-xl' : 'max-w-lg'} max-h-[90vh] overflow-y-auto`;
  box.innerHTML = `
    <div class="px-6 sm:px-8 pt-6 pb-5 border-b border-slate-100">
      <div class="flex items-start justify-between gap-3 mb-5">
        <div class="flex items-center gap-3 min-w-0">
          <div class="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0" style="background:linear-gradient(135deg,#001463,#000c3b)">
            <i data-lucide="calculator" class="w-5 h-5 text-white"></i>
          </div>
          <div class="min-w-0">
            <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">J&M · Seguros Vehiculares</p>
            <h3 class="text-lg font-black text-slate-800 mt-0.5">Simulador de Prima</h3>
          </div>
        </div>
        <button onclick="closeModal()" class="p-1.5 hover:bg-slate-100 rounded-xl transition shrink-0 mt-1">
          <i data-lucide="x" class="w-5 h-5 text-slate-500"></i>
        </button>
      </div>
      ${simBar(step)}
    </div>
    <div class="p-6 sm:p-8">
      ${body}
      ${footer ? `<div class="flex flex-wrap gap-3 justify-between items-center mt-6 pt-5 border-t border-slate-100">${footer}</div>` : ''}
    </div>`;
  document.getElementById('modal-overlay').classList.remove('hidden');
  createIcons({ icons: ALL_ICONS });
}

// ── VIEWS ────────────────────────────────────────────────────

// 1. CATÁLOGOS Y PARÁMETROS
function catProductos() {
  const rows = [
    { cod: 'AP', nom: 'Accidentes Personales', tipo: 'Personas', tasa: '$12.00/occ', desc: 'Por ocupante del vehículo', est: rsbadge('Activo') },
    { cod: 'RCV', nom: 'Resp. Civil Voluntaria', tipo: 'Responsabilidad', tasa: 'Variable', desc: 'Suma asegurada a convenir', est: rsbadge('Activo') },
    { cod: 'CASCO-PT', nom: 'Casco Pérdida Total', tipo: 'Vehículo', tasa: '1.80 %', desc: 'Valor de mercado del vehículo', est: rsbadge('Activo') },
    { cod: 'CASCO-PP', nom: 'Casco Pérdida Parcial', tipo: 'Vehículo', tasa: '0.80 %', desc: 'Daños físicos reparables', est: rsbadge('Activo') },
    { cod: 'ROBO', nom: 'Robo y Hurto', tipo: 'Vehículo', tasa: '0.60 %', desc: 'Robo total o parcial', est: rsbadge('Activo') },
    { cod: 'RC-OBL', nom: 'RC Obligatoria', tipo: 'Responsabilidad', tasa: 'UT × Factor', desc: 'Obligatoria SUDEASEG', est: rsbadge('Activo') },
    { cod: 'ASIST', nom: 'Asistencia en Carretera', tipo: 'Servicio', tasa: '$8.00/año', desc: 'Grúa, batería, llantas', est: rsbadge('Activo') },
  ];

  const prodEditBtn = (r) => `<button onclick="showEditForm('Editar Cobertura','<div class=\\'grid grid-cols-1 sm:grid-cols-2 gap-4\\'><div><label class=\\'field-label\\'>Código</label><input class=\\'input-field\\' value=\\'${r.cod}\\'></div><div><label class=\\'field-label\\'>Nombre</label><input class=\\'input-field\\' value=\\'${r.nom}\\'></div><div><label class=\\'field-label\\'>Tipo</label><input class=\\'input-field\\' value=\\'${r.tipo}\\'></div><div><label class=\\'field-label\\'>Tasa</label><input class=\\'input-field\\' value=\\'${r.tasa}\\'></div><div class=\\'sm:col-span-2\\'><label class=\\'field-label\\'>Descripción</label><input class=\\'input-field\\' value=\\'${r.desc}\\'></div></div>')" class="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition" title="Editar"><i data-lucide="pencil" class="w-4 h-4"></i></button>`;

  return searchBar('s-prod', 'Buscar cobertura o código…',
    `<select class="text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500" data-filter-target="tbl-productos" data-filter-col="2">
      <option value="">Todos los tipos</option>
      <option>Personas</option>
      <option>Vehículo</option>
      <option>Responsabilidad</option>
      <option>Servicio</option>
    </select>
    <button onclick="showEditForm('Nueva Cobertura','<div class=\\'grid grid-cols-1 sm:grid-cols-2 gap-4\\'><div><label class=\\'field-label\\'>Código</label><input class=\\'input-field\\' placeholder=\\'COD\\'></div><div><label class=\\'field-label\\'>Nombre</label><input class=\\'input-field\\' placeholder=\\'Nombre de cobertura\\'></div><div><label class=\\'field-label\\'>Tipo</label><input class=\\'input-field\\' placeholder=\\'Tipo\\'></div><div><label class=\\'field-label\\'>Tasa</label><input class=\\'input-field\\' placeholder=\\'0.00%\\'></div><div class=\\'sm:col-span-2\\'><label class=\\'field-label\\'>Descripción</label><input class=\\'input-field\\' placeholder=\\'Descripción\\'></div></div>')" class="btn-primary ml-auto"><i data-lucide="plus" class="w-4 h-4"></i>Agregar</button>`,
    'tbl-productos') +
    tbl([
      { l: 'Código', k: 'cod', m: true, hide: 'lg' }, { l: 'Nombre', k: 'nom', tr: true }, { l: 'Tipo', k: 'tipo', hide: 'sm' },
      { l: 'Prima / Tasa', k: 'tasa', r: true, hide: 'md' }, { l: 'Descripción', k: 'desc', hide: 'lg', tr: true }, { l: 'Estado', k: 'est' },
      { l: '', k: 'acc', acc: true },
    ], rows.map(r => ({ ...r, acc: `<div class="flex gap-1 justify-center flex-nowrap max-w-none">${prodEditBtn(r)}<button onclick="showConfirmDelete('${r.nom}')" class="p-2 rounded-lg bg-rose-50 text-rose-500 hover:bg-rose-100 transition" title="Eliminar"><i data-lucide="trash-2" class="w-4 h-4"></i></button></div>` })), '', 'tbl-productos');
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
  return `<div class="flex flex-wrap gap-2 mb-4" id="tab-tipos">
    <button onclick="setTab('tipos')" class="btn-primary text-xs px-3 py-2 shrink-0" id="tab-btn-tipos">Tipos</button>
    <button onclick="setTab('marcas')" class="btn-secondary text-xs px-3 py-2 shrink-0" id="tab-btn-marcas">Marcas</button>
    <button onclick="setTab('modelos')" class="btn-secondary text-xs px-3 py-2 shrink-0" id="tab-btn-modelos">Modelos</button>
    <button onclick="showToast('Nuevo registro','info')" class="btn-primary ml-auto shrink-0"><i data-lucide="plus" class="w-4 h-4"></i>Nuevo</button>
  </div>
  <div id="tab-tipos-c">${tbl([{ l: 'Código', k: 'tip', m: true }, { l: 'Nombre', k: 'nom' }, { l: 'Uso', k: 'uso', hide: 'sm' }, { l: '', k: 'acc', acc: true }], tipos.map(r => ({ ...r, acc: actions() })))}</div>
  <div id="tab-marcas-c" class="hidden">${tbl([{ l: 'Marca', k: 'mar' }, { l: '', k: 'acc', acc: true }], marcas.map(r => ({ ...r, acc: actions() })))}</div>
  <div id="tab-modelos-c" class="hidden">${tbl([{ l: 'Modelo', k: 'mod' }, { l: 'Marca', k: 'marc' }, { l: 'Años', k: 'año', hide: 'sm' }, { l: '', k: 'acc', acc: true }], modelos.map(r => ({ ...r, acc: actions() })))}</div>`;
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
  return `<div class="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-6">
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
  <div class="flex flex-wrap justify-between items-center gap-3 mb-4">
    <h4 class="font-semibold text-slate-700">Tasas Base por Cobertura</h4>
    <button onclick="showToast('Editando tasas','info')" class="btn-primary text-xs px-3 py-2"><i data-lucide="pencil" class="w-4 h-4"></i>Editar</button>
  </div>` +
    tbl([{ l: 'Código', k: 'cob', m: true, hide: 'lg' }, { l: 'Cobertura', k: 'nom', tr: true }, { l: 'Tasa Base', k: 'base', r: true }, { l: 'Mínimo', k: 'min', r: true, hide: 'md' }, { l: 'Máximo', k: 'max', r: true, hide: 'md' }, { l: 'Unidad', k: 'und', hide: 'sm' }, { l: '', k: 'acc', acc: true }],
      rows.map(r => ({ ...r, acc: actions() })));
}

function catParams() {
  return `<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          ${formGrid([
    { label: 'Ocupantes por defecto', val: '4', type: 'number' },
    { label: 'Uso del vehículo', type: 'select', opts: ['Particular', 'Comercial'] },
    { label: 'Suma AP por ocupante', val: '10000', type: 'number' },
  ])}
        </div>
      </div>
      <div class="card p-5">
        <h4 class="font-semibold text-slate-700 mb-3 text-sm">Numeración de Pólizas</h4>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
    { label: 'Razón Social', val: 'la Venezolana de seguros y Vida C.A.', span: true },
    { label: 'RIF', val: 'J-30012345-6' },
    { label: 'Regulador', val: 'SUDEASEG', ro: true },
    { label: 'Dirección', val: 'Av. Principal, Caracas', span: true },
    { label: 'Teléfono', val: '+58 212-555-0100' },
    { label: 'Email', val: 'info@jandm.com' },
    { label: 'Moneda Base', val: 'USD', ro: true },
    { label: 'País', val: 'Venezuela', ro: true },
  ], 'Guardar Configuración');
}

// 2. CLIENTES Y VEHÍCULOS
function cliCliente() {
  const rows = [
    { id: 'CLI-0001', nom: 'Carlos Eduardo Rodríguez García', ci: 'V-12.345.678', tel: '+58 414-123-4567', email: 'c.rodriguez@gmail.com', est: rsbadge('Activo'), pol: 'SEF-2026-VEH-00848', vig: '03/05/2026 – 03/05/2027', prima: '$622.70' },
    { id: 'CLI-0002', nom: 'María Alejandra González Pérez', ci: 'V-11.234.567', tel: '+58 424-234-5678', email: 'm.gonzalez@gmail.com', est: rsbadge('Activo'), pol: 'SEF-2026-VEH-00847', vig: '01/05/2026 – 01/05/2027', prima: '$784.20' },
    { id: 'CLI-0003', nom: 'José Luis Martínez Hernández', ci: 'V-10.345.678', tel: '+58 416-345-6789', email: 'j.martinez@hotmail.com', est: rsbadge('Activo'), pol: 'SEF-2026-VEH-00846', vig: '30/04/2026 – 30/04/2027', prima: '$1,240.00' },
    { id: 'CLI-0004', nom: 'Ana Carolina López Ramírez', ci: 'V-13.456.789', tel: '+58 412-456-7890', email: 'a.lopez@outlook.com', est: rsbadge('Activo'), pol: 'SEF-2026-VEH-00845', vig: '29/04/2026 – 29/04/2027', prima: '$540.00' },
    { id: 'CLI-0005', nom: 'Pedro Antonio Díaz Morales', ci: 'J-30.567.890', tel: '+58 414-567-8901', email: 'pdiaz@empresa.com', est: rsbadge('Activo'), pol: 'SEF-2025-VEH-00780', vig: '28/04/2025 – 28/04/2026', prima: '$487.00' },
    { id: 'CLI-0006', nom: 'Sofía Isabel Torres Vargas', ci: 'V-14.678.901', tel: '+58 424-678-9012', email: 's.torres@gmail.com', est: rsbadge('Inactivo'), pol: '—', vig: '—', prima: '—' },
    { id: 'CLI-0007', nom: 'Luis Fernando Castillo Medina', ci: 'J-20.789.012', tel: '+58 416-789-0123', email: 'lcastillo@corp.com', est: rsbadge('Activo'), pol: 'SEF-2026-VEH-00844', vig: '28/04/2026 – 28/04/2027', prima: '$620.80' },
    { id: 'CLI-0008', nom: 'Valentina Beatriz Ramos Soto', ci: 'V-15.890.123', tel: '+58 412-890-1234', email: 'v.ramos@gmail.com', est: rsbadge('Activo'), pol: 'SEF-2026-VEH-00843', vig: '27/04/2026 – 27/04/2027', prima: '$555.00' },
  ];

  // Register client data globally for the modal
  window._clientData = {};
  rows.forEach(r => { window._clientData[r.id] = r; });

  window.showRenovarModal = function (id) {
    const c = window._clientData[id];
    if (!c) return;
    showModal(
      'Renovar Póliza',
      `<div class="space-y-3 text-sm">
        <div class="flex justify-between py-2 border-b border-slate-100"><span class="text-slate-500">Cliente</span><span class="font-semibold">${c.nom}</span></div>
        <div class="flex justify-between py-2 border-b border-slate-100"><span class="text-slate-500">Póliza</span><span class="font-mono font-semibold text-blue-700">${c.pol}</span></div>
        <div class="flex justify-between py-2 border-b border-slate-100"><span class="text-slate-500">Vigencia actual</span><span class="font-semibold">${c.vig}</span></div>
        <div class="flex justify-between py-2"><span class="text-slate-500">Prima</span><span class="font-bold text-emerald-700">${c.prima}</span></div>
        <div class="mt-4 p-3 bg-amber-50 rounded-xl text-xs text-amber-700">Se generará una nueva póliza con las mismas coberturas por un año adicional.</div>
      </div>`,
      `<button onclick="closeModal()" class="btn-secondary">Cancelar</button>
       <button onclick="closeModal();showToast('Póliza renovada correctamente','success')" class="btn-success"><i data-lucide="refresh-cw" class="w-4 h-4"></i>Confirmar Renovación</button>`
    );
  };

  const rowsWithAcc = rows.map(r => ({
    ...r,
    est: rsbadge(r.est.replace(/<[^>]+>/g, '').trim()),
    acc: `<div class="grid grid-cols-3 gap-1 items-center justify-center">
      <button onclick="showEditForm('Editar Cliente','<div class=\\'grid grid-cols-1 sm:grid-cols-2 gap-4\\'><div><label class=\\'field-label\\'>Nombre</label><input class=\\'input-field\\' value=\\'${r.nom.replace(/'/g, "\\'")}\\' ></div><div><label class=\\'field-label\\'>CI / RIF</label><input class=\\'input-field\\' value=\\'${r.ci}\\'></div><div><label class=\\'field-label\\'>Teléfono</label><input class=\\'input-field\\' value=\\'${r.tel}\\'></div><div><label class=\\'field-label\\'>Email</label><input class=\\'input-field\\' value=\\'${r.email}\\'></div></div>')" class="p-1.5 sm:p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition inline-flex items-center justify-center" title="Editar"><i data-lucide="pencil" class="w-3.5 h-3.5 sm:w-4 sm:h-4"></i></button>
      <button onclick="showRenovarModal('${r.id}')" class="p-1.5 sm:p-2 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition inline-flex items-center justify-center" title="Renovar"><i data-lucide="refresh-cw" class="w-3.5 h-3.5 sm:w-4 sm:h-4"></i></button>
      <button onclick="showConfirmDelete('${r.nom}')" class="p-1.5 sm:p-2 rounded-lg bg-rose-50 text-rose-500 hover:bg-rose-100 transition inline-flex items-center justify-center" title="Eliminar"><i data-lucide="trash-2" class="w-3.5 h-3.5 sm:w-4 sm:h-4"></i></button>
    </div>`
  }));

  return searchBar('s-cli', 'Buscar por nombre, CI/RIF o email…',
    `<button onclick="showPdfClientes()" class="btn-secondary"><i data-lucide="printer" class="w-4 h-4"></i>Imprimir</button>
    <button onclick="showEditForm('Nuevo Cliente','<div class=\\'grid grid-cols-1 sm:grid-cols-2 gap-4\\'><div><label class=\\'field-label\\'>Nombre completo</label><input class=\\'input-field\\' placeholder=\\'Nombre Apellido\\'></div><div><label class=\\'field-label\\'>CI / RIF</label><input class=\\'input-field\\' placeholder=\\'V-00.000.000\\'></div><div><label class=\\'field-label\\'>Teléfono</label><input class=\\'input-field\\' placeholder=\\'+58 414-000-0000\\'></div><div><label class=\\'field-label\\'>Email</label><input class=\\'input-field\\' placeholder=\\'correo@ejemplo.com\\'></div></div>')" class="btn-primary ml-auto"><i data-lucide="user-plus" class="w-4 h-4"></i>Agregar Cliente</button>`,
    'tbl-clientes') +
    tbl([
      { l: 'ID', k: 'id', m: true, hide: 'lg' }, { l: 'Nombre Completo', k: 'nom', tr: true }, { l: 'CI / RIF', k: 'ci', m: true, hide: 'sm' },
      { l: 'Teléfono', k: 'tel', hide: 'md' }, { l: 'Email', k: 'email', hide: 'lg', tr: true }, { l: 'Estado', k: 'est' }, { l: '', k: 'acc', acc: true }
    ], rowsWithAcc, '', 'tbl-clientes');
}

function cliTomador() {
  return searchBar('s-tom', 'Buscar tomador…',
    `<button onclick="showToast('Nuevo tomador','info')" class="btn-primary ml-auto"><i data-lucide="plus" class="w-4 h-4"></i>Nuevo Tomador</button>`,
    'tbl-tomadores') +
    tbl([{ l: 'CI/RIF', k: 'ci', m: true, hide: 'sm' }, { l: 'Nombre', k: 'nom', tr: true }, { l: 'Dirección', k: 'dir', hide: 'lg', tr: true }, { l: 'Teléfono', k: 'tel', hide: 'md' }, { l: 'Estado', k: 'est' }, { l: '', k: 'acc', acc: true }], [
      { ci: 'V-12.345.678', nom: 'Carlos E. Rodríguez', dir: 'Urb. Las Mercedes, Caracas', tel: '+58 414-123-4567', est: rsbadge('Activo') },
      { ci: 'V-11.234.567', nom: 'María A. González', dir: 'La California Norte, Caracas', tel: '+58 424-234-5678', est: rsbadge('Activo') },
      { ci: 'J-20.789.012', nom: 'Castillo Medina C.A.', dir: 'Av. Libertador, Caracas', tel: '+58 416-789-0123', est: rsbadge('Activo') },
      { ci: 'V-13.456.789', nom: 'Ana C. López Ramírez', dir: 'El Cafetal, Miranda', tel: '+58 412-456-7890', est: rsbadge('Activo') },
    ].map(r => ({ ...r, acc: actions(r.nom) })), '', 'tbl-tomadores');
}

function cliConductor() {
  return searchBar('s-cond', 'Buscar conductor…',
    `<button onclick="showToast('Nuevo conductor','info')" class="btn-primary ml-auto"><i data-lucide="plus" class="w-4 h-4"></i>Nuevo Conductor</button>`,
    'tbl-conductores') +
    tbl([{ l: 'CI', k: 'ci', m: true, hide: 'sm' }, { l: 'Nombre', k: 'nom', tr: true }, { l: 'Licencia', k: 'lic', hide: 'md' }, { l: 'Categoría', k: 'cat', hide: 'sm' }, { l: 'Vencimiento', k: 'venc', hide: 'md' }, { l: 'Estado', k: 'est' }, { l: '', k: 'acc', acc: true }], [
      { ci: 'V-12.345.678', nom: 'Carlos E. Rodríguez', lic: '12345678', cat: '3ra', venc: '15/06/2028', est: rsbadge('Activo') },
      { ci: 'V-11.234.567', nom: 'María A. González', lic: '11234567', cat: '3ra', venc: '22/09/2027', est: rsbadge('Activo') },
      { ci: 'V-10.345.678', nom: 'José L. Martínez', lic: '10345678', cat: '4ta', venc: '10/03/2026', est: rsbadge('Por Vencer') },
      { ci: 'V-15.890.123', nom: 'Valentina B. Ramos', lic: '15890123', cat: '3ra', venc: '05/11/2029', est: rsbadge('Activo') },
      { ci: 'V-16.901.234', nom: 'Ricardo A. Moreno', lic: '16901234', cat: '3ra', venc: '18/08/2027', est: rsbadge('Activo') },
    ].map(r => ({ ...r, acc: actions(r.nom) })), '', 'tbl-conductores');
}

function cliVehiculo() {
  const MARCAS = ['Toyota', 'Chevrolet', 'Ford', 'Hyundai', 'Kia', 'Jeep', 'Nissan', 'Honda', 'Renault', 'Mazda', 'Volkswagen', 'Mitsubishi', 'Otro'];
  const TIPOS = ['Sedán', 'SUV / Rústico', 'Camioneta', 'Comercial', 'Motocicleta'];
  const AÑOS = Array.from({ length: 14 }, (_, i) => 2025 - i);

  const vehicles = [
    { placa: 'ABC-123', marca: 'Toyota', modelo: 'Corolla', año: 2022, color: 'Blanco', tipo: 'Sedán', prop: 'C. Rodríguez', est: 'Activo' },
    { placa: 'XYZ-456', marca: 'Ford', modelo: 'Explorer', año: 2020, color: 'Negro', tipo: 'SUV / Rústico', prop: 'M. González', est: 'Activo' },
    { placa: 'DEF-789', marca: 'Chevrolet', modelo: 'Spark', año: 2019, color: 'Rojo', tipo: 'Sedán', prop: 'J. Martínez', est: 'Activo' },
    { placa: 'GHI-321', marca: 'Hyundai', modelo: 'Tucson', año: 2021, color: 'Plata', tipo: 'SUV / Rústico', prop: 'A. López', est: 'Activo' },
    { placa: 'JKL-654', marca: 'Kia', modelo: 'Sportage', año: 2023, color: 'Azul', tipo: 'SUV / Rústico', prop: 'L. Castillo', est: 'Activo' },
    { placa: 'MNO-987', marca: 'Nissan', modelo: 'Sentra', año: 2018, color: 'Gris', tipo: 'Sedán', prop: 'V. Ramos', est: 'Activo' },
  ];

  const vehAcc = r => `
    <div class="flex gap-1 justify-center flex-nowrap max-w-none">
      <button onclick="showEditVehModal('${r.placa}','${r.marca}','${r.modelo}','${r.año}','${r.color}','${r.tipo}','${r.prop}','${r.est}')"
        class="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition inline-flex items-center justify-center" title="Editar">
        <i data-lucide="pencil" class="w-4 h-4"></i>
      </button>
      <button onclick="showDeleteVeh('${r.placa}')"
        class="p-2 rounded-lg bg-rose-50 text-rose-500 hover:bg-rose-100 transition inline-flex items-center justify-center" title="Eliminar">
        <i data-lucide="trash-2" class="w-4 h-4"></i>
      </button>
    </div>`;

  return searchBar('s-veh', 'Buscar por placa, marca o propietario…',
    `<select class="text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 min-w-[150px]" data-filter-target="tbl-vehiculos" data-filter-col="4">
      <option value="">Todos los tipos</option>
      ${TIPOS.map(t => `<option>${t}</option>`).join('')}
    </select>
    <button onclick="showNewVehModal()" class="btn-primary"><i data-lucide="plus" class="w-4 h-4"></i>Registrar</button>`,
    'tbl-vehiculos') +
    tbl([
      { l: 'Placa', k: 'placa', m: true, hide: 'sm' },
      { l: 'Marca / Modelo', k: 'disp', tr: true },
      { l: 'Año', k: 'año', r: true, hide: 'sm' },
      { l: 'Color', k: 'color', hide: 'lg' },
      { l: 'Tipo', k: 'tipo', hide: 'md' },
      { l: 'Propietario', k: 'prop', hide: 'md', tr: true },
      { l: 'Estado', k: 'est' },
      { l: '', k: 'acc', acc: true },
    ], vehicles.map(r => ({ ...r, disp: r.marca + ' ' + r.modelo, est: rsbadge(r.est), acc: vehAcc(r) })),
      '', 'tbl-vehiculos');
}

// ── SIMULADOR — Paso 1: Tipo + Vehículo ───────────────────────
window.simIniciar = function () {
  simState = {
    tipo: 'particular', placa: '', marca: 'Toyota', modelo: '', año: '2022', color: '', uso: 'Particular', valor: 15000,
    nombre: '', ci: '', tel: '', email: '',
    coberturas: Object.fromEntries(
      Object.entries(simState.coberturas).map(([k, v]) => [k, { ...v, chk: v.req }])
    ),
  };
  const tipos = [
    { val: 'particular', icon: 'car', label: 'Particular', desc: 'Uso personal o familiar' },
    { val: 'comercial', icon: 'truck', label: 'Comercial', desc: 'Carga o transporte' },
    { val: 'flota', icon: 'layers', label: 'Flota', desc: 'Múltiples unidades' },
  ];
  const tipoCard = t => {
    const on = simState.tipo === t.val;
    return `<button onclick="simTipo('${t.val}')" id="sim-t-${t.val}"
      class="flex flex-col items-center gap-2 p-3.5 rounded-2xl border-2 transition-all text-center ${on ? 'border-jm-blue bg-blue-50/50' : 'border-slate-200 hover:border-slate-300'}">
      <div class="w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${on ? 'bg-jm-blue' : 'bg-slate-100'}">
        <i data-lucide="${t.icon}" class="w-4 h-4 ${on ? 'text-white' : 'text-slate-500'}"></i>
      </div>
      <div>
        <p class="text-xs font-bold ${on ? 'text-jm-blue' : 'text-slate-700'}">${t.label}</p>
        <p class="text-[9px] leading-tight mt-0.5 ${on ? 'text-blue-400' : 'text-slate-400'}">${t.desc}</p>
      </div>
    </button>`;
  };
  const secHeader = (icon, label, color = 'slate') => `
    <div class="flex items-center gap-2 mb-3 mt-5">
      <div class="w-4 h-4 rounded-md ${color === 'amber' ? 'bg-amber-50' : 'bg-slate-100'} flex items-center justify-center shrink-0">
        <i data-lucide="${icon}" class="w-2.5 h-2.5 ${color === 'amber' ? 'text-amber-600' : 'text-slate-500'}"></i>
      </div>
      <span class="text-[10px] font-bold ${color === 'amber' ? 'text-amber-600' : 'text-slate-400'} uppercase tracking-widest">${label}</span>
    </div>`;
  const body = `
    <div class="mb-1">
      <div class="flex items-center gap-2 mb-3">
        <span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tipo de póliza</span>
      </div>
      <div id="sim-tipos" class="grid grid-cols-3 gap-2">${tipos.map(tipoCard).join('')}</div>
    </div>
    ${secHeader('car', 'Identificación del vehículo')}
    <div class="grid grid-cols-2 gap-3">
      <div>
        <label class="field-label">Placa <span class="text-rose-500">*</span></label>
        <input id="sim-placa" class="input-field font-mono uppercase" placeholder="ABC-123" value="${simState.placa}" maxlength="8" oninput="this.value=this.value.toUpperCase()">
      </div>
      <div>
        <label class="field-label">Año <span class="text-rose-500">*</span></label>
        <select id="sim-año" class="select-field">
          ${Array.from({ length: 12 }, (_, i) => 2024 - i).map(y => `<option${simState.año == y ? ' selected' : ''}>${y}</option>`).join('')}
        </select>
      </div>
      <div>
        <label class="field-label">Marca <span class="text-rose-500">*</span></label>
        <select id="sim-marca" class="select-field">
          ${['Toyota', 'Chevrolet', 'Ford', 'Hyundai', 'Kia', 'Jeep', 'Nissan', 'Honda', 'Renault', 'Mazda', 'Volkswagen', 'Mitsubishi'].map(m => `<option${simState.marca === m ? ' selected' : ''}>${m}</option>`).join('')}
        </select>
      </div>
      <div>
        <label class="field-label">Modelo <span class="text-rose-500">*</span></label>
        <input id="sim-modelo" class="input-field" placeholder="Ej: Corolla XLi" value="${simState.modelo}">
      </div>
      <div>
        <label class="field-label">Color</label>
        <input id="sim-color" class="input-field" placeholder="Ej: Blanco perla" value="${simState.color}">
      </div>
      <div>
        <label class="field-label">Uso <span class="text-rose-500">*</span></label>
        <select id="sim-uso" class="select-field">
          ${['Particular', 'Transporte de personal', 'Carga', 'Colectivo / Minibús'].map(u => `<option${simState.uso === u ? ' selected' : ''}>${u}</option>`).join('')}
        </select>
      </div>
    </div>
    ${secHeader('dollar-sign', 'Valorización del activo', 'amber')}
    <div>
      <label class="field-label">Valor de mercado (USD) <span class="text-rose-500">*</span></label>
      <div class="relative">
        <span class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm pointer-events-none">$</span>
        <input id="sim-valor" type="number" min="500" step="500" class="input-field pl-7" placeholder="15000" value="${simState.valor}">
      </div>
      <p class="text-[10px] text-slate-400 mt-1.5 ml-0.5">Casco PT: 1.80 % · Casco PP: 0.80 % · Robo y Hurto: 0.60 % del valor declarado.</p>
    </div>`;
  const footer = `
    <button onclick="closeModal()" class="btn-secondary">Cancelar</button>
    <button onclick="simGuardar1()" class="btn-primary">Continuar <i data-lucide="arrow-right" class="w-4 h-4"></i></button>`;
  simModal(1, body, footer);
};

window.simTipo = function (val) {
  simState.tipo = val;
  const tipos = [
    { val: 'particular', icon: 'car', label: 'Particular', desc: 'Uso personal o familiar' },
    { val: 'comercial', icon: 'truck', label: 'Comercial', desc: 'Carga o transporte' },
    { val: 'flota', icon: 'layers', label: 'Flota', desc: 'Múltiples unidades' },
  ];
  const container = document.getElementById('sim-tipos');
  if (!container) return;
  container.innerHTML = tipos.map(t => {
    const on = t.val === val;
    return `<button onclick="simTipo('${t.val}')" id="sim-t-${t.val}"
      class="flex flex-col items-center gap-2 p-3.5 rounded-2xl border-2 transition-all text-center ${on ? 'border-jm-blue bg-blue-50/50' : 'border-slate-200 hover:border-slate-300'}">
      <div class="w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${on ? 'bg-jm-blue' : 'bg-slate-100'}">
        <i data-lucide="${t.icon}" class="w-4 h-4 ${on ? 'text-white' : 'text-slate-500'}"></i>
      </div>
      <div>
        <p class="text-xs font-bold ${on ? 'text-jm-blue' : 'text-slate-700'}">${t.label}</p>
        <p class="text-[9px] leading-tight mt-0.5 ${on ? 'text-blue-400' : 'text-slate-400'}">${t.desc}</p>
      </div>
    </button>`;
  }).join('');
  createIcons({ icons: ALL_ICONS });
};

window.simGuardar1 = function () {
  const valor = Math.max(500, parseFloat(document.getElementById('sim-valor')?.value) || 15000);
  simState.placa = document.getElementById('sim-placa')?.value?.trim() || '';
  simState.marca = document.getElementById('sim-marca')?.value || 'Toyota';
  simState.modelo = document.getElementById('sim-modelo')?.value?.trim() || '';
  simState.año = document.getElementById('sim-año')?.value || '2022';
  simState.color = document.getElementById('sim-color')?.value?.trim() || '';
  simState.uso = document.getElementById('sim-uso')?.value || 'Particular';
  simState.valor = valor;
  simState.coberturas['CASCO-PT'].prima = Math.round(valor * 0.018 * 100) / 100;
  simState.coberturas['CASCO-PP'].prima = Math.round(valor * 0.008 * 100) / 100;
  simState.coberturas['ROBO'].prima = Math.round(valor * 0.006 * 100) / 100;
  simPaso2();
};

// ── SIMULADOR — Paso 2: Datos del tomador ─────────────────────
window.simPaso2 = function () {
  const tipoLabel = { particular: 'Particular', comercial: 'Comercial', flota: 'Flota' }[simState.tipo] || 'Vehículo';
  const body = `
    <div class="mb-5 p-4 rounded-2xl border border-slate-200 bg-slate-50/70 flex items-center gap-3.5">
      <div class="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0" style="background:linear-gradient(135deg,#001463,#000c3b)">
        <i data-lucide="car" class="w-5 h-5 text-white"></i>
      </div>
      <div class="min-w-0 flex-1">
        <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Vehículo · ${tipoLabel}</p>
        <p class="text-sm font-bold text-slate-800">${simState.marca} ${simState.modelo} ${simState.año}${simState.placa ? ' <span class="font-mono text-slate-500 text-xs">· ' + simState.placa + '</span>' : ''}</p>
      </div>
      <div class="shrink-0 text-right">
        <p class="text-[10px] text-slate-400 uppercase tracking-wide">Valor</p>
        <p class="text-base font-black text-jm-blue">${usd(simState.valor)}</p>
      </div>
    </div>
    <div class="flex items-center gap-2 mb-3">
      <div class="w-4 h-4 rounded-md bg-slate-100 flex items-center justify-center shrink-0">
        <i data-lucide="user" class="w-2.5 h-2.5 text-slate-500"></i>
      </div>
      <span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Datos del tomador</span>
    </div>
    <div class="grid grid-cols-2 gap-3">
      <div class="col-span-2">
        <label class="field-label">Nombre completo <span class="text-rose-500">*</span></label>
        <input id="sim-nombre" class="input-field" placeholder="Nombre y apellidos" value="${simState.nombre}">
      </div>
      <div>
        <label class="field-label">Cédula / RIF <span class="text-rose-500">*</span></label>
        <input id="sim-ci" class="input-field font-mono" placeholder="V-12.345.678" value="${simState.ci}">
      </div>
      <div>
        <label class="field-label">Teléfono</label>
        <input id="sim-tel" class="input-field" placeholder="+58 414 000 0000" value="${simState.tel}">
      </div>
      <div class="col-span-2">
        <label class="field-label">Correo electrónico</label>
        <input id="sim-email" type="email" class="input-field" placeholder="correo@dominio.com" value="${simState.email}">
      </div>
    </div>`;
  const footer = `
    <button onclick="simIniciar()" class="btn-secondary"><i data-lucide="arrow-left" class="w-4 h-4"></i> Anterior</button>
    <button onclick="simGuardar2()" class="btn-primary">Continuar <i data-lucide="arrow-right" class="w-4 h-4"></i></button>`;
  simModal(2, body, footer);
};

window.simGuardar2 = function () {
  simState.nombre = document.getElementById('sim-nombre')?.value?.trim() || '';
  simState.ci = document.getElementById('sim-ci')?.value?.trim() || '';
  simState.tel = document.getElementById('sim-tel')?.value?.trim() || '';
  simState.email = document.getElementById('sim-email')?.value?.trim() || '';
  simPaso3();
};

// ── SIMULADOR — Paso 3: Coberturas ────────────────────────────
window.simPaso3 = function () {
  const chkd = Object.values(simState.coberturas).filter(c => c.chk);
  const sub0 = chkd.reduce((s, c) => s + c.prima, 0);
  const iva0 = sub0 * 0.16;
  const tot0 = sub0 + iva0 + 5;
  const body = `
    <div class="flex items-start gap-3 mb-4 p-3.5 bg-amber-50/70 border border-amber-100 rounded-xl">
      <i data-lucide="info" class="w-4 h-4 text-amber-600 shrink-0 mt-0.5"></i>
      <p class="text-xs text-amber-700 leading-relaxed"><strong>RC Obligatoria</strong> es requerida por Ley SUDEASEG y no puede deseleccionarse. Las demás coberturas se activan según el perfil de riesgo del cliente.</p>
    </div>
    <div class="flex items-center gap-2 mb-3">
      <div class="w-4 h-4 rounded-md bg-slate-100 flex items-center justify-center shrink-0">
        <i data-lucide="shield" class="w-2.5 h-2.5 text-slate-500"></i>
      </div>
      <span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Coberturas disponibles</span>
    </div>
    <div class="space-y-2 mb-4" id="sim-cov-list">
      ${Object.entries(simState.coberturas).map(([cod, c]) => `
      <label id="sim-row-${cod}" class="flex items-start gap-3 p-3.5 rounded-2xl border-2 transition-all select-none ${c.req ? 'cursor-not-allowed border-rose-200/50 bg-rose-50/20' : c.chk ? 'cursor-pointer border-jm-blue/25 bg-blue-50/40' : 'cursor-pointer border-slate-200 bg-white hover:border-slate-300'}">
        <input type="checkbox" id="sim-c-${cod}" ${c.chk ? 'checked' : ''} ${c.req ? 'disabled' : ''}
          class="mt-0.5 w-4 h-4 accent-blue-700 shrink-0" onchange="simToggle('${cod}',this.checked)">
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 flex-wrap mb-0.5">
            <p class="text-sm font-semibold text-slate-800">${c.nom}</p>
            ${c.req ? `<span class="text-[9px] font-bold uppercase bg-rose-100 text-rose-600 px-1.5 py-0.5 rounded-full tracking-wide shrink-0">Oblig.</span>` : ''}
          </div>
          <p class="text-xs text-slate-400 truncate">${c.desc}</p>
        </div>
        <div class="shrink-0 text-right ml-2">
          <p class="text-sm font-black text-slate-800">${usd(c.prima)}</p>
          <p class="text-[10px] text-slate-400">${c.tasa}</p>
        </div>
      </label>`).join('')}
    </div>
    <div class="rounded-2xl overflow-hidden" style="background:linear-gradient(135deg,#001463,#000c3b)">
      <div class="px-5 py-3 space-y-1.5 border-b border-white/10">
        <div class="flex justify-between text-xs"><span class="text-white/50">Prima Neta</span><span class="text-white/70 font-semibold" id="sim-sub">${usd(sub0)}</span></div>
        <div class="flex justify-between text-xs"><span class="text-white/50">IVA (16%)</span><span class="text-white/70 font-semibold" id="sim-iva">${usd(iva0)}</span></div>
        <div class="flex justify-between text-xs"><span class="text-white/50">Derecho de Póliza</span><span class="text-white/70 font-semibold">${usd(5)}</span></div>
      </div>
      <div class="px-5 py-4 flex items-center justify-between">
        <p class="text-sm font-bold text-white/80">Total Anual (USD)</p>
        <p class="text-2xl font-black text-white" id="sim-tot">${usd(tot0)}</p>
      </div>
      <p class="text-[11px] text-white/35 text-right px-5 pb-4" id="sim-totbs">${bs(tot0)}</p>
    </div>`;
  const footer = `
    <button onclick="simPaso2()" class="btn-secondary"><i data-lucide="arrow-left" class="w-4 h-4"></i> Anterior</button>
    <button onclick="simResultado()" class="btn-primary">Ver Resultado <i data-lucide="arrow-right" class="w-4 h-4"></i></button>`;
  simModal(3, body, footer, true);
};

window.simToggle = function (cod, chk) {
  simState.coberturas[cod].chk = chk;
  const row = document.getElementById(`sim-row-${cod}`);
  if (row) row.className = `flex items-start gap-3 p-3.5 rounded-2xl border-2 transition-all select-none ${simState.coberturas[cod].req ? 'cursor-not-allowed border-rose-200/50 bg-rose-50/20'
      : chk ? 'cursor-pointer border-jm-blue/25 bg-blue-50/40'
        : 'cursor-pointer border-slate-200 bg-white hover:border-slate-300'}`;
  const sub = Object.values(simState.coberturas).filter(c => c.chk).reduce((s, c) => s + c.prima, 0);
  const iva = sub * 0.16;
  const tot = sub + iva + 5;
  const el = id => document.getElementById(id);
  if (el('sim-sub')) el('sim-sub').textContent = usd(sub);
  if (el('sim-iva')) el('sim-iva').textContent = usd(iva);
  if (el('sim-tot')) el('sim-tot').textContent = usd(tot);
  if (el('sim-totbs')) el('sim-totbs').textContent = bs(tot);
};

// ── SIMULADOR — Paso 4: Resultado ─────────────────────────────
window.simResultado = function () {
  const chkd = Object.entries(simState.coberturas).filter(([, c]) => c.chk);
  const sub = chkd.reduce((s, [, c]) => s + c.prima, 0);
  const iva = sub * 0.16;
  const pol = 5;
  const tot = sub + iva + pol;
  const solId = 'COT-2026-0' + (313 + Math.floor(Math.random() * 10));
  const hoy = new Date();
  const fecha = `${String(hoy.getDate()).padStart(2, '0')}/${String(hoy.getMonth() + 1).padStart(2, '0')}/${hoy.getFullYear()}`;
  const body = `
    <div class="flex items-center gap-3.5 mb-5 p-4 rounded-2xl border border-emerald-200" style="background:linear-gradient(135deg,#ecfdf5,#d1fae5)">
      <div class="w-11 h-11 rounded-full bg-emerald-500 flex items-center justify-center shrink-0 shadow-md shadow-emerald-300/40">
        <i data-lucide="check" class="w-6 h-6 text-white"></i>
      </div>
      <div class="min-w-0 flex-1">
        <p class="text-sm font-black text-emerald-800">Cotización generada</p>
        <p class="text-xs font-mono text-emerald-600 mt-0.5">${solId} · ${fecha}</p>
      </div>
      <span class="text-[10px] font-bold text-emerald-600 bg-emerald-100 px-2.5 py-1 rounded-full shrink-0 uppercase tracking-wide">Pendiente</span>
    </div>
    <div class="grid grid-cols-2 gap-2 mb-4">
      <div class="p-3.5 bg-slate-50 border border-slate-100 rounded-xl">
        <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">Vehículo</p>
        <p class="text-sm font-bold text-slate-800 break-words">${simState.marca} ${simState.modelo} ${simState.año}</p>
        <p class="text-xs font-mono text-slate-500 mt-0.5">${simState.placa || '—'} · ${usd(simState.valor)}</p>
      </div>
      <div class="p-3.5 bg-slate-50 border border-slate-100 rounded-xl">
        <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">Tomador</p>
        <p class="text-sm font-bold text-slate-800 break-words">${simState.nombre || 'Sin especificar'}</p>
        <p class="text-xs font-mono text-slate-500 mt-0.5">${simState.ci || '—'}</p>
      </div>
    </div>
    <div class="space-y-2 mb-4 p-4 bg-slate-50 border border-slate-100 rounded-2xl">
      <div class="flex items-center gap-2 mb-2">
        <i data-lucide="shield-check" class="w-3.5 h-3.5 text-slate-400 shrink-0"></i>
        <p class="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Coberturas incluidas</p>
      </div>
      ${chkd.map(([, c]) => `
      <div class="flex items-center justify-between gap-2">
        <div class="flex items-center gap-2 min-w-0">
          <i data-lucide="check-circle" class="w-3.5 h-3.5 text-emerald-500 shrink-0"></i>
          <span class="text-sm text-slate-700 truncate">${c.nom}</span>
        </div>
        <span class="text-sm font-semibold text-slate-800 shrink-0">${usd(c.prima)}</span>
      </div>`).join('')}
    </div>
    <div class="rounded-2xl overflow-hidden" style="background:linear-gradient(135deg,#001463,#000c3b)">
      <div class="px-5 py-3.5 space-y-1.5 border-b border-white/10">
        <div class="flex justify-between text-xs"><span class="text-white/50">Prima Neta</span><span class="text-white/70 font-semibold">${usd(sub)}</span></div>
        <div class="flex justify-between text-xs"><span class="text-white/50">IVA (16%)</span><span class="text-white/70 font-semibold">${usd(iva)}</span></div>
        <div class="flex justify-between text-xs"><span class="text-white/50">Derecho de Póliza</span><span class="text-white/70 font-semibold">${usd(pol)}</span></div>
      </div>
      <div class="px-5 py-4 flex items-end justify-between gap-2">
        <div>
          <p class="text-sm font-bold text-white/80">Total Prima Anual</p>
          <p class="text-xs text-white/40 mt-0.5">${bs(tot)} · Tasa BCV 38.54</p>
        </div>
        <p class="text-3xl font-black text-white">${usd(tot)}</p>
      </div>
      <div class="px-5 pb-4 flex items-center justify-between border-t border-white/10 pt-3">
        <div class="flex items-center gap-1.5">
          <i data-lucide="user-check" class="w-3 h-3 text-white/30"></i>
          <p class="text-[10px] text-white/30">Agente: <span class="text-white/50 font-semibold">Usuario actual · Caracas Principal</span></p>
        </div>
        <p class="text-[10px] text-white/30 font-mono">${solId}</p>
      </div>
    </div>`;
  const footer = `
    <button onclick="simPaso3()" class="btn-secondary"><i data-lucide="arrow-left" class="w-4 h-4"></i> Ajustar</button>
    <div class="flex gap-2">
      <button onclick="showPdfCotizacion()" class="btn-secondary" title="Imprimir / exportar PDF"><i data-lucide="printer" class="w-4 h-4"></i></button>
      <button onclick="closeModal();showToast('Cotización guardada correctamente','success')" class="btn-primary">
        <i data-lucide="file-check" class="w-4 h-4"></i>Guardar Cotización
      </button>
    </div>`;
  simModal(4, body, footer, true);
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
          <i data-lucide="${c.ok ? 'check' : 'x'}" class="w-4 h-4"></i>
        </div>
        <div>
          <p class="text-sm font-semibold ${c.ok ? 'text-emerald-800' : 'text-rose-800'} break-words">${c.item}</p>
          <p class="text-xs ${c.ok ? 'text-emerald-600' : 'text-rose-600'} mt-0.5">${c.det}</p>
        </div>
      </div>`).join('')}
    </div>
  </div>
  <div class="flex flex-wrap gap-3">
    <button onclick="showToast('Solicitud de documentos enviada al cliente','info')" class="btn-secondary"><i data-lucide="send" class="w-4 h-4"></i>Solicitar Documentos</button>
    <button onclick="navigateTo('rev-coberturas')" class="btn-primary ml-auto">Continuar Revisión →</button>
  </div>`;
}

function revCoberturas() {
  return `<div class="card p-6 mb-5">
    <div class="flex flex-wrap justify-between items-center gap-2 mb-4">
      <div>
        <h4 class="font-semibold text-slate-800">Coberturas · SOL-2026-00312</h4>
        <p class="text-xs text-slate-500 mt-0.5">Toyota Corolla 2022 · ABC-123</p>
      </div>
      ${badge('En Revisión', 'amber')}
    </div>` +
    tbl([{ l: 'Cobertura', k: 'cob', tr: true }, { l: 'Suma Asegurada', k: 'sa', r: true, hide: 'md' }, { l: 'Tasa', k: 'tasa', r: true, hide: 'sm' }, { l: 'Prima', k: 'prima', r: true }, { l: 'Observación', k: 'obs', hide: 'sm', tr: true }], [
      { cob: 'CASCO Pérdida Total', sa: usd(15000), tasa: '1.80%', prima: usd(270), obs: '—' },
      { cob: 'CASCO Pérdida Parcial', sa: usd(15000), tasa: '0.80%', prima: usd(120), obs: '—' },
      { cob: 'Robo y Hurto', sa: usd(15000), tasa: '0.60%', prima: usd(90), obs: '—' },
      { cob: 'AP (4 ocupantes)', sa: usd(40000), tasa: '$12/occ', prima: usd(48), obs: '—' },
      { cob: 'RC Obligatoria', sa: '—', tasa: '0.5 UT', prima: usd(4.50), obs: 'SUDEASEG obligatoria' },
    ]) + `</div>
  <div class="flex flex-wrap justify-between gap-3">
    <button onclick="navigateTo('rev-validacion')" class="btn-secondary">← Anterior</button>
    <button onclick="navigateTo('rev-evaluacion')" class="btn-primary">Continuar →</button>
  </div>`;
}

function revEvaluacion() {
  return `<div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-5">
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
  <div class="flex flex-wrap justify-between gap-3">
    <button onclick="navigateTo('rev-coberturas')" class="btn-secondary">← Anterior</button>
    <button onclick="navigateTo('rev-decision')" class="btn-primary">Continuar →</button>
  </div>`;
}

function revDecision() {
  const rows = [
    { sol: 'SOL-2026-00312', cli: 'Carlos E. Rodríguez', veh: 'Toyota Corolla 2022', prima: usd(622.70), riesgo: badge('Bajo', 'green'), est: rsbadge('En Revisión') },
    { sol: 'SOL-2026-00311', cli: 'Ana C. López', veh: 'Hyundai Tucson 2021', prima: usd(784.20), riesgo: badge('Bajo', 'green'), est: rsbadge('En Revisión') },
    { sol: 'SOL-2026-00309', cli: 'Pedro A. Díaz', veh: 'Ford Explorer 2020', prima: usd(1240.00), riesgo: badge('Medio', 'amber'), est: rsbadge('En Revisión') },
    { sol: 'SOL-2026-00307', cli: 'Valentina B. Ramos', veh: 'Kia Sportage 2023', prima: usd(540.00), riesgo: badge('Bajo', 'green'), est: rsbadge('En Revisión') },
  ];
  return `<div class="card p-6 mb-5 border-l-4 border-l-blue-500">
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h4 class="font-semibold text-slate-800">Solicitud SOL-2026-00312</h4>
        <p class="text-xs text-slate-500 mt-0.5">Score: 78 · Riesgo Bajo · Prima: ${usd(622.70)}</p>
      </div>
      <div class="flex flex-wrap gap-3 shrink-0">
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
    tbl([{ l: 'Solicitud', k: 'sol', m: true, hide: 'md' }, { l: 'Cliente', k: 'cli', tr: true }, { l: 'Vehículo', k: 'veh', hide: 'md', tr: true }, { l: 'Prima', k: 'prima', r: true, hide: 'sm' }, { l: 'Riesgo', k: 'riesgo', hide: 'sm' }, { l: 'Estado', k: 'est' }, { l: '', k: 'acc', acc: true }],
      rows.map(r => ({ ...r, acc: actions() })));
}

// 5. EMISIÓN DE PÓLIZA
function emiGeneracion() {
  return `<div class="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-6">
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
    <p class="text-2xl sm:text-4xl font-extrabold text-blue-700 tracking-wider break-all mb-3">SEF-2026-VEH-00848</p>
    <div class="flex flex-wrap items-center justify-center gap-4 text-xs text-slate-400 mb-6">
      <span><strong class="text-slate-600">SEF</strong> · J&M</span>
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
    <div class="flex flex-wrap justify-between items-start gap-2 mb-4">
      <div>
        <h4 class="font-semibold text-slate-800">Póliza SEF-2026-VEH-00848</h4>
        <p class="text-xs text-slate-500 mt-0.5">Toyota Corolla 2022 · ABC-123 · Vigencia: 03/05/2026 – 03/05/2027</p>
      </div>
      ${badge('Vigente', 'green')}
    </div>` +
    tbl([{ l: 'Certificado', k: 'cert', m: true, hide: 'md' }, { l: 'Cobertura', k: 'cob', tr: true }, { l: 'Suma Asegurada', k: 'sa', r: true, hide: 'sm' }, { l: 'Prima', k: 'prima', r: true }, { l: 'Estado', k: 'est' }], [
      { cert: 'CERT-001', cob: 'CASCO Pérdida Total', sa: usd(15000), prima: usd(270), est: rsbadge('Vigente') },
      { cert: 'CERT-002', cob: 'CASCO Pérdida Parcial', sa: usd(15000), prima: usd(120), est: rsbadge('Vigente') },
      { cert: 'CERT-003', cob: 'Robo y Hurto', sa: usd(15000), prima: usd(90), est: rsbadge('Vigente') },
      { cert: 'CERT-004', cob: 'AP (4 ocupantes)', sa: usd(40000), prima: usd(48), est: rsbadge('Vigente') },
      { cert: 'CERT-005', cob: 'RC Obligatoria', sa: '—', prima: usd(4.50), est: rsbadge('Vigente') },
    ]) + `</div>
  <div class="flex flex-wrap gap-3">
    <button onclick="navigateTo('emi-recibo')" class="btn-primary"><i data-lucide="printer" class="w-4 h-4"></i>Generar Recibo</button>
    <button onclick="showPdfCertificado()" class="btn-secondary"><i data-lucide="download" class="w-4 h-4"></i>Descargar PDF</button>
  </div>`;
}

function emiRecibo() {
  return `<div class="card p-6 max-w-lg mb-5">
    <div class="flex flex-wrap justify-between items-start gap-3 mb-5 pb-4 border-b border-slate-100">
      <div>
        <h4 class="font-bold text-slate-900 text-base">RECIBO DE PRIMA</h4>
        <p class="text-xs text-slate-500 mt-0.5">J&M C.A. · RIF J-30012345-6</p>
      </div>
      <div class="text-right">
        <p class="font-semibold text-slate-700 text-sm">REC-2026-00848</p>
        <p class="text-xs text-slate-400">02/05/2026</p>
      </div>
    </div>
    <div class="space-y-1.5 text-sm mb-5">
      <div class="flex flex-wrap justify-between gap-3"><span class="text-slate-500">Póliza:</span><span class="font-semibold">SEF-2026-VEH-00848</span></div>
      <div class="flex flex-wrap justify-between gap-3"><span class="text-slate-500">Asegurado:</span><span class="font-semibold">Carlos E. Rodríguez</span></div>
      <div class="flex flex-wrap justify-between gap-3"><span class="text-slate-500">Vehículo:</span><span class="font-semibold">Toyota Corolla 2022 · ABC-123</span></div>
      <div class="flex flex-wrap justify-between gap-3"><span class="text-slate-500">Vigencia:</span><span class="font-semibold">03/05/2026 – 03/05/2027</span></div>
    </div>
    <div class="bg-slate-50 rounded-xl p-4 text-sm space-y-2 mb-4">
      <div class="flex flex-wrap justify-between gap-3"><span class="text-slate-600">Prima Neta</span><span>${usd(532.50)}</span></div>
      <div class="flex flex-wrap justify-between gap-3"><span class="text-slate-600">IVA 16%</span><span>${usd(85.20)}</span></div>
      <div class="flex flex-wrap justify-between gap-3"><span class="text-slate-600">Derecho de Póliza</span><span>${usd(5.00)}</span></div>
      <div class="flex justify-between font-bold text-slate-900 pt-2 border-t border-slate-200"><span>TOTAL USD</span><span>${usd(622.70)}</span></div>
      <div class="flex justify-between text-slate-500"><span>Total Bs (38.54)</span><span>${bs(622.70)}</span></div>
    </div>
    <div class="flex gap-3">
      <button onclick="showPdfRecibo()" class="btn-primary flex-1"><i data-lucide="printer" class="w-4 h-4"></i>Imprimir</button>
      <button onclick="navigateTo('fac-factura');showToast('Procediendo a facturación','info')" class="btn-secondary flex-1">Facturar →</button>
    </div>
  </div>`;
}

// 6. FACTURACIÓN Y COBRO
function facFactura() {
  return `<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
    <div class="card p-6">
      <h4 class="font-semibold text-slate-800 mb-4 text-sm">Datos de Factura</h4>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
  return tbl([{ l: 'Concepto', k: 'conc', tr: true }, { l: 'Base Imponible', k: 'base', r: true, hide: 'md' }, { l: '%', k: 'pct', r: true, hide: 'sm' }, { l: 'Monto', k: 'monto', r: true }, { l: 'Normativa', k: 'norm', hide: 'sm', tr: true }], [
    { conc: 'Prima Neta', base: usd(532.50), pct: '—', monto: usd(532.50), norm: 'Base de cálculo' },
    { conc: 'IVA', base: usd(532.50), pct: '16.00%', monto: usd(85.20), norm: 'SENIAT' },
    { conc: 'Derecho de Póliza', base: '—', pct: 'Fijo', monto: usd(5.00), norm: 'J&M' },
    { conc: 'Impuesto a Primas', base: usd(532.50), pct: '1.00%', monto: usd(5.33), norm: 'Ley de Seguros' },
    { conc: 'TOTAL', base: '—', pct: '—', monto: usd(627.03), norm: '' },
  ]);
}

function facPago() {
  return `<div class="card p-6">
    <h4 class="font-semibold text-slate-800 mb-5 text-sm">Selección de Método de Pago</h4>
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
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
  return `<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
          <div class="flex flex-wrap justify-between gap-3"><span class="text-slate-500">Total Factura</span><span class="font-semibold">${usd(622.70)}</span></div>
          <div class="flex flex-wrap justify-between gap-3"><span class="text-slate-500">Pagado</span><span class="font-semibold text-emerald-600">${usd(0)}</span></div>
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
  return `<div class="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-6">
    <div class="card p-5 text-center"><p class="text-xs text-slate-500">Prima Neta</p><p class="text-xl font-bold text-slate-800 mt-1">${usd(532.50)}</p></div>
    <div class="card p-5 text-center border-t-4 border-t-blue-500"><p class="text-xs text-slate-500">Comisión Agente (10%)</p><p class="text-xl font-bold text-blue-700 mt-1">${usd(53.25)}</p></div>
    <div class="card p-5 text-center border-t-4 border-t-indigo-500"><p class="text-xs text-slate-500">Comisión Corredor (5%)</p><p class="text-xl font-bold text-indigo-700 mt-1">${usd(26.63)}</p></div>
  </div>` +
    tbl([{ l: 'Beneficiario', k: 'ben', tr: true }, { l: 'Rol', k: 'rol', hide: 'sm' }, { l: 'Base', k: 'base', r: true, hide: 'md' }, { l: '%', k: 'pct', r: true, hide: 'sm' }, { l: 'Comisión', k: 'com', r: true }, { l: 'Estado', k: 'est' }], [
      { ben: 'Pedro Salazar', rol: 'Agente', base: usd(532.50), pct: '10.00%', com: usd(53.25), est: rsbadge('Pendiente') },
      { ben: 'Romero & Asoc.', rol: 'Corredor', base: usd(532.50), pct: '5.00%', com: usd(26.63), est: rsbadge('Pendiente') },
    ]);
}

function venMetas() {
  const agentes = [
    { nom: 'Pedro Salazar', meta: usd(8000), prod: usd(6420), pct: 80, pol: 14, est: rsbadge('En curso') },
    { nom: 'Ana Suárez', meta: usd(6000), prod: usd(6180), pct: 103, pol: 18, est: rsbadge('Cumplida') },
    { nom: 'Luis Romero', meta: usd(10000), prod: usd(7850), pct: 79, pol: 21, est: rsbadge('En curso') },
    { nom: 'Carla Mendoza', meta: usd(5000), prod: usd(2100), pct: 42, pol: 6, est: rsbadge('En riesgo') },
  ];
  return `<div class="card overflow-hidden">
    <div class="px-5 py-4 border-b border-slate-100 font-semibold text-slate-700 text-sm">Producción Mayo 2026</div>
    <div class="overflow-x-auto"><table class="w-full text-sm">
      <thead class="bg-slate-50 text-slate-400 text-xs font-semibold uppercase tracking-wider">
        <tr>
          <th class="th-cell text-left">Agente</th>
          <th class="th-cell text-right hidden md:table-cell">Meta</th>
          <th class="th-cell text-right hidden sm:table-cell">Producción</th>
          <th class="th-cell text-left">Avance</th>
          <th class="th-cell text-right hidden sm:table-cell">Pólizas</th>
          <th class="th-cell text-left">Estado</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-slate-100">
        ${agentes.map(a => `<tr class="hover:bg-slate-50 transition-colors">
          <td class="td-cell font-medium max-w-0"><span class="break-words">${a.nom}</span></td>
          <td class="td-cell text-right hidden md:table-cell">${a.meta}</td>
          <td class="td-cell text-right font-semibold hidden sm:table-cell">${a.prod}</td>
          <td class="td-cell">
            <div class="flex items-center gap-2">
              <div class="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                <div class="h-full rounded-full ${a.pct >= 100 ? 'bg-emerald-500' : a.pct >= 70 ? 'bg-blue-500' : 'bg-rose-400'}" style="width:${Math.min(a.pct, 100)}%"></div>
              </div>
              <span class="text-xs font-semibold w-8 ${a.pct >= 100 ? 'text-emerald-600' : a.pct >= 70 ? 'text-blue-600' : 'text-rose-500'}">${a.pct}%</span>
            </div>
          </td>
          <td class="td-cell text-right hidden sm:table-cell">${a.pol}</td>
          <td class="td-cell">${a.est}</td>
        </tr>`).join('')}
      </tbody>
    </table></div>
  </div>`;
}

// 8. REPORTES Y CONSULTAS
function reportBase(title, cols, rows) {
  return `<div class="card p-3.5 mb-4 flex flex-wrap items-center gap-3">
    <div class="relative flex-1 min-w-44">
      <input type="text" placeholder="Buscar…" class="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition">
      <i data-lucide="search" class="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"></i>
    </div>
    <input type="date" value="2026-05-01" class="min-w-0 text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500">
    <input type="date" value="2026-05-02" class="min-w-0 text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500">
    <button onclick="showToast('Exportando reporte…','info')" class="btn-secondary ml-auto shrink-0"><i data-lucide="download" class="w-4 h-4"></i>Exportar</button>
  </div>` + tbl(cols, rows);
}

function repVentas() {
  return reportBase('Ventas', [{ l: 'Fecha', k: 'fecha', hide: 'sm' }, { l: 'Póliza', k: 'pol', m: true, hide: 'md' }, { l: 'Agente', k: 'agente', tr: true }, { l: 'Tipo', k: 'tipo', hide: 'lg', tr: true }, { l: 'Prima Neta', k: 'prima', r: true }, { l: 'Estado', k: 'est' }], [
    { fecha: '02/05/2026', pol: 'SEF-2026-VEH-00848', agente: 'Pedro Salazar', tipo: 'Vehículo Particular', prima: usd(532.50), est: rsbadge('Vigente') },
    { fecha: '01/05/2026', pol: 'SEF-2026-VEH-00847', agente: 'Ana Suárez', tipo: 'Vehículo Particular', prima: usd(714.20), est: rsbadge('Vigente') },
    { fecha: '30/04/2026', pol: 'SEF-2026-VEH-00846', agente: 'Luis Romero', tipo: 'Vehículo Comercial', prima: usd(1240.00), est: rsbadge('Vigente') },
    { fecha: '29/04/2026', pol: 'SEF-2026-VEH-00845', agente: 'Carla Mendoza', tipo: 'Vehículo Particular', prima: usd(487.00), est: rsbadge('Vigente') },
    { fecha: '28/04/2026', pol: 'SEF-2026-VEH-00844', agente: 'Pedro Salazar', tipo: 'Vehículo Particular', prima: usd(620.80), est: rsbadge('Vigente') },
  ]);
}

function repPolizas() {
  return reportBase('Pólizas', [{ l: 'Póliza', k: 'pol', m: true, hide: 'md' }, { l: 'Asegurado', k: 'asi', tr: true }, { l: 'Vehículo', k: 'veh', hide: 'md', tr: true }, { l: 'Vigencia', k: 'vig', hide: 'lg' }, { l: 'Prima', k: 'prima', r: true }, { l: 'Estado', k: 'est' }], [
    { pol: 'SEF-2026-VEH-00848', asi: 'Carlos E. Rodríguez', veh: 'Toyota Corolla 2022', vig: '03/05/2026–03/05/2027', prima: usd(622.70), est: rsbadge('Vigente') },
    { pol: 'SEF-2026-VEH-00847', asi: 'Ana C. López', veh: 'Hyundai Tucson 2021', vig: '01/05/2026–01/05/2027', prima: usd(784.20), est: rsbadge('Vigente') },
    { pol: 'SEF-2026-VEH-00846', asi: 'Luis F. Castillo', veh: 'Ford Explorer 2020', vig: '30/04/2026–30/04/2027', prima: usd(1320.00), est: rsbadge('Vigente') },
    { pol: 'SEF-2026-VEH-00845', asi: 'Valentina B. Ramos', veh: 'Kia Sportage 2023', vig: '29/04/2026–29/04/2027', prima: usd(540.00), est: rsbadge('Vigente') },
    { pol: 'SEF-2025-VEH-00781', asi: 'Sofía I. Torres', veh: 'Chevrolet Spark 2019', vig: '01/11/2025–01/11/2026', prima: usd(420.00), est: rsbadge('Por Vencer') },
  ]);
}

function repProduccion() {
  return reportBase('Producción', [{ l: 'Agente', k: 'agente' }, { l: 'Pólizas', k: 'pol', r: true, hide: 'sm' }, { l: 'Prima Neta', k: 'prima', r: true }, { l: 'Comisiones', k: 'com', r: true, hide: 'md' }, { l: 'Meta', k: 'meta', r: true, hide: 'md' }, { l: '% Cumpl.', k: 'pct', r: true }], [
    { agente: 'Ana Suárez', pol: 18, prima: usd(9840), com: usd(984.00), meta: usd(6000), pct: '103%' },
    { agente: 'Luis Romero', pol: 21, prima: usd(11480), com: usd(1148.00), meta: usd(10000), pct: '115%' },
    { agente: 'Pedro Salazar', pol: 14, prima: usd(7280), com: usd(728.00), meta: usd(8000), pct: '91%' },
    { agente: 'Carla Mendoza', pol: 6, prima: usd(2880), com: usd(288.00), meta: usd(5000), pct: '58%' },
  ]);
}

function repComisiones() {
  return reportBase('Comisiones', [{ l: 'Beneficiario', k: 'ben', tr: true }, { l: 'Rol', k: 'rol', hide: 'sm' }, { l: 'Pólizas', k: 'pol', r: true, hide: 'sm' }, { l: 'Base', k: 'base', r: true, hide: 'md' }, { l: 'Tasa', k: 'tasa', r: true, hide: 'md' }, { l: 'Comisión', k: 'com', r: true }, { l: 'Estado', k: 'est' }], [
    { ben: 'Pedro Salazar', rol: 'Agente', pol: 14, base: usd(7280), tasa: '10%', com: usd(728.00), est: rsbadge('Pendiente') },
    { ben: 'Ana Suárez', rol: 'Agente', pol: 18, base: usd(9840), tasa: '10%', com: usd(984.00), est: rsbadge('Pagada') },
    { ben: 'Luis Romero', rol: 'Agente', pol: 21, base: usd(11480), tasa: '10%', com: usd(1148.00), est: rsbadge('Pendiente') },
    { ben: 'Romero & Asoc.', rol: 'Corredor', pol: 12, base: usd(6240), tasa: '5%', com: usd(312.00), est: rsbadge('Pagada') },
  ]);
}

function repTasas() {
  return reportBase('Tasas', [{ l: 'Fecha', k: 'fecha' }, { l: 'Tasa BCV (Bs/$)', k: 'tasa', r: true }, { l: 'Variación', k: 'var', hide: 'sm' }, { l: 'Fuente', k: 'fuente', hide: 'md' }, { l: 'Registrado por', k: 'reg', hide: 'md', tr: true }], [
    { fecha: '02/05/2026', tasa: '38.5400', var: badge('+0.14%', 'amber'), fuente: 'BCV Oficial', reg: 'Sistema' },
    { fecha: '01/05/2026', tasa: '38.3900', var: badge('+0.21%', 'amber'), fuente: 'BCV Oficial', reg: 'Sistema' },
    { fecha: '30/04/2026', tasa: '38.1800', var: badge('+0.08%', 'slate'), fuente: 'BCV Oficial', reg: 'V. Admin' },
    { fecha: '29/04/2026', tasa: '38.1500', var: badge('0.00%', 'slate'), fuente: 'BCV Oficial', reg: 'Sistema' },
    { fecha: '28/04/2026', tasa: '38.1500', var: badge('-0.05%', 'green'), fuente: 'BCV Oficial', reg: 'Sistema' },
  ]);
}

// 9. TASAS DEL DÍA
function tasRegistro() {
  return `
  <div class="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">

    <!-- Left: rate display cards -->
    <div class="space-y-4">
      <div class="card p-5 border-l-4 border-l-emerald-500">
        <div class="flex items-center justify-between mb-2">
          <div class="flex items-center gap-2">
            <span class="text-xl font-extrabold text-emerald-500">$</span>
            <p class="text-xs text-slate-600 uppercase tracking-wide font-bold">Dólar · BCV</p>
          </div>
          <span class="text-xs text-slate-400">07/05/2026 · 07:45 AM</span>
        </div>
        <p class="text-2xl sm:text-3xl font-extrabold text-slate-800">38.54 <span class="text-base font-semibold text-slate-400">Bs/$</span></p>
        <p class="text-xs text-emerald-600 font-semibold mt-1">↑ +0.14% vs ayer</p>
      </div>
      <div class="card p-5 border-l-4 border-l-amber-500">
        <div class="flex items-center justify-between mb-2">
          <div class="flex items-center gap-2">
            <span class="text-xl font-extrabold text-amber-500">€</span>
            <p class="text-xs text-slate-600 uppercase tracking-wide font-bold">Euro · BCV</p>
          </div>
          <span class="text-xs text-slate-400">07/05/2026 · 07:45 AM</span>
        </div>
        <p class="text-2xl sm:text-3xl font-extrabold text-slate-800">42.18 <span class="text-base font-semibold text-slate-400">Bs/€</span></p>
        <p class="text-xs text-amber-600 font-semibold mt-1">↑ +0.22% vs ayer</p>
      </div>
    </div>

    <!-- Right: registration form -->
    <div class="card p-6">
      <p class="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Registrar Tasas del Día</p>
      <div class="space-y-3">
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="field-label">Dólar USD (Bs) <span class="text-rose-500">*</span></label>
            <div class="relative">
              <span class="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-500 font-extrabold">$</span>
              <input type="number" step="0.00001" placeholder="0.00000" class="input-field pl-8" required>
            </div>
          </div>
          <div>
            <label class="field-label">Euro EUR (Bs) <span class="text-rose-500">*</span></label>
            <div class="relative">
              <span class="absolute left-3 top-1/2 -translate-y-1/2 text-amber-500 font-extrabold">€</span>
              <input type="number" step="0.00001" placeholder="0.00000" class="input-field pl-8" required>
            </div>
          </div>
        </div>
        <div>
          <label class="field-label">Fecha <span class="text-rose-500">*</span></label>
          <input type="date" value="2026-05-07" class="input-field" required>
        </div>
        <button onclick="showToast('Tasas del día registradas y aplicadas','success')" class="btn-primary w-full">
          <i data-lucide="check" class="w-4 h-4"></i>Registrar Tasas
        </button>
      </div>
    </div>

  </div>

  <!-- History table -->
  <h4 class="font-semibold text-slate-700 mb-3">Historial de Tasas Registradas</h4>
  ${tbl([
    { l: 'Fecha', k: 'f', nw: true }, { l: 'Moneda', k: 'mon', nw: true }, { l: 'Tasa Bs', k: 't', r: true, nw: true }, { l: 'Variación', k: 'v', hide: 'sm', nw: true }, { l: '', k: 'acc', acc: true }
  ], [
    { f: '07/05/2026', mon: badge('USD', 'blue'), t: '38.5400', v: badge('+0.14%', 'amber'), acc: actions('Tasa USD 07/05/2026') },
    { f: '07/05/2026', mon: badge('EUR', 'indigo'), t: '42.1800', v: badge('+0.22%', 'amber'), acc: actions('Tasa EUR 07/05/2026') },
    { f: '06/05/2026', mon: badge('USD', 'blue'), t: '38.3900', v: badge('+0.21%', 'amber'), acc: actions('Tasa USD 06/05/2026') },
    { f: '06/05/2026', mon: badge('EUR', 'indigo'), t: '41.9600', v: badge('+0.15%', 'amber'), acc: actions('Tasa EUR 06/05/2026') },
    { f: '05/05/2026', mon: badge('USD', 'blue'), t: '38.1800', v: badge('+0.08%', 'slate'), acc: actions('Tasa USD 05/05/2026') },
    { f: '05/05/2026', mon: badge('EUR', 'indigo'), t: '41.8100', v: badge('+0.05%', 'slate'), acc: actions('Tasa EUR 05/05/2026') },
  ])}`;
}

function tasHistorico() {
  return reportBase('Histórico de Tasas', [{ l: 'Fecha', k: 'f' }, { l: 'Tasa Bs/$', k: 't', r: true }, { l: 'Mínima', k: 'min', r: true, hide: 'sm' }, { l: 'Máxima', k: 'max', r: true, hide: 'sm' }, { l: 'Variación', k: 'v', hide: 'sm' }, { l: 'Fuente', k: 'fuente', hide: 'md' }], [
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
  return `<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
            <i data-lucide="${ok ? 'check' : 'x'}" class="w-4 h-4"></i>
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

// COTIZACIONES — simulador interno
function cotSimulador() {
  const quotes = [
    { id: 'COT-2026-00312', cli: 'Carlos E. Rodríguez', veh: 'Toyota Corolla 2022', prima: 622.70, est: 'En Revisión', fecha: '02/05/2026' },
    { id: 'COT-2026-00311', cli: 'Ana C. López', veh: 'Hyundai Tucson 2021', prima: 784.20, est: 'Aprobado', fecha: '01/05/2026' },
    { id: 'COT-2026-00309', cli: 'Pedro A. Díaz', veh: 'Ford Explorer 2020', prima: 1240.00, est: 'En Revisión', fecha: '30/04/2026' },
    { id: 'COT-2026-00307', cli: 'Valentina B. Ramos', veh: 'Kia Sportage 2023', prima: 540.00, est: 'Emitida', fecha: '28/04/2026' },
    { id: 'COT-2026-00305', cli: 'José M. Pérez', veh: 'Chevrolet Sail 2021', prima: 390.00, est: 'Rechazado', fecha: '25/04/2026' },
    { id: 'COT-2026-00303', cli: 'María G. Torres', veh: 'Jeep Grand Cherokee 2019', prima: 1580.00, est: 'Emitida', fecha: '22/04/2026' },
  ];
  return `<div class="animate-in fade-in duration-500 space-y-5">

    <!-- Hero card -->
    <div class="relative rounded-[2rem] overflow-hidden" style="background:linear-gradient(135deg,#001463 0%,#000c3b 55%,#001a6e 100%)">
      <div class="absolute inset-0 pointer-events-none" style="background:radial-gradient(ellipse at 75% 40%,rgba(99,140,255,0.2) 0%,transparent 60%)"></div>
      <div class="relative flex flex-col sm:flex-row sm:items-center gap-6 p-7 sm:p-10">
        <div class="flex-1 min-w-0">
          <div class="inline-flex items-center gap-2 bg-white/10 border border-white/15 rounded-full px-3 py-1.5 mb-4">
            <i data-lucide="shield-check" class="w-3.5 h-3.5 text-emerald-400"></i>
            <span class="text-xs font-bold text-white/70 uppercase tracking-wider">Seguro Vehicular J&M</span>
          </div>
          <h2 class="text-2xl sm:text-3xl font-black text-white leading-snug mb-2">Simula el costo<br><span class="text-emerald-400">de tu póliza</span></h2>
          <p class="text-sm text-white/50 max-w-xs">Obtén una cotización personalizada al instante. Elige coberturas, calcula prima y guarda tu simulación.</p>
        </div>
        <div class="shrink-0">
          <button onclick="simIniciar()"
            class="flex items-center gap-2.5 bg-white text-jm-blue text-sm font-black px-7 py-4 rounded-2xl hover:bg-blue-50 transition-all shadow-xl shadow-black/25 group">
            <i data-lucide="calculator" class="w-5 h-5 group-hover:scale-110 transition-transform"></i>
            Emitir
          </button>
        </div>
      </div>
      <div class="grid grid-cols-3 border-t border-white/10">
        ${[
      ['7 coberturas', 'disponibles', 'layers'],
      ['RC incluida', 'obligatoria', 'check-circle'],
      ['USD + Bs.', 'Tasa BCV hoy', 'dollar-sign'],
    ].map(([val, label, icon]) => `
        <div class="flex flex-col sm:flex-row items-center sm:gap-2 gap-1 px-4 py-3.5 text-center sm:text-left">
          <i data-lucide="${icon}" class="w-3.5 h-3.5 text-white/35 shrink-0"></i>
          <div class="min-w-0">
            <p class="text-xs font-bold text-white/65 truncate">${val}</p>
            <p class="text-[10px] text-white/30">${label}</p>
          </div>
        </div>`).join('')}
      </div>
    </div>

    <!-- Table header -->
    <div class="flex flex-wrap items-center justify-between gap-3 px-2 sm:px-0">
      <div>
        <h3 class="text-base font-black text-slate-800">Simulaciones recientes</h3>
        <p class="text-xs text-slate-400 mt-0.5">Mayo 2026 · ${quotes.length} registros</p>
      </div>
      <div class="flex flex-wrap items-center gap-2">
        ${['Todos', 'En Revisión', 'Aprobado', 'Emitida', 'Rechazado'].map((s, i) => `
        <button onclick="filterSimStatus('${s}',${i})" id="sim-chip-${i}"
          class="px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${i === 0 ? 'bg-jm-blue text-white border-jm-blue' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'}">
          ${s}
        </button>`).join('')}
      </div>
    </div>

    <!-- Table -->
    <div class="card overflow-hidden mx-2 sm:mx-0 px-3 sm:px-0">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-slate-50 border-b border-slate-100">
            <tr>
              <th class="th-cell text-left hidden md:table-cell">N° Sim.</th>
              <th class="th-cell text-left">Cliente</th>
              <th class="th-cell text-right hidden sm:table-cell">Prima USD</th>
              <th class="th-cell text-left hidden sm:table-cell">Fecha</th>
              <th class="th-cell text-left">Estado</th>
              <th class="th-cell text-center">Acciones</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100" id="sim-tbl-body">
            ${quotes.map(q => {
      const estIcon = { green: 'check-circle', amber: 'clock', red: 'alert-circle', blue: 'check-circle', indigo: 'check-circle', slate: 'alert-circle' }[STATUS_COLOR[q.est]] || 'alert-circle';
      const estIconCls = { green: 'text-emerald-500', amber: 'text-amber-500', red: 'text-rose-500', blue: 'text-blue-500', indigo: 'text-indigo-500', slate: 'text-slate-400' }[STATUS_COLOR[q.est]] || 'text-slate-400';
      return `
            <tr class="hover:bg-slate-50/60 transition-colors">
              <td class="td-cell font-mono text-xs text-slate-400 hidden md:table-cell whitespace-nowrap">${q.id}</td>
              <td class="td-cell">
                <p class="text-xs sm:text-sm font-semibold text-slate-800 break-words">${q.cli}</p>
                <p class="text-[10px] text-slate-400 break-words sm:hidden">${usd(q.prima)}</p>
                <p class="text-[10px] text-slate-400 break-words hidden sm:block">${q.veh}</p>
              </td>
              <td class="td-cell text-right font-bold text-xs sm:text-sm text-slate-800 whitespace-nowrap hidden sm:table-cell">${usd(q.prima)}</td>
              <td class="td-cell text-xs text-slate-500 hidden sm:table-cell whitespace-nowrap">${q.fecha}</td>
              <td class="td-cell">
                <span class="hidden sm:inline">${sbadge(q.est)}</span>
                <span class="sm:hidden inline-flex items-center justify-center w-full">
                  <i data-lucide="${estIcon}" class="w-4 h-4 ${estIconCls}" title="${q.est}"></i>
                </span>
              </td>
              <td class="px-2 sm:px-3 py-2 sm:py-2.5">
                <div class="grid grid-cols-2 gap-1">
                  <button onclick="simIniciar()" title="Editar"
                    class="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition inline-flex items-center justify-center">
                    <i data-lucide="pencil" class="w-3.5 h-3.5 sm:w-4 sm:h-4"></i>
                  </button>
                  <button onclick="showToast('Enviando al cliente…','info')" title="Enviar"
                    class="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition inline-flex items-center justify-center">
                    <i data-lucide="send" class="w-3.5 h-3.5 sm:w-4 sm:h-4"></i>
                  </button>
                  <button onclick="showPdfSimulacion('${q.id}')" title="PDF"
                    class="p-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition inline-flex items-center justify-center">
                    <i data-lucide="download" class="w-3.5 h-3.5 sm:w-4 sm:h-4"></i>
                  </button>
                  <button onclick="showConfirmDelete('${q.id}')" title="Eliminar"
                    class="p-1.5 rounded-lg bg-rose-50 text-rose-500 hover:bg-rose-100 transition inline-flex items-center justify-center">
                    <i data-lucide="trash-2" class="w-3.5 h-3.5 sm:w-4 sm:h-4"></i>
                  </button>
                </div>
              </td>
            </tr>`;
    }).join('')}
          </tbody>
        </table>
      </div>
      <div class="px-4 py-3 border-t border-slate-100 flex items-center justify-between gap-2 text-xs text-slate-400">
        <span>${quotes.length} simulaciones</span>
        <button onclick="simIniciar()" class="flex items-center gap-1 text-jm-blue font-semibold hover:underline">
          <i data-lucide="plus" class="w-3.5 h-3.5"></i> Nueva
        </button>
      </div>
    </div>
  </div>`;
}

window.filterSimStatus = function (status, idx) {
  document.querySelectorAll('[id^="sim-chip-"]').forEach((chip, i) => {
    const active = i === idx;
    chip.className = `px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${active ? 'bg-jm-blue text-white border-jm-blue' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'}`;
  });
  document.querySelectorAll('#sim-tbl-body tr').forEach(row => {
    if (status === 'Todos') { row.classList.remove('hidden'); return; }
    const text = row.querySelector('td:nth-child(6)')?.textContent?.trim() || '';
    row.classList.toggle('hidden', !text.includes(status));
  });
};
// CONFIGURACIÓN — menú con tabs
function confAbout() {
  return `<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
    <div class="card p-6">
      <div class="flex items-center gap-4 mb-6 pb-4 border-b border-slate-100">
        <img src="/logo2.png" alt="J&M" class="h-14 object-contain">
        <div>
          <h3 class="font-bold text-slate-800 text-lg">Seguros J&M</h3>
          <p class="text-sm text-slate-500">LA VENEZOLANA DE SEGUROS Y VIDA C.A.</p>
        </div>
      </div>
      <div class="space-y-3 text-sm">
        <div class="flex justify-between gap-3 py-2 border-b border-slate-100"><span class="text-slate-500">RIF</span><span class="font-mono font-semibold">J-30012345-6</span></div>
        <div class="flex justify-between gap-3 py-2 border-b border-slate-100"><span class="text-slate-500">Regulador</span><span class="font-semibold text-blue-700">SUDEASEG</span></div>
        <div class="flex justify-between gap-3 py-2 border-b border-slate-100"><span class="text-slate-500">Registro</span><span class="font-mono text-xs text-slate-600">RSE-2010-00247</span></div>
        <div class="flex justify-between gap-3 py-2 border-b border-slate-100"><span class="text-slate-500">País</span><span class="font-semibold">Venezuela</span></div>
        <div class="flex justify-between gap-3 py-2 border-b border-slate-100"><span class="text-slate-500">Email</span><span class="text-blue-600">info@jandm.com</span></div>
        <div class="flex justify-between gap-3 py-2"><span class="text-slate-500">Web</span><span class="text-blue-600">www.jandm.com</span></div>
      </div>
    </div>
    <div class="card p-6">
      <h4 class="font-semibold text-slate-800 mb-5">Sistema de Gestión Interno</h4>
      <div class="space-y-3 text-sm">
        <div class="flex justify-between gap-3 py-2 border-b border-slate-100"><span class="text-slate-500">Versión</span><span class="font-mono font-semibold text-slate-700">v1.0.0-beta</span></div>
        <div class="flex justify-between gap-3 py-2 border-b border-slate-100"><span class="text-slate-500">Entorno</span><span>${badge('Producción', 'green')}</span></div>
        <div class="flex justify-between gap-3 py-2 border-b border-slate-100"><span class="text-slate-500">Desarrollado por</span><span class="font-bold text-blue-700">Victecnology Lda</span></div>
        <div class="flex justify-between gap-3 py-2 border-b border-slate-100"><span class="text-slate-500">Soporte</span><span class="text-blue-500 text-xs">contacto@victecnology.com</span></div>
        <div class="flex justify-between gap-3 py-2 border-b border-slate-100"><span class="text-slate-500">Módulos activos</span><span class="font-semibold">8</span></div>
        <div class="flex justify-between gap-3 py-2"><span class="text-slate-500">Última actualización</span><span class="font-semibold">07/05/2026</span></div>
      </div>
      <div class="mt-5 p-4 bg-blue-50 rounded-xl">
        <p class="text-xs font-semibold text-blue-800 mb-1">Licencia de uso</p>
        <p class="text-xs text-blue-600">Este sistema es propiedad de J&M C.A. Su uso no autorizado está prohibido.</p>
      </div>
    </div>
  </div>`;
}

function confMenu() {
  return `<div>
    <div class="flex flex-wrap gap-2 mb-5">
      <button onclick="confTab('seguridad')"  id="conf-tab-seguridad"  class="btn-primary text-xs px-4 py-2 shrink-0"><i data-lucide="key-round" class="w-4 h-4"></i>Seguridad</button>
      <button onclick="confTab('auditoria')"  id="conf-tab-auditoria"  class="btn-secondary text-xs px-4 py-2 shrink-0"><i data-lucide="activity" class="w-4 h-4"></i>Auditoría</button>
      <button onclick="confTab('about')"      id="conf-tab-about"      class="btn-secondary text-xs px-4 py-2 shrink-0"><i data-lucide="info" class="w-4 h-4"></i>Acerca de</button>
    </div>
    <div id="conf-content-seguridad">${confSeguridad()}</div>
    <div id="conf-content-auditoria" class="hidden">${confAuditoria()}</div>
    <div id="conf-content-about"     class="hidden">${confAbout()}</div>
  </div>`;
}

// REPORTES — menú con tabs
function repSuperintendencia() {
  return `<div class="card p-3.5 mb-4 flex flex-wrap items-center gap-3">
    <select class="text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500">
      <option>Mayo 2026</option><option>Abril 2026</option><option>Marzo 2026</option>
    </select>
    <select class="text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500">
      <option>Todos los ramos</option><option>Vehículo Particular</option><option>Vehículo Comercial</option>
    </select>
    <button onclick="showToast('Generando reporte SUDEASEG…','info')" class="btn-primary ml-auto shrink-0"><i data-lucide="download" class="w-4 h-4"></i>Exportar SUDEASEG</button>
  </div>
  <div class="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-5">
    <div class="card p-4 text-center border-t-4 border-t-blue-500">
      <p class="text-xs text-slate-600 uppercase tracking-wide">Pólizas Emitidas</p>
      <p class="text-2xl font-black text-slate-800 mt-1">59</p>
      <p class="text-xs text-slate-400">Mayo 2026</p>
    </div>
    <div class="card p-4 text-center border-t-4 border-t-emerald-500">
      <p class="text-xs text-slate-600 uppercase tracking-wide">Prima Total</p>
      <p class="text-2xl font-black text-emerald-700 mt-1">$38,480</p>
      <p class="text-xs text-slate-400">USD</p>
    </div>
    <div class="card p-4 text-center border-t-4 border-t-amber-500">
      <p class="text-xs text-slate-600 uppercase tracking-wide">RC Obligatoria</p>
      <p class="text-2xl font-black text-amber-700 mt-1">59</p>
      <p class="text-xs text-slate-400">pólizas</p>
    </div>
    <div class="card p-4 text-center border-t-4 border-t-slate-400">
      <p class="text-xs text-slate-600 uppercase tracking-wide">Cancelaciones</p>
      <p class="text-2xl font-black text-slate-700 mt-1">3</p>
      <p class="text-xs text-slate-400">Mayo 2026</p>
    </div>
  </div>` +
    tbl([
      { l: 'Ramo', k: 'ramo', tr: true }, { l: 'Pólizas', k: 'pol', r: true, hide: 'sm' }, { l: 'Prima Neta', k: 'prima', r: true },
      { l: 'RC Obl.', k: 'rc', r: true, hide: 'md' }, { l: 'Canceladas', k: 'can', r: true, hide: 'md' }, { l: 'Prima Bs', k: 'bs2', r: true, hide: 'sm' }
    ], [
      { ramo: 'Vehículo Particular', pol: 47, prima: usd(28140), rc: 47, can: 2, bs2: bs(28140) },
      { ramo: 'Vehículo Comercial', pol: 12, prima: usd(10340), rc: 12, can: 1, bs2: bs(10340) },
      { ramo: 'TOTAL', pol: 59, prima: usd(38480), rc: 59, can: 3, bs2: bs(38480) },
    ]);
}

function repOficinas() {
  return `<div class="card p-3.5 mb-4 flex flex-wrap items-center gap-3">
    <input type="date" value="2026-05-01" class="min-w-0 text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500">
    <input type="date" value="2026-05-07" class="min-w-0 text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500">
    <select class="text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500">
      <option>Todas las oficinas</option><option>Caracas Principal</option><option>Valencia</option><option>Maracaibo</option>
    </select>
    <button onclick="showToast('Exportando reporte de oficinas…','info')" class="btn-secondary ml-auto shrink-0"><i data-lucide="download" class="w-4 h-4"></i>Exportar</button>
  </div>` +
    tbl([
      { l: 'Oficina', k: 'ofi', tr: true }, { l: 'Agentes', k: 'ag', r: true, hide: 'sm' }, { l: 'Pólizas', k: 'pol', r: true, hide: 'sm' },
      { l: 'Prima Neta', k: 'prima', r: true }, { l: '% del Total', k: 'pct', r: true, hide: 'md' }, { l: 'Estado', k: 'est', hide: 'md' }
    ], [
      { ofi: 'Caracas Principal', ag: 4, pol: 34, prima: usd(22640), pct: '58.8%', est: rsbadge('Activa') },
      { ofi: 'Valencia', ag: 2, pol: 15, prima: usd(9810), pct: '25.5%', est: rsbadge('Activa') },
      { ofi: 'Maracaibo', ag: 2, pol: 10, prima: usd(6030), pct: '15.7%', est: rsbadge('Activa') },
      { ofi: 'TOTAL', ag: 8, pol: 59, prima: usd(38480), pct: '100%', est: '' },
    ]);
}

function repPersonal() {
  return searchBar('s-personal', 'Buscar personal…',
    `<select class="text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500">
      <option>Todos los roles</option><option>Agente</option><option>Supervisor</option><option>Gerente</option>
    </select>
    <button onclick="showToast('Exportando reporte de personal…','info')" class="btn-secondary ml-auto"><i data-lucide="download" class="w-4 h-4"></i>Exportar</button>`,
    'tbl-personal') +
    tbl([
      { l: 'Nombre', k: 'nom', tr: true }, { l: 'Rol', k: 'rol', hide: 'sm' }, { l: 'Oficina', k: 'ofi', hide: 'md' },
      { l: 'Pólizas', k: 'pol', r: true, hide: 'sm' }, { l: 'Prima Generada', k: 'prima', r: true },
      { l: 'Comisión', k: 'com', r: true, hide: 'md' }, { l: 'Estado', k: 'est' }
    ], [
      { nom: 'Ana Suárez', rol: 'Agente', ofi: 'Caracas', pol: 18, prima: usd(9840), com: usd(984), est: rsbadge('Activo') },
      { nom: 'Luis Romero', rol: 'Agente', ofi: 'Caracas', pol: 21, prima: usd(11480), com: usd(1148), est: rsbadge('Activo') },
      { nom: 'Pedro Salazar', rol: 'Agente', ofi: 'Valencia', pol: 14, prima: usd(7280), com: usd(728), est: rsbadge('Activo') },
      { nom: 'Carla Mendoza', rol: 'Agente', ofi: 'Maracaibo', pol: 6, prima: usd(2880), com: usd(288), est: rsbadge('Activo') },
      { nom: 'Rosa Control', rol: 'Supervisor', ofi: 'Caracas', pol: '—', prima: '—', com: '—', est: rsbadge('Activo') },
    ], '', 'tbl-personal');
}

function repAutomaticos() {
  return `<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
    <div class="card p-6">
      <h4 class="font-semibold text-slate-800 mb-5 text-sm">Reportes Programados</h4>
      <div class="space-y-3">
        ${[
      ['Reporte diario de ventas', 'Diario 08:00 AM', true],
      ['Reporte semanal de pólizas', 'Lunes 07:00 AM', true],
      ['Reporte mensual SUDEASEG', '1er día del mes 00:01', true],
      ['Pólizas próximas a vencer', 'Diario 09:00 AM', true],
      ['Reporte de comisiones', 'Quincena (1 y 15)', false],
      ['Reporte de cobranza pendiente', 'Diario 08:30 AM', false],
    ].map(([lbl, sched, on]) => `
        <div class="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/50">
          <div class="flex-1">
            <p class="text-sm font-semibold text-slate-700">${lbl}</p>
            <p class="text-xs text-slate-400 mt-0.5">${sched}</p>
          </div>
          <div class="toggle-wrap ml-4">
            <input type="checkbox" ${on ? 'checked' : ''} class="toggle-input">
            <span class="toggle-track"></span>
          </div>
        </div>`).join('')}
      </div>
      <button onclick="showToast('Configuración de reportes automáticos guardada','success')" class="btn-primary mt-5"><i data-lucide="check" class="w-4 h-4"></i>Guardar</button>
    </div>
    <div class="card p-6">
      <h4 class="font-semibold text-slate-800 mb-5 text-sm">Últimos Reportes Generados</h4>` +
    tbl([{ l: 'Reporte', k: 'rep', tr: true }, { l: 'Fecha/Hora', k: 'fecha', hide: 'sm' }, { l: 'Estado', k: 'est' }, { l: '', k: 'acc', acc: true }], [
      { rep: 'Ventas diarias', fecha: '07/05/2026 08:00', est: rsbadge('Generado') },
      { rep: 'Pólizas por vencer', fecha: '07/05/2026 09:00', est: rsbadge('Generado') },
      { rep: 'Ventas diarias', fecha: '06/05/2026 08:00', est: rsbadge('Generado') },
      { rep: 'SUDEASEG Mayo', fecha: '01/05/2026 00:01', est: rsbadge('Generado') },
      { rep: 'Comisiones quincenal', fecha: '01/05/2026 00:05', est: rsbadge('Generado') },
    ].map(r => ({ ...r, acc: `<button onclick="showToast('Descargando reporte','info')" class="text-xs text-blue-600 hover:underline font-semibold flex items-center gap-1"><i data-lucide="download" class="w-4 h-4"></i>Descargar</button>` }))) +
    `</div></div>`;
}

function repVentasComisiones() {
  return `<div class="card p-3.5 mb-4 flex flex-wrap items-center gap-3">
    <div class="relative flex-1 min-w-44">
      <input type="text" placeholder="Buscar…" class="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition">
      <i data-lucide="search" class="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"></i>
    </div>
    <input type="date" value="2026-05-01" class="min-w-0 text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500">
    <input type="date" value="2026-05-07" class="min-w-0 text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500">
    <button onclick="showToast('Exportando reporte…','info')" class="btn-secondary ml-auto shrink-0"><i data-lucide="download" class="w-4 h-4"></i>Exportar</button>
  </div>
  <h4 class="font-semibold text-slate-700 mb-3 text-sm">Ventas del Período</h4>` +
    tbl([{ l: 'Fecha', k: 'fecha', hide: 'sm' }, { l: 'Póliza', k: 'pol', m: true, hide: 'md' }, { l: 'Agente', k: 'agente', tr: true }, { l: 'Tipo', k: 'tipo', hide: 'lg', tr: true }, { l: 'Prima Neta', k: 'prima', r: true }, { l: 'Estado', k: 'est' }], [
      { fecha: '02/05/2026', pol: 'SEF-2026-VEH-00848', agente: 'Pedro Salazar', tipo: 'Vehículo Particular', prima: usd(532.50), est: rsbadge('Vigente') },
      { fecha: '01/05/2026', pol: 'SEF-2026-VEH-00847', agente: 'Ana Suárez', tipo: 'Vehículo Particular', prima: usd(714.20), est: rsbadge('Vigente') },
      { fecha: '30/04/2026', pol: 'SEF-2026-VEH-00846', agente: 'Luis Romero', tipo: 'Vehículo Comercial', prima: usd(1240.00), est: rsbadge('Vigente') },
      { fecha: '29/04/2026', pol: 'SEF-2026-VEH-00845', agente: 'Carla Mendoza', tipo: 'Vehículo Particular', prima: usd(487.00), est: rsbadge('Vigente') },
    ]) +
    `<h4 class="font-semibold text-slate-700 mb-3 mt-6 text-sm">Comisiones del Período</h4>` +
    tbl([{ l: 'Beneficiario', k: 'ben', tr: true }, { l: 'Rol', k: 'rol', hide: 'sm' }, { l: 'Pólizas', k: 'pol', r: true, hide: 'sm' }, { l: 'Base', k: 'base', r: true, hide: 'md' }, { l: 'Tasa', k: 'tasa', r: true, hide: 'md' }, { l: 'Comisión', k: 'com', r: true }, { l: 'Estado', k: 'est' }], [
      { ben: 'Pedro Salazar', rol: 'Agente', pol: 14, base: usd(7280), tasa: '10%', com: usd(728.00), est: rsbadge('Pendiente') },
      { ben: 'Ana Suárez', rol: 'Agente', pol: 18, base: usd(9840), tasa: '10%', com: usd(984.00), est: rsbadge('Pagada') },
      { ben: 'Luis Romero', rol: 'Agente', pol: 21, base: usd(11480), tasa: '10%', com: usd(1148.00), est: rsbadge('Pendiente') },
      { ben: 'Romero & Asoc.', rol: 'Corredor', pol: 12, base: usd(6240), tasa: '5%', com: usd(312.00), est: rsbadge('Pagada') },
    ]);
}

function repMenu() {
  return `<div>
    <div class="flex flex-wrap gap-2 mb-5">
      <button onclick="repTab('ventas')"           id="rep-tab-ventas"           class="btn-primary text-xs px-4 py-2 shrink-0"><i data-lucide="trending-up" class="w-4 h-4"></i>Ventas / Comisiones</button>
      <button onclick="repTab('superintendencia')" id="rep-tab-superintendencia" class="btn-secondary text-xs px-4 py-2 shrink-0"><i data-lucide="shield" class="w-4 h-4"></i>Superintendencia</button>
      <button onclick="repTab('oficinas')"         id="rep-tab-oficinas"         class="btn-secondary text-xs px-4 py-2 shrink-0"><i data-lucide="building-2" class="w-4 h-4"></i>Oficinas</button>
      <button onclick="repTab('personal')"         id="rep-tab-personal"         class="btn-secondary text-xs px-4 py-2 shrink-0"><i data-lucide="users" class="w-4 h-4"></i>Personal</button>
      <button onclick="repTab('automaticos')"      id="rep-tab-automaticos"      class="btn-secondary text-xs px-4 py-2 shrink-0"><i data-lucide="refresh-cw" class="w-4 h-4"></i>Automáticos</button>
    </div>
    <div id="rep-content-ventas">${repVentasComisiones()}</div>
    <div id="rep-content-superintendencia" class="hidden">${repSuperintendencia()}</div>
    <div id="rep-content-oficinas"         class="hidden">${repOficinas()}</div>
    <div id="rep-content-personal"         class="hidden">${repPersonal()}</div>
    <div id="rep-content-automaticos"      class="hidden">${repAutomaticos()}</div>
  </div>`;
}

// HOME
function viewHome() {
  return `
  <div class="animate-in fade-in duration-700 pt-4 sm:pt-6">
    <div class="card w-full max-w-xl mx-auto overflow-hidden">
      <!-- User info -->
      <div class="flex flex-col items-center text-center px-8 sm:px-14 pt-8 sm:pt-10 pb-7 sm:pb-9 border-b border-slate-100">
        <div class="w-20 h-20 rounded-3xl bg-jm-blue flex items-center justify-center text-2xl font-extrabold text-white mb-5 shadow-xl shadow-blue-900/20">
          CR
        </div>
        <p class="text-xs font-bold text-slate-400 uppercase tracking-[0.28em] mb-2">Bienvenido de vuelta</p>
        <h2 class="text-2xl sm:text-3xl font-black text-slate-800 mb-2 tracking-tight">Carlos Ruiz</h2>
        <p class="text-sm font-semibold text-slate-500">Asesor de Ventas · J&M C.A.</p>
        <p class="text-xs text-slate-400 font-mono mt-1.5">RIF: J-30012345-6 · Caracas Principal</p>
      </div>
      <!-- Quick access -->
      <div class="grid grid-cols-3 divide-x divide-slate-100">
        <button onclick="navigateTo('cli-cliente')"
          class="flex flex-col items-center gap-2.5 py-8 px-3 hover:bg-blue-50/60 transition-colors duration-200 group">
          <div class="w-11 h-11 rounded-2xl bg-blue-100 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
            <i data-lucide="users" class="w-5 h-5 text-blue-600"></i>
          </div>
          <div>
            <p class="text-sm font-bold text-slate-700">Clientes</p>
            <p class="text-xs text-slate-400 mt-0.5">Gestionar</p>
          </div>
        </button>
        <button onclick="navigateTo('cot-simulador')"
          class="flex flex-col items-center gap-2.5 py-8 px-3 hover:bg-emerald-50/60 transition-colors duration-200 group">
          <div class="w-11 h-11 rounded-2xl bg-emerald-100 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
            <i data-lucide="calculator" class="w-5 h-5 text-emerald-600"></i>
          </div>
          <div>
            <p class="text-sm font-bold text-slate-700">Simulador</p>
            <p class="text-xs text-slate-400 mt-0.5">Cotizar</p>
          </div>
        </button>
        <button onclick="navigateTo('rep-menu')"
          class="flex flex-col items-center gap-2.5 py-8 px-3 hover:bg-amber-50/60 transition-colors duration-200 group">
          <div class="w-11 h-11 rounded-2xl bg-amber-100 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
            <i data-lucide="bar-chart-3" class="w-5 h-5 text-amber-500"></i>
          </div>
          <div>
            <p class="text-sm font-bold text-slate-700">Reportes</p>
            <p class="text-xs text-slate-400 mt-0.5">Ver</p>
          </div>
        </button>
      </div>
    </div>
  </div>`;
}

function _viewHomeOld_unused() {
  return `
  <div class="animate-in fade-in slide-in-from-bottom-4 duration-700">
    <div class="card p-6 md:p-10">
      <div class="flex items-center justify-between mb-6">
        <h3 class="text-xl font-bold text-slate-800">Simulador de Cotizaciones</h3>
        <span class="text-xs font-bold text-slate-500 uppercase tracking-widest">J&M</span>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        <!-- Formulario -->
        <div class="lg:col-span-7 space-y-6">
          <div>
            <p class="input-label mb-3">Tipo de Seguro</p>
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <button class="type-btn active h-20">
                <i data-lucide="car" class="w-6 h-6"></i>
                <span class="text-xs font-bold">Auto</span>
              </button>
              <button class="type-btn group h-20">
                <i data-lucide="home" class="w-6 h-6 text-slate-500 group-hover:text-jm-green"></i>
                <span class="text-xs font-bold text-slate-600 group-hover:text-jm-green">Hogar</span>
              </button>
              <button class="type-btn group h-20">
                <i data-lucide="heart" class="w-6 h-6 text-slate-500 group-hover:text-jm-green"></i>
                <span class="text-xs font-bold text-slate-600 group-hover:text-jm-green">Vida</span>
              </button>
              <button class="type-btn group h-20">
                <i data-lucide="plane" class="w-6 h-6 text-slate-500 group-hover:text-jm-green"></i>
                <span class="text-xs font-bold text-slate-600 group-hover:text-jm-green">Viajes</span>
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
            <input type="text" class="input-control h-10" placeholder="ejemplo@jandm.com" value="cruiz@jandm.com">
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
              <span class="text-lg font-black text-jm-blue">$ 15.000,00</span>
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
                <p class="text-xs font-bold text-slate-500 uppercase tracking-widest">Prima Mensual Estada</p>
                <p class="text-2xl md:text-3xl font-black text-jm-green tracking-tight">$ 150.00</p>
              </div>
            </div>

            <div class="space-y-2 mb-8">
              <p class="text-xs font-bold text-slate-500 uppercase tracking-widest">Prima Anual Estimada</p>
              <p class="text-2xl md:text-3xl font-black text-jm-green tracking-tight">$ 2.000.00</p>
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
  return `<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
    <div class="card p-6 lg:col-span-2">
      <h4 class="font-semibold text-slate-800 mb-5">Información Personal</h4>
      <div class="flex items-center gap-5 pb-5 mb-5 border-b border-slate-100">
        <div class="w-16 h-16 rounded-2xl bg-jm-dark flex items-center justify-center text-xl font-extrabold text-white shrink-0">CR</div>
        <div>
          <p class="font-bold text-slate-800">Carlos Ruiz</p>
          <p class="text-sm text-slate-500">Asesor de Ventas · J&M C.A.</p>
          <button onclick="showToast('Función de cambio de foto próximamente','info')" class="text-xs text-blue-600 font-semibold hover:underline mt-1">Cambiar foto</button>
        </div>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
          <div class="flex flex-wrap justify-between gap-3"><span class="text-slate-500">Usuario</span><span class="font-mono font-semibold text-slate-700">vadmin</span></div>
          <div class="flex flex-wrap justify-between gap-3"><span class="text-slate-500">Rol</span><span class="font-semibold text-blue-700">Gerente Regional</span></div>
          <div class="flex flex-wrap justify-between gap-3"><span class="text-slate-500">Último acceso</span><span class="text-slate-600">03/05/2026 09:14</span></div>
          <div class="flex flex-wrap justify-between gap-3"><span class="text-slate-500">Estado</span>${badge('Activo', 'green')}</div>
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
  return `<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
    <!-- LEFT: security recommendations -->
    <div class="card p-6">
      <h4 class="font-semibold text-slate-700 text-sm mb-4">Recomendaciones de Seguridad</h4>
      <div class="space-y-3">
        ${[
      ['Usa al menos 8 caracteres', true],
      ['Combina letras, números y símbolos', true],
      ['No uses la misma contraseña en otros sitios', true],
      ['Cambia tu contraseña cada 90 días', false],
      ['Activa el cierre de sesión automático', false],
    ].map(([tip, ok]) => `
        <div class="flex items-start gap-3 p-3 rounded-xl ${ok ? 'bg-emerald-50' : 'bg-amber-50'}">
          <i data-lucide="${ok ? 'check-circle' : 'alert-triangle'}" class="w-4 h-4 ${ok ? 'text-emerald-600' : 'text-amber-600'} shrink-0 mt-0.5"></i>
          <p class="text-sm ${ok ? 'text-emerald-800' : 'text-amber-800'}">${tip}</p>
        </div>`).join('')}
      </div>
    </div>
    <!-- RIGHT: change password -->
    ${formCard([
      { label: 'Contraseña actual', type: 'password', ph: '••••••••', span: true },
      { label: 'Nueva contraseña', type: 'password', ph: '••••••••' },
      { label: 'Confirmar contraseña', type: 'password', ph: '••••••••' },
    ], 'Actualizar Contraseña', "showToast('Contraseña actualizada correctamente','success')")}
  </div>`;
}

function confPrefs() {
  return `<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
    { usr: 'vadmin', nom: 'Victor Admin', rol: 'Gerente Regional', email: 'vadmin@jandm.com', ult: '03/05/2026', est: 'Activo' },
    { usr: 'psalazar', nom: 'Pedro Salazar', rol: 'Agente', email: 'psalazar@jandm.com', ult: '03/05/2026', est: 'Activo' },
    { usr: 'asuarez', nom: 'Ana Suárez', rol: 'Agente', email: 'asuarez@jandm.com', ult: '02/05/2026', est: 'Activo' },
    { usr: 'lromero', nom: 'Luis Romero', rol: 'Agente', email: 'lromero@jandm.com', ult: '02/05/2026', est: 'Activo' },
    { usr: 'cmendoza', nom: 'Carla Mendoza', rol: 'Agente', email: 'cmendoza@jandm.com', ult: '01/05/2026', est: 'Activo' },
    { usr: 'rcontrol', nom: 'Rosa Control', rol: 'Supervisor', email: 'rcontrol@jandm.com', ult: '03/05/2026', est: 'Activo' },
    { usr: 'jaudit', nom: 'Juan Auditor', rol: 'Solo Lectura', email: 'jaudit@jandm.com', ult: '28/04/2026', est: 'Activo' },
    { usr: 'xbaja', nom: 'Xavier Baja', rol: 'Agente', email: 'xbaja@jandm.com', ult: '15/03/2026', est: 'Inactivo' },
  ];
  return searchBar('s-usr', 'Buscar usuario…',
    `<button onclick="showToast('Formulario nuevo usuario','info')" class="btn-primary ml-auto"><i data-lucide="plus" class="w-4 h-4"></i>Nuevo Usuario</button>`,
    'tbl-usuarios') +
    tbl([{ l: 'Usuario', k: 'usr', m: true, hide: 'md' }, { l: 'Nombre', k: 'nom', tr: true }, { l: 'Rol', k: 'rol', hide: 'sm' }, { l: 'Email', k: 'email', hide: 'lg', tr: true }, { l: 'Último Acceso', k: 'ult', hide: 'md' }, { l: 'Estado', k: 'est' }, { l: '', k: 'acc', acc: true }],
      usuarios.map(u => ({
        ...u, acc: `<div class="flex gap-1 justify-center flex-nowrap max-w-none">
      <button onclick="showToast('Editando usuario…','info')" class="p-2 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition" title="Editar"><i data-lucide="pencil" class="w-4 h-4"></i></button>
      <button onclick="showToast('Usuario desactivado','warning')" class="p-2 rounded-lg bg-rose-50 text-rose-500 hover:bg-rose-100 transition" title="Desactivar"><i data-lucide="user-x" class="w-4 h-4"></i></button>
    </div>`})), '', 'tbl-usuarios');
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
  return `<div class="grid grid-cols-1 lg:grid-cols-5 gap-6">
    <div class="lg:col-span-2">` +
    tbl([{ l: 'Rol', k: 'rol' }, { l: 'Usuarios', k: 'usuarios', r: true }, { l: 'Descripción', k: 'desc', hide: 'sm', tr: true }], roles) +
    `<button onclick="showToast('Nuevo rol','info')" class="btn-primary mt-4"><i data-lucide="plus" class="w-4 h-4"></i>Nuevo Rol</button>
    </div>
    <div class="lg:col-span-3 card overflow-hidden">
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
  return `<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
    ${formCard([
    { label: 'Razón Social', val: 'La Venezolana de Seguros y Vida C.A.', span: true },
    { label: 'RIF', val: 'J-30012345-6' },
    { label: 'Registro SUDEASEG', val: 'RSE-2010-00247' },
    { label: 'Dirección', val: 'Av. Francisco de Miranda, Torre empresarial, Caracas', span: true },
    { label: 'Teléfono Principal', val: '+58 212-555-0100' },
    { label: 'Teléfono Secundario', val: '+58 212-555-0101' },
    { label: 'Email Corporativo', val: 'info@jandm.com' },
    { label: 'Sitio Web', val: 'www.jandm.com' },
  ], 'Guardar Datos Empresa')}

    <div class="space-y-5">
      <div class="card p-5">
        <h4 class="font-semibold text-slate-700 text-sm mb-4">Regulación</h4>
        <div class="space-y-2.5 text-sm">
          <div class="flex flex-wrap justify-between gap-3"><span class="text-slate-500">Organismo</span><span class="font-semibold text-blue-700">SUDEASEG</span></div>
          <div class="flex flex-wrap justify-between gap-3"><span class="text-slate-500">Resolución</span><span class="font-mono text-xs text-slate-600">RSE-2010-00247</span></div>
          <div class="flex flex-wrap justify-between gap-3"><span class="text-slate-500">Moneda base</span><span class="font-semibold">USD</span></div>
          <div class="flex flex-wrap justify-between gap-3"><span class="text-slate-500">País</span><span class="font-semibold">Venezuela</span></div>
          <div class="flex flex-wrap justify-between gap-3"><span class="text-slate-500">Vigencia</span><span class="font-semibold text-emerald-700">Vigente</span></div>
        </div>
      </div>
      <div class="card p-5">
        <h4 class="font-semibold text-slate-700 text-sm mb-4">Información del Sistema</h4>
        <div class="space-y-2.5 text-sm">
          <div class="flex flex-wrap justify-between gap-3"><span class="text-slate-500">Versión</span><span class="font-mono text-xs text-slate-700">v1.0.0-beta</span></div>
          <div class="flex flex-wrap justify-between gap-3"><span class="text-slate-500">Entorno</span>${badge('Producción', 'green')}</div>
          <div class="flex flex-wrap justify-between gap-3"><span class="text-slate-500">Desarrollado por</span><span class="font-semibold text-blue-700">Victecnology Lda</span></div>
          <div class="flex flex-wrap justify-between gap-3"><span class="text-slate-500">Soporte</span><span class="text-xs text-blue-500">contacto@victecnology.com</span></div>
        </div>
      </div>
    </div>
  </div>`;
}

function confAuditoria() {
  return reportBase('Auditoría', [
    { l: 'Fecha/Hora', k: 'dt', hide: 'sm' }, { l: 'Usuario', k: 'usr', m: true }, { l: 'Acción', k: 'acc' }, { l: 'Módulo', k: 'mod', hide: 'sm' }, { l: 'Detalle', k: 'det', hide: 'lg', tr: true }, { l: 'IP', k: 'ip', m: true, hide: 'lg' }
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
  return `<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
    <div class="card p-6">
      <h4 class="font-semibold text-slate-800 mb-5 text-sm">Respaldo Manual</h4>
      <div class="p-5 bg-slate-50 rounded-xl mb-5 text-sm space-y-2">
        <div class="flex flex-wrap justify-between gap-3"><span class="text-slate-500">Último respaldo</span><span class="font-semibold">02/05/2026 23:00</span></div>
        <div class="flex flex-wrap justify-between gap-3"><span class="text-slate-500">Tamaño</span><span class="font-semibold">14.2 MB</span></div>
        <div class="flex flex-wrap justify-between gap-3"><span class="text-slate-500">Estado</span>${badge('Completado', 'green')}</div>
        <div class="flex flex-wrap justify-between gap-3"><span class="text-slate-500">Ubicación</span><span class="font-mono text-xs text-slate-600">/backups/sefired_20260502.tar.gz</span></div>
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
    { label: 'Ruta de destino', val: '/backups/jm/', span: true },
  ])}
        <label class="flex items-center justify-between cursor-pointer">
          <span class="text-sm text-slate-700">Respaldo automático activo</span>
          <div class="toggle-wrap"><input type="checkbox" checked class="toggle-input"><span class="toggle-track"></span></div>
        </label>
      </div>
      <button onclick="showToast('Configuración de respaldo guardada','success')" class="btn-primary"><i data-lucide="check" class="w-4 h-4"></i>Guardar</button>
    </div>
    <div class="card p-6 lg:col-span-2">
      <h4 class="font-semibold text-slate-800 mb-4 text-sm">Historial de Respaldos</h4>` +
    tbl([{ l: 'Fecha', k: 'f' }, { l: 'Hora', k: 'h', hide: 'sm' }, { l: 'Tamaño', k: 'tam', hide: 'sm' }, { l: 'Tipo', k: 'tipo' }, { l: 'Estado', k: 'est' }, { l: '', k: 'acc', acc: true }], [
      { f: '02/05/2026', h: '23:00', tam: '14.2 MB', tipo: badge('Automático', 'blue'), est: rsbadge('Completado') },
      { f: '01/05/2026', h: '23:00', tam: '13.9 MB', tipo: badge('Automático', 'blue'), est: rsbadge('Completado') },
      { f: '30/04/2026', h: '23:00', tam: '13.8 MB', tipo: badge('Automático', 'blue'), est: rsbadge('Completado') },
      { f: '29/04/2026', h: '11:32', tam: '13.6 MB', tipo: badge('Manual', 'amber'), est: rsbadge('Completado') },
    ].map(r => ({ ...r, acc: `<button onclick="showToast('Descargando respaldo','info')" class="text-xs text-blue-600 hover:underline font-semibold">Descargar</button>` }))) +
    `</div>
  </div>`;
}

// ── MODAL SYSTEM ──────────────────────────────────────────────
window.closeModal = function () {
  document.getElementById('modal-overlay')?.classList.add('hidden');
  document.getElementById('modal-box').innerHTML = '';
};

window.showModal = function (title, bodyHtml, footerHtml = '') {
  const box = document.getElementById('modal-box');
  box.innerHTML = `
    <div class="p-6 sm:p-8">
      <div class="flex items-center justify-between mb-5">
        <h3 class="text-lg font-bold text-slate-800">${title}</h3>
        <button onclick="closeModal()" class="p-1.5 hover:bg-slate-100 rounded-xl transition shrink-0">
          <i data-lucide="x" class="w-5 h-5 text-slate-500"></i>
        </button>
      </div>
      <div>${bodyHtml}</div>
      ${footerHtml ? `<div class="flex flex-wrap gap-3 justify-end mt-6">${footerHtml}</div>` : ''}
    </div>
  `;
  document.getElementById('modal-overlay')?.classList.remove('hidden');
  createIcons({ icons: ALL_ICONS });
};

window.showConfirmDelete = function (name) {
  showModal(
    'Confirmar eliminación',
    `<div class="flex flex-col items-center text-center gap-4 py-2">
      <div class="w-14 h-14 rounded-full bg-rose-100 flex items-center justify-center">
        <i data-lucide="trash-2" class="w-7 h-7 text-rose-600"></i>
      </div>
      <div>
        <p class="font-semibold text-slate-800 mb-1">¿Eliminar <em>${name}</em>?</p>
        <p class="text-sm text-slate-500">Esta acción no se puede deshacer.</p>
      </div>
    </div>`,
    `<button onclick="closeModal()" class="btn-secondary">Cancelar</button>
     <button onclick="closeModal();showToast('Registro eliminado','error')" class="btn-danger"><i data-lucide="trash-2" class="w-4 h-4"></i>Eliminar</button>`
  );
};

window.showEditForm = function (title, fieldsHtml) {
  showModal(
    title,
    `<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">${fieldsHtml}</div>`,
    `<button onclick="closeModal()" class="btn-secondary">Cancelar</button>
     <button onclick="closeModal();showToast('Cambios guardados','success')" class="btn-primary"><i data-lucide="check" class="w-4 h-4"></i>Guardar</button>`
  );
};

// ── USUARIOS ─────────────────────────────────────────────────
function usrLista() {
  const ROLES = ['Admin', 'Oficina', 'Vendedor Sucursal', 'Vendedor Calle'];
  const ROLE_COLOR = { 'Admin': 'indigo', 'Oficina': 'blue', 'Vendedor Sucursal': 'green', 'Vendedor Calle': 'amber' };
  const roleBadge = r => badge(r, ROLE_COLOR[r] || 'slate');

  const users = [
    { init: 'CR', nom: 'Carlos Ruiz', email: 'c.ruiz@jandm.com', rol: 'Admin', oficina: 'Caracas Principal', est: 'Activo', ultimo: '07/05/2026 08:12' },
    { init: 'PS', nom: 'Pedro Salazar', email: 'p.salazar@jandm.com', rol: 'Oficina', oficina: 'Caracas Principal', est: 'Activo', ultimo: '07/05/2026 07:55' },
    { init: 'AS', nom: 'Ana Suárez', email: 'a.suarez@jandm.com', rol: 'Vendedor Sucursal', oficina: 'Valencia', est: 'Activo', ultimo: '06/05/2026 16:30' },
    { init: 'LR', nom: 'Luis Romero', email: 'l.romero@jandm.com', rol: 'Vendedor Calle', oficina: 'Caracas Principal', est: 'Activo', ultimo: '06/05/2026 14:15' },
    { init: 'VM', nom: 'Valentina Mora', email: 'v.mora@jandm.com', rol: 'Vendedor Sucursal', oficina: 'Maracaibo', est: 'Bloqueado', ultimo: '02/05/2026 11:00' },
    { init: 'JG', nom: 'José González', email: 'j.gonzalez@jandm.com', rol: 'Vendedor Calle', oficina: 'Valencia', est: 'Activo', ultimo: '05/05/2026 09:45' },
    { init: 'MT', nom: 'María Torres', email: 'm.torres@jandm.com', rol: 'Oficina', oficina: 'Maracaibo', est: 'Activo', ultimo: '07/05/2026 08:00' },
    { init: 'RD', nom: 'Ricardo Díaz', email: 'r.diaz@jandm.com', rol: 'Vendedor Calle', oficina: 'Caracas Principal', est: 'Bloqueado', ultimo: '28/04/2026 17:22' },
    { init: 'GF', nom: 'Gabriela Flores', email: 'g.flores@jandm.com', rol: 'Vendedor Sucursal', oficina: 'Caracas Principal', est: 'Activo', ultimo: '07/05/2026 09:30' },
    { init: 'EM', nom: 'Eduardo Medina', email: 'e.medina@jandm.com', rol: 'Oficina', oficina: 'Valencia', est: 'Activo', ultimo: '06/05/2026 15:50' },
  ];

  const estBadge = est => est === 'Activo'
    ? `<span class="badge badge-green">Activo</span>`
    : `<span class="badge badge-red">Bloqueado</span>`;

  const userAcc = u => `
    <div class="grid grid-cols-3 sm:flex sm:flex-nowrap gap-1.5 sm:gap-1 items-center justify-center">
      <button onclick="showEditUser('${u.nom}','${u.email}','${u.rol}','${u.oficina}')"
        class="p-1.5 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 transition inline-flex items-center justify-center" title="Editar">
        <i data-lucide="pencil" class="w-5 h-5"></i>
      </button>
      <button onclick="showUserPerms('${u.nom}','${u.rol}')"
        class="p-1.5 rounded-xl bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition inline-flex items-center justify-center" title="Permisos">
        <i data-lucide="shield" class="w-5 h-5"></i>
      </button>
      <button onclick="showChangeRole('${u.nom}','${u.rol}')"
        class="p-1.5 rounded-xl bg-amber-50 text-amber-600 hover:bg-amber-100 transition inline-flex items-center justify-center" title="Cambiar rol">
        <i data-lucide="user-cog" class="w-5 h-5"></i>
      </button>
      <button onclick="showBlockUser('${u.nom}','${u.est}')"
        class="p-1.5 rounded-xl bg-orange-50 text-orange-600 hover:bg-orange-100 transition inline-flex items-center justify-center" title="${u.est === 'Activo' ? 'Bloquear' : 'Desbloquear'}">
        <i data-lucide="${u.est === 'Activo' ? 'lock' : 'lock-open'}" class="w-5 h-5"></i>
      </button>
      <button onclick="showConfirmDelete('${u.nom}')"
        class="p-1.5 rounded-xl bg-rose-50 text-rose-500 hover:bg-rose-100 transition inline-flex items-center justify-center" title="Eliminar">
        <i data-lucide="trash-2" class="w-5 h-5"></i>
      </button>
    </div>`;

  const byRole = ROLES.reduce((a, r) => ({ ...a, [r]: users.filter(u => u.rol === r).length }), {});
  const blocked = users.filter(u => u.est === 'Bloqueado').length;

  return `<div class="animate-in fade-in duration-500">
    <!-- Stats -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <div class="card p-4 flex items-start gap-3">
        <div class="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
          <i data-lucide="users" class="w-4 h-4 text-slate-600"></i>
        </div>
        <div class="min-w-0">
          <p class="text-xs text-slate-500 font-medium leading-tight">Total Usuarios</p>
          <p class="text-xl font-black text-slate-800 mt-0.5 leading-none">${users.length}</p>
          <p class="text-xs text-slate-400 mt-1">${users.length - blocked} activos</p>
        </div>
      </div>
      <div class="card p-4 flex items-start gap-3">
        <div class="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
          <i data-lucide="shield-check" class="w-4 h-4 text-indigo-600"></i>
        </div>
        <div class="min-w-0">
          <p class="text-xs text-slate-500 font-medium leading-tight">Administradores</p>
          <p class="text-xl font-black text-slate-800 mt-0.5 leading-none">${byRole['Admin']}</p>
          <p class="text-xs text-slate-400 mt-1">Acceso total</p>
        </div>
      </div>
      <div class="card p-4 flex items-start gap-3">
        <div class="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
          <i data-lucide="user-check" class="w-4 h-4 text-emerald-600"></i>
        </div>
        <div class="min-w-0">
          <p class="text-xs text-slate-500 font-medium leading-tight">Vendedores</p>
          <p class="text-xl font-black text-slate-800 mt-0.5 leading-none">${byRole['Vendedor Sucursal'] + byRole['Vendedor Calle']}</p>
          <p class="text-xs text-slate-400 mt-1">Sucursal + Calle</p>
        </div>
      </div>
      <div class="card p-4 flex items-start gap-3">
        <div class="w-9 h-9 rounded-xl bg-rose-100 flex items-center justify-center shrink-0">
          <i data-lucide="user-x" class="w-4 h-4 text-rose-600"></i>
        </div>
        <div class="min-w-0">
          <p class="text-xs text-slate-500 font-medium leading-tight">Bloqueados</p>
          <p class="text-xl font-black text-slate-800 mt-0.5 leading-none">${blocked}</p>
          <p class="text-xs text-slate-400 mt-1">Sin acceso</p>
        </div>
      </div>
    </div>

    <!-- Role filter chips -->
    <div class="flex flex-wrap gap-2 mb-4">
      ${['Todos', ...ROLES].map((r, i) => `
      <button onclick="filterUsersRole('${r}',${i})"
        id="usr-chip-${i}"
        class="px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${i === 0 ? 'bg-jm-blue text-white border-jm-blue' : 'bg-white text-slate-600 border-slate-200 hover:border-jm-blue hover:text-jm-blue'}">
        ${r}${i > 0 ? ` · ${byRole[r]}` : ''}
      </button>`).join('')}
    </div>

    ${searchBar('s-usr', 'Buscar por nombre, email o rol…',
    `<button onclick="showNewUserModal()" class="btn-primary"><i data-lucide="user-plus" class="w-4 h-4"></i>Nuevo Usuario</button>`,
    'tbl-usuarios'
  )}

    ${tbl([
    { l: 'Usuario', k: 'usr' },
    { l: 'Rol', k: 'rolb', hide: 'sm' },
    { l: 'Oficina', k: 'oficina', hide: 'md', tr: true },
    { l: 'Último acceso', k: 'ultimo', hide: 'lg', nw: true },
    { l: 'Estado', k: 'estb' },
    { l: '', k: 'acc', acc: true },
  ], users.map(u => ({
    usr: `<div class="flex items-center gap-2 sm:gap-2.5 min-w-0">
        <div class="w-6 h-6 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl ${u.est === 'Bloqueado' ? 'bg-slate-300' : 'bg-jm-blue'} flex items-center justify-center text-[9px] sm:text-[10px] font-bold text-white shrink-0">${u.init}</div>
        <div class="min-w-0">
          <p class="font-semibold text-slate-800 text-xs sm:text-sm break-words">${u.nom}</p>
          <p class="text-[10px] sm:text-xs text-slate-400 truncate">${u.email}</p>
        </div>
      </div>`,
    rolb: roleBadge(u.rol),
    oficina: u.oficina,
    ultimo: u.ultimo,
    estb: rsbadge(u.est),
    acc: userAcc(u),
  })), '', 'tbl-usuarios')}
  </div>`;
}

window.filterUsersRole = function (rol, idx) {
  document.querySelectorAll('[id^="usr-chip-"]').forEach((chip, i) => {
    const active = i === idx;
    chip.className = `px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${active
      ? 'bg-jm-blue text-white border-jm-blue'
      : 'bg-white text-slate-600 border-slate-200 hover:border-jm-blue hover:text-jm-blue'}`;
  });
  document.querySelectorAll('#tbl-usuarios tbody tr').forEach(row => {
    if (rol === 'Todos') { row.classList.remove('hidden'); return; }
    const text = row.querySelector('td:nth-child(2)')?.textContent || '';
    row.classList.toggle('hidden', !text.includes(rol));
  });
};

window.showNewUserModal = function () {
  showModal('Nuevo Usuario', `
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div>
        <label class="field-label">Nombre completo <span class="text-rose-500">*</span></label>
        <input class="input-field" placeholder="Nombre Apellido">
      </div>
      <div>
        <label class="field-label">Correo electrónico <span class="text-rose-500">*</span></label>
        <input type="email" class="input-field" placeholder="usuario@jandm.com">
      </div>
      <div>
        <label class="field-label">Contraseña temporal <span class="text-rose-500">*</span></label>
        <input type="password" class="input-field" placeholder="••••••••">
      </div>
      <div>
        <label class="field-label">Confirmar contraseña <span class="text-rose-500">*</span></label>
        <input type="password" class="input-field" placeholder="••••••••">
      </div>
      <div>
        <label class="field-label">Rol <span class="text-rose-500">*</span></label>
        <select class="select-field">
          <option value="" disabled selected>Seleccionar rol…</option>
          <option>Admin</option>
          <option>Oficina</option>
          <option>Vendedor Sucursal</option>
          <option>Vendedor Calle</option>
        </select>
      </div>
      <div>
        <label class="field-label">Oficina <span class="text-rose-500">*</span></label>
        <select class="select-field">
          <option>Caracas Principal</option>
          <option>Valencia</option>
          <option>Maracaibo</option>
        </select>
      </div>
      <div class="sm:col-span-2">
        <label class="field-label">Teléfono</label>
        <input class="input-field" placeholder="+58 414-000-0000">
      </div>
    </div>`,
    `<button onclick="closeModal()" class="btn-secondary">Cancelar</button>
     <button onclick="closeModal();showToast('Usuario creado correctamente','success')" class="btn-primary"><i data-lucide="check" class="w-4 h-4"></i>Crear Usuario</button>`
  );
};

window.showEditUser = function (nom, email, rol, oficina) {
  showModal(`Editar Usuario — ${nom}`, `
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div>
        <label class="field-label">Nombre completo</label>
        <input class="input-field" value="${nom}">
      </div>
      <div>
        <label class="field-label">Correo electrónico</label>
        <input type="email" class="input-field" value="${email}">
      </div>
      <div>
        <label class="field-label">Rol</label>
        <select class="select-field">
          ${['Admin', 'Oficina', 'Vendedor Sucursal', 'Vendedor Calle'].map(r => `<option${r === rol ? ' selected' : ''}>${r}</option>`).join('')}
        </select>
      </div>
      <div>
        <label class="field-label">Oficina</label>
        <select class="select-field">
          ${['Caracas Principal', 'Valencia', 'Maracaibo'].map(o => `<option${o === oficina ? ' selected' : ''}>${o}</option>`).join('')}
        </select>
      </div>
      <div>
        <label class="field-label">Teléfono</label>
        <input class="input-field" placeholder="+58 414-000-0000">
      </div>
      <div>
        <label class="field-label">Nueva contraseña <span class="text-slate-400 font-normal normal-case tracking-normal">(dejar vacío para no cambiar)</span></label>
        <input type="password" class="input-field" placeholder="••••••••">
      </div>
    </div>`,
    `<button onclick="closeModal()" class="btn-secondary">Cancelar</button>
     <button onclick="closeModal();showToast('Usuario actualizado correctamente','success')" class="btn-primary"><i data-lucide="check" class="w-4 h-4"></i>Guardar Cambios</button>`
  );
};

window.showNewVehModal = function () {
  const MARCAS = ['Toyota', 'Chevrolet', 'Ford', 'Hyundai', 'Kia', 'Jeep', 'Nissan', 'Honda', 'Renault', 'Mazda', 'Volkswagen', 'Mitsubishi', 'Otro'];
  const TIPOS = ['Sedán', 'SUV / Rústico', 'Camioneta', 'Comercial', 'Motocicleta'];
  const AÑOS = Array.from({ length: 14 }, (_, i) => 2025 - i);
  showModal('Registrar Vehículo', `
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div>
        <label class="field-label">Placa <span class="text-rose-500">*</span></label>
        <input id="veh-placa" class="input-field uppercase" placeholder="ABC-123">
      </div>
      <div>
        <label class="field-label">Marca <span class="text-rose-500">*</span></label>
        <select id="veh-marca" class="select-field">
          <option value="" disabled selected>Seleccionar marca…</option>
          ${MARCAS.map(m => `<option>${m}</option>`).join('')}
        </select>
      </div>
      <div>
        <label class="field-label">Modelo <span class="text-rose-500">*</span></label>
        <input id="veh-modelo" class="input-field" placeholder="Ej. Corolla, Spark…">
      </div>
      <div>
        <label class="field-label">Año <span class="text-rose-500">*</span></label>
        <select id="veh-año" class="select-field">
          <option value="" disabled selected>Seleccionar año…</option>
          ${AÑOS.map(a => `<option>${a}</option>`).join('')}
        </select>
      </div>
      <div>
        <label class="field-label">Color <span class="text-rose-500">*</span></label>
        <input id="veh-color" class="input-field" placeholder="Ej. Blanco, Negro…">
      </div>
      <div>
        <label class="field-label">Tipo <span class="text-rose-500">*</span></label>
        <select id="veh-tipo" class="select-field">
          <option value="" disabled selected>Seleccionar tipo…</option>
          ${TIPOS.map(t => `<option>${t}</option>`).join('')}
        </select>
      </div>
      <div class="sm:col-span-2">
        <label class="field-label">Propietario <span class="text-rose-500">*</span></label>
        <input id="veh-prop" class="input-field" placeholder="Nombre del propietario">
      </div>
      <div>
        <label class="field-label">Estado</label>
        <select id="veh-est" class="select-field">
          <option selected>Activo</option>
          <option>Inactivo</option>
        </select>
      </div>
    </div>`,
    `<button onclick="closeModal()" class="btn-secondary">Cancelar</button>
     <button onclick="closeModal();showToast('Vehículo registrado correctamente','success')" class="btn-primary"><i data-lucide="check" class="w-4 h-4"></i>Registrar</button>`
  );
};

window.showEditVehModal = function (placa, marca, modelo, año, color, tipo, prop, est) {
  const MARCAS = ['Toyota', 'Chevrolet', 'Ford', 'Hyundai', 'Kia', 'Jeep', 'Nissan', 'Honda', 'Renault', 'Mazda', 'Volkswagen', 'Mitsubishi', 'Otro'];
  const TIPOS = ['Sedán', 'SUV / Rústico', 'Camioneta', 'Comercial', 'Motocicleta'];
  const AÑOS = Array.from({ length: 14 }, (_, i) => 2025 - i);
  showModal(`Editar Vehículo — ${placa}`, `
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div>
        <label class="field-label">Placa</label>
        <input class="input-field uppercase bg-slate-100" value="${placa}" readonly>
      </div>
      <div>
        <label class="field-label">Marca</label>
        <select class="select-field">
          ${MARCAS.map(m => `<option${m === marca ? ' selected' : ''}>${m}</option>`).join('')}
        </select>
      </div>
      <div>
        <label class="field-label">Modelo</label>
        <input class="input-field" value="${modelo}">
      </div>
      <div>
        <label class="field-label">Año</label>
        <select class="select-field">
          ${AÑOS.map(a => `<option${String(a) === String(año) ? ' selected' : ''}>${a}</option>`).join('')}
        </select>
      </div>
      <div>
        <label class="field-label">Color</label>
        <input class="input-field" value="${color}">
      </div>
      <div>
        <label class="field-label">Tipo</label>
        <select class="select-field">
          ${TIPOS.map(t => `<option${t === tipo ? ' selected' : ''}>${t}</option>`).join('')}
        </select>
      </div>
      <div class="sm:col-span-2">
        <label class="field-label">Propietario</label>
        <input class="input-field" value="${prop}">
      </div>
      <div>
        <label class="field-label">Estado</label>
        <select class="select-field">
          ${['Activo', 'Inactivo'].map(s => `<option${s === est ? ' selected' : ''}>${s}</option>`).join('')}
        </select>
      </div>
    </div>`,
    `<button onclick="closeModal()" class="btn-secondary">Cancelar</button>
     <button onclick="closeModal();showToast('Vehículo actualizado correctamente','success')" class="btn-primary"><i data-lucide="check" class="w-4 h-4"></i>Guardar Cambios</button>`
  );
};

window.showDeleteVeh = function (placa) {
  showModal(
    'Confirmar eliminación',
    `<div class="flex flex-col items-center text-center gap-4 py-2">
      <div class="w-14 h-14 rounded-full bg-rose-100 flex items-center justify-center">
        <i data-lucide="trash-2" class="w-7 h-7 text-rose-600"></i>
      </div>
      <div>
        <p class="font-semibold text-slate-800 mb-1">¿Eliminar vehículo <em>${placa}</em>?</p>
        <p class="text-sm text-slate-500">Esta acción no se puede deshacer.</p>
      </div>
    </div>`,
    `<button onclick="closeModal()" class="btn-secondary">Cancelar</button>
     <button onclick="confirmDeleteVeh('${placa}')" class="btn-danger"><i data-lucide="trash-2" class="w-4 h-4"></i>Eliminar</button>`
  );
};

window.confirmDeleteVeh = function (placa) {
  closeModal();
  const table = document.getElementById('tbl-vehiculos');
  if (table) {
    table.querySelectorAll('tbody tr').forEach(tr => {
      const cell = tr.querySelectorAll('td')[0];
      if (cell && cell.textContent.trim() === placa) tr.remove();
    });
  }
  showToast('Vehículo eliminado', 'error');
};

window.showChangeRole = function (nom, currentRol) {
  const roles = [
    { key: 'Admin', icon: 'shield-check', desc: 'Acceso total. Gestiona usuarios, configuración y todos los módulos del sistema.' },
    { key: 'Oficina', icon: 'building', desc: 'Acceso a cotizaciones, clientes, pólizas y reportes. Sin gestión de usuarios.' },
    { key: 'Vendedor Sucursal', icon: 'user-check', desc: 'Crea cotizaciones y gestiona clientes asignados a su sucursal.' },
    { key: 'Vendedor Calle', icon: 'truck', desc: 'Cotizaciones básicas y consulta de clientes. Acceso limitado desde campo.' },
  ];
  showModal(`Cambiar Rol — ${nom}`, `
    <p class="text-xs text-slate-500 mb-4">Rol actual: <strong>${currentRol}</strong>. Selecciona el nuevo rol para este usuario.</p>
    <div class="space-y-2.5">
      ${roles.map(r => `
      <label class="flex items-start gap-3 p-4 rounded-2xl border-2 cursor-pointer transition-all ${r.key === currentRol ? 'border-jm-blue bg-blue-50/40' : 'border-slate-200 hover:border-slate-300 bg-white'}">
        <input type="radio" name="rol-select" value="${r.key}" ${r.key === currentRol ? 'checked' : ''} class="mt-0.5 accent-blue-700 shrink-0">
        <div class="min-w-0">
          <div class="flex items-center gap-2 mb-0.5">
            <i data-lucide="${r.icon}" class="w-4 h-4 text-jm-blue shrink-0"></i>
            <p class="font-bold text-slate-800 text-sm">${r.key}</p>
          </div>
          <p class="text-xs text-slate-500 leading-relaxed">${r.desc}</p>
        </div>
      </label>`).join('')}
    </div>`,
    `<button onclick="closeModal()" class="btn-secondary">Cancelar</button>
     <button onclick="closeModal();showToast('Rol actualizado correctamente','success')" class="btn-primary"><i data-lucide="check" class="w-4 h-4"></i>Cambiar Rol</button>`
  );
};

window.showUserPerms = function (nom, rol) {
  const isAdmin = rol === 'Admin';
  const isOfic = isAdmin || rol === 'Oficina';
  const isVend = isOfic || rol.startsWith('Vendedor');
  const isVCalle = rol === 'Vendedor Calle';

  const sections = [
    {
      label: 'Cotizaciones', perms: [
        { label: 'Ver cotizaciones', on: isVend },
        { label: 'Crear nuevas cotizaciones', on: isVend },
        { label: 'Aprobar / rechazar', on: isOfic },
        { label: 'Eliminar cotizaciones', on: isAdmin },
      ]
    },
    {
      label: 'Clientes y Vehículos', perms: [
        { label: 'Ver clientes y vehículos', on: isVend },
        { label: 'Crear y editar clientes', on: isVend && !isVCalle },
        { label: 'Gestionar pólizas', on: isOfic },
        { label: 'Eliminar registros', on: isAdmin },
      ]
    },
    {
      label: 'Reportes', perms: [
        { label: 'Ver reportes', on: isOfic },
        { label: 'Exportar reportes (PDF/XLS)', on: isAdmin },
      ]
    },
    {
      label: 'Parámetros y Configuración', perms: [
        { label: 'Consultar tasas BCV', on: isVend },
        { label: 'Registrar tasas BCV', on: isAdmin },
        { label: 'Gestionar productos', on: isAdmin },
        { label: 'Gestionar usuarios', on: isAdmin },
        { label: 'Configuración del sistema', on: isAdmin },
      ]
    },
  ];

  showModal(`Permisos — ${nom}`, `
    <div class="mb-4 flex items-center gap-3 p-3 rounded-xl bg-blue-50 border border-blue-200">
      <i data-lucide="info" class="w-4 h-4 text-blue-600 shrink-0"></i>
      <p class="text-xs text-blue-700">Permisos base del rol <strong>${rol}</strong>. Puedes ajustarlos individualmente.</p>
    </div>
    <div class="space-y-5 max-h-[55vh] overflow-y-auto pr-1">
      ${sections.map(sec => `
      <div>
        <p class="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">${sec.label}</p>
        <div class="space-y-1.5">
          ${sec.perms.map(p => `
          <label class="flex items-center gap-3 p-2.5 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50 transition-colors">
            <input type="checkbox" ${p.on ? 'checked' : ''} class="w-4 h-4 accent-blue-700 shrink-0">
            <span class="text-sm text-slate-700">${p.label}</span>
            ${p.on ? '' : '<span class="ml-auto text-xs font-bold uppercase text-slate-300 tracking-wide shrink-0">Sin acceso</span>'}
          </label>`).join('')}
        </div>
      </div>`).join('')}
    </div>`,
    `<button onclick="closeModal()" class="btn-secondary">Cancelar</button>
     <button onclick="closeModal();showToast('Permisos guardados correctamente','success')" class="btn-primary"><i data-lucide="check" class="w-4 h-4"></i>Guardar Permisos</button>`
  );
};

window.showBlockUser = function (nom, est) {
  const isBlocked = est === 'Bloqueado';
  showModal(isBlocked ? `Desbloquear usuario` : `Bloquear usuario`, `
    <div class="flex items-start gap-4">
      <div class="w-12 h-12 rounded-full ${isBlocked ? 'bg-emerald-100' : 'bg-orange-100'} flex items-center justify-center shrink-0">
        <i data-lucide="${isBlocked ? 'lock-open' : 'lock'}" class="w-6 h-6 ${isBlocked ? 'text-emerald-600' : 'text-orange-600'}"></i>
      </div>
      <div class="min-w-0">
        <p class="font-bold text-slate-800 mb-1">${isBlocked ? 'Desbloquear' : 'Bloquear'} a <em>${nom}</em></p>
        <p class="text-sm text-slate-500 leading-relaxed">${isBlocked
      ? 'El usuario recuperará el acceso al sistema con su rol y permisos actuales.'
      : 'El usuario no podrá iniciar sesión. Sus datos, cotizaciones y pólizas se conservarán intactos.'}</p>
        ${!isBlocked ? `
        <div class="mt-4">
          <label class="field-label">Motivo del bloqueo <span class="text-rose-500">*</span></label>
          <textarea rows="2" class="input-field resize-none" placeholder="Describe el motivo del bloqueo…"></textarea>
        </div>` : ''}
      </div>
    </div>`,
    `<button onclick="closeModal()" class="btn-secondary">Cancelar</button>
     <button onclick="closeModal();showToast('${isBlocked ? 'Usuario desbloqueado' : 'Usuario bloqueado correctamente'}','${isBlocked ? 'success' : 'error'}')" class="btn-${isBlocked ? 'success' : 'danger'}">
       <i data-lucide="${isBlocked ? 'lock-open' : 'lock'}" class="w-4 h-4"></i>${isBlocked ? 'Desbloquear' : 'Bloquear'}
     </button>`
  );
};

// ── VIEWS MAP ────────────────────────────────────────────────
const VIEWS = {
  'home': viewHome,
  'cat-productos': catProductos,
  'cli-cliente': cliCliente,
  'cli-vehiculo': cliVehiculo,
  'cot-simulador': cotSimulador,
  'rep-menu': repMenu,
  'tas-registro': tasRegistro,
  'usr-lista': usrLista,
  'conf-menu': confMenu,
  // sub-views still accessible via navigateTo
  'cli-tomador': cliTomador,
  'cli-conductor': cliConductor,
  'cat-tipos': catTipos,
  'cat-tasas': catTasas,
  'conf-seguridad': confSeguridad,
  'conf-auditoria': confAuditoria,
  'conf-about': confAbout,
};

// ── SIDEBAR ──────────────────────────────────────────────────
function renderSidebarNav() {
  const nav = document.getElementById('sidebar-nav');
  if (!nav) return;
  nav.innerHTML = NAV.map(g => {
    const isActive = activeNavId === g.id;
    return `
    <div class="mb-0.5">
      <button class="group-btn ${isActive ? 'group-btn-active' : ''}" data-view="${g.viewId}">
        <i data-lucide="${g.icon}" class="w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-white/50'}"></i>
        <span class="flex-1 leading-tight text-left">${g.label}</span>
      </button>
    </div>`;
  }).join('') + `
  <!-- BCV Rates widget at bottom of nav -->
  <div class="mt-8 pt-5 border-t border-white/15">
    <p class="text-xs font-bold text-white/45 uppercase tracking-widest px-3 mb-3">Tasas BCV · Hoy</p>
    <div class="space-y-2 px-1">
      <div class="flex items-center justify-between px-3 py-3 rounded-xl bg-emerald-500/15 border border-emerald-500/15">
        <div class="flex items-center gap-2">
          <span class="text-sm font-black text-emerald-400 w-4">$</span>
          <span class="text-sm font-semibold text-white/85">Dólar</span>
        </div>
        <span class="text-sm font-black text-emerald-300">38.54</span>
      </div>
      <div class="flex items-center justify-between px-3 py-3 rounded-xl bg-amber-500/15 border border-amber-500/15">
        <div class="flex items-center gap-2">
          <span class="text-sm font-black text-amber-400 w-4">€</span>
          <span class="text-sm font-semibold text-white/85">Euro</span>
        </div>
        <span class="text-sm font-black text-amber-300">42.18</span>
      </div>
    </div>
  </div>`;

  createIcons({ icons: ALL_ICONS });

  nav.querySelectorAll('[data-view]').forEach(btn => {
    btn.addEventListener('click', () => {
      navigateTo(btn.dataset.view);
      if (window.innerWidth < 1024) closeSidebar();
    });
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
  User, Home, KeyRound, Monitor, Database, Activity, History, UserX, Power, Plane, Heart, Package, FileSearch, Menu,
  ArrowLeft, ArrowRight, Lock, LockOpen, Trash2
};

function navigateTo(viewId) {
  const meta = VIEW_META[viewId];
  if (meta?.navId) activeNavId = meta.navId;
  activeView = viewId;
  renderSidebarNav();

  if (meta) {
    document.getElementById('page-title').textContent = meta.title;
    document.getElementById('page-subtitle').textContent = meta.sub;
  }

  const area = document.getElementById('content-area');
  if (area) {
    const fn = VIEWS[viewId];
    area.innerHTML = fn ? fn() : `<div class="card p-8 text-center text-slate-400">Vista en construcción: ${viewId}</div>`;
    createIcons({ icons: ALL_ICONS });
    setupTabListeners();
    setupInteractivity();
  }
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

window.navigateTo = navigateTo;

// ── SEARCH + FILTER INTERACTIVITY ────────────────────────────
function setupInteractivity() {
  // Search inputs
  document.querySelectorAll('input[data-search-target]').forEach(input => {
    input.addEventListener('input', () => {
      const term = input.value.toLowerCase().trim();
      const target = document.getElementById(input.dataset.searchTarget);
      if (!target) return;
      target.querySelectorAll('tbody tr').forEach(row => {
        row.classList.toggle('hidden', !!term && !row.textContent.toLowerCase().includes(term));
      });
    });
  });

  // Select filters (data-filter-target="tblId" data-filter-col="N")
  document.querySelectorAll('select[data-filter-target]').forEach(sel => {
    sel.addEventListener('change', () => {
      const val = sel.value.toLowerCase().trim();
      const col = parseInt(sel.dataset.filterCol || '0');
      const target = document.getElementById(sel.dataset.filterTarget);
      if (!target) return;
      target.querySelectorAll('tbody tr').forEach(row => {
        const cell = row.querySelectorAll('td')[col];
        row.classList.toggle('hidden', !!val && !!cell && !cell.textContent.toLowerCase().includes(val));
      });
    });
  });
}

// ── TAB HELPERS ──────────────────────────────────────────────
function setupTabListeners() {
  window.setTab = function (name) {
    ['tipos', 'marcas', 'modelos'].forEach(t => {
      document.getElementById(`tab-${t}-c`)?.classList.toggle('hidden', t !== name);
      const btn = document.getElementById(`tab-btn-${t}`);
      if (btn) btn.className = t === name ? 'btn-primary text-xs px-3 py-2' : 'btn-secondary text-xs px-3 py-2';
    });
  };

  window.simTab = function (name) {
    ['auto', 'hogar', 'vida'].forEach(t => {
      const btn = document.getElementById(`sim-tab-${t}`);
      if (btn) btn.className = t === name ? 'btn-primary text-xs px-4 py-2' : 'btn-secondary text-xs px-4 py-2';
    });
  };

  window.confTab = function (name) {
    ['seguridad', 'auditoria', 'about'].forEach(t => {
      document.getElementById(`conf-content-${t}`)?.classList.toggle('hidden', t !== name);
      const btn = document.getElementById(`conf-tab-${t}`);
      if (btn) btn.className = t === name ? 'btn-primary text-xs px-4 py-2' : 'btn-secondary text-xs px-4 py-2';
    });
    createIcons({ icons: ALL_ICONS });
  };

  window.repTab = function (name) {
    ['ventas', 'superintendencia', 'oficinas', 'personal', 'automaticos'].forEach(t => {
      document.getElementById(`rep-content-${t}`)?.classList.toggle('hidden', t !== name);
      const btn = document.getElementById(`rep-tab-${t}`);
      if (btn) btn.className = t === name ? 'btn-primary text-xs px-4 py-2' : 'btn-secondary text-xs px-4 py-2';
    });
    createIcons({ icons: ALL_ICONS });
  };
}

// ── SIDEBAR TOGGLE ───────────────────────────────────────────
function closeSidebar() {
  document.querySelector('.sidebar-container')?.classList.remove('sidebar-open');
  document.getElementById('sidebar-overlay')?.classList.remove('visible');
}

function setupSidebarToggle() {
  document.getElementById('sidebar-toggle')?.addEventListener('click', () => {
    document.querySelector('.sidebar-container')?.classList.add('sidebar-open');
    document.getElementById('sidebar-overlay')?.classList.add('visible');
  });
  document.getElementById('sidebar-overlay')?.addEventListener('click', closeSidebar);
}

// ── USER MENU ────────────────────────────────────────────────
function setupUserMenu() {
  const btn = document.getElementById('user-menu-btn');
  const dropdown = document.getElementById('user-dropdown');
  const chevron = document.getElementById('user-chevron');

  btn?.addEventListener('click', e => {
    e.stopPropagation();
    const isOpen = !dropdown.classList.contains('hidden');
    dropdown.classList.toggle('hidden', isOpen);
    chevron?.classList.toggle('rotate-180', !isOpen);
  });

  document.addEventListener('click', () => {
    dropdown?.classList.add('hidden');
    chevron?.classList.remove('rotate-180');
  });

  document.getElementById('menu-logout')?.addEventListener('click', () => {
    showToast('Sesión cerrada correctamente', 'info');
    setTimeout(() => { window.location.href = '/login.html'; }, 1000);
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

// ── PDF VIEWER ───────────────────────────────────────────────
window.showPdfViewer = function (title, pagesHtml) {
  document.getElementById('pdf-title').textContent = title;
  document.getElementById('pdf-pages').innerHTML = pagesHtml;
  document.getElementById('pdf-overlay').classList.remove('hidden');
  createIcons({ icons: ALL_ICONS });
};

window.closePdfViewer = function () {
  document.getElementById('pdf-overlay').classList.add('hidden');
};

window.printPdfDoc = function () {
  const title = document.getElementById('pdf-title').textContent;
  const pages = document.getElementById('pdf-pages').innerHTML;
  const w = window.open('', '_blank');
  w.document.write(`<!DOCTYPE html><html><head>
    <meta charset="UTF-8"><title>${title}</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
    <style>
      *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
      body{font-family:'Inter',system-ui,sans-serif;background:#525659;padding:32px;display:flex;flex-direction:column;align-items:center;gap:32px}
      .pdf-page{background:white;width:210mm;min-height:297mm;padding:18mm 20mm;box-shadow:0 4px 24px rgba(0,0,0,.3)}
      @media print{body{background:white;padding:0}@page{size:A4;margin:0}.pdf-page{box-shadow:none;page-break-after:always}}
    </style>
  </head><body>${pages}<script>window.onload=function(){setTimeout(function(){window.print();},600)}<\/script></body></html>`);
  w.document.close();
};

// PDF helpers (inline styles for print-window portability)
function pdfPage(content) {
  return `<div class="pdf-page bg-white w-full max-w-[794px] shadow-2xl" style="min-height:1123px;padding:56px 64px;font-family:Inter,system-ui,sans-serif;color:#1e293b">${content}</div>`;
}
function pdfHdr(docTitle, docSub, ref, date) {
  return `<div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:32px;padding-bottom:20px;border-bottom:2px solid #001463">
    <div>
      <p style="font-size:22px;font-weight:900;color:#001463;letter-spacing:-0.5px">J&M</p>
      <p style="font-size:9px;color:#94a3b8;text-transform:uppercase;letter-spacing:2px;margin-top:2px">LA VENEZOLANA DE SEGUROS Y VIDA C.A.</p>
      <p style="font-size:9px;color:#94a3b8;margin-top:2px">RIF J-12.345.678-9 · Av. Principal, Caracas 1010</p>
    </div>
    <div style="text-align:right">
      <p style="font-size:16px;font-weight:900;color:#1e293b;text-transform:uppercase;letter-spacing:1px">${docTitle}</p>
      ${docSub ? `<p style="font-size:10px;color:#64748b;margin-top:3px">${docSub}</p>` : ''}
      ${ref ? `<p style="font-size:11px;font-family:monospace;color:#001463;font-weight:700;margin-top:6px">${ref}</p>` : ''}
      ${date ? `<p style="font-size:10px;color:#64748b;margin-top:2px">${date}</p>` : ''}
    </div>
  </div>`;
}
function pdfSec(title) {
  return `<p style="font-size:9px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:2px;margin:22px 0 10px;padding-bottom:5px;border-bottom:1px solid #e2e8f0">${title}</p>`;
}
function pdfRow(label, value, mono = false) {
  return `<div style="display:flex;justify-content:space-between;align-items:baseline;padding:4px 0;border-bottom:1px solid #f1f5f9">
    <span style="font-size:11px;color:#64748b">${label}</span>
    <span style="font-size:12px;font-weight:600;color:#1e293b${mono ? ';font-family:monospace' : ''}">${value}</span>
  </div>`;
}
function pdfTotal(label, amount, sub) {
  return `<div style="display:flex;justify-content:space-between;align-items:center;background:#001463;color:white;padding:12px 16px;border-radius:8px;margin-top:14px">
    <span style="font-size:13px;font-weight:700">${label}</span>
    <span style="font-size:22px;font-weight:900">${amount}</span>
  </div>${sub ? `<p style="font-size:9px;color:#64748b;text-align:right;margin-top:5px">${sub}</p>` : ''}`;
}
function pdfFooter(agente, oficina) {
  return `<div style="margin-top:48px;padding-top:18px;border-top:1px solid #e2e8f0">
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:48px">
      <div style="text-align:center">
        <div style="border-top:1px solid #1e293b;padding-top:8px;margin-top:44px">
          <p style="font-size:10px;font-weight:700;color:#1e293b">${agente}</p>
          <p style="font-size:9px;color:#64748b">Agente de Seguros · Sello y Firma</p>
        </div>
      </div>
      <div style="text-align:center">
        <div style="border-top:1px solid #1e293b;padding-top:8px;margin-top:44px">
          <p style="font-size:10px;font-weight:700;color:#1e293b">Supervisor · ${oficina}</p>
          <p style="font-size:9px;color:#64748b">Autorizado · Sello y Firma</p>
        </div>
      </div>
    </div>
    <p style="font-size:8px;color:#94a3b8;text-align:center;margin-top:18px;line-height:1.6">Documento generado por el sistema interno J&M. Válido únicamente con sello y firma del supervisor autorizado. Autorizado por SUDEASEG.</p>
  </div>`;
}

// PDF document generators
window.showPdfCotizacion = function () {
  const hoy = new Date();
  const fecha = `${String(hoy.getDate()).padStart(2, '0')}/${String(hoy.getMonth() + 1).padStart(2, '0')}/${hoy.getFullYear()}`;
  const ref = 'COT-2026-0' + (313 + Math.floor(Math.random() * 50));
  const chkd = Object.entries(simState.coberturas).filter(([, c]) => c.chk);
  const sub = chkd.reduce((s, [, c]) => s + c.prima, 0);
  const iva = sub * 0.16, pol = 5, tot = sub + iva + pol;
  const tipoLabel = { particular: 'Particular', comercial: 'Comercial', flota: 'Flota' }[simState.tipo] || '—';
  showPdfViewer(`Cotización ${ref}`, pdfPage(`
    ${pdfHdr('Cotización de Prima', 'Seguro de Vehículo Automotor', ref, `Fecha: ${fecha} · Vigencia de cotización: 30 días`)}
    ${pdfSec('Datos del vehículo')}
    ${pdfRow('Marca / Modelo', simState.marca + ' ' + simState.modelo)}
    ${pdfRow('Año', simState.año)}
    ${pdfRow('Placa', simState.placa || 'Por asignar', true)}
    ${pdfRow('Color', simState.color || '—')}
    ${pdfRow('Tipo de póliza', tipoLabel)}
    ${pdfRow('Uso del vehículo', simState.uso)}
    ${pdfRow('Valor de mercado declarado', usd(simState.valor))}
    ${pdfSec('Datos del tomador')}
    ${pdfRow('Nombre completo', simState.nombre || 'Sin especificar')}
    ${pdfRow('Cédula / RIF', simState.ci || '—', true)}
    ${pdfRow('Teléfono', simState.tel || '—')}
    ${pdfRow('Correo electrónico', simState.email || '—')}
    ${pdfSec('Coberturas seleccionadas')}
    ${chkd.map(([, c]) => pdfRow(c.nom + (c.req ? ' ★' : ''), usd(c.prima))).join('')}
    <p style="font-size:9px;color:#94a3b8;margin-top:4px">★ Cobertura obligatoria según Ley SUDEASEG</p>
    ${pdfSec('Resumen de prima')}
    ${pdfRow('Prima neta', usd(sub))}
    ${pdfRow('IVA (16%)', usd(iva))}
    ${pdfRow('Derecho de póliza', usd(pol))}
    ${pdfTotal('TOTAL ANUAL (USD)', usd(tot), `${bs(tot)} · Tasa BCV referencial 38.54 Bs/USD`)}
    ${pdfFooter('Agente · Oficina Caracas Principal', 'Caracas Principal')}
  `));
};

window.showPdfRecibo = function () {
  const hoy = new Date();
  const fecha = `${String(hoy.getDate()).padStart(2, '0')}/${String(hoy.getMonth() + 1).padStart(2, '0')}/${hoy.getFullYear()}`;
  showPdfViewer('Recibo REC-2026-00142', pdfPage(`
    ${pdfHdr('Recibo de Prima', 'Seguro de Vehículo Automotor · Pago Anual', 'REC-2026-00142', `Fecha de emisión: ${fecha}`)}
    ${pdfSec('Datos de la póliza')}
    ${pdfRow('N° de Póliza', 'POL-VEH-2026-0042', true)}
    ${pdfRow('Vigencia', '10/05/2026 — 10/05/2027')}
    ${pdfRow('Tomador', 'Carlos E. Rodríguez')}
    ${pdfRow('Cédula de identidad', 'V-12.345.678', true)}
    ${pdfSec('Vehículo asegurado')}
    ${pdfRow('Vehículo', 'Toyota Corolla XLi 2022')}
    ${pdfRow('Placa', 'ABC-123', true)}
    ${pdfRow('Uso', 'Particular')}
    ${pdfRow('Valor asegurado', usd(15000))}
    ${pdfSec('Detalle de coberturas cobradas')}
    ${pdfRow('Casco Pérdida Total (1.80% s/valor)', usd(270.00))}
    ${pdfRow('Casco Pérdida Parcial (0.80% s/valor)', usd(120.00))}
    ${pdfRow('Robo y Hurto (0.60% s/valor)', usd(90.00))}
    ${pdfRow('Accidentes Personales (4 ocupantes)', usd(48.00))}
    ${pdfRow('RC Obligatoria SUDEASEG', usd(4.50))}
    ${pdfSec('Resumen del cobro')}
    ${pdfRow('Prima neta', usd(532.50))}
    ${pdfRow('IVA (16%)', usd(85.20))}
    ${pdfRow('Derecho de póliza', usd(5.00))}
    ${pdfTotal('TOTAL COBRADO (USD)', usd(622.70), `${bs(622.70)} · Tasa BCV 38.54 Bs/USD`)}
    ${pdfFooter('Agente · Oficina Caracas Principal', 'Caracas Principal')}
  `));
};

window.showPdfCertificado = function () {
  showPdfViewer('Certificado POL-VEH-2026-0042', pdfPage(`
    ${pdfHdr('Certificado de Seguro', 'Seguro de Vehículo Automotor', 'POL-VEH-2026-0042', 'Vigente: 10/05/2026 — 10/05/2027')}
    ${pdfSec('Datos generales de la póliza')}
    ${pdfRow('N° de Póliza', 'POL-VEH-2026-0042', true)}
    ${pdfRow('Aseguradora', 'J&M · LA VENEZOLANA DE SEGUROS Y VIDA C.A.')}
    ${pdfRow('Tipo de seguro', 'Vehículo Automotor — Particular')}
    ${pdfRow('Inicio de vigencia', '10/05/2026 a las 12:00 m')}
    ${pdfRow('Vencimiento', '10/05/2027 a las 12:00 m')}
    ${pdfSec('Tomador / Asegurado')}
    ${pdfRow('Nombre completo', 'Carlos E. Rodríguez')}
    ${pdfRow('Cédula de identidad', 'V-12.345.678', true)}
    ${pdfRow('Teléfono de contacto', '+58 414-123-4567')}
    ${pdfSec('Vehículo asegurado')}
    ${pdfRow('Marca / Modelo', 'Toyota Corolla XLi')}
    ${pdfRow('Año', '2022')}
    ${pdfRow('Placa', 'ABC-123', true)}
    ${pdfRow('Color', 'Blanco perla')}
    ${pdfRow('Uso del vehículo', 'Particular')}
    ${pdfRow('Valor asegurado', usd(15000))}
    ${pdfSec('Coberturas contratadas')}
    ${pdfRow('Casco Pérdida Total', usd(15000) + ' suma asegurada')}
    ${pdfRow('Casco Pérdida Parcial', usd(15000) + ' suma asegurada')}
    ${pdfRow('Robo y Hurto', usd(15000) + ' suma asegurada')}
    ${pdfRow('Accidentes Personales', usd(40000) + ' — 4 ocupantes')}
    ${pdfRow('RC Obligatoria SUDEASEG', 'Según Ley y Resolución SUDEASEG')}
    <p style="font-size:9px;color:#475569;margin-top:18px;padding:12px 14px;background:#f8fafc;border-radius:6px;border-left:3px solid #001463;line-height:1.7">
      Este certificado acredita la existencia de una póliza de seguros emitida por J&M, LA VENEZOLANA DE SEGUROS Y VIDA C.A., bajo las condiciones generales y particulares del contrato de seguro correspondiente. Autorizado por SUDEASEG según Resolución N° 001-2025.
    </p>
    ${pdfFooter('Agente · Oficina Caracas Principal', 'Caracas Principal')}
  `));
};

window.showPdfClientes = function () {
  const hoy = new Date();
  const fecha = `${String(hoy.getDate()).padStart(2, '0')}/${String(hoy.getMonth() + 1).padStart(2, '0')}/${hoy.getFullYear()}`;
  const clientes = [
    { nom: 'Carlos E. Rodríguez', ci: 'V-12.345.678', tel: '+58 414-123-4567', pol: 2, est: 'Activo' },
    { nom: 'María A. González', ci: 'V-11.234.567', tel: '+58 424-234-5678', pol: 1, est: 'Activo' },
    { nom: 'José L. Martínez', ci: 'V-10.345.678', tel: '+58 416-345-6789', pol: 1, est: 'Activo' },
    { nom: 'Ana C. López Ramírez', ci: 'V-13.456.789', tel: '+58 412-456-7890', pol: 3, est: 'Activo' },
    { nom: 'Luis M. Romero', ci: 'V-14.567.890', tel: '+58 418-567-8901', pol: 1, est: 'Pendiente' },
    { nom: 'Sofía P. Herrera', ci: 'V-15.678.901', tel: '+58 424-678-9012', pol: 1, est: 'Activo' },
  ];
  const rows = clientes.map((c, i) => `<tr style="background:${i % 2 === 0 ? '#ffffff' : '#f8fafc'}">
    <td style="padding:7px 10px;font-size:11px;font-weight:600;color:#1e293b">${c.nom}</td>
    <td style="padding:7px 10px;font-size:11px;font-family:monospace;color:#475569">${c.ci}</td>
    <td style="padding:7px 10px;font-size:11px;color:#475569">${c.tel}</td>
    <td style="padding:7px 10px;font-size:11px;text-align:center;font-weight:700;color:#001463">${c.pol}</td>
    <td style="padding:7px 10px;font-size:11px;font-weight:600;color:${c.est === 'Activo' ? '#059669' : '#d97706'}">${c.est}</td>
  </tr>`).join('');
  const table = `<table style="width:100%;border-collapse:collapse;margin-top:8px">
    <thead><tr style="background:#001463;color:white">
      ${['Nombre completo', 'CI / RIF', 'Teléfono', 'Pólizas', 'Estado'].map(h => `<th style="padding:8px 10px;font-size:9px;font-weight:700;text-align:left;text-transform:uppercase;letter-spacing:1px">${h}</th>`).join('')}
    </tr></thead><tbody>${rows}</tbody>
  </table>`;
  showPdfViewer('Listado de Clientes', pdfPage(`
    ${pdfHdr('Listado de Clientes', `Total: ${clientes.length} registros · Oficina Caracas Principal`, null, `Generado: ${fecha}`)}
    ${pdfSec('Clientes registrados')}
    ${table}
    <p style="font-size:9px;color:#94a3b8;text-align:right;margin-top:12px">Reporte generado por sistema interno J&M · ${fecha}</p>
  `));
};

window.showPdfSimulacion = function (ref) {
  const hoy = new Date();
  const fecha = `${String(hoy.getDate()).padStart(2, '0')}/${String(hoy.getMonth() + 1).padStart(2, '0')}/${hoy.getFullYear()}`;
  showPdfViewer(`Cotización ${ref}`, pdfPage(`
    ${pdfHdr('Cotización de Prima', 'Seguro de Vehículo Automotor', ref, `Fecha: ${fecha} · Vigencia de cotización: 30 días`)}
    ${pdfSec('Datos del vehículo')}
    ${pdfRow('Marca / Modelo', 'Toyota Corolla XLi')}
    ${pdfRow('Año', '2022')}
    ${pdfRow('Placa', 'ABC-123', true)}
    ${pdfRow('Uso', 'Particular')}
    ${pdfRow('Valor de mercado', usd(15000))}
    ${pdfSec('Datos del tomador')}
    ${pdfRow('Nombre completo', 'Carlos E. Rodríguez')}
    ${pdfRow('Cédula de identidad', 'V-12.345.678', true)}
    ${pdfRow('Teléfono', '+58 414-123-4567')}
    ${pdfSec('Coberturas')}
    ${pdfRow('RC Obligatoria SUDEASEG ★', usd(4.50))}
    ${pdfRow('Casco Pérdida Total (1.80%)', usd(270.00))}
    ${pdfRow('Casco Pérdida Parcial (0.80%)', usd(120.00))}
    ${pdfRow('Robo y Hurto (0.60%)', usd(90.00))}
    ${pdfRow('Accidentes Personales (4 occ.)', usd(48.00))}
    ${pdfSec('Resumen de prima')}
    ${pdfRow('Prima neta', usd(532.50))}
    ${pdfRow('IVA (16%)', usd(85.20))}
    ${pdfRow('Derecho de póliza', usd(5.00))}
    ${pdfTotal('TOTAL ANUAL (USD)', usd(622.70), `${bs(622.70)} · Tasa BCV 38.54 Bs/USD`)}
    ${pdfFooter('Agente · Oficina Caracas Principal', 'Caracas Principal')}
  `));
};

// ── INIT ─────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  createIcons({ icons: ALL_ICONS });
  renderSidebarNav();
  setupUserMenu();
  setupSidebarToggle();
  setupTabListeners();
  navigateTo('home');

  document.getElementById('modal-overlay')?.addEventListener('click', e => {
    if (e.target.id === 'modal-overlay') closeModal();
  });
});
