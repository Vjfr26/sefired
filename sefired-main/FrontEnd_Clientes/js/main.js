/* ============================================
   SEFIRED — Main JavaScript
   i18n + Cotizador + Chatbot
   ============================================ */

/* ─────────────────────────────────────────────
   TRANSLATIONS
   ───────────────────────────────────────────── */
const T = {
  es: {
    'nav.tagline':      'Seguros & Fianzas',
    'badge':            'Cotización en línea · Sin compromiso',
    'hero.title1':      'Cotiza tu seguro',
    'hero.title2':      'en segundos',
    'hero.subtitle':    'Obtén una estimación personalizada de tu póliza. Rápido, transparente y sin necesidad de registro.',
    'tab.step1':        'Tipo de seguro',
    'tab.step2':        'Tus datos',
    'tab.step3':        'Tu cotización',
    's1.question':      '¿Qué deseas asegurar?',
    'ins.veh.label':    'Vehículo',
    'ins.veh.sub':      'Auto / Moto',
    'ins.hogar.label':  'Hogar',
    'ins.hogar.sub':    'Inmueble',
    'ins.vida.label':   'Vida',
    'ins.vida.sub':     'Personal',
    'ins.salud.label':  'HCM / Salud',
    'ins.salud.sub':    'Médico',
    'ins.emp.label':    'Empresarial',
    'ins.emp.sub':      'Negocio',
    'ins.fianza.label': 'Fianzas',
    'ins.fianza.sub':   'Garantía',
    'veh.marca':        'Marca',
    'veh.anio':         'Año del vehículo',
    'veh.cobertura':    'Cobertura deseada',
    'veh.rc':           'Responsabilidad Civil',
    'veh.limitada':     'Cobertura Limitada',
    'veh.amplia':       'Cobertura Amplia',
    'hogar.tipo':       'Tipo de inmueble',
    'hogar.opt.casa':   'Casa',
    'hogar.opt.apto':   'Apartamento',
    'hogar.opt.local':  'Local comercial',
    'hogar.m2':         'Metros cuadrados (m²)',
    'hogar.m2.ph':      'Ej. 90',
    'vida.edad':        'Edad del asegurado',
    'vida.edad.ph':     'Ej. 35',
    'vida.suma':        'Suma asegurada (USD)',
    'vida.suma.ph':     'Ej. 10000',
    'salud.benef':      'Número de beneficiarios',
    'salud.benef.1':    '1 — Individual',
    'salud.benef.2':    '2 — Pareja',
    'salud.benef.3':    '3 — Familiar (3)',
    'salud.benef.4':    '4+ — Familiar (4+)',
    'salud.suma':       'Suma asegurada (USD)',
    'salud.suma.ph':    'Ej. 5000',
    'emp.rubro':            'Rubro de la empresa',
    'emp.opt.comercio':     'Comercio',
    'emp.opt.manufactura':  'Manufactura',
    'emp.opt.servicios':    'Servicios',
    'emp.opt.construccion': 'Construcción',
    'emp.opt.transporte':   'Transporte',
    'emp.opt.otro':         'Otro',
    'fianza.tipo':       'Tipo de fianza',
    'fianza.opt.fc':     'Fiel cumplimiento',
    'fianza.opt.anticipo': 'Anticipo',
    'fianza.opt.laboral':  'Laboral',
    'fianza.opt.judicial': 'Judicial',
    'fianza.monto':      'Monto de la fianza (USD)',
    'fianza.monto.ph':   'Ej. 50000',
    'sel.default':       'Seleccionar...',
    'sel.estado':        'Seleccionar estado...',
    'btn.next':          'Continuar',
    's2.title':          'Tus datos de contacto',
    'f.nombre':          'Nombre',
    'f.nombre.ph':       'Ej. María',
    'f.apellido':        'Apellido',
    'f.apellido.ph':     'Ej. González',
    'f.cedula':          'Cédula de Identidad',
    'f.telefono':        'Teléfono',
    'f.email':           'Correo electrónico',
    'f.email.ph':        'tu@correo.com',
    'f.estado':          'Estado (Venezuela)',
    'f.terms':           'Acepto que Sefired procese mis datos personales para recibir información sobre seguros y fianzas, de acuerdo con la',
    'f.privacy':         'Política de Privacidad',
    'btn.back':          'Atrás',
    'btn.calc':          'Calcular cotización',
    'loading':           'Calculando tu cotización...',
    'res.title':         '¡Tu cotización está lista!',
    'res.subtitle':      'Estimación basada en la información suministrada',
    'res.tipo':          'Tipo de seguro',
    'res.annual':        'Prima anual estimada',
    'res.monthly':       'Prima mensual estimada',
    'res.titular':       'Titular',
    'res.telefono':      'Teléfono',
    'res.estado':        'Estado',
    'res.disclaimer':    'Esta cotización es referencial y puede variar según inspección técnica y condiciones específicas de la póliza. Un asesor de Sefired se contactará contigo a la brevedad.',
    'btn.restart':       'Nueva cotización',
    'btn.whatsapp':      'Hablar con asesor',
    'trust.data':        'Datos seguros',
    'trust.speed':       'Respuesta inmediata',
    'trust.reg':         'Empresa regulada SUDEASEG',
    'chat.title':        'Asistente Sefired',
    'chat.online':       'En línea',
    'chat.ph':           'Escribe tu mensaje...',
    'chat.fab':          'Abrir chat',
    'chat.greeting1':    '¡Hola! 👋 Soy el asistente virtual de Sefired.',
    'chat.greeting2':    '¿En qué puedo ayudarte hoy?',
    'chat.chip1':        'Cotizar seguro',
    'chat.chip2':        '¿Qué seguros ofrecen?',
    'chat.chip3':        'Hablar con asesor',
    'footer.rights':     'Todos los derechos reservados.',
    'footer.by':         'Desarrollado por',
    'soc.facebook':      'Facebook',
    'soc.instagram':     'Instagram',
    'soc.twitter':       'Twitter / X',
    'soc.linkedin':      'LinkedIn',
    'soc.whatsapp':      'WhatsApp',
    'feat.respaldo':     'Respaldo confiable',
    'feat.respaldo.sub': 'Más de 15 años en el mercado',
    'feat.asesoria':     'Asesoría personalizada',
    'feat.asesoria.sub': 'Expertos a tu servicio 24/7',
    'feat.coberturas':   'Coberturas a tu medida',
    'feat.coberturas.sub': 'Planes flexibles para cada necesidad',
    'feat.rapido':       'Rápido, fácil y seguro',
    'feat.rapido.sub':   'Cotiza en menos de 2 minutos',
  },
  en: {
    'nav.tagline':      'Insurance & Bonds',
    'badge':            'Online Quote · No Commitment',
    'hero.title1':      'Get your insurance',
    'hero.title2':      'in seconds',
    'hero.subtitle':    'Get a personalized estimate for your policy. Fast, transparent, and no registration required.',
    'tab.step1':        'Insurance Type',
    'tab.step2':        'Your Details',
    'tab.step3':        'Your Quote',
    's1.question':      'What would you like to insure?',
    'ins.veh.label':    'Vehicle',
    'ins.veh.sub':      'Car / Motorcycle',
    'ins.hogar.label':  'Home',
    'ins.hogar.sub':    'Property',
    'ins.vida.label':   'Life',
    'ins.vida.sub':     'Personal',
    'ins.salud.label':  'Health',
    'ins.salud.sub':    'Medical',
    'ins.emp.label':    'Business',
    'ins.emp.sub':      'Company',
    'ins.fianza.label': 'Bonds',
    'ins.fianza.sub':   'Guarantee',
    'veh.marca':        'Brand',
    'veh.anio':         'Vehicle Year',
    'veh.cobertura':    'Coverage Type',
    'veh.rc':           'Third-Party Liability',
    'veh.limitada':     'Limited Coverage',
    'veh.amplia':       'Full Coverage',
    'hogar.tipo':       'Property Type',
    'hogar.opt.casa':   'House',
    'hogar.opt.apto':   'Apartment',
    'hogar.opt.local':  'Commercial space',
    'hogar.m2':         'Square Meters (m²)',
    'hogar.m2.ph':      'E.g. 90',
    'vida.edad':        "Insured's Age",
    'vida.edad.ph':     'E.g. 35',
    'vida.suma':        'Sum Insured (USD)',
    'vida.suma.ph':     'E.g. 10000',
    'salud.benef':      'Number of Beneficiaries',
    'salud.benef.1':    '1 — Individual',
    'salud.benef.2':    '2 — Couple',
    'salud.benef.3':    '3 — Family (3)',
    'salud.benef.4':    '4+ — Family (4+)',
    'salud.suma':       'Sum Insured (USD)',
    'salud.suma.ph':    'E.g. 5000',
    'emp.rubro':            'Business Sector',
    'emp.opt.comercio':     'Retail',
    'emp.opt.manufactura':  'Manufacturing',
    'emp.opt.servicios':    'Services',
    'emp.opt.construccion': 'Construction',
    'emp.opt.transporte':   'Transportation',
    'emp.opt.otro':         'Other',
    'fianza.tipo':       'Bond Type',
    'fianza.opt.fc':     'Performance Bond',
    'fianza.opt.anticipo': 'Advance Payment Bond',
    'fianza.opt.laboral':  'Labor Bond',
    'fianza.opt.judicial': 'Judicial Bond',
    'fianza.monto':      'Bond Amount (USD)',
    'fianza.monto.ph':   'E.g. 50000',
    'sel.default':       'Select...',
    'sel.estado':        'Select state...',
    'btn.next':          'Continue',
    's2.title':          'Your Contact Details',
    'f.nombre':          'First Name',
    'f.nombre.ph':       'E.g. Maria',
    'f.apellido':        'Last Name',
    'f.apellido.ph':     'E.g. González',
    'f.cedula':          'ID Number',
    'f.telefono':        'Phone',
    'f.email':           'Email',
    'f.email.ph':        'you@email.com',
    'f.estado':          'State (Venezuela)',
    'f.terms':           'I accept that Sefired processes my personal data to receive information about insurance and bonds, in accordance with the',
    'f.privacy':         'Privacy Policy',
    'btn.back':          'Back',
    'btn.calc':          'Calculate Quote',
    'loading':           'Calculating your quote...',
    'res.title':         'Your Quote is Ready!',
    'res.subtitle':      'Estimate based on the information provided',
    'res.tipo':          'Insurance type',
    'res.annual':        'Estimated annual premium',
    'res.monthly':       'Estimated monthly premium',
    'res.titular':       'Policyholder',
    'res.telefono':      'Phone',
    'res.estado':        'State',
    'res.disclaimer':    'This quote is referential and may vary based on technical inspection and specific policy conditions. A Sefired advisor will contact you shortly.',
    'btn.restart':       'New Quote',
    'btn.whatsapp':      'Contact Advisor',
    'trust.data':        'Secure Data',
    'trust.speed':       'Immediate Response',
    'trust.reg':         'Company regulated by SUDEASEG',
    'chat.title':        'Sefired Assistant',
    'chat.online':       'Online',
    'chat.ph':           'Type your message...',
    'chat.fab':          'Open chat',
    'chat.greeting1':    'Hello! 👋 I am Sefired\'s virtual assistant.',
    'chat.greeting2':    'How can I help you today?',
    'chat.chip1':        'Get a quote',
    'chat.chip2':        'What insurance do you offer?',
    'chat.chip3':        'Talk to an advisor',
    'footer.rights':     'All rights reserved.',
    'footer.by':         'Developed by',
    'soc.facebook':      'Facebook',
    'soc.instagram':     'Instagram',
    'soc.twitter':       'Twitter / X',
    'soc.linkedin':      'LinkedIn',
    'soc.whatsapp':      'WhatsApp',
    'feat.respaldo':     'Reliable Support',
    'feat.respaldo.sub': 'More than 15 years in the market',
    'feat.asesoria':     'Personalized Advisory',
    'feat.asesoria.sub': 'Experts at your service 24/7',
    'feat.coberturas':   'Customized Coverage',
    'feat.coberturas.sub': 'Flexible plans for every need',
    'feat.rapido':       'Fast, Easy & Secure',
    'feat.rapido.sub':   'Get a quote in under 2 minutes',
  }
};

