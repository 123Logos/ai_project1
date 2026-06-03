<template>
  <div class="history-query-page">
    <!-- 内页菜单 -->
    <div class="card">
      <div class="menu-search-bar">
        <div class="inner-menu">
          <div
            class="menu-item"
            :class="{ active: activeTab === 'warehouse' }"
            @click="activeTab = 'warehouse'"
          >
            按仓库查询
          </div>
          <div
            class="menu-item"
            :class="{ active: activeTab === 'manager' }"
            @click="activeTab = 'manager'"
          >
            按大区经理查询
          </div>
        </div>
      </div>
    </div>

    <!-- ==================== 按大区经理查询 ==================== -->
    <div v-if="activeTab === 'manager'" class="query-section">
      <div class="card filter-card">
        <div class="filter-row">
          <div class="filter-item">
            <label>送货日期 <span class="date-hint">(最多15天)</span></label>
            <div class="date-range">
              <input
                type="date"
                v-model="managerFilters.startDate"
                class="filter-input"
                @change="validateManagerDateRange"
              />
              <span>至</span>
              <input
                type="date"
                v-model="managerFilters.endDate"
                class="filter-input"
                @change="validateManagerDateRange"
              />
            </div>
          </div>

          <div class="filter-item multi-select-item">
            <label>大区经理 <span class="filter-required">*</span></label>
            <div class="multi-select-container">
              <div
                class="selected-tags"
                :class="multiSelectTagsClass(managerSelectedManagers)"
                @click="focusManagerInput"
              >
                <span v-for="item in mfManagersTagsPreview" :key="item" class="tag tag-shrink" :title="item">{{ item }}</span>
                <button v-for="item in mfManagersTagsPreview" :key="'rm-' + item" type="button" class="tag-remove" @click.stop="removeManager(item)">×</button>
                <span
                  v-if="mfManagersTagsMore > 0"
                  class="tag tag-more tag-shrink"
                  :title="'还有：' + mfManagersTagsRest.join('、')"
                >+{{ mfManagersTagsMore }}</span>
                <input
                  ref="managerInputRef"
                  v-model="managerSearchText"
                  type="text"
                  class="multi-input"
                  :placeholder="multiSelectPlaceholder(managerSelectedManagers)"
                  @input="onManagerSearchInput"
                  @focus="onManagerFocus"
                  @blur="closeManagerDropdown"
                  @keydown.enter="handleManagerKeydown"
                />
              </div>
              <div v-show="managerDropdownVisible && filteredManagerOptions.length > 0" class="dropdown-list">
                <div
                  v-for="item in filteredManagerOptions"
                  :key="item"
                  class="dropdown-item"
                  :class="{ 'dropdown-item--selected': managerSelectedManagers.includes(item) }"
                  @mousedown.prevent="onManagerDropdownPick(item)"
                >
                  {{ item }}
                </div>
              </div>
            </div>
          </div>

          <div class="filter-item multi-select-item multi-select-item--wide">
            <label>冶炼厂 <span class="filter-required">*</span></label>
            <div class="multi-select-container multi-select-container--wide">
              <div
                class="selected-tags"
                :class="multiSelectTagsClass(managerSelectedSmelters)"
                @click="focusSmelterInput"
              >
                <span v-for="item in mfSmeltersTagsPreview" :key="item" class="tag tag-shrink" :title="item">{{ item }}</span>
                <button v-for="item in mfSmeltersTagsPreview" :key="'rm-' + item" type="button" class="tag-remove" @click.stop="removeSmelter(item)">×</button>
                <span
                  v-if="mfSmeltersTagsMore > 0"
                  class="tag tag-more tag-shrink"
                  :title="'还有：' + mfSmeltersTagsRest.join('、')"
                >+{{ mfSmeltersTagsMore }}</span>
                <input
                  ref="smelterInputRef"
                  v-model="smelterSearchText"
                  type="text"
                  class="multi-input"
                  :placeholder="multiSelectPlaceholder(managerSelectedSmelters)"
                  @input="onSmelterSearchInput"
                  @focus="onSmelterFocus"
                  @blur="closeSmelterDropdown"
                  @keydown.enter="handleSmelterKeydown"
                />
              </div>
              <div v-show="smelterDropdownVisible && filteredSmelterOptions.length > 0" class="dropdown-list">
                <div
                  v-for="item in filteredSmelterOptions"
                  :key="item"
                  class="dropdown-item"
                  :class="{ 'dropdown-item--selected': managerSelectedSmelters.includes(item) }"
                  @mousedown.prevent="onSmelterDropdownPick(item)"
                >
                  {{ item }}
                </div>
              </div>
            </div>
          </div>

          <div class="filter-actions">
            <button class="btn btn-primary" @click="queryManagerData" :disabled="loading || !canQueryHistory">
              {{ loading ? '加载中...' : '查询' }}
            </button>
            <button class="btn btn-secondary" @click="resetManagerFilters">重置</button>
            <button class="btn btn-danger" :disabled="managerSelectedRows.length === 0" @click="handleManagerBatchDelete">
              批量删除 ({{ managerSelectedRows.length }})
            </button>
          </div>
        </div>
        <p v-if="activeTab === 'manager' && filterValidationHint" class="filter-validation-hint">{{ filterValidationHint }}</p>
      </div>

      <div class="card result-card">
        <div class="result-label">
          <span>有效合同明细（共 {{ managerTotal }} 条记录）</span>
          <span class="unit-hint">表中数量为重量(吨)</span>
        </div>
        <div class="table-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th width="40"><input type="checkbox" :checked="isManagerAllSelected" @change="toggleManagerSelectAll" /></th>
                <th>大区经理</th>
                <th>冶炼厂</th>
                <th v-for="date in managerDateColumns" :key="date">{{ date }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, idx) in managerDisplayRows" :key="`m-${idx}`">
                <td><input type="checkbox" v-model="managerSelectedRows" :value="row.id" /></td>
                <td v-if="row.showManager" :rowspan="row.managerRowspan">{{ row.regional_manager }}</td>
                <td>{{ row.smelter }}</td>
                <td v-for="(cell, i) in row.cells" :key="i">
                  <span :class="{ 'cell-dash': cell.isPlaceholder }">{{ cell.text }}</span>
                </td>
              </tr>
              <tr v-if="managerDisplayRows.length === 0">
                <td :colspan="3 + managerDateColumns.length" class="empty-data">暂无数据</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p class="table-date-unit-note">说明：单元格内数字单位为吨。</p>

        <div class="pagination">
          <button @click="managerCurrentPage--" :disabled="managerCurrentPage === 1">上一页</button>
          <span
            >第 {{ managerCurrentPage }} / {{ managerTotalPages }} 页（每页 {{ pivotGroupsPerPage }} 个大区经理，同经理下多冶炼厂同行展示）</span
          >
          <button @click="managerCurrentPage++" :disabled="managerCurrentPage === managerTotalPages">下一页</button>
        </div>
      </div>
    </div>

    <!-- ==================== 按仓库查询 ==================== -->
    <div v-if="activeTab === 'warehouse'" class="query-section">
      <div class="card filter-card">
        <div class="filter-row">
          <div class="filter-item">
            <label>送货日期 <span class="date-hint">(最多15天)</span></label>
            <div class="date-range">
              <input
                type="date"
                v-model="warehouseFilters.startDate"
                class="filter-input"
                @change="validateWarehouseDateRange"
              />
              <span>至</span>
              <input
                type="date"
                v-model="warehouseFilters.endDate"
                class="filter-input"
                @change="validateWarehouseDateRange"
              />
            </div>
          </div>

          <div class="filter-item multi-select-item">
            <label>仓库 <span class="filter-required">*</span></label>
            <div class="multi-select-container">
              <div
                class="selected-tags"
                :class="multiSelectTagsClass(warehouseSelectedWarehouses)"
                @click="focusWarehouseInput"
              >
                <span v-for="item in wfWarehousesTagsPreview" :key="item" class="tag tag-shrink" :title="item">{{ item }}</span>
                <button v-for="item in wfWarehousesTagsPreview" :key="'rm-' + item" type="button" class="tag-remove" @click.stop="removeWarehouse(item)">×</button>
                <span
                  v-if="wfWarehousesTagsMore > 0"
                  class="tag tag-more tag-shrink"
                  :title="'还有：' + wfWarehousesTagsRest.join('、')"
                >+{{ wfWarehousesTagsMore }}</span>
                <input
                  ref="warehouseInputRef"
                  v-model="warehouseSearchText"
                  type="text"
                  class="multi-input"
                  :placeholder="multiSelectPlaceholder(warehouseSelectedWarehouses)"
                  @input="onWarehouseSearchInput"
                  @focus="onWarehouseFocus"
                  @blur="closeWarehouseDropdown"
                  @keydown.enter="handleWarehouseKeydown"
                />
              </div>
              <div v-show="warehouseDropdownVisible && filteredWarehouseOptions.length > 0" class="dropdown-list">
                <div
                  v-for="item in filteredWarehouseOptions"
                  :key="item"
                  class="dropdown-item"
                  :class="{ 'dropdown-item--selected': warehouseSelectedWarehouses.includes(item) }"
                  @mousedown.prevent="onWarehouseDropdownPick(item)"
                >
                  {{ item }}
                </div>
              </div>
            </div>
          </div>

          <div class="filter-item multi-select-item multi-select-item--wide">
            <label>冶炼厂 <span class="filter-required">*</span></label>
            <div class="multi-select-container multi-select-container--wide">
              <div
                class="selected-tags"
                :class="multiSelectTagsClass(warehouseSelectedSmelters)"
                @click="focusWarehouseSmelterInput"
              >
                <span v-for="item in wfSmeltersTagsPreview" :key="item" class="tag tag-shrink" :title="item">{{ item }}</span>
                <button v-for="item in wfSmeltersTagsPreview" :key="'rm-' + item" type="button" class="tag-remove" @click.stop="removeWarehouseSmelter(item)">×</button>
                <span
                  v-if="wfSmeltersTagsMore > 0"
                  class="tag tag-more tag-shrink"
                  :title="'还有：' + wfSmeltersTagsRest.join('、')"
                >+{{ wfSmeltersTagsMore }}</span>
                <input
                  ref="warehouseSmelterInputRef"
                  v-model="warehouseSmelterSearchText"
                  type="text"
                  class="multi-input"
                  :placeholder="multiSelectPlaceholder(warehouseSelectedSmelters)"
                  @input="onWarehouseSmelterSearchInput"
                  @focus="onWarehouseSmelterFocus"
                  @blur="closeWarehouseSmelterDropdown"
                  @keydown.enter="handleWarehouseSmelterKeydown"
                />
              </div>
              <div v-show="warehouseSmelterDropdownVisible && filteredWarehouseSmelterOptions.length > 0" class="dropdown-list">
                <div
                  v-for="item in filteredWarehouseSmelterOptions"
                  :key="item"
                  class="dropdown-item"
                  :class="{ 'dropdown-item--selected': warehouseSelectedSmelters.includes(item) }"
                  @mousedown.prevent="onWarehouseSmelterDropdownPick(item)"
                >
                  {{ item }}
                </div>
              </div>
            </div>
          </div>

          <div class="filter-actions">
            <button class="btn btn-primary" @click="queryWarehouseData" :disabled="loading || !canQueryHistory">
              {{ loading ? '加载中...' : '查询' }}
            </button>
            <button class="btn btn-secondary" @click="resetWarehouseFilters">重置</button>
            <button class="btn btn-danger" :disabled="warehouseSelectedRows.length === 0" @click="handleWarehouseBatchDelete">
              批量删除 ({{ warehouseSelectedRows.length }})
            </button>
          </div>
        </div>
        <p v-if="activeTab === 'warehouse' && filterValidationHint" class="filter-validation-hint">{{ filterValidationHint }}</p>
      </div>

      <div class="card result-card">
        <div class="result-label">
          <span>有效合同明细（共 {{ warehouseTotal }} 条记录）</span>
          <span class="unit-hint">表中数量为重量(吨)</span>
        </div>
        <div class="table-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th width="40"><input type="checkbox" :checked="isWarehouseAllSelected" @change="toggleWarehouseSelectAll" /></th>
                <th>仓库</th>
                <th>大区经理</th>
                <th>冶炼厂</th>
                <th v-for="date in warehouseDateColumns" :key="date">{{ date }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, idx) in warehouseDisplayRows" :key="`w-${idx}`">
                <td><input type="checkbox" v-model="warehouseSelectedRows" :value="row.id" /></td>
                <td v-if="row.showWarehouse" :rowspan="row.warehouseRowspan">{{ row.warehouse }}</td>
                <td>{{ row.regional_manager }}</td>
                <td>{{ row.smelter }}</td>
                <td v-for="(cell, i) in row.cells" :key="i">
                  <span :class="{ 'cell-dash': cell.isPlaceholder }">{{ cell.text }}</span>
                </td>
              </tr>
              <tr v-if="warehouseDisplayRows.length === 0">
                <td :colspan="4 + warehouseDateColumns.length" class="empty-data">暂无数据</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p class="table-date-unit-note">说明：单元格内数字单位为吨。</p>

        <div class="pagination">
          <button @click="warehouseCurrentPage--" :disabled="warehouseCurrentPage === 1">上一页</button>
          <span
            >第 {{ warehouseCurrentPage }} / {{ warehouseTotalPages }} 页（每页 {{ pivotGroupsPerPage }} 个仓库；同仓库仅展示最新送货日对应的大区经理，多冶炼厂分行）</span
          >
          <button @click="warehouseCurrentPage++" :disabled="warehouseCurrentPage === warehouseTotalPages">下一页</button>
        </div>
      </div>
    </div>

    <!-- 错误提示弹窗 -->
    <div v-if="errorModalVisible" class="modal" @click.self="closeErrorModal">
      <div class="modal-content modal-small">
        <div class="modal-header error-header">
          <h3>提示</h3>
          <button class="close-btn" @click="closeErrorModal">&times;</button>
        </div>
        <div class="modal-body">
          <p class="modal-message">{{ errorModalMessage }}</p>
          <div v-if="errorModalDetails.length > 0" class="modal-details">
            <ul>
              <li v-for="detail in errorModalDetails" :key="detail">{{ detail }}</li>
            </ul>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-primary" @click="closeErrorModal">确定</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick, type Ref } from 'vue'
