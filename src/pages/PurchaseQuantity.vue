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
          <div
            class="menu-item"
            :class="{ active: forecastActiveTab === 'detail' }"
            @click="forecastActiveTab = 'detail'"
          >
            预测明细
          </div>
        </div>
        <button class="btn btn-secondary" @click="exportExcel" :disabled="loading">导出Excel</button>
      </div>
    </div>

    <div v-if="forecastActiveTab === 'manager'" class="card filter-card">
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
            <label>大区经理 <span class="filter-required">*</span></label>
            <div class="multi-select-container">
              <div
                class="selected-tags"
                :class="multiSelectTagsClass(forecastMgrSelectedManagers)"
                @click="focusMgrManagerInput"
              >
                <span v-for="item in mgrManagersTagsPreview" :key="item" class="tag tag-shrink" :title="item">
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
                  :placeholder="multiSelectPlaceholder(forecastMgrSelectedManagers)"
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

          <div class="filter-item multi-select-item multi-select-item--wide">
            <label>冶炼厂 <span class="filter-required">*</span></label>
            <div class="multi-select-container multi-select-container--wide">
              <div
                class="selected-tags"
                :class="multiSelectTagsClass(forecastMgrSelectedSmelters)"
                @click="focusMgrSmelterInput"
              >
                <span v-for="item in mgrSmeltersTagsPreview" :key="item" class="tag tag-shrink" :title="item">
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
                  :placeholder="multiSelectPlaceholder(forecastMgrSelectedSmelters)"
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
            <button class="btn btn-primary" @click="handleQuery" :disabled="loading || !canQueryForecast">
              {{ loading ? '加载中...' : '查询' }}
            </button>
            <button class="btn btn-secondary" @click="handleReset">重置</button>
          </div>
        </div>
      <p v-if="filterValidationHint" class="filter-validation-hint">{{ filterValidationHint }}</p>
    </div>

    <div v-if="forecastActiveTab === 'warehouse'" class="card filter-card">
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
            <label>仓库 <span class="filter-required">*</span></label>
            <div class="multi-select-container">
              <div
                class="selected-tags"
                :class="multiSelectTagsClass(forecastWhSelectedWarehouses)"
                @click="focusWhWarehouseInput"
              >
                <span v-for="item in whWarehousesTagsPreview" :key="item" class="tag tag-shrink" :title="item">
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
                  :placeholder="multiSelectPlaceholder(forecastWhSelectedWarehouses)"
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

          <div class="filter-item multi-select-item multi-select-item--wide">
            <label>冶炼厂 <span class="filter-required">*</span></label>
            <div class="multi-select-container multi-select-container--wide">
              <div
                class="selected-tags"
                :class="multiSelectTagsClass(forecastWhSelectedSmelters)"
                @click="focusWhSmelterInput"
              >
                <span v-for="item in whSmeltersTagsPreview" :key="item" class="tag tag-shrink" :title="item">
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
                  :placeholder="multiSelectPlaceholder(forecastWhSelectedSmelters)"
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
            <button class="btn btn-primary" @click="handleQuery" :disabled="loading || !canQueryForecast">
              {{ loading ? '加载中...' : '查询' }}
            </button>
            <button class="btn btn-secondary" @click="handleReset">重置</button>
          </div>
        </div>
      <p v-if="filterValidationHint" class="filter-validation-hint">{{ filterValidationHint }}</p>
    </div>

    <div v-if="forecastActiveTab === 'detail'" class="card filter-card">
      <div class="filter-row">
          <div class="filter-item">
            <label>送货日期 <span class="date-hint">(最多15天)</span></label>
            <div class="date-range">
              <input
                type="date"
                v-model="detailTabFilters.startDate"
                class="filter-input"
                @change="validateDetailTabDateRange"
              />
              <span>至</span>
              <input
                type="date"
                v-model="detailTabFilters.endDate"
                class="filter-input"
                @change="validateDetailTabDateRange"
              />
            </div>
          </div>
          <div class="filter-actions">
            <span v-if="loading" class="filter-auto-hint">加载中…</span>
            <button class="btn btn-secondary" @click="handleReset">重置</button>
          </div>
        </div>
    </div>

    <div class="card chart-summary-card">
      <div class="result-label">
        <span>预测趋势（汇总）</span>
        <span v-if="chartLoading" class="unit-hint">加载中…</span>
      </div>
      <ForecastBasisPanel :summary="chartSummaryAnalysis" :placeholder="chartBasisPlaceholder" />
      <div class="summary-chart-wrap">
        <p v-if="!chartLoading && chartDates.length === 0" class="chart-empty-hint">{{ chartEmptyHint }}</p>
        <canvas
          v-else
          ref="summaryChartCanvasRef"
          @mousemove="onSummaryChartMouseMove"
          @mouseleave="onSummaryChartMouseLeave"
        ></canvas>
        <div
          v-if="summaryHoverIndex >= 0"
          class="summary-chart-tooltip"
          :style="summaryTooltipStyle"
        >
          <div class="summary-tooltip-date">{{ chartDates[summaryHoverIndex] }}</div>
          <div class="summary-tooltip-value">{{ formatTrendValue(chartTotalByDate[summaryHoverIndex]) }} 吨</div>
        </div>
      </div>
    </div>

    <div v-if="forecastActiveTab === 'manager'" class="query-section">
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

    <div v-if="forecastActiveTab === 'detail'" class="query-section">
      <div class="card">
        <div class="result-label">
          <span>预测明细（共 {{ detailRows.length }} 条，点击行查看完整预测依据）</span>
        </div>
        <div class="table-wrapper">
          <table class="data-table detail-flat-table">
            <thead>
              <tr>
                <th>预测日期</th>
                <th>仓库</th>
                <th>大区经理</th>
                <th>冶炼厂</th>
                <th>品类</th>
                <th>预测重量(吨)</th>
                <th>预测依据</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="row in detailTablePageRows"
                :key="rowKey(row)"
                class="detail-row-clickable"
                @click="openDetailAnalysis(row)"
              >
                <td>{{ row.targetDate }}</td>
                <td>{{ row.warehouse }}</td>
                <td>{{ row.regionalManager }}</td>
                <td>{{ row.smelter || '—' }}</td>
                <td>{{ row.productVariety }}</td>
                <td>{{ row.predictedWeight.toFixed(2) }}</td>
                <td class="analysis-cell">
                  <span class="analysis-cell-preview">{{ truncateAnalysis(row.analysis) }}</span>
                  <span class="analysis-cell-action">查看</span>
                </td>
              </tr>
              <tr v-if="detailTablePageRows.length === 0">
                <td colspan="7" class="empty-data">暂无数据</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="pagination">
          <button :disabled="detailTablePage <= 1" @click="detailTablePage--">上一页</button>
          <span>第 {{ detailTablePage }} / {{ detailTableTotalPages }} 页（每页 {{ detailTablePageSize }} 条）</span>
          <button :disabled="detailTablePage >= detailTableTotalPages" @click="detailTablePage++">下一页</button>
        </div>
      </div>
    </div>

    <PredictionAnalysisDrawer
      :visible="analysisDrawerVisible"
      :title="analysisDrawerTitle"
      :analysis="analysisDrawerText"
      :meta-lines="analysisDrawerMeta"
      @close="closeAnalysisDrawer"
    />

    <!-- 行趋势弹窗：折线图 + 仓库 / 大区经理 / 品类 -->
    <div v-if="modalVisible" class="modal" @click.self="closeModal">
      <div class="modal-content modal-content-chart">
        <div class="modal-header">
          <h3>{{ modalTitle }}</h3>
          <button class="close-btn" @click="closeModal">&times;</button>
        </div>
        <div class="modal-body">
          <div class="modal-chart-wrap">
            <canvas
              ref="rowTrendCanvas"
              @mousemove="onTrendChartMouseMove"
              @mouseleave="onTrendChartMouseLeave"
            ></canvas>
            <div
              v-if="trendHoverIndex >= 0"
              class="chart-tooltip"
              :style="trendTooltipStyle"
            >
              <div class="chart-tooltip-date">{{ modalChartDates[trendHoverIndex] }}</div>
              <div class="chart-tooltip-price">{{ formatTrendValue(modalChartValues[trendHoverIndex]) }} 吨</div>
            </div>
          </div>
          <div class="modal-chart-meta">
            <div class="meta-row">
              <span class="meta-label">大区经理：</span>
              <span class="meta-value">{{ modalChartMeta?.regional_manager || '—' }}</span>
            </div>
            <div class="meta-row">
              <span class="meta-label">冶炼厂：</span>
              <span class="meta-value">{{ modalChartMeta?.smelter || '—' }}</span>
            </div>
            <div class="meta-row">
              <span class="meta-label">品类：</span>
              <span class="meta-value">{{ modalChartMeta?.product_variety || '—' }}</span>
            </div>
            <div class="meta-row meta-row-warehouse">
              <span class="meta-label">仓库：</span>
              <span class="meta-value">{{ modalChartMeta?.warehouse || '—' }}</span>
            </div>
          </div>
          <div class="modal-chart-actions">
            <button class="btn btn-secondary" @click="exportRowTrendCsv">导出趋势CSV</button>
            <button class="btn btn-primary" @click="closeModal">关闭</button>
          </div>
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
  fetchForecastChart,
  normalizeForecastDetailList,
  type PrdForecastDetailRow,
} from '../api/forecastApi'
import ForecastBasisPanel from '../components/ForecastBasisPanel.vue'
import PredictionAnalysisDrawer from '../components/PredictionAnalysisDrawer.vue'
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
  analysis?: string | null
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