const INSURANCE_LABELS = {
  vehiculo:    { es: 'Seguro de Vehículo',   en: 'Vehicle Insurance' },
  hogar:       { es: 'Seguro de Hogar',       en: 'Home Insurance' },
  vida:        { es: 'Seguro de Vida',         en: 'Life Insurance' },
  salud:       { es: 'HCM / Seguro de Salud', en: 'HMO / Health Insurance' },
  empresarial: { es: 'Seguro Empresarial',     en: 'Business Insurance' },
  fianza:      { es: 'Fianzas y Garantías',    en: 'Bonds & Guarantees' },
};

const BASE_PREMIUM = {
  vehiculo: 350, hogar: 220, vida: 180,
  salud: 480, empresarial: 800, fianza: 600,
};

/* ─────────────────────────────────────────────
   i18n ENGINE
   ───────────────────────────────────────────── */
let currentLang = localStorage.getItem('sefired-lang') || 'es';

function t(key) {
  return T[currentLang][key] || T['es'][key] || key;
}

function setLanguage(lang) {
  if (!T[lang]) return;
  currentLang = lang;
  localStorage.setItem('sefired-lang', lang);
  document.documentElement.lang = lang;

  /* Text content */
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const val = t(el.dataset.i18n);
    if (val !== undefined) el.textContent = val;
  });

  /* Placeholder */
  document.querySelectorAll('[data-i18n-ph]').forEach(el => {
    const val = t(el.dataset.i18nPh);
    if (val !== undefined) el.placeholder = val;
  });

  /* Title attribute */
  document.querySelectorAll('[data-i18n-title]').forEach(el => {
    const val = t(el.dataset.i18nTitle);
    if (val !== undefined) el.title = val;
  });

  /* Language toggle buttons */
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.lang === lang);
  });

  /* Chatbot chip data-msg (text synced to i18n) */
  document.querySelectorAll('.chat-chip[data-msg-key]').forEach(chip => {
    const key = `chat.${chip.dataset.msgKey}`;
    chip.textContent = t(key);
  });
}

