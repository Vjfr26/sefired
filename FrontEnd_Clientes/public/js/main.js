/* ============================================================
   J&M — Portal Clientes
   Cotizador 5 pasos · i18n · Chatbot
   ============================================================ */

/* ─────────────────────────────────────────────
   TRADUCCIONES
   ───────────────────────────────────────────── */
const T = {
  es: {
    /* Tabs */
    'tab.s1': 'Seguro',   'tab.s2': 'Datos',    'tab.s3': 'Bien',
    'tab.s4': 'Docs',     'tab.s5': 'Enviar',
    /* Paso 1 */
    's1.question': '¿Qué deseas asegurar?',
    's1.plan':     'Selecciona el plan',
    /* Paso 2 */
    's2.title': 'Datos personales',
    's2.sub':   'Completa tu información para cotizar',
    /* Paso 3 */
    's3.veh.h':   'Datos del vehículo',
    's3.veh.sub': 'Información del vehículo a asegurar',
    's3.bien.h':  'Datos del bien',
    's3.bien.sub':'Información del bien a asegurar',
    /* Paso 4 */
    's4.title': 'Documentos requeridos',
    's4.sub':   'Adjunta los documentos del seguro',
    's4.hint':  'Los opcionales puedes enviarlos también por WhatsApp al asesor.',
    /* Paso 5 */
    's5.sending':   'Enviando solicitud...',
    's5.ok.title':  '¡Solicitud enviada!',
    's5.ok.sub':    'Un asesor revisará tu información y te contactará para confirmar tu póliza.',
    's5.match.msg': 'Para gestionar tu póliza o contratar un nuevo seguro, contacta a un asesor.',
    's5.docs':      'Documentos',
    /* Campos */
    'f.nombre_completo': 'Nombre completo',
    'f.cedula':          'Cédula',
    'f.sexo':            'Sexo',
    'f.sexo.m':          'Masculino',
    'f.sexo.f':          'Femenino',
    'f.condicion':       'Estado civil',
    'f.nacimiento':      'Nacimiento',
    'f.nacionalidad':    'Nacionalidad',
    'f.nac.ve':          'Venezolano/a',
    'f.nac.ext':         'Extranjero/a',
    'f.telefono':        'Teléfono',
    'f.email':           'Correo',
    'f.email_confirm':   'Confirmar correo',
    'f.email_mismatch':  'Los correos no coinciden',
    'f.estado':          'Estado',
    'f.ciudad':          'Ciudad',
    'f.direccion':       'Dirección',
    'f.terms':           'Acepto que J&M procese mis datos para recibir información sobre seguros, de acuerdo con la',
    'f.privacy':         'Política de Privacidad',
    /* Bien */
    'bien.tipo':        'Tipo de bien',
    'bien.valor':       'Valor (USD)',
    'bien.descripcion': 'Descripción',
    'bien.direccion':   'Dirección del bien',
    /* Vehículo */
    'veh.placa':  'Placa', 'veh.anio': 'Año', 'veh.marca': 'Marca',
    'veh.modelo': 'Modelo','veh.color': 'Color', 'veh.uso': 'Uso',
    'veh.valor':  'Valor de mercado (USD)',
    /* Botones */
    'btn.next':    'Continuar',
    'btn.back':    'Atrás',
    'btn.send':    'Enviar solicitud',
    'btn.restart': 'Nueva cotización',
    'btn.whatsapp':'Hablar con asesor',
    /* Resultado */
    'res.tipo':       'Tipo de seguro',
    'res.total_label':'Total Anual',
    'res.prima_neta': 'Prima Neta',
    'res.iva':        'IVA 16%',
    'res.derecho':    'Derecho',
    'res.monthly':    'Mensual estimado',
    'res.tasa_bcv_pre': 'Tasa de cambio oficial del Banco Central de Venezuela (BCV):',
    'res.titular':    'Titular',
    'res.disclaimer': 'Cotización referencial. Puede variar. Un asesor te contactará a la brevedad.',
    /* Chat / footer */
    'loading':       'Calculando...',
    'chat.title':    'Asistente J&M',
    'chat.online':   'En línea',
    'chat.ph':       'Escribe tu mensaje...',
    'chat.fab':      'Abrir chat',
    'chat.greeting1':'¡Hola! 👋 Soy el asistente virtual de J&M.',
    'chat.greeting2':'¿En qué puedo ayudarte hoy?',
    'chat.chip1':    'Cotizar seguro',
    'chat.chip2':    '¿Qué seguros ofrecen?',
    'chat.chip3':    'Hablar con asesor',
    'footer.rights': 'Todos los derechos reservados.',
    'footer.by1':    'Desarrollado con',
    'footer.by2':    'por',
    'soc.facebook':  'Facebook', 'soc.instagram': 'Instagram',
    'soc.twitter':   'Twitter / X', 'soc.linkedin': 'LinkedIn',
    'products.error':'No se pudieron cargar los productos. Recarga la página o contáctanos.',
  },
  en: {
    'tab.s1': 'Insurance', 'tab.s2': 'Data',  'tab.s3': 'Asset',
    'tab.s4': 'Docs',      'tab.s5': 'Submit',
    's1.question': 'What would you like to insure?',
    's1.plan':     'Select a plan',
    's2.title': 'Personal Details',
    's2.sub':   'Fill in your information to get a quote',
    's3.veh.h':   'Vehicle Information',
    's3.veh.sub': 'Details of the vehicle to insure',
    's3.bien.h':  'Asset Information',
    's3.bien.sub':'Details of the asset to insure',
    's4.title': 'Required Documents',
    's4.sub':   'Attach the required insurance documents',
    's4.hint':  'Optional documents can also be sent via WhatsApp to your advisor.',
    's5.sending':   'Submitting request...',
    's5.ok.title':  'Request Submitted!',
    's5.ok.sub':    'An advisor will review your information and contact you to confirm your policy.',
    's5.match.msg': 'To manage your policy or take out a new one, contact an advisor.',
    's5.docs':      'Documents',
    'f.nombre_completo': 'Full Name',
    'f.cedula':    'ID Number', 'f.sexo': 'Gender',
    'f.sexo.m':    'Male', 'f.sexo.f': 'Female',
    'f.condicion': 'Civil Status', 'f.nacimiento': 'Date of Birth',
    'f.nacionalidad': 'Nationality', 'f.nac.ve': 'Venezuelan', 'f.nac.ext': 'Foreign',
    'f.telefono':  'Phone', 'f.email': 'Email',
    'f.email_confirm': 'Confirm email', 'f.email_mismatch': 'Emails do not match',
    'f.estado':    'State', 'f.ciudad': 'City', 'f.direccion': 'Address',
    'f.terms':     'I accept that J&M processes my data to receive information about insurance, in accordance with the',
    'f.privacy':   'Privacy Policy',
    'bien.tipo': 'Asset Type', 'bien.valor': 'Value (USD)',
    'bien.descripcion': 'Description', 'bien.direccion': 'Asset Address',
    'veh.placa': 'Plate', 'veh.anio': 'Year', 'veh.marca': 'Brand',
    'veh.modelo': 'Model', 'veh.color': 'Color', 'veh.uso': 'Usage',
    'veh.valor': 'Market Value (USD)',
    'btn.next': 'Continue', 'btn.back': 'Back',
    'btn.send': 'Submit Request', 'btn.restart': 'New Quote',
    'btn.whatsapp': 'Talk to Advisor',
    'res.tipo': 'Insurance type', 'res.total_label': 'Total Annual',
    'res.prima_neta': 'Net Premium', 'res.iva': 'VAT 16%',
    'res.derecho': 'Policy Fee', 'res.monthly': 'Monthly estimate',
    'res.tasa_bcv_pre': 'Official exchange rate from the Central Bank of Venezuela (BCV):',
    'res.titular': 'Policyholder',
    'res.disclaimer': 'Referential quote. May vary. An advisor will contact you shortly.',
    'loading': 'Processing...',
    'chat.title': 'J&M Assistant', 'chat.online': 'Online',
    'chat.ph': 'Type your message...', 'chat.fab': 'Open chat',
    'chat.greeting1': "Hello! 👋 I'm J&M's virtual assistant.",
    'chat.greeting2': 'How can I help you today?',
    'chat.chip1': 'Get a quote', 'chat.chip2': 'What insurance do you offer?',
    'chat.chip3': 'Talk to an advisor',
    'footer.rights': 'All rights reserved.', 'footer.by1': 'Made with', 'footer.by2': 'by',
    'soc.facebook': 'Facebook', 'soc.instagram': 'Instagram',
    'soc.twitter': 'Twitter / X', 'soc.linkedin': 'LinkedIn',
    'products.error': 'Could not load products. Reload the page or contact us.',
  }
};

