<template>
  <section class="forecast-basis-card" aria-label="预测依据">
    <div class="forecast-basis-head">
      <span class="forecast-basis-title">预测依据</span>
      <button
        v-if="collapsible"
        type="button"
        class="forecast-basis-toggle"
        @click="collapsed = !collapsed"
      >
        {{ collapsed ? '展开' : '收起' }}
      </button>
    </div>
    <div v-show="!collapsed" class="forecast-basis-body">
      <p class="forecast-basis-text">{{ displayText }}</p>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

const props = withDefaults(
  defineProps<{
    summary?: string | null
    placeholder?: string
    collapsible?: boolean
  }>(),
  {
    summary: null,
    placeholder: '暂无预测依据',
    collapsible: false,
  },
)

const collapsed = ref(false)

const displayText = computed(() => {
  const t = (props.summary ?? '').trim()
  return t || props.placeholder
})
</script>

<style scoped>
.forecast-basis-card {
  margin-bottom: 12px;
  padding: 14px 16px;
  border: 1px solid #dbeafe;
  border-radius: 10px;
  background: linear-gradient(180deg, #f8fbff 0%, #fff 100%);
  box-shadow: 0 1px 2px rgba(20, 118, 219, 0.06);
}

.forecast-basis-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 8px;
}

.forecast-basis-title {
  font-size: 13px;
  font-weight: 600;
  color: #1476db;
  letter-spacing: 0.02em;
}

.forecast-basis-toggle {
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  padding: 4px 10px;
  background: #fff;
  font-size: 12px;
  color: #64748b;
  cursor: pointer;
  transition: background 0.15s ease;
}

.forecast-basis-toggle:hover {
  background: #f1f5f9;
}

.forecast-basis-body {
  padding-top: 2px;
}

.forecast-basis-text {
  margin: 0;
  font-size: 13px;
  line-height: 1.7;
  color: #334155;
  white-space: pre-wrap;
  word-break: break-word;
}
</style>
