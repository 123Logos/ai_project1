<template>
  <div class="wdc-page">
    <div class="wdc-head">
      <h2>库房距离监测配置</h2>
      <p>
        单向绑定：源库房 → 目标库房。相同源库房合并展示；修改、删除时在弹窗中选择绑定的库房后确认。
      </p>
    </div>

    <section class="wdc-card">
      <div class="wdc-toolbar">
        <div class="wdc-filters">
          <div class="wdc-filter-field">
            <label for="wdc-filter-from">源库房</label>
            <select id="wdc-filter-from" v-model.number="filterFromId" class="wdc-select">
              <option :value="0">全部</option>
              <option v-for="w in warehouseOptions" :key="`ff-${w.id}`" :value="w.id">
                {{ w.name }}（{{ w.id }}）
              </option>
            </select>
          </div>
          <div class="wdc-filter-field">
            <label for="wdc-filter-to">对标库房</label>
            <select id="wdc-filter-to" v-model.number="filterToId" class="wdc-select">
              <option :value="0">全部</option>
              <option v-for="w in warehouseOptions" :key="`ft-${w.id}`" :value="w.id">
                {{ w.name }}（{{ w.id }}）
              </option>
            </select>
          </div>
          <button type="button" class="btn btn-outline-secondary" :disabled="busy" @click="applyFilters">
            筛选
          </button>
        </div>
        <div class="wdc-actions">
          <button type="button" class="btn btn-outline-primary" :disabled="busy" @click="openAddDialog">新增绑定</button>
          <button type="button" class="btn btn-outline-secondary" :disabled="busy" @click="refreshList">
            刷新列表
          </button>
        </div>
      </div>

      <p v-if="message" class="wdc-msg">{{ message }}</p>
      <p v-if="error" class="wdc-err">{{ error }}</p>

      <div class="wdc-table-wrap">
        <table class="wdc-table">
          <thead>
            <tr>
              <th>源库房</th>
              <th>对标库房</th>
              <th>库房距离</th>
              <th class="wdc-col-actions">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="listRows.length === 0">
              <td colspan="4">暂无数据</td>
            </tr>
            <template v-for="grp in groupedTableRows" :key="`grp-${grp.rows[0]?.fromId ?? 0}`">
              <tr v-for="(r, idx) in grp.rows" :key="`edge-${r.fromId}-${r.toId}`">
                <td v-if="idx === 0" class="wdc-td-source" :rowspan="grp.rows.length">
                  {{ r.fromName }}（{{ r.fromId }}）
                </td>
                <td>{{ r.toName }}（{{ r.toId }}）</td>
                <td class="wdc-td-distance">{{ distanceCellText(r) }}</td>
                <td v-if="idx === 0" class="wdc-td-ops wdc-col-actions" :rowspan="grp.rows.length">
                  <div class="wdc-ops-merge">
                    <div class="wdc-ops-buttons-row">
                      <button
                        type="button"
                        class="btn btn-sm btn-outline-success"
                        :disabled="busy"
                        @click="openAddDialogFromRow(grp.rows[0])"
                      >
                        新增绑定
                      </button>
                      <button
                        type="button"
                        class="btn btn-sm btn-outline-primary"
                        :disabled="busy || grp.rows.length === 0"
                        @click="openEditModalFromGroup(grp)"
                      >
                        修改
                      </button>
                      <button
                        type="button"
                        class="btn btn-sm btn-outline-danger"
                        :disabled="busy || grp.rows.length === 0"
                        @click="openDeleteModalFromGroup(grp)"
                      >
                        删除
                      </button>
                    </div>
                  </div>
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>

      <div class="wdc-pager">
        <button type="button" class="btn btn-sm btn-outline-secondary" :disabled="listPage <= 1 || busy" @click="gotoPage(listPage - 1)">
          上一页
        </button>
        <span>第 {{ listPage }} / {{ listTotalPages }} 页（共 {{ listTotal }} 条）</span>
        <button
          type="button"
          class="btn btn-sm btn-outline-secondary"
          :disabled="listPage >= listTotalPages || busy"
          @click="gotoPage(listPage + 1)"
        >
          下一页
        </button>
      </div>
    </section>

    <div v-if="dialogOpen" class="wdc-modal-overlay" role="dialog" aria-modal="true" @click.self="closeDialog">
      <div class="wdc-modal">
        <h3 class="wdc-modal-title">{{ dialogTitle }}</h3>
        <div v-if="dialogMode === 'add'" class="wdc-modal-body">
          <div class="wdc-row">
            <label for="wdc-dlg-from">源库房</label>
            <select id="wdc-dlg-from" v-model.number="dialogFromId" class="wdc-select">
              <option :value="0">请选择源库房</option>
              <option v-for="w in warehouseOptions" :key="`df-${w.id}`" :value="w.id">{{ w.name }}（{{ w.id }}）</option>
            </select>
          </div>
          <div class="wdc-row">
            <label>绑定的库房（目标，可多选）</label>
            <div class="wdc-modal-chips">
              <label v-for="w in dialogTargetOptions" :key="`add-b-${w.id}`" class="wdc-chip">
                <input v-model="dialogAddTargetIds" type="checkbox" :value="w.id" />
                <span>{{ w.name }}（{{ w.id }}）</span>
              </label>
            </div>
            <p v-if="addSelectedCount" class="wdc-hint">已选 {{ addSelectedCount }} 个目标库房</p>
          </div>
        </div>
        <div v-else-if="dialogMode === 'edit'" class="wdc-modal-body">
          <div v-if="dialogEditGroup?.rows.length" class="wdc-row">
            <label for="wdc-dlg-pick-target">选择绑定的库房</label>
            <select
              id="wdc-dlg-pick-target"
              class="wdc-select"
              :value="editingRow?.toId ?? 0"
              @change="onModalPickTargetChange($event)"
            >
              <option v-for="br in dialogEditGroup.rows" :key="`pick-${br.fromId}-${br.toId}`" :value="br.toId">
                {{ br.toName }}（{{ br.toId }}）
              </option>
            </select>
          </div>
          <p class="wdc-modal-readonly">
            <span class="wdc-muted">源库房：</span>{{ editingRow?.fromName }}（{{ editingRow?.fromId }}）
          </p>
          <p class="wdc-modal-readonly">
            <span class="wdc-muted">当前绑定：</span>{{ editingRow?.toName }}（{{ editingRow?.toId }}）
          </p>
          <div class="wdc-row">
            <label for="wdc-dlg-edit-to">修改为绑定库房</label>
            <select id="wdc-dlg-edit-to" v-model.number="dialogToId" class="wdc-select">
              <option v-for="w in dialogEditTargetOptions" :key="`de-${w.id}`" :value="w.id">{{ w.name }}（{{ w.id }}）</option>
            </select>
          </div>
        </div>
        <div v-else-if="dialogMode === 'delete'" class="wdc-modal-body">
          <p class="wdc-modal-readonly">
            <span class="wdc-muted">源库房：</span>{{ editingRow?.fromName }}（{{ editingRow?.fromId }}）
          </p>
          <div v-if="dialogEditGroup?.rows.length" class="wdc-row">
            <label for="wdc-dlg-pick-del">选择绑定的库房</label>
            <select
              id="wdc-dlg-pick-del"
              class="wdc-select"
              :value="editingRow?.toId ?? 0"
              @change="onModalPickTargetChange($event)"
            >
              <option v-for="br in dialogEditGroup.rows" :key="`del-${br.fromId}-${br.toId}`" :value="br.toId">
                {{ br.toName }}（{{ br.toId }}）
              </option>
            </select>
          </div>
          <p class="wdc-hint">将删除从上述源库房到所选目标库房的绑定关系。</p>
        </div>
        <div class="wdc-modal-footer">
          <button type="button" class="btn btn-outline-secondary" :disabled="busy" @click="closeDialog">取消</button>
          <button
            v-if="dialogMode !== 'delete'"
            type="button"
            class="btn btn-primary"
            :disabled="busy || !dialogValid"
            @click="submitDialog"
          >
            确定
          </button>
          <button
            v-else
            type="button"
            class="btn btn-danger"
            :disabled="busy || !dialogValidDelete"
            @click="submitDialog"
          >
            确定删除
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import {
  deleteTlUnbindWarehouseLink,
  fetchTlCalculateDistance,
  fetchTlWarehouseLinksList,
  fetchTlWarehousesAll,
  postTlBatchBindWarehouseLinks,
  postTlBindWarehouseLink,
} from '../api/tlApi'

