import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      // Proxy NASA FIRMS API requests to bypass browser CORS restrictions
      '/nasa-firms-proxy': {
        target: 'https://firms.modaps.eosdis.nasa.gov',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/nasa-firms-proxy/, '')
      }
    }
  }
})