import axios from 'axios'
import { ApiPaths } from '../api/paths'
import { DELIVERY_HISTORY_FETCH_PAGE_SIZE } from '../api/fetchLimits'
import { fetchDeliveryHistoryDimensionOptions } from '../api/dimensionOptions'
import {
  PIVOT_GROUPS_PER_PAGE,
  paginatePivotRowsByGroup,
  pivotGroupTotalPages,
} from '../utils/pivotTablePagination'
import {
  buildLatestRegionalManagerByWarehouse,
  resolveRegionalManagerForWarehouse,
} from '../utils/warehouseLatestRegionalManager'

const pivotGroupsPerPage = PIVOT_GROUPS_PER_PAGE

// ==================== 类型定义 ====================
interface RawRecord {
  id: number
  delivery_date: string
  regional_manager: string
  warehouse: string
  smelter?: string
  weight: string
}

interface ApiResponse {
  items: RawRecord[]
  total: number
  page: number
  page_size: number
}

async function refreshDeliveryHistoryDimensionFilters() {
  try {
    const dims = await fetchDeliveryHistoryDimensionOptions()
    allManagerOptions.value = dims.regional_managers
    allSmelterOptions.value = dims.smelters
    allWarehouseOptions.value = dims.warehouses
    filterManagerOptions()
    filterSmelterOptions()
    filterWarehouseOptions()
    filterWarehouseManagerOptions()
    filterWarehouseSmelterOptions()
  } catch (e) {
    console.error('获取送货历史维度选项失败', e)
  }
}

