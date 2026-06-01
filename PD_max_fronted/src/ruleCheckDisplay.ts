import type {
  RuleChecksData,
  RuleChecksPixelOverlap,
  RuleChecksSemantic,
  RuleChecksTimestamp,
} from './api/detect'

export type RuleCheckFindingStatus = 'ok' | 'warn' | 'bad'

export type RuleCheckUserFinding = {
  status: RuleCheckFindingStatus
  /** 后端 title / label / name，无则留空 */
  title: string
  text: string
}

export type RuleCheckTimeFact = {
  label: string
  value: string
}

export type RuleCheckUserView = {
  summary: string
  findings: RuleCheckUserFinding[]
  timeFacts: RuleCheckTimeFact[]
}

function joinUnique(parts: string[]): string {
  const seen = new Set<string>()
  const out: string[] = []
  for (const p of parts) {
    const t = p.trim()
    if (!t || seen.has(t)) continue
    seen.add(t)
    out.push(t)
  }
  return out.join('；')
}

function readBlockLabel(block: Record<string, unknown> | null | undefined): string {
  if (!block) return ''
  for (const key of ['title', 'label', 'name'] as const) {
    const v = block[key]
    if (typeof v === 'string' && v.trim()) return v.trim()
  }
  return ''
}

function readBlockText(
  block: {
    message?: string
    reasons?: string[]
    anomalies?: string[]
  } | null | undefined,
): string {
  if (!block) return ''
  return joinUnique([
    ...(block.reasons ?? []),
    ...(block.message ? [block.message] : []),
    ...(block.anomalies ?? []).map(String),
  ])
}

function readBlockStatus(
  block: {
    passed?: boolean
    alert?: boolean
    hard_tamper?: boolean
  } | null | undefined,
): RuleCheckFindingStatus {
  if (!block) return 'ok'
  if (block.hard_tamper === true || block.passed === false) return 'bad'
  if (block.alert === true) return 'warn'
  return 'ok'
}

function makeFinding(
  block:
    | (RuleChecksPixelOverlap & Record<string, unknown>)
    | (RuleChecksTimestamp & Record<string, unknown>)
    | (RuleChecksSemantic & Record<string, unknown>)
    | null
    | undefined,
): RuleCheckUserFinding | null {
  if (!block) return null
  const text = readBlockText(block)
  if (!text && block.passed == null && block.hard_tamper == null && block.alert == null) {
    return null
  }
  return {
    status: readBlockStatus(block),
    title: readBlockLabel(block),
    text: text || '—',
  }
}

export function ruleCheckVerdict(data: RuleChecksData | null | undefined): {
  label: string
  pillClass: string
} {
  if (!data) return { label: '—', pillClass: '' }
  if (data.available === false) return { label: '暂无', pillClass: '' }
  const st = data.status?.trim()
  if (st) return { label: st, pillClass: st }
  return { label: '—', pillClass: '' }
}

export function buildRuleCheckUserView(
  data: RuleChecksData | null | undefined,
): RuleCheckUserView | null {
  if (!data) return null
  if (data.available === false) {
    return {
      summary: data.reason?.trim() || '—',
      findings: [],
      timeFacts: [],
    }
  }

  const findings: RuleCheckUserFinding[] = []
  for (const block of [data.pixel_overlap, data.timestamp, data.semantic]) {
    const row = makeFinding(block as RuleChecksPixelOverlap & Record<string, unknown>)
    if (row) findings.push(row)
  }

  return {
    summary: data.reason?.trim() || '—',
    findings,
    timeFacts: [],
  }
}
