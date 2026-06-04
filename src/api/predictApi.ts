/**
 * AI 智能预测 v2 — /predict/results 已落库预测结果。
 * 替代旧版规则预测 /forecast/* 管线。
 */
import axios from 'axios'
import { ApiPaths } from './paths'
import { pickStr, pickNum } from '../utils/apiFieldPick'

// ─── 类型 ────────────────────────────────────────────────

/** v2 预测结果明细行 */
export interface PredictResultRow {
  targetDate: string
  regionalManager: string
  smelter: string | null
  warehouse: string
  productVariety: string
  expectedShipment: number
  analysis: string | null
  shipProbability: string
  expectedShipDate: string | null
  confidenceLevel: string
  mainFactors: string
  comprehensiveAnalysis: string
  historyAnalysis: string
  priceSensitivityAnalysis: string
  priceCompetitivenessAnalysis: string
  holidayAnalysis: string
  weatherAnalysis: string
  raw: Record<string, unknown>
}

/** 客户端聚合图表数据（替代 /forecast/chart） */
export interface PredictChartAggregate {
  dates: string[]
  totalByDate: number[]
}

// ─── 工具 ────────────────────────────────────────────────

function pickStrOrNull(row: Record<string, unknown>, keys: string[]): string | null {
  const s = pickStr(row, keys)
  return s || null
}

// ─── Normalize ───────────────────────────────────────────

/** 将单条原始响应行解析为 PredictResultRow */
export function normalizePredictResultRow(raw: unknown): PredictResultRow | null {
  const r = raw && typeof raw === 'object' && !Array.isArray(raw) ? (raw as Record<string, unknown>) : {}
  const targetDate = pickStr(r, ['target_date', 'targetDate', '预测日期', 'date'])
  if (!targetDate) return null

  const analysis = pickStr(r, ['analysis', 'Analysis']) || null
  return {
    targetDate,
    regionalManager: pickStr(r, ['regional_manager', 'regionalManager', '大区经理', '经理']) || '—',
    smelter: pickStrOrNull(r, ['smelter', '冶炼厂', 'smelter_name', '冶炼厂名']),
    warehouse: pickStr(r, ['warehouse', '仓库', 'warehouse_name', '仓库名']) || '—',
    productVariety: pickStr(r, ['product_variety', 'productVariety', '品类', '品种', '产品品种']) || '—',
    expectedShipment: pickNum(r, ['expected_shipment', 'expectedShipment', 'predicted_weight', 'predictedWeight', '预测重量', 'weight']) ?? 0,
    analysis,
    shipProbability: pickStr(r, ['ship_probability', 'shipProbability']),
    expectedShipDate: pickStrOrNull(r, ['expected_ship_date', 'expectedShipDate']),
    confidenceLevel: pickStr(r, ['confidence_level', 'confidenceLevel']),
    mainFactors: pickStr(r, ['main_factors', 'mainFactors']) || analysis || '',
    comprehensiveAnalysis: pickStr(r, ['comprehensive_analysis', 'comprehensiveAnalysis']) || analysis || '',
    historyAnalysis: pickStr(r, ['history_analysis', 'historyAnalysis']),
    priceSensitivityAnalysis: pickStr(r, ['price_sensitivity_analysis', 'priceSensitivityAnalysis']),
    priceCompetitivenessAnalysis: pickStr(r, ['price_competitiveness_analysis', 'priceCompetitivenessAnalysis']),
    holidayAnalysis: pickStr(r, ['holiday_analysis', 'holidayAnalysis']),
    weatherAnalysis: pickStr(r, ['weather_analysis', 'weatherAnalysis']),
    raw: r,
  }
}

/** 批量解析 */
export function normalizePredictResultList(items: unknown[]): PredictResultRow[] {
  const out: PredictResultRow[] = []
  for (const raw of items) {
    const row = normalizePredictResultRow(raw)
    if (row) out.push(row)
  }
  return out
}

// ─── Trigger Prediction ──────────────────────────────────

/** 触发预测的请求参数 */
export interface TriggerPredictionParams {
  warehouse: string
  productVariety?: string
  smelter?: string
  startDate?: string
  endDate?: string
}

/**
 * 调用 POST /predict 触发 AI 预测。
 * 后端会自动从数据库加载历史数据、冶炼厂价格、SMM 铅价。
 * 预测结果自动写入 pd_ip_prediction_results 表。
 */
export async function triggerPrediction(params: TriggerPredictionParams): Promise<void> {
  const item: Record<string, unknown> = {
    warehouse: params.warehouse,
  }
  if (params.productVariety) item.product_variety = params.productVariety
  if (params.startDate) item.prediction_start_date = params.startDate

  await axios.post(ApiPaths.predict, { items: [item] }, { timeout: 300000 })
}

// ─── Fetch ───────────────────────────────────────────────

/** 筛选参数：与 buildForecastFilterParams() 输出一致 */
export type PredictFilterParams = Record<string, string | number | string[] | undefined>

/**
 * 分页拉取 /predict/results 所有结果。
 * page_size 固定 200（v2 后端上限）。
 */
export async function fetchAllPredictResults(
  base: PredictFilterParams,
): Promise<PredictResultRow[]> {
  const page_size = 200
  const rawItems: unknown[] = []
  let page = 1
  while (page <= 200) {
    const params: Record<string, unknown> = { ...base, page, page_size }
    const response = await axios.get(ApiPaths.predictResults, { params })
    const data = response.data as { items?: unknown[]; total?: number }
    const items = data.items ?? []
    rawItems.push(...items)
    if (items.length === 0) break
    if (items.length < page_size) break
    if (typeof data.total === 'number' && rawItems.length >= data.total) break
    page++
  }
  return normalizePredictResultList(rawItems)
}

// ─── Aggregate ───────────────────────────────────────────

/**
 * 客户端图表聚合：从 v2 明细行按 targetDate 分组求和 expectedShipment。
 * 替代旧的 /forecast/chart 接口。
 */
export function aggregateChartFromResults(rows: PredictResultRow[]): PredictChartAggregate {
  const byDate = new Map<string, number>()
  for (const row of rows) {
    const d = row.targetDate
    if (!d) continue
    byDate.set(d, (byDate.get(d) || 0) + row.expectedShipment)
  }
  const sorted = [...byDate.entries()].sort((a, b) => a[0].localeCompare(b[0], 'zh-CN'))
  return {
    dates: sorted.map(([d]) => d),
    totalByDate: sorted.map(([, weight]) => weight),
  }
}
