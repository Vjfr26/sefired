import { createContext, useContext, useState, useCallback, useRef } from 'react'
import { NAV, VIEW_META } from '../utils/helpers.jsx'

const AppContext = createContext(null)

export function useApp() {
  return useContext(AppContext)
}

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

export function AppProvider({ children, onLogout }) {
  const [currentView, setCurrentView]   = useState('home')
  const [activeNavId, setActiveNavId]   = useState('home')
  const [modal, setModal]               = useState(null)
  const [toasts, setToasts]             = useState([])
  const [pdfViewer, setPdfViewer]       = useState(null)
  const [simState, setSimState]         = useState(INITIAL_SIM_STATE)
  const [simStep, setSimStep]           = useState(1)
  const toastId = useRef(0)

  const navigateTo = useCallback((viewId) => {
    const meta = VIEW_META[viewId]
    if (meta?.navId) setActiveNavId(meta.navId)
    setCurrentView(viewId)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  const showToast = useCallback((message, type = 'info') => {
    const id = ++toastId.current
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500)
  }, [])

  const showModal = useCallback((type, props = {}) => {
    setModal({ type, props })
  }, [])

  const closeModal = useCallback(() => {
    setModal(null)
  }, [])

  const showPdfViewer = useCallback((title, pagesHtml) => {
    setPdfViewer({ title, pagesHtml })
  }, [])

  const closePdfViewer = useCallback(() => {
    setPdfViewer(null)
  }, [])

  const resetSimState = useCallback(() => {
    setSimState({
      ...INITIAL_SIM_STATE,
      coberturas: Object.fromEntries(
        Object.entries(INITIAL_SIM_STATE.coberturas).map(([k, v]) => [k, { ...v, chk: v.req }])
      ),
    })
    setSimStep(1)
  }, [])

  const updateSimState = useCallback((updates) => {
    setSimState(prev => ({ ...prev, ...updates }))
  }, [])

  const updateSimCoverage = useCallback((cod, chk) => {
    setSimState(prev => ({
      ...prev,
      coberturas: {
        ...prev.coberturas,
        [cod]: { ...prev.coberturas[cod], chk },
      },
    }))
  }, [])

  const value = {
    currentView, activeNavId,
    modal, toasts, pdfViewer,
    simState, simStep, setSimStep,
    navigateTo,
    showToast, showModal, closeModal,
    showPdfViewer, closePdfViewer,
    resetSimState, updateSimState, updateSimCoverage,
    onLogout,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}
