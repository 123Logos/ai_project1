<template>
  <div class="forecast-page">
    <!-- 预测结果：与历史数据查询相同的页签与透视表结构（按大区经理 / 按仓库） -->
    <div class="card">
      <div class="menu-search-bar">
        <div class="inner-menu">
          <div
            class="menu-item"
            :class="{ active: forecastActiveTab === 'manager' }"
            @click="forecastActiveTab = 'manager'"
          >
            按大区经理
          </div>
          <div
            class="menu-item"
            :class="{ active: forecastActiveTab === 'warehouse' }"
            @click="forecastActiveTab = 'warehouse'"
          >
            按仓库
          </div>
        </div>
        <button class="btn btn-secondary" @click="exportExcel" :disabled="loading">导出Excel</button>
      </div>
    </div>

    <div v-if="forecastActiveTab === 'manager'" class="query-section">
      <div class="card">
        <div class="filter-row">
          <div class="filter-item">
            <label>送货日期 <span class="date-hint">(最多15天)</span></label>
            <div class="date-range">
              <input
                type="date"
                v-model="forecastMgrFilters.startDate"
                class="filter-input"
                @change="validateMgrForecastDateRange"
              />
              <span>至</span>
              <input
                type="date"
                v-model="forecastMgrFilters.endDate"
                class="filter-input"
                @change="validateMgrForecastDateRange"
              />
            </div>
          </div>

          <div class="filter-item multi-select-item">
            <label>大区经理</label>
            <div class="multi-select-container">
              <div class="selected-tags" @click="focusMgrManagerInput">
                <span v-for="item in mgrManagersTagsPreview" :key="item" class="tag tag-shrink">
                  {{ item }}
                  <button type="button" class="tag-remove" @click.stop="removeMgrManager(item)">×</button>
                </span>
                <span
                  v-if="mgrManagersTagsMore > 0"
                  class="tag tag-more tag-shrink"
                  :title="'还有：' + mgrManagersTagsRest.join('、')"
                >+{{ mgrManagersTagsMore }}</span>
                <input
                  ref="mgrManagerInputRef"
                  v-model="mgrManagerSearchText"
                  type="text"
                  class="multi-input"
                  placeholder="搜索并选择"
                  @input="onMgrManagerSearchInput"
                  @focus="onMgrManagerFocus"
                  @blur="closeMgrManagerDropdown"
                  @keydown.enter="handleMgrManagerKeydown"
                />
              </div>
              <div v-show="mgrManagerDropdownVisible && filteredMgrManagerOptions.length > 0" class="dropdown-list">
                <div
                  v-for="item in filteredMgrManagerOptions"
                  :key="item"
                  class="dropdown-item"
                  :class="{ 'dropdown-item--selected': forecastMgrSelectedManagers.includes(item) }"
                  @mousedown.prevent="onMgrManagerDropdownPick(item)"
                >
                  {{ item }}
                </div>
              </div>
            </div>
          </div>

          <div class="filter-item multi-select-item">
            <label>冶炼厂</label>
            <div class="multi-select-container">
              <div class="selected-tags" @click="focusMgrSmelterInput">
                <span v-for="item in mgrSmeltersTagsPreview" :key="item" class="tag tag-shrink">
                  {{ item }}
                  <button type="button" class="tag-remove" @click.stop="removeMgrSmelter(item)">×</button>
                </span>
                <span
                  v-if="mgrSmeltersTagsMore > 0"
                  class="tag tag-more tag-shrink"
                  :title="'还有：' + mgrSmeltersTagsRest.join('、')"
                >+{{ mgrSmeltersTagsMore }}</span>
                <input
                  ref="mgrSmelterInputRef"
                  v-model="mgrSmelterSearchText"
                  type="text"
                  class="multi-input"
                  placeholder="搜索并选择"
                  @input="onMgrSmelterSearchInput"
                  @focus="onMgrSmelterFocus"
                  @blur="closeMgrSmelterDropdown"
                  @keydown.enter="handleMgrSmelterKeydown"
                />
              </div>
              <div v-show="mgrSmelterDropdownVisible && filteredMgrSmelterOptions.length > 0" class="dropdown-list">
                <div
                  v-for="item in filteredMgrSmelterOptions"
                  :key="item"
                  class="dropdown-item"
                  :class="{ 'dropdown-item--selected': forecastMgrSelectedSmelters.includes(item) }"
                  @mousedown.prevent="onMgrSmelterDropdownPick(item)"
                >
                  {{ item }}
                </div>
              </div>
            </div>
          </div>

          <div class="filter-actions">
            <button class="btn btn-primary" @click="handleQuery" :disabled="loading">
              {{ loading ? '加载中...' : '查询' }}
            </button>
            <button class="btn btn-secondary" @click="handleReset">重置</button>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="result-label">
          <span>按大区经理（共 {{ forecastManagerTotal }} 行）</span>
          <span class="unit-hint">点击任意日期格查看该行预测趋势折线图（下方展示仓库、大区经理、品类）。</span>
        </div>
        <div class="table-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th>大区经理</th>
                <th>冶炼厂</th>
                <th v-for="date in forecastDateColumns" :key="'m-' + date">{{ date }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, idx) in forecastManagerDisplayRows" :key="'fm-' + idx">
                <td v-if="row.showManager" :rowspan="row.managerRowspan">{{ row.regional_manager }}</td>
                <td>{{ row.smelter }}</td>
                <td
                  v-for="(cell, ci) in row.cells"
                  :key="ci"
                  class="cell-clickable"
                  @click="openManagerRowTrend(row)"
                >
                  <span :class="{ 'cell-dash': cell.isPlaceholder }">{{ cell.text }}</span>
                </td>
              </tr>
              <tr v-if="forecastManagerDisplayRows.length === 0">
                <td :colspan="2 + forecastDateColumns.length" class="empty-data">暂无数据</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p class="table-date-unit-note">说明：单元格内数字单位为吨。</p>
        <div class="pagination">
          <button @click="forecastManagerCurrentPage--" :disabled="forecastManagerCurrentPage === 1">上一页</button>
          <span
            >第 {{ forecastManagerCurrentPage }} / {{ forecastManagerTotalPages }} 页（每页 {{ pivotGroupsPerPage }} 个大区经理）</span
          >
          <button @click="forecastManagerCurrentPage++" :disabled="forecastManagerCurrentPage === forecastManagerTotalPages">下一页</button>
        </div>
      </div>
    </div>

    <div v-if="forecastActiveTab === 'warehouse'" class="query-section">
      <div class="card">
        <div class="filter-row">
          <div class="filter-item">
            <label>送货日期 <span class="date-hint">(最多15天)</span></label>
            <div class="date-range">
              <input
                type="date"
                v-model="forecastWhFilters.startDate"
                class="filter-input"
                @change="validateWhForecastDateRange"
              />
              <span>至</span>
              <input
                type="date"
                v-model="forecastWhFilters.endDate"
                class="filter-input"
                @change="validateWhForecastDateRange"
              />
            </div>
          </div>

          <div class="filter-item multi-select-item">
            <label>仓库</label>
            <div class="multi-select-container">
              <div class="selected-tags" @click="focusWhWarehouseInput">
                <span v-for="item in whWarehousesTagsPreview" :key="item" class="tag tag-shrink">
                  {{ item }}
                  <button type="button" class="tag-remove" @click.stop="removeWhWarehouse(item)">×</button>
                </span>
                <span
                  v-if="whWarehousesTagsMore > 0"
                  class="tag tag-more tag-shrink"
                  :title="'还有：' + whWarehousesTagsRest.join('、')"
                >+{{ whWarehousesTagsMore }}</span>
                <input
                  ref="whWarehouseInputRef"
                  v-model="whWarehouseSearchText"
                  type="text"
                  class="multi-input"
                  placeholder="搜索并选择"
                  @input="onWhWarehouseSearchInput"
                  @focus="onWhWarehouseFocus"
                  @blur="closeWhWarehouseDropdown"
                  @keydown.enter="handleWhWarehouseKeydown"
                />
              </div>
              <div v-show="whWarehouseDropdownVisible && filteredWhWarehouseOptions.length > 0" class="dropdown-list">
                <div
                  v-for="item in filteredWhWarehouseOptions"
                  :key="item"
                  class="dropdown-item"
                  :class="{ 'dropdown-item--selected': forecastWhSelectedWarehouses.includes(item) }"
                  @mousedown.prevent="onWhWarehouseDropdownPick(item)"
                >
                  {{ item }}
                </div>
              </div>
            </div>
          </div>

          <div class="filter-item multi-select-item">
            <label>大区经理</label>
            <div class="multi-select-container">
              <div class="selected-tags" @click="focusWhManagerInput">
                <span v-for="item in whManagersTagsPreview" :key="item" class="tag tag-shrink">
                  {{ item }}
                  <button type="button" class="tag-remove" @click.stop="removeWhManager(item)">×</button>
                </span>
                <span
                  v-if="whManagersTagsMore > 0"
                  class="tag tag-more tag-shrink"
                  :title="'还有：' + whManagersTagsRest.join('、')"
                >+{{ whManagersTagsMore }}</span>
                <input
                  ref="whManagerInputRef"
                  v-model="whManagerSearchText"
                  type="text"
                  class="multi-input"
                  placeholder="搜索并选择"
                  @input="onWhManagerSearchInput"
                  @focus="onWhManagerFocus"
                  @blur="closeWhManagerDropdown"
                  @keydown.enter="handleWhManagerKeydown"
                />
              </div>
              <div v-show="whManagerDropdownVisible && filteredWhManagerOptions.length > 0" class="dropdown-list">
                <div
                  v-for="item in filteredWhManagerOptions"
                  :key="item"
                  class="dropdown-item"
                  :class="{ 'dropdown-item--selected': forecastWhSelectedManagers.includes(item) }"
                  @mousedown.prevent="onWhManagerDropdownPick(item)"
                >
                  {{ item }}
                </div>
              </div>
            </div>
          </div>

          <div class="filter-item multi-select-item">
            <label>冶炼厂</label>
            <div class="multi-select-container">
              <div class="selected-tags" @click="focusWhSmelterInput">
                <span v-for="item in whSmeltersTagsPreview" :key="item" class="tag tag-shrink">
                  {{ item }}
                  <button type="button" class="tag-remove" @click.stop="removeWhSmelter(item)">×</button>
                </span>
                <span
                  v-if="whSmeltersTagsMore > 0"
                  class="tag tag-more tag-shrink"
                  :title="'还有：' + whSmeltersTagsRest.join('、')"
                >+{{ whSmeltersTagsMore }}</span>
                <input
                  ref="whSmelterInputRef"
                  v-model="whSmelterSearchText"
                  type="text"
                  class="multi-input"
                  placeholder="搜索并选择"
                  @input="onWhSmelterSearchInput"
                  @focus="onWhSmelterFocus"
                  @blur="closeWhSmelterDropdown"
                  @keydown.enter="handleWhSmelterKeydown"
                />
              </div>
              <div v-show="whSmelterDropdownVisible && filteredWhSmelterOptions.length > 0" class="dropdown-list">
                <div
                  v-for="item in filteredWhSmelterOptions"
                  :key="item"
                  class="dropdown-item"
                  :class="{ 'dropdown-item--selected': forecastWhSelectedSmelters.includes(item) }"
                  @mousedown.prevent="onWhSmelterDropdownPick(item)"
                >
                  {{ item }}
                </div>
              </div>
            </div>
          </div>

          <div class="filter-actions">
            <button class="btn btn-primary" @click="handleQuery" :disabled="loading">
              {{ loading ? '加载中...' : '查询' }}
            </button>
            <button class="btn btn-secondary" @click="handleReset">重置</button>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="result-label">
          <span>按仓库（共 {{ forecastWarehouseTotal }} 行）</span>
          <span class="unit-hint">点击任意日期格查看该行预测趋势折线图</span>
        </div>
        <div class="table-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th>仓库</th>
                <th>大区经理</th>
                <th>冶炼厂</th>
                <th v-for="date in forecastDateColumns" :key="'w-' + date">{{ date }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, idx) in forecastWarehouseDisplayRows" :key="'fw-' + idx">
                <td v-if="row.showWarehouse" :rowspan="row.warehouseRowspan">{{ row.warehouse }}</td>
                <td>{{ row.regional_manager }}</td>
                <td>{{ row.smelter }}</td>
                <td
                  v-for="(cell, ci) in row.cells"
                  :key="ci"
                  class="cell-clickable"
                  @click="openWarehouseRowTrend(row)"
                >
                  <span :class="{ 'cell-dash': cell.isPlaceholder }">{{ cell.text }}</span>
                </td>
              </tr>
              <tr v-if="forecastWarehouseDisplayRows.length === 0">
                <td :colspan="3 + forecastDateColumns.length" class="empty-data">暂无数据</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p class="table-date-unit-note">说明：单元格内数字单位为吨。</p>
        <div class="pagination">
          <button @click="forecastWarehouseCurrentPage--" :disabled="forecastWarehouseCurrentPage === 1">上一页</button>
          <span
            >第 {{ forecastWarehouseCurrentPage }} / {{ forecastWarehouseTotalPages }} 页（每页 {{ pivotGroupsPerPage }} 个仓库）</span
          >
          <button @click="forecastWarehouseCurrentPage++" :disabled="forecastWarehouseCurrentPage === forecastWarehouseTotalPages">下一页</button>
        </div>
      </div>
    </div>

    <!-- 行趋势弹窗：折线图 + 仓库 / 大区经理 / 品类 -->
    <div v-if="modalVisible" class="modal" @click.self="closeModal">
      <div class="modal-content modal-content-chart">
        <div class="modal-header">
          <h3>{{ modalTitle }}</h3>
          <button class="close-btn" @click="closeModal">&times;</button>
        </div>
        <div class="modal-body">
          <div class="modal-chart-wrap">
            <canvas ref="rowTrendCanvas"></canvas>
          </div>
          <div class="modal-chart-meta">
            <p><strong>仓库：</strong>{{ modalChartMeta?.warehouse }}</p>
            <p><strong>大区经理：</strong>{{ modalChartMeta?.regional_manager }}</p>
            <p><strong>品类：</strong>{{ modalChartMeta?.product_variety }}</p>
            <p v-if="modalChartMeta?.smelter"><strong>冶炼厂：</strong>{{ modalChartMeta.smelter }}</p>
          </div>
          <div class="modal-chart-actions">
            <button class="btn btn-sm btn-secondary" @click="exportRowTrendCsv">导出趋势CSV</button>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="closeModal">关闭</button>
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
import { ref, computed, onMounted, onBeforeUnmount, nextTick, watch, type Ref } from 'vue'
import axios from 'axios'
import { ApiPaths } from '../api/paths'
import { FORECAST_DETAILS_FETCH_PAGE_SIZE } from '../api/fetchLimits'
import { fetchForecastDimensionOptions } from '../api/dimensionOptions'
import {
  PIVOT_GROUPS_PER_PAGE,
  paginatePivotRowsByGroup,
  pivotGroupTotalPages,
} from '../utils/pivotTablePagination'

