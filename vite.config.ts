import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/posts': 'http://localhost:3001',
      '/testimonials': 'http://localhost:3001',
      '/upload-image': 'http://localhost:3001',
    },
  },
  preview: {
    proxy: {
      '/posts': 'http://localhost:3001',
      '/testimonials': 'http://localhost:3001',
      '/upload-image': 'http://localhost:3001',
    },
  },
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'firebase': ['firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/analytics', 'firebase/storage'],
          'ui-vendor': ['lucide-react'],
          'motion': ['framer-motion'],
        }
      }
    }
  }
});
