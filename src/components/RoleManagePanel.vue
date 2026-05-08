<template>
  <div class="role-manage-panel">
    <div class="card shadow-sm border-0 rmp-card">
      <div class="card-header d-flex justify-content-between align-items-center flex-wrap gap-2 bg-white py-3">
        <span class="rmp-card-header-title">
          <i class="bi bi-list-ul card-header-icon me-2" aria-hidden="true"></i>
          角色列表
        </span>
        <div class="d-flex flex-wrap align-items-center gap-2">
          <input
            v-model.trim="keyword"
            type="text"
            class="form-control form-control-sm rmp-search-input"
            placeholder="角色名称"
            autocomplete="off"
            @keyup.enter="search"
          />
          <button type="button" class="btn btn-sm btn-outline-primary" :disabled="loading" @click="search">
            查询
          </button>
          <button type="button" class="btn btn-sm btn-outline-secondary" @click="openPermissionDefinitionsModal">
            <i class="bi bi-diagram-3 me-1" aria-hidden="true"></i>
            权限字段定义
          </button>
          <button type="button" class="btn btn-sm btn-primary" @click="openAddPermissionDef">
            <i class="bi bi-plus-lg me-1" aria-hidden="true"></i>
            新增权限
          </button>
        </div>
      </div>
      <div class="card-body p-0">
        <div class="table-responsive list-table-fit-screen">
          <table class="table table-striped table-hover table-sm mb-0 align-middle">
            <thead class="table-light">
              <tr>
                <th style="width: 56px">序号</th>
                <th>角色名称</th>
                <th>描述</th>
                <th>权限</th>
                <th style="width: 120px">操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="loading">
                <td colspan="5" class="text-center text-muted py-4">加载中…</td>
              </tr>
              <tr v-else-if="filteredList.length === 0">
                <td colspan="5" class="text-center text-muted py-4">暂无角色</td>
              </tr>
              <tr v-for="(r, idx) in filteredList" v-else :key="r.code">
                <td>{{ idx + 1 }}</td>
                <td>{{ r.name }}</td>
                <td class="text-muted small">{{ r.description || '—' }}</td>
                <td class="role-permission-summary" :title="getRolePermissionCellTitle(r) || undefined">
                  {{ getRolePermissionSummary(r) }}
                  <span v-if="showRolePermissionHoverHint(r)" class="text-muted small">（悬停看完整）</span>
                </td>
                <td class="text-nowrap">
                  <button type="button" class="btn btn-link btn-sm p-0 text-primary" @click="openAssignPermission(r)">
                    分配权限
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <div v-if="pageError" class="alert alert-warning mt-3 mb-0">{{ pageError }}</div>

    <!-- 分配权限 -->
    <Teleport to="body">
      <div
        v-if="assignVisible"
        class="modal modal-overlay-full d-block bg-dark bg-opacity-25"
        tabindex="-1"
        @click.self="assignVisible = false"
      >
        <div class="modal-dialog modal-dialog-centered modal-lg modal-dialog-scrollable">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">分配权限 — {{ assignRow?.name ?? assignRow?.code }}</h5>
              <button type="button" class="btn-close" aria-label="关闭" @click="assignVisible = false" />
            </div>
            <div class="modal-body d-flex gap-3 flex-wrap flex-lg-nowrap">
              <div class="flex-shrink-0 rmp-assign-sidebar">
                <div class="small text-muted mb-2">角色权限模板</div>
                <select v-model="selectedTemplateKey" class="form-select form-select-sm mb-2">
                  <option value="">— 选择模板 —</option>
                  <option v-for="t in templatesRows" :key="t.role" :value="t.role">{{ t.name }}（{{ t.role }}）</option>
                </select>
                <button
                  type="button"
                  class="btn btn-outline-primary btn-sm w-100"
                  :disabled="!selectedTemplateKey || templateApplyLoading"
                  @click="applyRoleTemplate"
                >
                  <span v-if="templateApplyLoading" class="spinner-border spinner-border-sm me-1" aria-hidden="true" />
                  应用此模板
                </button>
              </div>
              <div class="flex-grow-1 permission-tree-wrap">
                <div class="small text-muted mb-2">
                  勾选该角色可访问的模块与功能（仅打开弹窗会加载已有权限，不会保存；只有点击「确认」才会保存）
                </div>
                <div v-if="permissionTreeLoading" class="text-muted small">加载中…</div>
                <div v-else class="permission-tree">
                  <div v-for="group in permissionTree" :key="group.id" class="permission-group">
                    <label class="permission-group-title">
                      <input
                        type="checkbox"
                        class="form-check-input"
                        :checked="group.checked"
                        :indeterminate.prop="group.indeterminate"
                        @change="toggleGroup(group, $event)"
                      />
                      <span>{{ group.name }}</span>
                    </label>
                    <div class="permission-children">
                      <label v-for="item in group.children" :key="item.id" class="permission-item">
                        <input
                          v-model="item.checked"
                          type="checkbox"
                          class="form-check-input"
                          @change="syncGroupState(group)"
                        />
                        <span>{{ item.name }}</span>
                      </label>
                    </div>
                  </div>
                  <p v-if="!permissionTree.length" class="text-muted small mb-0">暂无权限定义，请先在「权限字段定义」中维护。</p>
                </div>
              </div>
            </div>
            <div class="modal-footer flex-wrap align-items-center gap-2">
              <div class="form-check me-auto mb-0">
                <input
                  id="apply-template-existing"
                  v-model="applyTemplateToExistingUsers"
                  class="form-check-input"
                  type="checkbox"
                />
                <label class="form-check-label small" for="apply-template-existing">
                  同步到该角色现有用户（apply_to_existing）
                </label>
              </div>
              <button type="button" class="btn btn-secondary" @click="assignVisible = false">取消</button>
              <button type="button" class="btn btn-primary" :disabled="assignLoading" @click="submitAssign">
                <span v-if="assignLoading" class="spinner-border spinner-border-sm me-1" aria-hidden="true" />
                确认
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- 权限字段定义 -->
    <Teleport to="body">
      <div
        v-if="permDefModalVisible"
        class="modal modal-overlay-full d-block bg-dark bg-opacity-25"
        tabindex="-1"
        @click.self="permDefModalVisible = false"
      >
        <div class="modal-dialog modal-dialog-centered modal-lg modal-dialog-scrollable">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title"><i class="bi bi-diagram-3 me-2" aria-hidden="true"></i>权限字段定义</h5>
              <button type="button" class="btn-close" aria-label="关闭" @click="permDefModalVisible = false" />
            </div>
            <div class="modal-body">
              <p class="text-muted small mb-3">
                「分配权限」弹窗中的勾选项由此处字段驱动；「新增权限」为 POST 新增定义；删除将调用后端 DELETE（会改库表并从角色模板移除）。
              </p>
              <div class="d-flex justify-content-end mb-2">
                <button type="button" class="btn btn-sm btn-outline-secondary" :disabled="permDefListLoading" @click="loadPermissionDefinitions">
                  <span v-if="permDefListLoading" class="spinner-border spinner-border-sm me-1" aria-hidden="true" />
                  刷新
                </button>
              </div>
              <div class="table-responsive rmp-defs-scroll">
                <table class="table table-sm table-striped table-hover mb-0">
                  <thead class="table-light sticky-top">
                    <tr>
                      <th>展示名称</th>
                      <th class="text-nowrap" style="width: 72px">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-if="permDefListLoading">
                      <td colspan="2" class="text-center text-muted py-3">加载中…</td>
                    </tr>
                    <tr v-else-if="permDefList.length === 0">
                      <td colspan="2" class="text-center text-muted py-3">暂无定义，可点击下方「新增权限」添加</td>
                    </tr>
                    <tr v-for="(row, idx) in permDefList" v-else :key="row.field_name ?? idx">
                      <td :title="row.field_name">{{ row.label ?? '—' }}</td>
                      <td class="text-nowrap">
                        <button type="button" class="btn btn-link btn-sm p-0 text-danger" @click="deletePermissionDefRow(row)">
                          删除
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            <div class="modal-footer flex-wrap gap-2">
              <button
                type="button"
                class="btn btn-outline-success btn-sm"
                :disabled="syncNavDefsLoading || permDefListLoading"
                title="按门户导航逐项 POST 注册，已存在的字段名或同名展示名将跳过"
                @click="syncNavMissingPermissionDefinitions"
              >
                <span v-if="syncNavDefsLoading" class="spinner-border spinner-border-sm me-1" aria-hidden="true" />
                补齐导航栏缺失定义
              </button>
              <button type="button" class="btn btn-outline-primary btn-sm" @click="openAddPermissionDefFromDefsModal">
                <i class="bi bi-plus-lg me-1" aria-hidden="true"></i>
                新增权限
              </button>
              <button type="button" class="btn btn-secondary btn-sm" @click="permDefModalVisible = false">关闭</button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- 新增权限 -->
    <Teleport to="body">
      <div
        v-if="permDefAddVisible"
        class="modal modal-overlay-full d-block bg-dark bg-opacity-25"
        tabindex="-1"
        style="z-index: 1060"
        @click.self="permDefAddVisible = false"
      >
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">新增权限</h5>
              <button type="button" class="btn-close" aria-label="关闭" @click="permDefAddVisible = false" />
            </div>
            <div class="modal-body">
              <p class="text-muted small mb-3">
                权限字段名将由系统自动生成（符合 <code>perm_[a-z][a-z0-9_]*</code>），无需填写。
              </p>
              <div class="mb-2">
                <label class="form-label"><span class="text-danger">*</span> 展示名称</label>
                <input
                  v-model="permDefAddForm.label"
                  type="text"
                  class="form-control form-control-sm"
                  placeholder="例如：查看合同"
                  autocomplete="off"
                />
              </div>
              <div v-if="permDefAddError" class="text-danger small mt-2">{{ permDefAddError }}</div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary btn-sm" @click="permDefAddVisible = false">取消</button>
              <button type="button" class="btn btn-primary btn-sm" :disabled="permDefAddLoading" @click="submitAddPermissionDef">
                <span v-if="permDefAddLoading" class="spinner-border spinner-border-sm me-1" aria-hidden="true" />
                确认新增
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import {
  deletePermissionDefinition,
  fetchPermissionDefinitions,
  fetchRoleList,
  fetchRolePermissionTemplates,
  postPermissionDefinition,
  putRolePermissionTemplate,
  type PermissionDefinition,
  type RoleListRowUi,
  type RoleTemplateRow,
} from '../api/permissionsApi'
import {
  NAV_CATEGORY_KEYS,
  NAV_CATEGORY_META,
  NAV_PERMISSION_SEED,
  categoryKeyFromFieldName,
  type NavCategoryKey,
} from '../data/navPermissionSeed'

