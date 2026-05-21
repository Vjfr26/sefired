import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
<<<<<<< HEAD

export default defineConfig({
  plugins: [
=======
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    react(),
>>>>>>> origin/victor
    tailwindcss(),
  ],
})