const detailTableTotalPages = computed(() =>
  Math.max(1, Math.ceil(detailRows.value.length / detailTablePageSize)),
)
const detailTablePageRows = computed(() => {
  const start = (detailTablePage.value - 1) * detailTablePageSize
  return detailRows.value.slice(start, start + detailTablePageSize)
})

const chartBasisPlaceholder = computed(() => {
  if (!forecastQueried.value) {
    return '请先选择筛选条件并点击「查询」。'
  }
  if (chartLoadFailed.value) {
    return '汇总依据加载失败，请检查 GET /forecast/chart 是否可用（需返回 summary_analysis）。'
  }
  if (chartDates.value.length > 0 && !chartSummaryAnalysis.value.trim()) {
    return 'chart 接口已返回趋势数据，但未包含 summary_analysis 字段，请确认后端已按 v1.1.0 联调说明部署。'
  }
  return '暂无预测依据'
})

const chartEmptyHint = computed(() =>
  forecastQueried.value
    ? '暂无趋势数据，请调整筛选条件后重新查询。'
    : '请先完成筛选条件并点击「查询」获取预测数据。',
)

function getForecastFilterValidationError(): string | null {
  const tab = forecastActiveTab.value
  if (tab === 'detail') {
    const f = detailTabFilters.value
    if (!f.startDate || !f.endDate) return '请选择送货日期范围'
    return null
  }
  if (tab === 'manager') {
    const missing: string[] = []
    if (forecastMgrSelectedManagers.value.length === 0) missing.push('大区经理')
    if (forecastMgrSelectedSmelters.value.length === 0) missing.push('冶炼厂')
    if (missing.length > 0) return `请先选择${missing.join('、')}后再查询`
    const f = forecastMgrFilters.value
    if (!f.startDate || !f.endDate) return '请选择送货日期范围'
    return null
  }
  const missing: string[] = []
  if (forecastWhSelectedWarehouses.value.length === 0) missing.push('仓库')
  if (forecastWhSelectedSmelters.value.length === 0) missing.push('冶炼厂')
  if (missing.length > 0) return `请先选择${missing.join('、')}后再查询`
  const f = forecastWhFilters.value
  if (!f.startDate || !f.endDate) return '请选择送货日期范围'
  return null
}