type UiRoleRow = {
  code: string
  name: string
  description: string
  template: RoleTemplateRow | null
}

type TreeChild = { id: string; name: string; checked: boolean }
type TreeGroup = { id: string; name: string; checked: boolean; indeterminate: boolean; children: TreeChild[] }

const PRESET_ACCOUNT_ROLES: RoleListRowUi[] = [
  { code: 'admin', name: 'admin', description: '' },
  { code: 'manager', name: 'manager', description: '' },
  { code: 'user', name: 'user', description: '' },
]

/** 导航类 seed 展示名，模板接口未带 label 时兜底 */
const NAV_SEED_LABEL_BY_FIELD: Record<string, string> = Object.fromEntries(
  NAV_PERMISSION_SEED.map((s) => [s.field_name, s.label]),
)

const PERMISSION_SUMMARY_MAX = 3

const keyword = ref('')
const loading = ref(false)
const pageError = ref('')
const list = ref<UiRoleRow[]>([])
const templatesRows = ref<RoleTemplateRow[]>([])

const permDefModalVisible = ref(false)
const permDefListLoading = ref(false)
const permDefList = ref<PermissionDefinition[]>([])
const syncNavDefsLoading = ref(false)

const permDefAddVisible = ref(false)
const permDefAddLoading = ref(false)
const permDefAddError = ref('')
const permDefAddForm = ref({ label: '' })

