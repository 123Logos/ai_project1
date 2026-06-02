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
  /** 详细信息列表 */
  details?: { label: string; value: string }[]
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

export function makeFinding(
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

  const details: { label: string; value: string }[] = []

  // 提取 pixel_overlap 的详细信息
  if ('pixel_overlap_score' in block && block.pixel_overlap_score != null) {
    const score = Number(block.pixel_overlap_score)
    if (Number.isFinite(score)) {
      details.push({ label: '像素重叠分数', value: `${(score * 100).toFixed(1)}%` })
    }
  }
  if ('overlap_metrics' in block && block.overlap_metrics && typeof block.overlap_metrics === 'object') {
    const metrics = block.overlap_metrics as Record<string, unknown>
    if (metrics.structural_score != null) {
      details.push({ label: '结构分数', value: `${(Number(metrics.structural_score) * 100).toFixed(1)}%` })
    }
    if (metrics.blend_score != null) {
      details.push({ label: '混合分数', value: `${(Number(metrics.blend_score) * 100).toFixed(1)}%` })
    }
    if (metrics.double_edge_ratio != null) {
      details.push({ label: '双边缘比例', value: `${(Number(metrics.double_edge_ratio) * 100).toFixed(1)}%` })
    }
    if (metrics.long_gradient_ratio != null) {
      details.push({ label: '长渐变比例', value: `${(Number(metrics.long_gradient_ratio) * 100).toFixed(1)}%` })
    }
    if (metrics.ela_score != null) {
      details.push({ label: 'ELA 分数', value: `${(Number(metrics.ela_score) * 100).toFixed(1)}%` })
    }
    if (metrics.noise_inconsistency_score != null) {
      details.push({ label: '噪声不一致分数', value: `${(Number(metrics.noise_inconsistency_score) * 100).toFixed(1)}%` })
    }
    if (metrics.text_splice_score != null) {
      details.push({ label: '文本拼接分数', value: `${(Number(metrics.text_splice_score) * 100).toFixed(1)}%` })
    }
  }
  if ('auto_scan_regions' in block && Array.isArray(block.auto_scan_regions) && block.auto_scan_regions.length > 0) {
    details.push({ label: '自动扫描区域数', value: String(block.auto_scan_regions.length) })
  }

  // 提取 semantic 的详细信息
  if ('risk' in block && block.risk != null && typeof block.risk === 'number') {
    details.push({ label: '风险分数', value: `${(block.risk * 100).toFixed(1)}%` })
  }
  if ('semantic_check' in block && block.semantic_check && typeof block.semantic_check === 'object') {
    const sc = block.semantic_check as Record<string, unknown>
    if (sc.account_masks && typeof sc.account_masks === 'object') {
      const am = sc.account_masks as Record<string, unknown>
      if (am.anomaly === true) {
        details.push({ label: '账号脱敏', value: '异常' })
      }
      if (typeof am.message === 'string' && am.message.trim()) {
        details.push({ label: '账号脱敏说明', value: am.message.trim() })
      }
    }
    if (sc.synthetic && typeof sc.synthetic === 'object') {
      const sy = sc.synthetic as Record<string, unknown>
      if (sy.suspicious === true) {
        details.push({ label: '合成检测', value: '可疑' })
      }
      if (Array.isArray(sy.signals) && sy.signals.length > 0) {
        details.push({ label: '合成信号', value: sy.signals.map(String).join('、') })
      }
    }
  }

  // 提取 timestamp 的详细信息
  if ('timestamp_check' in block && block.timestamp_check && typeof block.timestamp_check === 'object') {
    const tc = block.timestamp_check as Record<string, unknown>
    if (typeof tc.transaction_time === 'string' && tc.transaction_time.trim()) {
      details.push({ label: '交易时间', value: tc.transaction_time.trim() })
    }
    if (typeof tc.business_document_time === 'string' && tc.business_document_time.trim()) {
      details.push({ label: '业务单据时间', value: tc.business_document_time.trim() })
    }
    if (tc.has_exif === false) {
      details.push({ label: 'EXIF 信息', value: '无' })
    }
  }
  if ('business_mismatch' in block && block.business_mismatch === true) {
    details.push({ label: '业务时间不匹配', value: '是' })
  }

  return {
    status: readBlockStatus(block),
    title: readBlockLabel(block),
    text: text || '—',
    details: details.length > 0 ? details : undefined,
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
      summary: data.reason?.trim() || '规则检测未执行或结果不可用',
      findings: [],
      timeFacts: [],
    }
  }

  const findings: RuleCheckUserFinding[] = []

  // 像素重叠检测
  if (data.pixel_overlap) {
    const block = data.pixel_overlap as RuleChecksPixelOverlap & Record<string, unknown>
    const text = block.message || readBlockText(block) || '暂无该项检测数据'
    const details: { label: string; value: string }[] = []

    // 提取详细指标
    if (block.pixel_overlap_score != null) {
      const score = Number(block.pixel_overlap_score)
      if (Number.isFinite(score)) {
        details.push({ label: '像素重叠分数', value: `${(score * 100).toFixed(1)}%` })
      }
    }
    if (block.overlap_metrics && typeof block.overlap_metrics === 'object') {
      const metrics = block.overlap_metrics as Record<string, unknown>
      if (metrics.structural_score != null) {
        details.push({ label: '结构分数', value: `${(Number(metrics.structural_score) * 100).toFixed(1)}%` })
      }
      if (metrics.blend_score != null) {
        details.push({ label: '混合分数', value: `${(Number(metrics.blend_score) * 100).toFixed(1)}%` })
      }
      if (metrics.double_edge_ratio != null) {
        details.push({ label: '双边缘比例', value: `${(Number(metrics.double_edge_ratio) * 100).toFixed(1)}%` })
      }
      if (metrics.long_gradient_ratio != null) {
        details.push({ label: '长渐变比例', value: `${(Number(metrics.long_gradient_ratio) * 100).toFixed(1)}%` })
      }
      if (metrics.ela_score != null) {
        details.push({ label: 'ELA 分数', value: `${(Number(metrics.ela_score) * 100).toFixed(1)}%` })
      }
      if (metrics.noise_inconsistency_score != null) {
        details.push({ label: '噪声不一致分数', value: `${(Number(metrics.noise_inconsistency_score) * 100).toFixed(1)}%` })
      }
      if (metrics.text_splice_score != null) {
        details.push({ label: '文本拼接分数', value: `${(Number(metrics.text_splice_score) * 100).toFixed(1)}%` })
      }
    }
    if (Array.isArray(block.auto_scan_regions) && block.auto_scan_regions.length > 0) {
      details.push({ label: '自动扫描区域数', value: String(block.auto_scan_regions.length) })
    }

    findings.push({
      status: readBlockStatus(block),
      title: '拼接/贴图痕迹',
      text,
      details: details.length > 0 ? details : undefined,
    })
  }

  // 时间戳检测
  if (data.timestamp) {
    const block = data.timestamp as RuleChecksTimestamp & Record<string, unknown>
    const text = block.message || readBlockText(block) || '暂无该项检测数据'
    const details: { label: string; value: string }[] = []

    // 提取详细信息
    if (block.risk != null && typeof block.risk === 'number') {
      details.push({ label: '风险分数', value: `${(block.risk * 100).toFixed(1)}%` })
    }
    if (block.transaction_time) {
      details.push({ label: '交易时间', value: block.transaction_time })
    }
    if (block.business_mismatch === true) {
      details.push({ label: '业务时间不匹配', value: '是' })
    }
    if (block.timestamp_check && typeof block.timestamp_check === 'object') {
      const tc = block.timestamp_check as Record<string, unknown>
      if (typeof tc.business_document_time === 'string' && tc.business_document_time.trim()) {
        details.push({ label: '业务单据时间', value: tc.business_document_time.trim() })
      }
      if (tc.has_exif === false) {
        details.push({ label: 'EXIF 信息', value: '无' })
      }
    }

    findings.push({
      status: readBlockStatus(block),
      title: '时间与单据核对',
      text,
      details: details.length > 0 ? details : undefined,
    })
  }

  // 语义检测
  if (data.semantic) {
    const block = data.semantic as RuleChecksSemantic & Record<string, unknown>
    const text = block.message || readBlockText(block) || '暂无该项检测数据'
    const details: { label: string; value: string }[] = []

    // 提取详细信息
    if (block.risk != null && typeof block.risk === 'number') {
      details.push({ label: '风险分数', value: `${(block.risk * 100).toFixed(1)}%` })
    }
    if (Array.isArray(block.anomalies) && block.anomalies.length > 0) {
      details.push({ label: '异常类型', value: block.anomalies.join('、') })
    }

    findings.push({
      status: readBlockStatus(block),
      title: '语义（金额/排版/EXIF）',
      text,
      details: details.length > 0 ? details : undefined,
    })
  }

  return {
    summary: data.reason?.trim() || '—',
    findings,
    timeFacts: [],
  }
}
