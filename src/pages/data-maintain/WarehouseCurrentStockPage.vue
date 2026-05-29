<template>
  <div class="dmp-page">
    <div class="dmp-top">
      <button type="button" class="dmp-back" @click="emit('back')">
        <i class="bi bi-arrow-left"></i>
        返回
      </button>
      <h2>当前库存维护</h2>
      <p>导入依据：库房名称 + 当前库存（可选库存日期）。列表仅展示各库房最新一条库存记录。</p>
    </div>

    <div class="dmp-tabs">
      <button type="button" class="dmp-tab" :class="{ active: tab === 'import' }" @click="tab = 'import'">数据导入</button>
      <button type="button" class="dmp-tab" :class="{ active: tab === 'list' }" @click="tab = 'list'">最新库存列表</button>
    </div>

    <p v-if="message" class="dmp-msg">{{ message }}</p>

    <div v-if="tab === 'import'" class="dmp-panel">
      <p v-if="importError" class="dmp-err">{{ importError }}</p>
      <div class="dmp-toolbar">
        <button type="button" class="btn btn-primary" :disabled="importLoading" @click="triggerImport">
          {{ importLoading ? '导入中…' : '选择 Excel 导入' }}
        </button>
        <button type="button" class="btn btn-outline-secondary" @click="downloadTemplate">下载模板</button>
      </div>
      <input ref="fileInput" type="file" accept=".xlsx,.xlsm,.xls,.csv" style="display:none" @change="onFileSelect" />

      <div v-if="previewColumns.length" class="dmp-preview">
        <p class="dmp-preview-title">预览（前 10 行，共 {{ previewTotal }} 行）</p>
        <div class="dmp-table-wrap">
          <table class="dmp-table">
            <thead>
              <tr>
                <th v-for="col in previewColumns" :key="col">{{ col }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, idx) in previewRows" :key="idx">
                <td v-for="col in previewColumns" :key="col">{{ row[col] || '—' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="dmp-preview-actions">
          <button type="button" class="btn btn-primary" :disabled="importLoading || !pendingFile" @click="confirmImport">
            {{ importLoading ? '导入中…' : `确认导入（${previewTotal} 行）` }}
          </button>
          <button type="button" class="btn btn-outline-secondary" @click="clearPreview">取消</button>
        </div>
      </div>

      <div v-else class="dmp-hint card">
        <p class="mb-1"><strong>模板列：</strong>库房名称、当前库存、库存日期（可选，YYYY-MM-DD）</p>
        <p class="mb-0 text-muted small">库房名称须与系统中已有库房一致；未填库存日期时由后端使用当天。</p>
      </div>
    </div>

    <div v-else class="dmp-panel">
      <p v-if="listError" class="dmp-err">{{ listError }}</p>
      <div class="dmp-toolbar">
        <input v-model.trim="keyword" type="search" class="form-control dmp-search" placeholder="搜索库房名称" />
        <button type="button" class="btn btn-outline-secondary" :disabled="listLoading" @click="loadList">查询</button>
        <button type="button" class="btn btn-outline-secondary" :disabled="listLoading" @click="loadList">刷新</button>
      </div>
      <div class="dmp-table-wrap">
        <table class="dmp-table">
          <thead>
            <tr>
              <th>库房名称</th>
              <th>当前库存</th>
              <th>库存日期</th>
              <th>更新时间</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="listLoading">
              <td colspan="4" class="text-center py-4">加载中…</td>
            </tr>
            <tr v-else-if="!listRows.length">
              <td colspan="4" class="text-center py-4 text-muted">暂无数据</td>
            </tr>
            <tr v-for="row in listRows" :key="`${row.id}-${row.warehouseName}`">
              <td>{{ row.warehouseName }}</td>
              <td>{{ formatNum(row.stock) }}</td>
              <td>{{ row.stockDate || '—' }}</td>
              <td>{{ formatTime(row.updatedAt) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="dmp-pager">
        <button type="button" class="btn btn-sm btn-outline-secondary" :disabled="page <= 1 || listLoading" @click="gotoPage(page - 1)">上一页</button>
        <span>第 {{ page }} / {{ totalPages }} 页（共 {{ total }} 条）</span>
        <button type="button" class="btn btn-sm btn-outline-secondary" :disabled="page >= totalPages || listLoading" @click="gotoPage(page + 1)">下一页</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import {
  fetchWarehouseCurrentStockList,
  importWarehouseCurrentStockExcel,
  type WarehouseCurrentStockRow,
} from '@/api/warehouseCurrentStockApi'
import { downloadXlsxTemplate, parseExcelFileForPreview } from '@/utils/excelImportPreview'

const emit = defineEmits<{ back: [] }>()

const tab = ref<'import' | 'list'>('import')
const message = ref('')
const importError = ref('')
const listError = ref('')
const importLoading = ref(false)
const listLoading = ref(false)

const fileInput = ref<HTMLInputElement | null>(null)
const pendingFile = ref<File | null>(null)
const previewColumns = ref<string[]>([])
const previewRows = ref<Record<string, string>[]>([])
const previewTotal = ref(0)

const keyword = ref('')
const listRows = ref<WarehouseCurrentStockRow[]>([])
const page = ref(1)
const pageSize = 50
const total = ref(0)
const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pageSize)))

function formatApiError(e: unknown, apiHint: string): string {
  const raw = e instanceof Error ? e.message : String(e)
  if (/not found/i.test(raw) || raw.includes('404')) {
    return `${apiHint} 接口尚未部署（HTTP 404）。请确认后端已发布对应路由，或联系管理员。`
  }
  return raw
}

function formatNum(n: number | null): string {
  if (n == null) return '—'
  return n.toLocaleString('zh-CN', { maximumFractionDigits: 4 })
}

function formatTime(t: string): string {
  if (!t) return '—'
  return t.replace('T', ' ').slice(0, 19)
}

function downloadTemplate() {
  downloadXlsxTemplate('当前库存导入模板.xlsx', '导入数据', ['库房名称', '当前库存', '库存日期'], [
    ['示例库房A', 1200, '2026-05-29'],
    ['示例库房B', 800, ''],
  ])
}

function triggerImport() {
  fileInput.value?.click()
}

function clearPreview() {
  pendingFile.value = null
  previewColumns.value = []
  previewRows.value = []
  previewTotal.value = 0
}

async function onFileSelect(ev: Event) {
  const input = ev.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return
  importError.value = ''
  try {
    const { columns, rows, total: t } = await parseExcelFileForPreview(file)
    if (!rows.length) {
      importError.value = '未解析到有效数据行，请检查表头与内容'
      clearPreview()
      return
    }
    pendingFile.value = file
    previewColumns.value = columns
    previewRows.value = rows.slice(0, 10)
    previewTotal.value = t
  } catch (e) {
    importError.value = e instanceof Error ? e.message : String(e)
    clearPreview()
  }
}

async function confirmImport() {
  if (!pendingFile.value) return
  importLoading.value = true
  importError.value = ''
  message.value = ''
  try {
    const res = await importWarehouseCurrentStockExcel(pendingFile.value)
    const partial = res.skipped_errors > 0
    message.value =
      res.msg ||
      (partial
        ? `已导入 ${res.inserted} 条，${res.skipped_errors} 行跳过`
        : `已成功导入 ${res.inserted} 条`)
    if (res.errors.length) {
      importError.value = res.errors.slice(0, 20).join('\n')
    }
    clearPreview()
    if (res.inserted > 0) {
      tab.value = 'list'
      await loadList()
    }
  } catch (e) {
    importError.value = formatApiError(e, '导入当前库存')
  } finally {
    importLoading.value = false
  }
}

async function loadList() {
  listLoading.value = true
  listError.value = ''
  try {
    const res = await fetchWarehouseCurrentStockList({
      page: page.value,
      page_size: pageSize,
      keyword: keyword.value,
    })
    listRows.value = res.items
    total.value = res.total
  } catch (e) {
    listRows.value = []
    total.value = 0
    listError.value = formatApiError(e, '获取当前库存列表')
  } finally {
    listLoading.value = false
  }
}

async function gotoPage(p: number) {
  if (p < 1 || p > totalPages.value) return
  page.value = p
  await loadList()
}

watch(tab, (t) => {
  if (t === 'list' && !listRows.value.length && !listLoading.value) {
    void loadList()
  }
})
</script>

<style scoped>
@import './data-maintain-shared.css';
</style>
