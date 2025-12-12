import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      },

      '/login': 'http://localhost:5000',
      '/register': 'http://localhost:5000',
      '/logout': 'http://localhost:5000',
      '/sales_data': 'http://localhost:5000',
      '/recommended': 'http://localhost:5000',
      '/add-recommended': 'http://localhost:5000',
      '/start': 'http://localhost:5000',
      '/stop': 'http://localhost:5000',
      '/remove': 'http://localhost:5000',
      '/change-quantity': 'http://localhost:5000',
      '/qr': 'http://localhost:5000',
      '/get-scanned-items': 'http://localhost:5000',
      '/scan-item': 'http://localhost:5000',
      '/add-more': 'http://localhost:5000',
      '/search': 'http://localhost:5000',
      '/register-scanner': 'http://localhost:5000',
      '/user-details': 'http://localhost:5000',
    }
  }
})
