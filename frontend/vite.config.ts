import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

export default defineConfig({
  plugins: [
    react(),
    nodePolyfills({
      // Enable polyfills for specific Node.js modules
      include: ['buffer', 'util', 'process'],
      globals: {
        Buffer: true,
        global: true,
        process: true,
      },
    }),
  ],
  server: {
    port: 3005,
    host: true,
    // Add proxy for Privy.io API to prevent CORS issues in development
    proxy: {
      '/api/privy': {
        target: 'https://auth.privy.io',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/privy/, ''),
        configure: (proxy, options) => {
          proxy.on('error', (err, req, res) => {
            console.log('Privy proxy error:', err);
          });
        }
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: false
  },
  define: {
    global: 'globalThis',
    // Ensure NODE_ENV is properly defined for Privy analytics check
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development')
  },
  logLevel: 'info'
});