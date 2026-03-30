import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      // REST API
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      // WebSocket relay
      '/ws': {
        target: 'ws://localhost:3001',
        ws: true,
      },
    },
  },
})
