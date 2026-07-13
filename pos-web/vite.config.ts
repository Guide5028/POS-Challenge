import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      // backend has no CORS plugin registered, so proxy instead of hitting it cross-origin
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
    },
  },
})