async function fetchAllDeliveryHistoryItems(
  baseParams: Record<string, unknown>,
): Promise<RawRecord[]> {
  const all: RawRecord[] = []
  let page = 1
  while (page <= 200) {
    const params = { ...baseParams, page, page_size: DELIVERY_HISTORY_FETCH_PAGE_SIZE }
    const response = await axios.get(ApiPaths.deliveryHistory, { params })
    const data = response.data as ApiResponse
    const items = data.items || []
    all.push(...items)
    if (items.length === 0) break
    if (items.length < DELIVERY_HISTORY_FETCH_PAGE_SIZE) break
    if (typeof data.total === 'number' && all.length >= data.total) break
    page += 1
  }
  return all
}

// 表格行数据（按大区经理查询）
interface ManagerTableRow {
  id: string
  recordIds: number[]
  regional_manager: string
  smelter: string
  cells: { text: string; isPlaceholder: boolean }[]
}

// 表格行数据（按仓库查询）
interface WarehouseTableRow {
  id: string
  recordIds: number[]
  warehouse: string
  regional_manager: string
  smelter: string
  cells: { text: string; isPlaceholder: boolean }[]
}

// ==================== 通用状态 ====================
const activeTab = ref('warehouse')
const loading = ref(false)

// 错误弹窗
const errorModalVisible = ref(false)
const errorModalMessage = ref('')
const errorModalDetails = ref<string[]>([])

const showError = (message: string, details?: string[]) => {
  errorModalMessage.value = message
  errorModalDetails.value = details || []
  errorModalVisible.value = true
}

const closeErrorModal = () => {
  errorModalVisible.value = false
  errorModalMessage.value = ''
  errorModalDetails.value = []
}

const DEFAULT_SMELTER = '河南金利金铅集团有限公司'

function defaultHistoryDateRange(): { startDate: string; endDate: string } {
  const end = new Date()
  const start = new Date(end)
  start.setDate(start.getDate() - 29)
  const fmt = (d: Date) => d.toISOString().slice(0, 10)
  return { startDate: fmt(start), endDate: fmt(end) }
}

function applyDefaultHistoryDateRange() {
  const range = defaultHistoryDateRange()
  managerFilters.value = { ...range }
  warehouseFilters.value = { ...range }
}

function validateHistoryDateRange(f: Ref<{ startDate: string; endDate: string }>) {
  const startStr = f.value.startDate
  const endStr = f.value.endDate
  if (!startStr || !endStr) return
  const start = new Date(startStr)
  const end = new Date(endStr)
  if (start > end) {
    showError('开始日期不能晚于结束日期', [])
    f.value.endDate = startStr
    return
  }
  const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
  if (days > 14) {
    showError('日期范围最多可选15天（含起止日）', [])
    const cap = new Date(start)
    cap.setDate(cap.getDate() + 14)
    f.value.endDate = cap.toISOString().slice(0, 10)
  }
}

function validateManagerDateRange() {
  validateHistoryDateRange(managerFilters)
}

function validateWarehouseDateRange() {
  validateHistoryDateRange(warehouseFilters)
}

function multiSelectTagsClass(selected: string[]) {
  return { 'selected-tags--single': selected.length === 1 }
}

function multiSelectPlaceholder(selected: string[]) {
  return selected.length > 0 ? '' : '搜索并选择'
}

function applyDefaultSmelterSelection() {
  if (!allSmelterOptions.value.includes(DEFAULT_SMELTER)) {
    allSmelterOptions.value = [...allSmelterOptions.value, DEFAULT_SMELTER].sort((a, b) =>
      a.localeCompare(b, 'zh-CN'),
    )
    filterSmelterOptions()
    filterWarehouseSmelterOptions()
  }
  managerSelectedSmelters.value = [DEFAULT_SMELTER]
  warehouseSelectedSmelters.value = [DEFAULT_SMELTER]
}

function getHistoryFilterValidationError(tab: 'manager' | 'warehouse' = activeTab.value as 'manager' | 'warehouse'): string | null {
  if (tab === 'manager') {
    const missing: string[] = []
    if (managerSelectedManagers.value.length === 0) missing.push('大区经理')
    if (managerSelectedSmelters.value.length === 0) missing.push('冶炼厂')
    if (missing.length > 0) return `请先选择${missing.join('、')}后再查询`
    const f = managerFilters.value
    if (!f.startDate || !f.endDate) return '请选择送货日期范围'
    return null
  }
  const missing: string[] = []
  if (warehouseSelectedWarehouses.value.length === 0) missing.push('仓库')
  if (warehouseSelectedManagers.value.length === 0) missing.push('大区经理')
  if (warehouseSelectedSmelters.value.length === 0) missing.push('冶炼厂')
  if (missing.length > 0) return `请先选择${missing.join('、')}后再查询`
  const f = warehouseFilters.value
  if (!f.startDate || !f.endDate) return '请选择送货日期范围'
  return null
}

const filterValidationHint = computed(() => getHistoryFilterValidationError() ?? '')

const canQueryHistory = computed(() => getHistoryFilterValidationError() === null)

function clearManagerQueryResults() {
  managerTableRows.value = []
  managerDateColumns.value = []
  managerTotal.value = 0
  managerCurrentPage.value = 1
  managerSelectedRows.value = []
}

function clearWarehouseQueryResults() {
  warehouseTableRows.value = []
  warehouseDateColumns.value = []
  warehouseTotal.value = 0
  warehouseCurrentPage.value = 1
  warehouseSelectedRows.value = []
}

function applyInitialHistoryFilterDefaults() {
  if (!managerFilters.value.startDate || !managerFilters.value.endDate) {
    const range = defaultHistoryDateRange()
    managerFilters.value = { ...range }
  }
  if (!warehouseFilters.value.startDate || !warehouseFilters.value.endDate) {
    const range = defaultHistoryDateRange()
    warehouseFilters.value = { ...range }
  }
  if (managerSelectedSmelters.value.length === 0 || warehouseSelectedSmelters.value.length === 0) {
    applyDefaultSmelterSelection()
  }
}

