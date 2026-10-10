import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return;
          if (/[\\/]node_modules[\\/](recharts|@reduxjs|react-redux|redux|reselect|immer|d3-[^\\/]+|victory-vendor|decimal.js-light|react-smooth|recharts-scale|tiny-invariant|eventemitter3)[\\/]/.test(id)) return 'charts';
          if (/[\\/]node_modules[\\/](react|react-dom|scheduler|react-is|react-router|react-router-dom|@remix-run)[\\/]/.test(id)) return 'react-vendor';
        }
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
        secure: false
      },
      '/socket.io': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
        secure: false,
        ws: true
      }
    }
  }
});
