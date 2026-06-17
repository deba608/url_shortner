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
      '/auth': 'http://localhost:3000',
      '/shorten': 'http://localhost:3000',
      '/user': 'http://localhost:3000',
      '/urls': 'http://localhost:3000',
      '/stats': 'http://localhost:3000',
      '/analytics': 'http://localhost:3000',
      '/health': 'http://localhost:3000',
      // Short-code redirect proxy: only forward paths that look like short codes
      // and are NOT known frontend SPA routes. The negative lookahead prevents
      // /login, /register, /dashboard, /terms etc. from being forwarded to the
      // backend (which would 404 them instead of serving index.html).
      '^/(?!login|register|verify-otp|forgot-password|reset-password|dashboard|urls|analytics|terms|privacy|not-found)[A-Za-z0-9_-]{4,12}$': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  preview: {
    proxy: {
      '/auth': 'http://localhost:3000',
      '/shorten': 'http://localhost:3000',
      '/user': 'http://localhost:3000',
      '/urls': 'http://localhost:3000',
      '/stats': 'http://localhost:3000',
      '/analytics': 'http://localhost:3000',
      '/health': 'http://localhost:3000',
      '^/(?!login|register|verify-otp|forgot-password|reset-password|dashboard|urls|analytics|terms|privacy|not-found)[A-Za-z0-9_-]{4,12}$': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
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