// ==================== 按大区经理查询 ====================
const managerTotal = ref(0)
const managerCurrentPage = ref(1)
const managerSelectedRows = ref<string[]>([])

const managerFilters = ref({ startDate: '', endDate: '' })
const managerSearchText = ref('')
const managerDropdownVisible = ref(false)
const managerSelectedManagers = ref<string[]>([])
const managerSelectedSmelters = ref<string[]>([])

// 日期列
const managerDateColumns = ref<string[]>([])

// 表格行数据
const managerTableRows = ref<ManagerTableRow[]>([])

function managerGroupSort(a: ManagerTableRow, b: ManagerTableRow) {
  const c = a.regional_manager.localeCompare(b.regional_manager, 'zh-CN')
  if (c !== 0) return c
  return a.smelter.localeCompare(b.smelter, 'zh-CN')
}

const managerTotalPages = computed(() =>
  pivotGroupTotalPages(managerTableRows.value, (r) => r.regional_manager, managerGroupSort),
)
const managerPaginatedRows = computed(() =>
  paginatePivotRowsByGroup(
    managerTableRows.value,
    managerCurrentPage.value,
    (r) => r.regional_manager,
    managerGroupSort,
  ),
)

/** 分页后的行 + 大区经理列合并（与模板 showManager / managerRowspan 对应） */
const managerDisplayRows = computed(() => {
  const rows = managerPaginatedRows.value
  const sorted = [...rows].sort((a, b) => {
    const c = a.regional_manager.localeCompare(b.regional_manager, 'zh-CN')
    if (c !== 0) return c
    return a.smelter.localeCompare(b.smelter, 'zh-CN')
  })
  const out: Array<ManagerTableRow & { showManager: boolean; managerRowspan: number }> = []
  let i = 0
  while (i < sorted.length) {
    const mgr = sorted[i].regional_manager
    let j = i + 1
    while (j < sorted.length && sorted[j].regional_manager === mgr) j++
    const span = j - i
    for (let k = i; k < j; k++) {
      out.push({
        ...sorted[k],
        showManager: k === i,
        managerRowspan: span
      })
    }
    i = j
  }
  return out
})
const managerInputRef = ref<HTMLInputElement>()
const allManagerOptions = ref<string[]>([])
const filteredManagerOptions = ref<string[]>([])

const smelterSearchText = ref('')
const smelterDropdownVisible = ref(false)
const smelterInputRef = ref<HTMLInputElement>()
const allSmelterOptions = ref<string[]>([])
const filteredSmelterOptions = ref<string[]>([])

const isManagerAllSelected = computed(() => {
  return managerPaginatedRows.value.length > 0 && managerSelectedRows.value.length === managerPaginatedRows.value.length
})

/** 下拉按搜索过滤；已选项仍显示在列表中，用样式标灰 */
function filterOptionsBySearch(options: string[], searchLower: string) {
  if (!searchLower) return [...options]
  return options.filter((opt) => opt.toLowerCase().includes(searchLower))
}

// 大区经理多选逻辑
const filterManagerOptions = () => {
  const search = managerSearchText.value.toLowerCase()
  filteredManagerOptions.value = filterOptionsBySearch(allManagerOptions.value, search)
}

const addManager = (item: string) => {
  if (!managerSelectedManagers.value.includes(item)) {
    managerSelectedManagers.value.push(item)
  }
  managerSearchText.value = ''
  filterManagerOptions()
}

const removeManager = (item: string) => {
  managerSelectedManagers.value = managerSelectedManagers.value.filter(i => i !== item)
  filterManagerOptions()
}

function onManagerDropdownPick(item: string) {
  if (managerSelectedManagers.value.includes(item)) removeManager(item)
  else addManager(item)
}

const handleManagerKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Enter' && managerSearchText.value.trim()) {
    addManager(managerSearchText.value.trim())
    e.preventDefault()
  }
}

const closeManagerDropdown = () => {
  setTimeout(() => {
    managerDropdownVisible.value = false
  }, 200)
}

function onManagerFocus() {
  managerDropdownVisible.value = true
  filterManagerOptions()
}

function onManagerSearchInput() {
  managerDropdownVisible.value = true
  filterManagerOptions()
}

const focusManagerInput = () => {
  managerDropdownVisible.value = true
  filterManagerOptions()
  nextTick(() => managerInputRef.value?.focus())
}

// 冶炼厂多选逻辑
const filterSmelterOptions = () => {
  const search = smelterSearchText.value.toLowerCase()
  filteredSmelterOptions.value = filterOptionsBySearch(allSmelterOptions.value, search)
}

const addSmelter = (item: string) => {
  if (!managerSelectedSmelters.value.includes(item)) {
    managerSelectedSmelters.value.push(item)
  }
  smelterSearchText.value = ''
  filterSmelterOptions()
}

const removeSmelter = (item: string) => {
  managerSelectedSmelters.value = managerSelectedSmelters.value.filter(i => i !== item)
  filterSmelterOptions()
}

function onSmelterDropdownPick(item: string) {
  if (managerSelectedSmelters.value.includes(item)) removeSmelter(item)
  else addSmelter(item)
}

const handleSmelterKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Enter' && smelterSearchText.value.trim()) {
    addSmelter(smelterSearchText.value.trim())
    e.preventDefault()
  }
}

const closeSmelterDropdown = () => {
  setTimeout(() => {
    smelterDropdownVisible.value = false
  }, 200)
}

function onSmelterFocus() {
  smelterDropdownVisible.value = true
  filterSmelterOptions()
}

function onSmelterSearchInput() {
  smelterDropdownVisible.value = true
  filterSmelterOptions()
}

const focusSmelterInput = () => {
  smelterDropdownVisible.value = true
  filterSmelterOptions()
  nextTick(() => smelterInputRef.value?.focus())
}

