<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, toRaw } from 'vue'
import {
  deleteV3Task,
  fetchDetectionHistory,
  getV3Result,
  getVisualizationBlob,
  submitRuleChecks,
  submitV1ImageDetectSync,
  submitV3Detect,
  type BboxXYXY,
  type RuleChecksData,
  type V3ResultItem,
} from './api/detect'
import {
  historyEntryHasAi,
  historyEntryKindLabel,
  mergeHistoryEntriesForDisplay,
  type DetectionHistoryEntry,
} from './detectionHistory'
import {
  buildExtendedDisplayLines,
  hasExtendedDetectionFields,
} from './detectionExtendedDisplay'
import {
  buildRuleCheckUserView,
  ruleCheckVerdict,
} from './ruleCheckDisplay'
const files = ref<File[]>([])
const filePreviews = ref<string[]>([])
const selectedUploadIndex = ref(0)
const uploadInputRef = ref<HTMLInputElement | null>(null)
const historyPreviewUrl = ref<string | null>(null)
const imgRef = ref<HTMLImageElement | null>(null)
const imageNatural = ref({ w: 0, h: 0 })

const v3SpecifyBbox = ref(false)
/** 单据时间（可选）：付款截图等场景供后端时间校验 */
const documentTime = ref('')

/** 可多选：勾选哪种就使用哪种，两项都勾选则并行 */
const useModelDetection = ref(true)
const useRuleDetection = ref(true)

const drawing = ref(false)
const drawStart = ref<{ x: number; y: number } | null>(null)
const drawCurrent = ref<{ x: number; y: number } | null>(null)
const userBbox = ref<BboxXYXY | null>(null)

const busy = ref(false)
const pollStatus = ref('')
const errorMsg = ref<string | null>(null)

const v3TaskId = ref<string | null>(null)
type V3ViewPayload = {
  result?: V3ResultItem | null
  multi?: V3ResultItem[]
  error_msg?: string | null
}
const v3Payload = ref<V3ViewPayload | null>(null)

const ruleCheckPayload = ref<RuleChecksData | null>(null)
const ruleCheckLoading = ref(false)
const ruleCheckError = ref<string | null>(null)

const ruleCheckVerdictInfo = computed(() => ruleCheckVerdict(ruleCheckPayload.value))
const ruleCheckUserView = computed(() => buildRuleCheckUserView(ruleCheckPayload.value))

const hasAiReport = computed(() => {
  const p = v3Payload.value
  return !!(p?.result || p?.multi?.length)
})

const aiReportResult = computed(() => v3Payload.value?.result ?? null)

const hasReportContent = computed(
  () =>
    hasAiReport.value ||
    !!ruleCheckPayload.value ||
    ruleCheckLoading.value ||
    !!ruleCheckError.value,
)

/** 报告区底部展示的图片（标注图优先，其次历史原图/当前上传图） */
const reportImageUrl = computed(() => {
  if (vizObjectUrl.value) return null
  if (viewingHistoryId.value && historyPreviewUrl.value) return historyPreviewUrl.value
  if (!viewingHistoryId.value && activePreviewUrl.value && hasReportContent.value) {
    return activePreviewUrl.value
  }
  return null
})

const reportImageHeading = computed(() => {
  if (vizObjectUrl.value) return '标注示意图'
  if (viewingHistoryId.value && hasAiReport.value) return '检测原图'
  return '检测图片'
})

const vizObjectUrl = ref<string | null>(null)
const vizLoading = ref(false)
const historyEntries = ref<DetectionHistoryEntry[]>([])
const historyLoading = ref(false)
const historyError = ref<string | null>(null)
const historyTotal = ref(0)
/** 当前列表页码（从 1 起，每页仅展示本页 9 条） */
const historyPage = ref(1)
const HISTORY_PAGE_SIZE = 9

const historyTotalPages = computed(() =>
  historyTotal.value <= 0 ? 0 : Math.ceil(historyTotal.value / HISTORY_PAGE_SIZE),
)

const historyCanPrev = computed(() => historyPage.value > 1)

const historyCanNext = computed(
  () =>
    historyTotalPages.value > 0 && historyPage.value < historyTotalPages.value,
)

const viewingHistoryId = ref<string | null>(null)
/** 同步检测进行中时用于取消 fetch */
const detectAbort = ref<AbortController | null>(null)

const activePreviewUrl = computed(
  () => filePreviews.value[selectedUploadIndex.value] || null,
)

function revokeUploadPreviews() {
  for (const u of filePreviews.value) {
    if (u) URL.revokeObjectURL(u)
  }
  filePreviews.value = []
}

function addFiles(next: File[]) {
  if (!next.length) return
  resetResults()
  userBbox.value = null
  imageNatural.value = { w: 0, h: 0 }
  const before = files.value.length
  files.value = [...files.value, ...next]
  filePreviews.value = [...filePreviews.value, ...next.map((f) => URL.createObjectURL(f))]
  // 默认切到刚新增的第一张，方便连续多次上传后立即预览新图
  selectedUploadIndex.value = before
}

function removePickedFile(index: number) {
  if (index < 0 || index >= files.value.length) return
  const url = filePreviews.value[index]
  if (url) URL.revokeObjectURL(url)
  files.value = files.value.filter((_, i) => i !== index)
  filePreviews.value = filePreviews.value.filter((_, i) => i !== index)
  if (!files.value.length) {
    selectedUploadIndex.value = 0
    imageNatural.value = { w: 0, h: 0 }
    if (!viewingHistoryId.value) {
      v3Payload.value = null
      v3TaskId.value = null
      if (vizObjectUrl.value) {
        URL.revokeObjectURL(vizObjectUrl.value)
        vizObjectUrl.value = null
      }
    }
    return
  }
  if (selectedUploadIndex.value > index) {
    selectedUploadIndex.value -= 1
  } else if (selectedUploadIndex.value >= files.value.length) {
    selectedUploadIndex.value = files.value.length - 1
  }
}

function onFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  const files = Array.from(input.files ?? []).filter((f) => /^image\//.test(f.type))
  input.value = ''
  addFiles(files)
}

function triggerUploadPick() {
  uploadInputRef.value?.click()
}

function resetRuleCheck() {
  ruleCheckPayload.value = null
  ruleCheckError.value = null
  ruleCheckLoading.value = false
}

function resetResults() {
  errorMsg.value = null
  viewingHistoryId.value = null
  historyPreviewUrl.value = null
  v3Payload.value = null
  resetRuleCheck()
  detectAbort.value?.abort()
  detectAbort.value = null
  vizLoading.value = false
  if (vizObjectUrl.value) {
    URL.revokeObjectURL(vizObjectUrl.value)
    vizObjectUrl.value = null
  }
  v3TaskId.value = null
}

async function waitMs(ms: number): Promise<void> {
  await new Promise<void>((resolve) => setTimeout(resolve, ms))
}

async function waitWithCountdown(
  totalSeconds: number,
  render: (remainSeconds: number) => void,
  signal?: AbortSignal,
): Promise<void> {
  for (let remain = totalSeconds; remain > 0; remain--) {
    if (signal?.aborted) throw new DOMException('Aborted', 'AbortError')
    render(remain)
    await waitMs(1000)
  }
}

function isDetectionMockMode(): boolean {
  return String(import.meta.env.VITE_USE_MOCK ?? '').trim() === '1'
}

function detectSubmitOpts(signal: AbortSignal) {
  const t = documentTime.value.trim()
  return { signal, document_time: t || null }
}

/** 与主鉴伪并行：规则检测失败不阻断 AI 结果展示 */
function startRuleChecks(file: File, bbox: BboxXYXY | null, signal: AbortSignal) {
  resetRuleCheck()
  ruleCheckLoading.value = true
  void submitRuleChecks(file, bbox, detectSubmitOpts(signal))
    .then((data) => {
      if (signal.aborted) return
      ruleCheckPayload.value = data
      ruleCheckError.value = null
    })
    .catch((e) => {
      if (e instanceof DOMException && e.name === 'AbortError') return
      ruleCheckPayload.value = null
      ruleCheckError.value = e instanceof Error ? e.message : String(e)
    })
    .finally(() => {
      if (!signal.aborted) ruleCheckLoading.value = false
    })
}

async function runRuleSingle(file: File) {
  const bbox: BboxXYXY | null = v3SpecifyBbox.value ? (userBbox.value ?? fullImageBbox()) : null
  if (v3SpecifyBbox.value && !bbox) {
    errorMsg.value = '请框选区域或等待图片在预览区加载完成'
    return
  }

  busy.value = true
  errorMsg.value = null
  viewingHistoryId.value = null
  v3Payload.value = null
  v3TaskId.value = null
  if (vizObjectUrl.value) {
    URL.revokeObjectURL(vizObjectUrl.value)
    vizObjectUrl.value = null
  }
  detectAbort.value?.abort()
  const ac = new AbortController()
  detectAbort.value = ac
  resetRuleCheck()
  ruleCheckLoading.value = true
  pollStatus.value = '正在进行规则检测…'
  try {
    const data = await submitRuleChecks(file, bbox, detectSubmitOpts(ac.signal))
    if (ac.signal.aborted) return
    ruleCheckPayload.value = data
    ruleCheckError.value = null
    pollStatus.value = '规则检测完成'
    void refreshHistoryList()
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') {
      pollStatus.value = '已取消'
      return
    }
    ruleCheckPayload.value = null
    ruleCheckError.value = e instanceof Error ? e.message : String(e)
    errorMsg.value = ruleCheckError.value
    pollStatus.value = ''
  } finally {
    ruleCheckLoading.value = false
    detectAbort.value = null
    busy.value = false
  }
}

