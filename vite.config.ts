import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

// Relative asset paths support GitHub Pages project sites and local previews.
export default defineConfig({
  base: './',
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
