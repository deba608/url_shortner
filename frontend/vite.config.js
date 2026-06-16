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
      // Proxy all known backend API paths so the browser never makes a
      // cross-origin request from :5173 to :3000.
      '/auth': 'http://localhost:3000',
      '/shorten': 'http://localhost:3000',
      '/user': 'http://localhost:3000',
      '/urls': 'http://localhost:3000',
      '/stats': 'http://localhost:3000',
      '/analytics': 'http://localhost:3000',
      '/health': 'http://localhost:3000',
      // Short-code redirects: forward /<shortcode> to Express.
      // Regex ensures we only proxy short alphanumeric codes and don't steal
      // React Router paths like /login, /register, /dashboard, /urls, etc.
      '^/[A-Za-z0-9_-]{4,12}$': {
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