const filterValidationHint = computed(() => getForecastFilterValidationError() ?? '')

const canQueryForecast = computed(() => getForecastFilterValidationError() === null)

const forecastQueried = ref(false)

const forecastActiveTab = ref<'manager' | 'warehouse' | 'detail'>('manager')

const chartLoading = ref(false)
const chartLoadFailed = ref(false)
const chartSummaryAnalysis = ref('')
const chartDates = ref<string[]>([])
const chartTotalByDate = ref<number[]>([])
const summaryChartCanvasRef = ref<HTMLCanvasElement | null>(null)
const summaryHoverIndex = ref(-1)
const summaryTooltipStyle = ref<Record<string, string>>({})

interface SummaryChartLayout {
  margin: { t: number; r: number; b: number; l: number }
  W: number
  H: number
  maxY: number
  xStep: number
  toX: (i: number) => number
  toY: (v: number) => number
}
let summaryChartLayout: SummaryChartLayout | null = null

const detailRows = ref<PrdForecastDetailRow[]>([])
const detailTabFilters = ref({ startDate: '', endDate: '' })
const detailTablePage = ref(1)
const detailTablePageSize = 20

const analysisDrawerVisible = ref(false)
const analysisDrawerTitle = ref('预测依据详情')
const analysisDrawerText = ref<string | null>(null)
const analysisDrawerMeta = ref<string[]>([])
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

const forecastWhSelectedSmelters = ref<string[]>([])
const whSmelterSearchText = ref('')
const whSmelterDropdownVisible = ref(false)
const whSmelterInputRef = ref<HTMLInputElement>()
const filteredWhSmelterOptions = ref<string[]>([])

const allWarehouseOptions = ref<string[]>([])
const allManagerOptions = ref<string[]>([])
const allSmelterOptions = ref<string[]>([])

const MULTI_PREVIEW_TAG_COUNT = 1
const DEFAULT_SMELTER = '河南金利金铅集团有限公司'

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
    refreshAllFilterOptionLists()
  }
  forecastMgrSelectedSmelters.value = [DEFAULT_SMELTER]
  forecastWhSelectedSmelters.value = [DEFAULT_SMELTER]
}

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
const trendHoverIndex = ref(-1)
const trendTooltipStyle = ref<Record<string, string>>({})

interface TrendChartLayout {
  margin: { t: number; r: number; b: number; l: number }
  W: number
  H: number
  maxY: number
  xStep: number
  toX: (i: number) => number
  toY: (v: number) => number
}
let trendChartLayout: TrendChartLayout | null = null

function formatTrendValue(v: number | undefined): string {
  if (v === undefined || !Number.isFinite(v)) return '0.00'
  return v.toFixed(2)
}

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

/** PRD：默认 [当天, 当天+14天]（共 15 天） */
function defaultForecastDateRange(): { startDate: string; endDate: string } {
  const start = new Date()
  const end = new Date(start)
  end.setDate(end.getDate() + 14)
  const fmt = (d: Date) => d.toISOString().slice(0, 10)
  return { startDate: fmt(start), endDate: fmt(end) }
}

