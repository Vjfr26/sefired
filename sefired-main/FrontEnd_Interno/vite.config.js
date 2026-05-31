import { defineConfig, createLogger } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const backendUrl = process.env.BACKEND_URL || 'http://localhost:8000'

// Suprime el falso positivo de lightningcss con comentarios de Tailwind v4
const logger = createLogger()
const _warn = logger.warn.bind(logger)
logger.warn = (msg, opts) => {
  if (msg.includes('Unexpected token Delim')) return
  _warn(msg, opts)
}

export default defineConfig({
  customLogger: logger,
  plugins: [
    react(),
    tailwindcss(),
  ],
  build: {
    cssMinify: 'esbuild',
  },
  server: {
    host: true,
    proxy: {
      '/api': {
        target: backendUrl,
        changeOrigin: true,
      },
      '/storage': {
        target: backendUrl,
        changeOrigin: true,
      }
    }
  }
})