// 按大区经理查询
async function queryManagerData() {
  const err = getHistoryFilterValidationError('manager')
  if (err) {
    showError(err)
    return
  }
  loading.value = true
  try {
    const baseParams: Record<string, unknown> = {}

    if (managerFilters.value.startDate) {
      baseParams.date_from = managerFilters.value.startDate
    }
    if (managerFilters.value.endDate) {
      baseParams.date_to = managerFilters.value.endDate
    }
    if (managerSelectedManagers.value.length > 0) {
      baseParams.regional_managers = managerSelectedManagers.value
    }
    if (managerSelectedSmelters.value.length > 0) {
      baseParams.smelters = managerSelectedSmelters.value
    }

    const items = await fetchAllDeliveryHistoryItems(baseParams)

    // 获取所有日期
    const dates = [...new Set(items.map(item => item.delivery_date))].sort().reverse()
    managerDateColumns.value = dates
    
    // 按大区经理+冶炼厂分组汇总重量，并收集该组下所有原始记录主键 id
    const groupMap = new Map<string, { dateMap: Map<string, number>; recordIds: number[] }>()
    items.forEach(item => {
      const smelter = item.smelter || '未知'
      const key = `${item.regional_manager}|${smelter}`
      if (!groupMap.has(key)) {
        groupMap.set(key, { dateMap: new Map(), recordIds: [] })
      }
      const g = groupMap.get(key)!
      g.recordIds.push(item.id)
      const currentWeight = g.dateMap.get(item.delivery_date) || 0
      g.dateMap.set(item.delivery_date, currentWeight + parseFloat(item.weight))
    })
    
    // 生成表格行
    const rows: ManagerTableRow[] = []
    groupMap.forEach((g, key) => {
      const [regional_manager, smelter] = key.split('|')
      const cells = dates.map(date => {
        const weight = g.dateMap.get(date)
        return {
          text: weight !== undefined ? weight.toString() : '—',
          isPlaceholder: weight === undefined
        }
      })
      rows.push({
        id: `${regional_manager}|${smelter}`,
        recordIds: g.recordIds,
        regional_manager,
        smelter: smelter === '未知' ? '-' : smelter,
        cells
      })
    })
    
    managerTableRows.value = rows
    managerTotal.value = rows.length
    managerCurrentPage.value = 1
    managerSelectedRows.value = []
    
  } catch (error) {
    console.error('查询失败', error)
    showError('查询失败', ['请检查网络连接或稍后重试'])
  } finally {
    loading.value = false
  }
}

function resetManagerFilters() {
  managerSelectedManagers.value = []
  managerSearchText.value = ''
  smelterSearchText.value = ''
  applyDefaultHistoryDateRange()
  applyDefaultSmelterSelection()
  clearManagerQueryResults()
}

function toggleManagerSelectAll() {
  if (isManagerAllSelected.value) {
    managerSelectedRows.value = []
  } else {
    managerSelectedRows.value = managerPaginatedRows.value.map(row => row.id)
  }
}

async function handleManagerBatchDelete() {
  if (managerSelectedRows.value.length === 0) return
  if (!confirm(`确认删除选中的${managerSelectedRows.value.length}行？将删除这些行下全部明细记录，此操作不可恢复。`)) return

  const idSet = new Set<number>()
  for (const rowId of managerSelectedRows.value) {
    const row = managerTableRows.value.find((r) => r.id === rowId)
    row?.recordIds.forEach((id) => idSet.add(id))
  }
  const ids = [...idSet]
  if (ids.length === 0) {
    showError('无法删除', ['未找到对应的主键 id，请重新查询后再试'])
    return
  }

  try {
    await axios.delete(ApiPaths.deliveryHistoryBatchDelete, { data: { ids } })
    window.alert(`已成功删除 ${ids.length} 条送货历史记录`)
    managerSelectedRows.value = []
    await refreshDeliveryHistoryDimensionFilters()
    queryManagerData()
  } catch (error: any) {
    console.error('删除失败', error)
    const detail = error.response?.data?.detail
    const msg =
      typeof detail === 'string'
        ? detail
        : Array.isArray(detail)
          ? detail.map((d: { msg?: string }) => d?.msg).filter(Boolean).join('；') || '请稍后重试'
          : error.response?.data?.message || '请稍后重试'
    showError('删除失败', [msg])
  }
}

// ==================== 按仓库查询 ====================
const warehouseTotal = ref(0)
const warehouseCurrentPage = ref(1)
const warehouseSelectedRows = ref<string[]>([])

const warehouseFilters = ref({ startDate: '', endDate: '' })
const warehouseSelectedWarehouses = ref<string[]>([])
const warehouseSelectedManagers = ref<string[]>([])
const warehouseSelectedSmelters = ref<string[]>([])

// 日期列
const warehouseDateColumns = ref<string[]>([])

// 表格行数据
const warehouseTableRows = ref<WarehouseTableRow[]>([])

function warehouseGroupSort(a: WarehouseTableRow, b: WarehouseTableRow) {
  const c = a.warehouse.localeCompare(b.warehouse, 'zh-CN')
  if (c !== 0) return c
  const d = a.regional_manager.localeCompare(b.regional_manager, 'zh-CN')
  if (d !== 0) return d
  return a.smelter.localeCompare(b.smelter, 'zh-CN')
}

const warehouseTotalPages = computed(() =>
  pivotGroupTotalPages(warehouseTableRows.value, (r) => r.warehouse, warehouseGroupSort),
)
const warehousePaginatedRows = computed(() =>
  paginatePivotRowsByGroup(
    warehouseTableRows.value,
    warehouseCurrentPage.value,
    (r) => r.warehouse,
    warehouseGroupSort,
  ),
)

/** 分页后的行 + 仓库列合并（与模板 showWarehouse / warehouseRowspan 对应）；仅保留此一处定义 */
const warehouseDisplayRows = computed(() => {
  const rows = warehousePaginatedRows.value
  const sorted = [...rows].sort((a, b) => {
    const c = a.warehouse.localeCompare(b.warehouse, 'zh-CN')
    if (c !== 0) return c
    const d = a.regional_manager.localeCompare(b.regional_manager, 'zh-CN')
    if (d !== 0) return d
    return a.smelter.localeCompare(b.smelter, 'zh-CN')
  })
  const out: Array<WarehouseTableRow & { showWarehouse: boolean; warehouseRowspan: number }> = []
  let i = 0
  while (i < sorted.length) {
    const wh = sorted[i].warehouse
    let j = i + 1
    while (j < sorted.length && sorted[j].warehouse === wh) j++
    const span = j - i
    for (let k = i; k < j; k++) {
      out.push({
        ...sorted[k],
        showWarehouse: k === i,
        warehouseRowspan: span,
      })
    }
    i = j
  }
  return out
})

// 下拉选项
const warehouseSearchText = ref('')
const warehouseDropdownVisible = ref(false)
const warehouseInputRef = ref<HTMLInputElement>()
const allWarehouseOptions = ref<string[]>([])
const filteredWarehouseOptions = ref<string[]>([])

const warehouseManagerSearchText = ref('')
const filteredWarehouseManagerOptions = ref<string[]>([])

const warehouseSmelterSearchText = ref('')
const warehouseSmelterDropdownVisible = ref(false)
const warehouseSmelterInputRef = ref<HTMLInputElement>()
const filteredWarehouseSmelterOptions = ref<string[]>([])

/** 与送货预测页一致：单行展示，仅 1 个标签 +「+N」 */
const MULTI_PREVIEW_TAG_COUNT = 1

const mfManagersTagsPreview = computed(() => managerSelectedManagers.value.slice(0, MULTI_PREVIEW_TAG_COUNT))
const mfManagersTagsMore = computed(() => Math.max(0, managerSelectedManagers.value.length - MULTI_PREVIEW_TAG_COUNT))
const mfManagersTagsRest = computed(() => managerSelectedManagers.value.slice(MULTI_PREVIEW_TAG_COUNT))

const mfSmeltersTagsPreview = computed(() => managerSelectedSmelters.value.slice(0, MULTI_PREVIEW_TAG_COUNT))
const mfSmeltersTagsMore = computed(() => Math.max(0, managerSelectedSmelters.value.length - MULTI_PREVIEW_TAG_COUNT))
const mfSmeltersTagsRest = computed(() => managerSelectedSmelters.value.slice(MULTI_PREVIEW_TAG_COUNT))