function applyDefaultForecastDateRange() {
  const range = defaultForecastDateRange()
  forecastMgrFilters.value = { ...range }
  forecastWhFilters.value = { ...range }
  detailTabFilters.value = { ...range }
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

function validateDetailTabDateRange() {
  validateForecastDateRange(detailTabFilters)
}

function rowKey(row: PrdForecastDetailRow) {
  return `${row.targetDate}|${row.warehouse}|${row.productVariety}|${row.regionalManager}|${row.smelter ?? ''}`
}

function truncateAnalysis(analysis: string | null | undefined, maxLen = 80) {
  const t = (analysis ?? '').trim()
  if (!t) return '—'
  return t.length <= maxLen ? t : `${t.slice(0, maxLen)}…`
}

function openDetailAnalysis(row: PrdForecastDetailRow) {
  analysisDrawerTitle.value = `预测依据 · ${row.targetDate}`
  analysisDrawerText.value = row.analysis
  analysisDrawerMeta.value = [
    `仓库：${row.warehouse}`,
    `大区经理：${row.regionalManager}`,
    `品类：${row.productVariety}`,
    ...(row.smelter ? [`冶炼厂：${row.smelter}`] : []),
    `预测重量：${row.predictedWeight.toFixed(2)} 吨`,
  ]
  analysisDrawerVisible.value = true
}

function closeAnalysisDrawer() {
  analysisDrawerVisible.value = false
}

function formatPrice(n: number): string {
  if (!Number.isFinite(n)) return '—'
  return n.toLocaleString('zh-CN', { maximumFractionDigits: 0 })
}

function drawSummaryChart(highlightIndex = -1) {
  const canvas = summaryChartCanvasRef.value
  if (!canvas) return
  const dates = chartDates.value
  const values = chartTotalByDate.value
  if (dates.length === 0) return

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const wrap = canvas.parentElement
  const width = Math.max((wrap?.clientWidth ?? 560) - 8, 320)
  const height = 280
  canvas.width = width
  canvas.height = height

  const margin = { t: 24, r: 20, b: 56, l: 72 }
  const W = width - margin.l - margin.r
  const H = height - margin.t - margin.b
  const n = dates.length
  const maxV = Math.max(...values, 0)
  const maxY = maxV <= 0 ? 1 : maxV * 1.08
  const xStep = n <= 1 ? W / 2 : W / (n - 1)
  const toX = (i: number) => margin.l + i * xStep
  const toY = (v: number) => margin.t + H - (v / maxY) * H

  summaryChartLayout = { margin, W, H, maxY, xStep, toX, toY }

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
    ctx.fillText(formatPrice(val), 4, y + 4)
  }

  if (highlightIndex >= 0 && highlightIndex < n) {
    const hx = toX(highlightIndex)
    ctx.strokeStyle = 'rgba(20, 118, 219, 0.35)'
    ctx.lineWidth = 1
    ctx.setLineDash([4, 4])
    ctx.beginPath()
    ctx.moveTo(hx, margin.t)
    ctx.lineTo(hx, margin.t + H)
    ctx.stroke()
    ctx.setLineDash([])
  }

  ctx.strokeStyle = '#1476db'
  ctx.lineWidth = 2
  ctx.beginPath()
  values.forEach((v, i) => {
    const x = toX(i)
    const y = toY(v)
    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  })
  ctx.stroke()

  values.forEach((v, i) => {
    const x = toX(i)
    const y = toY(v)
    const active = i === highlightIndex
    ctx.fillStyle = '#1476db'
    ctx.beginPath()
    ctx.arc(x, y, active ? 6 : 3, 0, Math.PI * 2)
    ctx.fill()
    if (active) {
      ctx.strokeStyle = '#fff'
      ctx.lineWidth = 2
      ctx.stroke()
    }
  })

  const maxLabs = Math.max(2, Math.floor(W / 56))
  const labStep = Math.max(1, Math.ceil(n / maxLabs))
  ctx.fillStyle = '#64748b'
  dates.forEach((d, i) => {
    if (i % labStep !== 0 && i !== n - 1) return
    const x = toX(i)
    const label = d.length >= 10 ? d.slice(5) : d
    ctx.fillText(label, x - 16, margin.t + H + 20)
  })

  ctx.fillStyle = '#475569'
  ctx.font = '12px system-ui, sans-serif'
  ctx.fillText('预测重量（吨）', margin.l, margin.t - 8)
  ctx.fillText('预测日期', margin.l + W / 2 - 28, height - 6)

  if (highlightIndex >= 0) {
    updateSummaryTooltipPosition(highlightIndex)
  }
}

let summaryChartResizeHandler: (() => void) | null = null

function summaryCanvasPointer(ev: MouseEvent): { x: number; y: number } {
  const canvas = summaryChartCanvasRef.value!
  const rect = canvas.getBoundingClientRect()
  const scaleX = canvas.width / rect.width
  const scaleY = canvas.height / rect.height
  return {
    x: (ev.clientX - rect.left) * scaleX,
    y: (ev.clientY - rect.top) * scaleY,
  }
}

function findNearestSummaryPoint(px: number, _py: number): number {
  if (!summaryChartLayout) return -1
  const values = chartTotalByDate.value
  if (values.length === 0) return -1
  let best = 0
  let bestDist = Math.abs(px - summaryChartLayout!.toX(0))
  values.forEach((_v, i) => {
    const dx = Math.abs(px - summaryChartLayout!.toX(i))
    if (dx < bestDist) {
      bestDist = dx
      best = i
    }
  })
  return best
}

