import { useState } from 'react'
import { Pencil, RefreshCw, Trash2, Printer, UserPlus } from 'lucide-react'
import { useApp } from '../context/AppContext.jsx'
import { rsbadge, usd, pdfPage, pdfHdr, pdfSec, pdfRow, pdfTotal, pdfFooter } from '../utils/helpers.jsx'
import SearchBar from '../components/SearchBar.jsx'
import DataTable from '../components/DataTable.jsx'

const clients = [
  { id: 'CLI-0001', nom: 'Carlos Eduardo Rodríguez García', ci: 'V-12.345.678', tel: '+58 414-123-4567', email: 'c.rodriguez@gmail.com', est: 'Activo', pol: 'SEF-2026-VEH-00848', vig: '03/05/2026 – 03/05/2027', prima: '$622.70' },
  { id: 'CLI-0002', nom: 'María Alejandra González Pérez',  ci: 'V-11.234.567', tel: '+58 424-234-5678', email: 'm.gonzalez@gmail.com',  est: 'Activo', pol: 'SEF-2026-VEH-00847', vig: '01/05/2026 – 01/05/2027', prima: '$784.20' },
  { id: 'CLI-0003', nom: 'José Luis Martínez Hernández',    ci: 'V-10.345.678', tel: '+58 416-345-6789', email: 'j.martinez@hotmail.com', est: 'Activo', pol: 'SEF-2026-VEH-00846', vig: '30/04/2026 – 30/04/2027', prima: '$1,240.00' },
  { id: 'CLI-0004', nom: 'Ana Carolina López Ramírez',      ci: 'V-13.456.789', tel: '+58 412-456-7890', email: 'a.lopez@outlook.com',    est: 'Activo', pol: 'SEF-2026-VEH-00845', vig: '29/04/2026 – 29/04/2027', prima: '$540.00' },
  { id: 'CLI-0005', nom: 'Pedro Antonio Díaz Morales',      ci: 'J-30.567.890', tel: '+58 414-567-8901', email: 'pdiaz@empresa.com',       est: 'Activo', pol: 'SEF-2025-VEH-00780', vig: '28/04/2025 – 28/04/2026', prima: '$487.00' },
  { id: 'CLI-0006', nom: 'Sofía Isabel Torres Vargas',      ci: 'V-14.678.901', tel: '+58 424-678-9012', email: 's.torres@gmail.com',      est: 'Inactivo', pol: '—', vig: '—', prima: '—' },
  { id: 'CLI-0007', nom: 'Luis Fernando Castillo Medina',   ci: 'J-20.789.012', tel: '+58 416-789-0123', email: 'lcastillo@corp.com',      est: 'Activo', pol: 'SEF-2026-VEH-00844', vig: '28/04/2026 – 28/04/2027', prima: '$620.80' },
  { id: 'CLI-0008', nom: 'Valentina Beatriz Ramos Soto',    ci: 'V-15.890.123', tel: '+58 412-890-1234', email: 'v.ramos@gmail.com',       est: 'Activo', pol: 'SEF-2026-VEH-00843', vig: '27/04/2026 – 27/04/2027', prima: '$555.00' },
]

const COLS = [
  { k: 'id',  l: 'ID',             m: true, hide: 'lg' },
  { k: 'nom', l: 'Nombre Completo', tr: true },
  { k: 'ci',  l: 'CI / RIF',       m: true, hide: 'sm' },
  { k: 'tel', l: 'Teléfono',        hide: 'md' },
  { k: 'email',l: 'Email',          hide: 'lg', tr: true },
  { k: 'est', l: 'Estado' },
  { k: 'acc', l: '',               acc: true },
]

export default function Clientes() {
  const { showModal, showPdfViewer, showToast } = useApp()
  const [search, setSearch] = useState('')

  const handlePrintClientes = () => {
    const tableRows = clients.map(c =>
      pdfRow(c.nom, c.prima === '—' ? 'Sin póliza' : c.prima)
    ).join('')
    const html = pdfPage(
      pdfHdr('LISTADO DE CLIENTES', 'Clientes y Pólizas activas', '', new Date().toLocaleDateString('es-VE')) +
      pdfSec('CLIENTES REGISTRADOS') +
      tableRows +
      pdfFooter('Carlos Ruiz', 'Caracas Principal')
    )
    showPdfViewer('Listado de Clientes', html)
  }

  const filtered = search
    ? clients.filter(c => {
        const q = search.toLowerCase()
        return c.nom.toLowerCase().includes(q) || c.ci.toLowerCase().includes(q) || c.email.toLowerCase().includes(q)
      })
    : clients

  const dataRows = filtered.map(c => ({
    ...c,
    est: rsbadge(c.est),
    acc: (
      <div className="grid grid-cols-3 gap-1 items-center justify-center">
        <button
          onClick={() => showModal('editForm', {
            title: 'Editar Cliente',
            fields: [
              { label: 'Nombre completo', val: c.nom, span: true },
              { label: 'CI / RIF',        val: c.ci },
              { label: 'Teléfono',        val: c.tel },
              { label: 'Email',           val: c.email, span: true },
            ],
          })}
          className="p-1.5 sm:p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition inline-flex items-center justify-center"
          title="Editar"
        >
          <Pencil className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </button>
        <button
          onClick={() => showModal('renovar', { client: c })}
          className="p-1.5 sm:p-2 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition inline-flex items-center justify-center"
          title="Renovar"
        >
          <RefreshCw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </button>
        <button
          onClick={() => showModal('confirmDelete', { name: c.nom })}
          className="p-1.5 sm:p-2 rounded-lg bg-rose-50 text-rose-500 hover:bg-rose-100 transition inline-flex items-center justify-center"
          title="Eliminar"
        >
          <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </button>
      </div>
    ),
  }))

  return (
    <div>
      <SearchBar
        placeholder="Buscar por nombre, CI/RIF o email…"
        onSearch={setSearch}
        extra={
          <>
            <button onClick={handlePrintClientes} className="btn-secondary">
              <Printer className="w-4 h-4" />Imprimir
            </button>
            <button
              onClick={() => showModal('editForm', {
                title: 'Nuevo Cliente',
                fields: [
                  { label: 'Nombre completo', ph: 'Nombre Apellido', span: true },
                  { label: 'CI / RIF',        ph: 'V-00.000.000' },
                  { label: 'Teléfono',        ph: '+58 414-000-0000' },
                  { label: 'Email',           ph: 'correo@ejemplo.com', span: true },
                ],
              })}
              className="btn-primary ml-auto"
            >
              <UserPlus className="w-4 h-4" />Agregar Cliente
            </button>
          </>
        }
      />
      <DataTable cols={COLS} rows={dataRows} />
    </div>
  )
}
