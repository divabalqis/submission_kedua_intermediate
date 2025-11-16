import { defineConfig } from 'vite';
import { resolve } from 'path';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  root: "src",
  publicDir: resolve(__dirname, "public"),
  base: "./",
  build: {
    outDir: resolve(__dirname, "dist"),
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
    },
  },
 
  server: {
    host: true,
    port: 5173,
    allowedHosts: [
      "divabalqis.github.io", 
      ".netlify.app",
      "localhost"
    ],
  },
});