async function runRuleBatch(picked: File[]) {
  if (v3SpecifyBbox.value) {
    errorMsg.value = '批量检测暂不支持“仅分析框选区域”，请关闭后重试。'
    return
  }

  busy.value = true
  errorMsg.value = null
  viewingHistoryId.value = null
  v3Payload.value = null
  v3TaskId.value = null
  if (vizObjectUrl.value) {
    URL.revokeObjectURL(vizObjectUrl.value)
    vizObjectUrl.value = null
  }
  detectAbort.value?.abort()
  const ac = new AbortController()
  detectAbort.value = ac
  resetRuleCheck()
  ruleCheckLoading.value = true
  let success = 0
  const failed: string[] = []
  let lastData: RuleChecksData | null = null
  try {
    pollStatus.value = `批量规则检测 0/${picked.length}…`
    for (let i = 0; i < picked.length; i++) {
      const f = picked[i]!
      pollStatus.value = `批量规则检测 ${i + 1}/${picked.length}…`
      try {
        const data = await submitRuleChecks(f, null, detectSubmitOpts(ac.signal))
        success += 1
        lastData = data
        void refreshHistoryList()
      } catch (e) {
        if (e instanceof DOMException && e.name === 'AbortError') throw e
        failed.push(`${f.name}: ${e instanceof Error ? e.message : String(e)}`)
      }
    }
    if (lastData) {
      ruleCheckPayload.value = lastData
      ruleCheckError.value = null
    }
    pollStatus.value = `批量规则检测完成：成功 ${success}/${picked.length}`
    if (failed.length) {
      errorMsg.value = `以下文件失败（${failed.length}）：\n${failed.slice(0, 5).join('\n')}${failed.length > 5 ? '\n…' : ''}`
    }
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') {
      pollStatus.value = '已取消'
      return
    }
    errorMsg.value = e instanceof Error ? e.message : String(e)
    pollStatus.value = ''
  } finally {
    ruleCheckLoading.value = false
    detectAbort.value = null
    busy.value = false
  }
}

/** 单张/批量共用：v3 异步提交 → 等待 → 拉取结果（与多张单步逻辑一致） */
async function runV3AsyncOne(
  file: File,
  bbox: BboxXYXY | null,
  progressPrefix: string,
  signal: AbortSignal,
): Promise<{ taskId: string; payload: V3ViewPayload }> {
  pollStatus.value = `${progressPrefix}：提交任务…`
  const submit = await submitV3Detect(file, bbox, detectSubmitOpts(signal))
  const taskId = submit.task_id?.trim()
  if (!taskId) throw new Error(`${progressPrefix}：未返回任务 ID`)
  await waitWithCountdown(
    90,
    (remain) => {
      const mm = Math.floor(remain / 60)
      const ss = remain % 60
      pollStatus.value = `${progressPrefix}：预计等待 ${mm}:${String(ss).padStart(2, '0')} 后查询结果`
    },
    signal,
  )
  pollStatus.value = `${progressPrefix}：查询结果中…`
  const data = await getV3Result(taskId, { signal })
  if (data.error_msg?.trim() && !data.result && !(data.multi_results?.length)) {
    throw new Error(data.error_msg)
  }
  if ((data.status || '').toUpperCase() !== 'COMPLETED') {
    throw new Error(`任务未完成（状态 ${data.status || 'unknown'}）`)
  }
  if (!data.result && !(data.multi_results?.length)) {
    throw new Error('未返回检测结果')
  }
  const payload: V3ViewPayload = {
    result: data.result ?? null,
    multi: data.multi_results,
    error_msg: data.error_msg ?? null,
  }
  return { taskId, payload }
}

function onImgLoad() {
  const el = imgRef.value
  imageNatural.value = el
    ? { w: el.naturalWidth, h: el.naturalHeight }
    : { w: 0, h: 0 }
}

function onImgError() {
  imageNatural.value = { w: 0, h: 0 }
}

const overlayStroke = computed(() =>
  Math.max(2, (imageNatural.value.w || 0) * 0.003),
)

function naturalBboxFromDraw(): BboxXYXY | null {
  const img = imgRef.value
  if (!img?.naturalWidth || !drawStart.value || !drawCurrent.value) return null
  const s = drawStart.value
  const c = drawCurrent.value
  const x1 = Math.max(0, Math.min(s.x, c.x))
  const y1 = Math.max(0, Math.min(s.y, c.y))
  const x2 = Math.min(img.naturalWidth, Math.max(s.x, c.x))
  const y2 = Math.min(img.naturalHeight, Math.max(s.y, c.y))
  if (x2 - x1 < 2 || y2 - y1 < 2) return null
  return [Math.round(x1), Math.round(y1), Math.round(x2), Math.round(y2)]
}

function eventToNatural(e: MouseEvent, img: HTMLImageElement) {
  const r = img.getBoundingClientRect()
  const x = ((e.clientX - r.left) / r.width) * img.naturalWidth
  const y = ((e.clientY - r.top) / r.height) * img.naturalHeight
  return {
    x: Math.max(0, Math.min(img.naturalWidth, x)),
    y: Math.max(0, Math.min(img.naturalHeight, y)),
  }
}

function onDrawDown(e: MouseEvent) {
  const img = imgRef.value
  if (!img?.naturalWidth || busy.value) return
  drawing.value = true
  drawStart.value = eventToNatural(e, img)
  drawCurrent.value = { ...drawStart.value }
}

function onDrawMove(e: MouseEvent) {
  const img = imgRef.value
  if (!drawing.value || !img?.naturalWidth) return
  drawCurrent.value = eventToNatural(e, img)
}

function onDrawUp() {
  if (!drawing.value) return
  drawing.value = false
  const b = naturalBboxFromDraw()
  drawStart.value = null
  drawCurrent.value = null
  if (b) userBbox.value = b
}

function fullImageBbox(): BboxXYXY | null {
  const img = imgRef.value
  if (!img?.naturalWidth) return null
  return [0, 0, img.naturalWidth, img.naturalHeight]
}

const drawPreviewBbox = computed(() => {
  const img = imgRef.value
  if (!img?.naturalWidth || !drawStart.value || !drawCurrent.value) return null
  const s = drawStart.value
  const c = drawCurrent.value
  return {
    x1: Math.min(s.x, c.x),
    y1: Math.min(s.y, c.y),
    x2: Math.max(s.x, c.x),
    y2: Math.max(s.y, c.y),
  }
})

type NumberedBbox = {
  n: number
  bbox: readonly [number, number, number, number]
}

function bboxAreaWh(b: readonly [number, number, number, number]) {
  return Math.max(0, b[2]) * Math.max(0, b[3])
}

/** 接口偶发缺 bbox 或非数组，直接解构会在 computed 里抛错导致整页白屏 */
function readBboxWh(b: unknown): readonly [number, number, number, number] | null {
  if (!Array.isArray(b) || b.length < 4) return null
  const nums = b.slice(0, 4).map((v) => Number(v))
  if (!nums.every((n) => Number.isFinite(n))) return null
  const [x, y, w, h] = nums
  if (w <= 0 || h <= 0) return null
  return [x, y, w, h] as const
}

/** 与右侧列表序号一致；预览与历史坐标示意共用 */
function collectNumberedBoxesFromPayload(
  p: NonNullable<typeof v3Payload.value>,
): NumberedBbox[] {
  if (p.multi?.length) {
    const raw: NumberedBbox[] = []
    for (let i = 0; i < p.multi.length; i++) {
      const m = p.multi[i]
      if ((m.result || '').trim() === '正常') continue
      const bb = readBboxWh(m?.bbox)
      if (bb) raw.push({ n: i + 1, bbox: bb })
    }
    if (raw.length) {
      return [...raw].sort((a, b) => bboxAreaWh(a.bbox) - bboxAreaWh(b.bbox))
    }
    return []
  }
  if (p.result) {
    const top = (p.result.result || '').trim()
    if (top === '正常') return []
    const bb = readBboxWh(p.result.bbox)
    if (bb) return [{ n: 1, bbox: bb }]
  }
  return []
}

/** 与右侧「各区域明细」序号一致；按面积从小到大排序绘制，小框后画在上层，减轻遮挡 */
const previewNumberedRegions = computed((): NumberedBbox[] => {
  if (!imageNatural.value.w || viewingHistoryId.value) return []
  const p = v3Payload.value
  if (!p) return []
  return collectNumberedBoxesFromPayload(p)
})

/** 看历史且无标注图/原图时，用坐标画区域示意（放在报告区） */
const historySchematicSpec = computed(() => {
  if (!viewingHistoryId.value || !v3Payload.value) return null
  if (vizObjectUrl.value || vizLoading.value || historyPreviewUrl.value) return null
  const boxes = collectNumberedBoxesFromPayload(v3Payload.value)
  if (!boxes.length) return null
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  for (const { bbox: b } of boxes) {
    minX = Math.min(minX, b[0])
    minY = Math.min(minY, b[1])
    maxX = Math.max(maxX, b[0] + b[2])
    maxY = Math.max(maxY, b[1] + b[3])
  }
  const w0 = maxX - minX
  const h0 = maxY - minY
  const pad = Math.max(16, Math.min(w0 || 1, h0 || 1) * 0.06)
  const vx = minX - pad
  const vy = minY - pad
  const vw = w0 + 2 * pad
  const vh = h0 + 2 * pad
  if (!Number.isFinite(vw) || !Number.isFinite(vh) || vw <= 0 || vh <= 0) return null
  const span = Math.max(vw, vh)
  return { viewBox: `${vx} ${vy} ${vw} ${vh}`, span, boxes }
})

function schematicMarkerFromBbox(
  bbox: readonly [number, number, number, number],
  span: number,
) {
  const r = Math.max(8, Math.min(22, span * 0.022))
  const x1 = bbox[0]
  const y1 = bbox[1]
  const bw = bbox[2]
  const bh = bbox[3]
  let cx = x1 + r + 3
  let cy = y1 + r + 3
  const minX = x1 + r + 1
  const maxX = x1 + bw - r - 1
  const minY = y1 + r + 1
  const maxY = y1 + bh - r - 1
  if (maxX >= minX) cx = Math.min(maxX, Math.max(minX, cx))
  else cx = x1 + bw / 2
  if (maxY >= minY) cy = Math.min(maxY, Math.max(minY, cy))
  else cy = y1 + bh / 2
  const fs = Math.max(12, Math.min(22, span * 0.028))
  return { cx, cy, r, fs }
}

