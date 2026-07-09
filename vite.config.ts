import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Proxy auth calls to the auth service so the browser stays same-origin
    // (no CORS setup needed on the backend). Override the target with
    // VITE_AUTH_TARGET if the auth service runs elsewhere.
    proxy: {
      '/auth-api': {
        target: process.env.VITE_AUTH_TARGET ?? 'http://localhost:3000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/auth-api/, ''),
      },
    },
  },
})
