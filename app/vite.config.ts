import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// The Go API backend does not send `Access-Control-Allow-Origin`, so the
// browser blocks a direct cross-origin call to it. Proxying in dev makes the
// request same-origin from the page's point of view, which is what lets local
// development run against the real API. Point this at a locally running
// backend with VITE_BACKEND_ORIGIN=http://localhost:8090 if you have one.
const BACKEND =
  process.env.VITE_BACKEND_ORIGIN || 'https://backend-production-cfda.up.railway.app'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // `import.meta.dirname` rather than `__dirname`: Vite 8 warns that the
  // latter is unsupported by the native config loader it is moving to.
  resolve: { alias: { '@': path.resolve(import.meta.dirname, './src') } },
  server: {
    proxy: {
      '/api': { target: BACKEND, changeOrigin: true },
      '/uploads': { target: BACKEND, changeOrigin: true },
    },
  },
})
