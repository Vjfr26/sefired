import { Component } from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'

/**
 * Atrapa errores de render en la página activa para que un bug en UN
 * componente no deje toda la app en blanco. Sin esto, cualquier excepción
 * no controlada durante el render desmonta el árbol entero de React.
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('Error de render atrapado por ErrorBoundary:', error, info)
  }

  render() {
    if (!this.state.error) return this.props.children

    return (
      <div className="card p-8 sm:p-12 flex flex-col items-center text-center gap-4 max-w-lg mx-auto mt-6">
        <div className="w-14 h-14 rounded-2xl bg-rose-100 flex items-center justify-center">
          <AlertTriangle className="w-7 h-7 text-rose-600" />
        </div>
        <div>
          <p className="font-bold text-slate-800 mb-1">Ocurrió un error al mostrar esta sección</p>
          <p className="text-sm text-slate-500">
            No se perdieron tus datos. Puedes intentar recargar la página o volver al inicio.
          </p>
        </div>
        <div className="flex gap-2 mt-2">
          <button onClick={() => window.location.reload()} className="btn-primary">
            <RefreshCw className="w-4 h-4" /> Recargar página
          </button>
          <button onClick={() => { this.setState({ error: null }); this.props.onReset?.() }} className="btn-secondary">
            <Home className="w-4 h-4" /> Volver al inicio
          </button>
        </div>
      </div>
    )
  }
}
