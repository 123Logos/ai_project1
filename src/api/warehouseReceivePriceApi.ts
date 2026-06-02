import { fetchJson } from './userApi'
import { getToken } from './authApi'
import type { TlExcelImportResult } from './warehouseCurrentStockApi'

export interface WarehouseReceivePriceRow {
  id: number
  warehouseName: string
  categoryName: string
  price: number | null
  priceDate: string
  updatedAt: string
}

const BASE = '/tl/warehouse_receive_prices'

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

function unwrapList(data: unknown): Record<string, unknown>[] {
  if (data == null) return []
  if (typeof data !== 'object') return []
  const o = data as Record<string, unknown>
  const inner = (o.data ?? o) as Record<string, unknown>
  const arr = inner.list ?? inner.items ?? inner.records ?? inner.rows
  if (Array.isArray(arr)) return arr.filter((x): x is Record<string, unknown> => !!x && typeof x === 'object')
  return []
}

function pickRow(r: Record<string, unknown>): WarehouseReceivePriceRow {
  const priceRaw = r['收货价格'] ?? r['价格'] ?? r.price ?? r.receive_price
  let price: number | null = null
  if (priceRaw != null && priceRaw !== '') {
    const n = Number(priceRaw)
    if (Number.isFinite(n)) price = n
  }
  return {
    id: Number(r.id ?? r.record_id ?? 0),
    warehouseName: String(r['库房名称'] ?? r['仓库名'] ?? r.warehouse_name ?? r.name ?? ''),
    categoryName: String(r['回收品类'] ?? r['品类'] ?? r['品类名'] ?? r.category_name ?? ''),
    price,
    priceDate: String(r['定价日期'] ?? r['价格日期'] ?? r['日期'] ?? r.price_date ?? r.date ?? r['更新时间'] ?? r.updated_at ?? '').slice(0, 10),
    updatedAt: String(r['上传时间'] ?? r['更新时间'] ?? r.updated_at ?? r.created_at ?? ''),
  }
}

export async function fetchWarehouseReceivePriceList(params?: {
  page?: number
  page_size?: number
  keyword?: string
  category?: string
}): Promise<{ items: WarehouseReceivePriceRow[]; total: number }> {
  const q = new URLSearchParams()
  q.set('only_latest', 'true')
  q.set('page', String(params?.page ?? 1))
  q.set('page_size', String(params?.page_size ?? 50))
  if (params?.keyword?.trim()) q.set('keyword', params.keyword.trim())
  if (params?.category?.trim()) q.set('category', params.category.trim())

  const { res, data } = await fetchJson(`${BASE}?${q.toString()}`, {
    method: 'GET',
    headers: { ...authHeaders() },
  })
  if (!res.ok) throw new Error(readMsg(data) || `获取收货价格列表失败（HTTP ${res.status}）`)

  const rows = unwrapList(data)
  const payload = (data || {}) as Record<string, unknown>
  const inner = (payload.data ?? payload) as Record<string, unknown>
  const total = typeof inner.total === 'number' ? inner.total : rows.length
  return { items: rows.map(pickRow).filter((r) => r.warehouseName), total }
}

export async function importWarehouseReceivePriceExcel(file: File): Promise<TlExcelImportResult> {
  const fd = new FormData()
  fd.append('file', file)
  const res = await fetch('/tl/import_warehouse_receive_price_excel', {
    method: 'POST',
    headers: { ...authHeaders() },
    body: fd,
  })
  const text = await res.text()
  let data: unknown = {}
  try {
    if (text) data = JSON.parse(text)
  } catch { /* ignore */ }
  if (!res.ok) throw new Error(readMsg(data) || text || `导入收货价格失败（HTTP ${res.status}）`)

  const inner =
    data && typeof data === 'object' && 'data' in (data as object)
      ? ((data as Record<string, unknown>).data as Record<string, unknown>)
      : (data as Record<string, unknown>)
  return {
    inserted: Number(inner?.inserted ?? 0),
    skipped_errors: Number(inner?.skipped_errors ?? 0),
    errors: Array.isArray(inner?.errors) ? (inner.errors as string[]) : [],
    msg: typeof (data as Record<string, unknown>)?.msg === 'string' ? String((data as Record<string, unknown>).msg) : undefined,
  }
}
