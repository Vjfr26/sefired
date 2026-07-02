import React from 'react'
import { createRoot } from 'react-dom/client'
import '../style.css'
import App from './App.jsx'
import { getDeviceFingerprint } from './utils/fingerprint.js'

// Intercepta todos los fetch hacia /api/* e inyecta el header de fingerprint.
// Esto aplica a todos los módulos sin modificar cada archivo de API.
;(function patchFetch() {
  const _fetch = window.fetch
  window.fetch = function (input, init = {}) {
    const url = typeof input === 'string' ? input : input?.url ?? ''
    if (url.includes('/api/')) {
      init.headers = { ...init.headers, 'X-Device-Fingerprint': getDeviceFingerprint() }
    }
    return _fetch.call(this, input, init).then(res => {
      // Sesión terminada por el backend (token inválido, expirada, o tomada por
      // un nuevo login en otro dispositivo). Solo avisa si creíamos tener sesión
      // (hay token). App.jsx muestra la animación de cierre y redirige al login.
      const motivo = res && res.headers && res.headers.get ? res.headers.get('X-Session-Expired') : null
      if (motivo && localStorage.getItem('auth_token')) {
        window.dispatchEvent(new CustomEvent('jm-session-ended', { detail: { motivo } }))
      }
      return res
    })
  }
})()

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
