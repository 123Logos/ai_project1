/** 兼容 camelCase / snake_case 响应字段 */
export function pickField(
  row: Record<string, unknown>,
  keys: string[],
): unknown {
  for (const k of keys) {
    if (row[k] !== undefined && row[k] !== null) return row[k]
  }
  return undefined
}

export function pickStr(row: Record<string, unknown>, keys: string[]): string {
  const v = pickField(row, keys)
  if (v == null) return ''
  return String(v).trim()
}

export function pickNum(row: Record<string, unknown>, keys: string[]): number | null {
  const v = pickField(row, keys)
  if (v == null || v === '') return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

export function pickStrOrNull(row: Record<string, unknown>, keys: string[]): string | null {
  const s = pickStr(row, keys)
  return s || null
}

export function pickAnalysisText(row: Record<string, unknown>): string | null {
  const s = pickStr(row, ['analysis', 'Analysis'])
  return s || null
}

export function formatAnalysisDisplay(analysis: string | null | undefined): string {
  const t = (analysis ?? '').trim()
  return t || '—'
}