function updateSummaryTooltipPosition(index: number) {
  const canvas = summaryChartCanvasRef.value
  if (!canvas || !summaryChartLayout || index < 0) return
  const rect = canvas.getBoundingClientRect()
  const scaleX = rect.width / canvas.width
  const scaleY = rect.height / canvas.height
  const left = summaryChartLayout.toX(index) * scaleX
  const top = summaryChartLayout.toY(chartTotalByDate.value[index] ?? 0) * scaleY
  summaryTooltipStyle.value = {
    left: `${left}px`,
    top: `${top}px`,
    transform: 'translate(-50%, calc(-100% - 10px))',
  }
}

function onSummaryChartMouseMove(ev: MouseEvent) {
  if (!summaryChartLayout || chartTotalByDate.value.length === 0) return
  const { x, y } = summaryCanvasPointer(ev)
  const hit = findNearestSummaryPoint(x, y)
  if (hit === summaryHoverIndex.value) return
  summaryHoverIndex.value = hit
  drawSummaryChart(hit)
}

function onSummaryChartMouseLeave() {
  if (summaryHoverIndex.value < 0) return
  summaryHoverIndex.value = -1
  summaryTooltipStyle.value = {}
  drawSummaryChart(-1)
}

watch([chartDates, chartTotalByDate], () => {
  if (chartDates.value.length > 0) {
    nextTick(() => {
      drawSummaryChart()
      if (!summaryChartResizeHandler) {
        summaryChartResizeHandler = () => drawSummaryChart()
        window.addEventListener('resize', summaryChartResizeHandler)
      }
    })
  }
})

// ==================== 过滤选项 ====================
function filterOptionsBySearch(options: string[], searchLower: string) {
  if (!searchLower) return [...options]
  return options.filter((opt) => opt.toLowerCase().includes(searchLower))
}

