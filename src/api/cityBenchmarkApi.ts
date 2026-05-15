import { fetchJson } from './userApi'
import { getToken } from './authApi'

export interface CityBenchmarkRow {
  id: number
  province: string
  city: string
  price: number
  date: string
}

export interface CityBenchmarkForm {
  province: string
  city: string
  price: number
  date: string
}

function authHeaders(): HeadersInit {
  const token = getToken()
  if (!token) return {}
  return { Authorization: `Bearer ${token}` }
}

const BASE = '/tl/province_benchmark_prices'

function readMsg(data: unknown): string {
  if (!data || typeof data !== 'object') return ''
  const o = data as Record<string, unknown>
  if (typeof o.message === 'string') return o.message
  if (typeof o.detail === 'string') return o.detail
  return ''
}

function pickRow(r: Record<string, unknown>): CityBenchmarkRow {
  return {
    id: Number(r.id ?? 0),
    province: String(r['省份'] ?? ''),
    city: String(r['对标城市'] ?? ''),
    price: Number(r['对标城市定价'] ?? 0),
    date: String(r['定价日期'] ?? ''),
  }
}

export async function fetchCityBenchmarks(params?: {
  province?: string
  city?: string
  date?: string
  page?: number
  page_size?: number
}): Promise<{ items: CityBenchmarkRow[]; total: number }> {
  const q = new URLSearchParams()
  if (params?.province) q.set('省份', params.province)
  if (params?.city) q.set('benchmark_city', params.city)
  if (params?.date) {
    q.set('date_from', params.date)
    q.set('date_to', params.date)
  }
  q.set('page', String(params?.page ?? 1))
  q.set('page_size', String(params?.page_size ?? 20))

  const { res, data } = await fetchJson(`${BASE}?${q.toString()}`, {
    method: 'GET',
    headers: { ...authHeaders() },
  })
  if (!res.ok) throw new Error(readMsg(data) || `获取对标城市定价列表失败（HTTP ${res.status}）`)

  const payload = (data || {}) as Record<string, unknown>
  const inner = (payload.data ?? payload) as Record<string, unknown>
  const rawList = Array.isArray(inner.list) ? inner.list : []
  const items = rawList
    .filter((x): x is Record<string, unknown> => !!x && typeof x === 'object')
    .map(pickRow)
  return {
    items,
    total: typeof inner.total === 'number' ? inner.total : items.length,
  }
}

export async function createCityBenchmark(body: CityBenchmarkForm): Promise<CityBenchmarkRow> {
  const payload = {
    '省份': body.province,
    '对标城市': body.city,
    '对标城市定价': body.price,
    '定价日期': body.date || null,
  }
  const { res, data } = await fetchJson(BASE, {
    method: 'POST',
    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(readMsg(data) || `新增对标城市定价失败（HTTP ${res.status}）`)
  return { id: 0, ...body }
}

export async function updateCityBenchmark(id: number, body: CityBenchmarkForm): Promise<CityBenchmarkRow> {
  const payload: Record<string, unknown> = {}
  if (body.province) payload['省份'] = body.province
  if (body.city) payload['对标城市'] = body.city
  if (body.price != null) payload['对标城市定价'] = body.price
  if (body.date) payload['定价日期'] = body.date
  const { res, data } = await fetchJson(`${BASE}/${id}`, {
    method: 'PUT',
    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(readMsg(data) || `修改对标城市定价失败（HTTP ${res.status}）`)
  return { id, ...body }
}

export async function deleteCityBenchmark(id: number): Promise<void> {
  const { res, data } = await fetchJson(`${BASE}/${id}`, {
    method: 'DELETE',
    headers: { ...authHeaders() },
  })
  if (!res.ok) throw new Error(readMsg(data) || `删除对标城市定价失败（HTTP ${res.status}）`)
}
