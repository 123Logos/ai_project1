<template>
  <div class="dmp-page">
    <div class="dmp-top">
      <button type="button" class="dmp-back" @click="emit('back')">
        <i class="bi bi-arrow-left"></i>
        返回
      </button>
      <h2>当前库存维护</h2>
      <p>导入依据：库房名称 + 回收品种 + 当前库存（可选库存日期）。列表展示各「库房 + 品类」最新快照。</p>
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
        <button type="button" class="btn btn-outline-secondary" :disabled="templateLoading" @click="downloadTemplate">
          {{ templateLoading ? '下载中…' : '下载模板' }}
        </button>
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
        <p class="mb-1"><strong>模板列：</strong>库房名称、回收品种、当前库存、库存日期（可选，YYYY-MM-DD）</p>
        <p class="mb-2 text-muted small">同一库房可有多行不同品类；保存后系统自动汇总更新库房「当前库存」。</p>
        <p v-if="categories.length" class="mb-0 small">
          <strong>系统品类（{{ categories.length }}）：</strong>
          <span class="text-muted">{{ categoryHint }}</span>
        </p>
        <p v-else-if="categoriesLoading" class="mb-0 small text-muted">正在加载品类…</p>
      </div>
    </div>

    <div v-else class="dmp-panel">
      <p v-if="listError" class="dmp-err">{{ listError }}</p>
      <div class="dmp-toolbar">
        <select v-model="warehouseIdFilter" class="form-select dmp-search">
          <option value="">全部库房</option>
          <option v-for="w in warehouses" :key="w.id" :value="String(w.id)">{{ w.name }}</option>
        </select>
        <select v-model="categoryIdFilter" class="form-select dmp-search">
          <option value="">全部品种</option>
          <option v-for="c in categories" :key="c.id" :value="String(c.id)">{{ c.name }}</option>
        </select>
        <button type="button" class="btn btn-outline-secondary" :disabled="listLoading" @click="loadList">查询</button>
        <button type="button" class="btn btn-outline-secondary" :disabled="listLoading" @click="loadList">刷新</button>
      </div>
      <div class="dmp-table-wrap">
        <table class="dmp-table">
          <thead>
            <tr>
              <th>库房名称</th>
              <th>回收品种</th>
              <th>当前库存</th>
              <th>库存日期</th>
              <th>更新时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="listLoading">
              <td colspan="6" class="text-center py-4">加载中…</td>
            </tr>
            <tr v-else-if="!listRows.length">
              <td colspan="6" class="text-center py-4 text-muted">暂无数据</td>
            </tr>
            <tr
              v-for="row in listRows"
              :key="`${row.id}-${row.warehouseName}-${row.categoryName}`"
            >
              <td>{{ row.warehouseName }}</td>
              <td>{{ row.categoryName || '—' }}</td>
              <td>{{ formatNum(row.stock) }}</td>
              <td>{{ row.stockDate || '—' }}</td>
              <td>{{ formatTime(row.updatedAt) }}</td>
              <td>
                <button
                  type="button"
                  class="btn btn-sm btn-outline-primary"
                  @click="openEditDialog(row)"
                >
                  修改
                </button>
              </td>
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

    <!-- 修改弹窗 -->
    <div v-if="editDialogVisible" class="dmp-edit-overlay" @click.self="closeEditDialog">
      <div class="dmp-edit-dialog">
        <h3 class="dmp-edit-title">修改库存</h3>
        <div class="dmp-edit-form">
          <div class="dmp-edit-field">
            <label>库房名称</label>
            <input type="text" class="form-control" :value="editForm.warehouseName" disabled />
          </div>
          <div class="dmp-edit-field">
            <label>回收品种</label>
            <input type="text" class="form-control" :value="editForm.categoryName" disabled />
          </div>
          <div class="dmp-edit-field">
            <label>当前库存 <span class="text-danger">*</span></label>
            <input
              v-model.number="editForm.stock"
              type="number"
              class="form-control"
              placeholder="请输入库存数量"
              step="0.01"
            />
          </div>
          <div class="dmp-edit-field">
            <label>库存日期</label>
            <input
              v-model="editForm.stockDate"
              type="date"
              class="form-control"
            />
          </div>
        </div>
        <p v-if="editError" class="dmp-err">{{ editError }}</p>
        <div class="dmp-edit-actions">
          <button type="button" class="btn btn-primary" :disabled="editLoading" @click="confirmEdit">
            {{ editLoading ? '保存中…' : '确认修改' }}
          </button>
          <button type="button" class="btn btn-outline-secondary" @click="closeEditDialog">取消</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { fetchTlCategories, fetchTlWarehousesAll } from '@/api/tlApi'
