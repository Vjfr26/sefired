/**
 * Límite de caracteres por campo (defensa en profundidad).
 *
 * Aplica un `maxlength` razonable a cada <input>/<textarea> según su tipo,
 * nombre, placeholder o autocomplete. Evita entradas absurdas (overflow /
 * payloads enormes) y complementa la validación real del backend.
 *
 * Notas de seguridad / no-romper:
 *  - Solo fija el atributo `maxlength`; nunca toca el `value` ni el estado de
 *    React, así que no interfiere con inputs controlados.
 *  - `maxlength` no trunca valores ya existentes (formularios de edición); solo
 *    impide escribir de más. Nada se pierde al abrir un registro viejo.
 *  - Respeta cualquier `maxlength` ya definido en el JSX (no lo pisa).
 *  - En number/date/checkbox/file el navegador ignora `maxlength`: se omiten.
 */
import { useEffect } from 'react'

const TEXTY = new Set(['text', 'search', 'url', 'tel', 'email', 'password', ''])

export function limitFor(el) {
  if (el.tagName.toLowerCase() === 'textarea') return 1000

  const type = (el.getAttribute('type') || 'text').toLowerCase()
  if (!TEXTY.has(type)) return null

  const hint = `${el.getAttribute('name') || ''} ${el.getAttribute('placeholder') || ''} ${el.getAttribute('autocomplete') || ''}`.toLowerCase()
  const has = s => hint.includes(s)

  if (type === 'email' || has('correo') || has('email'))                       return 150
  if (type === 'tel' || has('tel') || has('celular') || has('phone') || has('whatsapp')) return 20
  if (has('cedula') || has('rif') || has('documento') || has('pasaporte'))      return 15
  if (has('postal'))                                                            return 10
  if (has('placa'))                                                             return 10
  if (type === 'password')                                                      return 128
  if (has('nombre') || has('apellido'))                                         return 120
  if (has('direccion') || has('address'))                                       return 200
  return 200
}

function applyTo(el) {
  if (el.getAttribute('maxlength')) return
  const max = limitFor(el)
  if (max != null) el.maxLength = max
}

export function applyInputLimits(root) {
  if (!root) return
  if (root.matches?.('input, textarea')) applyTo(root)
  root.querySelectorAll?.('input, textarea').forEach(applyTo)
}

/**
 * Hook: aplica los límites a todo lo que haya dentro de `ref` al montar, y
 * vigila el subárbol para cubrir inputs que aparezcan después (pestañas,
 * filas de pago que se agregan, etc.).
 */
export function useInputLimits(ref) {
  useEffect(() => {
    const root = ref?.current
    if (!root) return
    applyInputLimits(root)

    const obs = new MutationObserver(muts => {
      for (const m of muts) {
        for (const node of m.addedNodes) {
          if (node.nodeType === 1) applyInputLimits(node)
        }
      }
    })
    obs.observe(root, { childList: true, subtree: true })
    return () => obs.disconnect()
  }, [ref])
}