const assignVisible = ref(false)
const assignRow = ref<UiRoleRow | null>(null)
const assignLoading = ref(false)
const applyTemplateToExistingUsers = ref(true)
const permissionTreeLoading = ref(false)
const permissionTree = ref<TreeGroup[]>([])
const selectedTemplateKey = ref('')
const templateApplyLoading = ref(false)

const definitionLabelMap = ref<Record<string, string>>({})
/** 最近一次「分配权限」打开时拉取的定义（用于 PUT body 补全键，避免覆盖权限定义弹窗列表） */
const lastAssignDefs = ref<PermissionDefinition[]>([])

const filteredList = computed(() => {
  const kw = keyword.value.trim().toLowerCase()
  if (!kw) return list.value
  return list.value.filter((r) => {
    const name = (r.name ?? r.code ?? '').toLowerCase()
    const desc = (r.description ?? '').toLowerCase()
    return name.includes(kw) || desc.includes(kw)
  })
})

function findTemplateForApiRole(r: RoleListRowUi, tmap: Map<string, RoleTemplateRow>, templates: RoleTemplateRow[]) {
  const code = (r.code ?? '').trim()
  const name = (r.name ?? '').trim()
  return (
    tmap.get(code) ??
    templates.find(
      (t) =>
        t.role === code ||
        t.name === code ||
        (name !== '' && (t.role === name || t.name === name)),
    ) ??
    null
  )
}

