import { fetchJson } from './userApi'
import { getToken } from './authApi'

export interface SmelterPriceRow {
  id: number
  smelterId: number
  smelter: string
  price: number
  date: string
  isLatest: boolean
}

export interface SmelterPriceHistoryRow {
  id: number
  smelter: string
  price: number
  operator: string
  change_time: string
}

export interface SmelterCalibrationPriceCreate {
  冶炼厂id: number
  标定价格: number
  定价日期?: string
}

export interface SmelterCalibrationBatchResult {
  inserted: number
  ids: number[]
}

export interface SmelterCalibrationExcelImportResult {
  sheet: string
  header_row: number
  columns: Record<string, string | null>
  parsed_rows: number
  skipped_empty: number
  inserted: number
  skipped_errors: number
  ids: number[]
  errors: string[]
  samples: Array<{
    Excel行: number
    id: number
    冶炼厂id: number
    标定价格: number
    定价日期: string
  }>
}

function authHeaders(): HeadersInit {
  const token = getToken()
  if (!token) return {}
  return { Authorization: `Bearer ${token}` }
}

const BASE = '/tl/smelter_calibration_prices'

function readMsg(data: unknown): string {
  if (!data || typeof data !== 'object') return ''
  const o = data as Record<string, unknown>
  if (typeof o.msg === 'string') return o.msg
  if (typeof o.message === 'string') return o.message
  if (typeof o.detail === 'string') return o.detail
  return ''
}

function unwrapData<T>(data: unknown): T {
  if (!data || typeof data !== 'object') return data as T
  const o = data as Record<string, unknown>
  if (o.data !== undefined && o.data !== null) return o.data as T
  return data as T
}

function pickSmelterRow(r: Record<string, unknown>): SmelterPriceRow {
  return {
    id: Number(r.config_id ?? r.id ?? 0),
    smelterId: Number(r['冶炼厂id'] ?? 0),
    smelter: String(r['冶炼厂'] ?? ''),
    price: Number(r['标定价格'] ?? 0),
    date: String(r['定价日期'] ?? ''),
    isLatest: r['是否当前冶炼厂最新'] === true,
  }
}

function pickHistoryRow(r: Record<string, unknown>): SmelterPriceHistoryRow {
  return {
    id: Number(r.id ?? 0),
    smelter: String(r['冶炼厂'] ?? ''),
    price: Number(r['标定价格'] ?? 0),
    operator: String(r['操作人'] ?? r.created_by ?? '-'),
    change_time: String(r['上传时间'] ?? r['定价日期'] ?? ''),
  }
}

function unwrapList(data: unknown): Record<string, unknown>[] {
  if (data == null) return []
  if (typeof data !== 'object') return []
  const o = data as Record<string, unknown>
  const inner = (o.data ?? o) as Record<string, unknown>
  const arr = inner.list
  if (Array.isArray(arr)) return arr.filter((x): x is Record<string, unknown> => !!x && typeof x === 'object')
  return []
}

export class SmelterCalibrationApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'SmelterCalibrationApiError'
    this.status = status
  }
}

function throwIfFailed(res: Response, data: unknown, ctx: string): void {
  if (res.ok) return
  throw new SmelterCalibrationApiError(readMsg(data) || `${ctx}（HTTP ${res.status}）`, res.status)
}

function filterCalibrationRows(
  rows: SmelterPriceRow[],
  opts: { smelter_id?: number; date_from?: string; date_to?: string },
): SmelterPriceRow[] {
  return rows.filter((r) => {
    if (opts.smelter_id != null && opts.smelter_id > 0 && r.smelterId !== opts.smelter_id) return false
    if (opts.date_from && r.date < opts.date_from) return false
    if (opts.date_to && r.date > opts.date_to) return false
    return true
  })
}

export function formatSmelterCalibrationError(e: unknown): string {
  if (e instanceof SmelterCalibrationApiError) {
    if (e.status === 404) return '冶炼厂标定价格接口尚未部署（HTTP 404）。请确认后端已发布对应路由，或联系管理员。'
    return e.message
  }
  if (e instanceof Error) return e.message
  return '请稍后重试'
}

export async function fetchSmelterPrice(): Promise<SmelterPriceRow[]> {
  const q = new URLSearchParams({ page: '1', page_size: '500', only_latest: 'true' })
  const { res, data } = await fetchJson(`${BASE}?${q.toString()}`, {
    method: 'GET',
    headers: { ...authHeaders() },
  })
  if (!res.ok) throw new Error(readMsg(data) || `获取冶炼厂标定价格失败（HTTP ${res.status}）`)
  const rows = unwrapList(data)
  return rows.map(pickSmelterRow).filter((r) => r.isLatest)
}

/** 查询页：拉取标定价格列表（支持筛选；服务端未识别筛选参数时在前端二次过滤） */
export async function fetchSmelterCalibrationForQuery(params: {
  smelter_id?: number
  date_from?: string
  date_to?: string
  page_size?: number
}): Promise<SmelterPriceRow[]> {
  const q = new URLSearchParams()
  q.set('page', '1')
  q.set('page_size', String(params.page_size ?? 500))
  if (params.smelter_id) q.set('冶炼厂id', String(params.smelter_id))
  if (params.date_from) q.set('date_from', params.date_from)
  if (params.date_to) q.set('date_to', params.date_to)
  const { res, data } = await fetchJson(`${BASE}?${q.toString()}`, {
    method: 'GET',
    headers: { ...authHeaders() },
  })
  throwIfFailed(res, data, '获取冶炼厂标定价格列表失败')
  const rows = unwrapList(data).map(pickSmelterRow)
  return filterCalibrationRows(rows, params).sort((a, b) => b.date.localeCompare(a.date))
}

