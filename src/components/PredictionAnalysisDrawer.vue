<template>
  <div v-if="visible" class="analysis-drawer-mask" @click.self="emit('close')">
    <aside class="analysis-drawer" role="dialog" aria-labelledby="analysis-drawer-title">
      <header class="analysis-drawer-head">
        <h3 id="analysis-drawer-title">{{ title }}</h3>
        <button type="button" class="analysis-drawer-close" aria-label="关闭" @click="emit('close')">
          ×
        </button>
      </header>
      <div v-if="metaLines.length" class="analysis-drawer-meta">
        <p v-for="(line, i) in metaLines" :key="i">{{ line }}</p>
      </div>
      <section class="analysis-drawer-body">
        <h4 class="analysis-drawer-subtitle">预测依据</h4>
        <p class="analysis-drawer-content">{{ bodyText }}</p>
      </section>
    </aside>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    visible: boolean
    title?: string
    analysis?: string | null
    metaLines?: string[]
  }>(),
  {
    title: '预测依据详情',
    analysis: null,
    metaLines: () => [],
  },
)

const emit = defineEmits<{ close: [] }>()

const bodyText = computed(() => {
  const t = (props.analysis ?? '').trim()
  return t || '暂无'
})
</script>

<style scoped>
.analysis-drawer-mask {
  position: fixed;
  inset: 0;
  z-index: 2000;
  background: rgba(15, 23, 42, 0.35);
}
.analysis-drawer {
  position: fixed;
  top: 0;
  right: 0;
  width: min(420px, 92vw);
  height: 100%;
  background: #fff;
  box-shadow: -4px 0 24px rgba(0, 0, 0, 0.12);
  display: flex;
  flex-direction: column;
  animation: slideIn 0.2s ease;
}
@keyframes slideIn {
  from {
    transform: translateX(100%);
  }
  to {
    transform: translateX(0);
  }
}
.analysis-drawer-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 18px;
  border-bottom: 1px solid #e5e9f2;
}
.analysis-drawer-head h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}
.analysis-drawer-close {
  border: none;
  background: none;
  font-size: 24px;
  line-height: 1;
  cursor: pointer;
  color: #909399;
}
.analysis-drawer-meta {
  padding: 12px 18px;
  background: #f8fafc;
  border-bottom: 1px solid #e5e9f2;
  font-size: 13px;
  color: #606266;
}
.analysis-drawer-meta p {
  margin: 0 0 4px;
}
.analysis-drawer-body {
  flex: 1;
  overflow: auto;
  padding: 16px 18px;
}
.analysis-drawer-subtitle {
  margin: 0 0 10px;
  font-size: 13px;
  font-weight: 600;
  color: #1f2d3d;
}
.analysis-drawer-content {
  margin: 0;
  font-size: 14px;
  line-height: 1.7;
  color: #334155;
  white-space: pre-wrap;
  word-break: break-word;
}
</style>
