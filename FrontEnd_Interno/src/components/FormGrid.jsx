/**
 * FormGrid — Renderiza un formulario a partir de una lista de descriptores de campo.
 *
 * En lugar de escribir cada <input> a mano en el modal, las páginas definen un array
 * de objetos con la forma de cada campo y este componente los convierte en HTML.
 * Esto hace que agregar, quitar o reordenar campos sea tan simple como editar el array.
 *
 * Descriptor de campo (cada objeto del array `fields`):
 *   sep       — No es un campo; es un separador de sección con título (ej. "Datos Personales")
 *   fname     — Nombre del campo en el formulario. Corresponde a la clave en FormData
 *   label     — Texto de la etiqueta visible
 *   val       — Valor inicial (para formularios de edición)
 *   type      — 'text' (defecto), 'email', 'password', 'number', 'date', 'select', 'textarea'
 *   opts      — Lista de opciones para type='select'. Puede ser ['Opción A', 'B'] o [{value, label}]
 *   ph        — Placeholder del campo
 *   req       — Si es true, el campo es obligatorio (muestra * y valida antes de enviar)
 *   span      — Si es true, el campo ocupa las dos columnas del grid en pantallas medianas+
 *   step      — Para campos numéricos con decimales (ej. step='0.01' permite centésimas)
 *   ro        — readOnly: el usuario ve el valor pero no puede editarlo
 */
export default function FormGrid({ fields }) {
  return (
    <>
      {fields.map((f, i) => {
        // Separador de sección: es una línea de título, no un campo de entrada
        if (f.sep) return (
          <div key={i} className="sm:col-span-2 mt-2 first:mt-0">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pb-1.5 border-b border-slate-100">
              {f.sep}
            </p>
          </div>
        )

        return (
          <div key={i} className={f.span ? 'sm:col-span-2' : ''}>
            <label className="field-label">
              {f.label}
              {/* El asterisco rojo indica campo obligatorio */}
              {f.req && <span className="text-rose-500 ml-0.5">*</span>}
            </label>

            {/* Selector desplegable */}
            {f.type === 'select' ? (
              <select name={f.fname} className="select-field" defaultValue={f.val ?? ''} required={f.req}>
                {/* La opción vacía actúa de placeholder; si es requerida no puede quedarse seleccionada */}
                <option value="" disabled={!!f.req}>{f.req ? (f.ph || 'Seleccionar…') : '— Sin especificar —'}</option>
                {(f.opts || []).map(o =>
                  typeof o === 'object'
                    ? <option key={o.value} value={o.value}>{o.label}</option>
                    : <option key={o} value={o}>{o}</option>
                )}
              </select>

            ) : f.type === 'textarea' ? (
              /* Área de texto multilínea (descripción, dirección larga, etc.) */
              <textarea
                name={f.fname}
                rows={3}
                placeholder={f.ph || ''}
                className="input-field resize-none"
                defaultValue={f.val || ''}
                required={f.req}
              />

            ) : (
              /* Campo de entrada genérico: text, email, number, date, password */
              <input
                name={f.fname}
                type={f.type || 'text'}
                step={f.step}          // necesario para aceptar decimales en type='number'
                defaultValue={f.val || ''}
                placeholder={f.ph || ''}
                className="input-field"
                readOnly={f.ro}
                required={f.req}
              />
            )}
          </div>
        )
      })}
    </>
  )
}