const pivotGroupsPerPage = PIVOT_GROUPS_PER_PAGE

// ==================== 类型定义 ====================
/** 与「送货量预测/明细」接口 items 项一致 */
interface ForecastDetailItem {
  target_date: string
  regional_manager?: string
  smelter?: string | null
  warehouse?: string
  product_variety?: string
  predicted_weight: string
  wma_base?: string
  week_coef?: string
}

interface ForecastPivotCell {
  text: string
  isPlaceholder: boolean
}

interface ForecastManagerTableRow {
  id: string
  regional_manager: string
  smelter: string
  cells: ForecastPivotCell[]
}

interface ForecastWarehouseTableRow {
  id: string
  warehouse: string
  regional_manager: string
  smelter: string
  cells: ForecastPivotCell[]
}

/** 折线图下方展示 */
interface ForecastChartMeta {
  warehouse: string
  regional_manager: string
  product_variety: string
  /** 按大区经理视图时有 */
  smelter?: string
}

// ==================== 状态 ====================
const loading = ref(false)
const detailData = ref<ForecastDetailItem[]>([])

const forecastActiveTab = ref<'manager' | 'warehouse'>('manager')
const forecastDateColumns = ref<string[]>([])
const forecastManagerTableRows = ref<ForecastManagerTableRow[]>([])
const forecastWarehouseTableRows = ref<ForecastWarehouseTableRow[]>([])

