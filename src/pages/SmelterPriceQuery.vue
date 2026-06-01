<template>
  <div class="smelter-price-query-page">
    <div class="card summary-card">
      <div class="summary-head">
        <div class="summary-head-main">
          <div class="smelter-select-wrap">
            <label class="smelter-select-label">冶炼厂</label>
            <select
              v-model.number="selectedSmelterId"
              class="filter-input smelter-select"
              :disabled="smelterOptions.length === 0"
              @change="onSmelterChange"
            >
              <option v-if="smelterOptions.length === 0" :value="0">暂无冶炼厂数据</option>
              <option v-for="s in smelterOptions" :key="s.id" :value="s.id">{{ s.name }}</option>
            </select>
          </div>
          <p v-if="latest" class="summary-meta">
            <span>定价日期：{{ latest.date }}</span>
          </p>
          <p v-else-if="!latestLoading && selectedSmelterId" class="summary-meta text-muted">该冶炼厂暂无标定价格</p>
          <p v-else-if="!selectedSmelterId" class="summary-meta text-muted">请先选择冶炼厂</p>
        </div>
        <button type="button" class="btn btn-secondary" @click="emit('maintain')">前往维护</button>
      </div>

      <p v-if="latestError && !latest" class="inline-error">{{ latestError }}</p>
      <p v-else-if="latestError && latest" class="inline-warn">{{ latestError }}</p>

      <div v-if="latestLoading" class="summary-loading">正在加载最新标定价格…</div>
      <div v-else-if="latest" class="price-summary">
        <div class="price-cell price-cell--main">
          <span class="price-label">标定价格</span>
          <span class="price-value price-value--main">{{ formatPrice(latest.price) }}</span>
          <span v-if="dayChange !== null" class="price-change" :class="dayChange >= 0 ? 'up' : 'down'">
            {{ dayChange >= 0 ? '+' : '' }}{{ formatPrice(dayChange) }}
            <span v-if="dayChangePct !== null">（{{ dayChangePct >= 0 ? '+' : '' }}{{ dayChangePct.toFixed(2) }}%）</span>
          </span>
        </div>
        <div class="price-unit">元/吨</div>
      </div>
    </div>

    <div class="card">
      <div class="filter-row">
        <div class="filter-item">
          <label>定价日期</label>
          <div class="date-range">
            <input v-model="filters.dateFrom" type="date" class="filter-input date-input" />
            <span>至</span>
            <input v-model="filters.dateTo" type="date" class="filter-input date-input" />
          </div>
        </div>
        <div class="filter-actions">
          <button class="btn btn-primary" :disabled="!selectedSmelterId || chartLoading || listLoading" @click="handleQuery">
            查询
          </button>
          <button class="btn btn-secondary" :disabled="!selectedSmelterId" @click="resetFilters">重置</button>
        </div>
      </div>

      <div class="chart-section">
        <div class="chart-head">
          <span class="chart-title">标定价格走势</span>
          <span class="chart-legend">
            <span class="legend-item"><i class="legend-line"></i>标定价格</span>
          </span>
        </div>
        <p v-if="chartError" class="inline-error">{{ chartError }}</p>
        <div v-if="!selectedSmelterId" class="chart-empty">请先选择冶炼厂</div>
        <div v-else-if="chartLoading" class="chart-empty">加载走势数据…</div>
        <div v-else-if="chartSeries.length === 0" class="chart-empty">暂无走势数据，请调整日期范围后查询</div>
        <div v-else class="chart-wrap">
          <canvas
            ref="chartCanvasRef"
            class="chart-canvas"
            @mousemove="onChartMouseMove"
            @mouseleave="onChartMouseLeave"
          />
          <div
            v-if="chartHoverIndex >= 0"
            class="chart-tooltip"
            :style="chartTooltipStyle"
          >
            <div class="chart-tooltip-date">{{ chartSeries[chartHoverIndex]?.date }}</div>
            <div class="chart-tooltip-price">
              {{ formatPrice(chartSeries[chartHoverIndex]?.price ?? 0) }} 元/吨
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="table-head">
        <span class="table-title">历史记录</span>
        <span class="table-count">共 {{ listTotal }} 条</span>
      </div>
      <p v-if="listError" class="inline-error">{{ listError }}</p>
      <div class="table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th>冶炼厂</th>
              <th>标定价格（元/吨）</th>
              <th>定价日期</th>
              <th>涨跌</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="listLoading">
              <td colspan="4" class="empty-data">加载中…</td>
            </tr>
            <tr v-else-if="!selectedSmelterId">
              <td colspan="4" class="empty-data">请先选择冶炼厂</td>
            </tr>
            <tr v-else-if="listRows.length === 0">
              <td colspan="4" class="empty-data">暂无历史数据</td>
            </tr>
            <tr v-for="(row, idx) in listRows" v-else :key="row.id">
              <td>{{ row.smelter || smelterName(row.smelterId) }}</td>
              <td class="col-price">{{ formatPrice(row.price) }}</td>
              <td>{{ row.date }}</td>
              <td>
                <span v-if="rowChange(row, idx) !== null" :class="rowChange(row, idx)! >= 0 ? 'chg-up' : 'chg-down'">
                  {{ formatChange(rowChange(row, idx)!) }}
                </span>
                <span v-else class="text-muted">—</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="pagination">
        <button :disabled="listPage <= 1 || listLoading" @click="gotoPage(listPage - 1)">上一页</button>
        <span>第 {{ listPage }} / {{ listTotalPages }} 页（每页 {{ listPageSize }} 条）</span>
        <button :disabled="listPage >= listTotalPages || listLoading" @click="gotoPage(listPage + 1)">下一页</button>
      </div>
    </div>

    <p class="page-footer">
      数据为各冶炼厂标定价格，仅供参考。新增与修改请前往「AI 定价 → 冶炼厂标定价格」维护。
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { fetchTlSmeltersAll } from '@/api/tlApi'
import {
  fetchLatestCalibrationForSmelter,
  fetchSmelterCalibrationChartSeries,
  fetchSmelterCalibrationForQuery,
  formatSmelterCalibrationError,
  type SmelterPriceRow,
} from '@/api/smelterPriceApi'

