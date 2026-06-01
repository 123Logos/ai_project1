/**
 * 同一仓库在送货/预测明细中可能对应多个大区经理；
 * 按「最新送货日（或预测日）」上的经理作为该仓库当前展示用经理。
 */
export function buildLatestRegionalManagerByWarehouse<T>(
  items: T[],
  getWarehouse: (item: T) => string,
  getRegionalManager: (item: T) => string,
  getDate: (item: T) => string,
  getRecordId?: (item: T) => number,
): Map<string, string> {
  const latest = new Map<string, { date: string; manager: string; id: number }>()

  for (const item of items) {
    const wh = getWarehouse(item).trim() || '未知'
    const rm = getRegionalManager(item).trim() || '未知'
    const date = getDate(item).trim()
    if (!date) continue
    const id = getRecordId?.(item) ?? 0

    const prev = latest.get(wh)
    if (!prev || date > prev.date || (date === prev.date && id > prev.id)) {
      latest.set(wh, { date, manager: rm, id })
    }
  }

  const out = new Map<string, string>()
  latest.forEach((v, wh) => out.set(wh, v.manager))
  return out
}

export function resolveRegionalManagerForWarehouse(
  warehouse: string,
  fallbackManager: string,
  latestByWarehouse: Map<string, string>,
): string {
  const wh = warehouse.trim() || '未知'
  return latestByWarehouse.get(wh) ?? (fallbackManager.trim() || '未知')
}