type WarehouseOption = { id: number; name: string }
type LinkRow = { fromId: number; toId: number; fromName: string; toName: string }

/** 同一源库房的多条出边，用于合并首列与末列 */
type LinkRowGroup = { rows: LinkRow[] }

const warehouseOptions = ref<WarehouseOption[]>([])
/** 库房 id → WGS84 经纬度（与电子地图解析字段一致，供距离接口使用） */
const warehouseCoordById = ref<Record<number, { lat: number; lng: number }>>({})
const distanceTextByEdgeKey = ref<Record<string, string>>({})
const distanceStatus = ref<'idle' | 'loading' | 'done'>('idle')

const filterFromId = ref(0)
const filterToId = ref(0)

const listRows = ref<LinkRow[]>([])
const listPage = ref(1)
const listSize = ref(50)
const listTotal = ref(0)
const listTotalPages = computed(() => Math.max(1, Math.ceil(listTotal.value / listSize.value)))

const groupedTableRows = computed((): LinkRowGroup[] => {
  const rows = [...listRows.value].sort((a, b) => {
    if (a.fromId !== b.fromId) return a.fromId - b.fromId
    const byName = String(a.toName).localeCompare(String(b.toName), 'zh-CN')
    if (byName !== 0) return byName
    return a.toId - b.toId
  })
  const groups: LinkRowGroup[] = []
  let i = 0
  while (i < rows.length) {
    const fromId = rows[i].fromId
    let j = i + 1
    while (j < rows.length && rows[j].fromId === fromId) j++
    groups.push({ rows: rows.slice(i, j) })
    i = j
  }
  return groups
})