const emit = defineEmits<{ maintain: [] }>()

interface SmelterOption {
  id: number
  name: string
}

const smelterOptions = ref<SmelterOption[]>([])
const selectedSmelterId = ref(0)

const latest = ref<SmelterPriceRow | null>(null)
const latestLoading = ref(false)
const latestError = ref('')

const filters = ref({ dateFrom: '', dateTo: '' })
const chartSeries = ref<SmelterPriceRow[]>([])
const chartLoading = ref(false)
const chartError = ref('')
const chartCanvasRef = ref<HTMLCanvasElement | null>(null)
const chartHoverIndex = ref(-1)
const chartTooltipStyle = ref<Record<string, string>>({})

interface ChartLayout {
  width: number
  height: number
  margin: { t: number; r: number; b: number; l: number }
  toX: (i: number) => number
  toY: (v: number) => number
}

let chartLayout: ChartLayout | null = null
const CHART_HIT_RADIUS = 14

const listAllRows = ref<SmelterPriceRow[]>([])
const listPage = ref(1)
const listPageSize = 20
const listLoading = ref(false)
const listError = ref('')

const listTotal = computed(() => listAllRows.value.length)
const listRows = computed(() => {
  const start = (listPage.value - 1) * listPageSize
  return listAllRows.value.slice(start, start + listPageSize)
})
const listTotalPages = computed(() => Math.max(1, Math.ceil(listTotal.value / listPageSize)))

const dayChange = computed(() => {
  if (!latest.value || chartSeries.value.length < 2) return null
  const sorted = [...chartSeries.value].sort((a, b) => a.date.localeCompare(b.date))
  const idx = sorted.findIndex((r) => r.date === latest.value!.date)
  if (idx <= 0) return null
  return latest.value.price - sorted[idx - 1]!.price
})

const dayChangePct = computed(() => {
  if (dayChange.value === null || !latest.value) return null
  const sorted = [...chartSeries.value].sort((a, b) => a.date.localeCompare(b.date))
  const idx = sorted.findIndex((r) => r.date === latest.value!.date)
  if (idx <= 0) return null
  const prev = sorted[idx - 1]!.price
  if (prev === 0) return null
  return (dayChange.value / prev) * 100
})

function smelterName(id: number): string {
  return smelterOptions.value.find((s) => s.id === id)?.name ?? '—'
}

function formatPrice(n: number): string {
  if (!Number.isFinite(n)) return '—'
  return n.toLocaleString('zh-CN', { maximumFractionDigits: 0 })
}

