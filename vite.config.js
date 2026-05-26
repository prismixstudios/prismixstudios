import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: true,
    proxy: {
      // Forward API calls to the local functions server (npm run serve starts both)
      "/api":                  "http://localhost:9999",
      "/.netlify/functions":   "http://localhost:9999",
    },
    watch: {
      usePolling: true,
      interval: 300,
    },
  },
})
