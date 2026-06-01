import type { BboxOverlapCheck, HardTamperFlags, TimestampCheck, V3ResultItem } from './api/detect'

export function anomalyLabel(item: unknown): string {
  if (typeof item === 'string') return item.trim()
  if (item && typeof item === 'object') {
    const o = item as Record<string, unknown>
    const reason = typeof o.reason === 'string' ? o.reason.trim() : ''
    if (reason) return reason
    const code = typeof o.code === 'string' ? o.code.trim() : ''
    if (code) return code
    const message = typeof o.message === 'string' ? o.message.trim() : ''
    if (message) return message
  }
  return String(item ?? '').trim()
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
  if (typeof tc.message === 'string' && tc.message.trim()) return tc.message.trim()
  const anomalies = tc.anomalies
  if (Array.isArray(anomalies) && anomalies.length) {
    return anomalies.map(anomalyLabel).filter(Boolean).join('；')
  }
  if (tc.passed != null) return String(tc.passed)
  return ''
}

export function formatBboxOverlapCheck(check: BboxOverlapCheck | null | undefined): string {
  if (!check) return ''
  if (typeof check.reason === 'string' && check.reason.trim()) return check.reason.trim()
  if (typeof check.message === 'string' && check.message.trim()) return check.message.trim()
  const parts: string[] = []
  if (check.passed != null) parts.push(String(check.passed))
  if (check.overlap_score != null && Number.isFinite(check.overlap_score)) {
    parts.push(formatPixelOverlapScore(check.overlap_score))
  }
  return parts.join('，')
}

export function formatHardTamperFlags(flags: HardTamperFlags | undefined): string {
  if (flags == null) return ''
  if (Array.isArray(flags)) {
    return flags.map((x) => String(x).trim()).filter(Boolean).join('、')
  }
  if (typeof flags === 'object') {
    return Object.entries(flags)
      .filter(([, v]) => v != null && v !== false && v !== '')
      .map(([k, v]) => `${k}: ${String(v)}`)
      .join('；')
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
  if (overlap) lines.push({ label: 'pixel_overlap_score', value: overlap })
  const ts = formatTimestampCheck(item.timestamp_check)
  if (ts) lines.push({ label: 'timestamp_check', value: ts })
  const bbox = formatBboxOverlapCheck(item.bbox_overlap_check)
  if (bbox) lines.push({ label: 'bbox_overlap_check', value: bbox })
  const flags = formatHardTamperFlags(item.hard_tamper_flags)
  if (flags) lines.push({ label: 'hard_tamper_flags', value: flags })
  return lines
}

export function hasExtendedDetectionFields(item: V3ResultItem | null | undefined): boolean {
  return buildExtendedDisplayLines(item).length > 0
}