function formatChange(n: number): string {
  const sign = n >= 0 ? '+' : ''
  return `${sign}${formatPrice(n)}`
}

function defaultChartDateRange(): { from: string; to: string } {
  const to = new Date()
  const from = new Date()
  from.setMonth(from.getMonth() - 3)
  const fmt = (d: Date) => d.toISOString().slice(0, 10)
  return { from: fmt(from), to: fmt(to) }
}

function rowChange(row: SmelterPriceRow, idx: number): number | null {
  const prev = listRows.value[idx + 1]
  if (!prev) return null
  return row.price - prev.price
}

async function loadSmelterOptions() {
  try {
    const rows = await fetchTlSmeltersAll()
    smelterOptions.value = rows
      .map((r) => ({
        id: Number(r['冶炼厂id'] ?? r.id ?? 0),
        name: String(r['冶炼厂'] ?? r.name ?? ''),
      }))
      .filter((s) => s.id > 0 && s.name)
    if (smelterOptions.value.length > 0 && !selectedSmelterId.value) {
      selectedSmelterId.value = smelterOptions.value[0]!.id
    }
  } catch {
    smelterOptions.value = []
  }
}

async function loadLatest() {
  if (!selectedSmelterId.value) {
    latest.value = null
    return
  }
  latestLoading.value = true
  latestError.value = ''
  try {
    latest.value = await fetchLatestCalibrationForSmelter(selectedSmelterId.value)
  } catch (e) {
    latestError.value = formatSmelterCalibrationError(e)
    latest.value = null
  } finally {
    latestLoading.value = false
  }
}

async function loadChart() {
  if (!selectedSmelterId.value) {
    chartSeries.value = []
    return
  }
  chartLoading.value = true
  chartError.value = ''
  const range = filters.value.dateFrom && filters.value.dateTo
    ? { from: filters.value.dateFrom, to: filters.value.dateTo }
    : defaultChartDateRange()
  try {
    chartSeries.value = await fetchSmelterCalibrationChartSeries(
      selectedSmelterId.value,
      range.from,
      range.to,
    )
  } catch (e) {
    chartError.value = formatSmelterCalibrationError(e)
    chartSeries.value = []
  } finally {
    chartLoading.value = false
    await nextTick()
    drawChart()
  }
}

async function loadList() {
  if (!selectedSmelterId.value) {
    listAllRows.value = []
    return
  }
  listLoading.value = true
  listError.value = ''
  try {
    listAllRows.value = await fetchSmelterCalibrationForQuery({
      smelter_id: selectedSmelterId.value,
      date_from: filters.value.dateFrom || undefined,
      date_to: filters.value.dateTo || undefined,
      page_size: 500,
    })
  } catch (e) {
    listError.value = formatSmelterCalibrationError(e)
    listAllRows.value = []
  } finally {
    listLoading.value = false
  }
}

async function reloadAll() {
  await Promise.all([loadLatest(), loadChart(), loadList()])
}

async function onSmelterChange() {
  listPage.value = 1
  await reloadAll()
}

async function handleQuery() {
  listPage.value = 1
  await Promise.all([loadChart(), loadList()])
}

function resetFilters() {
  filters.value = { dateFrom: '', dateTo: '' }
  listPage.value = 1
  void loadChart()
  void loadList()
}

function gotoPage(p: number) {
  listPage.value = p
}

function buildChartLayout(
  width: number,
  height: number,
  _prices: number[],
  n: number,
): ChartLayout & { W: number; H: number; yMin: number; yMax: number; yRange: number } {
  const margin = { t: 24, r: 20, b: 44, l: 72 }
  const W = width - margin.l - margin.r
  const H = height - margin.t - margin.b
  const yMin = 0
  const yMax = 400
  const yRange = yMax - yMin
  const xStep = n <= 1 ? W / 2 : W / (n - 1)
  const toY = (v: number) => margin.t + H - ((v - yMin) / yRange) * H
  const toX = (i: number) => margin.l + i * xStep
  return { width, height, margin, W, H, yMin, yMax, yRange, toX, toY }
}