function mergeRoles(apiRoles: RoleListRowUi[], templates: RoleTemplateRow[]): UiRoleRow[] {
  const tmap = new Map(templates.map((t) => [t.role, t]))
  if (apiRoles.length > 0) {
    return apiRoles.map((r) => ({
      code: r.code,
      name: r.name,
      description: r.description || '—',
      template: findTemplateForApiRole(r, tmap, templates),
    }))
  }
  if (templates.length > 0) {
    return templates.map((t) => ({
      code: t.role,
      name: t.name,
      description: t.description || '—',
      template: t,
    }))
  }
  return PRESET_ACCOUNT_ROLES.map((p) => ({
    code: p.code,
    name: p.name,
    description: p.description || '—',
    template: findTemplateForApiRole(p, tmap, templates),
  }))
}

async function loadList() {
  loading.value = true
  pageError.value = ''
  try {
    const [apiRoles, templates, defs] = await Promise.all([
      fetchRoleList().catch(() => [] as RoleListRowUi[]),
      fetchRolePermissionTemplates().catch(() => [] as RoleTemplateRow[]),
      fetchPermissionDefinitions().catch(() => [] as PermissionDefinition[]),
    ])
    templatesRows.value = templates
    list.value = mergeRoles(apiRoles, templates)
    refreshDefinitionLabelsFromDefs(defs)
  } catch (e) {
    pageError.value = e instanceof Error ? e.message : String(e)
    list.value = mergeRoles([], [])
    templatesRows.value = []
  } finally {
    loading.value = false
  }
}

function search() {
  void loadList()
}

function normalizePermDefLabel(s: string): string {
  return String(s ?? '')
    .trim()
    .replace(/\s+/g, ' ')
}

function refreshDefinitionLabelsFromDefs(defs: PermissionDefinition[]) {
  const m: Record<string, string> = { ...definitionLabelMap.value }
  for (const d of defs) {
    if (d.field_name) m[d.field_name] = d.label || d.field_name
  }
  definitionLabelMap.value = m
}

function getRoleTemplate(row: UiRoleRow): RoleTemplateRow | null {
  return row.template
}