export async function fetchLatestCalibrationForSmelter(smelterId: number): Promise<SmelterPriceRow | null> {
  const rows = await fetchSmelterPrice()
  return rows.find((r) => r.smelterId === smelterId) ?? null
}

/** 走势图：按定价日期升序 */
export async function fetchSmelterCalibrationChartSeries(
  smelterId: number,
  dateFrom: string,
  dateTo: string,
): Promise<SmelterPriceRow[]> {
  const rows = await fetchSmelterCalibrationForQuery({
    smelter_id: smelterId,
    date_from: dateFrom,
    date_to: dateTo,
    page_size: 500,
  })
  return [...rows].sort((a, b) => a.date.localeCompare(b.date))
}

export async function createSmelterPrice(smelterId: number, price: number, date: string): Promise<void> {
  const { res, data } = await fetchJson(BASE, {
    method: 'POST',
    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ '冶炼厂id': smelterId, '标定价格': price, '定价日期': date || null }),
  })
  if (!res.ok) throw new Error(readMsg(data) || `新增冶炼厂标定价格失败（HTTP ${res.status}）`)
}

export async function updateSmelterPrice(priceId: number, price: number, date: string): Promise<void> {
  const { res, data } = await fetchJson(`${BASE}/${priceId}`, {
    method: 'PUT',
    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ '标定价格': price, '定价日期': date || null }),
  })
  if (!res.ok) throw new Error(readMsg(data) || `修改冶炼厂标定价格失败（HTTP ${res.status}）`)
}

export async function deleteSmelterPrice(priceId: number): Promise<void> {
  const { res, data } = await fetchJson(`${BASE}/${priceId}`, {
    method: 'DELETE',
    headers: { ...authHeaders() },
  })
  if (!res.ok) throw new Error(readMsg(data) || `删除冶炼厂标定价格失败（HTTP ${res.status}）`)
}

export async function fetchSmelterPriceHistory(params?: {
  page?: number
  page_size?: number
}): Promise<{ items: SmelterPriceHistoryRow[]; total: number }> {
  const q = new URLSearchParams()
  q.set('page', String(params?.page ?? 1))
  q.set('page_size', String(params?.page_size ?? 20))

  const { res, data } = await fetchJson(`${BASE}?${q.toString()}`, {
    method: 'GET',
    headers: { ...authHeaders() },
  })
  if (!res.ok) throw new Error(readMsg(data) || `获取标定价格历史记录失败（HTTP ${res.status}）`)

  const rows = unwrapList(data)
  const payload = (data || {}) as Record<string, unknown>
  const inner = (payload.data ?? payload) as Record<string, unknown>
  return {
    items: rows.map(pickHistoryRow),
    total: typeof inner.total === 'number' ? inner.total : rows.length,
  }
}

/** 线上未部署 POST …/batch 时，请求会落到 /{price_id} 并返回 405 */
export class SmelterBatchUnavailableError extends Error {
  constructor() {
    super('Method Not Allowed')
    this.name = 'SmelterBatchUnavailableError'
  }
}

export async function batchCreateSmelterPrice(
  items: SmelterCalibrationPriceCreate[],
): Promise<SmelterCalibrationBatchResult> {
  const { res, data } = await fetchJson(`${BASE}/batch`, {
    method: 'POST',
    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ 列表: items }),
  })
  if (res.status === 405) throw new SmelterBatchUnavailableError()
  if (!res.ok) throw new Error(readMsg(data) || `批量新增冶炼厂标定价格失败（HTTP ${res.status}）`)
  return unwrapData<SmelterCalibrationBatchResult>(data)
}

/** 批量接口不可用时的兼容：逐条 POST，非事务（中途失败不会回滚已写入行） */
export async function batchCreateSmelterPriceOneByOne(
  items: SmelterCalibrationPriceCreate[],
): Promise<SmelterCalibrationBatchResult> {
  for (let i = 0; i < items.length; i++) {
    const item = items[i]!
    try {
      await createSmelterPrice(item.冶炼厂id, item.标定价格, item.定价日期 ?? '')
    } catch (e) {
      const detail = e instanceof Error ? e.message : String(e)
      throw new Error(
        `第 ${i + 1} 条提交失败：${detail}（已成功 ${i} 条，无法自动回滚，请核对列表后重试）`,
      )
    }
  }
  return { inserted: items.length, ids: [] }
}

export async function importSmelterCalibrationExcel(
  file: File,
): Promise<SmelterCalibrationExcelImportResult> {
  const fd = new FormData()
  fd.append('file', file)
  const res = await fetch('/tl/import_smelter_calibration_excel', {
    method: 'POST',
    headers: { ...authHeaders() },
    body: fd,
  })
  const text = await res.text()
  let data: unknown = {}
  try {
    if (text) data = JSON.parse(text)
  } catch { /* ignore */ }
  if (!res.ok) throw new Error(readMsg(data) || text || `导入冶炼厂标定价格失败（HTTP ${res.status}）`)
  return unwrapData<SmelterCalibrationExcelImportResult>(data)
}