const historySchematicRenderList = computed(() => {
  const s = historySchematicSpec.value
  if (!s) return []
  return s.boxes.map((it) => ({
    ...it,
    ...schematicMarkerFromBbox(it.bbox, s.span),
  }))
})

const vizHintMissing = computed(
  () =>
    !!viewingHistoryId.value &&
    !!v3TaskId.value &&
    !!v3Payload.value &&
    !vizObjectUrl.value &&
    !vizLoading.value &&
    !historySchematicSpec.value &&
    collectNumberedBoxesFromPayload(v3Payload.value).length > 0,
)

/** 检测报告「各区域明细」：不列出「正常」区域，仅展示可疑/篡改等需关注项，序号与全图检测一致 */
const reportMultiDetailRows = computed(() => {
  const multi = v3Payload.value?.multi
  if (!multi?.length) return [] as { item: V3ResultItem; regionNo: number }[]
  const out: { item: V3ResultItem; regionNo: number }[] = []
  for (let i = 0; i < multi.length; i++) {
    const m = multi[i]
    if ((m.result || '').trim() === '正常') continue
    out.push({ item: m, regionNo: i + 1 })
  }
  return out
})

const summaryExtendedLines = computed(() =>
  buildExtendedDisplayLines(v3Payload.value?.result ?? null),
)

function extendedLinesForItem(item: V3ResultItem) {
  return buildExtendedDisplayLines(item)
}

function itemShowsExtended(item: V3ResultItem) {
  return hasExtendedDetectionFields(item)
}

const regionLabelMetrics = computed(() => {
  const w = imageNatural.value.w || 800
  const fs = Math.max(12, Math.min(24, w * 0.022))
  const r = fs * 0.55
  return { fs, r }
})

function regionMarkerCenter(bbox: readonly [number, number, number, number]) {
  const { r } = regionLabelMetrics.value
  const x1 = bbox[0]
  const y1 = bbox[1]
  const bw = bbox[2]
  const bh = bbox[3]
  let cx = x1 + r + 3
  let cy = y1 + r + 3
  const minX = x1 + r + 1
  const maxX = x1 + bw - r - 1
  const minY = y1 + r + 1
  const maxY = y1 + bh - r - 1
  if (maxX >= minX) cx = Math.min(maxX, Math.max(minX, cx))
  else cx = x1 + bw / 2
  if (maxY >= minY) cy = Math.min(maxY, Math.max(minY, cy))
  else cy = y1 + bh / 2
  return { cx, cy }
}

const REGION_STROKES = ['#1d4ed8', '#0d9488', '#7c3aed', '#c2410c'] as const
function regionStrokeForIndex(n: number) {
  return REGION_STROKES[(n - 1) % REGION_STROKES.length]
}

const REGION_DASH = ['7 5', '4 4', '10 4', '3 3'] as const
function regionDashForIndex(n: number) {
  return REGION_DASH[(n - 1) % REGION_DASH.length]
}

const previewNumberedRenderList = computed(() =>
  previewNumberedRegions.value.map((it) => ({
    ...it,
    ...regionMarkerCenter(it.bbox),
  })),
)

const previewLightboxOpen = ref(false)
const previewLightboxSrc = ref('')
const previewLightboxStageRef = ref<HTMLElement | null>(null)

function openPreviewLightbox(src?: string) {
  const target = (src ?? activePreviewUrl.value ?? '').trim()
  if (!target) return
  previewLightboxSrc.value = target
  previewLightboxOpen.value = true
  window.addEventListener('keydown', onPreviewLightboxKeydown)
  nextTick(() => {
    const stage = previewLightboxStageRef.value
    if (!stage) return
    stage.scrollTop = 0
    stage.scrollLeft = 0
  })
}

function closePreviewLightbox() {
  previewLightboxOpen.value = false
  previewLightboxSrc.value = ''
  window.removeEventListener('keydown', onPreviewLightboxKeydown)
}

function onPreviewLightboxKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') closePreviewLightbox()
}

function onPreviewImgClick() {
  if (v3SpecifyBbox.value || busy.value) return
  openPreviewLightbox(activePreviewUrl.value || '')
}

const userBboxXYWH = computed(() => {
  if (!userBbox.value) return null
  const [x1, y1, x2, y2] = userBbox.value
  return [x1, y1, x2 - x1, y2 - y1] as const
})

function formatHistoryTime(iso: string) {
  if (!iso || iso === '—') return '—'
  try {
    const d = new Date(iso.replace(' ', 'T'))
    if (Number.isNaN(d.getTime())) return iso
    return d.toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return iso
  }
}

function truncateName(name: string, max = 18) {
  if (name.length <= max) return name
  return `${name.slice(0, max - 1)}…`
}

function historyResultLabel(entry: DetectionHistoryEntry) {
  if (entry.status === 'FAILED') return '失败'
  const r = entry.payload.result?.result
  if (r) return r
  const m = entry.payload.multi?.[0]?.result
  if (m) return m
  if (entry.ruleCheck) return ruleCheckVerdict(entry.ruleCheck).label
  return '已完成'
}

function historyKindLabel(entry: DetectionHistoryEntry) {
  return historyEntryKindLabel(entry)
}

function historyPillClass(entry: DetectionHistoryEntry) {
  if (entry.status === 'FAILED') return '失败'
  const label = historyResultLabel(entry)
  if (label === '正常' || label === '可疑' || label === '篡改' || label === '错误') {
    return label
  }
  return ''
}

function isHistoryRowActive(entry: DetectionHistoryEntry) {
  if (viewingHistoryId.value === entry.id) return true
  if (
    !viewingHistoryId.value &&
    entry.taskId &&
    v3TaskId.value === entry.taskId &&
    v3Payload.value
  ) {
    return true
  }
  return false
}

async function goHistoryPage(page: number) {
  if (historyLoading.value) return
  if (page < 1) return
  if (historyTotal.value > 0) {
    const tp = Math.ceil(historyTotal.value / HISTORY_PAGE_SIZE)
    if (page > tp) return
  }
  historyLoading.value = true
  historyError.value = null
  try {
    const r = await fetchDetectionHistory(page, HISTORY_PAGE_SIZE)
    historyEntries.value = mergeHistoryEntriesForDisplay(r.items)
    historyTotal.value = r.total
    historyPage.value = page
  } catch (e) {
    historyError.value = e instanceof Error ? e.message : String(e)
  } finally {
    historyLoading.value = false
  }
}

async function refreshHistoryList() {
  await goHistoryPage(1)
}

/** 历史列表项来自 Vue 响应式数据，不能用 structuredClone（Proxy 不可克隆） */
function clonePayloadForView(
  p: DetectionHistoryEntry['payload'],
): NonNullable<typeof v3Payload.value> {
  return JSON.parse(JSON.stringify(toRaw(p))) as NonNullable<
    typeof v3Payload.value
  >
}

async function applyHistoryEntry(entry: DetectionHistoryEntry) {
  errorMsg.value = null
  pollStatus.value = ''
  viewingHistoryId.value = entry.id
  imageNatural.value = { w: 0, h: 0 }
  ruleCheckPayload.value = entry.ruleCheck ?? null
  ruleCheckError.value = null
  ruleCheckLoading.value = false
  // 后端返回的 imageUrl 应为完整的资源路径（通常以 /ai-detection 开头），
  // 前端不得再统一 prepend 公共 /api/v1 前缀，避免生成错误路径。
  const raw = (entry.imageUrl ?? '').trim()
  if (!raw) {
    historyPreviewUrl.value = null
  } else if (/^https?:\/\//i.test(raw) || /^\/\//.test(raw) || raw.startsWith('/')) {
    // 绝对 URL 或以 / 开头的本域路径，直接使用
    historyPreviewUrl.value = raw
  } else {
    // 相对路径（极少数），在前面补一个斜杠以成为同域绝对路径
    historyPreviewUrl.value = '/' + raw
  }
  if (vizObjectUrl.value) {
    URL.revokeObjectURL(vizObjectUrl.value)
    vizObjectUrl.value = null
  }
  if (entry.status === 'FAILED') {
    v3TaskId.value = entry.taskId || null
    v3Payload.value = null
    errorMsg.value = entry.payload.error_msg || '该条检测未成功完成'
    return
  }
  v3TaskId.value = entry.taskId || null
  if (historyEntryHasAi(entry)) {
    v3Payload.value = clonePayloadForView(entry.payload)
    if (entry.taskId) void loadViz(entry.taskId)
  } else {
    v3Payload.value = null
  }
}

onMounted(() => {
  void refreshHistoryList()
})

