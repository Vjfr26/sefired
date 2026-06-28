/**
 * Estados de Venezuela y sus principales ciudades/municipios.
 *
 * No pretende ser exhaustivo: cubre las ciudades más comunes por estado para
 * poblar un desplegable dependiente. Los formularios permiten escribir una
 * ciudad que no esté en la lista (campo libre con sugerencias), así que si
 * falta alguna no bloquea el registro.
 */

export const ESTADOS_VE = [
  'Amazonas', 'Anzoátegui', 'Apure', 'Aragua', 'Barinas', 'Bolívar', 'Carabobo',
  'Cojedes', 'Delta Amacuro', 'Distrito Capital', 'Falcón', 'Guárico', 'Lara',
  'Mérida', 'Miranda', 'Monagas', 'Nueva Esparta', 'Portuguesa', 'Sucre',
  'Táchira', 'Trujillo', 'La Guaira', 'Yaracuy', 'Zulia',
]

export const CIUDADES_POR_ESTADO = {
  'Amazonas': ['Puerto Ayacucho', 'San Fernando de Atabapo', 'Maroa', 'San Juan de Manapiare'],
  'Anzoátegui': ['Barcelona', 'Puerto La Cruz', 'El Tigre', 'Anaco', 'Lechería', 'Cantaura', 'Puerto Píritu', 'Guanta', 'Aragua de Barcelona'],
  'Apure': ['San Fernando de Apure', 'Guasdualito', 'Achaguas', 'Biruaca', 'Elorza', 'Bruzual'],
  'Aragua': ['Maracay', 'Turmero', 'La Victoria', 'El Limón', 'Cagua', 'La Encrucijada', 'Villa de Cura', 'San Mateo', 'Palo Negro', 'Santa Rita', 'Las Tejerías'],
  'Barinas': ['Barinas', 'Socopó', 'Santa Bárbara', 'Sabaneta', 'Barinitas', 'Ciudad Bolivia', 'Libertad'],
  'Bolívar': ['Ciudad Bolívar', 'Ciudad Guayana', 'Puerto Ordaz', 'San Félix', 'Upata', 'Caicara del Orinoco', 'El Callao', 'Tumeremo', 'Santa Elena de Uairén', 'Guasipati'],
  'Carabobo': ['Valencia', 'Puerto Cabello', 'Guacara', 'San Joaquín', 'Mariara', 'Bejuma', 'Morón', 'Tocuyito', 'Güigüe', 'Naguanagua', 'Los Guayos'],
  'Cojedes': ['San Carlos', 'Tinaquillo', 'El Baúl', 'Tinaco', 'Las Vegas', 'El Pao'],
  'Delta Amacuro': ['Tucupita', 'Pedernales', 'Curiapo', 'Sierra Imataca'],
  'Distrito Capital': ['Caracas', 'El Junquito', 'La Pastora', 'Antímano', 'El Valle', 'Coche', 'Macarao', 'Sucre (Catia)'],
  'Falcón': ['Coro', 'Punto Fijo', 'Puerto Cumarebo', 'Dabajuro', 'Churuguara', 'La Vela de Coro', 'Tucacas', 'Chichiriviche', 'Mene de Mauroa'],
  'Guárico': ['San Juan de los Morros', 'Calabozo', 'Valle de la Pascua', 'Zaraza', 'Altagracia de Orituco', 'Tucupido', 'Las Mercedes', 'El Sombrero'],
  'Lara': ['Barquisimeto', 'Carora', 'El Tocuyo', 'Quíbor', 'Cabudare', 'Sanare', 'Duaca', 'Sarare'],
  'Mérida': ['Mérida', 'El Vigía', 'Ejido', 'Tovar', 'Lagunillas', 'Bailadores', 'Santa Cruz de Mora', 'Mucuchíes', 'Timotes'],
  'Miranda': ['Los Teques', 'Petare', 'Guarenas', 'Guatire', 'Charallave', 'Cúa', 'Ocumare del Tuy', 'Santa Teresa del Tuy', 'San Antonio de los Altos', 'Baruta', 'Chacao', 'El Hatillo', 'Higuerote', 'Río Chico'],
  'Monagas': ['Maturín', 'Caripito', 'Punta de Mata', 'Temblador', 'Caripe', 'Aragua de Maturín', 'Quiriquire'],
  'Nueva Esparta': ['La Asunción', 'Porlamar', 'Pampatar', 'Juan Griego', 'Punta de Piedras', 'San Juan Bautista', 'Villa Rosa', 'El Valle del Espíritu Santo'],
  'Portuguesa': ['Guanare', 'Acarigua', 'Araure', 'Villa Bruzual', 'Biscucuy', 'Ospino', 'Píritu', 'Turén'],
  'Sucre': ['Cumaná', 'Carúpano', 'Güiria', 'Cariaco', 'Araya', 'Casanay', 'Río Caribe', 'Marigüitar'],
  'Táchira': ['San Cristóbal', 'Táriba', 'La Fría', 'Rubio', 'San Antonio del Táchira', 'Colón', 'La Grita', 'Ureña', 'Michelena', 'Palmira'],
  'Trujillo': ['Trujillo', 'Valera', 'Boconó', 'Pampán', 'La Quebrada', 'Sabana de Mendoza', 'Carache', 'Escuque', 'Motatán'],
  'La Guaira': ['La Guaira', 'Maiquetía', 'Catia La Mar', 'Macuto', 'Caraballeda', 'Naiguatá', 'Carayaca'],
  'Yaracuy': ['San Felipe', 'Yaritagua', 'Chivacoa', 'Nirgua', 'Cocorote', 'Aroa', 'Guama', 'Urachiche'],
  'Zulia': ['Maracaibo', 'Cabimas', 'Ciudad Ojeda', 'Santa Bárbara del Zulia', 'Machiques', 'San Carlos del Zulia', 'La Concepción', 'Villa del Rosario', 'Lagunillas', 'Mene Grande', 'San Francisco', 'Bachaquero'],
}

/** Ciudades de un estado (vacío si el estado no está en el mapa). */
export function ciudadesDe(estado) {
  return CIUDADES_POR_ESTADO[estado] ?? []
}

/** Prefijo telefónico por defecto para Venezuela. */
export const TEL_VE_DEFAULT = '+58 '
