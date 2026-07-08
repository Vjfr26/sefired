/**
 * PdfViewer — Visor de documentos PDF generados en el sistema.
 *
 * Se muestra como un modal centrado que no tapa toda la pantalla (máx. 90vh).
 * El usuario puede cerrar el visor haciendo clic en el fondo oscuro o en el botón X.
 *
 * ── Cómo funciona el "PDF" en este sistema ─────────────────────────────────
 * Los documentos no son archivos .pdf reales: son páginas HTML con estilos inline
 * diseñadas para verse como una hoja A4. Esto permite generarlos en el navegador
 * sin dependencias de librerías pesadas.
 *
 * Para imprimir, se abre una nueva ventana del navegador con el HTML del documento,
 * se le inyectan los estilos de impresión (@media print) y se llama window.print()
 * automáticamente. El resultado puede guardarse como PDF desde el diálogo del OS.
 *
 * ── Para abrir el visor desde cualquier página ──────────────────────────────
 *   const { showPdfViewer } = useApp()
 *   showPdfViewer('Nombre del documento', htmlDelDocumento)
 *
 * El HTML se construye con las funciones pdfPage(), pdfHdr(), pdfSec(), etc.
 * del archivo utils/helpers.jsx.
 */
import { useRef } from 'react'
import { X, Printer, Download } from 'lucide-react'
import { useApp } from '../context/AppContext.jsx'
import { useModalLock } from '../utils/helpers.jsx'

export default function PdfViewer() {
  const { pdfViewer, closePdfViewer, showToast } = useApp()
  const panelRef = useRef(null)
  useModalLock(panelRef, !!pdfViewer)

  if (!pdfViewer) return null

  const { title, pagesHtml } = pdfViewer

  // Abre una ventana nueva con el documento e inicia la impresión automáticamente
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
    // Fondo oscuro semitransparente; clic en él cierra el visor
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[95] flex items-center justify-center p-4"
    >
      {/* Contenedor del visor: ancho máximo y altura limitada al 90% de la pantalla */}
      <div ref={panelRef} tabIndex={-1} className="bg-[#323639] rounded-2xl shadow-2xl w-full max-w-5xl flex flex-col overflow-hidden outline-none animate-in zoom-in duration-200"
           style={{ height: 'min(90vh, 900px)' }}>

        {/* ── Barra de herramientas ── */}
        <div className="text-white h-12 sm:h-14 flex items-center px-3 sm:px-5 gap-2 shrink-0 border-b border-white/10">
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

        {/* ── Área de visualización del documento ── */}
        {/* dangerouslySetInnerHTML es seguro aquí porque el HTML lo genera el propio sistema,
            no viene de usuarios externos ni de la base de datos. */}
        <div className="flex-1 overflow-auto bg-[#525659] p-4 sm:p-8">
          <div className="flex flex-col items-center gap-6" dangerouslySetInnerHTML={{ __html: pagesHtml }} />
        </div>
      </div>
    </div>
  )
}
