import { fetchJson } from './userApi'
import { getToken } from './authApi'
import { getApiBase } from './config'

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
  return `${getApiBase()}/city-benchmark`
}

function readMsg(data: unknown): string {
  if (!data || typeof data !== 'object') return ''
  const o = data as Record<string, unknown>
  if (typeof o.message === 'string') return o.message
  if (typeof o.detail === 'string') return o.detail
  return ''
}

export async function fetchCityBenchmarks(params?: {
  province?: string
  city?: string
  date?: string
  page?: number
  page_size?: number
}): Promise<{ items: CityBenchmarkRow[]; total: number }> {
  const q = new URLSearchParams()
  if (params?.province) q.set('province', params.province)
  if (params?.city) q.set('city', params.city)
  if (params?.date) q.set('date', params.date)
  q.set('page', String(params?.page ?? 1))
  q.set('page_size', String(params?.page_size ?? 20))

  const { res, data } = await fetchJson(`${baseUrl()}?${q.toString()}`, {
    method: 'GET',
    headers: { ...authHeaders() },
  })
  if (!res.ok) throw new Error(readMsg(data) || `获取对标城市定价列表失败（HTTP ${res.status}）`)

  const payload = (data || {}) as ApiResp<{ items?: CityBenchmarkRow[]; total?: number }>
  const inner = (payload.data ?? payload) as Record<string, unknown>
  const list =
    (Array.isArray(inner.items) ? inner.items : null) ??
    (Array.isArray(inner.list) ? inner.list : null) ??
    (Array.isArray(inner.records) ? inner.records : null) ??
    []
  return {
    items: list as CityBenchmarkRow[],
    total: typeof inner.total === 'number' ? inner.total : list.length,
  }
}

export async function createCityBenchmark(body: CityBenchmarkForm): Promise<CityBenchmarkRow> {
  const { res, data } = await fetchJson(baseUrl(), {
    method: 'POST',
    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(readMsg(data) || `新增对标城市定价失败（HTTP ${res.status}）`)
  const payload = (data || {}) as ApiResp<CityBenchmarkRow>
  return (payload.data ?? (data as CityBenchmarkRow))
}

export async function updateCityBenchmark(id: number, body: CityBenchmarkForm): Promise<CityBenchmarkRow> {
  const { res, data } = await fetchJson(`${baseUrl()}/${id}`, {
    method: 'PUT',
    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(readMsg(data) || `修改对标城市定价失败（HTTP ${res.status}）`)
  const payload = (data || {}) as ApiResp<CityBenchmarkRow>
  return (payload.data ?? (data as CityBenchmarkRow))
}

export async function deleteCityBenchmark(id: number): Promise<void> {
  const { res, data } = await fetchJson(`${baseUrl()}/${id}`, {
    method: 'DELETE',
    headers: { ...authHeaders() },
  })
  if (!res.ok) throw new Error(readMsg(data) || `删除对标城市定价失败（HTTP ${res.status}）`)
}
