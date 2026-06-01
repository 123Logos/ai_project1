/**

 * 规则预测 /forecast（snake_case，HTTP 200 直接返回 JSON，无 { code, data } 包装）。

 * 联调说明见项目 docs/forecast-frontend-integration.md

 */

import axios from 'axios'

import { ApiPaths } from './paths'

import { pickAnalysisText, pickField, pickNum, pickStr } from '../utils/apiFieldPick'



function pickStrOrNull(row: Record<string, unknown>, keys: string[]): string | null {

  const s = pickStr(row, keys)

  return s || null

}



function pickNumOrNull(row: Record<string, unknown>, keys: string[]): number | null {

  return pickNum(row, keys)

}



/** GET /forecast/chart 响应体 */

export interface PrdForecastChartResponse {

  dates: string[]

  totalByDate: number[]

  byRegionalManager: PrdForecastByRmSeries[]

  warehouseProfiles: PrdForecastWarehouseProfile[]

  /** 区间汇总预测依据；无历史时也为说明文案 */

  summaryAnalysis: string

}



export interface PrdForecastByRmSeries {

  regionalManager: string

  totals: number[]

}



export type PriceSensitivity = 'sensitive' | 'medium' | 'stable'



export interface PrdForecastWarehouseProfile {

  warehouse: string

  productVariety: string

  priceSensitivity: PriceSensitivity | string

  priceCorrelation: number | null

  capacityMax: number

  capacityMin: number

  capacityAvg: number

}



/** GET /forecast/details 响应体 */

export interface PrdForecastDetailResponse {

  total: number

  page: number

  pageSize: number

  items: PrdForecastDetailRow[]

}



/** 明细行（与 export Excel 列一致） */

export interface PrdForecastDetailRow {

  targetDate: string

  regionalManager: string

  smelter: string | null

  warehouse: string

  productVariety: string

  predictedWeight: number

  analysis: string | null

  wmaBase: number | null

  weekCoef: number | null

  historyBaseline: number | null

  priceFactor: number | null

  leadMarketPrice: number | null

  ownCalibrationPrice: number | null

  competitorPriceMax: number | null

  priceSensitivity: string | null

  raw: Record<string, unknown>

}



/** chart / details / export 共用筛选 Query（snake_case） */

export type ForecastFilterParams = Record<string, string | number | string[] | undefined>



function asRecord(v: unknown): Record<string, unknown> {

  return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {}

}



function pickSummaryAnalysis(data: Record<string, unknown>): string {
  const v = pickField(data, ['summary_analysis', 'summaryAnalysis'])
  if (v == null) return ''
  return String(v).trim()
}

/** 解析 chart 根对象（兼容极少数网关再包 data 的情况） */
function resolveChartRoot(raw: unknown): Record<string, unknown> {
  const top = asRecord(raw)
  for (const key of ['data', 'result', 'payload'] as const) {
    const inner = top[key]
    if (inner && typeof inner === 'object' && !Array.isArray(inner)) {
      const nested = inner as Record<string, unknown>
      if (pickSummaryAnalysis(nested) || pickField(nested, ['dates']) != null) {
        return nested
      }
    }
  }
  return top
}



function normalizeWarehouseProfile(raw: unknown): PrdForecastWarehouseProfile | null {

  const r = asRecord(raw)

  const warehouse = pickStr(r, ['warehouse'])

  if (!warehouse) return null

  return {

    warehouse,

    productVariety: pickStr(r, ['product_variety', 'productVariety']) || '—',

    priceSensitivity: pickStr(r, ['price_sensitivity', 'priceSensitivity']) || 'medium',

    priceCorrelation: pickNumOrNull(r, ['price_correlation', 'priceCorrelation']),

    capacityMax: pickNum(r, ['capacity_max', 'capacityMax']) ?? 0,

    capacityMin: pickNum(r, ['capacity_min', 'capacityMin']) ?? 0,

    capacityAvg: pickNum(r, ['capacity_avg', 'capacityAvg']) ?? 0,

  }

}