function drawChart(highlightIndex = -1) {
  const canvas = chartCanvasRef.value
  if (!canvas || chartSeries.value.length === 0) {
    chartLayout = null
    return
  }

  const series = chartSeries.value
  const dates = series.map((r) => r.date)
  const prices = series.map((r) => r.price)

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const wrap = canvas.parentElement
  const width = Math.max((wrap?.clientWidth ?? 720) - 8, 320)
  const height = 280
  canvas.width = width
  canvas.height = height

  const layout = buildChartLayout(width, height, prices, dates.length)
  const { margin, W, H, toX, toY } = layout
  chartLayout = layout
  const n = dates.length

  ctx.fillStyle = '#fff'
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
    const val = layout.yMin + (i / ySteps) * layout.yRange
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
  prices.forEach((v, i) => {
    const x = toX(i)
    const y = toY(v)
    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  })
  ctx.stroke()

  prices.forEach((v, i) => {
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
    const label = d.length >= 10 ? d.slice(5) : d
    ctx.fillText(label, toX(i) - 16, margin.t + H + 28)
  })

  ctx.fillStyle = '#475569'
  ctx.font = '12px system-ui, sans-serif'
  ctx.fillText('标定价格（元/吨）', margin.l, margin.t - 8)
  ctx.fillText('定价日期', margin.l + W / 2 - 28, height - 8)

  if (highlightIndex >= 0) {
    updateChartTooltipPosition(highlightIndex)
  }
}

function canvasPointer(ev: MouseEvent): { x: number; y: number } {
  const canvas = chartCanvasRef.value!
  const rect = canvas.getBoundingClientRect()
  const scaleX = canvas.width / rect.width
  const scaleY = canvas.height / rect.height
  return {
    x: (ev.clientX - rect.left) * scaleX,
    y: (ev.clientY - rect.top) * scaleY,
  }
}

function findNearestChartPoint(px: number, py: number): number {
  if (!chartLayout) return -1
  const series = chartSeries.value
  let best = -1
  let bestDist = CHART_HIT_RADIUS
  series.forEach((row, i) => {
    const dx = px - chartLayout!.toX(i)
    const dy = py - chartLayout!.toY(row.price)
    const d = Math.hypot(dx, dy)
    if (d < bestDist) {
      bestDist = d
      best = i
    }
  })
  return best
}

function updateChartTooltipPosition(index: number) {
  const canvas = chartCanvasRef.value
  if (!canvas || !chartLayout || index < 0) return
  const row = chartSeries.value[index]
  if (!row) return
  const rect = canvas.getBoundingClientRect()
  const scaleX = rect.width / canvas.width
  const scaleY = rect.height / canvas.height
  const left = chartLayout.toX(index) * scaleX
  const top = chartLayout.toY(row.price) * scaleY
  chartTooltipStyle.value = {
    left: `${left}px`,
    top: `${top}px`,
    transform: 'translate(-50%, calc(-100% - 10px))',
  }
}

function onChartMouseMove(ev: MouseEvent) {
  if (!chartLayout || chartSeries.value.length === 0) return
  const { x, y } = canvasPointer(ev)
  const hit = findNearestChartPoint(x, y)
  if (hit === chartHoverIndex.value) return
  chartHoverIndex.value = hit
  drawChart(hit)
}

function onChartMouseLeave() {
  if (chartHoverIndex.value < 0) return
  chartHoverIndex.value = -1
  chartTooltipStyle.value = {}
  drawChart(-1)
}

let chartResizeHandler: (() => void) | null = null

watch(chartSeries, () => {
  chartHoverIndex.value = -1
  chartTooltipStyle.value = {}
  nextTick(() => drawChart(-1))
})

onMounted(async () => {
  await loadSmelterOptions()
  if (selectedSmelterId.value) {
    await reloadAll()
  }
  chartResizeHandler = () => drawChart(chartHoverIndex.value)
  window.addEventListener('resize', chartResizeHandler)
})

onBeforeUnmount(() => {
  if (chartResizeHandler) window.removeEventListener('resize', chartResizeHandler)
})
</script>

