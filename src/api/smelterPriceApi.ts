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

function authHeaders(): HeadersInit {
  const token = getToken()
  if (!token) return {}
  return { Authorization: `Bearer ${token}` }
}

const BASE = '/tl/smelter_calibration_prices'

function readMsg(data: unknown): string {
  if (!data || typeof data !== 'object') return ''
  const o = data as Record<string, unknown>
  if (typeof o.message === 'string') return o.message
  if (typeof o.detail === 'string') return o.detail
  return ''
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

export async function fetchSmelterPrice(): Promise<SmelterPriceRow[]> {
  const q = new URLSearchParams({ page: '1', page_size: '500', only_latest: 'true' })
  const { res, data } = await fetchJson(`${BASE}?${q.toString()}`, {
    method: 'GET',
    headers: { ...authHeaders() },
  })
  if (!res.ok) throw new Error(readMsg(data) || `获取冶炼厂标定价格失败（HTTP ${res.status}）`)
  const rows = unwrapList(data)
  return rows.map(pickSmelterRow).filter(r => r.isLatest)
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