function refreshAllFilterOptionLists() {
  filterWhWarehouseOptions()
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
  if (forecastActiveTab.value === 'detail') {
    const f = detailTabFilters.value
    if (f.startDate) params.date_from = f.startDate
    if (f.endDate) params.date_to = f.endDate
    // 维度筛选与「按仓库」页签一致（与 chart/export 同源）
    if (forecastWhSelectedWarehouses.value.length > 0) {
      params.warehouses = forecastWhSelectedWarehouses.value
    }
    if (forecastWhSelectedSmelters.value.length > 0) {
      params.smelters = forecastWhSelectedSmelters.value
    }
    return params
  }
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

  const latestRmByWarehouse = buildLatestRegionalManagerByWarehouse(
    items,
    (i) => i.warehouse || '未知',
    (i) => i.regional_manager || '未知',
    (i) => i.target_date,
  )

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

    const whRmRaw = resolveRegionalManagerForWarehouse(whRaw, rmRaw, latestRmByWarehouse)
    const wk = `${whRaw}|${whRmRaw}|${smelterRaw}`
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

function detailRowToLegacy(row: PrdForecastDetailRow): ForecastDetailItem {
  return {
    target_date: row.targetDate,
    regional_manager: row.regionalManager,
    smelter: row.smelter,
    warehouse: row.warehouse,
    product_variety: row.productVariety,
    predicted_weight: String(row.predictedWeight),
    wma_base: row.wmaBase != null ? String(row.wmaBase) : undefined,
    week_coef: row.weekCoef != null ? String(row.weekCoef) : undefined,
    analysis: row.analysis,
  }
}

async function fetchAllDetailRows(
  base: Record<string, string | number | string[] | undefined>,
): Promise<PrdForecastDetailRow[]> {
  const page_size = FORECAST_DETAILS_FETCH_PAGE_SIZE
  const rawItems: unknown[] = []
  let page = 1
  while (page <= 200) {
    const params: Record<string, unknown> = { ...base, page, page_size }
    const response = await axios.get(ApiPaths.forecastDetail, { params })
    const data = response.data as { items?: unknown[]; total?: number }
    const items = data.items ?? []
    rawItems.push(...items)
    if (items.length === 0) break
    if (items.length < page_size) break
    if (typeof data.total === 'number' && rawItems.length >= data.total) break
    page++
  }
  return normalizeForecastDetailList(rawItems)
}

// ==================== 从 chart + 明细拉取并填充 ====================
async function fetchDetailData() {
  loading.value = true
  chartLoadFailed.value = false
  const base = buildForecastFilterParams()
  const emptyChart = {
    dates: [] as string[],
    totalByDate: [] as number[],
    byRegionalManager: [] as { regionalManager: string; totals: number[] }[],
    warehouseProfiles: [] as unknown[],
    summaryAnalysis: '',
  }

  const chartResult = await fetchForecastChart(base).catch((e: unknown) => {
    console.error('获取预测图表失败', e)
    chartLoadFailed.value = true
    return emptyChart
  })
  chartSummaryAnalysis.value = chartResult.summaryAnalysis
  chartDates.value = chartResult.dates
  chartTotalByDate.value = chartResult.totalByDate
  await nextTick()
  drawSummaryChart()

  try {
    const normalized = await fetchAllDetailRows(base)
    detailRows.value = normalized
    const legacy = normalized.map(detailRowToLegacy)
    detailData.value = legacy
    rebuildForecastPivotFromDetail(legacy)
    mergeSmelterOptionsFromForecastItems(legacy)
    detailTablePage.value = 1
  } catch (error: unknown) {
    console.error('获取预测明细失败', error)
    detailRows.value = []
    detailData.value = []
    rebuildForecastPivotFromDetail([])
    const err = error as { response?: { data?: { message?: string; detail?: string } }; message?: string }
    const data = err.response?.data
    const msg =
      (typeof data?.message === 'string' && data.message) ||
      (typeof data?.detail === 'string' && data.detail) ||
      err.message ||
      '获取预测明细失败'
    showError(msg, ['汇总趋势与预测依据仍来自 chart 接口；请检查明细接口或筛选条件'])
  } finally {
    loading.value = false
    chartLoading.value = false
  }
}

// ==================== 查询 ====================
function clearForecastResults() {
  forecastQueried.value = false
  chartLoadFailed.value = false
  chartSummaryAnalysis.value = ''
  chartDates.value = []
  chartTotalByDate.value = []
  detailRows.value = []
  detailData.value = []
  rebuildForecastPivotFromDetail([])
  detailTablePage.value = 1
}

async function handleQuery() {
  const err = getForecastFilterValidationError()
  if (err) {
    showError(err)
    return
  }
  forecastQueried.value = true
  await fetchDetailData()
}

/** 预测明细页：切换页签或改日期后自动查询（无需点查询） */
async function autoQueryDetailTab() {
  if (forecastActiveTab.value !== 'detail') return
  const err = getForecastFilterValidationError()
  if (err) return
  forecastQueried.value = true
  await fetchDetailData()
}

function handleReset() {
  if (forecastActiveTab.value === 'manager') {
    forecastMgrSelectedManagers.value = []
    forecastMgrSelectedSmelters.value = []
    mgrManagerSearchText.value = ''
    mgrSmelterSearchText.value = ''
  } else if (forecastActiveTab.value === 'warehouse') {
    forecastWhSelectedWarehouses.value = []
    forecastWhSelectedSmelters.value = []
    whWarehouseSearchText.value = ''
    whSmelterSearchText.value = ''
  }
  applyDefaultForecastDateRange()
  applyDefaultSmelterSelection()
  clearForecastResults()
  if (forecastActiveTab.value === 'detail') {
    void autoQueryDetailTab()
  }
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

function drawRowTrendChart(highlightIndex = -1) {
  const canvas = rowTrendCanvas.value
  if (!canvas) return
  const dates = modalChartDates.value
  const values = modalChartValues.value
  if (dates.length === 0) return

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const wrap = canvas.parentElement
  const width = Math.max((wrap?.clientWidth ?? 560) - 8, 320)
  const height = 320
  canvas.width = width
  canvas.height = height

  const dpr = window.devicePixelRatio || 1
  if (dpr > 1) {
    canvas.width = width * dpr
    canvas.height = height * dpr
    canvas.style.width = width + 'px'
    canvas.style.height = height + 'px'
    ctx.scale(dpr, dpr)
  }

  const margin = { t: 28, r: 20, b: 56, l: 72 }
  const W = width - margin.l - margin.r
  const H = height - margin.t - margin.b
  const n = dates.length

  const maxV = Math.max(...values, 0)
  const maxY = maxV <= 0 ? 1 : maxV * 1.1
  const xStep = n <= 1 ? W / 2 : W / (n - 1)
  const toX = (i: number) => margin.l + i * xStep
  const toY = (v: number) => margin.t + H - (v / maxY) * H

  trendChartLayout = { margin, W, H, maxY, xStep, toX, toY }

  // 清空
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, width, height)

  // 网格线
  const ySteps = 5
  ctx.font = '11px system-ui, sans-serif'
  ctx.fillStyle = '#64748b'
  for (let i = 0; i <= ySteps; i++) {
    const y = margin.t + H - (i / ySteps) * H
    const val = (i / ySteps) * maxY
    ctx.strokeStyle = '#f1f5f9'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(margin.l, y)
    ctx.lineTo(margin.l + W, y)
    ctx.stroke()
    ctx.fillText(formatPrice(val), 4, y + 4)
  }

  // X 轴基线
  ctx.strokeStyle = '#d1d5db'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(margin.l, margin.t)
  ctx.lineTo(margin.l, margin.t + H)
  ctx.lineTo(margin.l + W, margin.t + H)
  ctx.stroke()

  // 悬浮竖线
  if (highlightIndex >= 0 && highlightIndex < n) {
    const hx = toX(highlightIndex)
    ctx.strokeStyle = 'rgba(20, 118, 219, 0.35)'
    ctx.lineWidth = 1
    ctx.setLineDash([4, 4])
    ctx.beginPath()
    ctx.moveTo(hx, margin.t)
    ctx.lineTo(hx, margin.t + H)
    ctx.stroke()
    ctx.setLineDash([])
  }

  // 面积填充（与铅价格查询页面一致）
  ctx.fillStyle = 'rgba(20, 118, 219, 0.12)'
  ctx.beginPath()
  values.forEach((v, i) => {
    const x = toX(i)
    const y = toY(v)
    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  })
  ctx.lineTo(toX(n - 1), margin.t + H)
  ctx.lineTo(toX(0), margin.t + H)
  ctx.closePath()
  ctx.fill()

  // 折线（直线，与铅价格查询页面一致）
  ctx.strokeStyle = '#1476db'
  ctx.lineWidth = 2
  ctx.beginPath()
  values.forEach((v, i) => {
    const x = toX(i)
    const y = toY(v)
    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  })
  ctx.stroke()

  // 数据点（与铅价格查询页面一致）
  values.forEach((v, i) => {
    const x = toX(i)
    const y = toY(v)
    const active = i === highlightIndex
    ctx.fillStyle = '#1476db'
    ctx.beginPath()
    ctx.arc(x, y, active ? 6 : 3, 0, Math.PI * 2)
    ctx.fill()
    if (active) {
      ctx.strokeStyle = '#fff'
      ctx.lineWidth = 2
      ctx.stroke()
    }
  })

  // X 轴标签
  ctx.textAlign = 'center'
  ctx.textBaseline = 'top'
  ctx.font = '11px system-ui, sans-serif'
  const maxLabs = Math.max(2, Math.floor(W / 50))
  const labStep = Math.max(1, Math.ceil(n / maxLabs))
  dates.forEach((d, i) => {
    if (i % labStep !== 0 && i !== n - 1) return
    const x = toX(i)
    const label = d.length >= 10 ? d.slice(5) : d
    ctx.fillStyle = '#64748b'
    ctx.fillText(label, x, margin.t + H + 20)
  })

  // 轴标题
  ctx.textAlign = 'left'
  ctx.textBaseline = 'alphabetic'
  ctx.fillStyle = '#475569'
  ctx.font = '12px system-ui, sans-serif'
  ctx.fillText('预测重量（吨）', margin.l, margin.t - 10)
  ctx.textAlign = 'center'
  ctx.fillText('预测日期', margin.l + W / 2, height - 6)
  ctx.textAlign = 'start'

  if (highlightIndex >= 0) {
    updateTrendTooltipPosition(highlightIndex)
  }
}

function trendCanvasPointer(ev: MouseEvent): { x: number; y: number } {
  const canvas = rowTrendCanvas.value!
  const rect = canvas.getBoundingClientRect()
  const scaleX = (canvas.width / (window.devicePixelRatio || 1)) / rect.width
  const scaleY = (canvas.height / (window.devicePixelRatio || 1)) / rect.height
  return {
    x: (ev.clientX - rect.left) * scaleX,
    y: (ev.clientY - rect.top) * scaleY,
  }
}

function findNearestTrendPoint(px: number, _py: number): number {
  if (!trendChartLayout) return -1
  const values = modalChartValues.value
  if (values.length === 0) return -1
  let best = 0
  let bestDist = Math.abs(px - trendChartLayout!.toX(0))
  values.forEach((_v, i) => {
    const dx = Math.abs(px - trendChartLayout!.toX(i))
    if (dx < bestDist) {
      bestDist = dx
      best = i
    }
  })
  return best
}

function updateTrendTooltipPosition(index: number) {
  const canvas = rowTrendCanvas.value
  if (!canvas || !trendChartLayout || index < 0) return
  const rect = canvas.getBoundingClientRect()
  const dpr = window.devicePixelRatio || 1
  const scaleX = rect.width / (canvas.width / dpr)
  const scaleY = rect.height / (canvas.height / dpr)
  const left = trendChartLayout.toX(index) * scaleX
  const top = trendChartLayout.toY(modalChartValues.value[index] ?? 0) * scaleY
  trendTooltipStyle.value = {
    left: `${left}px`,
    top: `${top}px`,
    transform: 'translate(-50%, calc(-100% - 14px))',
  }
}

function onTrendChartMouseMove(ev: MouseEvent) {
  if (!trendChartLayout || modalChartValues.value.length === 0) return
  const { x, y } = trendCanvasPointer(ev)
  const hit = findNearestTrendPoint(x, y)
  if (hit === trendHoverIndex.value) return
  trendHoverIndex.value = hit
  if (hit >= 0) updateTrendTooltipPosition(hit)
  drawRowTrendChart(hit)
}

function onTrendChartMouseLeave() {
  if (trendHoverIndex.value < 0) return
  trendHoverIndex.value = -1
  trendTooltipStyle.value = {}
  drawRowTrendChart(-1)
}

let trendResizeHandler: (() => void) | null = null

watch(modalVisible, (v) => {
  if (v) {
    trendHoverIndex.value = -1
    trendTooltipStyle.value = {}
    nextTick(() => {
      drawRowTrendChart()
      trendResizeHandler = () => drawRowTrendChart(trendHoverIndex.value)
      window.addEventListener('resize', trendResizeHandler)
    })
  } else if (trendResizeHandler) {
    window.removeEventListener('resize', trendResizeHandler)
    trendResizeHandler = null
  }
})

watch([modalChartDates, modalChartValues], () => {
  if (modalVisible.value) {
    trendHoverIndex.value = -1
    trendTooltipStyle.value = {}
    nextTick(() => drawRowTrendChart())
  }
})

onBeforeUnmount(() => {
  if (trendResizeHandler) {
    window.removeEventListener('resize', trendResizeHandler)
    trendResizeHandler = null
  }
  if (summaryChartResizeHandler) {
    window.removeEventListener('resize', summaryChartResizeHandler)
    summaryChartResizeHandler = null
  }
})

// ==================== 导出预测明细（服务端 Excel） ====================
async function exportExcel() {
  const err = getForecastFilterValidationError()
  if (err) {
    showError(err)
    return
  }
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

watch(forecastActiveTab, (tab) => {
  if (tab === 'detail' && !detailTabFilters.value.startDate && forecastWhFilters.value.startDate) {
    detailTabFilters.value = { ...forecastWhFilters.value }
  }
  if (tab === 'detail') {
    void autoQueryDetailTab()
  } else {
    clearForecastResults()
  }
})

watch(
  () => [detailTabFilters.value.startDate, detailTabFilters.value.endDate] as const,
  () => {
    if (forecastActiveTab.value === 'detail') {
      void autoQueryDetailTab()
    }
  },
)

onMounted(async () => {
  applyDefaultForecastDateRange()
  await fetchOptions()
  applyDefaultSmelterSelection()
})
</script>

<style scoped>
.forecast-page { width: 100%; animation: fadeIn 0.25s ease both; }
.query-section { width: 100%; }
.card { background: white; border-radius: 8px; padding: 16px 20px; margin-bottom: 16px; box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05); animation: fadeInUp 0.3s ease both; }

.filter-card {
  position: relative;
  z-index: 40;
  overflow: visible;
}

.chart-summary-card {
  position: relative;
  z-index: 1;
}

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

.chart-summary-card .result-label {
  color: #1f2d3d;
}

.summary-chart-wrap {
  position: relative;
  min-height: 200px;
  margin-top: 8px;
}

.summary-chart-wrap canvas {
  display: block;
  width: 100%;
}

.summary-chart-tooltip {
  position: absolute;
  z-index: 10;
  pointer-events: none;
  padding: 7px 11px;
  background: rgba(15, 23, 42, 0.88);
  color: #fff;
  border-radius: 6px;
  font-size: 12px;
  line-height: 1.4;
  white-space: nowrap;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.18);
}