function getRolePermissionNames(row: UiRoleRow): string[] {
  const template = getRoleTemplate(row)
  if (!template?.permissions) return []
  const labels = template.permissionLabels ?? {}
  const names: string[] = []
  for (const [field, val] of Object.entries(template.permissions)) {
    if (val !== true) continue
    const label =
      labels[field] ??
      definitionLabelMap.value[field] ??
      NAV_SEED_LABEL_BY_FIELD[field] ??
      field
    names.push(label)
  }
  names.sort((a, b) => a.localeCompare(b, 'zh-CN'))
  return names
}

function getRolePermissionSummary(row: UiRoleRow): string {
  const names = getRolePermissionNames(row)
  if (names.length === 0) return '—'
  if (names.length <= PERMISSION_SUMMARY_MAX) return names.join('、')
  return `${names.slice(0, PERMISSION_SUMMARY_MAX).join('、')} 等${names.length} 项`
}

function getRolePermissionSummaryFull(row: UiRoleRow): string {
  const names = getRolePermissionNames(row)
  return names.length ? names.join('、') : '—'
}

function getRolePermissionTooltip(row: UiRoleRow): string | null {
  const short = getRolePermissionSummary(row)
  const full = getRolePermissionSummaryFull(row)
  if (!full || full === '—') return null
  if (full !== short) return `完整：${full}`
  if (getRolePermissionNames(row).length > PERMISSION_SUMMARY_MAX) return `完整：${full}`
  return null
}

/** 原生 title：悬停展示全部「已开启」权限名（与单元格摘要互补） */
function getRolePermissionCellTitle(row: UiRoleRow): string {
  const names = getRolePermissionNames(row)
  if (!names.length) return ''
  return `已开启（${names.length} 项）：${names.join('、')}`
}

function showRolePermissionHoverHint(row: UiRoleRow): boolean {
  if (getRolePermissionSummary(row) === '—') return false
  if (getRolePermissionTooltip(row) != null) return true
  return getRolePermissionNames(row).length > PERMISSION_SUMMARY_MAX
}

function buildPermissionTreeFromDefs(defs: PermissionDefinition[]): TreeGroup[] {
  const buckets = new Map<string, PermissionDefinition[]>()
  for (const d of defs) {
    const cat = categoryKeyFromFieldName(d.field_name)
    const key = cat === 'other' ? 'other' : cat
    if (!buckets.has(key)) buckets.set(key, [])
    buckets.get(key)!.push(d)
  }
  const order: Array<NavCategoryKey | 'other'> = [...NAV_CATEGORY_KEYS, 'other']
  const out: TreeGroup[] = []
  for (const k of order) {
    const leaves = buckets.get(k)
    if (!leaves?.length) continue
    leaves.sort((a, b) => a.label.localeCompare(b.label, 'zh-CN'))
    const title = k === 'other' ? '其他' : NAV_CATEGORY_META[k as NavCategoryKey]?.title ?? k
    out.push({
      id: k,
      name: title,
      checked: false,
      indeterminate: false,
      children: leaves.map((d) => ({ id: d.field_name, name: d.label, checked: false })),
    })
  }
  return out
}

function cloneTree(groups: TreeGroup[]): TreeGroup[] {
  return groups.map((g) => ({
    ...g,
    children: g.children.map((c) => ({ ...c })),
  }))
}

function syncGroupState(group: TreeGroup) {
  const ch = group.children
  const checkedCount = ch.filter((c) => c.checked).length
  group.checked = ch.length > 0 && checkedCount === ch.length
  group.indeterminate = checkedCount > 0 && checkedCount < ch.length
}

function toggleGroup(group: TreeGroup, evt: Event) {
  const input = evt.target as HTMLInputElement
  const v = input.checked
  group.children.forEach((c) => {
    c.checked = v
  })
  group.indeterminate = false
  group.checked = v
}

function applyPermissionsToTree(perms: Record<string, boolean> | undefined) {
  const p = perms ?? {}
  for (const g of permissionTree.value) {
    for (const c of g.children) {
      c.checked = !!p[c.id]
    }
    syncGroupState(g)
  }
}