/* ─────────────────────────────────────────────
   INIT
   ───────────────────────────────────────────── */
document.getElementById('year').textContent = new Date().getFullYear();

/* Populate vehicle year select */
(function populateYears() {
  const sel = document.getElementById('anio_vehiculo');
  const now = new Date().getFullYear();
  for (let y = now; y >= 2000; y--) {
    const opt = document.createElement('option');
    opt.value = y;
    opt.textContent = y;
    sel.appendChild(opt);
  }
})();

/* Apply saved language */
setLanguage(currentLang);

/* Language switcher clicks */
document.querySelectorAll('.lang-btn').forEach(btn => {
  btn.addEventListener('click', () => setLanguage(btn.dataset.lang));
});

/* ─────────────────────────────────────────────
   COTIZADOR — multi-step
   ───────────────────────────────────────────── */
let selectedType = null;

function showStep(n) {
  [1, 2, 3].forEach(s => {
    document.getElementById(`step-${s}`).classList.add('hidden');
    const tab = document.querySelector(`.step-tab[data-step="${s}"]`);
    tab.classList.remove('active', 'done');
    if (s < n) tab.classList.add('done');
    if (s === n) tab.classList.add('active');
  });
  document.getElementById(`step-${n}`).classList.remove('hidden');
}

/* Insurance card selection */
document.querySelectorAll('.insurance-card').forEach(card => {
  card.addEventListener('click', () => {
    document.querySelectorAll('.insurance-card').forEach(c => c.classList.remove('selected'));
    card.classList.add('selected');
    card.querySelector('input[type="radio"]').checked = true;
    selectedType = card.dataset.type;

    document.querySelectorAll('.extra-fields').forEach(f => f.classList.add('hidden'));
    const target = document.getElementById(`fields-${selectedType}`);
    if (target) target.classList.remove('hidden');

    document.getElementById('btn-step1-next').disabled = false;
  });
});

