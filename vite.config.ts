import { defineConfig, loadEnv } from 'vite'
import type { Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

/**
 * Política de seguridad de contenido, solo en el build: el servidor de desarrollo
 * inyecta scripts en línea para recargar en caliente y una CSP lo rompería. Va como
 * <meta> en index.html para que la misma política valga con nginx en producción y
 * con `vite preview` en local. Lo que una <meta> no puede (frame-ancestors) lo pone nginx.
 */
function contentSecurityPolicy(apiUrl: string): Plugin {
  const api = new URL(apiUrl).origin
  const policy = [
    "default-src 'self'",
    "script-src 'self'",
    // React y los gráficos usan atributos style en línea.
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    `connect-src 'self' ${api}`,
    "font-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "manifest-src 'self'",
    "worker-src 'self'",
  ].join('; ')
  return {
    name: 'content-security-policy',
    apply: 'build',
    transformIndexHtml: () => [{ tag: 'meta', attrs: { 'http-equiv': 'Content-Security-Policy', content: policy }, injectTo: 'head-prepend' }],
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  return {
    plugins: [react(), tailwindcss(), contentSecurityPolicy(env.VITE_API_URL || 'http://localhost:5142')],
    server: {
      // 3000 a proposito: es el origen que el backend permite por defecto en su CORS.
      // Con el 5173 de Vite habria que tocar la config del backend para desarrollar.
      port: 3000,
    },
  }
})
