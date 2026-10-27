import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// base './' supaya bisa dibuka dari GitHub Pages (alamat repo apa pun)
export default defineConfig({ base: './', plugins: [react(), tailwindcss()] })
