import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/main.js'),
      name: 'HoursWidget',
      formats: ['iife'],
      fileName: (format) => `hours-widget.js`
    },
    rollupOptions: {
      external: [],
      output: {
        globals: {}
      }
    },
    minify: 'terser',
  },
});