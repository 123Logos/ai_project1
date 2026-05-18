<template>
  <div id="app">
    <div class="nav-bar">
      <div class="nav-container">
        <div class="nav-logo">生产计划辅助决策系统</div>
        <div class="nav-menu">
          <div
            class="nav-item"
            :class="{ active: activeMenu === 'historyManage' }"
            @click="activeMenu = 'historyManage'"
          >
            历史数据管理
          </div>
          <div
            class="nav-item"
            :class="{ active: activeMenu === 'historyQuery' }"
            @click="activeMenu = 'historyQuery'"
          >
            历史数据查询
          </div>
          <div
            class="nav-item"
            :class="{ active: activeMenu === 'forecast' }"
            @click="activeMenu = 'forecast'"
          >
            送货量预测
          </div>
        </div>
      </div>
    </div>
    <div class="main-content">
      <HistoryManage v-if="activeMenu === 'historyManage'" />
      <HistoryQuery v-else-if="activeMenu === 'historyQuery'" />
      <PurchaseQuantity v-else />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import HistoryManage from '../pages/HistoryManage.vue'
import HistoryQuery from '../pages/HistoryQuery.vue'
import PurchaseQuantity from '../pages/PurchaseQuantity.vue'

const activeMenu = ref('historyManage')
</script>

<style scoped>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

#app {
  min-height: 100vh;
  animation: fadeIn 0.25s ease both;
}

.nav-bar {
  background-color: #196cc0;
  position: sticky;
  top: 0;
  z-index: 1000;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.nav-container {
  max-width: 100%;
  margin: 0 auto;
  padding: 0 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 60px;
}

.nav-logo {
  color: white;
  font-size: 18px;
  font-weight: 600;
}

.nav-menu {
  display: flex;
  gap: 8px;
  height: 100%;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 4px;
}

.nav-item {
  padding: 0 24px;
  height: 44px;
  display: flex;
  align-items: center;
  color: rgba(255, 255, 255, 0.85);
  cursor: pointer;
  font-size: 15px;
  font-weight: 500;
  transition: all 0.2s ease;
  border-radius: 6px;
}

.nav-item:hover {
  color: white;
  background-color: rgba(255, 255, 255, 0.2);
  transform: scale(1.04);
}

.nav-item:active {
  transform: scale(0.97);
}

.nav-item.active {
  color: #196cc0;
  background-color: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.main-content {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}
</style>
