<template>
  <div class="integration-shell">
    <header class="top-nav">
      <div class="top-nav-inner">
        <div class="title-group">
          <h1 class="title">废铅蓄电池供应链服务系统</h1>
        </div>
        <div class="module-tabs">
          <button
            v-for="item in visiblePrimaryTabs"
            :key="item.key"
            class="tab-btn tab-btn-primary"
            :class="{ active: isLoggedIn && activeSection === item.key, 'tab-btn--need-login': !isLoggedIn }"
            type="button"
            :title="!isLoggedIn ? '请先登录' : undefined"
            @click="onSelectSection(item.key)"
          >
            {{ item.label }}
          </button>
        </div>
        <div class="auth-tools">
          <button v-if="!isLoggedIn" class="auth-btn auth-btn-login" type="button" @click="showLogin = true">
            <i class="bi bi-box-arrow-in-right"></i>
            登录
          </button>
          <template v-else>
            <button
              v-if="showUserManageBtn"
              class="auth-btn auth-btn-user"
              type="button"
              @click="openUserManage"
            >
              <i class="bi bi-people"></i>
              用户管理
            </button>
            <button class="auth-btn auth-btn-logout" type="button" @click="logoutNow">
              <i class="bi bi-box-arrow-right"></i>
              退出
            </button>
          </template>
        </div>
      </div>
    </header>

    <nav
      v-if="isLoggedIn && navPermissionsReady && activeSection === 'prediction' && visiblePredictionSubTabs.length"
      class="sub-nav"
      aria-label="AI 预测子模块"
    >
      <div class="sub-nav-inner">
        <button
          v-for="item in visiblePredictionSubTabs"
          :key="item.key"
          class="sub-tab-btn"
          :class="{ active: predictionSubTab === item.key }"
          type="button"
          @click="predictionSubTab = item.key"
        >
          {{ item.label }}
        </button>
      </div>
    </nav>

    <main
      v-if="!isLoggedIn"
      class="page-main page-main--gate"
    >
      <div class="login-gate">
        <div class="login-gate-icon" aria-hidden="true">
          <i class="bi bi-shield-lock"></i>
        </div>
        <h2 class="login-gate-title">请先登录</h2>
        <p class="login-gate-text">登录后可使用电子地图、AI 预测、图片真伪检查、AI 比价、库房距离监测配置等全部功能。</p>
        <button type="button" class="btn login-gate-btn" @click="showLogin = true">
          <i class="bi bi-box-arrow-in-right me-1" aria-hidden="true"></i>
          去登录
        </button>
      </div>
    </main>
    <main
      v-else-if="isLoggedIn && !navPermissionsReady"
      class="page-main page-main--gate"
    >
      <div class="login-gate">
        <p class="login-gate-text mb-0">正在加载权限…</p>
      </div>
    </main>
    <main
      v-else-if="isLoggedIn && navPermissionsReady && visiblePrimaryTabs.length === 0 && !showUserManageBtn"
      class="page-main page-main--gate"
    >
      <div class="login-gate">
        <h2 class="login-gate-title">暂无可用的功能模块</h2>
        <p class="login-gate-text">
          当前账号在系统中没有任何为「已开启」的导航权限，请联系管理员在「角色管理」中为您分配权限。
        </p>
        <p v-if="mePermLoadError" class="text-danger small mb-3">{{ mePermLoadError }}</p>
        <button type="button" class="btn login-gate-btn" @click="retryLoadPermissions">重新加载权限</button>
      </div>
    </main>
    <main
      v-else
      class="page-main"
      :class="{
        'has-sub-nav':
          activeSection === 'prediction' && visiblePredictionSubTabs.length > 0,
      }"
    >
      <section v-if="activeSection === 'prediction' && predictionSubTab === 'historyManage'" class="panel inner-page">
        <HistoryManage />
      </section>
      <section v-else-if="activeSection === 'prediction' && predictionSubTab === 'historyQuery'" class="panel inner-page">
        <HistoryQuery />
      </section>
      <section v-else-if="activeSection === 'prediction' && predictionSubTab === 'forecast'" class="panel inner-page">
        <PurchaseQuantity />
      </section>
      <section v-else-if="activeSection === 'map'" class="panel emap-panel">
        <ElectronicMap />
      </section>
      <section v-else-if="activeSection === 'detect'" class="panel detect-panel">
        <DetectApp />
      </section>
      <section v-else-if="activeSection === 'users'" class="panel inner-page">
        <UserManage />
      </section>
      <section v-else-if="activeSection === 'warehouseDistance'" class="panel inner-page">
        <WarehouseDistanceConfig />
      </section>




      <section v-else-if="activeSection === 'aiPricing'" class="panel ai-pricing-panel">
        <AiPricing />
      </section>
      <section v-else class="panel iframe-panel">
        <iframe
          class="embedded-frame"
          :src="embeddedIframeSrc"
          :title="activeFrameTitle"
        />
      </section>
    </main>

    <div v-if="showLogin" class="login-mask">
      <div class="card login-card">
        <div class="card-body">
          <h6 class="login-title">用户登录</h6>
          <div class="login-field">
            <label class="form-label login-label">用户名</label>
            <input
              v-model.trim="loginForm.username"
              class="form-control login-input"
              placeholder="请输入用户名"
              autocomplete="off"
            />
          </div>
          <div class="login-field">
            <label class="form-label login-label">密码</label>
            <input
              v-model.trim="loginForm.password"
              type="password"
              class="form-control login-input"
              placeholder="请输入密码"
              autocomplete="new-password"
            />
          </div>
          <div v-if="loginError" class="alert alert-warning py-2 mb-2 login-error">{{ loginError }}</div>
          <div class="login-actions">
            <button class="btn login-btn login-btn-cancel" type="button" @click="showLogin = false">取消</button>
            <button class="btn login-btn login-btn-submit" type="button" :disabled="loginLoading" @click="submitLogin">
              {{ loginLoading ? '登录中…' : '登录' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import HistoryManage from './pages/HistoryManage.vue'
import HistoryQuery from './pages/HistoryQuery.vue'
import PurchaseQuantity from './pages/PurchaseQuantity.vue'
import ElectronicMap from './pages/ElectronicMap.vue'
import UserManage from './pages/UserManage.vue'
import WarehouseDistanceConfig from './components/WarehouseDistanceConfig.vue'
import AiPricing from './pages/AiPricing.vue'
import DetectApp from '../PD_max_fronted/src/App.vue'
import { clearToken, getToken, login } from './api/authApi'
import {
  canOpenUserManage,
  hasPredictionSubNavPermission,
  type PredictionSubKey,
} from './constants/navTabPermissionMap'
import {
  clearMePermissions,
  hasNavPermission,
  loadMePermissions,
  useMePermissionsState,
} from './composables/useMePermissions'

type SectionKey = 'prediction' | 'map' | 'detect' | 'price' | 'aiPricing' | 'warehouseDistance' | 'users'

const primaryTabs: Array<{ key: SectionKey; label: string }> = [
  { key: 'map', label: '电子地图' },
  { key: 'prediction', label: 'AI 预测' },
  { key: 'detect', label: '图片真伪检查' },
  { key: 'price', label: 'AI 比价系统' },
  { key: 'aiPricing', label: 'AI 定价' },
  { key: 'warehouseDistance', label: '库房距离监测配置' },
]

const predictionSubTabs: Array<{ key: PredictionSubKey; label: string }> = [
  { key: 'historyManage', label: '历史数据管理' },
  { key: 'historyQuery', label: '历史数据查询' },
  { key: 'forecast', label: '送货量预测' },
]

const activeSection = ref<SectionKey>('map')
const predictionSubTab = ref<PredictionSubKey>('historyManage')
const baseUrl = import.meta.env.BASE_URL
const embeddedCacheVersion = `${Date.now()}`
const isLoggedIn = ref(!!getToken())
/** 有 token 时整页刷新会先拉 /auth/permissions/me 再展示导航，避免闪错页 */
const navPermissionsReady = ref(!getToken())
const showLogin = ref(false)
const loginLoading = ref(false)
const loginError = ref('')
const loginForm = ref({ username: '', password: '' })

const mePermState = useMePermissionsState()
const mePermLoadError = mePermState.loadError

const visiblePrimaryTabs = computed(() => primaryTabs)

const visiblePredictionSubTabs = computed(() =>
  predictionSubTabs.filter((item) => hasPredictionSubNavPermission(item.key, hasNavPermission)),
)

const showUserManageBtn = computed(() => canOpenUserManage(hasNavPermission))

function firstVisiblePrimarySection(): SectionKey {
  const t = visiblePrimaryTabs.value[0]
  if (t) return t.key
  if (canOpenUserManage(hasNavPermission)) return 'users'
  return 'map'
}

watch(
  [navPermissionsReady, isLoggedIn, visiblePrimaryTabs, visiblePredictionSubTabs],
  () => {
    if (!navPermissionsReady.value || !isLoggedIn.value) return
    const tabs = visiblePrimaryTabs.value
    const keys = tabs.map((t) => t.key)
    const allowed = new Set<SectionKey>(keys)
    if (canOpenUserManage(hasNavPermission)) allowed.add('users')

    if (!tabs.length) {
      if (canOpenUserManage(hasNavPermission)) {
        if (activeSection.value !== 'users') activeSection.value = 'users'
      }
      return
    }

    if (!allowed.has(activeSection.value)) {
      activeSection.value = keys[0]!
    }
    if (activeSection.value === 'prediction' && visiblePredictionSubTabs.value.length) {
      const subs = visiblePredictionSubTabs.value.map((t) => t.key)
      if (!subs.includes(predictionSubTab.value)) {
        predictionSubTab.value = subs[0]!
      }
    }
  },
  { flush: 'post', immediate: true },
)

/** 整页刷新（F5）或从浏览器往返缓存恢复时：重新请求 /auth/permissions/me 并解析导航权限 */
async function refreshNavPermissionsOnPageLoad() {
  if (!getToken()) {
    clearMePermissions()
    navPermissionsReady.value = true
    return
  }
  navPermissionsReady.value = false
  await loadMePermissions()
  navPermissionsReady.value = true
}

function onPageShow(ev: PageTransitionEvent) {
  if (ev.persisted) void refreshNavPermissionsOnPageLoad()
}

onMounted(() => {
  isLoggedIn.value = !!getToken()
  void refreshNavPermissionsOnPageLoad()
  window.addEventListener('pageshow', onPageShow)
})

onUnmounted(() => {
  window.removeEventListener('pageshow', onPageShow)
})

async function retryLoadPermissions() {
  await refreshNavPermissionsOnPageLoad()
}

watch(showLogin, (v) => {
  if (!v) return
  loginForm.value = { username: '', password: '' }
  loginError.value = ''
})

function onSelectSection(key: SectionKey) {
  if (!isLoggedIn.value) {
    showLogin.value = true
    return
  }
  if (key === 'users') {
    if (!canOpenUserManage(hasNavPermission)) return
    activeSection.value = 'users'
    return
  }
  activeSection.value = key
}

function embeddedBasePath(section: 'detect' | 'price') {
  if (section === 'detect') return `${baseUrl}embedded/ai_test/index.html`
  return `${baseUrl}embedded/price_system/index.html`
}

/** 嵌入门户：带 embed=1，子页面可隐藏自带顶栏，避免「页中页」 */
const embeddedIframeSrc = computed(() => {
  const s = activeSection.value
  if (s !== 'detect' && s !== 'price') return 'about:blank'
  const path = embeddedBasePath(s)
  const sep = path.includes('?') ? '&' : '?'
  return `${path}${sep}embed=1&v=${encodeURIComponent(embeddedCacheVersion)}`
})

const activeFrameTitle = computed(() => {
  if (activeSection.value === 'detect') return '图像真伪检测系统'
  return 'AI 智能比价系统'
})

function openUserManage() {
  if (!canOpenUserManage(hasNavPermission)) return
  activeSection.value = 'users'
}

function logoutNow() {
  clearToken()
  clearMePermissions()
  navPermissionsReady.value = true
  isLoggedIn.value = false
  activeSection.value = 'map'
  predictionSubTab.value = 'historyManage'
}

async function submitLogin() {
  if (!loginForm.value.username || !loginForm.value.password) {
    loginError.value = '请输入用户名和密码'
    return
  }
  loginLoading.value = true
  loginError.value = ''
  try {
    await login(loginForm.value.username, loginForm.value.password)
    isLoggedIn.value = true
    await refreshNavPermissionsOnPageLoad()
    showLogin.value = false
    activeSection.value = firstVisiblePrimarySection()
    predictionSubTab.value =
      (visiblePredictionSubTabs.value[0]?.key as PredictionSubKey | undefined) ?? 'historyManage'
  } catch (e) {
    loginError.value = e instanceof Error ? e.message : String(e)
  } finally {
    loginLoading.value = false
  }
}
</script>

<style scoped>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
  background-color: #f5f7fa;
}

.integration-shell {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f5f7fa;
}

.top-nav {
  background-color: #196cc0;
  position: sticky;
  top: 0;
  z-index: 1100;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.top-nav-inner {
  max-width: 100%;
  margin: 0 auto;
  padding: 0 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  min-height: 72px;
  flex-wrap: nowrap;
}

.auth-tools {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 10px 0;
  padding: 6px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.auth-btn {
  border: none;
  height: 34px;
  padding: 0 14px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  transition: all 0.18s ease;
}

.auth-btn i {
  font-size: 14px;
}

.auth-btn-user {
  color: #0f172a;
  background: #ffffff;
}

.auth-btn-user:hover {
  background: #f8fafc;
  transform: translateY(-1px);
}

.auth-btn-logout {
  color: #ffffff;
  background: rgba(255, 255, 255, 0.14);
  border: 1px solid rgba(255, 255, 255, 0.36);
}

.auth-btn-logout:hover {
  background: rgba(255, 255, 255, 0.24);
}

.auth-btn-login {
  color: #0f172a;
  background: #ffffff;
}

.auth-btn-login:hover {
  background: #f8fafc;
  transform: translateY(-1px);
}

.title-group {
  padding: 10px 0;
}

.title {
  color: white;
  font-size: 20px;
  font-weight: 700;
}

.subtitle {
  margin-top: 4px;
  color: rgba(255, 255, 255, 0.82);
  font-size: 13px;
}

.module-tabs {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-wrap: nowrap;
  justify-content: center;
  gap: 8px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 4px;
  margin: 10px 0;
  max-width: 100%;
  overflow-x: auto;
}

.tab-btn {
  border: none;
  padding: 0 18px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.85);
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;
  border-radius: 6px;
  background: transparent;
  font-family: inherit;
}

.tab-btn-primary {
  padding: 0 22px;
  font-weight: 600;
}

.tab-btn:hover {
  color: white;
  background-color: rgba(255, 255, 255, 0.2);
}

.tab-btn.active {
  color: #196cc0;
  background-color: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.tab-btn--need-login {
  opacity: 0.78;
}

.sub-nav {
  position: sticky;
  top: 72px;
  z-index: 1050;
  background: #ffffff;
  border-bottom: 1px solid #e5e7eb;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
}

.sub-nav-inner {
  max-width: 1600px;
  margin: 0 auto;
  padding: 8px 24px;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
}

.sub-tab-btn {
  border: 1px solid transparent;
  padding: 0 16px;
  height: 34px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  font-family: inherit;
  color: #4b5563;
  background: #f3f4f6;
  cursor: pointer;
  transition: background 0.15s, color 0.15s, border-color 0.15s;
}

.sub-tab-btn:hover {
  background: #e5e7eb;
  color: #111827;
}

.sub-tab-btn.active {
  color: #196cc0;
  background: rgba(25, 108, 192, 0.1);
  border-color: rgba(25, 108, 192, 0.35);
}

.page-main {
  flex: 1;
  width: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.page-main--gate {
  flex: 1;
  min-height: calc(100vh - 72px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32px 20px;
  background: linear-gradient(180deg, #f8fafc 0%, #eef2f7 100%);
}

.login-gate {
  text-align: center;
  max-width: 420px;
  padding: 36px 32px 40px;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 10px 40px rgba(15, 23, 42, 0.1);
  border: 1px solid #e2e8f0;
}

.login-gate-icon {
  font-size: 2.5rem;
  color: #196cc0;
  margin-bottom: 12px;
}

.login-gate-title {
  margin: 0 0 10px;
  font-size: 1.35rem;
  font-weight: 700;
  color: #0f172a;
}

.login-gate-text {
  margin: 0 0 22px;
  font-size: 0.95rem;
  line-height: 1.55;
  color: #64748b;
}

.login-gate-btn {
  padding: 0.55rem 1.35rem;
  font-weight: 600;
  border-radius: 10px;
  background: #196cc0;
  color: #fff;
  border: none;
  cursor: pointer;
  font-size: 0.95rem;
  transition: background 0.15s ease, transform 0.1s ease;
}

.login-gate-btn:hover {
  background: #155a9e;
  transform: translateY(-1px);
}

.panel {
  width: 100%;
}

.inner-page {
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px;
}

.iframe-panel {
  flex: 1;
  min-height: 0;
  height: calc(100vh - 72px);
  display: flex;
  flex-direction: column;
  background: #fff;
}

.emap-panel {
  flex: 1;
  min-height: 0;
  height: calc(100vh - 72px);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: #f3f4f6;
}

.detect-panel {
  flex: 1;
  min-height: 0;
}

.page-main.has-sub-nav .iframe-panel {
  height: calc(100vh - 72px - 51px);
}


.embedded-frame {
  flex: 1;
  width: 100%;
  min-height: 0;
  border: none;
  border-radius: 0;
  margin: 0;
  display: block;
  background: #fff;
}

.login-mask {
  position: fixed;
  inset: 0;
  z-index: 1300;
  background: rgba(15, 23, 42, 0.42);
  backdrop-filter: blur(2px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}

.login-card {
  width: min(440px, 100%);
  border: none;
  border-radius: 14px;
  box-shadow: 0 18px 50px rgba(15, 23, 42, 0.32);
  overflow: hidden;
}

.login-card .card-body {
  padding: 20px 22px;
}

.login-title {
  margin: 0 0 14px;
  font-size: 20px;
  font-weight: 700;
  color: #0f172a;
}

.login-field {
  margin-bottom: 12px;
}

.login-label {
  display: block;
  margin-bottom: 6px;
  font-size: 14px;
  color: #334155;
  font-weight: 600;
}

.login-input {
  height: 40px;
  border-radius: 10px;
  border: 1px solid #d1d5db;
  font-size: 14px;
}

.login-input:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
}

.login-error {
  border-radius: 10px;
  font-size: 13px;
  margin-top: 6px;
}

.login-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 14px;
}

.login-btn {
  height: 36px;
  border-radius: 9px;
  padding: 0 16px;
  font-size: 14px;
  font-weight: 600;
}

.login-btn-cancel {
  border: 1px solid #d1d5db;
  background: #f8fafc;
  color: #475569;
}

.login-btn-cancel:hover {
  background: #f1f5f9;
}

.login-btn-submit {
  border: none;
  background: linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%);
  color: #fff;
}

.login-btn-submit:hover {
  filter: brightness(1.06);
}

.login-btn-submit:disabled {
  opacity: 0.75;
  cursor: not-allowed;
}

.ai-pricing-panel {
  flex: 1;
  min-height: 0;
}
</style>