const forecastManagerCurrentPage = ref(1)
const forecastWarehouseCurrentPage = ref(1)

const forecastManagerTotal = computed(() => forecastManagerTableRows.value.length)
const forecastWarehouseTotal = computed(() => forecastWarehouseTableRows.value.length)

function forecastManagerGroupSort(a: ForecastManagerTableRow, b: ForecastManagerTableRow) {
  const c = a.regional_manager.localeCompare(b.regional_manager, 'zh-CN')
  if (c !== 0) return c
  return a.smelter.localeCompare(b.smelter, 'zh-CN')
}

const forecastManagerTotalPages = computed(() =>
  pivotGroupTotalPages(forecastManagerTableRows.value, (r) => r.regional_manager, forecastManagerGroupSort),
)
const forecastManagerPaginatedRows = computed(() =>
  paginatePivotRowsByGroup(
    forecastManagerTableRows.value,
    forecastManagerCurrentPage.value,
    (r) => r.regional_manager,
    forecastManagerGroupSort,
  ),
)

const forecastManagerDisplayRows = computed(() => {
  const rows = forecastManagerPaginatedRows.value
  const sorted = [...rows].sort((a, b) => {
    const c = a.regional_manager.localeCompare(b.regional_manager, 'zh-CN')
    if (c !== 0) return c
    return a.smelter.localeCompare(b.smelter, 'zh-CN')
  })
  const out: Array<ForecastManagerTableRow & { showManager: boolean; managerRowspan: number }> = []
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
        managerRowspan: span,
      })
    }
    i = j
  }
  return out
})

function forecastWarehouseGroupSort(a: ForecastWarehouseTableRow, b: ForecastWarehouseTableRow) {
  const c = a.warehouse.localeCompare(b.warehouse, 'zh-CN')
  if (c !== 0) return c
  const d = a.regional_manager.localeCompare(b.regional_manager, 'zh-CN')
  if (d !== 0) return d
  return a.smelter.localeCompare(b.smelter, 'zh-CN')
}

const forecastWarehouseTotalPages = computed(() =>
  pivotGroupTotalPages(forecastWarehouseTableRows.value, (r) => r.warehouse, forecastWarehouseGroupSort),
)
const forecastWarehousePaginatedRows = computed(() =>
  paginatePivotRowsByGroup(
    forecastWarehouseTableRows.value,
    forecastWarehouseCurrentPage.value,
    (r) => r.warehouse,
    forecastWarehouseGroupSort,
  ),
)

