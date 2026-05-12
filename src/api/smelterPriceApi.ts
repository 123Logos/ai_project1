import { fetchJson } from './userApi'
import { getToken } from './authApi'
import { getApiBase } from './config'

export interface SmelterPriceRow {
  id: number
  smelter: string
  price: number
  date: string
}

export interface SmelterPriceHistoryRow {
  id: number
  price: number
  operator: string
  change_time: string
}

interface ApiResp<T> {
  code?: number
  message?: string
  data?: T
}

function authHeaders(): HeadersInit {
  const token = getToken()
  if (!token) return {}
  return { Authorization: `Bearer ${token}` }
}

function baseUrl(): string {
  return `${getApiBase()}/smelter-price`
}

function readMsg(data: unknown): string {
  if (!data || typeof data !== 'object') return ''
  const o = data as Record<string, unknown>
  if (typeof o.message === 'string') return o.message
  if (typeof o.detail === 'string') return o.detail
  return ''
}

export async function fetchSmelterPrice(): Promise<SmelterPriceRow | null> {
  const { res, data } = await fetchJson(`${baseUrl()}/current`, {
    method: 'GET',
    headers: { ...authHeaders() },
  })
  if (!res.ok) throw new Error(readMsg(data) || `获取冶炼厂标定价格失败（HTTP ${res.status}）`)
  const payload = (data || {}) as ApiResp<SmelterPriceRow>
  return payload.data ?? (data as SmelterPriceRow) ?? null
}

export async function updateSmelterPrice(price: number, date: string): Promise<SmelterPriceRow> {
  const { res, data } = await fetchJson(`${baseUrl()}/update`, {
    method: 'POST',
    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ price, date }),
  })
  if (!res.ok) throw new Error(readMsg(data) || `修改冶炼厂标定价格失败（HTTP ${res.status}）`)
  const payload = (data || {}) as ApiResp<SmelterPriceRow>
  return payload.data ?? (data as SmelterPriceRow)
}

export async function fetchSmelterPriceHistory(params?: {
  page?: number
  page_size?: number
}): Promise<{ items: SmelterPriceHistoryRow[]; total: number }> {
  const q = new URLSearchParams()
  q.set('page', String(params?.page ?? 1))
  q.set('page_size', String(params?.page_size ?? 20))

  const { res, data } = await fetchJson(`${baseUrl()}/history?${q.toString()}`, {
    method: 'GET',
    headers: { ...authHeaders() },
  })
  if (!res.ok) throw new Error(readMsg(data) || `获取标定价格历史记录失败（HTTP ${res.status}）`)

  const payload = (data || {}) as ApiResp<{ items?: SmelterPriceHistoryRow[]; total?: number }>
  const inner = (payload.data ?? payload) as Record<string, unknown>
  const list =
    (Array.isArray(inner.items) ? inner.items : null) ??
    (Array.isArray(inner.list) ? inner.list : null) ??
    (Array.isArray(inner.records) ? inner.records : null) ??
    []
  return {
    items: list as SmelterPriceHistoryRow[],
    total: typeof inner.total === 'number' ? inner.total : list.length,
  }
}