const busy = ref(false)
const message = ref('')
const error = ref('')

const dialogOpen = ref(false)
const dialogMode = ref<'add' | 'edit' | 'delete'>('add')
const dialogFromId = ref(0)
const dialogToId = ref(0)
const dialogAddTargetIds = ref<number[]>([])
const editingRow = ref<LinkRow | null>(null)
/** 从表格「修改/删除」打开弹窗时，携带该源库房下的绑定行列表 */
const dialogEditGroup = ref<LinkRowGroup | null>(null)

/** 合并操作列：每个源库房选中的「要修改/删除」的目标库房 id（打开弹窗时沿用） */
const opTargetToIdByFromId = ref<Record<number, number>>({})

const dialogTitle = computed(() => {
  if (dialogMode.value === 'add') return '新增绑定'
  if (dialogMode.value === 'edit') return '修改绑定'
  return '删除绑定'
})

function getSelectedToIdForGroup(grp: LinkRowGroup): number {
  const fromId = grp.rows[0]?.fromId ?? 0
  if (!fromId || !grp.rows.length) return 0
  const stored = opTargetToIdByFromId.value[fromId]
  if (stored != null && grp.rows.some((r) => r.toId === stored)) return stored
  return grp.rows[0].toId
}

function pickRowByGroupSelection(grp: LinkRowGroup): LinkRow | null {
  if (!grp.rows.length) return null
  const toId = getSelectedToIdForGroup(grp)
  return grp.rows.find((r) => r.toId === toId) ?? grp.rows[0] ?? null
}

const addSelectedCount = computed(() => {
  const src = dialogFromId.value
  return new Set(dialogAddTargetIds.value.filter((id) => id > 0 && id !== src)).size
})

watch(
  () => dialogFromId.value,
  (id) => {
    if (dialogMode.value !== 'add') return
    dialogAddTargetIds.value = dialogAddTargetIds.value.filter((tid) => tid !== id)
  },
)

const dialogTargetOptions = computed(() =>
  warehouseOptions.value.filter((w) => w.id !== dialogFromId.value),
)

const dialogEditTargetOptions = computed(() => {
  const fromId = editingRow.value?.fromId ?? 0
  return warehouseOptions.value.filter((w) => w.id !== fromId)
})

