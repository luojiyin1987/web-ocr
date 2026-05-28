import { defineConfig } from 'vite';

export default defineConfig({
  resolve: {
    alias: {
      'onnxruntime-web': 'onnxruntime-web/wasm',
    },
  },
  build: {
    rollupOptions: {
      plugins: [
        {
          name: 'exclude-wasm-assets',
          generateBundle(_options, bundle) {
            for (const fileName in bundle) {
              if (fileName.endsWith('.wasm')) {
                delete bundle[fileName];
              }
            }
          },
        },
      ],
    },
  },
});