function getPermissionTemplateBody(): Record<string, boolean> {
  const body: Record<string, boolean> = {}
  for (const g of permissionTree.value) {
    for (const c of g.children) {
      body[c.id] = !!c.checked
    }
  }
  for (const d of lastAssignDefs.value) {
    if (!(d.field_name in body)) body[d.field_name] = false
  }
  return body
}

async function openAssignPermission(row: UiRoleRow) {
  assignRow.value = row
  applyTemplateToExistingUsers.value = true
  assignVisible.value = true
  selectedTemplateKey.value = ''
  permissionTreeLoading.value = true
  permissionTree.value = []
  try {
    const defs = await fetchPermissionDefinitions().catch(() => [] as PermissionDefinition[])
    lastAssignDefs.value = defs
    refreshDefinitionLabelsFromDefs(defs)
    const built = buildPermissionTreeFromDefs(defs)
    permissionTree.value = built.length ? cloneTree(built) : []
    const tpl = row.template
    if (tpl?.permissions) applyPermissionsToTree(tpl.permissions)
    else applyPermissionsToTree({})
  } catch {
    permissionTree.value = []
  } finally {
    permissionTreeLoading.value = false
  }
}

function applyRoleTemplate() {
  const key = selectedTemplateKey.value
  const t = templatesRows.value.find((x) => x.role === key)
  if (!t) return
  templateApplyLoading.value = true
  try {
    applyPermissionsToTree(t.permissions)
  } finally {
    templateApplyLoading.value = false
  }
}

async function submitAssign() {
  const row = assignRow.value
  if (!row) return
  const roleCode = row.template?.role ?? row.code
  if (!roleCode) {
    alert('角色标识无效')
    return
  }
  if (!confirm('确定要保存该角色的权限吗？保存后将更新角色权限模板。')) return
  assignLoading.value = true
  try {
    await putRolePermissionTemplate(roleCode, {
      permissions: getPermissionTemplateBody(),
      apply_to_existing: applyTemplateToExistingUsers.value,
    })
    assignVisible.value = false
    await loadList()
    alert('角色权限模板已保存')
  } catch (e) {
    alert(e instanceof Error ? e.message : String(e))
  } finally {
    assignLoading.value = false
  }
}

function openPermissionDefinitionsModal() {
  permDefModalVisible.value = true
  void loadPermissionDefinitions()
}

function openAddPermissionDefFromDefsModal() {
  openAddPermissionDef()
}

async function loadPermissionDefinitions() {
  permDefListLoading.value = true
  try {
    permDefList.value = await fetchPermissionDefinitions()
    refreshDefinitionLabelsFromDefs(permDefList.value)
  } catch (e) {
    permDefList.value = []
    alert(e instanceof Error ? e.message : String(e))
  } finally {
    permDefListLoading.value = false
  }
}

async function syncNavMissingPermissionDefinitions() {
  if (
    !confirm(
      '将按门户导航为尚未注册的权限调用「新增权限定义」接口；已存在的字段名或同名展示名将跳过。是否继续？',
    )
  ) {
    return
  }
  syncNavDefsLoading.value = true
  let added = 0
  const errors: string[] = []
  try {
    const defs = await fetchPermissionDefinitions()
    const existingFields = new Set(defs.map((r) => String(r.field_name ?? '').trim()).filter(Boolean))
    const existingLabels = new Set(defs.map((r) => normalizePermDefLabel(r.label)).filter(Boolean))
    for (const def of NAV_PERMISSION_SEED) {
      const fn = String(def.field_name ?? '').trim()
      const label = normalizePermDefLabel(def.label)
      if (!fn || !label) continue
      if (existingFields.has(fn)) continue
      if (existingLabels.has(label)) continue
      try {
        await postPermissionDefinition({ field_name: fn, label })
        existingFields.add(fn)
        existingLabels.add(label)
        added++
      } catch (e) {
        errors.push(`${label}：${e instanceof Error ? e.message : String(e)}`)
      }
    }
    await loadPermissionDefinitions()
    await loadList()
    if (errors.length) {
      alert(`已新增 ${added} 条。部分失败：\n${errors.slice(0, 8).join('\n')}`)
    } else {
      alert(added ? `已补齐 ${added} 条导航相关权限定义` : '导航栏所需定义均已存在，无需新增')
    }
  } catch (e) {
    alert(e instanceof Error ? e.message : String(e))
  } finally {
    syncNavDefsLoading.value = false
  }
}

