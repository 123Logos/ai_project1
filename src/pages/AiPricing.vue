<template>
  <div class="home-page">
    <!-- 卡片首页 -->
    <div v-if="!activePage" class="home-content">
      <div class="modules-grid">
        <!-- AI 定价分析 -->
        <div v-if="showMainPanel" class="home-panel main-panel">
          <div class="home-panel-title">
            <i class="bi bi-graph-up-arrow me-1"></i>
            AI 定价分析
          </div>
          <div class="module-cards">
            <div v-if="hasPerm('perm_nav_ai_pricing_benchmark_analysis')" class="module-card" @click="activePage = 'benchmarkAnalysis'">
              <div class="module-icon" style="background: #e8f0fe; color: #1a73e8;">
                <i class="bi bi-bar-chart-line"></i>
              </div>
              <div class="module-info">
                <h4>库房AI定价对标分析</h4>
                <p>基于 AI 算法对库房定价进行多维度对标分析</p>
              </div>
            </div>
            <div v-if="hasPerm('perm_nav_ai_pricing_self_pricing')" class="module-card" @click="activePage = 'selfPricing'">
              <div class="module-icon" style="background: #fef3e2; color: #e8860c;">
                <i class="bi bi-calculator"></i>
              </div>
              <div class="module-info">
                <h4>库房自有定价分析</h4>
                <p>基于成本、运费、毛利等数据的自有库房定价分析</p>
              </div>
            </div>
          </div>
        </div>

        <!-- 基础配置 -->
        <div v-if="showConfigPanel" class="home-panel config-panel">
          <div class="home-panel-title">
            <i class="bi bi-gear me-1"></i>
            基础配置
          </div>
          <div class="module-cards">
            <div v-if="hasPerm('perm_nav_ai_pricing_city_benchmark')" class="module-card" @click="activePage = 'cityBenchmark'">
              <div class="module-icon" style="background: #e6f4ea; color: #137333;">
                <i class="bi bi-geo-alt"></i>
              </div>
              <div class="module-info">
                <h4>对标城市定价</h4>
                <p>配置各对标城市的基准定价数据</p>
              </div>
            </div>
            <div v-if="hasPerm('perm_nav_ai_pricing_smelter_price')" class="module-card" @click="activePage = 'smelterPrice'">
              <div class="module-icon" style="background: #fce8e6; color: #c5221f;">
                <i class="bi bi-building"></i>
              </div>
              <div class="module-info">
                <h4>冶炼厂标定价格</h4>
                <p>管理各冶炼厂的标准定价信息</p>
              </div>
            </div>
            <div v-if="hasPerm('perm_nav_ai_pricing_margin_manage')" class="module-card" @click="activePage = 'marginManage'">
              <div class="module-icon" style="background: #f3e8fd; color: #8430ce;">
                <i class="bi bi-cash-stack"></i>
              </div>
              <div class="module-info">
                <h4>库房差价和毛利管理</h4>
                <p>库房差价设定与毛利数据管理</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 子页面 -->
    <div v-else class="sub-page">
      <div class="sub-page-header">
        <button class="back-btn" @click="activePage = ''">
          <i class="bi bi-arrow-left"></i>
          返回
        </button>
        <h3 class="sub-page-title">{{ pageTitle }}</h3>
      </div>
      <div class="sub-page-body">
        <div class="content-placeholder">
          <div class="placeholder-icon"><i :class="pageIcon"></i></div>
          <h3>{{ pageTitle }}</h3>
          <p>该功能正在建设中，敬请期待…</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { hasNavPermission } from '@/composables/useMePermissions'

const activePage = ref('')

const hasPerm = (field: string) => hasNavPermission(field)

const showMainPanel = computed(() =>
  hasPerm('perm_nav_ai_pricing_benchmark_analysis') ||
  hasPerm('perm_nav_ai_pricing_self_pricing'),
)

const showConfigPanel = computed(() =>
  hasPerm('perm_nav_ai_pricing_city_benchmark') ||
  hasPerm('perm_nav_ai_pricing_smelter_price') ||
  hasPerm('perm_nav_ai_pricing_margin_manage'),
)

