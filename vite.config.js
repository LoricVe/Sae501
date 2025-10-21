import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Remplacez 'nom-du-repo' par le nom de votre repository GitHub
  base: process.env.NODE_ENV === 'production' ? '/Sae501/' : '/'
})
