<template>
  <div class="forecast-basis-panel">
    <button type="button" class="forecast-basis-toggle" @click="collapsed = !collapsed">
      <span class="forecast-basis-title">预测依据</span>
      <span class="forecast-basis-chevron">{{ collapsed ? '展开' : '收起' }}</span>
    </button>
    <div v-show="!collapsed" class="forecast-basis-body">
      <p class="forecast-basis-text">{{ displayText }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

const props = withDefaults(
  defineProps<{
    summary?: string | null
    placeholder?: string
  }>(),
  {
    summary: null,
    placeholder: '暂无预测依据',
  },
)

const collapsed = ref(false)

const displayText = computed(() => {
  const t = (props.summary ?? '').trim()
  return t || props.placeholder
})
</script>

<style scoped>
.forecast-basis-panel {
  margin-bottom: 12px;
  border: 1px solid #e5e9f2;
  border-radius: 6px;
  background: #f8fafc;
}
.forecast-basis-toggle {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 14px;
  color: #1f2d3d;
}
.forecast-basis-title {
  font-weight: 600;
}
.forecast-basis-chevron {
  font-size: 12px;
  color: #606266;
}
.forecast-basis-body {
  padding: 0 14px 12px;
  border-top: 1px solid #e8ecf2;
}
.forecast-basis-text {
  margin: 10px 0 0;
  font-size: 13px;
  line-height: 1.65;
  color: #475569;
  white-space: pre-wrap;
  word-break: break-word;
}
</style>
