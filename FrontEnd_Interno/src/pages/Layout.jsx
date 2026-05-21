import { useState } from 'react'
import { useApp } from '../context/AppContext.jsx'
import Sidebar from '../layout/Sidebar.jsx'
import Header from '../layout/Header.jsx'
import Modal from '../components/Modal.jsx'
import Toast from '../components/Toast.jsx'
import PdfViewer from '../components/PdfViewer.jsx'
import Home from './Home.jsx'
import Productos from './Productos.jsx'
import Clientes from './Clientes.jsx'
import Vehiculos from './Vehiculos.jsx'
import Simulador from './Simulador.jsx'
import Reportes from './Reportes.jsx'
import Tasas from './Tasas.jsx'
import Usuarios from './Usuarios.jsx'
import Configuracion from './Configuracion.jsx'

const PAGE_MAP = {
  'home':          Home,
  'cat-productos': Productos,
  'cli-cliente':   Clientes,
  'cli-vehiculo':  Vehiculos,
  'cot-simulador': Simulador,
  'rep-menu':      Reportes,
  'tas-registro':  Tasas,
  'usr-lista':     Usuarios,
  'conf-menu':     Configuracion,
}

export default function Layout() {
  const { currentView } = useApp()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const PageComponent = PAGE_MAP[currentView] ?? (() => (
    <div className="card p-8 text-center text-slate-400">Vista en construcción: {currentView}</div>
  ))

  return (
    <div className="min-h-screen bg-sefired-light flex">
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
          <PageComponent />
        </main>
      </div>

      {/* Overlays */}
      <Modal />
      <Toast />
      <PdfViewer />
    </div>
  )
}
