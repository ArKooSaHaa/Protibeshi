import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },

  server: {
    host: true,

    // ✅ Option 1 (recommended for dev)
    allowedHosts: true,

    // ✅ Option 2 (strict)
    // allowedHosts: ['applications-jaguar-perceived-talks.trycloudflare.com'],
  },
})