/// <reference types="node" />

import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import jsconfigPaths from 'vite-jsconfig-paths';
import path from 'path';

export default defineConfig(({ mode }) => {
  // Load env variables (optional)
  const env = loadEnv(mode, process.cwd(), '');
  const PORT = 3000;

  return {
    server: {
      open: true,
      port: PORT,
      host: true,
      proxy: {
        '/api': {
          target: 'http://13.53.168.176:5000',
          changeOrigin: true,
          secure: false,
        },
      },
    },

    preview: {
      open: true,
      host: true
    },

    define: {
      // Fix for libraries that expect Node globals
      global: 'window',
      'process.env': {}
    },

    /**
     * ✅ REQUIRED FOR S3 / CLOUD FRONT
     * Assets must load relatively
     */
    base: './',

    plugins: [react(), jsconfigPaths()],

    build: {
      outDir: 'dist',
      rollupOptions: {
        output: {
          manualChunks: {
            'react-vendor': ['react', 'react-dom', 'react-router-dom'],
            'mui-vendor': ['@mui/material', '@mui/x-charts'],
            'icons-vendor': ['@tabler/icons-react'],
            'utils-vendor': ['axios', 'lodash-es', 'notistack']
          },
          chunkFileNames: 'assets/js/[name]-[hash].js',
          entryFileNames: 'assets/js/[name]-[hash].js',
          assetFileNames: 'assets/[ext]/[name]-[hash].[ext]'
        }
      },
      chunkSizeWarningLimit: 1000,
      minify: 'esbuild',
      ...(mode === 'production' && {
        esbuild: {
          drop: ['console', 'debugger']
        }
      })
    },

    optimizeDeps: {
      include: ['react', 'react-dom', 'react-router-dom', '@mui/material', 'axios']
    },

    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src') // optional if you want `@/components/...`
      }
    }
  };
});
