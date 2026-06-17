export const TIPOS_CALCULO = [
  { val: 'fijo',      label: 'Fijo',      desc: 'Una sola tarifa con prima fija' },
  { val: 'por_plan',  label: 'Por Plan',  desc: 'Planes distintos (Básico, Plata, Oro…)' },
  { val: 'por_nivel', label: 'Por Nivel', desc: 'Niveles de suma asegurada creciente' },
  { val: 'por_valor', label: 'Por Valor', desc: 'Tasa % sobre el valor declarado' },
]

export const TIPOS_PRODUCTO = [
  { val: 'rcv',        label: 'RCV',        full: 'RCV — Responsabilidad Civil Vehicular',      bg: 'bg-sky-100',      text: 'text-sky-700'      },
  { val: 'apov',       label: 'APOV',       full: 'APOV — Accidentes Personales Ocupantes',     bg: 'bg-violet-100',   text: 'text-violet-700'   },
  { val: 'alpd',       label: 'ALPD',       full: 'ALPD — Accidentes de Vida Personal',         bg: 'bg-emerald-100',  text: 'text-emerald-700'  },
  { val: 'ec',         label: 'EC',         full: 'EC — Equipo y Contenido',                    bg: 'bg-amber-100',    text: 'text-amber-700'    },
  { val: 'ep',         label: 'EP',         full: 'EP — Equipo y Planta',                       bg: 'bg-orange-100',   text: 'text-orange-700'   },
  { val: 'vida',       label: 'Vida',       full: 'Vida — Seguro de Vida Individual',            bg: 'bg-rose-100',     text: 'text-rose-700'     },
  { val: 'salud',      label: 'Salud',      full: 'Salud — Hospitalización y Maternidad (HCM)', bg: 'bg-teal-100',     text: 'text-teal-700'     },
  { val: 'hogar',      label: 'Hogar',      full: 'Hogar — Seguro de Inmueble y Contenido',     bg: 'bg-lime-100',     text: 'text-lime-700'     },
  { val: 'accidentes', label: 'Accidentes', full: 'Accidentes — Personales sin Vehículo',       bg: 'bg-cyan-100',     text: 'text-cyan-700'     },
  { val: 'funeraria',  label: 'Funeraria',  full: 'Funeraria — Asistencia Exequial',            bg: 'bg-slate-200',    text: 'text-slate-700'    },
  { val: 'otro',       label: 'Otro',       full: 'Otro — Tipo personalizado',                  bg: 'bg-gray-100',     text: 'text-gray-600'     },
]

export const tipoBadge = (tipo) => {
  const t = TIPOS_PRODUCTO.find(x => x.val === tipo) ?? { label: tipo ?? '?', bg: 'bg-slate-100', text: 'text-slate-500' }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold whitespace-nowrap ${t.bg} ${t.text}`}>
      {t.label}
    </span>
  )
}