const dialogValid = computed(() => {
  if (dialogMode.value === 'add') {
    return dialogFromId.value > 0 && addSelectedCount.value > 0
  }
  if (dialogMode.value === 'edit') {
    if (!editingRow.value) return false
    return dialogToId.value > 0 && dialogToId.value !== editingRow.value.fromId
  }
  return false
})

const dialogValidDelete = computed(
  () => !!editingRow.value && !!(dialogEditGroup.value && dialogEditGroup.value.rows.length),
)

function onModalGroupTargetChange(toId: number) {
  const grp = dialogEditGroup.value
  if (!grp) return
  const row = grp.rows.find((r) => r.toId === toId)
  if (!row) return
  editingRow.value = row
  dialogFromId.value = row.fromId
  dialogToId.value = row.toId
  opTargetToIdByFromId.value = { ...opTargetToIdByFromId.value, [row.fromId]: toId }
}

function onModalPickTargetChange(e: Event) {
  const t = Number((e.target as HTMLSelectElement).value)
  if (!Number.isFinite(t)) return
  onModalGroupTargetChange(t)
}

function openEditModalFromGroup(grp: LinkRowGroup) {
  if (!grp.rows.length) return
  const row = pickRowByGroupSelection(grp)
  if (!row) return
  dialogEditGroup.value = grp
  dialogMode.value = 'edit'
  editingRow.value = row
  dialogFromId.value = row.fromId
  dialogToId.value = row.toId
  dialogOpen.value = true
}

function openDeleteModalFromGroup(grp: LinkRowGroup) {
  if (!grp.rows.length) return
  const row = pickRowByGroupSelection(grp)
  if (!row) return
  dialogEditGroup.value = grp
  dialogMode.value = 'delete'
  editingRow.value = row
  dialogOpen.value = true
}

function pickNum(row: Record<string, unknown>, keys: string[]): number {
  for (const k of keys) {
    const v = row[k]
    if (typeof v === 'number' && Number.isFinite(v)) return v
    if (typeof v === 'string' && v.trim() !== '') {
      const n = Number(v)
      if (Number.isFinite(n)) return n
    }
  }
  return 0
}

function pickStr(row: Record<string, unknown>, keys: string[]): string {
  for (const k of keys) {
    const v = row[k]
    if (v == null) continue
    const s = String(v).trim()
    if (s) return s
  }
  return ''
}

function warehouseNameById(id: number): string {
  return warehouseOptions.value.find((w) => w.id === id)?.name || `库房#${id}`
}

function pickWarehouseCoord(row: Record<string, unknown>): { lat: number; lng: number } | null {
  const latKeys = ['latitude', 'lat', 'gcj02_lat', 'Latitude', 'LAT', 'y', '纬度']
  const lngKeys = ['longitude', 'lng', 'lon', 'gcj02_lng', 'Longitude', 'LNG', 'x', '经度']
  let lat: number | null = null
  let lng: number | null = null
  for (const k of latKeys) {
    const v = row[k]
    if (typeof v === 'number' && Number.isFinite(v)) {
      lat = v
      break
    }
    if (typeof v === 'string' && v.trim() !== '') {
      const n = Number(v)
      if (Number.isFinite(n)) {
        lat = n
        break
      }
    }
  }
  for (const k of lngKeys) {
    const v = row[k]
    if (typeof v === 'number' && Number.isFinite(v)) {
      lng = v
      break
    }
    if (typeof v === 'string' && v.trim() !== '') {
      const n = Number(v)
      if (Number.isFinite(n)) {
        lng = n
        break
      }
    }
  }
  if (lat == null || lng == null) return null
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null
  return { lat, lng }
}

function edgeKey(r: LinkRow): string {
  return `${r.fromId}-${r.toId}`
}

function distanceCellText(r: LinkRow): string {
  if (distanceStatus.value === 'loading') return '…'
  return distanceTextByEdgeKey.value[edgeKey(r)] ?? '—'
}

