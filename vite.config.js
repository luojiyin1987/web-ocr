import { defineConfig } from 'vite';

export default defineConfig({
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