const wfWarehousesTagsPreview = computed(() => warehouseSelectedWarehouses.value.slice(0, MULTI_PREVIEW_TAG_COUNT))
const wfWarehousesTagsMore = computed(() => Math.max(0, warehouseSelectedWarehouses.value.length - MULTI_PREVIEW_TAG_COUNT))
const wfWarehousesTagsRest = computed(() => warehouseSelectedWarehouses.value.slice(MULTI_PREVIEW_TAG_COUNT))

const wfSmeltersTagsPreview = computed(() => warehouseSelectedSmelters.value.slice(0, MULTI_PREVIEW_TAG_COUNT))
const wfSmeltersTagsMore = computed(() => Math.max(0, warehouseSelectedSmelters.value.length - MULTI_PREVIEW_TAG_COUNT))
const wfSmeltersTagsRest = computed(() => warehouseSelectedSmelters.value.slice(MULTI_PREVIEW_TAG_COUNT))

const isWarehouseAllSelected = computed(() => {
  return warehousePaginatedRows.value.length > 0 && warehouseSelectedRows.value.length === warehousePaginatedRows.value.length
})

// 仓库多选逻辑
const filterWarehouseOptions = () => {
  const search = warehouseSearchText.value.toLowerCase()
  filteredWarehouseOptions.value = filterOptionsBySearch(allWarehouseOptions.value, search)
}

const addWarehouse = (item: string) => {
  if (!warehouseSelectedWarehouses.value.includes(item)) {
    warehouseSelectedWarehouses.value.push(item)
  }
  warehouseSearchText.value = ''
  filterWarehouseOptions()
}

const removeWarehouse = (item: string) => {
  warehouseSelectedWarehouses.value = warehouseSelectedWarehouses.value.filter(i => i !== item)
  filterWarehouseOptions()
}

function onWarehouseDropdownPick(item: string) {
  if (warehouseSelectedWarehouses.value.includes(item)) removeWarehouse(item)
  else addWarehouse(item)
}

const handleWarehouseKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Enter' && warehouseSearchText.value.trim()) {
    addWarehouse(warehouseSearchText.value.trim())
    e.preventDefault()
  }
}

const closeWarehouseDropdown = () => {
  setTimeout(() => {
    warehouseDropdownVisible.value = false
  }, 200)
}

function onWarehouseFocus() {
  warehouseDropdownVisible.value = true
  filterWarehouseOptions()
}

function onWarehouseSearchInput() {
  warehouseDropdownVisible.value = true
  filterWarehouseOptions()
}

const focusWarehouseInput = () => {
  warehouseDropdownVisible.value = true
  filterWarehouseOptions()
  nextTick(() => warehouseInputRef.value?.focus())
}

// 大区经理多选逻辑
const filterWarehouseManagerOptions = () => {
  const search = warehouseManagerSearchText.value.toLowerCase()
  filteredWarehouseManagerOptions.value = filterOptionsBySearch(allManagerOptions.value, search)
}

// 冶炼厂多选逻辑
const filterWarehouseSmelterOptions = () => {
  const search = warehouseSmelterSearchText.value.toLowerCase()
  filteredWarehouseSmelterOptions.value = filterOptionsBySearch(allSmelterOptions.value, search)
}

const addWarehouseSmelter = (item: string) => {
  if (!warehouseSelectedSmelters.value.includes(item)) {
    warehouseSelectedSmelters.value.push(item)
  }
  warehouseSmelterSearchText.value = ''
  filterWarehouseSmelterOptions()
}

const removeWarehouseSmelter = (item: string) => {
  warehouseSelectedSmelters.value = warehouseSelectedSmelters.value.filter(i => i !== item)
  filterWarehouseSmelterOptions()
}

function onWarehouseSmelterDropdownPick(item: string) {
  if (warehouseSelectedSmelters.value.includes(item)) removeWarehouseSmelter(item)
  else addWarehouseSmelter(item)
}

const handleWarehouseSmelterKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Enter' && warehouseSmelterSearchText.value.trim()) {
    addWarehouseSmelter(warehouseSmelterSearchText.value.trim())
    e.preventDefault()
  }
}

const closeWarehouseSmelterDropdown = () => {
  setTimeout(() => {
    warehouseSmelterDropdownVisible.value = false
  }, 200)
}

function onWarehouseSmelterFocus() {
  warehouseSmelterDropdownVisible.value = true
  filterWarehouseSmelterOptions()
}

function onWarehouseSmelterSearchInput() {
  warehouseSmelterDropdownVisible.value = true
  filterWarehouseSmelterOptions()
}

const focusWarehouseSmelterInput = () => {
  warehouseSmelterDropdownVisible.value = true
  filterWarehouseSmelterOptions()
  nextTick(() => warehouseSmelterInputRef.value?.focus())
}

// 按仓库查询
async function queryWarehouseData() {
  const err = getHistoryFilterValidationError('warehouse')
  if (err) {
    showError(err)
    return
  }
  loading.value = true
  try {
    const baseParams: Record<string, unknown> = {}

    if (warehouseFilters.value.startDate) {
      baseParams.date_from = warehouseFilters.value.startDate
    }
    if (warehouseFilters.value.endDate) {
      baseParams.date_to = warehouseFilters.value.endDate
    }
    if (warehouseSelectedWarehouses.value.length > 0) {
      baseParams.warehouses = warehouseSelectedWarehouses.value
    }
    if (warehouseSelectedManagers.value.length > 0) {
      baseParams.regional_managers = warehouseSelectedManagers.value
    }
    if (warehouseSelectedSmelters.value.length > 0) {
      baseParams.smelters = warehouseSelectedSmelters.value
    }

    const items = await fetchAllDeliveryHistoryItems(baseParams)

    // 获取所有日期
    const dates = [...new Set(items.map(item => item.delivery_date))].sort().reverse()
    warehouseDateColumns.value = dates

    const latestRmByWarehouse = buildLatestRegionalManagerByWarehouse(
      items,
      (i) => i.warehouse,
      (i) => i.regional_manager,
      (i) => i.delivery_date,
      (i) => i.id,
    )

    // 按仓库+大区经理（取最新关联）+冶炼厂分组汇总
    const groupMap = new Map<string, { dateMap: Map<string, number>; recordIds: number[] }>()
    items.forEach(item => {
      const smelter = item.smelter || '未知'
      const rm = resolveRegionalManagerForWarehouse(
        item.warehouse,
        item.regional_manager,
        latestRmByWarehouse,
      )
      const key = `${item.warehouse}|${rm}|${smelter}`
      if (!groupMap.has(key)) {
        groupMap.set(key, { dateMap: new Map(), recordIds: [] })
      }
      const g = groupMap.get(key)!
      g.recordIds.push(item.id)
      const currentWeight = g.dateMap.get(item.delivery_date) || 0
      g.dateMap.set(item.delivery_date, currentWeight + parseFloat(item.weight))
    })
    
    // 生成表格行
    const rows: WarehouseTableRow[] = []
    groupMap.forEach((g, key) => {
      const [warehouse, regional_manager, smelter] = key.split('|')
      const cells = dates.map(date => {
        const weight = g.dateMap.get(date)
        return {
          text: weight !== undefined ? weight.toString() : '—',
          isPlaceholder: weight === undefined
        }
      })
      rows.push({
        id: `${warehouse}|${regional_manager}|${smelter}`,
        recordIds: g.recordIds,
        warehouse,
        regional_manager,
        smelter: smelter === '未知' ? '-' : smelter,
        cells
      })
    })
    
    warehouseTableRows.value = rows
    warehouseTotal.value = rows.length
    warehouseCurrentPage.value = 1
    warehouseSelectedRows.value = []
    
  } catch (error) {
    console.error('查询失败', error)
    showError('查询失败', ['请检查网络连接或稍后重试'])
  } finally {
    loading.value = false
  }
}

