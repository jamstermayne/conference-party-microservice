import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'index.js'),
      name: 'CalendarModule',
      fileName: 'calendar-module',
      formats: ['es']
    },
    rollupOptions: {
      external: ['../core/platform.js'],
      output: {
        globals: {
          '../core/platform.js': 'Platform'
        },
        dir: resolve(__dirname, 'dist'),
        entryFileNames: 'calendar-module.js',
        format: 'es'
      }
    },
    sourcemap: true,
    minify: 'terser',
    target: 'es2020'
  },
  server: {
    port: 3004,
    cors: true
  },
  define: {
    __MODULE_VERSION__: JSON.stringify('1.0.0'),
    __MODULE_NAME__: JSON.stringify('calendar'),
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development')
  },
  esbuild: {
    legalComments: 'none'
  }
});