const forecastWarehouseDisplayRows = computed(() => {
  const rows = forecastWarehousePaginatedRows.value
  const sorted = [...rows].sort((a, b) => {
    const c = a.warehouse.localeCompare(b.warehouse, 'zh-CN')
    if (c !== 0) return c
    const d = a.regional_manager.localeCompare(b.regional_manager, 'zh-CN')
    if (d !== 0) return d
    return a.smelter.localeCompare(b.smelter, 'zh-CN')
  })
  const out: Array<ForecastWarehouseTableRow & { showWarehouse: boolean; warehouseRowspan: number }> = []
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

// 错误弹窗
const errorModalVisible = ref(false)
const errorModalMessage = ref('')
const errorModalDetails = ref<string[]>([])

// 筛选条件（与历史数据查询页一致：两种页签各自独立一套字段）

/** 按大区经理：送货日期、大区经理、冶炼厂 */
const forecastMgrFilters = ref({ startDate: '', endDate: '' })
const forecastMgrSelectedManagers = ref<string[]>([])
const mgrManagerSearchText = ref('')
const mgrManagerDropdownVisible = ref(false)
const mgrManagerInputRef = ref<HTMLInputElement>()
const filteredMgrManagerOptions = ref<string[]>([])

const forecastMgrSelectedSmelters = ref<string[]>([])
const mgrSmelterSearchText = ref('')
const mgrSmelterDropdownVisible = ref(false)
const mgrSmelterInputRef = ref<HTMLInputElement>()
const filteredMgrSmelterOptions = ref<string[]>([])

/** 按仓库：送货日期、仓库、大区经理、冶炼厂 */
const forecastWhFilters = ref({ startDate: '', endDate: '' })
const forecastWhSelectedWarehouses = ref<string[]>([])
const whWarehouseSearchText = ref('')
const whWarehouseDropdownVisible = ref(false)
const whWarehouseInputRef = ref<HTMLInputElement>()
const filteredWhWarehouseOptions = ref<string[]>([])

const forecastWhSelectedManagers = ref<string[]>([])
const whManagerSearchText = ref('')
const whManagerDropdownVisible = ref(false)
const whManagerInputRef = ref<HTMLInputElement>()
const filteredWhManagerOptions = ref<string[]>([])

const forecastWhSelectedSmelters = ref<string[]>([])
const whSmelterSearchText = ref('')
const whSmelterDropdownVisible = ref(false)
const whSmelterInputRef = ref<HTMLInputElement>()
const filteredWhSmelterOptions = ref<string[]>([])

const allWarehouseOptions = ref<string[]>([])
const allManagerOptions = ref<string[]>([])
const allSmelterOptions = ref<string[]>([])

const MULTI_PREVIEW_TAG_COUNT = 1

const mgrManagersTagsPreview = computed(() => forecastMgrSelectedManagers.value.slice(0, MULTI_PREVIEW_TAG_COUNT))
const mgrManagersTagsMore = computed(() =>
  Math.max(0, forecastMgrSelectedManagers.value.length - MULTI_PREVIEW_TAG_COUNT)
)
const mgrManagersTagsRest = computed(() => forecastMgrSelectedManagers.value.slice(MULTI_PREVIEW_TAG_COUNT))

const mgrSmeltersTagsPreview = computed(() => forecastMgrSelectedSmelters.value.slice(0, MULTI_PREVIEW_TAG_COUNT))
const mgrSmeltersTagsMore = computed(() =>
  Math.max(0, forecastMgrSelectedSmelters.value.length - MULTI_PREVIEW_TAG_COUNT)
)
const mgrSmeltersTagsRest = computed(() => forecastMgrSelectedSmelters.value.slice(MULTI_PREVIEW_TAG_COUNT))

const whWarehousesTagsPreview = computed(() => forecastWhSelectedWarehouses.value.slice(0, MULTI_PREVIEW_TAG_COUNT))
const whWarehousesTagsMore = computed(() =>
  Math.max(0, forecastWhSelectedWarehouses.value.length - MULTI_PREVIEW_TAG_COUNT)
)
const whWarehousesTagsRest = computed(() => forecastWhSelectedWarehouses.value.slice(MULTI_PREVIEW_TAG_COUNT))

const whManagersTagsPreview = computed(() => forecastWhSelectedManagers.value.slice(0, MULTI_PREVIEW_TAG_COUNT))
const whManagersTagsMore = computed(() =>
  Math.max(0, forecastWhSelectedManagers.value.length - MULTI_PREVIEW_TAG_COUNT)
)
const whManagersTagsRest = computed(() => forecastWhSelectedManagers.value.slice(MULTI_PREVIEW_TAG_COUNT))

const whSmeltersTagsPreview = computed(() => forecastWhSelectedSmelters.value.slice(0, MULTI_PREVIEW_TAG_COUNT))
const whSmeltersTagsMore = computed(() =>
  Math.max(0, forecastWhSelectedSmelters.value.length - MULTI_PREVIEW_TAG_COUNT)
)
const whSmeltersTagsRest = computed(() => forecastWhSelectedSmelters.value.slice(MULTI_PREVIEW_TAG_COUNT))

// 弹窗
const modalVisible = ref(false)
const modalTitle = ref('')
const modalChartMeta = ref<ForecastChartMeta | null>(null)
const modalChartDates = ref<string[]>([])
const modalChartValues = ref<number[]>([])
const rowTrendCanvas = ref<HTMLCanvasElement>()

// ==================== 错误弹窗 ====================
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

// ==================== 验证日期范围（预测最多 15 天） ====================
function validateForecastDateRange(f: Ref<{ startDate: string; endDate: string }>) {
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

function validateMgrForecastDateRange() {
  validateForecastDateRange(forecastMgrFilters)
}

function validateWhForecastDateRange() {
  validateForecastDateRange(forecastWhFilters)
}

// ==================== 过滤选项 ====================
function filterOptionsBySearch(options: string[], searchLower: string) {
  if (!searchLower) return [...options]
  return options.filter((opt) => opt.toLowerCase().includes(searchLower))
}

function refreshAllFilterOptionLists() {
  filterWhWarehouseOptions()
  filterWhManagerOptions()
  filterWhSmelterOptions()
  filterMgrManagerOptions()
  filterMgrSmelterOptions()
}

// ==================== 获取下拉选项（PRD 规则预测：/forecast/dimension-options） ====================
async function fetchOptions() {
  try {
    const dims = await fetchForecastDimensionOptions()
    allWarehouseOptions.value = dims.warehouses
    allManagerOptions.value = dims.regional_managers
    allSmelterOptions.value = dims.smelters

    refreshAllFilterOptionLists()
  } catch (error) {
    console.error('获取选项失败', error)
    allWarehouseOptions.value = []
    allManagerOptions.value = []
    allSmelterOptions.value = []
    refreshAllFilterOptionLists()
  }
}

/** 从「送货量预测/明细」返回的 items 合并冶炼厂到下拉（去重、中文排序） */
function mergeSmelterOptionsFromForecastItems(items: ForecastDetailItem[]) {
  const merged = new Set<string>(allSmelterOptions.value)
  for (const d of items) {
    const s = d.smelter
    if (s == null) continue
    const t = String(s).trim()
    if (t !== '') merged.add(t)
  }
  allSmelterOptions.value = [...merged].sort((a, b) => a.localeCompare(b, 'zh-CN'))
  filterMgrSmelterOptions()
  filterWhSmelterOptions()
}

// ---------- 按大区经理：大区经理 ----------
const filterMgrManagerOptions = () => {
  const search = mgrManagerSearchText.value.toLowerCase()
  filteredMgrManagerOptions.value = filterOptionsBySearch(allManagerOptions.value, search)
}

function onMgrManagerFocus() {
  mgrManagerDropdownVisible.value = true
  filterMgrManagerOptions()
}

function onMgrManagerSearchInput() {
  mgrManagerDropdownVisible.value = true
  filterMgrManagerOptions()
}

const addMgrManager = (item: string) => {
  if (!forecastMgrSelectedManagers.value.includes(item)) forecastMgrSelectedManagers.value.push(item)
  mgrManagerSearchText.value = ''
  filterMgrManagerOptions()
}

const removeMgrManager = (item: string) => {
  forecastMgrSelectedManagers.value = forecastMgrSelectedManagers.value.filter((i) => i !== item)
  filterMgrManagerOptions()
}

function onMgrManagerDropdownPick(item: string) {
  if (forecastMgrSelectedManagers.value.includes(item)) removeMgrManager(item)
  else addMgrManager(item)
}

const handleMgrManagerKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Enter' && mgrManagerSearchText.value.trim()) {
    addMgrManager(mgrManagerSearchText.value.trim())
    e.preventDefault()
  }
}

const closeMgrManagerDropdown = () => {
  setTimeout(() => {
    mgrManagerDropdownVisible.value = false
  }, 200)
}

const focusMgrManagerInput = () => {
  mgrManagerDropdownVisible.value = true
  filterMgrManagerOptions()
  nextTick(() => mgrManagerInputRef.value?.focus())
}

// ---------- 按大区经理：冶炼厂 ----------
const filterMgrSmelterOptions = () => {
  const search = mgrSmelterSearchText.value.toLowerCase()
  filteredMgrSmelterOptions.value = filterOptionsBySearch(allSmelterOptions.value, search)
}

function onMgrSmelterFocus() {
  mgrSmelterDropdownVisible.value = true
  filterMgrSmelterOptions()
}

function onMgrSmelterSearchInput() {
  mgrSmelterDropdownVisible.value = true
  filterMgrSmelterOptions()
}

const addMgrSmelter = (item: string) => {
  if (!forecastMgrSelectedSmelters.value.includes(item)) forecastMgrSelectedSmelters.value.push(item)
  mgrSmelterSearchText.value = ''
  filterMgrSmelterOptions()
}

const removeMgrSmelter = (item: string) => {
  forecastMgrSelectedSmelters.value = forecastMgrSelectedSmelters.value.filter((i) => i !== item)
  filterMgrSmelterOptions()
}

function onMgrSmelterDropdownPick(item: string) {
  if (forecastMgrSelectedSmelters.value.includes(item)) removeMgrSmelter(item)
  else addMgrSmelter(item)
}

const handleMgrSmelterKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Enter' && mgrSmelterSearchText.value.trim()) {
    addMgrSmelter(mgrSmelterSearchText.value.trim())
    e.preventDefault()
  }
}

