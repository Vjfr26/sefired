import { useState, lazy, Suspense } from 'react'
import { useApp } from '../context/AppContext.jsx'
import Sidebar from '../layout/Sidebar.jsx'
import Header from '../layout/Header.jsx'
import Modal from '../components/Modal.jsx'
import Toast from '../components/Toast.jsx'
import PdfViewer from '../components/PdfViewer.jsx'

const PAGE_MAP = {
  'home':          lazy(() => import('./Home.jsx')),
  'cat-productos': lazy(() => import('./Productos.jsx')),
  'cli-cliente':   lazy(() => import('./Clientes.jsx')),
  'cli-vehiculo':  lazy(() => import('./Vehiculos.jsx')),
  'cot-simulador': lazy(() => import('./Simulador.jsx')),
  'rep-menu':      lazy(() => import('./Reportes.jsx')),
  'tas-registro':  lazy(() => import('./Tasas.jsx')),
  'usr-lista':     lazy(() => import('./Usuarios.jsx')),
  'conf-menu':     lazy(() => import('./Configuracion.jsx')),
  'renovaciones':  lazy(() => import('./Renovaciones.jsx')),
}

const PageSpinner = () => (
  <div className="flex justify-center items-center py-16 text-slate-400 text-sm gap-2">
    <div className="w-4 h-4 border-2 border-slate-300 border-t-jm-blue rounded-full animate-spin" />
  </div>
)

export default function Layout() {
  const { currentView } = useApp()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const PageComponent = PAGE_MAP[currentView]

  return (
    <div className="min-h-screen bg-jm-light flex">
      {/* Sidebar overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <Sidebar sidebarOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main content */}
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        <Header onSidebarOpen={() => setSidebarOpen(true)} />
        <main className="flex-1 px-4 sm:px-8 lg:px-12 py-6 sm:py-8">
          <Suspense fallback={<PageSpinner />}>
            {PageComponent
              ? <PageComponent />
              : <div className="card p-8 text-center text-slate-400">Vista en construcción: {currentView}</div>
            }
          </Suspense>
        </main>
      </div>

      {/* Overlays */}
      <Modal />
      <Toast />
      <PdfViewer />
    </div>
  )
}
