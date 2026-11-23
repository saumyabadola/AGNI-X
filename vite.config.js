import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      // Proxy all API requests to the AGNI-X Express backend (port 8000)
      // NASA FIRMS key stays server-side — never exposed to the browser
      '/api/v1': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false
      }
    }
  }
})
