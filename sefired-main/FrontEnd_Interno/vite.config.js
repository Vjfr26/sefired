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
    // Separar vendedores de código de la app:
    // react + react-dom se cachean independientemente del código de la app
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
            return 'react-vendor'
          }
          if (id.includes('node_modules/lucide-react')) {
            return 'lucide'
          }
        },
      },
    },
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
