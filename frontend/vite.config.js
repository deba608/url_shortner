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
})