<style scoped>
.smelter-price-query-page { width: 100%; animation: fadeIn 0.25s ease both; }
.card { background: white; border-radius: 8px; padding: 16px 20px; margin-bottom: 16px; box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05); }
.summary-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; flex-wrap: wrap; }
.summary-head-main { flex: 1; min-width: 200px; }
.smelter-select-wrap { display: flex; flex-direction: column; gap: 4px; margin-bottom: 8px; }
.smelter-select-label { font-size: 12px; font-weight: 500; color: #606266; }
.smelter-select { min-width: 220px; max-width: 360px; }
.summary-meta { margin: 0; font-size: 13px; color: #606266; }
.summary-loading { padding: 24px 0; color: #909399; text-align: center; }
.price-summary { display: flex; align-items: flex-end; gap: 16px; margin-top: 16px; flex-wrap: wrap; }
.price-cell { display: flex; flex-direction: column; gap: 4px; }
.price-cell--main { align-items: flex-start; }
.price-label { font-size: 12px; color: #909399; }
.price-value { font-size: 22px; font-weight: 600; color: #2c3e50; }
.price-value--main { font-size: 32px; color: #1476db; }
.price-unit { font-size: 14px; color: #606266; padding-bottom: 4px; }
.price-change { font-size: 13px; margin-top: 4px; }
.price-change.up, .chg-up { color: #e53935; }
.price-change.down, .chg-down { color: #2e7d32; }
.filter-row { display: flex; flex-wrap: wrap; gap: 12px; align-items: flex-end; margin-bottom: 16px; }
.filter-item { display: flex; flex-direction: column; gap: 4px; }
.filter-item label { font-size: 12px; font-weight: 500; color: #606266; }
.date-range { display: flex; gap: 6px; align-items: center; }
.filter-input { padding: 6px 10px; border: 1px solid #e5e9f2; border-radius: 4px; font-size: 13px; }
.date-input { width: 130px; }
.filter-actions { display: flex; gap: 8px; margin-left: auto; }
.btn { padding: 6px 16px; border: none; border-radius: 4px; cursor: pointer; font-size: 13px; font-weight: 500; }
.btn:disabled { opacity: 0.6; cursor: not-allowed; }
.btn-primary { background: #1476db; color: white; }
.btn-secondary { background: #f5f7fa; color: #606266; border: 1px solid #e5e9f2; }
.chart-section { border-top: 1px solid #e5e9f2; padding-top: 16px; }
.chart-head { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px; margin-bottom: 12px; }
.chart-title { font-size: 14px; font-weight: 600; color: #2c3e50; }
.chart-legend { display: flex; gap: 16px; font-size: 12px; color: #606266; }
.legend-item { display: inline-flex; align-items: center; gap: 6px; }
.legend-line { display: inline-block; width: 16px; height: 2px; background: #1476db; }
.chart-wrap { position: relative; width: 100%; overflow-x: auto; }
.chart-canvas { display: block; width: 100%; cursor: crosshair; }
.chart-tooltip {
  position: absolute;
  z-index: 2;
  pointer-events: none;
  padding: 6px 10px;
  background: rgba(31, 45, 61, 0.92);
  color: #fff;
  border-radius: 4px;
  font-size: 12px;
  line-height: 1.45;
  white-space: nowrap;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}
.chart-tooltip-date { color: #cbd5e1; font-size: 11px; margin-bottom: 2px; }
.chart-tooltip-price { font-weight: 600; }
.chart-empty { text-align: center; padding: 48px 16px; color: #909399; font-size: 14px; }
.table-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
.table-title { font-size: 14px; font-weight: 600; color: #2c3e50; }
.table-count { font-size: 12px; color: #909399; }
.table-wrapper { overflow-x: auto; border: 1px solid #e5e9f2; border-radius: 4px; }
.data-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.data-table th, .data-table td { padding: 10px 12px; text-align: center; border-bottom: 1px solid #e5e9f2; white-space: nowrap; }
.data-table th { background: #e8f0f8; font-weight: 600; color: #2c3e50; }
.col-price { font-weight: 600; color: #1476db; }
.empty-data { padding: 40px; color: #909399; }
.pagination { display: flex; justify-content: flex-end; align-items: center; gap: 12px; margin-top: 16px; }
.pagination button { padding: 4px 12px; border: 1px solid #e5e9f2; background: white; border-radius: 4px; cursor: pointer; }
.pagination button:disabled { opacity: 0.5; cursor: not-allowed; }
.inline-error { color: #e53935; font-size: 13px; margin: 0 0 8px; }
.inline-warn { color: #f57c00; font-size: 13px; margin: 0 0 8px; }
.text-muted { color: #909399; }
.page-footer { font-size: 12px; color: #909399; line-height: 1.6; margin: 0 4px 8px; }
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
</style>
