import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5003',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      },

      '/login': 'http://localhost:5003',
      '/register': 'http://localhost:5003',
      '/logout': 'http://localhost:5003',
      '/sales_data': 'http://localhost:5003',
      '/recommended': 'http://localhost:5003',
      '/add-recommended': 'http://localhost:5003',
      '/start': 'http://localhost:5003',
      '/stop': 'http://localhost:5003',
      '/remove': 'http://localhost:5003',
      '/change-quantity': 'http://localhost:5003',
      '/qr': 'http://localhost:5003',
      '/get-scanned-items': 'http://localhost:5003',
      '/scan-item': 'http://localhost:5003',
      '/add-more': 'http://localhost:5003',
      '/search': 'http://localhost:5003',
      '/register-scanner': 'http://localhost:5003',
      '/user-details': 'http://localhost:5003',
    }
  }
})
