import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Penanda versi build: di GitHub Actions berisi 7 huruf pertama commit (GITHUB_SHA), lokal berisi "lokal".
const sha = (process.env.GITHUB_SHA || 'lokal').slice(0, 7)
const stamp = new Date().toISOString().slice(0, 16).replace('T', ' ') + ' UTC'

// base './' supaya bisa dibuka dari GitHub Pages (alamat repo apa pun)
export default defineConfig({
  base: './',
  define: { __BUILD_ID__: JSON.stringify(`${sha} · ${stamp}`) },
  plugins: [react(), tailwindcss()],
})
