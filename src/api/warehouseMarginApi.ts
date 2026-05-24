import { fetchJson } from './userApi'
import { getToken } from './authApi'

export interface WarehouseMarginRow {
  id: number
  province: string
  city: string
  warehouse_name: string
  benchmark_city: string
  benchmark_diff: number
  margin: number
  price: number
}

export interface WarehouseMarginForm {
  province: string
  city: string
  warehouse_name: string
  benchmark_city: string
  benchmark_diff: number
  margin: number
  price: number
}

function authHeaders(): HeadersInit {
  const token = getToken()
  if (!token) return {}
  return { Authorization: `Bearer ${token}` }
}

const BASE = '/tl/warehouse_spread_configs'

function readMsg(data: unknown): string {
  if (!data || typeof data !== 'object') return ''
  const o = data as Record<string, unknown>
  if (typeof o.message === 'string') return o.message
  if (typeof o.detail === 'string') return o.detail
  return ''
}

function pickRow(r: Record<string, unknown>): WarehouseMarginRow {
  return {
    id: Number(r.config_id ?? r.id ?? 0),
    province: String(r['库房省份'] ?? r['省份'] ?? r.province ?? ''),
    city: String(r['库房城市'] ?? r['城市'] ?? r.city ?? ''),
    warehouse_name: String(r['库房名称'] ?? r['仓库名称'] ?? r['仓库名'] ?? r.warehouse_name ?? ''),
    benchmark_city: String(r['对标城市'] ?? r.benchmark_city ?? ''),
    benchmark_diff: Number(r['对标城市差额'] ?? r['对标差额'] ?? r.benchmark_diff ?? 0),
    margin: Number(r['毛利（配置版）'] ?? r['毛利配置版'] ?? r['毛利'] ?? r.margin ?? 0),
    price: Number(r['库房定价'] ?? r['定价'] ?? r.price ?? 0),
  }
}

export async function fetchWarehouseMargins(params?: {
  province?: string
  city?: string
  page?: number
  page_size?: number
}): Promise<{ items: WarehouseMarginRow[]; total: number }> {
  const q = new URLSearchParams()
  q.set('page', String(params?.page ?? 1))
  q.set('page_size', String(params?.page_size ?? 20))

  const { res, data } = await fetchJson(`${BASE}?${q.toString()}`, {
    method: 'GET',
    headers: { ...authHeaders() },
  })
  if (!res.ok) throw new Error(readMsg(data) || `获取库房差价和毛利列表失败（HTTP ${res.status}）`)

  const payload = (data || {}) as Record<string, unknown>
  const inner = (payload.data ?? payload) as Record<string, unknown>
  const rawList = Array.isArray(inner.list) ? inner.list : []
  let items = rawList
    .filter((x): x is Record<string, unknown> => !!x && typeof x === 'object')
    .map(pickRow)

  if (params?.province) items = items.filter((r) => r.province === params.province)
  if (params?.city) items = items.filter((r) => r.city.includes(params.city!))

  return {
    items,
    total: typeof inner.total === 'number' ? inner.total : items.length,
  }
}

export async function createWarehouseMargin(body: WarehouseMarginForm & { warehouse_id?: number }): Promise<WarehouseMarginRow> {
  const payload: Record<string, unknown> = {}
  if (body.warehouse_id && body.warehouse_id > 0) payload['库房id'] = body.warehouse_id
  if (body.benchmark_city) payload['对标城市'] = body.benchmark_city
  if (body.benchmark_diff != null) payload['对标城市差额'] = body.benchmark_diff
  if (body.margin != null) payload['毛利配置版'] = body.margin
  if (body.price != null) payload['库房定价'] = body.price
  const { res, data } = await fetchJson(BASE, {
    method: 'POST',
    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(readMsg(data) || `新增库房差价和毛利失败（HTTP ${res.status}）`)
  return { id: 0, ...body }
}

export async function updateWarehouseMargin(id: number, body: WarehouseMarginForm): Promise<WarehouseMarginRow> {
  const payload: Record<string, unknown> = {}
  if (body.benchmark_city) payload['对标城市'] = body.benchmark_city
  if (body.benchmark_diff != null) payload['对标城市差额'] = body.benchmark_diff
  if (body.margin != null) payload['毛利配置版'] = body.margin
  if (body.price != null) payload['库房定价'] = body.price
  const { res, data } = await fetchJson(`${BASE}/${id}`, {
    method: 'PUT',
    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(readMsg(data) || `修改库房差价和毛利失败（HTTP ${res.status}）`)
  return { id, ...body }
}

export async function deleteWarehouseMargin(id: number): Promise<void> {
  const { res, data } = await fetchJson(`${BASE}/${id}`, {
    method: 'DELETE',
    headers: { ...authHeaders() },
  })
  if (!res.ok) throw new Error(readMsg(data) || `删除库房差价和毛利失败（HTTP ${res.status}）`)
}

export async function importWarehouseMargins(file: File): Promise<void> {
  const fd = new FormData()
  fd.append('file', file)
  const res = await fetch('/tl/import_warehouse_spread_excel', {
    method: 'POST',
    headers: { ...authHeaders() },
    body: fd,
  })
  const text = await res.text()
  if (!res.ok) {
    let msg = ''
    try {
      const data = JSON.parse(text)
      msg = readMsg(data)
    } catch { /* ignore */ }
    throw new Error(msg || text || `导入库房差价失败（HTTP ${res.status}）`)
  }
}