const closeMgrSmelterDropdown = () => {
  setTimeout(() => {
    mgrSmelterDropdownVisible.value = false
  }, 200)
}

const focusMgrSmelterInput = () => {
  mgrSmelterDropdownVisible.value = true
  filterMgrSmelterOptions()
  nextTick(() => mgrSmelterInputRef.value?.focus())
}

// ---------- 按仓库：仓库 ----------
const filterWhWarehouseOptions = () => {
  const search = whWarehouseSearchText.value.toLowerCase()
  filteredWhWarehouseOptions.value = filterOptionsBySearch(allWarehouseOptions.value, search)
}

function onWhWarehouseFocus() {
  whWarehouseDropdownVisible.value = true
  filterWhWarehouseOptions()
}

function onWhWarehouseSearchInput() {
  whWarehouseDropdownVisible.value = true
  filterWhWarehouseOptions()
}

const addWhWarehouse = (item: string) => {
  if (!forecastWhSelectedWarehouses.value.includes(item)) forecastWhSelectedWarehouses.value.push(item)
  whWarehouseSearchText.value = ''
  filterWhWarehouseOptions()
}

const removeWhWarehouse = (item: string) => {
  forecastWhSelectedWarehouses.value = forecastWhSelectedWarehouses.value.filter((i) => i !== item)
  filterWhWarehouseOptions()
}

function onWhWarehouseDropdownPick(item: string) {
  if (forecastWhSelectedWarehouses.value.includes(item)) removeWhWarehouse(item)
  else addWhWarehouse(item)
}

const handleWhWarehouseKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Enter' && whWarehouseSearchText.value.trim()) {
    addWhWarehouse(whWarehouseSearchText.value.trim())
    e.preventDefault()
  }
}

const closeWhWarehouseDropdown = () => {
  setTimeout(() => {
    whWarehouseDropdownVisible.value = false
  }, 200)
}

const focusWhWarehouseInput = () => {
  whWarehouseDropdownVisible.value = true
  filterWhWarehouseOptions()
  nextTick(() => whWarehouseInputRef.value?.focus())
}

// ---------- 按仓库：大区经理 ----------
const filterWhManagerOptions = () => {
  const search = whManagerSearchText.value.toLowerCase()
  filteredWhManagerOptions.value = filterOptionsBySearch(allManagerOptions.value, search)
}

function onWhManagerFocus() {
  whManagerDropdownVisible.value = true
  filterWhManagerOptions()
}

function onWhManagerSearchInput() {
  whManagerDropdownVisible.value = true
  filterWhManagerOptions()
}

const addWhManager = (item: string) => {
  if (!forecastWhSelectedManagers.value.includes(item)) forecastWhSelectedManagers.value.push(item)
  whManagerSearchText.value = ''
  filterWhManagerOptions()
}

const removeWhManager = (item: string) => {
  forecastWhSelectedManagers.value = forecastWhSelectedManagers.value.filter((i) => i !== item)
  filterWhManagerOptions()
}

function onWhManagerDropdownPick(item: string) {
  if (forecastWhSelectedManagers.value.includes(item)) removeWhManager(item)
  else addWhManager(item)
}

const handleWhManagerKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Enter' && whManagerSearchText.value.trim()) {
    addWhManager(whManagerSearchText.value.trim())
    e.preventDefault()
  }
}

const closeWhManagerDropdown = () => {
  setTimeout(() => {
    whManagerDropdownVisible.value = false
  }, 200)
}

const focusWhManagerInput = () => {
  whManagerDropdownVisible.value = true
  filterWhManagerOptions()
  nextTick(() => whManagerInputRef.value?.focus())
}

// ---------- 按仓库：冶炼厂 ----------
const filterWhSmelterOptions = () => {
  const search = whSmelterSearchText.value.toLowerCase()
  filteredWhSmelterOptions.value = filterOptionsBySearch(allSmelterOptions.value, search)
}

function onWhSmelterFocus() {
  whSmelterDropdownVisible.value = true
  filterWhSmelterOptions()
}

function onWhSmelterSearchInput() {
  whSmelterDropdownVisible.value = true
  filterWhSmelterOptions()
}

