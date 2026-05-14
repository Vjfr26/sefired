import { X, Printer, Download } from 'lucide-react'
import { useApp } from '../context/AppContext.jsx'

export default function PdfViewer() {
  const { pdfViewer, closePdfViewer, showToast } = useApp()
  if (!pdfViewer) return null

  const { title, pagesHtml } = pdfViewer

  const handlePrint = () => {
    const w = window.open('', '_blank')
    w.document.write(`<!DOCTYPE html><html><head>
      <meta charset="UTF-8"><title>${title}</title>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
      <style>
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        body{font-family:'Inter',system-ui,sans-serif;background:#525659;padding:32px;display:flex;flex-direction:column;align-items:center;gap:32px}
        .pdf-page{background:white;width:210mm;min-height:297mm;padding:18mm 20mm;box-shadow:0 4px 24px rgba(0,0,0,.3)}
        @media print{body{background:white;padding:0}@page{size:A4;margin:0}.pdf-page{box-shadow:none;page-break-after:always}}
      </style>
    </head><body>${pagesHtml}<script>window.onload=function(){setTimeout(function(){window.print();},600)}<\/script></body></html>`)
    w.document.close()
  }

  return (
    <div className="fixed inset-0 z-[70] flex flex-col">
      {/* Toolbar */}
      <div className="bg-[#323639] text-white h-12 sm:h-14 flex items-center px-3 sm:px-5 gap-2 shrink-0 shadow-lg">
        <button onClick={closePdfViewer} className="p-2 hover:bg-white/10 rounded-lg transition shrink-0" title="Cerrar">
          <X className="w-4 h-4" />
        </button>
        <div className="flex-1 min-w-0 mx-1">
          <p className="text-sm font-semibold text-white truncate">{title}</p>
        </div>
        <button onClick={handlePrint} className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-sm transition shrink-0">
          <Printer className="w-4 h-4" />
          <span className="hidden sm:inline font-medium">Imprimir</span>
        </button>
        <button onClick={() => showToast('Descargando documento…', 'info')} className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-sm transition shrink-0">
          <Download className="w-4 h-4" />
          <span className="hidden sm:inline font-medium">Descargar</span>
        </button>
      </div>
      {/* Pages */}
      <div className="flex-1 overflow-auto bg-[#525659] p-4 sm:p-8">
        <div className="flex flex-col items-center gap-6" dangerouslySetInnerHTML={{ __html: pagesHtml }} />
      </div>
    </div>
  )
}
