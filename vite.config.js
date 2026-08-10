import { defineConfig } from 'vite'
import react from '@vitejs.plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/',
  preview: {
    allowedHosts: true, // 👈 Libera qualquer domínio no modo preview
  },
  server: {
    allowedHosts: true,
  }
})