/**
 * AppContext — Estado global de la aplicación.
 *
 * Centraliza todo lo que necesitan múltiples pantallas al mismo tiempo:
 *   - Qué vista está activa (navegación)
 *   - El modal que está abierto (si hay alguno)
 *   - Los mensajes de notificación (toasts)
 *   - El visor de PDF cuando se genera un documento
 *   - El estado del simulador de cotizaciones
 *   - Las tasas BCV actuales (USD y EUR)
 *
 * Cualquier componente puede acceder a este estado usando el hook useApp().
 * Solo el AppProvider (renderizado una vez en App.jsx) guarda y modifica el estado.
 */

import { createContext, useContext, useState, useCallback, useRef, useEffect, useMemo } from 'react'
import { NAV, VIEW_META, getEffectivePerms, canAct as canActHelper } from '../utils/helpers.jsx'
import { fetchTasas } from '../api/tasas.js'
import { API_BASE_URL } from '../config.js'

function getUserFromStorage() {
  try {
    const raw = localStorage.getItem('user')
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

const AppContext = createContext(null)

/** Hook de acceso. Llama esto en cualquier componente para usar el estado global. */
export function useApp() {
  return useContext(AppContext)
}

/**
 * Estado inicial del simulador de cotizaciones.
 * Contiene los datos del vehículo, del tomador y la lista de coberturas
 * con sus primas y si están activadas o no.
 *
 * RC-OBL (Responsabilidad Civil Obligatoria) siempre está marcada porque
 * la ley SUDEASEG exige que todo vehículo asegurado la incluya.
 */
const INITIAL_SIM_STATE = {
  tipo: 'particular',
  placa: '', marca: 'Toyota', modelo: '', año: '2022', color: '', uso: 'Particular', valor: 15000,
  nombre: '', ci: '', tel: '', email: '',
  coberturas: {
    'CASCO-PT': { nom: 'Casco Pérdida Total',     prima: 270,  tasa: '1.80% del valor',   chk: false, req: false, desc: 'Pérdida total irrecuperable del vehículo' },
    'CASCO-PP': { nom: 'Casco Pérdida Parcial',   prima: 120,  tasa: '0.80% del valor',   chk: false, req: false, desc: 'Daños físicos reparables al vehículo' },
    'ROBO':     { nom: 'Robo y Hurto',            prima: 90,   tasa: '0.60% del valor',   chk: false, req: false, desc: 'Robo total o parcial del vehículo' },
    'AP':       { nom: 'Acc. Personales',         prima: 48,   tasa: '$12.00/ocupante',   chk: false, req: false, desc: '4 ocupantes · $10,000 c/u suma asegurada' },
    'RC-OBL':   { nom: 'RC Obligatoria',          prima: 4.50, tasa: 'UT × Factor',       chk: true,  req: true,  desc: 'Obligatoria por Ley SUDEASEG' },
    'RCV':      { nom: 'RC Voluntaria',           prima: 45,   tasa: '0.15% de suma',     chk: false, req: false, desc: 'Responsabilidad civil voluntaria ampliada' },
    'ASIST':    { nom: 'Asistencia en Carretera', prima: 8,    tasa: 'Tarifa fija anual',  chk: false, req: false, desc: 'Grúa, batería, llantas y emergencias viales' },
  },
}

/**
 * Proveedor de estado global. Envuelve toda la aplicación (ver App.jsx).
 *
 * @param {Function} onLogout  Función que se llama cuando el usuario cierra sesión.
 *                             Mueve la app de vuelta a la pantalla de Login.
 */
export function AppProvider({ children, onLogout }) {
  // ── Navegación ──────────────────────────────────────────────────────────────
  // currentView: identificador de la vista activa (ej. 'cli-cliente', 'tas-registro')
  // activeNavId: identificador del ítem resaltado en el sidebar (ej. 'clientes', 'tasas')
  // No siempre coinciden: al navegar a una subvista el sidebar resalta la sección padre.
  // Se persisten en localStorage para sobrevivir recargas de página.
  const [currentView, setCurrentView]   = useState(() => localStorage.getItem('nav_view') || 'home')
  const [activeNavId, setActiveNavId]   = useState(() => localStorage.getItem('nav_id')   || 'home')

  // ── Modal y notificaciones ───────────────────────────────────────────────────
  // modalStack: pila de modales abiertos ({ type, props } cada uno). Antes
  // era un único valor que showModal() reemplazaba sin memoria — si un
  // modal abría un segundo modal encima, cerrar el segundo con la X cerraba
  // TODO en vez de volver a mostrar el primero. Con la pila, closeModal()
  // solo quita el de arriba y revela el anterior automáticamente.
  // toasts: lista de notificaciones activas. Se van eliminando solos a los 3.5 s.
  const [modalStack, setModalStack]     = useState([])
  const [toasts, setToasts]             = useState([])

  // ── Visor de PDF ─────────────────────────────────────────────────────────────
  // pdfViewer: null si no hay PDF abierto, o { title, pagesHtml } cuando sí hay.
  const [pdfViewer, setPdfViewer]       = useState(null)

  // ── Simulador de cotizaciones ────────────────────────────────────────────────
  // simState: todos los datos del formulario del simulador
  // simStep: paso actual del asistente (1 = vehículo, 2 = coberturas, 3 = resumen…)
  const [simState, setSimState]         = useState(INITIAL_SIM_STATE)
  const [simStep, setSimStep]           = useState(1)

  // ── Usuario actual + permisos efectivos ─────────────────────────────────────
  const [currentUser, setCurrentUser]   = useState(getUserFromStorage)

  // Permisos efectivos: los del BD si están, si no los del rol por defecto.
  // Se recalcula cada vez que cambia currentUser (login, refresh, cambio de rol).
  const userPerms = useMemo(() => getEffectivePerms(currentUser), [currentUser])

  // ── Tasas BCV ────────────────────────────────────────────────────────────────
  // Cargadas al inicio desde el backend y usadas en el sidebar y en los cálculos en Bs.
  const [tasas, setTasas]               = useState({ usd: null, eur: null })

  // Contador incremental para generar IDs únicos a cada toast.
  // Se usa useRef para no provocar re-renders al incrementar.
  const toastId = useRef(0)

  // ── Usuario: carga y refresco en tiempo real ─────────────────────────────────
  const refreshUser = useCallback(async () => {
    try {
      const token = localStorage.getItem('auth_token')
      if (!token) return
      const res = await fetch(`${API_BASE_URL}/api/usuario`, {
        headers: { 'Accept': 'application/json', 'Authorization': `Bearer ${token}` }
      })
      // Token expirado o inválido → forzar logout inmediato
      if (res.status === 401) {
        localStorage.removeItem('auth_token')
        localStorage.removeItem('user')
        onLogout?.()
        return
      }
      if (!res.ok) return
      const json = await res.json()
      if (json.data) {
        const user = {
          nombre:   json.data.nombre,
          nick:     json.data.nick,
          cargo:    json.data.cargo,
          sede:     json.data.sede,
          genero:   json.data.genero,
          tipo:     json.data.tipo,
          permisos: json.data.permisos ?? null,
        }
        setCurrentUser(user)
        localStorage.setItem('user', JSON.stringify(user))
      }
    } catch {
      // Si el backend no responde, se mantienen los datos del localStorage.
    }
  }, [onLogout])

  // Refresca el perfil al iniciar y luego cada 30 segundos.
  useEffect(() => {
    refreshUser()
    const id = setInterval(refreshUser, 30_000)
    return () => clearInterval(id)
  }, [refreshUser])

  // ── Tasas: carga automática al iniciar ───────────────────────────────────────
  const refreshTasas = useCallback(async () => {
    try {
      const json = await fetchTasas()
      setTasas({ usd: json.usd, eur: json.eur })
    } catch {
      // Si el backend no está disponible simplemente no se muestran las tasas.
      // El sidebar muestra '—' en su lugar.
    }
  }, [])

  // Se dispara una sola vez al montar la app para tener las tasas desde el inicio.
  useEffect(() => { refreshTasas() }, [refreshTasas])

  // ── Navegación ────────────────────────────────────────────────────────────────
  /**
   * Cambia la vista activa. Actualiza tanto la vista como el ítem del sidebar.
   * Hace scroll al tope para que la nueva pantalla empiece desde arriba.
   */
  const navigateTo = useCallback((viewId) => {
    const meta = VIEW_META[viewId]
    const navId = meta?.navId
    // Si la sección no está en los permisos efectivos, redirigir a inicio silenciosamente
    const navItem = NAV.find(item => item.id === navId)
    const requiredPerm = navItem ? (navItem.permId || navItem.id) : navId
    if (navId && navId !== 'home' && !userPerms.includes(requiredPerm)) {
      setActiveNavId('home')
      setCurrentView('home')
      localStorage.setItem('nav_view', 'home')
      localStorage.setItem('nav_id',   'home')
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    const resolvedNavId = navId || 'home'
    setActiveNavId(resolvedNavId)
    setCurrentView(viewId)
    localStorage.setItem('nav_view', viewId)
    localStorage.setItem('nav_id',   resolvedNavId)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [userPerms])

  // ── Notificaciones (toasts) ───────────────────────────────────────────────────
  /**
   * Muestra una notificación durante 3.5 segundos.
   * @param {string} message  Texto del mensaje
   * @param {'info'|'success'|'error'|'warning'} type  Color del toast
   */
  const showToast = useCallback((message, type = 'info') => {
    const id = ++toastId.current
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500)
  }, [])

  // ── Modal ────────────────────────────────────────────────────────────────────
  /**
   * Abre un modal. El tipo determina qué componente se muestra (ver Modal.jsx).
   * @param {string} type   Tipo de modal: 'editForm', 'confirmDelete', 'clienteDetail', etc.
   * @param {Object} props  Datos que recibe el modal (campos, callbacks, etc.)
   */
  const showModal = useCallback((type, props = {}) => {
    setModalStack(stack => [...stack, { type, props }])
  }, [])

  /** Cierra el modal activo. Si había uno debajo en la pila (lo abrió ese
   * modal), vuelve a mostrarlo — "ir atrás" en vez de cerrar todo. */
  const closeModal = useCallback(() => {
    setModalStack(stack => stack.slice(0, -1))
  }, [])

  /** Cierra TODA la pila de modales de una vez (ej. tras terminar un flujo completo). */
  const closeAllModals = useCallback(() => {
    setModalStack([])
  }, [])

  // ── Visor de PDF ──────────────────────────────────────────────────────────────
  /**
   * Abre el visor de PDF con el HTML del documento ya generado.
   * @param {string} title      Título que aparece en la barra del visor
   * @param {string} pagesHtml  HTML completo de la página (generado con pdfPage() de helpers)
   */
  const showPdfViewer = useCallback((title, pagesHtml) => {
    setPdfViewer({ title, pagesHtml })
  }, [])

  /** Cierra el visor de PDF. */
  const closePdfViewer = useCallback(() => {
    setPdfViewer(null)
  }, [])

  // ── Simulador ────────────────────────────────────────────────────────────────
  /**
   * Resetea el simulador al estado inicial.
   * Las coberturas requeridas (RC-OBL) quedan marcadas; las opcionales se desactivan.
   */
  const resetSimState = useCallback(() => {
    setSimState({
      ...INITIAL_SIM_STATE,
      coberturas: Object.fromEntries(
        Object.entries(INITIAL_SIM_STATE.coberturas).map(([k, v]) => [k, { ...v, chk: v.req }])
      ),
    })
    setSimStep(1)
  }, [])

  /**
   * Actualiza campos del formulario del simulador (vehículo, tomador).
   * @param {Object} updates  Objeto con los campos a actualizar (merge parcial)
   */
  const updateSimState = useCallback((updates) => {
    setSimState(prev => ({ ...prev, ...updates }))
  }, [])

  /**
   * Activa o desactiva una cobertura específica del simulador.
   * @param {string}  cod  Código de la cobertura (ej. 'CASCO-PT', 'RCV')
   * @param {boolean} chk  true = incluida en la cotización
   */
  const updateSimCoverage = useCallback((cod, chk) => {
    setSimState(prev => ({
      ...prev,
      coberturas: {
        ...prev.coberturas,
        [cod]: { ...prev.coberturas[cod], chk },
      },
    }))
  }, [])

  const handleLogout = useCallback(async () => {
    const token = localStorage.getItem('auth_token')
    if (token) {
      try {
        const res = await fetch(`${API_BASE_URL}/api/logout`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' },
        })
        if (!res.ok) console.error('[logout] backend returned', res.status)
      } catch (err) {
        console.error('[logout] network error', err)
      }
    }
    localStorage.removeItem('auth_token')
    localStorage.removeItem('user')
    localStorage.removeItem('nav_view')
    localStorage.removeItem('nav_id')
    onLogout?.()
  }, [onLogout])

  // Comprueba si el usuario actual puede realizar una acción en un módulo.
  const canAct = useCallback(
    (moduleId, action = 'view') => canActHelper(currentUser, moduleId, action),
    [currentUser]
  )

  // Todos los valores y funciones que estarán disponibles para los componentes hijos.
  const value = {
    currentView, activeNavId,
    modal: modalStack[modalStack.length - 1] ?? null, modalStack, toasts, pdfViewer,
    simState, simStep, setSimStep,
    tasas, refreshTasas,
    currentUser, refreshUser, userPerms, canAct,
    navigateTo,
    showToast, showModal, closeModal, closeAllModals,
    showPdfViewer, closePdfViewer,
    resetSimState, updateSimState, updateSimCoverage,
    onLogout: handleLogout,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}
