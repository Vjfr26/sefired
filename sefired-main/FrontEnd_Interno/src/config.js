/**
 * config.js — fuente única de verdad para URLs y constantes de la aplicación.
 *
 * Para cambiar de entorno solo edita el archivo .env correspondiente:
 *   Desarrollo  → FrontEnd_Interno/.env              (VITE_API_URL vacío = proxy de Vite)
 *   Producción  → FrontEnd_Interno/.env.production   (VITE_API_URL=https://api.tudominio.com)
 *
 * Nunca pongas URLs hardcodeadas fuera de este archivo.
 */

/** Base URL del backend. Vacío en dev (el proxy de Vite resuelve /api/*). */
export const API_BASE_URL = import.meta.env.VITE_API_URL ?? ''

/** Nombre de la app mostrado en la UI. */
export const APP_NAME = import.meta.env.VITE_APP_NAME ?? 'Sefired'
