import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/posts': 'http://localhost:3001',
      '/upload-image': 'http://localhost:3001',
    },
  },
});