document.getElementById('btn-step1-next').addEventListener('click', () => {
  if (selectedType) { showStep(2); checkStep2(); }
});

/* Step 2 validation */
const reqFields = ['nombre', 'apellido', 'cedula', 'telefono'];

function checkStep2() {
  const ok = reqFields.every(id => document.getElementById(id).value.trim() !== '');
  const checked = document.getElementById('acepto_terminos').checked;
  document.getElementById('btn-step2-next').disabled = !(ok && checked);
}

reqFields.forEach(id => document.getElementById(id).addEventListener('input', checkStep2));
document.getElementById('acepto_terminos').addEventListener('change', checkStep2);

document.getElementById('btn-step2-back').addEventListener('click', () => showStep(1));

document.getElementById('btn-step2-next').addEventListener('click', () => {
  showStep(3);
  runSimulation();
});

/* Restart */
document.getElementById('btn-restart').addEventListener('click', () => {
  document.querySelectorAll('.insurance-card').forEach(c => c.classList.remove('selected'));
  document.querySelectorAll('input[name="tipo_seguro"]').forEach(r => r.checked = false);
  document.querySelectorAll('.extra-fields').forEach(f => f.classList.add('hidden'));
  reqFields.forEach(id => (document.getElementById(id).value = ''));
  ['email', 'estado'].forEach(id => (document.getElementById(id).value = ''));
  document.getElementById('acepto_terminos').checked = false;
  document.getElementById('result-loading').classList.remove('hidden');
  document.getElementById('result-content').classList.add('hidden');
  document.getElementById('btn-step2-next').disabled = true;
  document.getElementById('btn-step1-next').disabled = true;
  selectedType = null;
  showStep(1);
});

