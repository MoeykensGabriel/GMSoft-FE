import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // 3000 a proposito: es el origen que el backend permite por defecto en su CORS.
    // Con el 5173 de Vite habria que tocar la config del backend para desarrollar.
    port: 3000,
  },
})
