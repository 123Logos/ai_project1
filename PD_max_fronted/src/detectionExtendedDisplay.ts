import type { BboxOverlapCheck, HardTamperFlags, TimestampCheck, V3ResultItem } from './api/detect'

const ANOMALY_CODE_ZH: Record<string, string> = {
  status_transaction_time_mismatch: '状态栏与交易时间不一致',
  transaction_time_future: '交易时间晚于当前时间',
  transaction_time_invalid: '交易时间格式无效',
  status_bar_time_missing: '未识别到状态栏时间',
  document_time_missing: '未提供单据时间',
  document_time_mismatch: '单据时间与画面时间不一致',
}

export function anomalyLabel(item: unknown): string {
  if (typeof item === 'string') {
    const key = item.trim()
    return ANOMALY_CODE_ZH[key] ?? key
  }
  if (item && typeof item === 'object') {
    const o = item as Record<string, unknown>
    const reason = typeof o.reason === 'string' ? o.reason.trim() : ''
    if (reason) return reason
    const code = typeof o.code === 'string' ? o.code.trim() : ''
    if (code && ANOMALY_CODE_ZH[code]) return ANOMALY_CODE_ZH[code]
    return code || '异常项'
  }
  return String(item ?? '')
}

export function formatPixelOverlapScore(score: number | null | undefined): string {
  if (score == null || !Number.isFinite(score)) return ''
  const n = Number(score)
  if (n >= 0 && n <= 1) return `${(n * 100).toFixed(1)}%`
  return n.toFixed(4)
}

export function formatTimestampCheck(tc: TimestampCheck | null | undefined): string {
  if (!tc) return ''
  if (typeof tc.reason === 'string' && tc.reason.trim()) return tc.reason.trim()
  const anomalies = tc.anomalies
  if (Array.isArray(anomalies) && anomalies.length) {
    return anomalies.map(anomalyLabel).join('；')
  }
  if (tc.passed === true) return '通过'
  if (tc.passed === false) return '未通过'
  return ''
}

export function formatBboxOverlapCheck(check: BboxOverlapCheck | null | undefined): string {
  if (!check) return ''
  if (typeof check.reason === 'string' && check.reason.trim()) return check.reason.trim()
  const parts: string[] = []
  if (check.passed === true) parts.push('通过')
  else if (check.passed === false) parts.push('未通过')
  if (check.overlap_score != null && Number.isFinite(check.overlap_score)) {
    parts.push(`重叠分 ${formatPixelOverlapScore(check.overlap_score)}`)
  }
  return parts.join('，')
}

export function formatHardTamperFlags(flags: HardTamperFlags | undefined): string {
  if (flags == null) return ''
  if (Array.isArray(flags)) {
    const items = flags.map((x) => String(x).trim()).filter(Boolean)
    return items.length ? items.join('、') : ''
  }
  if (typeof flags === 'object') {
    const entries = Object.entries(flags)
      .filter(([, v]) => v != null && v !== false && v !== '')
      .map(([k, v]) => `${k}: ${String(v)}`)
    return entries.join('；')
  }
  return String(flags)
}

export type ExtendedDisplayLine = { label: string; value: string }

export function buildExtendedDisplayLines(
  item: V3ResultItem | null | undefined,
): ExtendedDisplayLine[] {
  if (!item) return []
  const lines: ExtendedDisplayLine[] = []
  const overlap = formatPixelOverlapScore(item.pixel_overlap_score)
  if (overlap) lines.push({ label: '像素重叠度', value: overlap })
  const ts = formatTimestampCheck(item.timestamp_check)
  if (ts) lines.push({ label: '时间校验', value: ts })
  const bbox = formatBboxOverlapCheck(item.bbox_overlap_check)
  if (bbox) lines.push({ label: '区域重叠校验', value: bbox })
  const flags = formatHardTamperFlags(item.hard_tamper_flags)
  if (flags) lines.push({ label: '强篡改标记', value: flags })
  return lines
}

export function hasExtendedDetectionFields(item: V3ResultItem | null | undefined): boolean {
  return buildExtendedDisplayLines(item).length > 0
}
