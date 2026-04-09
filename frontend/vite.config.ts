import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');

export default defineConfig(({ command }) => {
  return {
    root: path.resolve(__dirname, '.'),
    plugins: [react(), tailwindcss()],
    esbuild: {
      drop: command === 'build' ? ['console', 'debugger'] : [],
    },
    // Do not inject GEMINI_API_KEY or other secrets here — they would ship in the browser bundle.
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      fs: {
        allow: [repoRoot],
      },
    },
  };
});
