import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: './frontend',
  base: '/',

  build: {
    outDir: '../dist',
    emptyOutDir: true,
    sourcemap: true,

    rollupOptions: {
      input: {
        main: resolve(__dirname, 'frontend/index.html'),
      },

      output: {
        // Code splitting for better caching
        manualChunks: {
          'vendor': [
            'firebase/app',
            'firebase/auth',
            'firebase/firestore'
          ],
        },

        // Asset naming
        entryFileNames: 'js/[name]-[hash].js',
        chunkFileNames: 'js/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.');
          const ext = info[info.length - 1];
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
            return `images/[name]-[hash][extname]`;
          } else if (/woff|woff2|eot|ttf|otf/i.test(ext)) {
            return `fonts/[name]-[hash][extname]`;
          } else if (ext === 'css') {
            return `css/[name]-[hash][extname]`;
          }
          return `assets/[name]-[hash][extname]`;
        }
      }
    },

    // Optimize bundle size
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info'],
        passes: 2
      },
      mangle: {
        properties: {
          regex: /^_/
        }
      },
      format: {
        comments: false
      }
    },

    // Performance budgets
    chunkSizeWarningLimit: 500,

    // Generate bundle analysis
    reportCompressedSize: true
  },

  server: {
    port: 3000,
    strictPort: false,
    open: true,

    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false
      }
    }
  },

  preview: {
    port: 3001,
    strictPort: false
  },

  optimizeDeps: {
    include: [
      'firebase/app',
      'firebase/auth',
      'firebase/firestore'
    ],
    exclude: ['@firebase/functions']
  },

  plugins: [
    // Add PWA plugin for service worker
    {
      name: 'html-transform',
      transformIndexHtml(html) {
        return html.replace(
          '</head>',
          `  <link rel="manifest" href="/manifest.json">
  <meta name="theme-color" content="#12151b">
  <link rel="apple-touch-icon" href="/icons/icon-192.png">
</head>`
        );
      }
    }
  ],

  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
    'process.env.FIREBASE_CONFIG': JSON.stringify(process.env.FIREBASE_CONFIG || '{}')
  }
});