import { fetchJson } from './userApi'
import { getToken } from './authApi'
import { getApiBase } from './config'

export interface WarehouseMarginRow {
  id: number
  province: string
  city: string
  warehouse_name: string
  benchmark_city: string
  benchmark_diff: number
  margin: number
}

export interface WarehouseMarginForm {
  province: string
  city: string
  warehouse_name: string
  benchmark_city: string
  benchmark_diff: number
  margin: number
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
  return `${getApiBase()}/warehouse-margin`
}

function readMsg(data: unknown): string {
  if (!data || typeof data !== 'object') return ''
  const o = data as Record<string, unknown>
  if (typeof o.message === 'string') return o.message
  if (typeof o.detail === 'string') return o.detail
  return ''
}

export async function fetchWarehouseMargins(params?: {
  province?: string
  city?: string
  page?: number
  page_size?: number
}): Promise<{ items: WarehouseMarginRow[]; total: number }> {
  const q = new URLSearchParams()
  if (params?.province) q.set('province', params.province)
  if (params?.city) q.set('city', params.city)
  q.set('page', String(params?.page ?? 1))
  q.set('page_size', String(params?.page_size ?? 20))

  const { res, data } = await fetchJson(`${baseUrl()}?${q.toString()}`, {
    method: 'GET',
    headers: { ...authHeaders() },
  })
  if (!res.ok) throw new Error(readMsg(data) || `获取库房差价和毛利列表失败（HTTP ${res.status}）`)

  const payload = (data || {}) as ApiResp<{ items?: WarehouseMarginRow[]; total?: number }>
  const inner = (payload.data ?? payload) as Record<string, unknown>
  const list =
    (Array.isArray(inner.items) ? inner.items : null) ??
    (Array.isArray(inner.list) ? inner.list : null) ??
    (Array.isArray(inner.records) ? inner.records : null) ??
    []
  return {
    items: list as WarehouseMarginRow[],
    total: typeof inner.total === 'number' ? inner.total : list.length,
  }
}

export async function createWarehouseMargin(body: WarehouseMarginForm): Promise<WarehouseMarginRow> {
  const { res, data } = await fetchJson(baseUrl(), {
    method: 'POST',
    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(readMsg(data) || `新增库房差价和毛利失败（HTTP ${res.status}）`)
  const payload = (data || {}) as ApiResp<WarehouseMarginRow>
  return payload.data ?? (data as WarehouseMarginRow)
}

export async function updateWarehouseMargin(id: number, body: WarehouseMarginForm): Promise<WarehouseMarginRow> {
  const { res, data } = await fetchJson(`${baseUrl()}/${id}`, {
    method: 'PUT',
    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(readMsg(data) || `修改库房差价和毛利失败（HTTP ${res.status}）`)
  const payload = (data || {}) as ApiResp<WarehouseMarginRow>
  return payload.data ?? (data as WarehouseMarginRow)
}

export async function deleteWarehouseMargin(id: number): Promise<void> {
  const { res, data } = await fetchJson(`${baseUrl()}/${id}`, {
    method: 'DELETE',
    headers: { ...authHeaders() },
  })
  if (!res.ok) throw new Error(readMsg(data) || `删除库房差价和毛利失败（HTTP ${res.status}）`)
}

export async function importWarehouseMargins(file: File): Promise<void> {
  const form = new FormData()
  form.append('file', file)
  const { res, data } = await fetchJson(`${baseUrl()}/import`, {
    method: 'POST',
    headers: { ...authHeaders() },
    body: form,
  })
  if (!res.ok) throw new Error(readMsg(data) || `导入失败（HTTP ${res.status}）`)
}