/* ─────────────────────────────────────────────
   i18n ENGINE
   ───────────────────────────────────────────── */
let currentLang = localStorage.getItem('jm-lang') || 'es';

function t(key) { return T[currentLang]?.[key] ?? T.es[key] ?? key; }

function setLanguage(lang) {
  if (!T[lang]) return;
  currentLang = lang;
  localStorage.setItem('jm-lang', lang);
  document.documentElement.lang = lang;
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const v = t(el.dataset.i18n);
    if (v !== undefined) el.textContent = v;
  });
  document.querySelectorAll('[data-i18n-ph]').forEach(el => {
    const v = t(el.dataset.i18nPh);
    if (v !== undefined) el.placeholder = v;
  });
  document.querySelectorAll('[data-i18n-title]').forEach(el => {
    const v = t(el.dataset.i18nTitle);
    if (v !== undefined) el.title = v;
  });
  document.querySelectorAll('.lang-btn').forEach(btn =>
    btn.classList.toggle('active', btn.dataset.lang === lang)
  );
  document.querySelectorAll('.chat-chip[data-msg-key]').forEach(chip =>
    { chip.textContent = t(`chat.${chip.dataset.msgKey}`); }
  );
}

/* ─────────────────────────────────────────────
   INIT BÁSICO
   ───────────────────────────────────────────── */
document.getElementById('year').textContent = new Date().getFullYear();

const _nacEl = document.getElementById('f-nacimiento');
if (_nacEl) _nacEl.max = new Date().toISOString().split('T')[0];

/* Años vehículo */
(function populateYears() {
  const now = new Date().getFullYear();
  const sel = document.getElementById('veh-anio');
  if (!sel) return;
  for (let y = now + 1; y >= 1990; y--) {
    const opt = document.createElement('option');
    opt.value = y; opt.textContent = y;
    if (y === now) opt.selected = true;
    sel.appendChild(opt);
  }
})();

/* Placa: mayúsculas + solo alfanumérico */
document.getElementById('veh-placa')?.addEventListener('input', function () {
  const pos = this.selectionStart;
  this.value = this.value.toUpperCase().replace(/[^A-Z0-9-]/g, '');
  this.setSelectionRange(pos, pos);
});

/* Cédula: solo dígitos.
   Nota: no se filtra en 'keydown' — en muchos navegadores móviles ese evento
   llega con e.key === "Unidentified" para el teclado virtual, lo que bloqueaba
   preventDefault() en TODA tecla (incluidos los números). La limpieza se hace
   solo en 'input' y 'paste', igual que el resto de los campos del formulario. */
(function () {
  const el = document.getElementById('f-cedula');
  if (!el) return;
  el.addEventListener('paste', e => {
    e.preventDefault();
    const raw = (e.clipboardData || window.clipboardData).getData('text').replace(/\D/g, '');
    const start = el.selectionStart, end = el.selectionEnd;
    el.value = (el.value.slice(0, start) + raw + el.value.slice(end)).slice(0, 8);
    el.setSelectionRange(Math.min(start + raw.length, 8), Math.min(start + raw.length, 8));
    el.dispatchEvent(new Event('input'));
  });
  el.addEventListener('input', function () {
    const pos = this.selectionStart;
    const clean = this.value.replace(/\D/g, '');
    if (this.value !== clean) {
      this.value = clean;
      this.setSelectionRange(Math.min(pos, clean.length), Math.min(pos, clean.length));
    }
  });
})();

setLanguage(currentLang);
document.querySelectorAll('.lang-btn').forEach(btn =>
  btn.addEventListener('click', () => setLanguage(btn.dataset.lang))
);

/* ─────────────────────────────────────────────
   API BASE URL
   ───────────────────────────────────────────── */
const API_BASE = (window.API_BASE_URL || '').replace(/\/$/, '');

/* ─────────────────────────────────────────────
   ESTADO DEL COTIZADOR
   ───────────────────────────────────────────── */
const sim = {
  /* Producto principal */
  productoParentId:     null,
  productoParentNombre: '',
  productoTieneSubtipos: false,

  /* Sub-tipo seleccionado */
  subtipoId:     null,
  subtipoNombre: '',

  /* Producto efectivo (parent o sub-tipo) */
  productoEfectivoId: null,
  productoCat:        '',   /* vehicular | bienes | personas */
  tipoBien:           'ninguno', /* vehiculo | inmueble | vida | bien | ninguno */
  requiereVehiculo:   false,
  primaBase:          0,
  derechoPoliza:      0,
  tipoCalculo:        'fijo',
  documentosRequeridos: [],  /* [{nombre, obligatorio}] */

  /* Paso 4 — archivos en memoria */
  documentosFiles: [],  /* [{nombre, obligatorio, file: File|null}] */
  skipDocs:        false, /* permite continuar sin subir obligatorios */

  /* Turnstile */
  turnstileToken: '',

  /* Tasa BCV (USD/EUR → Bs.) — se carga al iniciar, ver loadTasas() */
  tasaUsd:   0,
  tasaEur:   0,
  tasaFecha: '',

  /* Navegación */
  _pasos:     [1, 2, 5],  /* calculado dinámicamente */
  _pasoActual: 1,
};

let turnstileWidgetId = null;

/* ─────────────────────────────────────────────
   ICONO por categoría / tipo
   ───────────────────────────────────────────── */
const CAT_META = {
  vehicular:  { icon: 'fa-car',           bg: 'bg-blue-50',   text: 'text-blue-600'   },
  bienes:     { icon: 'fa-house',         bg: 'bg-amber-50',  text: 'text-amber-600'  },
  personas:   { icon: 'fa-user-shield',   bg: 'bg-green-50',  text: 'text-green-600'  },
  rcv:        { icon: 'fa-car',           bg: 'bg-blue-50',   text: 'text-blue-600'   },
  apov:       { icon: 'fa-car-burst',     bg: 'bg-violet-50', text: 'text-violet-600' },
  ec:         { icon: 'fa-microchip',     bg: 'bg-amber-50',  text: 'text-amber-600'  },
  ep:         { icon: 'fa-industry',      bg: 'bg-orange-50', text: 'text-orange-600' },
  vida:       { icon: 'fa-heart-pulse',   bg: 'bg-rose-50',   text: 'text-rose-600'   },
  salud:      { icon: 'fa-stethoscope',   bg: 'bg-teal-50',   text: 'text-teal-600'   },
  hogar:      { icon: 'fa-house',         bg: 'bg-amber-50',  text: 'text-amber-600'  },
  accidentes: { icon: 'fa-user-injured',  bg: 'bg-orange-50', text: 'text-orange-600' },
  funeraria:  { icon: 'fa-cross',         bg: 'bg-gray-50',   text: 'text-gray-600'   },
  alpd:       { icon: 'fa-umbrella',      bg: 'bg-sky-50',    text: 'text-sky-600'    },
  _default:   { icon: 'fa-shield-halved', bg: 'bg-purple-50', text: 'text-purple-600' },
};

function getMeta(p) {
  return CAT_META[(p.categoria || '').toLowerCase()]
      || CAT_META[(p.tipo     || '').toLowerCase()]
      || CAT_META._default;
}

const esc = s => String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');

/* ─────────────────────────────────────────────
   SANITIZACIÓN ANTI-INJECTION
   ───────────────────────────────────────────── */