.summary-tooltip-date {
  color: #94a3b8;
  font-size: 11px;
  margin-bottom: 1px;
}

.summary-tooltip-value {
  font-weight: 600;
  font-size: 13px;
  color: #e2e8f0;
}

.chart-empty-hint {
  margin: 24px 0;
  text-align: center;
  font-size: 13px;
  color: #909399;
}

.detail-flat-table .analysis-cell {
  max-width: 280px;
  font-size: 12px;
  line-height: 1.45;
  color: #475569;
}

.analysis-cell-preview {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.analysis-cell-action {
  display: inline-block;
  margin-top: 4px;
  font-size: 12px;
  font-weight: 600;
  color: #1476db;
}

.detail-row-clickable {
  cursor: pointer;
}

.detail-row-clickable:hover {
  background-color: #e8f4fc;
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
  align-items: flex-start;
  overflow: visible;
}

.filter-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
  overflow: visible;
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

.filter-auto-hint {
  font-size: 13px;
  color: #64748b;
  line-height: 32px;
  padding: 0 4px;
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
  overflow: hidden;
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
  background: rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(2px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
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
  max-height: 92vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-radius: 10px;
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.22);
}

.modal-content-chart .modal-body {
  flex: 1 1 auto;
  overflow-y: auto;
  min-height: 0;
}

.modal-chart-wrap {
  position: relative;
  width: 100%;
  min-height: 300px;
  margin-bottom: 16px;
}

.modal-chart-wrap canvas {
  display: block;
  width: 100%;
  cursor: crosshair;
}

.chart-tooltip {
  position: absolute;
  z-index: 10;
  pointer-events: none;
  padding: 7px 11px;
  background: rgba(15, 23, 42, 0.88);
  color: #fff;
  border-radius: 6px;
  font-size: 12px;
  line-height: 1.4;
  white-space: nowrap;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.18);
}

.chart-tooltip-date {
  color: #94a3b8;
  font-size: 11px;
  margin-bottom: 1px;
}

.chart-tooltip-price {
  font-weight: 600;
  font-size: 13px;
  color: #e2e8f0;
}

.modal-chart-meta {
  background: #f8fafc;
  border-radius: 6px;
  padding: 14px 16px;
  margin-bottom: 8px;
  display: flex;
  flex-wrap: wrap;
  gap: 6px 20px;
  border: 1px solid #e8ecf1;
}

.meta-row {
  display: flex;
  align-items: baseline;
  gap: 4px;
  min-width: 0;
}

.meta-label {
  font-size: 12px;
  color: #94a3b8;
  white-space: nowrap;
  flex-shrink: 0;
}

.meta-value {
  font-size: 13px;
  color: #1e293b;
  font-weight: 500;
  word-break: break-all;
}

.meta-row-warehouse {
  flex-basis: 100%;
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