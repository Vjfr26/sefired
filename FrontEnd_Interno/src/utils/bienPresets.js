/**
 * BIEN_TIPO_PRESETS — catálogo de tipos de bien asegurable más allá de
 * vehículo/inmueble, cada uno con sus propios campos descriptivos.
 *
 * Usado por el wizard del Simulador (Step3) y por el formulario de edición
 * de Bienes Asegurados, para que un producto con tipo_bien='bicicleta' (por
 * ejemplo) pida los campos correctos en vez de un genérico "descripción".
 *
 * Cada campo: { key, label, type: 'text'|'number'|'select', placeholder?, opciones? }
 * El valor económico del bien NO va aquí — se captura aparte en
 * bien.valor_declarado, igual que ya pasa con inmueble.
 */
export const BIEN_TIPO_PRESETS = {
  bicicleta: {
    label: 'Bicicleta',
    campos: [
      { key: 'marca',        label: 'Marca',           type: 'text', placeholder: 'Trek, Specialized…' },
      { key: 'modelo',       label: 'Modelo',          type: 'text', placeholder: 'Marlin 7' },
      { key: 'numero_serie', label: 'Número de serie', type: 'text' },
      { key: 'color',        label: 'Color',           type: 'text' },
    ],
  },
  mascota: {
    label: 'Mascota',
    campos: [
      { key: 'nombre_mascota', label: 'Nombre de la mascota', type: 'text' },
      { key: 'especie',        label: 'Especie',              type: 'text', placeholder: 'Perro, gato…' },
      { key: 'raza',           label: 'Raza',                 type: 'text' },
      { key: 'edad',           label: 'Edad (años)',          type: 'number' },
      { key: 'peso',           label: 'Peso (kg)',            type: 'number' },
    ],
  },
  embarcacion: {
    label: 'Embarcación',
    campos: [
      { key: 'marca',     label: 'Marca',               type: 'text' },
      { key: 'modelo',    label: 'Modelo',              type: 'text' },
      { key: 'anio',      label: 'Año',                 type: 'number' },
      { key: 'matricula', label: 'Matrícula',           type: 'text' },
      { key: 'eslora',    label: 'Eslora (metros)',     type: 'number' },
    ],
  },
  equipo_electronico: {
    label: 'Equipo electrónico',
    campos: [
      { key: 'marca',        label: 'Marca',           type: 'text', placeholder: 'Apple, Samsung…' },
      { key: 'modelo',       label: 'Modelo',          type: 'text' },
      { key: 'numero_serie', label: 'Número de serie', type: 'text' },
    ],
  },
  joya: {
    label: 'Joya',
    campos: [
      { key: 'tipo_joya',   label: 'Tipo de joya', type: 'text', placeholder: 'Anillo, collar, reloj…' },
      { key: 'material',    label: 'Material',     type: 'text', placeholder: 'Oro 18k, platino…' },
      { key: 'certificado', label: '¿Tiene certificado de avalúo?', type: 'select', opciones: ['Sí', 'No'] },
    ],
  },
}

/** Lista de tipo_bien que tienen un preset de campos propios (no genérico). */
export const TIPOS_BIEN_CON_PRESET = Object.keys(BIEN_TIPO_PRESETS)
