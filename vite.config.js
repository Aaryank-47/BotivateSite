import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    host: true
  },
  optimizeDeps: {
    // pre-bundle the PDF reader so the first quotation upload does not trigger a dev re-optimization
    include: ["pdfjs-dist"],
  },
  base: "/",
  build: {
    outDir: "dist",
  },
})
