import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import mkcert from 'vite-plugin-mkcert';
import tailwindcss from '@tailwindcss/vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), mkcert(), tailwindcss()],
  server: {
    port: 3000,
  },
  base: process.env.VITE_BASE_PATH || '/',
});