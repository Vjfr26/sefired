import { Check } from 'lucide-react'
import FormGrid from './FormGrid.jsx'
import { useApp } from '../context/AppContext.jsx'

export default function FormCard({ fields, btn = 'Guardar', onAction, extra, toastMsg = 'Datos guardados', toastType = 'success' }) {
  const { showToast } = useApp()

  const handleClick = () => {
    if (onAction) onAction()
    else showToast(toastMsg, toastType)
  }

  return (
    <div className="card p-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
        <FormGrid fields={fields} />
      </div>
      {extra}
      <button onClick={handleClick} className="btn-primary mt-2 w-full sm:w-auto">
        <Check className="w-4 h-4" />{btn}
      </button>
    </div>
  )
}