async function runV3() {
  const picked = files.value
  if (!picked.length) {
    errorMsg.value = '请先上传图片'
    return
  }
  if (!useModelDetection.value && !useRuleDetection.value) {
    errorMsg.value = '请至少选择一种检测方式'
    return
  }

  if (useRuleDetection.value && !useModelDetection.value) {
    if (picked.length > 1) {
      await runRuleBatch(picked)
    } else {
      await runRuleSingle(picked[0]!)
    }
    return
  }

  if (picked.length > 1) {
    await runV3Batch(picked)
    return
  }

  const one = picked[0]!
  const runRule = useRuleDetection.value

  /** Mock 模式仍走同步 v1（本地假数据），与真实服务异步路径分离 */
  if (isDetectionMockMode()) {
    const bbox: BboxXYXY | null = v3SpecifyBbox.value ? (userBbox.value ?? fullImageBbox()) : fullImageBbox()
    if (!bbox) {
      errorMsg.value = v3SpecifyBbox.value
        ? '请框选区域或等待图片在预览区加载完成'
        : '请等待图片在预览区加载完成后再分析（需读取尺寸以提交整图区域）'
      return
    }
    busy.value = true
    errorMsg.value = null
    viewingHistoryId.value = null
    v3Payload.value = null
    v3TaskId.value = null
    if (vizObjectUrl.value) {
      URL.revokeObjectURL(vizObjectUrl.value)
      vizObjectUrl.value = null
    }
    detectAbort.value?.abort()
    const ac = new AbortController()
    detectAbort.value = ac
    pollStatus.value = ''
    if (runRule) startRuleChecks(one, bbox, ac.signal)
    else resetRuleCheck()
    try {
      pollStatus.value = '正在提交检测…'
      const data = await submitV1ImageDetectSync(one, bbox, detectSubmitOpts(ac.signal))
      if (data.error_msg?.trim() && !data.result && !(data.multi?.length)) {
        throw new Error(data.error_msg)
      }
      if (!data.result && !(data.multi?.length)) {
        throw new Error(data.error_msg || '未返回检测结果')
      }
      v3Payload.value = {
        result: data.result ?? null,
        multi: data.multi,
        error_msg: data.error_msg ?? null,
      }
      const taskId = data.task_id?.trim()
      v3TaskId.value = taskId || null
      pollStatus.value = '分析完成'
      viewingHistoryId.value = null
      void refreshHistoryList()
      if (taskId) void loadViz(taskId)
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') {
        pollStatus.value = '已取消'
        return
      }
      errorMsg.value = e instanceof Error ? e.message : String(e)
      pollStatus.value = ''
    } finally {
      detectAbort.value = null
      busy.value = false
    }
    return
  }

  /** 单张与多张一致：v3 异步任务 + 倒计时等待 + 查询结果 */
  const bbox: BboxXYXY | null = v3SpecifyBbox.value ? (userBbox.value ?? fullImageBbox()) : null
  if (v3SpecifyBbox.value && !bbox) {
    errorMsg.value = '请框选区域或等待图片在预览区加载完成'
    return
  }

  busy.value = true
  errorMsg.value = null
  viewingHistoryId.value = null
  v3Payload.value = null
  v3TaskId.value = null
  if (vizObjectUrl.value) {
    URL.revokeObjectURL(vizObjectUrl.value)
    vizObjectUrl.value = null
  }
  detectAbort.value?.abort()
  const ac = new AbortController()
  detectAbort.value = ac
  pollStatus.value = ''
  if (runRule) startRuleChecks(one, bbox, ac.signal)
  else resetRuleCheck()
  try {
    pollStatus.value = '预计等待约 1 分钟（按每张约 1 分钟估算）'
    await waitMs(300)
    const { taskId, payload } = await runV3AsyncOne(one, bbox, '检测', ac.signal)
    v3TaskId.value = taskId
    v3Payload.value = payload
    pollStatus.value = '分析完成'
    viewingHistoryId.value = null
    void refreshHistoryList()
    void loadViz(taskId)
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') {
      pollStatus.value = '已取消'
      return
    }
    errorMsg.value = e instanceof Error ? e.message : String(e)
    pollStatus.value = ''
  } finally {
    detectAbort.value = null
    busy.value = false
  }
}

async function runV3Batch(files: File[]) {
  if (!files.length) return
  if (v3SpecifyBbox.value) {
    errorMsg.value = '批量检测暂不支持“仅分析框选区域”，请关闭后重试。'
    return
  }
  const runRule = useRuleDetection.value
  busy.value = true
  errorMsg.value = null
  viewingHistoryId.value = null
  v3Payload.value = null
  v3TaskId.value = null
  if (!runRule) resetRuleCheck()
  if (vizObjectUrl.value) {
    URL.revokeObjectURL(vizObjectUrl.value)
    vizObjectUrl.value = null
  }
  detectAbort.value?.abort()
  const ac = new AbortController()
  detectAbort.value = ac
  let success = 0
  const failed: string[] = []
  let lastTaskId: string | null = null
  let lastPayload: V3ViewPayload | null = null
  try {
    pollStatus.value = `预计等待约 ${files.length} 分钟（按每张约 1 分钟估算）`
    await waitMs(300)
    for (let i = 0; i < files.length; i++) {
      const f = files[i]!
      const prefix = `批量检测 ${i + 1}/${files.length}`
      try {
        if (runRule) startRuleChecks(f, null, ac.signal)
        const { taskId, payload } = await runV3AsyncOne(f, null, prefix, ac.signal)
        success += 1
        lastTaskId = taskId
        lastPayload = payload
        void refreshHistoryList()
      } catch (e) {
        if (e instanceof DOMException && e.name === 'AbortError') throw e
        failed.push(`${f.name}: ${e instanceof Error ? e.message : String(e)}`)
      }
    }
    v3TaskId.value = lastTaskId
    if (lastPayload) v3Payload.value = lastPayload
    pollStatus.value = `批量完成：成功 ${success}/${files.length}`
    if (failed.length) {
      errorMsg.value = `以下文件失败（${failed.length}）：\n${failed.slice(0, 5).join('\n')}${failed.length > 5 ? '\n…' : ''}`
    }
    void refreshHistoryList()
    if (lastTaskId) void loadViz(lastTaskId)
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') {
      pollStatus.value = '已取消'
      return
    }
    errorMsg.value = e instanceof Error ? e.message : String(e)
    pollStatus.value = ''
  } finally {
    detectAbort.value = null
    busy.value = false
  }
}

async function loadViz(taskId: string): Promise<boolean> {
  vizLoading.value = true
  try {
    // 若任务尚未完成，后端可能返回 400/{"detail":"Task not completed."}
    // 因此在前端做小范围重试以避免瞬时竞态导致的空白预览
    const maxAttempts = 5
    const delayMs = 1000
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const blob = await getVisualizationBlob(taskId)
        if (vizObjectUrl.value) URL.revokeObjectURL(vizObjectUrl.value)
        vizObjectUrl.value = URL.createObjectURL(blob)
        return true
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e)
        // 若为任务未完成导致的错误，则等待后重试，否则立即抛出
        if (msg.includes('Task not completed') || msg.includes('暂时无法连接检测服务') || msg.includes('HTTP 400')) {
          if (attempt < maxAttempts) {
            await waitMs(delayMs)
            continue
          }
          // 最后一次依然失败则当作不可用
          return false
        }
        throw e
      }
    }
    return false
  } catch {
    vizObjectUrl.value = null
    return false
  } finally {
    vizLoading.value = false
  }
}

async function cancelTask() {
  detectAbort.value?.abort()
  const taskId = v3TaskId.value?.trim()
  if (!taskId) return
  try {
    await deleteV3Task(taskId)
  } catch {
    // ignore cancel races; local polling has already been aborted
  }
}

onUnmounted(() => {
  detectAbort.value?.abort()
  window.removeEventListener('keydown', onPreviewLightboxKeydown)
  revokeUploadPreviews()
  if (vizObjectUrl.value) URL.revokeObjectURL(vizObjectUrl.value)
})
</script>

