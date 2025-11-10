import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// 本番環境では devtools を無効化
const plugins = [vue()]

if (process.env.NODE_ENV !== 'production') {
  const vueDevTools = (await import('vite-plugin-vue-devtools')).default
  plugins.push(vueDevTools())
}

export default defineConfig({
  plugins,
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
})