const addWhSmelter = (item: string) => {
  if (!forecastWhSelectedSmelters.value.includes(item)) forecastWhSelectedSmelters.value.push(item)
  whSmelterSearchText.value = ''
  filterWhSmelterOptions()
}

const removeWhSmelter = (item: string) => {
  forecastWhSelectedSmelters.value = forecastWhSelectedSmelters.value.filter((i) => i !== item)
  filterWhSmelterOptions()
}

function onWhSmelterDropdownPick(item: string) {
  if (forecastWhSelectedSmelters.value.includes(item)) removeWhSmelter(item)
  else addWhSmelter(item)
}

const handleWhSmelterKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Enter' && whSmelterSearchText.value.trim()) {
    addWhSmelter(whSmelterSearchText.value.trim())
    e.preventDefault()
  }
}

const closeWhSmelterDropdown = () => {
  setTimeout(() => {
    whSmelterDropdownVisible.value = false
  }, 200)
}

const focusWhSmelterInput = () => {
  whSmelterDropdownVisible.value = true
  filterWhSmelterOptions()
  nextTick(() => whSmelterInputRef.value?.focus())
}

// ==================== 构建筛选参数 ====================
function buildForecastFilterParams(): Record<string, any> {
  const params: Record<string, any> = {}
  if (forecastActiveTab.value === 'manager') {
    const f = forecastMgrFilters.value
    if (f.startDate) params.date_from = f.startDate
    if (f.endDate) params.date_to = f.endDate
    if (forecastMgrSelectedManagers.value.length > 0) {
      params.regional_managers = forecastMgrSelectedManagers.value
    }
    if (forecastMgrSelectedSmelters.value.length > 0) {
      params.smelters = forecastMgrSelectedSmelters.value
    }
  } else {
    const f = forecastWhFilters.value
    if (f.startDate) params.date_from = f.startDate
    if (f.endDate) params.date_to = f.endDate
    if (forecastWhSelectedWarehouses.value.length > 0) {
      params.warehouses = forecastWhSelectedWarehouses.value
    }
    if (forecastWhSelectedManagers.value.length > 0) {
      params.regional_managers = forecastWhSelectedManagers.value
    }
    if (forecastWhSelectedSmelters.value.length > 0) {
      params.smelters = forecastWhSelectedSmelters.value
    }
  }
  return params
}

function smelterKey(s: string | null | undefined) {
  const t = s?.trim()
  return t ? t : '未知'
}

function rebuildForecastPivotFromDetail(items: ForecastDetailItem[]) {
  const dates = [...new Set(items.map((i) => i.target_date))].sort()
  forecastDateColumns.value = dates

  const cellFor = (dateMap: Map<string, number>, date: string): ForecastPivotCell => {
    const weight = dateMap.get(date)
    return {
      text: weight !== undefined ? weight.toFixed(2) : '—',
      isPlaceholder: weight === undefined,
    }
  }

  const mgrMap = new Map<string, Map<string, number>>()
  const whMap = new Map<string, Map<string, number>>()

  items.forEach((item) => {
    const smelterRaw = smelterKey(item.smelter)
    const rmRaw = item.regional_manager || '未知'
    const whRaw = item.warehouse || '未知'
    const w = parseFloat(item.predicted_weight)
    const wt = Number.isNaN(w) ? 0 : w

    const mk = `${rmRaw}|${smelterRaw}`
    if (!mgrMap.has(mk)) mgrMap.set(mk, new Map())
    const md = mgrMap.get(mk)!
    md.set(item.target_date, (md.get(item.target_date) || 0) + wt)

    const wk = `${whRaw}|${rmRaw}|${smelterRaw}`
    if (!whMap.has(wk)) whMap.set(wk, new Map())
    const wd = whMap.get(wk)!
    wd.set(item.target_date, (wd.get(item.target_date) || 0) + wt)
  })

  const managerRows: ForecastManagerTableRow[] = []
  mgrMap.forEach((dateMap, key) => {
    const [rmRaw, smelterRaw] = key.split('|')
    managerRows.push({
      id: key,
      regional_manager: rmRaw === '未知' ? '-' : rmRaw,
      smelter: smelterRaw === '未知' ? '-' : smelterRaw,
      cells: dates.map((d) => cellFor(dateMap, d)),
    })
  })

  const warehouseRows: ForecastWarehouseTableRow[] = []
  whMap.forEach((dateMap, key) => {
    const [whRaw, rmRaw, smelterRaw] = key.split('|')
    warehouseRows.push({
      id: key,
      warehouse: whRaw === '未知' ? '-' : whRaw,
      regional_manager: rmRaw === '未知' ? '-' : rmRaw,
      smelter: smelterRaw === '未知' ? '-' : smelterRaw,
      cells: dates.map((d) => cellFor(dateMap, d)),
    })
  })

  forecastManagerTableRows.value = managerRows
  forecastWarehouseTableRows.value = warehouseRows
  forecastManagerCurrentPage.value = 1
  forecastWarehouseCurrentPage.value = 1
}

// ==================== 从「送货量预测/明细」拉取并填充透视表 ====================
async function fetchDetailData() {
  loading.value = true
  try {
    const base = buildForecastFilterParams()
    const page_size = FORECAST_DETAILS_FETCH_PAGE_SIZE
    const all: ForecastDetailItem[] = []
    let page = 1

    while (page <= 200) {
      const params: Record<string, any> = {
        ...base,
        page,
        page_size,
      }
      const response = await axios.get(ApiPaths.forecastDetail, { params })
      const data = response.data as { items?: ForecastDetailItem[]; total?: number }
      const items = data.items || []
      all.push(...items)
      if (items.length === 0) break
      if (items.length < page_size) break
      if (typeof data.total === 'number' && all.length >= data.total) break
      page++
    }

    detailData.value = all
    rebuildForecastPivotFromDetail(all)
    mergeSmelterOptionsFromForecastItems(all)
  } catch (error: any) {
    console.error('获取预测明细失败', error)
    detailData.value = []
    rebuildForecastPivotFromDetail([])
    const data = error.response?.data
    const msg =
      (typeof data?.message === 'string' && data.message) ||
      (typeof data?.detail === 'string' && data.detail) ||
      error.message ||
      '获取预测明细失败'
    showError(msg, ['请检查网络或筛选条件后重试'])
  } finally {
    loading.value = false
  }
}

// ==================== 查询 ====================
async function handleQuery() {
  await fetchDetailData()
}

