import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // `import.meta.dirname` rather than `__dirname`: Vite 8 warns that the
  // latter is unsupported by the native config loader it is moving to.
  resolve: { alias: { '@': path.resolve(import.meta.dirname, './src') } },
})
