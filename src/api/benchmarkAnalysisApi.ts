import { fetchJson } from './userApi'
import { getToken } from './authApi'
import { getApiBase } from './config'

export interface BenchmarkAnalysisRow {
  id: number
  province: string
  city: string
  warehouse: string
  benchmark_city: string
  benchmark_price: number
  benchmark_diff: number
  calibrated_price: number
  freight: number
  margin_config: number
  margin_calculated: number
  price: number
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
  return `${getApiBase()}/benchmark-analysis`
}

function readMsg(data: unknown): string {
  if (!data || typeof data !== 'object') return ''
  const o = data as Record<string, unknown>
  if (typeof o.message === 'string') return o.message
  if (typeof o.detail === 'string') return o.detail
  return ''
}

export async function fetchBenchmarkAnalysis(params?: {
  province?: string
  city?: string
  page?: number
  page_size?: number
}): Promise<{ items: BenchmarkAnalysisRow[]; total: number }> {
  const q = new URLSearchParams()
  if (params?.province) q.set('province', params.province)
  if (params?.city) q.set('city', params.city)
  q.set('page', String(params?.page ?? 1))
  q.set('page_size', String(params?.page_size ?? 20))

  const { res, data } = await fetchJson(`${baseUrl()}?${q.toString()}`, {
    method: 'GET',
    headers: { ...authHeaders() },
  })
  if (!res.ok) throw new Error(readMsg(data) || `获取对标分析数据失败（HTTP ${res.status}）`)

  const payload = (data || {}) as ApiResp<{ items?: BenchmarkAnalysisRow[]; total?: number }>
  const inner = (payload.data ?? payload) as Record<string, unknown>
  const list =
    (Array.isArray(inner.items) ? inner.items : null) ??
    (Array.isArray(inner.list) ? inner.list : null) ??
    (Array.isArray(inner.records) ? inner.records : null) ??
    []
  return {
    items: list as BenchmarkAnalysisRow[],
    total: typeof inner.total === 'number' ? inner.total : list.length,
  }
}
