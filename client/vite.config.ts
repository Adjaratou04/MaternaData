import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// En développement, les appels /api sont transmis au serveur Node.js (port 3000).
export default defineConfig({
  plugins: [react()],
  publicDir: 'pwa-public',
  server: { proxy: { '/api': 'http://localhost:3000' } },
  build: { outDir: 'dist', emptyOutDir: true },
});