<template>
  <div class="shell">
    <header class="topbar">
      <div class="topbar-inner">
        <div class="brand">
          <span class="brand-mark" aria-hidden="true" />
          <div>
            <h1 class="brand-title">图像真伪检测</h1>
            <p class="brand-sub">检测图像是否存在后期篡改风险</p>
          </div>
        </div>
      </div>
    </header>

    <div class="main">
      <aside class="sidebar">
        <section class="card side-section">
          <h2 class="section-title">检测方式</h2>
          <p class="detect-type-hint">可多选；勾选哪种使用哪种，两项都选则并行检测。</p>
          <div class="detect-type-list">
            <label class="detect-type-item">
              <input
                v-model="useModelDetection"
                type="checkbox"
                class="detect-type-input"
                :disabled="busy || (useModelDetection && !useRuleDetection)"
              />
              <span class="detect-type-check" aria-hidden="true" />
              <span class="detect-type-body">
                <span class="detect-type-title">AI 检测</span>
                <span class="detect-type-desc"
                  >自动查找关键区域并汇总结论，适合证件、票据等复杂画面</span
                >
              </span>
            </label>
            <label class="detect-type-item">
              <input
                v-model="useRuleDetection"
                type="checkbox"
                class="detect-type-input"
                :disabled="busy || (useRuleDetection && !useModelDetection)"
              />
              <span class="detect-type-check" aria-hidden="true" />
              <span class="detect-type-body">
                <span class="detect-type-title">规则检测</span>
                <span class="detect-type-desc"
                  >核查拼接痕迹、时间一致性等规则项，速度较快</span
                >
              </span>
            </label>
          </div>
        </section>

        <section class="card side-section">
          <h2 class="section-title">上传图片</h2>
          <input
            ref="uploadInputRef"
            class="sr-only"
            type="file"
            accept="image/*"
            multiple
            @change="onFileChange"
          />
          <div class="upload-select-row">
            <button type="button" class="btn btn-secondary upload-select-btn" :disabled="busy" @click="triggerUploadPick">
              上传图片
            </button>
            <span class="upload-picked-summary">
              {{ files.length ? `已选择 ${files.length} 张图片` : '支持一次选择一张或多张，后续可继续添加' }}
            </span>
          </div>
          <div v-if="files.length > 1" class="upload-picked-list" aria-label="已选图片列表">
            <button
              v-for="(f, i) in files"
              :key="`${f.name}-${i}`"
              type="button"
              class="upload-picked-item"
              :class="{ active: i === selectedUploadIndex }"
              :title="f.name"
              @click="selectedUploadIndex = i"
            >
              <span class="upload-picked-item-name">{{ i + 1 }}. {{ f.name }}</span>
              <span
                class="upload-picked-item-remove"
                role="button"
                title="移除该图片"
                @click.stop="removePickedFile(i)"
                >×</span
              >
            </button>
          </div>

          <div class="option-row">
            <label class="field-label" for="document-time-input">单据时间（可选）</label>
            <input
              id="document-time-input"
              v-model="documentTime"
              type="datetime-local"
              class="field-input"
              :disabled="busy"
            />
            <p class="option-hint">
              付款截图、回单等若需校验状态栏与交易时间，可填写或核对单据上的时间；不填则由系统自动识别。
            </p>
          </div>

          <div class="option-row">
            <label class="switch-label">
              <input v-model="v3SpecifyBbox" type="checkbox" class="switch-input" />
              <span class="switch-ui" />
              <span class="switch-text">仅分析我框出的区域</span>
            </label>
            <p class="option-hint">
              <template v-if="useModelDetection">
                关闭此项时，将由系统自动在图中选取多个关键位置分别判断。
              </template>
              <template v-else>
                不框选时对整图进行规则核查；开启后可指定区域。
              </template>
            </p>
          </div>

          <div v-if="v3SpecifyBbox" class="bbox-hint">
            <p>
              在右侧预览区按住拖拽即可框选。开启本模式后请先框选再开始分析；也可框选整张图范围。
            </p>
            <p v-if="userBbox" class="bbox-coords">
              已选区域（像素）：{{ userBbox.join(', ') }}
            </p>
          </div>
        </section>

        <section class="card side-section actions-card">
          <button
            type="button"
            class="btn btn-primary"
            :disabled="busy || !files.length"
            @click="runV3"
          >
            <span v-if="busy" class="btn-spinner" />
            {{ busy ? '检测中…' : '提交检测' }}
          </button>
          <button
            v-if="busy"
            type="button"
            class="btn btn-secondary"
            @click="cancelTask"
          >
            取消分析
          </button>

          <div v-if="pollStatus" class="status-line">
            <span class="status-dot" :class="{ pulse: busy }" />
            {{ pollStatus }}
          </div>
          <p v-if="errorMsg" class="alert">{{ errorMsg }}</p>
        </section>
      </aside>

      <div class="workspace-wrap">
      <main class="workspace">
        <section class="card workspace-card">
          <div class="workspace-head">
            <h2 class="section-title tight">预览</h2>
            <div class="workspace-head-tags">
              <span v-if="v3SpecifyBbox" class="workspace-tip">框选模式已开启</span>
            </div>
          </div>

          <div
            v-if="activePreviewUrl"
            class="stage"
            @mouseleave="drawing ? onDrawUp() : null"
          >
            <img
              ref="imgRef"
              :src="activePreviewUrl"
              alt="待检测图片"
              class="preview-img"
              :class="{ 'preview-img-zoomin': !v3SpecifyBbox && !busy }"
              draggable="false"
              @load="onImgLoad"
              @error="onImgError"
              @click="onPreviewImgClick"
            />
            <svg
              v-if="imageNatural.w"
              class="overlay-svg"
              :viewBox="`0 0 ${imageNatural.w} ${imageNatural.h}`"
              preserveAspectRatio="xMidYMid meet"
            >
              <g v-if="previewNumberedRenderList.length">
                <g v-for="item in previewNumberedRenderList" :key="'rg' + item.n">
                  <rect
                    :x="item.bbox[0]"
                    :y="item.bbox[1]"
                    :width="item.bbox[2]"
                    :height="item.bbox[3]"
                    fill="rgba(37, 99, 235, 0.06)"
                    :stroke="regionStrokeForIndex(item.n)"
                    :stroke-width="Math.max(1.1, overlayStroke * 0.75)"
                    :stroke-dasharray="regionDashForIndex(item.n)"
                  />
                  <circle
                    :cx="item.cx"
                    :cy="item.cy"
                    :r="regionLabelMetrics.r"
                    fill="#1d4ed8"
                    stroke="#fff"
                    :stroke-width="Math.max(1, overlayStroke * 0.35)"
                  />
                  <text
                    :x="item.cx"
                    :y="item.cy"
                    text-anchor="middle"
                    dominant-baseline="central"
                    :font-size="regionLabelMetrics.fs * 0.88"
                    font-weight="700"
                    fill="#fff"
                    style="font-family: system-ui, -apple-system, sans-serif"
                  >
                    {{ item.n }}
                  </text>
                </g>
              </g>
              <rect
                v-if="userBboxXYWH && !v3Payload"
                :x="userBboxXYWH[0]"
                :y="userBboxXYWH[1]"
                :width="userBboxXYWH[2]"
                :height="userBboxXYWH[3]"
                fill="rgba(14, 165, 233, 0.12)"
                stroke="#0ea5e9"
                :stroke-width="overlayStroke"
                stroke-dasharray="8 6"
              />
              <rect
                v-if="drawPreviewBbox"
                :x="drawPreviewBbox.x1"
                :y="drawPreviewBbox.y1"
                :width="drawPreviewBbox.x2 - drawPreviewBbox.x1"
                :height="drawPreviewBbox.y2 - drawPreviewBbox.y1"
                fill="rgba(14, 165, 233, 0.18)"
                stroke="#0284c7"
                :stroke-width="overlayStroke"
              />
            </svg>
            <div
              v-if="v3SpecifyBbox"
              class="draw-layer"
              @mousedown.prevent="onDrawDown"
              @mousemove="onDrawMove"
              @mouseup="onDrawUp"
            />
          </div>

          <div v-else class="empty-preview">
            <p>请先在左侧上传一张图片</p>
            <p v-if="viewingHistoryId" class="history-preview-hint">
              当前正在查看历史记录，检测图片与结论见右侧「检测报告」。
            </p>
          </div>
        </section>

        <section class="card workspace-card results-card">
          <div class="workspace-head">
            <h2 class="section-title tight">检测报告</h2>
            <div class="workspace-head-tags">
              <span v-if="viewingHistoryId" class="workspace-tip workspace-tip-muted"
                >历史记录</span
              >
            </div>
          </div>

          <div v-if="hasAiReport" class="report">
            <template v-if="aiReportResult">
              <div class="report-head">
                <span
                  class="pill"
                  :class="aiReportResult.result || undefined"
                  >{{ aiReportResult.result || '—' }}</span
                >
                <div class="meter-wrap">
                  <div class="meter-label">
                    <span>风险倾向</span>
                    <span>{{
                      ((aiReportResult.confidence ?? 0) * 100).toFixed(1)
                    }}%</span>
                  </div>
                  <div class="meter">
                    <div
                      class="meter-fill"
                      :style="{
                        width: `${Math.min(
                          100,
                          Math.max(0, (aiReportResult.confidence ?? 0) * 100),
                        )}%`,
                      }"
                    />
                  </div>
                </div>
              </div>
              <p class="report-reason">{{ aiReportResult.reason || '—' }}</p>
              <div v-if="summaryExtendedLines.length" class="detect-ext-block">
                <h4 class="detect-ext-title">增强检测项</h4>
                <dl class="detect-ext-dl">
                  <template v-for="row in summaryExtendedLines" :key="'sum-' + row.label">
                    <dt>{{ row.label }}</dt>
                    <dd>{{ row.value }}</dd>
                  </template>
                </dl>
              </div>
            </template>

            <div v-if="reportMultiDetailRows.length" class="multi-block">
              <h3 class="multi-heading">各区域明细</h3>
              <div class="multi-scroll">
                <ul class="multi-list">
                  <li v-for="row in reportMultiDetailRows" :key="row.regionNo">
                    <div class="multi-li-top">
                      <span class="region-idx">{{ row.regionNo }}号</span>
                      <span class="pill sm" :class="row.item.result || undefined">{{
                        row.item.result || '—'
                      }}</span>
                      <span class="multi-confidence"
                        >{{ ((row.item.confidence ?? 0) * 100).toFixed(1) }}%</span
                      >
                    </div>
                    <p class="multi-reason">{{ row.item.reason }}</p>
                    <dl
                      v-if="itemShowsExtended(row.item)"
                      class="detect-ext-dl compact"
                    >
                      <template
                        v-for="ext in extendedLinesForItem(row.item)"
                        :key="'m' + row.regionNo + ext.label"
                      >
                        <dt>{{ ext.label }}</dt>
                        <dd>{{ ext.value }}</dd>
                      </template>
                    </dl>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div
            v-if="ruleCheckLoading || ruleCheckError || ruleCheckPayload"
            class="rule-check-block"
            aria-labelledby="rule-check-heading"
          >
            <h3 id="rule-check-heading" class="rule-check-heading">
              {{ hasAiReport ? '辅助核查' : '规则检测' }}
            </h3>
            <p class="rule-check-desc">
              <template v-if="hasAiReport">
                从「是否被拼接贴图」「画面时间是否与单据一致」等角度做补充检查，结论供参考，不替代上方 AI 检测。
              </template>
              <template v-else>
                从「是否被拼接贴图」「画面时间是否与单据一致」等角度做规则核查，结论供参考。
              </template>
            </p>

            <p v-if="ruleCheckLoading" class="rule-check-status">辅助核查进行中，请稍候…</p>
            <p v-else-if="ruleCheckError" class="rule-check-error">{{ ruleCheckError }}</p>

            <template v-else-if="ruleCheckPayload && ruleCheckUserView">
              <div class="rule-check-summary">
                <span
                  class="pill sm"
                  :class="ruleCheckVerdictInfo.pillClass || undefined"
                  >{{ ruleCheckVerdictInfo.label }}</span
                >
                <p class="rule-check-reason">{{ ruleCheckUserView.summary }}</p>
              </div>

              <ul class="rule-check-findings">
                <li
                  v-for="(item, idx) in ruleCheckUserView.findings"
                  :key="idx"
                  class="rule-check-finding"
                  :class="'rule-check-finding--' + item.status"
                >
                  <span class="rule-check-finding-icon" aria-hidden="true">{{
                    item.status === 'ok' ? '✓' : item.status === 'warn' ? '!' : '×'
                  }}</span>
                  <div class="rule-check-finding-body">
                    <strong class="rule-check-finding-title">{{ item.title }}</strong>
                    <p class="rule-check-finding-text">{{ item.text }}</p>
                  </div>
                </li>
              </ul>

              <div v-if="ruleCheckUserView.timeFacts.length" class="rule-check-times">
                <p class="rule-check-times-title">画面中识别到的时间</p>
                <ul class="rule-check-times-list">
                  <li v-for="(t, ti) in ruleCheckUserView.timeFacts" :key="ti">
                    <span class="rule-check-times-label">{{ t.label }}</span>
                    <span class="rule-check-times-value">{{ t.value }}</span>
                  </li>
                </ul>
              </div>
            </template>
          </div>

          <div
            v-if="
              hasReportContent &&
              (vizLoading || vizObjectUrl || reportImageUrl || historySchematicSpec)
            "
            class="report-images"
          >
            <div v-if="viewingHistoryId && hasAiReport && vizLoading" class="history-viz-loading">
              正在加载标注示意图…
            </div>

            <div v-if="vizObjectUrl" class="viz-wrap">
              <h3 class="viz-heading">标注示意图</h3>
              <div class="viz-frame">
                <img
                  :src="vizObjectUrl"
                  alt="检测标注示意"
                  class="viz-img viz-img-zoomin"
                  @click="openPreviewLightbox(vizObjectUrl)"
                />
              </div>
            </div>

            <div v-else-if="reportImageUrl" class="viz-wrap">
              <h3 class="viz-heading">{{ reportImageHeading }}</h3>
              <div class="viz-frame">
                <img
                  :src="reportImageUrl"
                  alt="检测图片"
                  class="viz-img viz-img-zoomin"
                  @click="openPreviewLightbox(reportImageUrl)"
                />
              </div>
            </div>

            <div
              v-if="viewingHistoryId && historySchematicSpec"
              class="history-schematic-wrap history-schematic-wrap--report"
            >
              <p class="history-schematic-title">区域位置示意</p>
              <p class="history-schematic-note">
                服务端未保留原图或标注图时，仅根据检测坐标绘制框线（与接口像素坐标一致，非真实底图）。
              </p>
              <svg
                class="history-schematic-svg"
                :viewBox="historySchematicSpec.viewBox"
                preserveAspectRatio="xMidYMid meet"
              >
                <g v-for="item in historySchematicRenderList" :key="'hs' + item.n">
                  <rect
                    :x="item.bbox[0]"
                    :y="item.bbox[1]"
                    :width="item.bbox[2]"
                    :height="item.bbox[3]"
                    fill="rgba(37, 99, 235, 0.08)"
                    :stroke="regionStrokeForIndex(item.n)"
                    stroke-width="2"
                    :stroke-dasharray="regionDashForIndex(item.n)"
                  />
                  <circle
                    :cx="item.cx"
                    :cy="item.cy"
                    :r="item.r"
                    fill="#1d4ed8"
                    stroke="#fff"
                    stroke-width="1.5"
                  />
                  <text
                    :x="item.cx"
                    :y="item.cy"
                    text-anchor="middle"
                    dominant-baseline="central"
                    :font-size="item.fs * 0.88"
                    font-weight="700"
                    fill="#fff"
                    style="font-family: system-ui, -apple-system, sans-serif"
                  >
                    {{ item.n }}
                  </text>
                </g>
              </svg>
            </div>
          </div>

          <p v-if="vizHintMissing" class="viz-miss-hint">
            本条任务的标注图在服务端已过期或未生成；可结合下方检测图片与文字结论查看。
          </p>

          <p
            v-if="!hasReportContent && !errorMsg && !busy"
            class="empty-report"
          >
            完成检测后，将在此展示结论、说明与示意图。
          </p>
        </section>
      </main>
      </div>

      <aside class="history-aside" aria-label="历史记录">
        <section class="card side-section history-card">
          <div class="history-head">
            <h2 class="section-title history-title-merged">历史记录</h2>
            <button
              type="button"
              class="btn-text-refresh"
              :disabled="historyLoading"
              @click="refreshHistoryList"
            >
              {{ historyLoading ? '加载中…' : '刷新' }}
            </button>
          </div>
          <p class="history-api-hint">来自服务端近 7 日记录；同一次检测会合并，仅 AI 或仅规则也会单独展示</p>
          <p v-if="historyError" class="history-error">{{ historyError }}</p>
          <p
            v-if="!historyLoading && !historyEntries.length && !historyError"
            class="history-empty"
          >
            暂无记录。
          </p>
          <ul v-if="historyEntries.length" class="history-list" aria-label="检测历史列表">
            <li
              v-for="h in historyEntries"
              :key="h.id"
              class="history-row"
              :class="{ active: isHistoryRowActive(h) }"
            >
              <button
                type="button"
                class="history-main"
                @click="applyHistoryEntry(h)"
              >
                <span class="history-meta">
                  <span class="history-time">{{ formatHistoryTime(h.savedAt) }}</span>
                  <span v-if="historyKindLabel(h)" class="history-kind">{{
                    historyKindLabel(h)
                  }}</span>
                </span>
                <span class="history-file" :title="h.fileName">{{
                  truncateName(h.fileName)
                }}</span>
                <span class="pill sm history-pill" :class="historyPillClass(h)">{{
                  historyResultLabel(h)
                }}</span>
              </button>
            </li>
          </ul>
          <div v-if="historyTotal > 0" class="history-footer">
            <span class="history-count">
              共 {{ historyTotal }} 条，第 {{ historyPage }} /
              {{ historyTotalPages || 1 }} 页（每页最多 {{ HISTORY_PAGE_SIZE }} 条）
            </span>
            <div class="history-pager" role="navigation" aria-label="历史记录分页">
              <button
                type="button"
                class="btn-history-page"
                :disabled="historyLoading || !historyCanPrev"
                @click="goHistoryPage(historyPage - 1)"
              >
                上一页
              </button>
              <button
                type="button"
                class="btn-history-page"
                :disabled="historyLoading || !historyCanNext"
                @click="goHistoryPage(historyPage + 1)"
              >
                下一页
              </button>
            </div>
          </div>
        </section>
      </aside>
    </div>

    <Teleport to="body">
      <div
        v-if="previewLightboxOpen && previewLightboxSrc"
        class="preview-lightbox"
        role="dialog"
        aria-modal="true"
        aria-label="图片放大预览"
        @click.self="closePreviewLightbox"
      >
        <button
          type="button"
          class="preview-lightbox-close"
          aria-label="关闭"
          @click="closePreviewLightbox"
        >
          ×
        </button>
        <div ref="previewLightboxStageRef" class="preview-lightbox-stage">
          <img :src="previewLightboxSrc" alt="" class="preview-lightbox-img" />
        </div>
        <p class="preview-lightbox-hint">点击背景或 × 关闭，按 Esc 退出</p>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.shell {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.topbar {
  background: var(--surface);
  border-bottom: 1px solid var(--border);
  box-shadow: var(--shadow);
}

.topbar-inner {
  max-width: 1420px;
  margin: 0 auto;
  padding: 1.25rem 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.5rem;
  flex-wrap: wrap;
}

.brand {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
}

.brand-mark {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  background: linear-gradient(145deg, #1d4ed8, #0ea5e9);
  flex-shrink: 0;
  margin-top: 2px;
}

.brand-title {
  margin: 0;
  font-size: 1.35rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--text);
}

.brand-sub {
  margin: 0.2rem 0 0;
  font-size: 0.875rem;
  color: var(--text-muted);
  line-height: 1.45;
}

.main {
  flex: 1;
  max-width: 1420px;
  margin: 0 auto;
  width: 100%;
  padding: 1.5rem;
  display: grid;
  grid-template-columns: minmax(260px, 300px) minmax(0, 1fr) minmax(260px, 300px);
  gap: 1.25rem;
  align-items: start;
}

.workspace-wrap {
  min-width: 0;
}

.history-aside {
  min-width: 0;
}

.history-aside .history-card {
  position: sticky;
  top: 1.25rem;
}

@media (max-width: 1180px) {
  .main {
    grid-template-columns: minmax(260px, 300px) minmax(0, 1fr);
  }

  .history-aside {
    grid-column: 1 / -1;
    max-width: 720px;
    width: 100%;
    margin-left: auto;
    margin-right: auto;
  }

  .history-aside .history-card {
    position: static;
  }

  .history-list {
    max-height: min(220px, 38vh);
  }
}

@media (max-width: 960px) {
  .main {
    grid-template-columns: 1fr;
    max-width: 640px;
  }

  .history-aside {
    grid-column: auto;
    max-width: none;
  }
}

.sidebar {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
}

.side-section {
  padding: 1.25rem 1.35rem;
}

.section-title {
  margin: 0 0 1rem;
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--text-muted);
}