async function loadDistancesForRows(rows: LinkRow[]) {
  if (!rows.length) {
    distanceTextByEdgeKey.value = {}
    distanceStatus.value = 'idle'
    return
  }
  distanceStatus.value = 'loading'
  const coords = warehouseCoordById.value
  const next: Record<string, string> = {}
  await Promise.all(
    rows.map(async (r) => {
      const key = edgeKey(r)
      const a = coords[r.fromId]
      const b = coords[r.toId]
      if (!a || !b) {
        next[key] = '缺坐标'
        return
      }
      try {
        const d = await fetchTlCalculateDistance(a.lng, a.lat, b.lng, b.lat, {
          fromWarehouseId: r.fromId,
          toWarehouseId: r.toId,
        })
        next[key] = `${d.distanceKm.toFixed(2)} km`
      } catch {
        next[key] = '计算失败'
      }
    }),
  )
  distanceTextByEdgeKey.value = next
  distanceStatus.value = 'done'
}

function toLinkRow(row: Record<string, unknown>): LinkRow {
  const fromId = pickNum(row, [
    'from_warehouse_id',
    '源库房id',
    '源仓库id',
    'source_warehouse_id',
    'from_id',
  ])
  const toId = pickNum(row, [
    'to_warehouse_id',
    '目标库房id',
    '目标仓库id',
    'target_warehouse_id',
    'to_id',
    'target_id',
  ])
  const fromName =
    pickStr(row, ['from_warehouse_name', '源库房名', 'source_warehouse_name']) || warehouseNameById(fromId)
  const toName =
    pickStr(row, ['to_warehouse_name', '目标库房名', 'target_warehouse_name']) || warehouseNameById(toId)
  return { fromId, toId, fromName, toName }
}

async function loadWarehouses() {
  const rows = await fetchTlWarehousesAll()
  const coordMap: Record<number, { lat: number; lng: number }> = {}
  warehouseOptions.value = rows
    .map((r) => {
      const id = pickNum(r, ['仓库id', '库房id', 'warehouse_id', 'id'])
      const name = pickStr(r, ['仓库名', 'warehouse_name', 'name']) || `库房#${id}`
      const c = pickWarehouseCoord(r)
      if (id > 0 && c) coordMap[id] = c
      return { id, name }
    })
    .filter((x) => x.id > 0)
    .sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'))
  warehouseCoordById.value = coordMap
}

async function fetchListPage(page: number) {
  const r = await fetchTlWarehouseLinksList({
    page,
    size: listSize.value,
    from_warehouse_id: filterFromId.value > 0 ? filterFromId.value : undefined,
    to_warehouse_id: filterToId.value > 0 ? filterToId.value : undefined,
  })
  listRows.value = r.rows.map(toLinkRow)
  listTotal.value = r.total
  listPage.value = page
  await loadDistancesForRows(listRows.value)
}

async function runAction(fn: () => Promise<void>, okText: string) {
  busy.value = true
  error.value = ''
  message.value = ''
  try {
    await fn()
    if (okText) message.value = okText
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e)
  } finally {
    busy.value = false
  }
}

function applyFilters() {
  runAction(async () => {
    await fetchListPage(1)
  }, '')
}

function refreshList() {
  runAction(async () => {
    await fetchListPage(listPage.value)
  }, '')
}

async function gotoPage(page: number) {
  if (page < 1 || page > listTotalPages.value) return
  await runAction(async () => {
    await fetchListPage(page)
  }, '')
}

function openAddDialog() {
  dialogMode.value = 'add'
  dialogEditGroup.value = null
  editingRow.value = null
  dialogFromId.value = 0
  dialogToId.value = 0
  dialogAddTargetIds.value = []
  dialogOpen.value = true
}

/** 以当前行的源库房为 A，打开新增绑定（多选目标） */
function openAddDialogFromRow(r: LinkRow) {
  dialogEditGroup.value = null
  dialogMode.value = 'add'
  editingRow.value = null
  dialogFromId.value = r.fromId
  dialogToId.value = 0
  dialogAddTargetIds.value = []
  dialogOpen.value = true
}

function closeDialog() {
  if (busy.value) return
  dialogOpen.value = false
  editingRow.value = null
  dialogEditGroup.value = null
  dialogAddTargetIds.value = []
}

