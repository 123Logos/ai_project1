<template>
  <Teleport to="body">
    <div
      v-if="visible"
      class="analysis-card-mask"
      role="presentation"
      @click.self="emit('close')"
    >
      <div
        class="analysis-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="analysis-card-title"
      >
        <header class="analysis-card-head">
          <h3 id="analysis-card-title">{{ title }}</h3>
          <button type="button" class="analysis-card-close" aria-label="关闭" @click="emit('close')">
            ×
          </button>
        </header>

        <div class="analysis-card-scroll">
          <div v-if="metaItems.length" class="analysis-meta-grid">
            <div v-for="(item, i) in metaItems" :key="i" class="analysis-meta-card">
              <span class="analysis-meta-label">{{ item.label }}</span>
              <span class="analysis-meta-value">{{ item.value }}</span>
            </div>
          </div>

          <section class="analysis-basis-card">
            <h4 class="analysis-basis-title">预测依据</h4>
            <p class="analysis-basis-text">{{ bodyText }}</p>
          </section>

          <div v-if="sections.length" class="analysis-sections">
            <div v-for="(sec, i) in sections" :key="i" class="analysis-section">
              <button type="button" class="analysis-section-toggle" @click="toggleSection(i)">
                <span>{{ sec.title }}</span>
                <i class="bi" :class="openSections.has(i) ? 'bi-chevron-up' : 'bi-chevron-down'"></i>
              </button>
              <div v-if="openSections.has(i)" class="analysis-section-body">
                <p class="analysis-basis-text">{{ sec.content }}</p>
              </div>
            </div>
          </div>
        </div>

        <footer class="analysis-card-foot">
          <button type="button" class="analysis-card-btn" @click="emit('close')">关闭</button>
        </footer>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, reactive, watch } from 'vue'

const props = withDefaults(
  defineProps<{
    visible: boolean
    title?: string
    analysis?: string | null
    metaLines?: string[]
    sections?: Array<{ title: string; content: string }>
  }>(),
  {
    title: '预测依据详情',
    analysis: null,
    metaLines: () => [],
    sections: () => [],
  },
)

const emit = defineEmits<{ close: [] }>()

watch(() => props.visible, (v) => { if (v) openSections.clear() })

const bodyText = computed(() => {
  const t = (props.analysis ?? '').trim()
  return t || '暂无'
})

const metaItems = computed(() =>
  props.metaLines
    .map((line) => {
      const t = String(line ?? '').trim()
      if (!t) return null
      const sep = t.indexOf('：')
      if (sep > 0) {
        return { label: t.slice(0, sep), value: t.slice(sep + 1).trim() }
      }
      return { label: '信息', value: t }
    })
    .filter((x): x is { label: string; value: string } => x != null),
)

const openSections = reactive(new Set<number>())

function toggleSection(i: number) {
  if (openSections.has(i)) {
    openSections.delete(i)
  } else {
    openSections.add(i)
  }
}
</script>

<style scoped>
.analysis-card-mask {
  position: fixed;
  inset: 0;
  z-index: 2500;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px 16px;
  background: rgba(15, 23, 42, 0.45);
  animation: analysisFadeIn 0.2s ease;
}

.analysis-card {
  width: min(640px, 100%);
  max-height: min(88vh, 820px);
  display: flex;
  flex-direction: column;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 20px 48px rgba(15, 23, 42, 0.18);
  animation: analysisScaleIn 0.22s ease;
}

.analysis-card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 16px 20px;
  border-bottom: 1px solid #e5e9f2;
  flex-shrink: 0;
}

.analysis-card-head h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #1f2d3d;
  line-height: 1.4;
}

.analysis-card-close {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 8px;
  background: #f1f5f9;
  font-size: 22px;
  line-height: 1;
  cursor: pointer;
  color: #64748b;
  transition: background 0.15s ease, color 0.15s ease;
}

.analysis-card-close:hover {
  background: #e2e8f0;
  color: #334155;
}

.analysis-card-scroll {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.analysis-meta-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 10px;
}

.analysis-meta-card {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid #e5e9f2;
  background: #f8fafc;
}

.analysis-meta-label {
  font-size: 12px;
  color: #64748b;
  line-height: 1.3;
}

.analysis-meta-value {
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
  line-height: 1.4;
  word-break: break-word;
}

.analysis-basis-card {
  padding: 14px 16px;
  border-radius: 10px;
  border: 1px solid #dbeafe;
  background: linear-gradient(180deg, #f8fbff 0%, #fff 100%);
}

.analysis-basis-title {
  margin: 0 0 10px;
  font-size: 13px;
  font-weight: 600;
  color: #1476db;
  letter-spacing: 0.02em;
}

.analysis-basis-text {
  margin: 0;
  font-size: 14px;
  line-height: 1.75;
  color: #334155;
  white-space: pre-wrap;
  word-break: break-word;
}

.analysis-card-foot {
  flex-shrink: 0;
  display: flex;
  justify-content: flex-end;
  padding: 12px 20px 16px;
  border-top: 1px solid #e5e9f2;
}

.analysis-card-btn {
  padding: 8px 18px;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  background: #fff;
  font-size: 14px;
  color: #475569;
  cursor: pointer;
  transition: background 0.15s ease, border-color 0.15s ease;
}

.analysis-card-btn:hover {
  background: #f8fafc;
  border-color: #94a3b8;
}

@keyframes analysisFadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes analysisScaleIn {
  from {
    opacity: 0;
    transform: scale(0.96) translateY(8px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

@media (max-width: 480px) {
  .analysis-card-mask {
    padding: 12px 8px;
  }

  .analysis-meta-grid {
    grid-template-columns: 1fr;
  }
}

.analysis-sections {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.analysis-section {
  border: 1px solid #e5e9f2;
  border-radius: 8px;
  overflow: hidden;
}

.analysis-section-toggle {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  border: none;
  background: #f8fafc;
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  color: #334155;
  transition: background 0.15s ease;
}

.analysis-section-toggle:hover {
  background: #f1f5f9;
}

.analysis-section-body {
  padding: 12px 14px;
  border-top: 1px solid #e5e9f2;
  background: #fff;
}
</style>