function handleReset() {
  if (forecastActiveTab.value === 'manager') {
    forecastMgrFilters.value = { startDate: '', endDate: '' }
    forecastMgrSelectedManagers.value = []
    forecastMgrSelectedSmelters.value = []
    mgrManagerSearchText.value = ''
    mgrSmelterSearchText.value = ''
  } else {
    forecastWhFilters.value = { startDate: '', endDate: '' }
    forecastWhSelectedWarehouses.value = []
    forecastWhSelectedManagers.value = []
    forecastWhSelectedSmelters.value = []
    whWarehouseSearchText.value = ''
    whManagerSearchText.value = ''
    whSmelterSearchText.value = ''
  }
  handleQuery()
}

function parseCellWeight(cell: ForecastPivotCell): number {
  if (cell.isPlaceholder) return 0
  const n = parseFloat(cell.text.replace(/,/g, ''))
  return Number.isNaN(n) ? 0 : n
}

function openManagerRowTrend(row: ForecastManagerTableRow) {
  const dates = forecastDateColumns.value
  const values = row.cells.map((c) => parseCellWeight(c))
  const [rmRaw, smelterRaw] = row.id.split('|')
  const slice = detailData.value.filter(
    (d) => (d.regional_manager || '未知') === rmRaw && smelterKey(d.smelter) === smelterRaw
  )
  const whs = [
    ...new Set(slice.map((d) => d.warehouse?.trim()).filter((x): x is string => !!x)),
  ].sort((a, b) => a.localeCompare(b, 'zh-CN'))
  const vars = [
    ...new Set(slice.map((d) => d.product_variety?.trim()).filter((x): x is string => !!x)),
  ].sort((a, b) => a.localeCompare(b, 'zh-CN'))

  modalChartMeta.value = {
    warehouse: whs.length > 0 ? whs.join('、') : '—',
    regional_manager: row.regional_manager,
    product_variety: vars.length > 0 ? vars.join('、') : '—',
    smelter: row.smelter,
  }
  modalTitle.value = `预测趋势：${row.regional_manager} · ${row.smelter}`
  modalChartDates.value = [...dates]
  modalChartValues.value = values
  modalVisible.value = true
}

function openWarehouseRowTrend(row: ForecastWarehouseTableRow) {
  const dates = forecastDateColumns.value
  const values = row.cells.map((c) => parseCellWeight(c))
  const [whRaw, rmRaw, smelterRaw] = row.id.split('|')
  const slice = detailData.value.filter(
    (d) =>
      (d.warehouse || '未知') === whRaw &&
      (d.regional_manager || '未知') === rmRaw &&
      smelterKey(d.smelter) === smelterRaw
  )
  const vars = [
    ...new Set(slice.map((d) => d.product_variety?.trim()).filter((x): x is string => !!x)),
  ].sort((a, b) => a.localeCompare(b, 'zh-CN'))

  modalChartMeta.value = {
    warehouse: row.warehouse,
    regional_manager: row.regional_manager,
    product_variety: vars.length > 0 ? vars.join('、') : '—',
    smelter: row.smelter,
  }
  modalTitle.value = `预测趋势：${row.warehouse} · ${row.regional_manager} · ${row.smelter}`
  modalChartDates.value = [...dates]
  modalChartValues.value = values
  modalVisible.value = true
}

function closeModal() {
  modalVisible.value = false
  modalChartMeta.value = null
  modalChartDates.value = []
  modalChartValues.value = []
}

function drawRowTrendChart() {
  const canvas = rowTrendCanvas.value
  if (!canvas) return
  const dates = modalChartDates.value
  const values = modalChartValues.value
  if (dates.length === 0) return

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const wrap = canvas.parentElement
  const width = Math.max((wrap?.clientWidth ?? 560) - 8, 320)
  const height = 300
  canvas.width = width
  canvas.height = height

  const margin = { t: 20, r: 16, b: 44, l: 64 }
  const W = width - margin.l - margin.r
  const H = height - margin.t - margin.b
  const n = dates.length

  const maxV = Math.max(...values, 0)
  const maxY = maxV <= 0 ? 1 : maxV * 1.08

  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, width, height)

  ctx.strokeStyle = '#d1d5db'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(margin.l, margin.t)
  ctx.lineTo(margin.l, margin.t + H)
  ctx.lineTo(margin.l + W, margin.t + H)
  ctx.stroke()

  const ySteps = 5
  ctx.font = '11px system-ui, sans-serif'
  ctx.fillStyle = '#64748b'
  for (let i = 0; i <= ySteps; i++) {
    const y = margin.t + H - (i / ySteps) * H
    const val = (i / ySteps) * maxY
    ctx.strokeStyle = '#f1f5f9'
    ctx.beginPath()
    ctx.moveTo(margin.l, y)
    ctx.lineTo(margin.l + W, y)
    ctx.stroke()
    ctx.fillText(val.toFixed(2), 4, y + 4)
  }

  const xStep = n <= 1 ? W / 2 : W / (n - 1)

  ctx.strokeStyle = '#1476db'
  ctx.lineWidth = 2
  ctx.beginPath()
  values.forEach((v, i) => {
    const x = margin.l + i * xStep
    const y = margin.t + H - (v / maxY) * H
    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  })
  ctx.stroke()

  ctx.fillStyle = '#1476db'
  values.forEach((v, i) => {
    const x = margin.l + i * xStep
    const y = margin.t + H - (v / maxY) * H
    ctx.beginPath()
    ctx.arc(x, y, 4, 0, Math.PI * 2)
    ctx.fill()
  })

  // 每个趋势点常显具体数值（与电子地图页送货量预测图一致）
  ctx.font = '11px system-ui, sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'bottom'
  values.forEach((v, i) => {
    const x = margin.l + i * xStep
    const y = margin.t + H - (v / maxY) * H
    const label = Number.isFinite(v) ? v.toFixed(2) : '0.00'
    const boxW = Math.max(28, label.length * 7 + 6)
    const boxH = 16
    const by = Math.max(margin.t + 2, y - 8 - boxH)
    const bx = Math.max(margin.l, Math.min(margin.l + W - boxW, x - boxW / 2))
    ctx.fillStyle = 'rgba(248, 250, 252, 0.96)'
    ctx.fillRect(bx, by, boxW, boxH)
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.75)'
    ctx.lineWidth = 1
    ctx.strokeRect(bx + 0.5, by + 0.5, boxW - 1, boxH - 1)
    ctx.fillStyle = '#334155'
    ctx.fillText(label, x, by + boxH - 3)
  })
  ctx.textAlign = 'start'
  ctx.textBaseline = 'alphabetic'

  const maxLabs = Math.max(2, Math.floor(W / 56))
  const labStep = Math.max(1, Math.ceil(n / maxLabs))
  ctx.fillStyle = '#64748b'
  dates.forEach((d, i) => {
    if (i % labStep !== 0 && i !== n - 1) return
    const x = margin.l + i * xStep
    const label = d.length >= 10 ? d.slice(5) : d
    ctx.fillText(label, x - 16, margin.t + H + 28)
  })

  // 左上角横排显示纵轴含义（与电子地图页一致，避免竖排遮挡）
  ctx.fillStyle = '#475569'
  ctx.font = '12px system-ui, sans-serif'
  ctx.fillText('预测重量（吨）', margin.l, margin.t - 6)

  ctx.fillStyle = '#475569'
  ctx.font = '12px system-ui, sans-serif'
  ctx.fillText('预测日期', margin.l + W / 2 - 28, height - 8)
}