import {
  downloadWarehouseInventoryTemplate,
  fetchWarehouseCurrentStockList,
  importWarehouseCurrentStockExcel,
  saveWarehouseInventoryManual,
  type WarehouseCurrentStockRow,
} from '@/api/warehouseCurrentStockApi'
import { parseExcelFileForPreview } from '@/utils/excelImportPreview'

const emit = defineEmits<{ back: [] }>()

const tab = ref<'import' | 'list'>('import')
const message = ref('')
const importError = ref('')
const listError = ref('')
const importLoading = ref(false)
const templateLoading = ref(false)
const listLoading = ref(false)

// 修改弹窗相关
const editDialogVisible = ref(false)
const editLoading = ref(false)
const editError = ref('')
const editForm = ref({
  id: 0,
  warehouseName: '',
  categoryName: '',
  categoryId: 0,
  stock: 0,
  stockDate: '',
})

const categories = ref<Array<{ id: number; name: string }>>([])
const categoriesLoading = ref(false)
const categoryHint = computed(
  () => categories.value.map((c) => c.name).slice(0, 12).join('、') + (categories.value.length > 12 ? '…' : ''),
)

const fileInput = ref<HTMLInputElement | null>(null)
const pendingFile = ref<File | null>(null)
const previewColumns = ref<string[]>([])
const previewRows = ref<Record<string, string>[]>([])
const previewTotal = ref(0)

const warehouses = ref<Array<{ id: number; name: string }>>([])
const warehouseIdFilter = ref('')
const categoryIdFilter = ref('')
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

async function downloadTemplate() {
  templateLoading.value = true
  importError.value = ''
  try {
    const blob = await downloadWarehouseInventoryTemplate()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = '库房库存导入模板.xlsx'
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  } catch (e) {
    importError.value = formatApiError(e, '下载库存模板')
  } finally {
    templateLoading.value = false
  }
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

function openEditDialog(row: WarehouseCurrentStockRow) {
  editForm.value = {
    id: row.id,
    warehouseName: row.warehouseName,
    categoryName: row.categoryName,
    categoryId: row.categoryId ?? 0,
    stock: row.stock ?? 0,
    stockDate: row.stockDate || '',
  }
  editError.value = ''
  editDialogVisible.value = true
}

function closeEditDialog() {
  editDialogVisible.value = false
  editError.value = ''
}

async function confirmEdit() {
  if (!editForm.value.categoryId) {
    editError.value = '品类信息缺失，无法修改'
    return
  }
  editLoading.value = true
  editError.value = ''
  try {
    await saveWarehouseInventoryManual({
      warehouseId: editForm.value.id,
      categoryId: editForm.value.categoryId,
      stock: editForm.value.stock,
      stockDate: editForm.value.stockDate || undefined,
    })
    message.value = '修改成功'
    closeEditDialog()
    await loadList()
  } catch (e) {
    editError.value = formatApiError(e, '修改库存')
  } finally {
    editLoading.value = false
  }
}

async function loadList() {
  listLoading.value = true
  listError.value = ''
  try {
    const categoryId = categoryIdFilter.value ? Number(categoryIdFilter.value) : undefined
    const warehouseId = warehouseIdFilter.value ? Number(warehouseIdFilter.value) : undefined
    const res = await fetchWarehouseCurrentStockList({
      page: page.value,
      page_size: pageSize,
      warehouse_id: warehouseId != null && Number.isFinite(warehouseId) ? warehouseId : undefined,
      category_id: categoryId != null && Number.isFinite(categoryId) ? categoryId : undefined,
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

watch([warehouseIdFilter, categoryIdFilter], () => {
  page.value = 1
})

function pickStr(r: Record<string, unknown>, keys: string[]): string {
  for (const k of keys) {
    const v = r[k]
    if (typeof v === 'string' && v.trim()) return v.trim()
  }
  return ''
}

function pickNum(r: Record<string, unknown>, keys: string[]): number {
  for (const k of keys) {
    const v = r[k]
    if (v != null) {
      const n = Number(v)
      if (Number.isFinite(n) && n > 0) return n
    }
  }
  return 0
}

async function loadWarehouses() {
  try {
    const rows = await fetchTlWarehousesAll()
    warehouses.value = rows
      .map((r) => ({
        id: pickNum(r, ['仓库id', '库房id', 'warehouse_id', 'id']),
        name: pickStr(r, ['仓库名', 'warehouse_name', 'name']) || `库房#${pickNum(r, ['仓库id', '库房id', 'warehouse_id', 'id'])}`,
      }))
      .filter((w) => w.id > 0)
  } catch {
    warehouses.value = []
  }
}

async function loadCategories() {
  categoriesLoading.value = true
  try {
    categories.value = await fetchTlCategories()
  } catch {
    categories.value = []
  } finally {
    categoriesLoading.value = false
  }
}

onMounted(() => {
  void loadCategories()
  void loadWarehouses()
})
</script>

<style scoped>
@import './data-maintain-shared.css';
</style>