const pageMeta: Record<string, { title: string; icon: string }> = {
  benchmarkAnalysis: { title: '库房AI定价对标分析', icon: 'bi bi-bar-chart-line' },
  selfPricing: { title: '库房自有定价分析', icon: 'bi bi-calculator' },
  cityBenchmark: { title: '对标城市定价', icon: 'bi bi-geo-alt' },
  smelterPrice: { title: '冶炼厂标定价格', icon: 'bi bi-building' },
  marginManage: { title: '库房差价和毛利管理', icon: 'bi bi-cash-stack' },
}

const pageTitle = computed(() => pageMeta[activePage.value]?.title ?? '')
const pageIcon = computed(() => pageMeta[activePage.value]?.icon ?? 'bi bi-grid')
</script>

<style scoped>
.home-page {
  min-height: calc(100vh - 72px);
  background: #f5f7fa;
  display: grid;
  place-items: center;
}

/* === 首页卡片 === */
.home-content {
  max-width: 1280px;
  width: 100%;
  padding: 0 24px;
}

.modules-grid {
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  gap: 14px;
  align-items: stretch;
}

.home-panel.main-panel {
  order: 1;
  grid-column: 1 / 8;
}

.home-panel.config-panel {
  order: 2;
  grid-column: 8 / -1;
}

.home-panel {
  margin: 0;
  min-height: 100%;
  border: 1px solid #d8e1ee;
  border-radius: 12px;
  background: #fff;
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.05);
  padding: 20px;
}

.home-panel-title {
  font-size: 16px;
  font-weight: 700;
  padding-bottom: 12px;
  margin-bottom: 12px;
  border-bottom: 1px solid #e8eef7;
  color: #1e293b;
}

.module-cards {
  display: grid;
  gap: 10px;
  grid-template-columns: 1fr;
}

.home-panel.main-panel .module-card {
  min-height: 112px;
  padding: 18px;
  border-color: #cddcf4;
  box-shadow: 0 4px 12px rgba(22, 119, 217, 0.1);
  background: linear-gradient(180deg, #ffffff 0%, #f8fbff 100%);
}

.home-panel.main-panel .module-icon {
  width: 46px;
  height: 46px;
}

.home-panel.main-panel .module-info h4 {
  font-size: 17px;
  font-weight: 700;
}

.home-panel.main-panel .module-info p {
  font-size: 13px;
  color: #475467;
}

.module-card {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  min-height: 76px;
  padding: 12px 14px;
  border: 1px solid #dde5f1;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: #fff;
}

.module-card:hover {
  border-color: #1a73e8;
  box-shadow: 0 2px 12px rgba(26, 115, 232, 0.12);
  transform: translateY(-1px);
}

.module-icon {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  flex-shrink: 0;
}

.module-info h4 {
  margin: 0 0 2px;
  font-size: 15px;
  font-weight: 600;
  color: #1e293b;
}

.module-info p {
  margin: 0;
  font-size: 13px;
  color: #64748b;
  line-height: 1.35;
}

/* === 子页面 === */
.sub-page {
  max-width: 1280px;
  width: 100%;
  padding: 0 24px;
}

.sub-page-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
}

.back-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  background: #fff;
  color: #374151;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
}

.back-btn:hover {
  background: #f3f4f6;
  border-color: #9ca3af;
}

.sub-page-title {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: #1e293b;
}

.sub-page-body {
  background: #fff;
  border: 1px solid #d8e1ee;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.05);
}

.content-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  color: #94a3b8;
}

.placeholder-icon {
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.content-placeholder h3 {
  margin: 0 0 8px;
  font-size: 18px;
  font-weight: 600;
  color: #64748b;
}

.content-placeholder p {
  margin: 0;
  font-size: 14px;
}

@media (max-width: 1024px) {
  .home-panel.main-panel,
  .home-panel.config-panel {
    grid-column: 1 / -1;
  }
}
</style>
