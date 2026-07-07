import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  server: {
    port: 3047,
    proxy: {
      '/api': {
        target: 'http://teleback',
        changeOrigin: true,
        secure: false,
      },
    },
  },
});