async function submitDialog() {
  if (dialogMode.value === 'delete') {
    if (!dialogValidDelete.value || !editingRow.value) return
    const row = editingRow.value
    await runAction(async () => {
      await deleteTlUnbindWarehouseLink(row.fromId, row.toId)
      await fetchListPage(listPage.value)
    }, '已删除绑定')
    if (!error.value) closeDialog()
    return
  }
  if (!dialogValid.value) return
  if (dialogMode.value === 'add') {
    const src = dialogFromId.value
    const targetIds = [...new Set(dialogAddTargetIds.value)].filter((id) => id > 0 && id !== src)
    if (!targetIds.length) return
    await runAction(async () => {
      await postTlBatchBindWarehouseLinks(src, targetIds)
      await fetchListPage(1)
    }, `新增绑定成功（${targetIds.length} 条）`)
    if (!error.value) closeDialog()
    return
  }
  const row = editingRow.value
  if (!row) return
  const newTo = dialogToId.value
  if (newTo === row.toId) {
    closeDialog()
    return
  }
  await runAction(async () => {
    await deleteTlUnbindWarehouseLink(row.fromId, row.toId)
    await postTlBindWarehouseLink(row.fromId, newTo)
    await fetchListPage(listPage.value)
  }, '修改绑定成功')
  if (!error.value) closeDialog()
}

onMounted(async () => {
  await runAction(async () => {
    await loadWarehouses()
    await fetchListPage(1)
  }, '')
  message.value = ''
})
</script>

<style scoped>
.wdc-page {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.wdc-head h2 {
  margin: 0;
  font-size: 22px;
  color: #111827;
}

.wdc-head p {
  margin: 6px 0 0;
  color: #64748b;
  font-size: 13px;
}

.wdc-card {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 14px;
}

.wdc-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.wdc-filters {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 10px;
}

.wdc-filter-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 220px;
}

.wdc-filter-field label {
  font-size: 12px;
  font-weight: 600;
  color: #334155;
}

.wdc-select {
  height: 38px;
  border-radius: 8px;
  border: 1px solid #d1d5db;
  padding: 0 10px;
  background: #fff;
  font-size: 13px;
}

.wdc-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.wdc-msg {
  margin: 0 0 8px;
  color: #0f766e;
  font-size: 13px;
}

.wdc-err {
  margin: 0 0 8px;
  color: #b91c1c;
  font-size: 13px;
  white-space: pre-wrap;
}

.wdc-table-wrap {
  overflow-x: auto;
}

.wdc-table {
  width: 100%;
  border-collapse: collapse;
}

.wdc-table th,
.wdc-table td {
  border: 1px solid #e5e7eb;
  padding: 8px 10px;
  font-size: 13px;
  text-align: left;
  vertical-align: middle;
}

.wdc-td-source {
  vertical-align: middle;
  background: #f8fafc;
  font-weight: 600;
  color: #1e293b;
}

.wdc-td-distance {
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
  color: #334155;
}

.wdc-td-ops {
  vertical-align: top;
  background: #fafafa;
}

.wdc-ops-merge {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-width: 200px;
}

.wdc-ops-buttons-row {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
}

.wdc-col-actions {
  white-space: normal;
}

.wdc-col-actions .btn {
  margin-right: 6px;
}

.wdc-col-actions .btn:last-child {
  margin-right: 0;
}

.wdc-pager {
  margin-top: 12px;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  font-size: 13px;
  color: #475569;
}

.wdc-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 16px;
}

.wdc-modal {
  background: #fff;
  border-radius: 12px;
  max-width: 560px;
  width: 100%;
  padding: 18px 20px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.12);
}

.wdc-modal-title {
  margin: 0 0 14px;
  font-size: 17px;
  color: #111827;
}

.wdc-modal-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.wdc-modal-readonly {
  margin: 0;
  font-size: 13px;
  color: #1e293b;
  line-height: 1.5;
}

.wdc-muted {
  color: #64748b;
}

.wdc-row {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.wdc-row label {
  font-size: 13px;
  font-weight: 600;
  color: #334155;
}

.wdc-modal-footer {
  margin-top: 18px;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.wdc-modal-chips {
  max-height: 220px;
  overflow: auto;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 8px;
  display: flex;
  flex-wrap: wrap;
  gap: 6px 8px;
}

.wdc-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  padding: 2px 6px;
  border: 1px solid #e5e7eb;
  border-radius: 999px;
  background: #f8fafc;
  cursor: pointer;
}

.wdc-hint {
  margin: 0;
  font-size: 12px;
  color: #64748b;
}
</style>
