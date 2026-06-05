<template>
  <div ref="rootRef" class="wsp">
    <input
      :id="inputId"
      ref="inputRef"
      :value="inputValue"
      type="search"
      class="wsp-input"
      :placeholder="focused ? searchPlaceholder : placeholder"
      autocomplete="off"
      :disabled="disabled"
      @focus="onFocus"
      @blur="onBlur"
      @input="onInput"
    />
    <div v-show="open && !disabled" class="wsp-drop" role="listbox">
      <button
        v-if="allowAll && showAllOption"
        type="button"
        class="wsp-option"
        :class="{ 'wsp-option--selected': modelValue === 0 }"
        role="option"
        :aria-selected="modelValue === 0"
        @mousedown.prevent="pick(0)"
      >
        全部
      </button>
      <button
        v-for="w in filteredOptions"
        :key="`wsp-${w.id}`"
        type="button"
        class="wsp-option"
        :class="{ 'wsp-option--selected': modelValue === w.id }"
        role="option"
        :aria-selected="modelValue === w.id"
        @mousedown.prevent="pick(w.id)"
      >
        {{ w.name }}
      </button>
      <p v-if="!showAllOption && !filteredOptions.length" class="wsp-empty">无匹配库房，请调整关键词</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { allOptionMatchesQuery, warehouseMatchesQuery, type WarehouseMatchOption } from '@/utils/warehouseFuzzyMatch'

const props = withDefaults(
  defineProps<{
    modelValue: number
    options: WarehouseMatchOption[]
    placeholder?: string
    searchPlaceholder?: string
    allowAll?: boolean
    excludeId?: number
    disabled?: boolean
    inputId?: string
  }>(),
  {
    placeholder: '输入名称或编号搜索',
    searchPlaceholder: '输入名称或编号筛选',
    allowAll: false,
    excludeId: 0,
    disabled: false,
    inputId: undefined,
  },
)

const emit = defineEmits<{ 'update:modelValue': [number] }>()

const rootRef = ref<HTMLElement | null>(null)
const inputRef = ref<HTMLInputElement | null>(null)
const open = ref(false)
const focused = ref(false)
const searchText = ref('')

const candidateOptions = computed(() =>
  props.options.filter((w) => w.id > 0 && w.id !== props.excludeId),
)

const selectedOption = computed(() => {
  if (props.modelValue <= 0) return null
  return candidateOptions.value.find((w) => w.id === props.modelValue) ?? props.options.find((w) => w.id === props.modelValue) ?? null
})

const filteredOptions = computed(() => {
  const q = searchText.value
  let list = candidateOptions.value.filter((w) => warehouseMatchesQuery(w, q))
  const sel = selectedOption.value
  if (sel && !list.some((w) => w.id === sel.id)) list = [sel, ...list]
  return list
})

const showAllOption = computed(() => props.allowAll && allOptionMatchesQuery('全部', searchText.value))

const displayText = computed(() => {
  if (props.modelValue === 0) return props.allowAll ? '全部' : ''
  return selectedOption.value?.name ?? (props.modelValue > 0 ? `库房#${props.modelValue}` : '')
})

const inputValue = computed(() => (focused.value ? searchText.value : displayText.value))

function syncSearchFromModel() {
  if (!focused.value) searchText.value = displayText.value
}

function onFocus() {
  focused.value = true
  open.value = true
  // 聚焦时选中全部文本，方便用户直接输入替换或按 Delete/Backspace 清空
  searchText.value = displayText.value
  nextTick(() => {
    inputRef.value?.select()
  })
}

function onBlur() {
  focused.value = false
  window.setTimeout(() => {
    open.value = false
    // 用户清空了输入内容 → 清除选中值
    if (searchText.value === '') {
      if (props.modelValue !== 0) emit('update:modelValue', 0)
      searchText.value = displayText.value
    } else {
      syncSearchFromModel()
    }
  }, 120)
}

function onInput(e: Event) {
  const val = (e.target as HTMLInputElement).value
  searchText.value = val
  open.value = true
}

function pick(id: number) {
  emit('update:modelValue', id)
  focused.value = false
  open.value = false
  searchText.value = id === 0 ? (props.allowAll ? '全部' : '') : labelFor(id)
}

function labelFor(id: number): string {
  if (id === 0) return props.allowAll ? '全部' : ''
  return props.options.find((w) => w.id === id)?.name ?? `库房#${id}`
}

function onDocMouseDown(e: MouseEvent) {
  if (!rootRef.value?.contains(e.target as Node)) open.value = false
}

watch(() => props.modelValue, syncSearchFromModel)
watch(displayText, syncSearchFromModel)
watch(
  () => props.options,
  () => syncSearchFromModel(),
  { deep: true },
)

onMounted(() => {
  syncSearchFromModel()
  document.addEventListener('mousedown', onDocMouseDown)
})
onBeforeUnmount(() => document.removeEventListener('mousedown', onDocMouseDown))
</script>

<style scoped>
.wsp {
  position: relative;
  width: 100%;
}

.wsp-input {
  height: 38px;
  width: 100%;
  border-radius: 8px;
  border: 1px solid #d1d5db;
  padding: 0 10px;
  background: #fff;
  font-size: 13px;
  box-sizing: border-box;
}

.wsp-input:disabled {
  background: #f1f5f9;
  cursor: not-allowed;
}

.wsp-input::placeholder {
  color: #94a3b8;
}

.wsp-drop {
  position: absolute;
  z-index: 40;
  left: 0;
  right: 0;
  top: calc(100% + 4px);
  max-height: 220px;
  overflow: auto;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.12);
  display: flex;
  flex-direction: column;
}

.wsp-option {
  width: 100%;
  text-align: left;
  padding: 8px 10px;
  font-size: 13px;
  line-height: 1.35;
  border: none;
  border-bottom: 1px solid #f1f5f9;
  background: #fff;
  color: #1e293b;
  cursor: pointer;
  font-family: inherit;
}

.wsp-option:last-of-type {
  border-bottom: none;
}

.wsp-option:hover {
  background: #f8fafc;
}

.wsp-option--selected {
  background: #eff6ff;
  box-shadow: inset 3px 0 0 0 #2563eb;
}

.wsp-empty {
  margin: 0;
  padding: 10px;
  font-size: 12px;
  color: #64748b;
}
</style>