.section-title.tight {
  margin-bottom: 0.75rem;
}

.detect-type-hint {
  margin: -0.35rem 0 0.75rem;
  font-size: 0.78rem;
  color: var(--text-muted);
  line-height: 1.45;
}

.detect-type-list {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
}

.detect-type-item {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.95rem 1rem;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border);
  background: var(--surface-2);
  cursor: pointer;
  transition:
    border-color 0.15s,
    background 0.15s,
    box-shadow 0.15s;
}

.detect-type-item:has(.detect-type-input:checked) {
  border-color: var(--brand);
  background: #eff6ff;
  box-shadow: 0 0 0 1px var(--brand);
}

.detect-type-item:has(.detect-type-input:disabled) {
  cursor: not-allowed;
  opacity: 0.72;
}

.detect-type-input {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.detect-type-check {
  flex-shrink: 0;
  width: 1.1rem;
  height: 1.1rem;
  margin-top: 0.1rem;
  border-radius: 0.25rem;
  border: 2px solid #94a3b8;
  background: #fff;
  position: relative;
  transition:
    border-color 0.15s,
    background 0.15s;
}

.detect-type-input:checked + .detect-type-check {
  border-color: var(--brand);
  background: var(--brand);
}

.detect-type-input:checked + .detect-type-check::after {
  content: '';
  position: absolute;
  left: 0.28rem;
  top: 0.05rem;
  width: 0.28rem;
  height: 0.55rem;
  border: solid #fff;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}

.detect-type-body {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  min-width: 0;
}

.detect-type-title {
  font-weight: 600;
  font-size: 0.95rem;
  color: var(--text);
}

.detect-type-desc {
  font-size: 0.8rem;
  color: var(--text-muted);
  line-height: 1.45;
}

.drop-zone {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 140px;
  padding: 1rem;
  border: 2px dashed #cbd5e1;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition:
    border-color 0.15s,
    background 0.15s;
}

.drop-zone:hover,
.drop-zone.over {
  border-color: var(--brand);
  background: #f8fafc;
}

.drop-zone.hasFile {
  min-height: auto;
  align-items: flex-start;
  border-style: solid;
  border-color: var(--border);
  background: var(--surface-2);
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.dz-icon {
  font-size: 1.75rem;
  color: var(--brand);
  line-height: 1;
  margin-bottom: 0.35rem;
}

.dz-text {
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--text);
}

.dz-hint {
  font-size: 0.75rem;
  color: var(--text-muted);
  margin-top: 0.35rem;
}

.dz-name {
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--text);
  word-break: break-all;
  width: 100%;
}

.dz-change {
  font-size: 0.75rem;
  color: var(--brand);
  margin-top: 0.5rem;
}

.upload-select-row {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}

.upload-select-btn {
  width: 100%;
}

.upload-picked-summary {
  font-size: 0.74rem;
  line-height: 1.45;
  color: var(--text-muted);
}

.upload-picked-list {
  margin-top: 0.6rem;
  max-height: 120px;
  overflow: auto;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: #f8fafc;
  padding: 0.35rem;
  display: flex;
  flex-direction: column;
  gap: 0.28rem;
}

.upload-picked-item {
  border: 1px solid transparent;
  border-radius: 6px;
  background: #fff;
  color: var(--text);
  text-align: left;
  font-size: 0.75rem;
  padding: 0.28rem 0.45rem;
  line-height: 1.35;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  overflow: hidden;
}

.upload-picked-item-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.upload-picked-item-remove {
  flex-shrink: 0;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  line-height: 1;
  color: #64748b;
  background: transparent;
}

.upload-picked-item-remove:hover {
  color: #dc2626;
  background: #fee2e2;
}

.upload-picked-item:hover {
  border-color: #bfdbfe;
  background: #eff6ff;
}

.upload-picked-item.active {
  border-color: #93c5fd;
  background: #dbeafe;
  color: #1e40af;
}

.option-row {
  margin-top: 1rem;
}

.switch-label {
  display: flex;
  align-items: flex-start;
  gap: 0.6rem;
  cursor: pointer;
  font-size: 0.875rem;
  color: var(--text);
}

.switch-input {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
}

.switch-ui {
  width: 38px;
  height: 22px;
  border-radius: 11px;
  background: #e2e8f0;
  flex-shrink: 0;
  margin-top: 1px;
  position: relative;
  transition: background 0.15s;
}

.switch-ui::after {
  content: '';
  position: absolute;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #fff;
  top: 2px;
  left: 2px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.12);
  transition: transform 0.15s;
}

