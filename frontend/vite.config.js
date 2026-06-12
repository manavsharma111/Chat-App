import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    nodePolyfills(), // Polyfills Node.js built-ins (events, util, buffer, etc.) for simple-peer
  ],
  define: {
    global: 'globalThis',
  },
})


