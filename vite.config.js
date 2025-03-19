// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/FailForm-AI/', // <-- set this to your repo name (with leading and trailing slashes)
  plugins: [react()],
})