function resetWarehouseFilters() {
  warehouseSelectedWarehouses.value = []
  warehouseSelectedManagers.value = []
  warehouseSearchText.value = ''
  warehouseManagerSearchText.value = ''
  warehouseSmelterSearchText.value = ''
  applyDefaultHistoryDateRange()
  applyDefaultSmelterSelection()
  clearWarehouseQueryResults()
}

function toggleWarehouseSelectAll() {
  if (isWarehouseAllSelected.value) {
    warehouseSelectedRows.value = []
  } else {
    warehouseSelectedRows.value = warehousePaginatedRows.value.map(row => row.id)
  }
}

async function handleWarehouseBatchDelete() {
  if (warehouseSelectedRows.value.length === 0) return
  if (!confirm(`确认删除选中的${warehouseSelectedRows.value.length}行？将删除这些行下全部明细记录，此操作不可恢复。`)) return

  const idSet = new Set<number>()
  for (const rowId of warehouseSelectedRows.value) {
    const row = warehouseTableRows.value.find((r) => r.id === rowId)
    row?.recordIds.forEach((id) => idSet.add(id))
  }
  const ids = [...idSet]
  if (ids.length === 0) {
    showError('无法删除', ['未找到对应的主键 id，请重新查询后再试'])
    return
  }

  try {
    await axios.delete(ApiPaths.deliveryHistoryBatchDelete, { data: { ids } })
    window.alert(`已成功删除 ${ids.length} 条送货历史记录`)
    warehouseSelectedRows.value = []
    await refreshDeliveryHistoryDimensionFilters()
    queryWarehouseData()
  } catch (error: any) {
    console.error('删除失败', error)
    const detail = error.response?.data?.detail
    const msg =
      typeof detail === 'string'
        ? detail
        : Array.isArray(detail)
          ? detail.map((d: { msg?: string }) => d?.msg).filter(Boolean).join('；') || '请稍后重试'
          : error.response?.data?.message || '请稍后重试'
    showError('删除失败', [msg])
  }
}

// ==================== 筛选条件本地记忆（切换页面后再进来自动恢复） ====================
const HISTORY_QUERY_STORAGE_KEY = 'historyQuery.filters.v1'

interface HistoryQueryPersisted {
  activeTab: string
  managerFilters: { startDate: string; endDate: string }
  managerSelectedManagers: string[]
  managerSelectedSmelters: string[]
  warehouseFilters: { startDate: string; endDate: string }
  warehouseSelectedWarehouses: string[]
  warehouseSelectedManagers: string[]
  warehouseSelectedSmelters: string[]
}

function loadPersistedHistoryQuery() {
  try {
    const raw = localStorage.getItem(HISTORY_QUERY_STORAGE_KEY)
    if (!raw) return
    const s = JSON.parse(raw) as Partial<HistoryQueryPersisted>
    if (s.activeTab === 'warehouse' || s.activeTab === 'manager') activeTab.value = s.activeTab
    if (s.managerFilters) {
      managerFilters.value = {
        startDate: typeof s.managerFilters.startDate === 'string' ? s.managerFilters.startDate : '',
        endDate: typeof s.managerFilters.endDate === 'string' ? s.managerFilters.endDate : ''
      }
    }
    if (Array.isArray(s.managerSelectedManagers)) managerSelectedManagers.value = [...s.managerSelectedManagers]
    if (Array.isArray(s.managerSelectedSmelters)) managerSelectedSmelters.value = [...s.managerSelectedSmelters]
    if (s.warehouseFilters) {
      warehouseFilters.value = {
        startDate: typeof s.warehouseFilters.startDate === 'string' ? s.warehouseFilters.startDate : '',
        endDate: typeof s.warehouseFilters.endDate === 'string' ? s.warehouseFilters.endDate : ''
      }
    }
    if (Array.isArray(s.warehouseSelectedWarehouses)) warehouseSelectedWarehouses.value = [...s.warehouseSelectedWarehouses]
    if (Array.isArray(s.warehouseSelectedManagers)) warehouseSelectedManagers.value = [...s.warehouseSelectedManagers]
    if (Array.isArray(s.warehouseSelectedSmelters)) warehouseSelectedSmelters.value = [...s.warehouseSelectedSmelters]
  } catch {
    /* ignore */
  }
}

function savePersistedHistoryQuery() {
  try {
    const payload: HistoryQueryPersisted = {
      activeTab: activeTab.value,
      managerFilters: { ...managerFilters.value },
      managerSelectedManagers: [...managerSelectedManagers.value],
      managerSelectedSmelters: [...managerSelectedSmelters.value],
      warehouseFilters: { ...warehouseFilters.value },
      warehouseSelectedWarehouses: [...warehouseSelectedWarehouses.value],
      warehouseSelectedManagers: [...warehouseSelectedManagers.value],
      warehouseSelectedSmelters: [...warehouseSelectedSmelters.value]
    }
    localStorage.setItem(HISTORY_QUERY_STORAGE_KEY, JSON.stringify(payload))
  } catch {
    /* ignore */
  }
}

let persistDebounce: ReturnType<typeof setTimeout> | null = null
function schedulePersistHistoryQuery() {
  if (persistDebounce) clearTimeout(persistDebounce)
  persistDebounce = setTimeout(() => {
    persistDebounce = null
    savePersistedHistoryQuery()
  }, 400)
}

watch(
  [
    activeTab,
    managerFilters,
    managerSelectedManagers,
    managerSelectedSmelters,
    warehouseFilters,
    warehouseSelectedWarehouses,
    warehouseSelectedManagers,
    warehouseSelectedSmelters
  ],
  schedulePersistHistoryQuery,
  { deep: true }
)

onMounted(async () => {
  loadPersistedHistoryQuery()
  await refreshDeliveryHistoryDimensionFilters()
  applyInitialHistoryFilterDefaults()
})

onBeforeUnmount(() => {
  if (persistDebounce) clearTimeout(persistDebounce)
  savePersistedHistoryQuery()
})
</script>

<style scoped>
.history-query-page { width: 100%; animation: fadeIn 0.25s ease both; }
.query-section { width: 100%; overflow: visible; }
.card { background: white; border-radius: 8px; padding: 16px 20px; margin-bottom: 16px; box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05); animation: fadeInUp 0.3s ease both; }

.filter-card {
  position: relative;
  z-index: 40;
  overflow: visible;
}

.result-card {
  position: relative;
  z-index: 1;
}

.menu-search-bar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
}

.inner-menu {
  display: flex;
  gap: 8px;
  background: #F5F7FA;
  border-radius: 8px;
  padding: 4px;
}

.menu-item {
  padding: 8px 24px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  border-radius: 6px;
  transition: all 0.2s;
  color: #606266;
}

