import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { crx } from '@crxjs/vite-plugin'
import manifest from './src/app/manifest.json'

export default defineConfig({
  plugins: [
    react(),
    crx({ 
      manifest,
      contentScripts: {
        injectCss: true
      }
    })
  ],
  resolve: {
    alias: {
      '@': '/src',
      '@/app': '/src/app',
      '@/pages': '/src/pages',
      '@/widgets': '/src/widgets',
      '@/features': '/src/features',
      '@/entities': '/src/entities',
      '@/shared': '/src/shared'
    }
  },
  build: {
    rollupOptions: {
      input: {
        popup: 'src/app/popup/index.html',
        options: 'src/app/options/index.html',
        content: 'src/app/content/index.ts',
        background: 'src/app/background/index.ts'
      }
    },
    // 确保CSS文件被正确处理
    assetsInlineLimit: 0
  }
}) 