async function deletePermissionDefRow(row: PermissionDefinition) {
  const fn = (row.field_name ?? '').trim()
  if (!fn) return
  if (!confirm(`确定删除权限字段「${fn}」？后端将修改数据库并从所有角色模板移除该字段，请谨慎操作。`)) return
  try {
    await deletePermissionDefinition(fn)
    await loadPermissionDefinitions()
    await loadList()
    alert('已删除')
  } catch (e) {
    alert(e instanceof Error ? e.message : String(e))
  }
}

function randomFieldName(): string {
  const c = globalThis.crypto as Crypto | undefined
  if (c?.getRandomValues) {
    const a = new Uint8Array(10)
    c.getRandomValues(a)
    const hex = [...a].map((b) => b.toString(16).padStart(2, '0')).join('')
    return `perm_a${hex}`
  }
  const tail = `${Date.now()}_${Math.random().toString(36).slice(2, 14)}`.replace(/[^a-z0-9_]/g, '_')
  return `perm_a${tail}`
}

function openAddPermissionDef() {
  permDefAddForm.value = { label: '' }
  permDefAddError.value = ''
  permDefAddVisible.value = true
}

async function submitAddPermissionDef() {
  const label = permDefAddForm.value.label.trim()
  if (!label) {
    permDefAddError.value = '请填写展示名称'
    return
  }
  permDefAddLoading.value = true
  permDefAddError.value = ''
  try {
    await postPermissionDefinition({ field_name: randomFieldName(), label })
    permDefAddVisible.value = false
    await loadPermissionDefinitions()
    await loadList()
    alert('权限已新增')
  } catch (e) {
    permDefAddError.value = e instanceof Error ? e.message : String(e)
  } finally {
    permDefAddLoading.value = false
  }
}

onMounted(() => {
  void loadList()
  void fetchPermissionDefinitions()
    .then((defs) => {
      permDefList.value = defs
      refreshDefinitionLabelsFromDefs(defs)
    })
    .catch(() => {})
})
</script>

<style scoped>
.role-manage-panel {
  min-height: 200px;
}

.rmp-card .card-header {
  border-bottom: 1px solid #e9ecef;
}

.rmp-card-header-title {
  font-weight: 600;
  font-size: 15px;
  color: #0f172a;
}

.card-header-icon {
  color: #0d9488;
}

.rmp-search-input {
  width: 160px;
  max-width: 100%;
}

.list-table-fit-screen {
  max-height: min(520px, calc(100vh - 280px));
  overflow: auto;
}

.modal-overlay-full {
  position: fixed;
  inset: 0;
  z-index: 1055;
  overflow-y: auto;
}

.permission-tree-wrap {
  max-height: min(420px, 55vh);
  overflow-y: auto;
  min-width: 0;
}

.rmp-assign-sidebar {
  width: 200px;
  max-width: 100%;
}

.permission-group {
  margin-bottom: 12px;
}

.permission-group-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  margin-bottom: 6px;
  cursor: pointer;
}

.permission-children {
  padding-left: 24px;
}

.permission-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 0;
  cursor: pointer;
  font-weight: normal;
}

.role-permission-summary {
  max-width: 280px;
  font-size: 0.8125rem;
  line-height: 1.35;
}

.rmp-defs-scroll {
  max-height: 55vh;
  overflow: auto;
  border: 1px solid #e9ecef;
  border-radius: 8px;
}
</style>