function normalizeChartResponse(raw: unknown): PrdForecastChartResponse {
  const o = resolveChartRoot(raw)

  const dates = (pickField(o, ['dates']) as string[] | undefined) ?? []

  const totalRaw = pickField(o, ['total_by_date', 'totalByDate']) as Array<number | string> | undefined

  const totalByDate = Array.isArray(totalRaw) ? totalRaw.map((n) => Number(n) || 0) : []

  const byRmRaw = pickField(o, ['by_regional_manager', 'byRegionalManager'])

  const byRegionalManager: PrdForecastByRmSeries[] = []

  if (Array.isArray(byRmRaw)) {

    for (const item of byRmRaw) {

      const r = asRecord(item)

      const name = pickStr(r, ['regional_manager', 'regionalManager', 'name'])

      const totalsRaw = pickField(r, ['totals', 'values']) as Array<number | string> | undefined

      byRegionalManager.push({

        regionalManager: name || '—',

        totals: Array.isArray(totalsRaw) ? totalsRaw.map((n) => Number(n) || 0) : [],

      })

    }

  }

  const profilesRaw = pickField(o, ['warehouse_profiles', 'warehouseProfiles'])

  const warehouseProfiles: PrdForecastWarehouseProfile[] = []

  if (Array.isArray(profilesRaw)) {

    for (const p of profilesRaw) {

      const row = normalizeWarehouseProfile(p)

      if (row) warehouseProfiles.push(row)

    }

  }

  return {

    dates: dates.map(String),

    totalByDate,

    byRegionalManager,

    warehouseProfiles,

    summaryAnalysis: pickSummaryAnalysis(o),

  }

}



export function normalizeForecastDetailRow(raw: unknown): PrdForecastDetailRow | null {

  const r = asRecord(raw)

  const targetDate = pickStr(r, ['target_date', 'targetDate', 'date'])

  if (!targetDate) return null

  return {

    targetDate,

    regionalManager: pickStr(r, ['regional_manager', 'regionalManager']) || '—',

    smelter: pickStrOrNull(r, ['smelter']),

    warehouse: pickStr(r, ['warehouse']) || '—',

    productVariety: pickStr(r, ['product_variety', 'productVariety']) || '—',

    predictedWeight: pickNum(r, ['predicted_weight', 'predictedWeight']) ?? 0,

    analysis: pickAnalysisText(r),

    wmaBase: pickNumOrNull(r, ['wma_base', 'wmaBase']),

    weekCoef: pickNumOrNull(r, ['week_coef', 'weekCoef']),

    historyBaseline: pickNumOrNull(r, ['history_baseline', 'historyBaseline']),

    priceFactor: pickNumOrNull(r, ['price_factor', 'priceFactor']),

    leadMarketPrice: pickNumOrNull(r, ['lead_market_price', 'leadMarketPrice']),

    ownCalibrationPrice: pickNumOrNull(r, ['own_calibration_price', 'ownCalibrationPrice']),

    competitorPriceMax: pickNumOrNull(r, ['competitor_price_max', 'competitorPriceMax']),

    priceSensitivity: pickStrOrNull(r, ['price_sensitivity', 'priceSensitivity']),

    raw: r,

  }

}



export async function fetchForecastChart(params: ForecastFilterParams): Promise<PrdForecastChartResponse> {
  const { data } = await axios.get(ApiPaths.forecastChart, { params })
  const chart = normalizeChartResponse(data)
  if (import.meta.env.DEV && !chart.summaryAnalysis && chart.dates.length > 0) {
    console.warn(
      '[forecast/chart] 响应含 dates 但缺少 summary_analysis，请确认后端已部署预测依据字段。',
      data,
    )
  }
  return chart
}



export async function fetchForecastDetailsPage(

  params: ForecastFilterParams & { page: number; page_size: number },

): Promise<PrdForecastDetailResponse> {

  const { data } = await axios.get(ApiPaths.forecastDetail, { params })

  const o = asRecord(data)

  const itemsRaw = pickField(o, ['items']) as unknown[] | undefined

  const items: PrdForecastDetailRow[] = []

  if (Array.isArray(itemsRaw)) {

    for (const raw of itemsRaw) {

      const row = normalizeForecastDetailRow(raw)

      if (row) items.push(row)

    }

  }

  return {

    total: Number(pickField(o, ['total']) ?? items.length),

    page: Number(pickField(o, ['page']) ?? params.page),

    pageSize: Number(pickField(o, ['page_size', 'pageSize']) ?? params.page_size),

    items,

  }

}



export function normalizeForecastDetailList(items: unknown[]): PrdForecastDetailRow[] {

  const out: PrdForecastDetailRow[] = []

  for (const raw of items) {

    const row = normalizeForecastDetailRow(raw)

    if (row) out.push(row)

  }

  return out

}


