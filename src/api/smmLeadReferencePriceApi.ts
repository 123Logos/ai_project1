import { fetchJson } from './userApi'
import { getToken } from './authApi'

/** 单条 SMM 1#铅锭参考价 */
export interface SmmLeadReferencePrice {
  id: number
  产品: string
  最低价: number
  最高价: number
  均价: number
  单位: string
  定价日期: string
  数据来源: string
  抓取时间: string | null
  备注: string
}

export interface SmmLeadReferencePriceListPayload {
  total: number
  page: number
  page_size: number
  list: SmmLeadReferencePrice[]
}

const LATEST_PATH = '/tl/smm_lead_reference_price'
const LIST_PATH = '/tl/smm_lead_reference_prices'
const SYNC_PATH = '/tl/smm_lead_reference_price/sync'

function authHeaders(): HeadersInit {
  const token = getToken()
  if (!token) return {}
  return { Authorization: `Bearer ${token}` }
}

function readMsg(data: unknown): string {
  if (!data || typeof data !== 'object') return ''
  const o = data as Record<string, unknown>
  if (typeof o.msg === 'string') return o.msg
  if (typeof o.message === 'string') return o.message
  if (typeof o.detail === 'string') return o.detail
  return ''
}

function pickRow(r: Record<string, unknown>): SmmLeadReferencePrice {
  return {
    id: Number(r.id ?? 0),
    产品: String(r['产品'] ?? 'SMM 1#铅锭'),
    最低价: Number(r['最低价'] ?? 0),
    最高价: Number(r['最高价'] ?? 0),
    均价: Number(r['均价'] ?? 0),
    单位: String(r['单位'] ?? '元/吨'),
    定价日期: String(r['定价日期'] ?? ''),
    数据来源: String(r['数据来源'] ?? ''),
    抓取时间: r['抓取时间'] == null ? null : String(r['抓取时间']),
    备注: String(r['备注'] ?? ''),
  }
}

function unwrapData(raw: unknown): unknown {
  if (raw != null && typeof raw === 'object' && !Array.isArray(raw)) {
    const o = raw as Record<string, unknown>
    if (o.data !== undefined) return o.data
  }
  return raw
}

function unwrapListPayload(raw: unknown): SmmLeadReferencePriceListPayload {
  const inner = unwrapData(raw) as Record<string, unknown>
  const listRaw = inner.list
  const list = Array.isArray(listRaw)
    ? listRaw
        .filter((x): x is Record<string, unknown> => !!x && typeof x === 'object')
        .map(pickRow)
    : []
  return {
    total: typeof inner.total === 'number' ? inner.total : list.length,
    page: typeof inner.page === 'number' ? inner.page : 1,
    page_size: typeof inner.page_size === 'number' ? inner.page_size : list.length,
    list,
  }
}

export class SmmLeadPriceApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'SmmLeadPriceApiError'
    this.status = status
  }
}

function throwIfFailed(res: Response, data: unknown, ctx: string): void {
  if (res.ok) return
  const msg = readMsg(data) || `${ctx}（HTTP ${res.status}）`
  throw new SmmLeadPriceApiError(msg, res.status)
}

/** 顶部最新价；refresh=false 读库，true 现场抓取 */
export async function fetchLatestSmmLeadPrice(refresh = false): Promise<SmmLeadReferencePrice> {
  const q = new URLSearchParams()
  if (refresh) q.set('refresh', 'true')
  const url = q.toString() ? `${LATEST_PATH}?${q}` : LATEST_PATH
  const { res, data } = await fetchJson(url, { method: 'GET', headers: { ...authHeaders() } })
  throwIfFailed(res, data, '获取 SMM 铅锭参考价失败')
  const row = unwrapData(data)
  if (!row || typeof row !== 'object') throw new SmmLeadPriceApiError('返回数据格式异常', res.status)
  return pickRow(row as Record<string, unknown>)
}

/** 历史列表（表格分页） */
export async function fetchSmmLeadPriceHistory(params: {
  page?: number
  page_size?: number
  date_from?: string
  date_to?: string
}): Promise<SmmLeadReferencePriceListPayload> {
  const q = new URLSearchParams()
  q.set('page', String(params.page ?? 1))
  q.set('page_size', String(params.page_size ?? 20))
  if (params.date_from) q.set('date_from', params.date_from)
  if (params.date_to) q.set('date_to', params.date_to)
  const { res, data } = await fetchJson(`${LIST_PATH}?${q.toString()}`, {
    method: 'GET',
    headers: { ...authHeaders() },
  })
  throwIfFailed(res, data, '获取铅价历史列表失败')
  return unwrapListPayload(data)
}

/** 走势图：按定价日期升序 */
export async function fetchSmmLeadPriceChartSeries(
  dateFrom: string,
  dateTo: string,
): Promise<SmmLeadReferencePrice[]> {
  const payload = await fetchSmmLeadPriceHistory({
    page: 1,
    page_size: 500,
    date_from: dateFrom,
    date_to: dateTo,
  })
  return [...payload.list].sort((a, b) => a.定价日期.localeCompare(b.定价日期))
}

/** 立即同步 */
export async function syncSmmLeadPrice(): Promise<{ msg: string; data: SmmLeadReferencePrice }> {
  const { res, data } = await fetchJson(SYNC_PATH, {
    method: 'POST',
    headers: { ...authHeaders() },
  })
  throwIfFailed(res, data, '同步 SMM 铅锭参考价失败')
  const o = (data || {}) as Record<string, unknown>
  const row = unwrapData(data)
  if (!row || typeof row !== 'object') throw new SmmLeadPriceApiError('同步返回数据格式异常', res.status)
  return {
    msg: typeof o.msg === 'string' ? o.msg : '已同步 SMM 1#铅锭参考价',
    data: pickRow(row as Record<string, unknown>),
  }
}

export function formatSmmLeadPriceError(e: unknown): string {
  if (e instanceof SmmLeadPriceApiError) {
    if (e.status === 502) return '暂时无法获取铅价，请稍后重试'
    if (e.status === 400) return e.message || '请求参数错误'
    return e.message
  }
  if (e instanceof Error) return e.message
  return '请稍后重试'
}
