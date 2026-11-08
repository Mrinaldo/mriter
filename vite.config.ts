import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import electron from 'vite-plugin-electron'
import renderer from 'vite-plugin-electron-renderer'
import path from 'node:path'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const isWebOnly = process.env.WEB_ONLY === 'true'

  return {
    plugins: [
      react(),
      tailwindcss(),
      ...(isWebOnly
        ? []
        : [
            electron([
              {
                // Main-Process entry file
                entry: 'electron/main.ts',
              },
              {
                entry: 'electron/preload.ts',
                onstart(options) {
                  options.reload()
                },
              },
            ]),
            renderer(),
          ]),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      port: 5173,
    },
  }
})
