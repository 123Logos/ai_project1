import { fetchJson } from './userApi'
import { getToken } from './authApi'

export interface BenchmarkAnalysisRow {
  id: number
  province: string
  city: string
  county: string
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

function authHeaders(): HeadersInit {
  const token = getToken()
  if (!token) return {}
  return { Authorization: `Bearer ${token}` }
}

const BASE = '/tl/ai_pricing_analysis'

function readMsg(data: unknown): string {
  if (!data || typeof data !== 'object') return ''
  const o = data as Record<string, unknown>
  if (typeof o.message === 'string') return o.message
  if (typeof o.detail === 'string') return o.detail
  return ''
}

function pickRow(r: Record<string, unknown>, idx: number): BenchmarkAnalysisRow {
  return {
    id: Number(r['库房id'] ?? r.id ?? idx),
    province: String(r['库房省份'] ?? ''),
    city: String(r['库房城市'] ?? ''),
    county: String(r['库房区'] ?? ''),
    warehouse: String(r['库房名称'] ?? ''),
    benchmark_city: String(r['对标城市'] ?? ''),
    benchmark_price: Number(r['对标城市定价'] ?? 0),
    benchmark_diff: Number(r['对标城市差额'] ?? 0),
    calibrated_price: Number(r['冶炼厂标定价格'] ?? 0),
    freight: r['库房运费'] != null ? Number(r['库房运费']) : 0,
    margin_config: r['毛利（配置版）'] != null ? Number(r['毛利（配置版）']) : 0,
    margin_calculated: r['毛利（计算版）'] != null ? Number(r['毛利（计算版）']) : 0,
    price: r['库房定价'] != null ? Number(r['库房定价']) : 0,
  }
}

export async function fetchBenchmarkAnalysis(params?: {
  province?: string
  city?: string
  county?: string
  page?: number
  page_size?: number
}): Promise<{ items: BenchmarkAnalysisRow[]; total: number }> {
  const q = new URLSearchParams()
  if (params?.province) q.set('province', params.province)
  if (params?.county) q.set('county', params.county)
  q.set('page', String(params?.page ?? 1))
  q.set('page_size', String(params?.page_size ?? 20))

  const { res, data } = await fetchJson(`${BASE}?${q.toString()}`, {
    method: 'GET',
    headers: { ...authHeaders() },
  })
  if (!res.ok) throw new Error(readMsg(data) || `获取对标分析数据失败（HTTP ${res.status}）`)

  const payload = (data || {}) as Record<string, unknown>
  const inner = (payload.data ?? payload) as Record<string, unknown>
  const rawList =
    (Array.isArray(inner.list) ? inner.list : null) ??
    (Array.isArray(inner.items) ? inner.items : null) ??
    (Array.isArray(inner.records) ? inner.records : null) ??
    []
  const items = rawList
    .filter((x): x is Record<string, unknown> => !!x && typeof x === 'object')
    .map((r, i) => pickRow(r, i))

  let filtered = items
  if (params?.city) filtered = filtered.filter((r) => r.city.includes(params.city!))
  if (params?.county) filtered = filtered.filter((r) => r.county.includes(params.county!))

  return {
    items: filtered,
    total: typeof inner.total === 'number' ? inner.total : items.length,
  }
}
