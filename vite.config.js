import { defineConfig } from 'vite';

export default defineConfig({
  // Relative asset URLs work both at the GitHub Pages root and inside Capacitor's WebView.
  base: './',
  publicDir: 'public',
  server: {
    host: '0.0.0.0',
    allowedHosts: true,
  },
  preview: {
    host: '0.0.0.0',
    allowedHosts: true,
  },
  build: {
    // Three.js and the procedural world are bundled locally so the installed game works offline.
    chunkSizeWarningLimit: 650,
  },
});