/* Quote simulation */
function runSimulation() {
  document.getElementById('result-loading').classList.remove('hidden');
  document.getElementById('result-content').classList.add('hidden');

  setTimeout(() => {
    const base    = BASE_PREMIUM[selectedType] || 300;
    const jitter  = (Math.random() * 0.3 - 0.1);
    const annual  = Math.round(base * (1 + jitter));
    const monthly = (annual / 12).toFixed(2);

    const nombre   = document.getElementById('nombre').value.trim();
    const apellido = document.getElementById('apellido').value.trim();
    const cedTipo  = document.getElementById('cedula_tipo').value;
    const cedNum   = document.getElementById('cedula').value.trim();
    const telefono = document.getElementById('telefono').value.trim();
    const estado   = document.getElementById('estado').value || '—';

    document.getElementById('res-tipo').textContent        = INSURANCE_LABELS[selectedType][currentLang];
    document.getElementById('res-prima-anual').textContent = `$ ${annual.toLocaleString()}`;
    document.getElementById('res-prima-mensual').textContent = `$ ${monthly}`;
    document.getElementById('res-titular').textContent    = `${nombre} ${apellido} (${cedTipo}-${cedNum})`;
    document.getElementById('res-telefono').textContent   = telefono;
    document.getElementById('res-estado').textContent     = estado;

    document.getElementById('result-loading').classList.add('hidden');
    document.getElementById('result-content').classList.remove('hidden');
  }, 1800);
}

/* WhatsApp button */
document.querySelector('.whatsapp-btn').addEventListener('click', () => {
  const nombre = document.getElementById('nombre').value.trim();
  const tipo   = INSURANCE_LABELS[selectedType]?.[currentLang] || '';
  const msg = currentLang === 'es'
    ? `Hola Sefired, soy ${nombre} y me interesa obtener más información sobre: ${tipo}.`
    : `Hello Sefired, I'm ${nombre} and I'm interested in: ${tipo}.`;
  window.open(`https://wa.me/58?text=${encodeURIComponent(msg)}`, '_blank');
});

/* ─────────────────────────────────────────────
   CHATBOT
   ───────────────────────────────────────────── */
const chatbotBtn   = document.getElementById('chatbot-btn');
const chatbotPanel = document.getElementById('chatbot-panel');
const chatMessages = document.getElementById('chat-messages');
const chatInput    = document.getElementById('chat-input');
const chatSend     = document.getElementById('chat-send');
const chatbotBadge = document.querySelector('.chatbot-badge');

