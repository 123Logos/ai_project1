import { fileURLToPath, URL } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import type { ProxyOptions } from 'vite'
import vue from '@vitejs/plugin-vue'

/** 与 `src/api/config.ts` 中 `API_ORIGIN` 保持一致，供开发代理使用 */
const DEFAULT_API_ORIGIN = 'https://redspiderbc.cn'

function proxySecureFlag(env: Record<string, string>): boolean {
  return env.VITE_API_PROXY_INSECURE !== '1' && env.VITE_API_PROXY_INSECURE !== 'true'
}

function buildApiProxy(env: Record<string, string>): Record<string, ProxyOptions> {
  const raw = (env.VITE_API_TARGET || DEFAULT_API_ORIGIN).trim()
  const target = raw.replace(/\/+$/, '')
  const secure = proxySecureFlag(env)

  return {
    '/api/v1': {
      target,
      changeOrigin: true,
      secure,
    },
  }
}

/** 高德 REST 地理编码：开发时走同源代理，避免浏览器直连 restapi 被 CORS 拦截 */
function buildAmapGeocodeProxy(): Record<string, ProxyOptions> {
  return {
    '/amap-api-proxy': {
      target: 'https://restapi.amap.com',
      changeOrigin: true,
      secure: true,
    },
  }
}

/** 比价/库房/品类等请求 `/tl/*`、`/auth/*`；走代理避免浏览器直连触发 CORS */
function buildTlAuthProxy(env: Record<string, string>): Record<string, ProxyOptions> {
  const raw = (env.VITE_TL_TARGET || env.VITE_API_TARGET || DEFAULT_API_ORIGIN).trim()
  const target = raw.replace(/\/+$/, '')
  const secure = proxySecureFlag(env)
  const common = { target, changeOrigin: true, secure } satisfies ProxyOptions
  return {
    '/tl': common,
    '/t1': common,
    '/auth': common,
  }
}

/** AI 预测新接口：不再走 /api/v1 前缀 */
function buildPredictProxy(env: Record<string, string>): Record<string, ProxyOptions> {
  const raw = (env.VITE_API_TARGET || DEFAULT_API_ORIGIN).trim()
  const target = raw.replace(/\/+$/, '')
  const secure = proxySecureFlag(env)
  const common = { target, changeOrigin: true, secure } satisfies ProxyOptions
  return {
    '/delivery-history': common,
    '/forecast': common,
    '/predict': common,
  }
}

/** AI 鉴伪接口代理 */
function buildAiDetectionProxy(env: Record<string, string>): Record<string, ProxyOptions> {
  const raw = (env.VITE_API_TARGET || DEFAULT_API_ORIGIN).trim()
  const target = raw.replace(/\/+$/, '')
  const secure = proxySecureFlag(env)
  const common = { target, changeOrigin: true, secure } satisfies ProxyOptions
  return {
    '/ai-detection': common,
  }
}

/** 库房 AI 定价分析接口代理 — 独立后端，不走 redspiderbc.cn */
function buildVerticalWarehouseAiProxy(env: Record<string, string>): Record<string, ProxyOptions> {
  const raw = (env.VITE_VERTICAL_WAREHOUSE_AI_TARGET || 'http://118.25.96.187:8001').trim()
  const target = raw.replace(/\/+$/, '')
  return {
    '/vertical-warehouse-ai': { target, changeOrigin: true, secure: false },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  if (mode === 'development') {
    const tl = (env.VITE_TL_TARGET || env.VITE_API_TARGET || DEFAULT_API_ORIGIN).trim()
    const api = (env.VITE_API_TARGET || DEFAULT_API_ORIGIN).trim()
    console.info(`[vite] 开发代理: /tl /t1 /auth → ${tl}；/api/v1 /delivery-history /forecast → ${api}`)
  }
  const apiProxy = {
    ...buildApiProxy(env),
    ...buildTlAuthProxy(env),
    ...buildPredictProxy(env),
    ...buildAiDetectionProxy(env),
    ...buildVerticalWarehouseAiProxy(env),
    ...buildAmapGeocodeProxy(),
  }
  const isProd = mode === 'production'

  return {
    // 开发环境使用根路径，生产部署到 /project2/ 子路径。
    base: isProd ? '/project2/' : '/',
    plugins: [vue()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: {
      proxy: apiProxy,
    },
    preview: {
      proxy: apiProxy,
    },
  }
})
