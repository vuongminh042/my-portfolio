import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'https://my-portfolio-8oh4.onrender.com/',
      '/uploads': 'https://my-portfolio-8oh4.onrender.com/',
    },
  },
});
