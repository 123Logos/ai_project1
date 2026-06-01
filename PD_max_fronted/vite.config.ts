import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig(({ mode, command }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    // 生产构建部署在 http://服务器/project3/ 子路径下
    base: command === 'build' ? '/project3/' : '/',
    plugins: [vue()],
    server: {
      port: 3030,
      proxy: {
        '/ai-detection': {
          target: env.VITE_PROXY_TARGET || 'http://127.0.0.1:8030',
          changeOrigin: true,
          proxyTimeout: 600_000,
          timeout: 600_000,
        },
      },
    },
  }
})