.switch-input:checked + .switch-ui {
  background: var(--brand);
}

.switch-input:checked + .switch-ui::after {
  transform: translateX(16px);
}

.switch-text {
  line-height: 1.4;
  font-weight: 500;
}

.option-hint {
  margin: 0.5rem 0 0 2.35rem;
  font-size: 0.78rem;
  color: var(--text-muted);
  line-height: 1.45;
}

.bbox-hint {
  margin-top: 1rem;
  padding: 0.75rem 0.85rem;
  background: var(--surface-2);
  border-radius: var(--radius-sm);
  font-size: 0.8rem;
  color: var(--text-secondary);
  line-height: 1.5;
}

.bbox-coords {
  margin: 0.5rem 0 0;
  font-family: ui-monospace, monospace;
  font-size: 0.75rem;
  color: var(--brand);
}

.actions-card {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.history-card {
  padding-bottom: 1rem;
}

.history-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  margin-bottom: 0.65rem;
}

.history-head .section-title {
  margin: 0;
}

.history-title-merged {
  margin-bottom: 0 !important;
}

.btn-text-refresh {
  padding: 0.2rem 0.5rem;
  font-size: 0.72rem;
  font-weight: 600;
  color: var(--brand);
  background: transparent;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-family: inherit;
}

.btn-text-refresh:hover:not(:disabled) {
  background: #eff6ff;
}

.btn-text-refresh:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.history-api-hint {
  margin: 0 0 0.5rem;
  font-size: 0.68rem;
  line-height: 1.4;
  color: var(--text-muted);
}

.history-error {
  margin: 0 0 0.5rem;
  padding: 0.45rem 0.5rem;
  font-size: 0.75rem;
  line-height: 1.4;
  color: #991b1b;
  background: #fef2f2;
  border-radius: var(--radius-sm);
  border: 1px solid #fecaca;
}

.history-empty {
  margin: 0;
  font-size: 0.78rem;
  line-height: 1.45;
  color: var(--text-muted);
}

.history-footer {
  margin-top: 0.65rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  align-items: stretch;
}

.history-pager {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.history-count {
  font-size: 0.68rem;
  color: var(--text-muted);
}

.btn-history-page {
  flex: 1;
  min-width: 0;
  padding: 0.4rem 0.5rem;
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--text-secondary);
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-family: inherit;
}

.btn-history-page:hover:not(:disabled) {
  border-color: var(--brand);
  color: var(--brand);
}

.btn-history-page:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.history-list {
  list-style: none;
  margin: 0;
  padding: 0;
  max-height: min(36vh, 280px);
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

@media (min-width: 1181px) {
  .history-aside .history-list {
    max-height: calc(100vh - 11.5rem);
  }
}

.history-row {
  display: flex;
  align-items: stretch;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border);
  background: var(--surface-2);
  overflow: hidden;
}

.history-row.active {
  border-color: var(--brand);
  box-shadow: 0 0 0 1px var(--brand);
}

.history-main {
  flex: 1;
  min-width: 0;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  gap: 0.28rem;
  padding: 0.52rem 0.5rem;
  min-height: 86px;
  line-height: 1.4;
  text-align: left;
  border: none;
  background: transparent;
  cursor: pointer;
  font: inherit;
}

.history-main:hover {
  background: #f8fafc;
}

.history-time {
  font-size: 0.68rem;
  line-height: 1.3;
  color: var(--text-muted);
  font-variant-numeric: tabular-nums;
}

.history-meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.35rem;
}

.history-kind {
  display: inline-block;
  font-size: 0.62rem;
  font-weight: 600;
  line-height: 1.2;
  padding: 0.1rem 0.38rem;
  border-radius: 999px;
  background: #e2e8f0;
  color: #475569;
  letter-spacing: 0.02em;
}

.history-file {
  display: block;
  font-size: 0.78rem;
  font-weight: 600;
  line-height: 1.35;
  padding-top: 1px;
  color: var(--text);
  width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.history-pill {
  align-self: flex-start;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.7rem 1.15rem;
  border-radius: var(--radius-sm);
  font-size: 0.95rem;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  border: none;
  transition:
    opacity 0.15s,
    background 0.15s;
}

.btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.btn-primary {
  background: var(--brand);
  color: #fff;
}

.btn-primary:hover:not(:disabled) {
  background: var(--brand-hover);
}

.btn-secondary {
  background: var(--surface);
  color: var(--text-secondary);
  border: 1px solid var(--border);
}

.btn-secondary:hover:not(:disabled) {
  background: var(--surface-2);
}

.btn-spinner {
  width: 1rem;
  height: 1rem;
  border: 2px solid rgba(255, 255, 255, 0.35);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.status-line {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
  color: var(--text-secondary);
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #22c55e;
}

.status-dot.pulse {
  animation: pulse 1.2s ease-in-out infinite;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.35;
  }
}

.alert {
  margin: 0;
  padding: 0.65rem 0.75rem;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: var(--radius-sm);
  color: #991b1b;
  font-size: 0.82rem;
  line-height: 1.45;
  white-space: pre-wrap;
}

.workspace {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  min-width: 0;
}

@media (min-width: 1040px) {
  .workspace {
    display: grid;
    grid-template-columns: minmax(260px, 1fr) minmax(300px, 1.1fr);
    gap: 1rem;
    align-items: start;
  }

  .workspace .workspace-card {
    min-width: 0;
  }
}

.workspace-card {
  padding: 1.25rem 1.35rem;
}

.workspace-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

.workspace-head .section-title {
  margin: 0;
}

.workspace-head-tags {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 0.35rem;
  align-items: center;
}

.workspace-tip {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--brand);
  background: #eff6ff;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
}

.workspace-tip-muted {
  color: #64748b;
  background: #f1f5f9;
}

.stage {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  max-width: 100%;
  border-radius: var(--radius-sm);
  overflow: hidden;
  background: #0f172a;
}

.preview-img {
  display: block;
  max-width: 100%;
  width: auto;
  height: auto;
  max-height: min(44vh, 420px);
  margin: 0 auto;
  object-fit: contain;
}

.preview-img-zoomin {
  cursor: zoom-in;
}

.btn-preview-zoom {
  padding: 0.28rem 0.65rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--brand);
  background: #fff;
  border: 1px solid #bfdbfe;
  border-radius: 6px;
  cursor: pointer;
  font-family: inherit;
  white-space: nowrap;
}

.btn-preview-zoom:hover {
  background: #eff6ff;
  border-color: var(--brand);
}

.overlay-svg {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.draw-layer {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  cursor: crosshair;
}

.empty-preview {
  min-height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--surface-2);
  border-radius: var(--radius-sm);
  color: var(--text-muted);
  font-size: 0.9rem;
}

.history-preview-placeholder {
  flex-direction: column;
  gap: 0.35rem;
  text-align: center;
  padding: 1.25rem 1rem;
}

.history-preview-hint {
  margin: 0;
  font-size: 0.78rem;
  line-height: 1.45;
  max-width: 300px;
  color: var(--text-muted);
}

.history-schematic-wrap {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  min-height: 200px;
  padding: 0.75rem 0.65rem 0.85rem;
  background: var(--surface-2);
  border-radius: var(--radius-sm);
}

