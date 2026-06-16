import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    // `@` -> /src so imports are absolute and refactor-safe:
    //   import api from '@/api/axiosClient'   (not  '../../../api/axiosClient')
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      // Proxy all backend routes through Vite in development so there are no
      // cross-origin (CORS) issues when the frontend runs on :5173 and the
      // Express backend runs on :3000.
      '/auth': 'http://localhost:3000',
      '/shorten': 'http://localhost:3000',
      '/user': 'http://localhost:3000',
      '/health': 'http://localhost:3000',
      // Short-code redirects: any /:code route not matched by the SPA
      '/:code': 'http://localhost:3000',
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('recharts')) {
              return 'vendor-recharts';
            }
            if (id.includes('react') || id.includes('react-dom') || id.includes('scheduler')) {
              return 'vendor-react';
            }
            return 'vendor';
          }
        },
      },
    },
  },
})
