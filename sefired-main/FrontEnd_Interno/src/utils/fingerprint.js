/**
 * Device fingerprinting para auditoría de sesiones.
 *
 * Genera un ID de dispositivo estable combinando características de hardware
 * y un canvas hash. No se puede obtener la MAC address desde el navegador;
 * este fingerprint es la alternativa más cercana disponible en la web.
 *
 * El resultado se cachea en memoria para no recalcularlo en cada request.
 */

function parseUserAgent(ua) {
  let os = 'Desconocido'
  if (/Windows/.test(ua))               os = 'Windows'
  else if (/Mac OS/.test(ua))           os = 'macOS'
  else if (/Android/.test(ua))          os = 'Android'
  else if (/iPhone|iPad|iOS/.test(ua))  os = 'iOS'
  else if (/Linux/.test(ua))            os = 'Linux'

  let browser = 'Desconocido'
  if (/Edg\//.test(ua)) {
    const m = ua.match(/Edg\/(\d+)/); browser = m ? `Edge ${m[1]}` : 'Edge'
  } else if (/OPR\//.test(ua)) {
    const m = ua.match(/OPR\/(\d+)/); browser = m ? `Opera ${m[1]}` : 'Opera'
  } else if (/Chrome\//.test(ua)) {
    const m = ua.match(/Chrome\/(\d+)/); browser = m ? `Chrome ${m[1]}` : 'Chrome'
  } else if (/Firefox\//.test(ua)) {
    const m = ua.match(/Firefox\/(\d+)/); browser = m ? `Firefox ${m[1]}` : 'Firefox'
  } else if (/Safari\//.test(ua)) {
    const m = ua.match(/Version\/(\d+)/); browser = m ? `Safari ${m[1]}` : 'Safari'
  }

  return { os, browser }
}

function canvasHash() {
  try {
    const c = document.createElement('canvas')
    const ctx = c.getContext('2d')
    ctx.textBaseline = 'top'
    ctx.font = '16px Arial'
    ctx.fillStyle = '#f36'
    ctx.fillRect(100, 1, 50, 18)
    ctx.fillStyle = '#069'
    ctx.fillText('Sefired🔐', 2, 4)
    // Los últimos 24 caracteres del data URL son únicos por GPU+driver+OS
    return c.toDataURL().slice(-24)
  } catch {
    return 'no-canvas'
  }
}

function djb2(str) {
  let h = 5381
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h, 33) ^ str.charCodeAt(i)
  }
  return (h >>> 0).toString(16).padStart(8, '0')
}

function buildFingerprint() {
  const ua = navigator.userAgent
  const { os, browser } = parseUserAgent(ua)

  const raw = [
    canvasHash(),
    navigator.platform        ?? '',
    navigator.hardwareConcurrency ?? '',
    screen.width,
    screen.colorDepth,
  ].join('|')

  const deviceId = djb2(raw)

  return JSON.stringify({
    device_id:  deviceId,
    os,
    browser,
    screen:     `${screen.width}×${screen.height}`,
    timezone:   Intl.DateTimeFormat().resolvedOptions().timeZone,
    language:   navigator.language,
    cores:      navigator.hardwareConcurrency  ?? null,
    memory_gb:  navigator.deviceMemory         ?? null,
  })
}

let _cache = null

/** Retorna el fingerprint del dispositivo como JSON string (se cachea en memoria). */
export function getDeviceFingerprint() {
  if (!_cache) _cache = buildFingerprint()
  return _cache
}
