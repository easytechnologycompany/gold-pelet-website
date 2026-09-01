import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// Dev proxies /api and /uploads so the request is same-origin from the page's
// point of view. Not a CORS workaround — production calls the backend directly
// and is allowlisted there. This is what lets VITE_BACKEND_ORIGIN repoint local
// development at a backend on localhost:8090 without touching that allowlist,
// and it keeps dev working from whatever port Vite happens to pick.
const BACKEND =
  process.env.VITE_BACKEND_ORIGIN || 'https://backend-production-cfda.up.railway.app'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // `import.meta.dirname` rather than `__dirname`: Vite 8 warns that the
  // latter is unsupported by the native config loader it is moving to.
  resolve: { alias: { '@': path.resolve(import.meta.dirname, './src') } },
  build: {
    /**
     * Without a target the CSS minifier assumes a browser new enough for media
     * query range syntax and rewrites every breakpoint into it: `min-width:
     * 900px` shipped as `width>=900px`, 36 of the 64 media queries in the
     * bundle. That syntax landed in Safari 16.4, March 2023. On anything older
     * -- an iPhone that cannot go past iOS 15 is the ordinary case -- those 36
     * queries do not parse, so the entire responsive layer is skipped and the
     * phone layout is served at every width, including on a desktop.
     *
     * safari15 is the floor here because it is the last version several still
     * common iPhones can run. It costs a few hundred bytes of longhand and
     * buys back the breakpoints on those devices.
     */
    cssTarget: ['safari15', 'chrome100', 'firefox100', 'edge100'],
  },
  server: {
    proxy: {
      '/api': { target: BACKEND, changeOrigin: true },
      '/uploads': { target: BACKEND, changeOrigin: true },
    },
  },
})
