import { fetchJson } from './userApi'
import { getToken } from './authApi'

export interface WarehouseCurrentStockRow {
  id: number
  warehouseId: number
  warehouseName: string
  categoryId: number | null
  categoryName: string
  stock: number | null
  stockDate: string
  updatedAt: string
}

export interface TlExcelImportResult {
  inserted: number
  skipped_errors: number
  errors: string[]
  msg?: string
}

const BASE = '/tl/warehouse_inventories'

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

function pickRow(r: Record<string, unknown>): WarehouseCurrentStockRow {
  const stockRaw = r['当前库存'] ?? r.current_stock ?? r.stock
  let stock: number | null = null
  if (stockRaw != null && stockRaw !== '') {
    const n = Number(stockRaw)
    if (Number.isFinite(n)) stock = n
  }
  const categoryIdRaw = r['品类id'] ?? r.category_id
  let categoryId: number | null = null
  if (categoryIdRaw != null && categoryIdRaw !== '') {
    const n = Number(categoryIdRaw)
    if (Number.isFinite(n)) categoryId = n
  }
  return {
    id: Number(r.id ?? r.record_id ?? 0),
    warehouseId: Number(r['库房id'] ?? r.warehouse_id ?? r.id ?? 0),
    warehouseName: String(r['库房名称'] ?? r['仓库名'] ?? r.warehouse_name ?? r.name ?? ''),
    categoryId,
    categoryName: String(
      r['品类名'] ?? r['回收品种'] ?? r['品类'] ?? r.category_name ?? r.category ?? '',
    ),
    stock,
    stockDate: String(r['库存日期'] ?? r.inventory_date ?? r.stock_date ?? r.date ?? ''),
    updatedAt: String(r['更新时间'] ?? r['上传时间'] ?? r.updated_at ?? r.created_at ?? ''),
  }
}

export async function fetchWarehouseCurrentStockList(params?: {
  page?: number
  page_size?: number
  keyword?: string
  warehouse_id?: number
  category_id?: number
}): Promise<{ items: WarehouseCurrentStockRow[]; total: number; rawItems: Record<string, unknown>[] }> {
  const q = new URLSearchParams()
  q.set('page', String(params?.page ?? 1))
  q.set('page_size', String(params?.page_size ?? 50))
  if (params?.keyword?.trim()) q.set('keyword', params.keyword.trim())
  if (params?.warehouse_id != null && Number.isFinite(params.warehouse_id)) {
    q.set('warehouse_id', String(params.warehouse_id))
  }
  if (params?.category_id != null && Number.isFinite(params.category_id)) {
    q.set('category_id', String(params.category_id))
  }

  const { res, data } = await fetchJson(`${BASE}?${q.toString()}`, {
    method: 'GET',
    headers: { ...authHeaders() },
  })
  if (!res.ok) throw new Error(readMsg(data) || `获取当前库存列表失败（HTTP ${res.status}）`)

  const rows = unwrapList(data)
  const payload = (data || {}) as Record<string, unknown>
  const inner = (payload.data ?? payload) as Record<string, unknown>
  const total = typeof inner.total === 'number' ? inner.total : rows.length
  const parsed = rows.map(pickRow).filter((r) => r.warehouseName)
  return { items: parsed, total, rawItems: rows }
}

export async function saveWarehouseInventoryManual(body: {
  warehouseId: number
  categoryId: number
  stock: number
  stockDate?: string
}): Promise<void> {
  const payload: Record<string, unknown> = {
    库房id: body.warehouseId,
    品类id: body.categoryId,
    当前库存: body.stock,
  }
  if (body.stockDate?.trim()) payload['库存日期'] = body.stockDate.trim()

  const { res, data } = await fetchJson(BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(readMsg(data) || `保存库存失败（HTTP ${res.status}）`)
}

export async function deleteWarehouseInventory(body: {
  warehouseId: number
  categoryId: number
  stockDate: string
}): Promise<void> {
  const payload: Record<string, unknown> = {
    库房id: body.warehouseId,
    品类id: body.categoryId,
    库存日期: body.stockDate,
  }

  const { res, data } = await fetchJson(BASE, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(readMsg(data) || `删除库存失败（HTTP ${res.status}）`)
}

export async function downloadWarehouseInventoryTemplate(): Promise<Blob> {
  const res = await fetch('/tl/download_warehouse_inventory_template_excel', {
    method: 'GET',
    headers: { ...authHeaders() },
  })
  if (!res.ok) {
    const text = await res.text()
    let msg = text
    try {
      const data = JSON.parse(text) as Record<string, unknown>
      msg = readMsg(data) || text
    } catch {
      /* ignore */
    }
    throw new Error(msg || `下载模板失败（HTTP ${res.status}）`)
  }
  return res.blob()
}

export async function importWarehouseCurrentStockExcel(
  file: File,
  options?: { overwrite?: boolean },
): Promise<TlExcelImportResult> {
  const fd = new FormData()
  fd.append('file', file)
  if (options?.overwrite === false) fd.append('overwrite', 'false')

  const res = await fetch('/tl/import_warehouse_inventory_excel', {
    method: 'POST',
    headers: { ...authHeaders() },
    body: fd,
  })
  const text = await res.text()
  let data: unknown = {}
  try {
    if (text) data = JSON.parse(text)
  } catch {
    /* ignore */
  }
  if (!res.ok) throw new Error(readMsg(data) || text || `导入当前库存失败（HTTP ${res.status}）`)

  const inner =
    data && typeof data === 'object' && 'data' in (data as object)
      ? ((data as Record<string, unknown>).data as Record<string, unknown>)
      : (data as Record<string, unknown>)
  return {
    inserted: Number(inner?.success ?? inner?.inserted ?? 0),
    skipped_errors: Number(inner?.skipped_errors ?? 0),
    errors: Array.isArray(inner?.errors) ? (inner.errors as string[]) : [],
    msg:
      typeof (data as Record<string, unknown>)?.msg === 'string'
        ? String((data as Record<string, unknown>).msg)
        : undefined,
  }
}