.report-images {
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px dashed var(--border);
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.report-images .viz-wrap {
  margin-top: 0;
}

.history-schematic-wrap--report {
  margin-top: 0.75rem;
}

.history-viz-loading {
  margin: 0.5rem 0 0.75rem;
  font-size: 0.85rem;
  color: var(--text-muted);
}

.history-schematic-title {
  margin: 0;
  font-size: 0.82rem;
  font-weight: 700;
  color: var(--text-secondary);
}

.history-schematic-note {
  margin: 0;
  font-size: 0.72rem;
  line-height: 1.45;
  color: var(--text-muted);
}

.history-schematic-svg {
  width: 100%;
  max-height: min(48vh, 480px);
  min-height: 160px;
  background: #f8fafc;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border);
}

.results-card {
  flex: 1;
}

.report {
  padding: 0.25rem 0;
}

.report-head {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 0.75rem;
}

.pill {
  display: inline-block;
  padding: 0.35rem 0.75rem;
  border-radius: 999px;
  font-weight: 700;
  font-size: 0.875rem;
  background: #e2e8f0;
  color: #334155;
}

.pill.sm {
  font-size: 0.75rem;
  padding: 0.2rem 0.5rem;
}

.pill.正常 {
  background: #dcfce7;
  color: #166534;
}

.pill.可疑 {
  background: #ffedd5;
  color: #9a3412;
}

.pill.篡改 {
  background: #fee2e2;
  color: #991b1b;
}

.pill.错误 {
  background: #f1f5f9;
  color: #475569;
}

.pill.失败 {
  background: #fee2e2;
  color: #991b1b;
}

.meter-wrap {
  flex: 1;
  min-width: 160px;
}

.meter-label {
  display: flex;
  justify-content: space-between;
  font-size: 0.78rem;
  color: var(--text-muted);
  margin-bottom: 0.35rem;
}

.meter {
  height: 8px;
  border-radius: 4px;
  background: #e2e8f0;
  overflow: hidden;
}

.meter-fill {
  height: 100%;
  border-radius: 4px;
  background: linear-gradient(90deg, #0ea5e9, #1d4ed8);
  transition: width 0.35s ease;
}

.report-reason {
  margin: 0;
  font-size: 0.95rem;
  line-height: 1.6;
  color: var(--text);
}

.detect-ext-block {
  margin-top: 0.85rem;
  padding: 0.65rem 0.75rem;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border);
  background: var(--surface-2);
}

.detect-ext-title {
  margin: 0 0 0.5rem;
  font-size: 0.78rem;
  font-weight: 700;
  color: var(--text-secondary);
}

.detect-ext-dl {
  margin: 0;
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 0.35rem 0.75rem;
  font-size: 0.8rem;
  line-height: 1.45;
}

.detect-ext-dl dt {
  margin: 0;
  color: var(--text-muted);
  white-space: nowrap;
}

.detect-ext-dl dd {
  margin: 0;
  color: var(--text);
}

.detect-ext-dl.compact {
  margin-top: 0.35rem;
  font-size: 0.75rem;
}

.field-label {
  display: block;
  margin-bottom: 0.35rem;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-secondary);
}

.field-input {
  width: 100%;
  box-sizing: border-box;
  padding: 0.45rem 0.55rem;
  font-size: 0.85rem;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--surface);
  color: var(--text);
}

.field-input:disabled {
  opacity: 0.6;
}

.report-foot {
  margin: 0.75rem 0 0;
  font-size: 0.78rem;
  color: var(--text-muted);
  font-family: ui-monospace, monospace;
}

.report-foot.inline {
  display: block;
  margin-top: 0.25rem;
}

.multi-block {
  margin-top: 1rem;
  padding-top: 0.85rem;
  border-top: 1px solid var(--border);
}

.rule-check-block {
  margin-top: 1.15rem;
  padding-top: 1rem;
  border-top: 1px dashed var(--border);
}

.rule-check-heading {
  margin: 0 0 0.35rem;
  font-size: 0.88rem;
  font-weight: 700;
  color: var(--text-secondary);
}

.rule-check-desc {
  margin: 0 0 0.75rem;
  font-size: 0.72rem;
  line-height: 1.45;
  color: var(--text-muted);
}

.rule-check-status {
  margin: 0;
  font-size: 0.8rem;
  color: var(--brand);
}

.rule-check-error {
  margin: 0;
  font-size: 0.8rem;
  line-height: 1.45;
  color: #b45309;
  white-space: pre-wrap;
}

.rule-check-summary {
  margin-bottom: 0.75rem;
}

.rule-check-reason {
  margin: 0.5rem 0 0;
  font-size: 0.88rem;
  line-height: 1.55;
  color: var(--text);
}

.rule-check-findings {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
}

.rule-check-finding {
  display: flex;
  gap: 0.65rem;
  align-items: flex-start;
  padding: 0.65rem 0.75rem;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border);
  background: #fafbfc;
}

.rule-check-finding--ok {
  border-color: #bbf7d0;
  background: #f0fdf4;
}

.rule-check-finding--warn {
  border-color: #fed7aa;
  background: #fff7ed;
}

.rule-check-finding--bad {
  border-color: #fecaca;
  background: #fef2f2;
}

.rule-check-finding-icon {
  flex-shrink: 0;
  width: 1.35rem;
  height: 1.35rem;
  border-radius: 999px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 800;
  line-height: 1;
}

.rule-check-finding--ok .rule-check-finding-icon {
  background: #dcfce7;
  color: #166534;
}

.rule-check-finding--warn .rule-check-finding-icon {
  background: #ffedd5;
  color: #9a3412;
}

.rule-check-finding--bad .rule-check-finding-icon {
  background: #fee2e2;
  color: #991b1b;
}

.rule-check-finding-body {
  min-width: 0;
}

.rule-check-finding-title {
  display: block;
  font-size: 0.82rem;
  font-weight: 700;
  color: var(--text);
  margin-bottom: 0.2rem;
}

.rule-check-finding-text {
  margin: 0;
  font-size: 0.8rem;
  line-height: 1.5;
  color: var(--text-secondary);
}

.rule-check-times {
  margin-top: 0.75rem;
  padding: 0.65rem 0.75rem;
  border-radius: var(--radius-sm);
  background: #f8fafc;
  border: 1px solid #e2e8f0;
}

.rule-check-times-title {
  margin: 0 0 0.45rem;
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--text-secondary);
}

.rule-check-times-list {
  margin: 0;
  padding: 0;
  list-style: none;
}

.rule-check-times-list li {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem 0.75rem;
  padding: 0.28rem 0;
  font-size: 0.78rem;
  line-height: 1.45;
  border-bottom: 1px solid #eef2f7;
}

.rule-check-times-list li:last-child {
  border-bottom: none;
}

.rule-check-times-label {
  color: var(--text-muted);
  min-width: 7.5rem;
}

.rule-check-times-value {
  color: var(--text);
  font-weight: 600;
}

.multi-scroll {
  max-height: min(26vh, 220px);
  overflow-y: auto;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border);
  background: var(--surface-2);
  padding: 0 0.5rem;
}

.multi-heading {
  margin: 0 0 0.65rem;
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--text-secondary);
}

.multi-list {
  margin: 0;
  padding: 0;
  list-style: none;
}

.multi-list li {
  padding: 0.45rem 0;
  border-bottom: 1px solid #f1f5f9;
  font-size: 0.8rem;
  color: var(--text);
  line-height: 1.45;
}

.multi-list li:last-child {
  border-bottom: none;
}

.multi-li-top {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.4rem 0.5rem;
}

.region-idx {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 2.1rem;
  padding: 0.15rem 0.45rem;
  font-size: 0.72rem;
  font-weight: 800;
  color: #1e40af;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 6px;
  font-variant-numeric: tabular-nums;
}

.multi-confidence {
  margin-left: auto;
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--text-muted);
  font-variant-numeric: tabular-nums;
}

.multi-reason {
  margin: 0.35rem 0 0;
  font-size: 0.8rem;
  line-height: 1.5;
  color: var(--text-secondary);
}

.viz-miss-hint {
  margin: 0.75rem 0 0;
  padding: 0.55rem 0.65rem;
  font-size: 0.75rem;
  line-height: 1.45;
  color: var(--text-muted);
  background: #fffbeb;
  border: 1px solid #fde68a;
  border-radius: var(--radius-sm);
}

.viz-wrap {
  margin-top: 1rem;
  padding-top: 0.85rem;
  border-top: 1px solid var(--border);
}

.viz-frame {
  max-height: min(42vh, 380px);
  overflow: auto;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border);
  background: #f8fafc;
  text-align: center;
  line-height: 0;
}

.viz-heading {
  margin: 0 0 0.65rem;
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--text-secondary);
}

.viz-img {
  max-width: 100%;
  width: auto;
  height: auto;
  max-height: min(42vh, 380px);
  object-fit: contain;
  vertical-align: middle;
}

.viz-img-zoomin {
  cursor: zoom-in;
}

.empty-report {
  margin: 0;
  padding: 2rem 1rem;
  text-align: center;
  color: var(--text-muted);
  font-size: 0.9rem;
  line-height: 1.5;
}

.preview-lightbox {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: rgba(15, 23, 42, 0.92);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1rem 1.5rem;
  box-sizing: border-box;
}

.preview-lightbox-stage {
  max-width: 96vw;
  max-height: calc(100vh - 6rem);
  width: 96vw;
  height: calc(100vh - 6rem);
  overflow: auto;
  border-radius: 8px;
  display: block;
}

.preview-lightbox-img {
  max-width: none;
  max-height: none;
  width: min(160vw, 1600px);
  height: auto;
  display: block;
  margin: 0;
  object-fit: contain;
  border-radius: 8px;
  box-shadow: 0 12px 48px rgba(0, 0, 0, 0.45);
}

.preview-lightbox-close {
  position: fixed;
  top: 0.85rem;
  right: 1rem;
  width: 2.5rem;
  height: 2.5rem;
  border: none;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.12);
  color: #f8fafc;
  font-size: 1.75rem;
  line-height: 1;
  cursor: pointer;
  font-family: inherit;
}

.preview-lightbox-close:hover {
  background: rgba(255, 255, 255, 0.22);
}

.preview-lightbox-hint {
  margin: 0.85rem 0 0;
  font-size: 0.78rem;
  color: #94a3b8;
  text-align: center;
}
</style>