let trendResizeHandler: (() => void) | null = null

watch(modalVisible, (v) => {
  if (v) {
    nextTick(() => {
      drawRowTrendChart()
      trendResizeHandler = () => drawRowTrendChart()
      window.addEventListener('resize', trendResizeHandler)
    })
  } else if (trendResizeHandler) {
    window.removeEventListener('resize', trendResizeHandler)
    trendResizeHandler = null
  }
})

watch([modalChartDates, modalChartValues], () => {
  if (modalVisible.value) {
    nextTick(() => drawRowTrendChart())
  }
})

onBeforeUnmount(() => {
  if (trendResizeHandler) {
    window.removeEventListener('resize', trendResizeHandler)
    trendResizeHandler = null
  }
})

// ==================== 导出预测明细（服务端 Excel） ====================
async function exportExcel() {
  const params = buildForecastFilterParams()

  const response = await axios
    .get(ApiPaths.forecastExport, { params, responseType: 'blob' })
    .catch((e: unknown) => {
      const err = e as { response?: { data?: { message?: string } }; message?: string }
      console.error('导出失败', e)
      showError(err?.response?.data?.message || err?.message || '导出失败', [])
      return null
    })

  if (!response) return

  const blob = new Blob([response.data], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  const link = document.createElement('a')
  const timestamp = new Date().toISOString().replace(/[-:]/g, '').slice(0, 15)
  link.href = URL.createObjectURL(blob)
  link.download = `送货量预测_${timestamp}.xlsx`
  link.click()
  URL.revokeObjectURL(link.href)
}

function escapeCsvCell(s: string) {
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

// ==================== 导出行趋势（日期 + 重量） ====================
function exportRowTrendCsv() {
  const dates = modalChartDates.value
  const values = modalChartValues.value
  if (dates.length === 0) {
    showError('没有可导出的数据', [])
    return
  }
  const m = modalChartMeta.value
  const metaLines = m
    ? [
        ['字段', '值'].join(','),
        ['仓库', m.warehouse].map(escapeCsvCell).join(','),
        ['大区经理', m.regional_manager].map(escapeCsvCell).join(','),
        ...(m.smelter ? [['冶炼厂', m.smelter].map(escapeCsvCell).join(',')] : []),
        ['品类', m.product_variety].map(escapeCsvCell).join(','),
      ]
    : []
  const headers = ['预测日期', '预测重量(吨)']
  const rowsData = dates.map((d, i) => [d, values[i]?.toFixed(2) ?? '0.00'].map(escapeCsvCell))
  const csvContent = [...metaLines, '', headers.join(','), ...rowsData.map((r) => r.join(','))].join('\n')
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const timestamp = new Date().toISOString().replace(/[-:]/g, '').slice(0, 15)
  link.href = URL.createObjectURL(blob)
  link.download = `预测趋势_${timestamp}.csv`
  link.click()
  URL.revokeObjectURL(link.href)
}

watch(forecastActiveTab, () => {
  void fetchDetailData()
})

onMounted(async () => {
  await fetchOptions()
  await handleQuery()
})
</script>

<style scoped>
.forecast-page { width: 100%; animation: fadeIn 0.25s ease both; }
.query-section { width: 100%; }
.card { background: white; border-radius: 8px; padding: 16px 20px; margin-bottom: 16px; box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05); animation: fadeInUp 0.3s ease both; }

.menu-search-bar {
  display: flex;
  justify-content: space-between;
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
  flex-wrap: wrap;
  gap: 8px;
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

.cell-dash {
  color: #94a3b8;
}

.cell-clickable {
  cursor: pointer;
}

.cell-clickable:hover {
  background-color: #e8f4fc;
}

.filter-row {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  align-items: center;
}

.filter-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.filter-item label {
  font-size: 13px;
  font-weight: 500;
  color: #606266;
  white-space: nowrap;
}

.date-range-item {
  min-width: 280px;
}

.date-hint {
  font-size: 11px;
  color: #909399;
  font-weight: normal;
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

.multi-select-item {
  min-width: 200px;
  max-width: 280px;
}

.multi-select-container {
  position: relative;
  width: 100%;
  max-width: 280px;
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
  overflow: hidden;
  cursor: text;
  box-sizing: border-box;
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
  max-height: 200px;
  overflow-y: auto;
  background: white;
  border: 1px solid #E5E9F2;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  z-index: 100;
  margin-top: 2px;
}

.dropdown-item {
  padding: 8px 12px;
  cursor: pointer;
  font-size: 13px;
  color: #606266;
  text-align: left;
}

.dropdown-item:hover {
  background-color: #F5F7FA;
  color: #4A7A9C;
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
  width: 550px;
  max-width: 90%;
  max-height: 80%;
  overflow: auto;
  animation: scaleIn 0.25s ease both;
}

.modal-small {
  width: 450px;
}

.modal-content-wide {
  width: 640px;
  max-width: 94%;
}

.modal-content-chart {
  width: min(720px, 96vw);
  max-width: 96%;
  max-height: 90vh;
  overflow: auto;
}

.modal-chart-wrap {
  width: 100%;
  min-height: 300px;
  margin-bottom: 16px;
}

.modal-chart-wrap canvas {
  display: block;
  width: 100%;
  height: auto;
}

.modal-chart-meta {
  background: #f8fafc;
  border-radius: 8px;
  padding: 14px 16px;
  margin-bottom: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.modal-chart-meta p {
  margin: 0;
  font-size: 13px;
  color: #334155;
  line-height: 1.5;
}

.modal-chart-meta strong {
  color: #0f172a;
  margin-right: 6px;
}

.modal-chart-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
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

.modal-info {
  background: #F5F7FA;
  padding: 12px;
  border-radius: 6px;
  margin-bottom: 16px;
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

.modal-info p {
  margin: 0;
  font-size: 13px;
  color: #606266;
}

.modal-info strong {
  color: #1F2D3D;
}

.modal-table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.modal-result-label {
  font-size: 14px;
  font-weight: 600;
  color: #2e7d32;
}

.modal-table {
  width: 100%;
}

.row-selected {
  background-color: #e8f5e9 !important;
}

.status-selected {
  color: #2e7d32;
  font-weight: 500;
}

.status-none {
  color: #c0c4cc;
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