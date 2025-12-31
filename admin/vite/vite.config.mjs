import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import jsconfigPaths from 'vite-jsconfig-paths';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const APP_BASE_URL = `${env.VITE_APP_BASE_URL}`;
  const PORT = 3000;

  return {
    server: {
      // this ensures that the browser opens upon server start
      open: true,
      // this sets a default port to 3000
      port: PORT,
      host: true
    },
    preview: {
      open: true,
      host: true
    },
    define: {
      global: 'window'
    },
    base: APP_BASE_URL,
    plugins: [react(), jsconfigPaths()],
    build: {
      // Enable code splitting and chunk optimization
      rollupOptions: {
        output: {
          manualChunks: {
            // Vendor chunks
            'react-vendor': ['react', 'react-dom', 'react-router-dom'],
            'mui-vendor': ['@mui/material', '@mui/x-charts'],
            'icons-vendor': ['@tabler/icons-react'],
            'utils-vendor': ['axios', 'lodash-es', 'notistack']
          },
          // Optimize chunk file names
          chunkFileNames: 'assets/js/[name]-[hash].js',
          entryFileNames: 'assets/js/[name]-[hash].js',
          assetFileNames: 'assets/[ext]/[name]-[hash].[ext]'
        }
      },
      // Optimize chunk size
      chunkSizeWarningLimit: 1000,
      // Enable minification (esbuild is faster than terser)
      minify: 'esbuild',
      // Remove console logs in production
      ...(mode === 'production' && {
        esbuild: {
          drop: ['console', 'debugger']
        }
      })
    },
    // Optimize dependencies
    optimizeDeps: {
      include: ['react', 'react-dom', 'react-router-dom', '@mui/material', 'axios']
    }
  };
});
