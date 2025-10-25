import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      plugins: [react(), tailwindcss()],
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      server: {
        proxy: {
          '/api': {
            target: 'http://127.0.0.1:5001/alterego-ai-mobile/us-central1',
            changeOrigin: true,
            rewrite: (path) => path.replace(/^\/api/, '/transformImageHTTP'),
          }
        }
      }
    };
});