.menu-item:hover {
  background-color: rgba(74, 122, 156, 0.1);
}

.menu-item.active {
  background-color: #1476db;
  color: white;
}

.filter-row {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  align-items: flex-start;
  overflow: visible;
}

.filter-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 140px;
  overflow: visible;
}

.filter-item label {
  font-size: 13px;
  font-weight: 500;
  color: #606266;
}

.date-hint {
  font-size: 11px;
  color: #909399;
  font-weight: normal;
}

.filter-required {
  color: #ef4444;
  margin-left: 2px;
}

.filter-validation-hint {
  margin: 10px 0 0;
  font-size: 13px;
  line-height: 1.5;
  color: #b45309;
}

.date-range {
  display: flex;
  gap: 8px;
  align-items: center;
}

.filter-input {
  padding: 6px 10px;
  border: 1px solid #E5E9F2;
  border-radius: 4px;
  font-size: 13px;
  width: 130px;
}

.filter-actions {
  display: flex;
  gap: 10px;
  flex-shrink: 0;
  margin-left: auto;
}

/* 多选组件样式（与送货量预测页一致：单行固定高度 + 首标签 +「+N」） */
.multi-select-item {
  min-width: 200px;
  max-width: 280px;
}

.multi-select-item--wide {
  min-width: 300px;
  max-width: 380px;
  flex: 1 1 300px;
}

.multi-select-container {
  position: relative;
  width: 100%;
  max-width: 280px;
  overflow: visible;
}

.multi-select-container--wide {
  max-width: 100%;
}

.selected-tags {
  display: flex;
  flex-wrap: nowrap;
  align-items: center;
  gap: 4px;
  padding: 2px 6px;
  border: 1px solid #E5E9F2;
  border-radius: 4px;
  background: white;
  height: 32px;
  min-height: 32px;
  max-height: 32px;
  overflow-x: auto;
  overflow-y: hidden;
  cursor: text;
  box-sizing: border-box;
}

.selected-tags--single {
  height: auto;
  min-height: 32px;
  max-height: none;
  flex-wrap: nowrap;
  overflow: visible;
}

.selected-tags--single .tag {
  max-width: none;
  flex: 1 1 auto;
  min-width: 0;
  overflow: visible;
  text-overflow: clip;
}

.selected-tags--single .multi-input {
  flex: 0 0 24px;
  min-width: 24px;
  width: 24px;
}

.tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 6px;
  background-color: #E8F0F8;
  border-radius: 3px;
  font-size: 12px;
  color: #2c3e50;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 118px;
  flex-shrink: 0;
}

.tag-shrink {
  flex-shrink: 0;
}

.tag-more {
  max-width: none;
  overflow: visible;
  text-overflow: clip;
  background-color: #f0f2f5;
  color: #606266;
  cursor: default;
  flex-shrink: 0;
}

.tag-remove {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 14px;
  color: #909399;
  padding: 0 2px;
}

.tag-remove:hover {
  color: #f56c6c;
}

.multi-input {
  flex: 1 1 48px;
  min-width: 48px;
  width: 0;
  border: none;
  outline: none;
  padding: 2px 4px;
  font-size: 13px;
  background: transparent;
}

.multi-input::placeholder {
  color: #c0c4cc;
}

.dropdown-list {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  max-height: 240px;
  overflow-y: auto;
  background: white;
  border: 1px solid #E5E9F2;
  border-radius: 4px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  z-index: 2500;
  margin-top: 2px;
}

.dropdown-item {
  padding: 8px 12px;
  cursor: pointer;
  font-size: 13px;
  color: #606266;
  text-align: left;
  line-height: 1.45;
  word-break: break-word;
}

.dropdown-item:hover {
  background-color: #F5F7FA;
  color: #1476db
}

.dropdown-item--selected {
  color: #a8abb2;
  background-color: #f5f7fa;
}

.dropdown-item--selected:hover {
  background-color: #ebeef5;
  color: #909399;
}

.btn {
  padding: 6px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.2s;
}

.btn:hover { transform: translateY(-1px); box-shadow: 0 3px 10px rgba(0, 0, 0, 0.12); }
.btn:active { transform: scale(0.97); }

.btn-primary {
  background-color: #1476db;
  color: white;
}
.btn-primary:hover { background-color: #0e65c4; }

.btn-secondary {
  background-color: #F5F7FA;
  color: #606266;
  border: 1px solid #E5E9F2;
}
.btn-secondary:hover { background-color: #E5E9F2; }

.btn-danger {
  background-color: #f56c6c;
  color: white;
}
.btn-danger:hover:not(:disabled) { background-color: #f78989; }
.btn-danger:disabled { opacity: 0.5; cursor: not-allowed; }

.result-label {
  font-size: 14px;
  font-weight: 600;
  color: #2e7d32;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.unit-hint {
  font-size: 13px;
  font-weight: 500;
  color: #64748b;
}

.table-date-unit-note {
  margin: 10px 0 0;
  font-size: 12px;
  line-height: 1.5;
  color: #64748b;
}

.table-wrapper {
  overflow-x: auto;
  border: 1px solid #E5E9F2;
  border-radius: 4px;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.data-table th,
.data-table td {
  padding: 10px 12px;
  text-align: center;
  border-bottom: 1px solid #E5E9F2;
  white-space: nowrap;
}

.data-table th {
  background-color: #E8F0F8;
  font-weight: 600;
  color: #2c3e50;
}

.data-table tbody tr { transition: background 0.15s ease, transform 0.15s ease; }
.data-table tbody tr:hover { background-color: #f0f7ff; transform: scale(1.003); }

.empty-data {
  text-align: center;
  padding: 40px;
  color: #909399;
}

.cell-dash {
  color: #94a3b8;
}

.pagination {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 12px;
  margin-top: 16px;
}

.pagination button {
  padding: 4px 12px;
  border: 1px solid #E5E9F2;
  background: white;
  border-radius: 4px;
  cursor: pointer;
}

.pagination button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pagination select {
  padding: 4px 8px;
  border: 1px solid #E5E9F2;
  border-radius: 4px;
}

/* 弹窗样式 */
.modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  animation: fadeIn 0.2s ease both;
}

.modal-content {
  background: white;
  border-radius: 8px;
  width: 500px;
  max-width: 90%;
  max-height: 80%;
  overflow: auto;
  animation: scaleIn 0.25s ease both;
}

.modal-small {
  width: 450px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #E5E9F2;
}

.modal-header h3 {
  font-size: 16px;
  font-weight: 600;
  color: #1F2D3D;
  margin: 0;
}

.error-header {
  background-color: #ffebee;
  border-bottom-color: #ef9a9a;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #909399;
}

.close-btn:hover {
  color: #606266;
}

.modal-body {
  padding: 20px;
}

.modal-message {
  font-size: 14px;
  color: #606266;
  margin-bottom: 12px;
}

.modal-details {
  background-color: #f5f7fa;
  padding: 12px;
  border-radius: 4px;
  margin-top: 12px;
}

.modal-details ul {
  margin: 0;
  padding-left: 20px;
  font-size: 13px;
  color: #909399;
}

.modal-details li {
  margin: 4px 0;
}

.modal-footer {
  padding: 16px 20px;
  border-top: 1px solid #E5E9F2;
  text-align: right;
}
</style>