function sanitizeInput(el) {
  const before = el.value;
  /* Elimina comillas, punto-y-coma, backtick, <, >, backslash y secuencias -- */
  const after = before.replace(/['";`<>\\]|--/g, '');
  if (after === before) return;
  const pos = Math.max(0, (el.selectionStart || 0) - (before.length - after.length));
  el.value = after;
  try { el.setSelectionRange(pos, pos); } catch {}
}

function sanitizeTel(el) {
  const before = el.value;
  const after  = before.replace(/[^0-9+\-()\s]/g, '');
  if (after === before) return;
  const pos = Math.max(0, (el.selectionStart || 0) - (before.length - after.length));
  el.value = after;
  try { el.setSelectionRange(pos, pos); } catch {}
}

/* ─────────────────────────────────────────────
   TURNSTILE
   ───────────────────────────────────────────── */
function initTurnstileWidget() {
  if (typeof turnstile === 'undefined') { setTimeout(initTurnstileWidget, 50); return; }
  if (turnstileWidgetId !== null) return;
  turnstileWidgetId = turnstile.render('#turnstile-portal', {
    sitekey: window.TURNSTILE_SITE_KEY || '0x4AAAAAADPWm4GmxJIO3s97',
    size: 'normal',
    callback:          token => { sim.turnstileToken = token; if (sim._pasoActual===1) checkStep1(); },
    'expired-callback':()    => { sim.turnstileToken = '';    if (sim._pasoActual===1) checkStep1(); },
  });
}
initTurnstileWidget();

/* ─────────────────────────────────────────────
   TASA BCV — para mostrar el precio en Bs./USD/EUR (paso 5)
   ───────────────────────────────────────────── */
async function loadTasas() {
  try {
    const res = await fetch(API_BASE + '/api/portal/tasas', { headers: { Accept: 'application/json' } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    sim.tasaUsd   = Number(data.usd) || 0;
    sim.tasaEur   = Number(data.eur) || 0;
    sim.tasaFecha = data.fecha || '';
  } catch {
    sim.tasaUsd = sim.tasaEur = 0;
  }
}

/* ─────────────────────────────────────────────
   PASO 1 — cargar productos
   ───────────────────────────────────────────── */
async function loadProductos() {
  try {
    const res = await fetch(API_BASE + '/api/portal/productos', { headers: { Accept: 'application/json' } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    renderProductCards(await res.json());
  } catch {
    const loading = document.getElementById('products-loading');
    const grid    = document.getElementById('products-grid');
    if (loading) loading.classList.add('hidden');
    if (grid) {
      grid.innerHTML = `<div class="col-span-3 text-center py-4 text-sm text-gray-500">
        <i class="fa-solid fa-triangle-exclamation text-amber-400 block text-xl mb-2"></i>
        ${t('products.error')}</div>`;
      grid.classList.remove('hidden');
    }
  }
}

/* ── Carousel state ───────────────────────────────────────────────── */
let _carouselPage     = 0;
let _carouselData     = [];
let _carouselPageSize = 9;
let _carouselResizeTimer = null;

function _getCarouselPageSize() {
  if (window.innerWidth < 640) return 6;   // teléfono: 2 filas de 3
  return 9;                                 // tablet / escritorio: 3 filas
}

function renderProductCards(productos) {
  const loading = document.getElementById('products-loading');
  const grid    = document.getElementById('products-grid');
  if (!loading || !grid) return;
  loading.classList.add('hidden');

  if (!productos.length) {
    grid.innerHTML = `<div class="col-span-3 text-center py-4 text-xs text-gray-500">${t('products.error')}</div>`;
    grid.classList.remove('hidden');
    return;
  }

  _carouselData     = productos;
  _carouselPage     = 0;
  _carouselPageSize = _getCarouselPageSize();
  grid.classList.remove('hidden');
  _renderCarouselPage(0);
  _initCarouselControls();
}

function _initCarouselControls() {
  const totalPages = Math.ceil(_carouselData.length / _carouselPageSize);
  const controls   = document.getElementById('carousel-controls');
  const prev       = document.getElementById('carousel-prev');
  const next       = document.getElementById('carousel-next');

  if (totalPages > 1) {
    if (prev) prev.classList.remove('hidden');
    if (next) next.classList.remove('hidden');
    if (controls) { controls.classList.remove('hidden'); controls.classList.add('flex'); }

    const dotsEl = document.getElementById('carousel-dots');
    dotsEl.innerHTML = Array.from({ length: totalPages }, (_, i) =>
      `<span class="carousel-dot${i === _carouselPage ? ' active' : ''}" data-page="${i}" role="button" aria-label="Página ${i + 1}"></span>`
    ).join('');
    dotsEl.querySelectorAll('.carousel-dot').forEach(dot => {
      dot.addEventListener('click', () => _goCarouselPage(parseInt(dot.dataset.page)));
    });

    // onclick reemplaza el listener anterior en cada resize
    if (prev) prev.onclick = () => _goCarouselPage(_carouselPage - 1);
    if (next) next.onclick = () => _goCarouselPage(_carouselPage + 1);
    _updateCarouselNav();
  } else {
    if (prev) prev.classList.add('hidden');
    if (next) next.classList.add('hidden');
    if (controls) { controls.classList.add('hidden'); controls.classList.remove('flex'); }
  }
}

function _renderCarouselPage(page) {
  const grid  = document.getElementById('products-grid');
  const start = page * _carouselPageSize;
  const slice = _carouselData.slice(start, start + _carouselPageSize);

  grid.innerHTML = slice.map(p => {
    const meta       = getMeta(p);
    const isSelected = sim.productoParentId === p.id;
    const desc       = p.descripcion
      ? esc(p.descripcion.substring(0, 35)) + (p.descripcion.length > 35 ? '…' : '')
      : '';
    return `<button type="button" class="product-card${isSelected ? ' selected' : ''}"
        data-id="${p.id}"
        data-nombre="${esc(p.nombre).replace(/"/g,'&quot;')}"
        data-cat="${esc(p.categoria)}"
        data-prima="${p.prima ?? 0}"
        data-derecho="${p.derecho_poliza ?? 0}"
        data-calculo="${p.tipo_calculo || 'fijo'}"
        data-requiere-vehiculo="${p.requiere_vehiculo ? '1' : '0'}"
        data-tipo-bien="${esc(p.tipo_bien ?? 'ninguno')}"
        data-tiene-subtipos="${p.tiene_subtipos ? '1' : '0'}"
        data-docs-req='${JSON.stringify(p.documentos_requeridos ?? [])}'>
      <div class="product-card-icon ${meta.bg} ${meta.text}">
        <i class="fa-solid ${meta.icon}"></i>
      </div>
      <div class="product-card-name">${esc(p.nombre)}</div>
      ${desc ? `<div class="product-card-desc">${desc}</div>` : ''}
    </button>`;
  }).join('');

  grid.querySelectorAll('.product-card').forEach(card =>
    card.addEventListener('click', () => seleccionarProducto(card))
  );
}

function _goCarouselPage(page) {
  const totalPages = Math.ceil(_carouselData.length / _carouselPageSize);
  if (page < 0 || page >= totalPages) return;
  _carouselPage = page;
  _renderCarouselPage(page);
  _updateCarouselNav();
}

function _updateCarouselNav() {
  const totalPages = Math.ceil(_carouselData.length / _carouselPageSize);
  const prev = document.getElementById('carousel-prev');
  const next = document.getElementById('carousel-next');
  if (prev) prev.disabled = _carouselPage === 0;
  if (next) next.disabled = _carouselPage === totalPages - 1;
  document.querySelectorAll('.carousel-dot').forEach(dot => {
    dot.classList.toggle('active', parseInt(dot.dataset.page) === _carouselPage);
  });
}

window.addEventListener('resize', () => {
  if (!_carouselData.length) return;
  clearTimeout(_carouselResizeTimer);
  _carouselResizeTimer = setTimeout(() => {
    const newSize = _getCarouselPageSize();
    if (newSize === _carouselPageSize) return;
    _carouselPageSize = newSize;
    // Si hay un producto seleccionado, saltar a la página donde aparece
    if (sim.productoParentId) {
      const idx = _carouselData.findIndex(p => p.id === sim.productoParentId);
      if (idx !== -1) _carouselPage = Math.floor(idx / newSize);
    } else {
      _carouselPage = 0;
    }
    _renderCarouselPage(_carouselPage);
    _initCarouselControls();
  }, 150);
});

async function seleccionarProducto(card) {
  /* Marcar selección */
  document.querySelectorAll('.product-card').forEach(c => c.classList.remove('selected'));
  card.classList.add('selected');

  /* Actualizar estado base */
  sim.productoParentId      = parseInt(card.dataset.id);
  sim.productoParentNombre  = card.dataset.nombre;
  sim.productoTieneSubtipos = card.dataset.tieneSubtipos === '1';

  /* Si NO tiene sub-tipos: el producto es el efectivo */
  if (!sim.productoTieneSubtipos) {
    aplicarProductoEfectivo({
      id:                   sim.productoParentId,
      nombre:               sim.productoParentNombre,
      categoria:            card.dataset.cat,
      prima:                parseFloat(card.dataset.prima) || 0,
      derecho_poliza:       parseFloat(card.dataset.derecho) || 0,
      tipo_calculo:         card.dataset.calculo || 'fijo',
      requiere_vehiculo:    card.dataset.requiereVehiculo === '1',
      tipo_bien:            card.dataset.tipoBien || 'ninguno',
      documentos_requeridos: JSON.parse(card.dataset.docsReq || '[]'),
    });
    document.getElementById('subtipos-section').classList.add('hidden');
    checkStep1();
    return;
  }

  /* Tiene sub-tipos: resetear efectivo y cargar sub-tipos */
  sim.subtipoId = null;
  sim.subtipoNombre = '';
  sim.productoEfectivoId = null;

  const sec     = document.getElementById('subtipos-section');
  const loading = document.getElementById('subtipos-loading');
  const sgrid   = document.getElementById('subtipos-grid');

  sec.classList.remove('hidden');
  loading.classList.remove('hidden');
  sgrid.innerHTML = '';
  checkStep1();

  try {
    const res = await fetch(API_BASE + `/api/portal/productos/${sim.productoParentId}/subtipos`, {
      headers: { Accept: 'application/json' }
    });
    if (!res.ok) throw new Error();
    const subtipos = await res.json();
    loading.classList.add('hidden');
    renderSubtipoCards(subtipos, sgrid);
  } catch {
    loading.classList.add('hidden');
    sgrid.innerHTML = `<p class="text-xs text-red-500 py-1">Error cargando planes. Intenta de nuevo.</p>`;
  }
}

function renderSubtipoCards(subtipos, container) {
  if (!subtipos.length) {
    container.innerHTML = `<p class="text-xs text-gray-400 py-1">No hay planes disponibles.</p>`;
    return;
  }

  container.innerHTML = subtipos.map(p => {
    const meta = getMeta(p);
    const desc = p.descripcion
      ? esc(p.descripcion.substring(0, 50)) + (p.descripcion.length > 50 ? '…' : '')
      : '';
    return `<button type="button" class="subtipo-card"
        data-id="${p.id}"
        data-nombre="${esc(p.nombre).replace(/"/g,'&quot;')}"
        data-cat="${esc(p.categoria)}"
        data-prima="${p.prima ?? 0}"
        data-derecho="${p.derecho_poliza ?? 0}"
        data-calculo="${p.tipo_calculo || 'fijo'}"
        data-requiere-vehiculo="${p.requiere_vehiculo ? '1' : '0'}"
        data-tipo-bien="${esc(p.tipo_bien ?? 'ninguno')}"
        data-docs-req='${JSON.stringify(p.documentos_requeridos ?? [])}'>
      <div class="subtipo-card-icon ${meta.bg} ${meta.text}">
        <i class="fa-solid ${meta.icon}"></i>
      </div>
      <div>
        <div class="subtipo-card-name">${esc(p.nombre)}</div>
        ${desc ? `<div class="subtipo-card-desc">${desc}</div>` : ''}
      </div>
    </button>`;
  }).join('');

  container.querySelectorAll('.subtipo-card').forEach(card =>
    card.addEventListener('click', () => seleccionarSubtipo(card))
  );
}

function seleccionarSubtipo(card) {
  document.querySelectorAll('.subtipo-card').forEach(c => c.classList.remove('selected'));
  card.classList.add('selected');

  sim.subtipoId     = parseInt(card.dataset.id);
  sim.subtipoNombre = card.dataset.nombre;

  aplicarProductoEfectivo({
    id:                    sim.subtipoId,
    nombre:                sim.subtipoNombre,
    categoria:             card.dataset.cat,
    prima:                 parseFloat(card.dataset.prima) || 0,
    derecho_poliza:        parseFloat(card.dataset.derecho) || 0,
    tipo_calculo:          card.dataset.calculo || 'fijo',
    requiere_vehiculo:     card.dataset.requiereVehiculo === '1',
    tipo_bien:             card.dataset.tipoBien || 'ninguno',
    documentos_requeridos: JSON.parse(card.dataset.docsReq || '[]'),
  });
  checkStep1();
}

function aplicarProductoEfectivo(p) {
  sim.productoEfectivoId   = p.id;
  sim.tipoBien             = p.tipo_bien || 'ninguno';
  sim.requiereVehiculo     = sim.tipoBien === 'vehiculo' || !!p.requiere_vehiculo;
  sim.primaBase            = p.prima || 0;
  sim.derechoPoliza        = p.derecho_poliza || 0;
  sim.tipoCalculo          = p.tipo_calculo || 'fijo';
  sim.documentosRequeridos = p.documentos_requeridos || [];

  /* Determinar categoría del paso 3 a partir de tipo_bien */
  if (sim.tipoBien === 'vehiculo') {
    sim.productoCat = 'vehicular';
  } else if (sim.tipoBien === 'vida') {
    sim.productoCat = 'personas';
  } else if (sim.tipoBien === 'inmueble' || sim.tipoBien === 'bien') {
    sim.productoCat = 'bienes';
  } else {
    /* ninguno / sin dato: inferir de categoría del producto */
    const cat = (p.categoria || '').toLowerCase().trim();
    if (cat === 'vehicular' || cat === 'vehiculo') {
      sim.productoCat = 'vehicular';
    } else if (cat === 'personas' || cat === 'personal' || cat === 'salud' || cat === 'vida') {
      sim.productoCat = 'personas';
    } else {
      sim.productoCat = 'bienes';
    }
  }
}

/* ─────────────────────────────────────────────
   NAVEGACIÓN DE PASOS
   ───────────────────────────────────────────── */
function calcularPasos() {
  const pasos = [1, 2];
  /* Paso 3 solo si hay un bien concreto que capturar (vehículo, inmueble o bien) */
  if (sim.productoCat !== 'personas' && sim.tipoBien !== 'ninguno') pasos.push(3);
  if (sim.documentosRequeridos.length > 0) pasos.push(4);
  pasos.push(5);
  sim._pasos = pasos;
}

function showPaso(n) {
  const skipped = [1,2,3,4,5].filter(s => !sim._pasos.includes(s));
  [1,2,3,4,5].forEach(s => {
    document.getElementById(`step-${s}`)?.classList.add('hidden');
    const tab = document.querySelector(`.step-tab[data-step="${s}"]`);
    if (!tab) return;
    tab.classList.remove('active','done','skipped');
    if (skipped.includes(s))  tab.classList.add('skipped');
    else if (s < n)           tab.classList.add('done');
    else if (s === n)         tab.classList.add('active');
  });
  document.getElementById(`step-${n}`)?.classList.remove('hidden');
  document.querySelector('.form-scroll-area')?.scrollTo({ top: 0, behavior: 'smooth' });
  updateActionBar();
}

function nextPaso() {
  const idx = sim._pasos.indexOf(sim._pasoActual);
  if (idx >= sim._pasos.length - 1) return;
  sim._pasoActual = sim._pasos[idx + 1];
  if (sim._pasoActual === 3) setupStep3();
  if (sim._pasoActual === 4) setupStep4();
  if (sim._pasoActual === 5) setupStep5();
  showPaso(sim._pasoActual);
}

function prevPaso() {
  const idx = sim._pasos.indexOf(sim._pasoActual);
  if (idx <= 0) return;
  sim._pasoActual = sim._pasos[idx - 1];
  showPaso(sim._pasoActual);
}

/* ─────────────────────────────────────────────
   ACTION BAR — gestión centralizada
   ───────────────────────────────────────────── */
function updateActionBar() {
  const paso = sim._pasoActual;
  const elTurnstile  = document.getElementById('action-turnstile');
  const elTerms      = document.getElementById('action-terms');
  const elDocsHint   = document.getElementById('action-docs-hint');
  const elNav        = document.getElementById('action-nav');
  const elResult     = document.getElementById('action-result');
  const btnBack      = document.getElementById('btn-back');
  const btnNext      = document.getElementById('btn-next');
  const btnNextLabel = document.getElementById('btn-next-label');
  const btnNextIcon  = document.getElementById('btn-next-icon');

  /* Reset: ocultar secciones opcionales */
  elTurnstile.classList.add('hidden');
  elTerms.classList.add('hidden');
  elDocsHint.classList.add('hidden');
  elNav.classList.remove('hidden');
  elResult.classList.add('hidden');
  btnBack.classList.add('hidden');
  btnNext.classList.remove('hidden');

  /* Paso 5: detectar sub-estado */
  if (paso === 5) {
    const isLoading = !document.getElementById('s5-loading').classList.contains('hidden');
    const isMatch   = !document.getElementById('s5-match').classList.contains('hidden');
    const isSuccess = !document.getElementById('s5-success').classList.contains('hidden');

    if (isLoading) {
      elNav.classList.add('hidden');
      return;
    }
    if (isMatch || isSuccess) {
      elNav.classList.add('hidden');
      elResult.classList.remove('hidden');
      return;
    }
    /* confirm */
    btnBack.classList.remove('hidden');
    btnNextLabel.textContent = t('btn.send');
    btnNextIcon.className = 'fa-solid fa-paper-plane ml-1.5 text-xs';
    btnNext.disabled = false;
    return;
  }

  /* Pasos 1-4 */
  if (paso === 1) {
    elTurnstile.classList.remove('hidden');
  }
  if (paso === 2) {
    elTerms.classList.remove('hidden');
    btnBack.classList.remove('hidden');
  }
  if (paso === 3) {
    btnBack.classList.remove('hidden');
  }
  if (paso === 4) {
    elDocsHint.classList.remove('hidden');
    btnBack.classList.remove('hidden');
  }

  btnNextLabel.textContent = t('btn.next');
  btnNextIcon.className = 'fa-solid fa-arrow-right ml-1.5 text-xs';

  /* Actualizar estado habilitado del botón next */
  checkCurrentStep();
}

/* ─────────────────────────────────────────────
   VALIDACIONES POR PASO
   ───────────────────────────────────────────── */
function checkCurrentStep() {
  switch (sim._pasoActual) {
    case 1: checkStep1(); break;
    case 2: checkStep2(); break;
    case 3: checkStep3(); break;
    case 4: checkStep4(); break;
  }
}

function checkStep1() {
  const ok = !!(sim.productoEfectivoId && sim.turnstileToken);
  document.getElementById('btn-next').disabled = !ok;
}

function checkStep2() {
  const s2err     = document.getElementById('s2-error');
  const nombre    = document.getElementById('f-nombre')?.value.trim()        || '';
  const cedula    = document.getElementById('f-cedula')?.value.trim()        || '';
  const tel       = document.getElementById('f-telefono')?.value.trim()      || '';
  const email     = document.getElementById('f-email')?.value.trim()         || '';
  const emailConf = document.getElementById('f-email-confirm')?.value.trim() || '';
  const estado    = document.getElementById('f-estado')?.value               || '';
  const ciudad    = document.getElementById('f-ciudad')?.value.trim()        || '';
  const direccion = document.getElementById('f-direccion')?.value.trim()     || '';
  const condicion = document.getElementById('f-condicion')?.value            || '';
  const terms     = document.getElementById('acepto_terminos')?.checked ?? false;

  /* Validación de edad mínima 18 años */
  const nacStr = document.getElementById('f-nacimiento')?.value || '';
  let ageOk = true;
  if (nacStr) {
    const nac    = new Date(nacStr + 'T12:00:00');
    const hoy    = new Date();
    const minAge = new Date(hoy.getFullYear() - 18, hoy.getMonth(), hoy.getDate());
    ageOk = nac <= minAge;
  }

  /* Los correos deben coincidir */
  const emailsMatch = email !== '' && emailConf !== '' && email.toLowerCase() === emailConf.toLowerCase();
  const mismatchEl  = document.getElementById('email-mismatch');
  if (mismatchEl) mismatchEl.classList.toggle('hidden', emailConf === '' || emailsMatch);

  if (s2err) {
    if (!ageOk) {
      s2err.textContent = 'Debes ser mayor de 18 años para solicitar un seguro.';
      s2err.classList.remove('hidden');
    } else {
      s2err.classList.add('hidden');
    }
  }

  const ok = nombre.length >= 2 && cedula.length >= 6
          && tel.length >= 7 && email.includes('@') && emailsMatch
          && estado && ciudad && direccion && condicion && nacStr
          && terms && ageOk;
  document.getElementById('btn-next').disabled = !ok;
}

function checkStep3() {
  let ok = false;
  if (sim.requiereVehiculo) {
    const placa  = document.getElementById('veh-placa')?.value.trim()  || '';
    const modelo = document.getElementById('veh-modelo')?.value.trim() || '';
    const valor  = parseFloat(document.getElementById('veh-valor')?.value) || 0;
    ok = placa.length >= 4 && modelo.length >= 1 && valor >= 500;
  } else {
    const tipo      = document.getElementById('bien-tipo')?.value  || '';
    const valor     = parseFloat(document.getElementById('bien-valor')?.value) || 0;
    const desc      = document.getElementById('bien-descripcion')?.value.trim() || '';
    const direccion = document.getElementById('bien-direccion')?.value.trim()   || '';
    ok = !!tipo && valor > 0 && desc.length >= 2 && direccion.length >= 3;
  }
  document.getElementById('btn-next').disabled = !ok;
}

function checkStep4() {
  if (sim.skipDocs) { document.getElementById('btn-next').disabled = false; return; }
  const requeridos = sim.documentosFiles.filter(d => d.obligatorio);
  const subidos    = sim.documentosFiles.filter(d => d.obligatorio && d.file);
  document.getElementById('btn-next').disabled = subidos.length < requeridos.length;
}

/* ─────────────────────────────────────────────
   SETUP POR PASO
   ───────────────────────────────────────────── */
function setupStep3() {
  const vehEl      = document.getElementById('s3-vehiculo');
  const bienEl     = document.getElementById('s3-bien');
  const tipoWrap   = document.getElementById('bien-tipo-wrap');
  const tipoSelect = document.getElementById('bien-tipo');

  if (sim.requiereVehiculo) {
    vehEl.classList.remove('hidden');
    bienEl.classList.add('hidden');
  } else {
    vehEl.classList.add('hidden');
    bienEl.classList.remove('hidden');

    /* Si el tipo de bien ya viene del producto, pre-seleccionar y ocultar el campo */
    const tipoBienMap = { inmueble: 'Inmueble', bien: 'Otro' };
    const autoTipo = tipoBienMap[sim.tipoBien] ?? null;
    if (autoTipo && tipoSelect) {
      tipoSelect.value = autoTipo;
      if (tipoWrap) tipoWrap.classList.add('hidden');
    } else {
      tipoSelect.value = '';
      if (tipoWrap) tipoWrap.classList.remove('hidden');
    }
  }
  checkStep3();
}

function setupStep4() {
  sim.skipDocs = false;
  sim.documentosFiles = sim.documentosRequeridos.map(d => ({
    nombre:     d.nombre,
    obligatorio: !!d.obligatorio,
    file:       null,
  }));
  renderDocsList();
}

function renderDocsList() {
  const container = document.getElementById('docs-list');
  if (!container) return;

  if (!sim.documentosFiles.length) {
    container.innerHTML = `<p class="text-xs text-gray-400 py-2 text-center">Sin documentos requeridos.</p>`;
    return;
  }

  container.innerHTML = sim.documentosFiles.map((doc, i) => `
    <div class="doc-upload-card" id="doc-card-${i}">
      <div class="flex items-center justify-between mb-1">
        <span class="doc-name">
          ${esc(doc.nombre)}${doc.obligatorio ? ' <span class="text-red-500">*</span>' : ''}
        </span>
        <span class="doc-status" id="doc-status-${i}">${doc.file ? `✓ ${esc(doc.file.name)}` : 'Sin archivo'}</span>
      </div>
      <label class="flex items-center gap-2 cursor-pointer">
        <input type="file" class="sr-only doc-file-input" data-idx="${i}"
               accept=".pdf,.jpg,.jpeg,.png,.webp">
        <span class="doc-upload-btn${doc.file ? ' uploaded' : ''}" id="doc-btn-${i}">
          <i class="fa-solid fa-paperclip text-[10px]"></i>
          ${doc.file ? 'Cambiar' : 'Adjuntar'}
        </span>
        ${!doc.obligatorio ? '<span class="text-[10px] text-gray-400">opcional</span>' : ''}
      </label>
    </div>
  `).join('');

  container.querySelectorAll('.doc-file-input').forEach(input => {
    input.addEventListener('change', function () {
      const idx  = parseInt(this.dataset.idx);
      const file = this.files?.[0] ?? null;
      sim.documentosFiles[idx].file = file;

      const card   = document.getElementById(`doc-card-${idx}`);
      const status = document.getElementById(`doc-status-${idx}`);
      const btn    = document.getElementById(`doc-btn-${idx}`);

      if (file) {
        card.classList.add('has-file');
        card.classList.remove('missing-required');
        status.classList.add('uploaded');
        status.textContent = `✓ ${file.name.substring(0, 22)}${file.name.length > 22 ? '…' : ''}`;
        btn.classList.add('uploaded');
        btn.innerHTML = '<i class="fa-solid fa-check text-[10px]"></i> Cambiar';
      } else {
        card.classList.remove('has-file');
        status.classList.remove('uploaded');
        status.textContent = 'Sin archivo';
        btn.classList.remove('uploaded');
        btn.innerHTML = '<i class="fa-solid fa-paperclip text-[10px]"></i> Adjuntar';
      }
      checkStep4();
    });
  });

  checkStep4();
}

function showS5State(state) {
  /* state: 'loading' | 'match' | 'success' | 'confirm' */
  ['s5-loading','s5-match','s5-success','s5-confirm'].forEach(id =>
    document.getElementById(id)?.classList.add('hidden')
  );
  document.getElementById(`s5-${state}`)?.classList.remove('hidden');
  updateActionBar();
}

function setupStep5() {
  const primaBase = sim.primaBase;
  const tienePrecio = primaBase > 0;
  const iva     = tienePrecio ? Math.round(primaBase * 0.16 * 100) / 100 : 0;
  const derecho = sim.derechoPoliza;
  const total   = tienePrecio ? primaBase + iva + derecho : 0;
  const fmt = n => n.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const nc  = currentLang === 'en' ? 'To be quoted' : 'A cotizar';

  /* Nombre del producto (parent + sub-tipo si aplica) */
  let nombreProducto = sim.productoParentNombre;
  if (sim.subtipoNombre) nombreProducto += ` — ${sim.subtipoNombre}`;

  document.getElementById('s5-producto-nombre').textContent = nombreProducto;
  document.getElementById('s5-total').textContent   = tienePrecio ? `$ ${fmt(total)}`  : nc;
  document.getElementById('s5-prima').textContent   = tienePrecio ? `$ ${fmt(primaBase)}` : nc;
  document.getElementById('s5-iva').textContent     = tienePrecio ? `$ ${fmt(iva)}`    : nc;
  document.getElementById('s5-derecho').textContent = tienePrecio ? `$ ${fmt(derecho)}` : '$ 0.00';
  document.getElementById('s5-mensual').textContent = tienePrecio ? `$ ${fmt(total / 12)}` : nc;

  /* Equivalente en Bs. y EUR según la tasa BCV vigente */
  const totalOtrasEl = document.getElementById('s5-total-otras');
  const tasaBcvEl     = document.getElementById('s5-tasa-bcv');
  const tasaBcvValorEl = document.getElementById('s5-tasa-bcv-valor');
  if (tienePrecio && sim.tasaUsd > 0) {
    const totalBs  = total * sim.tasaUsd;
    const partes   = [`Bs. ${fmt(totalBs)}`];
    if (sim.tasaEur > 0) partes.push(`€ ${fmt(total * sim.tasaUsd / sim.tasaEur)}`);
    if (totalOtrasEl) totalOtrasEl.textContent = partes.join(' · ');
    if (tasaBcvEl) {
      tasaBcvEl.classList.remove('hidden');
      const tasaTxt = `USD/Bs. ${fmt(sim.tasaUsd)}` + (sim.tasaEur > 0 ? ` · EUR/Bs. ${fmt(sim.tasaEur)}` : '') + (sim.tasaFecha ? ` (${sim.tasaFecha})` : '');
      if (tasaBcvValorEl) tasaBcvValorEl.textContent = tasaTxt;
    }
  } else {
    if (totalOtrasEl) totalOtrasEl.textContent = '';
    if (tasaBcvEl) tasaBcvEl.classList.add('hidden');
  }

  const nombre = document.getElementById('f-nombre')?.value.trim() || '—';
  const tipo   = document.getElementById('f-cedula-tipo')?.value || 'V';
  const cedula = document.getElementById('f-cedula')?.value.trim() || '—';
  document.getElementById('s5-nombre').textContent = nombre;
  document.getElementById('s5-cedula').textContent = `${tipo}-${cedula}`;

  const subidos   = sim.documentosFiles.filter(d => d.file).length;
  const totalDocs = sim.documentosFiles.length;
  document.getElementById('s5-docs-count').textContent =
    totalDocs > 0 ? `${subidos}/${totalDocs}` : (currentLang === 'es' ? 'No requeridos' : 'None required');

  /* Mostrar confirm, ocultar otros sub-estados */
  showS5State('confirm');
}

/* ─────────────────────────────────────────────
   CONDICIÓN CIVIL SEGÚN SEXO
   ───────────────────────────────────────────── */
function updateCondicionOpts() {
  const sexo = document.getElementById('f-sexo')?.value || 'M';
  const sel  = document.getElementById('f-condicion');
  if (!sel) return;
  const prev = sel.value;
  const isFem = sexo === 'F';
  const opts = isFem
    ? [['','Selec...'],['Soltera','Soltera'],['Casada','Casada'],['Viuda','Viuda'],['Divorciada','Divorciada'],['Concubina','Concubina']]
    : [['','Selec...'],['Soltero','Soltero'],['Casado','Casado'],['Viudo','Viudo'],['Divorciado','Divorciado'],['Concubino','Concubino']];
  sel.innerHTML = opts.map(([v,l]) => `<option value="${v}">${l}</option>`).join('');
  const mirror = {Soltero:'Soltera',Soltera:'Soltero',Casado:'Casada',Casada:'Casado',Viudo:'Viuda',Viuda:'Viudo',Divorciado:'Divorciada',Divorciada:'Divorciado',Concubino:'Concubina',Concubina:'Concubino'};
  sel.value = [...sel.options].some(o => o.value === prev) ? prev : (mirror[prev] || '');
}

/* ─────────────────────────────────────────────
   WIRE-UP — ACTION BAR UNIFICADA
   ───────────────────────────────────────────── */

/* Botón ATRÁS */
document.getElementById('btn-back').addEventListener('click', prevPaso);

/* Botón SIGUIENTE / ENVIAR */
document.getElementById('btn-next').addEventListener('click', () => {
  if (document.getElementById('btn-next').disabled) return;
  if (sim._pasoActual === 5) { submitForm(); return; }
  if (sim._pasoActual === 1) {
    if (!sim.productoEfectivoId) return;
    calcularPasos();
  }
  nextPaso();
});

/* Botón RESTART (action-result) */
document.getElementById('btn-restart').addEventListener('click', resetAll);

/* Botón "Continuar sin documentos" en paso 4 */
document.getElementById('btn-skip-docs')?.addEventListener('click', () => {
  sim.skipDocs = true;
  document.getElementById('btn-next').disabled = false;
  document.getElementById('btn-next').click();
});

/* Paso 2 — validación en tiempo real + sanitización */
['f-nombre','f-ciudad','f-direccion','f-email','f-email-confirm'].forEach(id =>
  document.getElementById(id)?.addEventListener('input', function () { sanitizeInput(this); checkStep2(); })
);
document.getElementById('f-telefono')?.addEventListener('input', function () { sanitizeTel(this); checkStep2(); });
document.getElementById('f-cedula')?.addEventListener('input', checkStep2);
document.getElementById('f-nacimiento')?.addEventListener('change', checkStep2);
document.getElementById('f-sexo')?.addEventListener('change', () => { updateCondicionOpts(); checkStep2(); });
['f-condicion','f-estado','f-nacionalidad'].forEach(id =>
  document.getElementById(id)?.addEventListener('change', checkStep2)
);
document.getElementById('acepto_terminos')?.addEventListener('change', checkStep2);

/* Paso 3 — validación en tiempo real + sanitización */
['veh-modelo','veh-color','bien-descripcion','bien-direccion'].forEach(id =>
  document.getElementById(id)?.addEventListener('input', function () { sanitizeInput(this); checkStep3(); })
);
['veh-placa','veh-valor','bien-valor'].forEach(id =>
  document.getElementById(id)?.addEventListener('input', checkStep3)
);
['veh-marca','veh-uso','veh-anio','bien-tipo'].forEach(id =>
  document.getElementById(id)?.addEventListener('change', checkStep3)
);

/* ─────────────────────────────────────────────
   ENVÍO — FormData (soporta archivos)
   ───────────────────────────────────────────── */
async function submitForm() {
  const btn = document.getElementById('btn-next');
  btn.disabled = true;

  showS5State('loading');

  /* Construir FormData */
  const fd = new FormData();
  fd.append('_turnstile',      sim.turnstileToken);
  fd.append('nombre_completo', document.getElementById('f-nombre').value.trim());
  const tipo   = document.getElementById('f-cedula-tipo').value;
  const numero = document.getElementById('f-cedula').value.trim();
  fd.append('cedula',          `${tipo}-${numero}`);
  fd.append('telefono',        document.getElementById('f-telefono').value.trim());
  fd.append('email',           document.getElementById('f-email').value.trim()      || '');
  fd.append('email_confirmation', document.getElementById('f-email-confirm').value.trim() || '');
  fd.append('estado',          document.getElementById('f-estado').value            || '');
  fd.append('ciudad',          document.getElementById('f-ciudad').value.trim()     || '');
  fd.append('direccion',       document.getElementById('f-direccion').value.trim()  || '');
  fd.append('sexo',            document.getElementById('f-sexo').value              || '');
  fd.append('condicion',       document.getElementById('f-condicion').value         || '');
  fd.append('nacimiento',      document.getElementById('f-nacimiento').value        || '');
  fd.append('nacionalidad',    document.getElementById('f-nacionalidad').value      || '');
  fd.append('producto_id',     String(sim.productoParentId ?? ''));
  fd.append('subtipo_id',      String(sim.subtipoId ?? ''));
  fd.append('tipo_seguro',     sim.subtipoNombre || sim.productoParentNombre || '');
  fd.append('prima_estimada',  String(sim.primaBase > 0 ? sim.primaBase + Math.round(sim.primaBase * 0.16 * 100) / 100 + sim.derechoPoliza : 0));

  /* Vehículo */
  if (sim.requiereVehiculo) {
    fd.append('placa',         document.getElementById('veh-placa').value.trim()  || '');
    fd.append('marca',         document.getElementById('veh-marca').value         || '');
    fd.append('modelo',        document.getElementById('veh-modelo').value.trim() || '');
    fd.append('año',           document.getElementById('veh-anio').value          || '');
    fd.append('color',         document.getElementById('veh-color').value.trim()  || '');
    fd.append('uso',           document.getElementById('veh-uso').value           || '');
    fd.append('valor_mercado', document.getElementById('veh-valor').value         || '');
  }

  /* Bien genérico */
  if (!sim.requiereVehiculo && sim.productoCat !== 'personas' && sim.tipoBien !== 'ninguno') {
    fd.append('bien_tipo',        document.getElementById('bien-tipo').value       || '');
    fd.append('bien_descripcion', document.getElementById('bien-descripcion').value.trim() || '');
    fd.append('bien_valor',       document.getElementById('bien-valor').value      || '');
    fd.append('bien_direccion',   document.getElementById('bien-direccion').value.trim()   || '');
  }

  /* Documentos */
  sim.documentosFiles.forEach((doc, i) => {
    if (doc.file) {
      fd.append(`documentos[${i}]`,         doc.file);
      fd.append(`documentos_nombres[${i}]`, doc.nombre);
    }
  });

  try {
    const res  = await fetch(API_BASE + '/api/portal/cotizacion', {
      method: 'POST',
      headers: { Accept: 'application/json' },
      body: fd,
    });

    let data = {};
    try { data = await res.json(); } catch { /* respuesta no-JSON */ }

    if (!res.ok) {
      showS5State('confirm');
      const errMsg = data.message || data.error
        || Object.values(data.errors || {}).flat().join(' · ')
        || `Error ${res.status}. Intenta nuevamente.`;
      document.getElementById('s5-confirm').insertAdjacentHTML('afterbegin',
        `<div class="mb-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          ${esc(errMsg)}
        </div>`);
      btn.disabled = false;
      return;
    }

    if (data.match) {
      const titulo = data.tiene_poliza
        ? (currentLang === 'es' ? '¡Tienes una póliza activa!' : 'You have an active policy!')
        : (currentLang === 'es' ? '¡Encontramos tu registro!'  : 'We found your record!');
      const sub = data.tiene_poliza
        ? (currentLang === 'es' ? 'Ya cuentas con una póliza activa. Para renovar o añadir cobertura, habla con un asesor.' : 'You already have an active policy. Talk to an advisor to renew or add coverage.')
        : (currentLang === 'es' ? 'Estás en nuestro sistema. Un asesor puede cotizarte un nuevo seguro.' : 'You are in our system. An advisor can provide a new quote.');
      document.getElementById('s5-match-title').textContent  = titulo;
      document.getElementById('s5-match-nombre').textContent = data.nombre || '';
      document.getElementById('s5-match-sub').textContent    = sub;
      showS5State('match');
    } else {
      showS5State('success');
    }

  } catch (err) {
    showS5State('confirm');
    const errText = currentLang === 'es'
      ? 'No se pudo conectar con el servidor. Revisa tu conexión e intenta nuevamente, o contacta a un asesor.'
      : 'Could not connect to the server. Check your connection and try again, or contact an advisor.';
    document.getElementById('s5-confirm').insertAdjacentHTML('afterbegin',
      `<div class="mb-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
        <i class="fa-solid fa-triangle-exclamation mr-1"></i>${errText}
      </div>`);
    btn.disabled = false;
  }
}

/* ─────────────────────────────────────────────
   RESET COMPLETO
   ───────────────────────────────────────────── */
function resetAll() {
  /* Productos */
  document.querySelectorAll('.product-card').forEach(c => c.classList.remove('selected'));
  document.querySelectorAll('.subtipo-card').forEach(c => c.classList.remove('selected'));
  document.getElementById('subtipos-section')?.classList.add('hidden');
  document.getElementById('subtipos-grid')?.replaceChildren();

  /* Formulario paso 2 */
  ['f-nombre','f-cedula','f-telefono','f-email','f-email-confirm','f-ciudad','f-direccion','f-nacimiento']
    .forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
  ['f-cedula-tipo','f-sexo','f-condicion','f-estado','f-nacionalidad']
    .forEach(id => { const el = document.getElementById(id); if (el) el.selectedIndex = 0; });
  updateCondicionOpts();
  const terms = document.getElementById('acepto_terminos');
  if (terms) terms.checked = false;

  /* Formulario paso 3 */
  ['veh-placa','veh-modelo','veh-color','veh-valor',
   'bien-descripcion','bien-valor','bien-direccion']
    .forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
  ['veh-marca','veh-uso','veh-anio','bien-tipo']
    .forEach(id => { const el = document.getElementById(id); if (el) el.selectedIndex = 0; });

  /* Docs */
  document.getElementById('docs-list')?.replaceChildren();

  /* Paso 5 */
  ['s5-loading','s5-match','s5-success'].forEach(id =>
    document.getElementById(id)?.classList.add('hidden')
  );
  document.getElementById('s5-confirm')?.classList.remove('hidden');
  document.querySelectorAll('#s5-confirm > .text-red-600').forEach(el => el.remove());

  /* Turnstile */
  if (typeof turnstile !== 'undefined' && turnstileWidgetId !== null) {
    try { turnstile.reset(turnstileWidgetId); } catch {}
  }

  /* Estado */
  Object.assign(sim, {
    productoParentId: null, productoParentNombre: '', productoTieneSubtipos: false,
    subtipoId: null, subtipoNombre: '',
    productoEfectivoId: null, productoCat: '', requiereVehiculo: false,
    primaBase: 0, derechoPoliza: 0, tipoCalculo: 'fijo', documentosRequeridos: [],
    documentosFiles: [], turnstileToken: '',
    _pasos: [1,2,5], _pasoActual: 1,
  });

  sim._pasoActual = 1;
  showPaso(1);   /* showPaso llama a updateActionBar internamente */
}

/* WhatsApp */
document.querySelectorAll('.whatsapp-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const msg = currentLang === 'es'
      ? `Hola J&M, soy ${document.getElementById('f-nombre')?.value.trim() || 'un cliente'} y me interesa: ${sim.productoParentNombre}${sim.subtipoNombre ? ' — '+sim.subtipoNombre : ''}.`
      : `Hello J&M, I'm ${document.getElementById('f-nombre')?.value.trim() || 'a client'} and I'm interested in: ${sim.productoParentNombre}${sim.subtipoNombre ? ' — '+sim.subtipoNombre : ''}.`;
    window.open(`https://wa.me/58?text=${encodeURIComponent(msg)}`, '_blank');
  });
});

/* ─────────────────────────────────────────────
   CHATBOT
   ───────────────────────────────────────────── */
const chatbotBtn    = document.getElementById('chatbot-btn');
const chatbotPanel  = document.getElementById('chatbot-panel');
const chatMessages  = document.getElementById('chat-messages');
const chatInput     = document.getElementById('chat-input');
const chatSend      = document.getElementById('chat-send');
const chatbotBadge  = document.querySelector('.chatbot-badge');

const BOT_RESPONSES = {
  es: [
    { triggers: ['cotizar','cotizacion','cotización','precio','costo'],
      reply: 'Puedes usar nuestro <a href="#cotizador" class="underline font-semibold" onclick="closeChat()">simulador</a>. ¡Es gratuito y rápido! 😊' },
    { triggers: ['seguro','seguros','ofrecen','tipos','poliza','póliza'],
      reply: 'En J&M ofrecemos: 🚗 Vehículos, 🏠 Hogar, ❤️ Vida, 🏥 HCM/Salud, 🏢 Empresarial y 📋 Fianzas.' },
    { triggers: ['asesor','hablar','contacto','whatsapp','llamar','humano'],
      reply: 'Con gusto te conectamos. Escríbenos al WhatsApp o usa el botón "Hablar con asesor". 📞' },
    { triggers: ['hola','buenas','buenos','buen'],
      reply: '¡Hola! 👋 Bienvenido/a a J&M. ¿En qué te puedo ayudar?' },
    { triggers: ['gracias','perfecto','genial','excelente'],
      reply: '¡Con mucho gusto! 😊 ¿Necesitas algo más?' },
  ],
  en: [
    { triggers: ['quote','quotation','price','cost'],
      reply: 'Use our <a href="#cotizador" class="underline font-semibold" onclick="closeChat()">simulator</a>. It\'s free and instant! 😊' },
    { triggers: ['insurance','offer','types','policy'],
      reply: 'At J&M we offer: 🚗 Vehicle, 🏠 Home, ❤️ Life, 🏥 Health, 🏢 Business and 📋 Bonds.' },
    { triggers: ['advisor','agent','human','contact','whatsapp'],
      reply: "We'd love to connect you! Use WhatsApp or the 'Contact Advisor' button. 📞" },
    { triggers: ['hello','hi','hey'],
      reply: 'Hello! 👋 Welcome to J&M. How can I help you today?' },
    { triggers: ['thanks','thank','great','perfect'],
      reply: "You're welcome! 😊 Anything else I can do for you?" },
  ],
};

const DEFAULT_REPLY = {
  es: 'Un asesor de J&M estará disponible pronto. También puedes usar el <a href="#cotizador" class="underline font-semibold" onclick="closeChat()">simulador</a>.',
  en: 'A J&M advisor will be available shortly. You can also use our <a href="#cotizador" class="underline font-semibold" onclick="closeChat()">simulator</a>.',
};

window.closeChat = () => chatbotPanel.classList.add('hidden');

function getBotReply(text) {
  const lower     = text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const responses = BOT_RESPONSES[currentLang] || BOT_RESPONSES.es;
  for (const item of responses) {
    if (item.triggers.some(tr => lower.includes(tr))) return item.reply;
  }
  return DEFAULT_REPLY[currentLang] || DEFAULT_REPLY.es;
}

function addMessage(html, sender = 'bot') {
  const div = document.createElement('div');
  div.className = `chat-msg ${sender}`;
  div.innerHTML = html;
  chatMessages.appendChild(div);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function handleSend() {
  const text = chatInput.value.trim();
  if (!text) return;
  addMessage(esc(text), 'user');
  chatInput.value = '';
  const typing = document.createElement('div');
  typing.className = 'chat-msg bot';
  typing.innerHTML = '<span style="letter-spacing:3px;opacity:0.5">●●●</span>';
  chatMessages.appendChild(typing);
  chatMessages.scrollTop = chatMessages.scrollHeight;
  setTimeout(() => { typing.remove(); addMessage(getBotReply(text), 'bot'); }, 750 + Math.random() * 600);
}

const whatsappFab = document.getElementById('whatsapp-fab-btn');

chatbotBtn.addEventListener('click', () => {
  const isHidden = chatbotPanel.classList.contains('hidden');
  chatbotPanel.classList.toggle('hidden', !isHidden);
  chatbotBtn.classList.toggle('hidden', isHidden);
  whatsappFab?.classList.toggle('hidden', isHidden);
  if (isHidden) {
    if (chatbotBadge) chatbotBadge.style.display = 'none';
    setTimeout(() => chatInput.focus(), 200);
  }
});
document.getElementById('chatbot-close').addEventListener('click', () => {
  chatbotPanel.classList.add('hidden');
  chatbotBtn.classList.remove('hidden');
  whatsappFab?.classList.remove('hidden');
});
chatSend.addEventListener('click', handleSend);
chatInput.addEventListener('keydown', e => { if (e.key === 'Enter') handleSend(); });
document.querySelectorAll('.chat-chip').forEach(chip => {
  chip.addEventListener('click', () => {
    const text = chip.textContent.trim();
    addMessage(esc(text), 'user');
    chip.closest('.chat-suggestions')?.remove();
    setTimeout(() => addMessage(getBotReply(text), 'bot'), 750);
  });
});

/* ─── Arranque ─────────────────────────────── */
loadProductos();
loadTasas();
