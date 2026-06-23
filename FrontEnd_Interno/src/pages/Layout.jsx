import { useState, lazy, Suspense } from 'react'
import { useApp } from '../context/AppContext.jsx'
import Sidebar from '../layout/Sidebar.jsx'
import Header from '../layout/Header.jsx'
import Modal from '../components/Modal.jsx'
import Toast from '../components/Toast.jsx'
import PdfViewer from '../components/PdfViewer.jsx'
import ErrorBoundary from '../components/ErrorBoundary.jsx'
import { SkeletonPage } from '../components/Skeleton.jsx'

const PAGE_MAP = {
  'home':          lazy(() => import('./Home.jsx')),
  'cat-productos': lazy(() => import('./Productos.jsx')),
  'cat-vehiculos': lazy(() => import('./VehiculosCatalogo.jsx')),
  'cli-cliente':   lazy(() => import('./Clientes.jsx')),
  'cli-vehiculo':  lazy(() => import('./Vehiculos.jsx')),
  'cot-simulador': lazy(() => import('./Simulador.jsx')),
  'rep-menu':      lazy(() => import('./Reportes.jsx')),
  'tas-registro':  lazy(() => import('./Tasas.jsx')),
  'usr-lista':     lazy(() => import('./Usuarios.jsx')),
  'conf-menu':     lazy(() => import('./Configuracion.jsx')),
  'renovaciones':  lazy(() => import('./Renovaciones.jsx')),
}

const PageSpinner = () => <SkeletonPage />

export default function Layout() {
  const { currentView, navigateTo } = useApp()
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
          <ErrorBoundary key={currentView} onReset={() => navigateTo('home')}>
            <Suspense fallback={<PageSpinner />}>
              {PageComponent
                ? <PageComponent />
                : <div className="card p-8 text-center text-slate-400">Vista en construcción: {currentView}</div>
              }
            </Suspense>
          </ErrorBoundary>
        </main>
      </div>

      {/* Overlays */}
      <Modal />
      <Toast />
      <PdfViewer />
    </div>
  )
}
