<template>
  <div class="dm-shell">
    <div v-if="!subPage" class="dm-home">
      <div class="dm-head">
        <h2>数据维护</h2>
        <p>维护库房当前库存与收货价格，支持 Excel 批量导入；库存按「库房 + 品类」维度维护。</p>
      </div>
      <div class="dm-cards">
        <button type="button" class="dm-card" @click="subPage = 'stock'">
          <div class="dm-card-icon" style="background: #e8f0fe; color: #1a73e8;">
            <i class="bi bi-box-seam"></i>
          </div>
          <div class="dm-card-body">
            <h4>当前库存维护</h4>
            <p>按库房 + 回收品种录入或导入库存，系统自动汇总库房总库存。</p>
          </div>
          <i class="bi bi-chevron-right dm-card-arrow"></i>
        </button>
        <button type="button" class="dm-card" @click="subPage = 'receivePrice'">
          <div class="dm-card-icon" style="background: #fef3e2; color: #e8860c;">
            <i class="bi bi-tags"></i>
          </div>
          <div class="dm-card-body">
            <h4>收货价格维护</h4>
            <p>按库房名称 + 回收品类 + 价格导入，品类与系统回收品类一致。</p>
          </div>
          <i class="bi bi-chevron-right dm-card-arrow"></i>
        </button>
      </div>
    </div>
    <WarehouseCurrentStockPage v-else-if="subPage === 'stock'" @back="subPage = ''" />
    <WarehouseReceivePricePage v-else-if="subPage === 'receivePrice'" @back="subPage = ''" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import WarehouseCurrentStockPage from './data-maintain/WarehouseCurrentStockPage.vue'
import WarehouseReceivePricePage from './data-maintain/WarehouseReceivePricePage.vue'

type SubPage = '' | 'stock' | 'receivePrice'

const subPage = ref<SubPage>('')
</script>

<style scoped>
.dm-shell {
  padding: 16px 20px 24px;
  max-width: 1200px;
  margin: 0 auto;
}

.dm-head h2 {
  margin: 0 0 8px;
  font-size: 22px;
  font-weight: 700;
  color: #0f172a;
}

.dm-head p {
  margin: 0;
  font-size: 14px;
  color: #64748b;
  line-height: 1.5;
}

.dm-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 14px;
  margin-top: 20px;
}

.dm-card {
  display: flex;
  align-items: center;
  gap: 14px;
  width: 100%;
  text-align: left;
  padding: 16px 18px;
  border: 1px solid #dde5f1;
  border-radius: 12px;
  background: #fff;
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.05);
  cursor: pointer;
  transition: border-color 0.15s, box-shadow 0.15s, transform 0.15s;
}

.dm-card:hover {
  border-color: #93c5fd;
  box-shadow: 0 6px 16px rgba(37, 99, 235, 0.12);
  transform: translateY(-1px);
}

.dm-card-icon {
  width: 48px;
  height: 48px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  flex-shrink: 0;
}

.dm-card-body h4 {
  margin: 0 0 6px;
  font-size: 16px;
  font-weight: 700;
  color: #1e293b;
}

.dm-card-body p {
  margin: 0;
  font-size: 13px;
  color: #64748b;
  line-height: 1.45;
}

.dm-card-arrow {
  margin-left: auto;
  color: #94a3b8;
  font-size: 18px;
}
</style>