const BOT_RESPONSES = {
  es: [
    {
      triggers: ['cotizar', 'cotizacion', 'cotización', 'precio', 'costo', 'quote'],
      reply: 'Puedes usar nuestro <a href="#cotizador" class="underline font-semibold" onclick="closeChat()">simulador de cotización</a> que está en la página. ¡Es gratuito y rápido! 😊',
    },
    {
      triggers: ['seguro', 'seguros', 'ofrecen', 'tipos', 'poliza', 'póliza'],
      reply: 'En Sefired ofrecemos: 🚗 Vehículos, 🏠 Hogar, ❤️ Vida, 🏥 HCM/Salud, 🏢 Empresarial y 📋 Fianzas.',
    },
    {
      triggers: ['asesor', 'hablar', 'contacto', 'whatsapp', 'llamar', 'humano'],
      reply: 'Con gusto te conectamos con un asesor. Escríbenos al WhatsApp o usa el botón "Hablar con asesor" al final de la cotización. 📞',
    },
    {
      triggers: ['hola', 'buenas', 'buenos', 'buen', 'hello', 'hi'],
      reply: '¡Hola! 👋 Bienvenido/a a Sefired. ¿En qué te puedo ayudar hoy?',
    },
    {
      triggers: ['gracias', 'perfecto', 'genial', 'excelente', 'thanks'],
      reply: '¡Con mucho gusto! Estamos para servirte. 😊 ¿Necesitas algo más?',
    },
  ],
  en: [
    {
      triggers: ['quote', 'quotation', 'price', 'cost', 'cotizar'],
      reply: 'Use our <a href="#cotizador" class="underline font-semibold" onclick="closeChat()">quote simulator</a> on this page. It\'s free and instant! 😊',
    },
    {
      triggers: ['insurance', 'offer', 'types', 'policy', 'policies', 'coverage'],
      reply: 'At Sefired we offer: 🚗 Vehicle, 🏠 Home, ❤️ Life, 🏥 Health/HMO, 🏢 Business and 📋 Bonds.',
    },
    {
      triggers: ['advisor', 'agent', 'human', 'contact', 'whatsapp', 'call', 'speak'],
      reply: "We'd love to connect you with an advisor! Use WhatsApp or the 'Contact Advisor' button at the end of the quote. 📞",
    },
    {
      triggers: ['hello', 'hi', 'hey', 'good'],
      reply: 'Hello! 👋 Welcome to Sefired. How can I help you today?',
    },
    {
      triggers: ['thanks', 'thank', 'great', 'perfect', 'excellent'],
      reply: "You're welcome! We're here to help. 😊 Is there anything else I can do for you?",
    },
  ]
};

const DEFAULT_REPLY = {
  es: 'Entendido. Un asesor de Sefired estará disponible pronto. También puedes usar el <a href="#cotizador" class="underline font-semibold" onclick="closeChat()">simulador</a> para una cotización inmediata.',
  en: 'Understood. A Sefired advisor will be available shortly. You can also use our <a href="#cotizador" class="underline font-semibold" onclick="closeChat()">quote simulator</a> right now.',
};

window.closeChat = function() {
  chatbotPanel.classList.add('hidden');
};

function getBotReply(text) {
  const lower = text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const responses = BOT_RESPONSES[currentLang] || BOT_RESPONSES.es;
  for (const item of responses) {
    if (item.triggers.some(trigger => lower.includes(trigger))) return item.reply;
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
  addMessage(text, 'user');
  chatInput.value = '';

  const typing = document.createElement('div');
  typing.className = 'chat-msg bot';
  typing.innerHTML = '<span style="letter-spacing:3px;opacity:0.5">●●●</span>';
  chatMessages.appendChild(typing);
  chatMessages.scrollTop = chatMessages.scrollHeight;

  setTimeout(() => {
    typing.remove();
    addMessage(getBotReply(text), 'bot');
  }, 750 + Math.random() * 600);
}

chatbotBtn.addEventListener('click', () => {
  const isHidden = chatbotPanel.classList.contains('hidden');
  chatbotPanel.classList.toggle('hidden', !isHidden);
  if (isHidden) {
    chatbotBadge.style.display = 'none';
    setTimeout(() => chatInput.focus(), 200);
  }
});

document.getElementById('chatbot-close').addEventListener('click', () => {
  chatbotPanel.classList.add('hidden');
});

chatSend.addEventListener('click', handleSend);
chatInput.addEventListener('keydown', e => { if (e.key === 'Enter') handleSend(); });

/* Suggestion chips */
document.querySelectorAll('.chat-chip').forEach(chip => {
  chip.addEventListener('click', () => {
    const text = chip.textContent.trim();
    addMessage(text, 'user');
    chip.closest('.chat-suggestions')?.remove();
    setTimeout(() => addMessage(getBotReply(text), 'bot'), 750);
  });
});
