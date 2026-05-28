import { getToken } from './authApi'
import { fetchJson } from './userApi'

type FastApiValidationItem = { loc?: unknown; msg?: unknown }

function readMsg(data: unknown): string {
  if (!data || typeof data !== 'object') return ''
  const o = data as Record<string, unknown>
  if (typeof o.message === 'string') return o.message
  if (typeof o.detail === 'string') return o.detail
  if (Array.isArray(o.detail)) {
    const lines = (o.detail as FastApiValidationItem[])
      .map((it) => {
        const msg = typeof it?.msg === 'string' ? it.msg : ''
        const loc =
          Array.isArray(it?.loc) && it.loc.length
            ? String(it.loc[it.loc.length - 1] ?? '')
            : ''
        if (!msg) return ''
        return loc ? `${loc}：${msg}` : msg
      })
      .filter((x) => x !== '')
    if (lines.length) return lines.join('；')
  }
  return ''
}

function authHeaders(): HeadersInit {
  const token = getToken()
  if (!token) return {}
  return { Authorization: `Bearer ${token}` }
}

function unwrapData(data: unknown): unknown {
  if (data != null && typeof data === 'object' && !Array.isArray(data) && 'data' in data) {
    return (data as { data: unknown }).data
  }
  return data
}

function assertBizOk(raw: unknown, ctx: string): void {
  if (raw == null || typeof raw !== 'object' || Array.isArray(raw)) return
  const code = (raw as { code?: unknown }).code
  if (code === undefined || code === null) return
  const n = Number(code)
  if (!Number.isFinite(n) || n === 200 || n === 0) return
  const msg =
    typeof (raw as { message?: unknown }).message === 'string'
      ? String((raw as { message: string }).message)
      : `code ${n}`
  throw new Error(`${ctx}：${msg}`)
}

function firstStr(o: Record<string, unknown>, keys: string[]): string {
  for (const k of keys) {
    const v = o[k]
    if (typeof v === 'string' && v.trim() !== '') return v.trim()
  }
  return ''
}

export type PermissionDefinition = {
  field_name: string
  label: string
}

export type RoleTemplateRow = {
  /** PUT /auth/permissions/roles/{role}/template 路径参数 */
  role: string
  name: string
  description: string
  permissions: Record<string, boolean>
  /** GET templates 若返回 permissions_with_labels / 行内 label，用于列表「权限」列展示 */
  permissionLabels?: Record<string, string>
}

export type MePermissionsDetail = Record<string, unknown>

/** GET /auth/permissions/me — 当前用户权限详情 */
export async function fetchMyPermissionsDetail(): Promise<MePermissionsDetail> {
  const { res, data } = await fetchJson('/auth/permissions/me', {
    method: 'GET',
    headers: { ...authHeaders() },
  })
  if (!res.ok) throw new Error(readMsg(data) || `获取当前用户权限失败（HTTP ${res.status}）`)
  assertBizOk(data, '当前用户权限')
  const inner = unwrapData(data)
  if (inner != null && typeof inner === 'object' && !Array.isArray(inner)) {
    return inner as MePermissionsDetail
  }
  return {}
}

/** GET /auth/permissions/roles/templates — 所有角色权限模板 */
export async function fetchRolePermissionTemplates(): Promise<RoleTemplateRow[]> {
  const { res, data } = await fetchJson('/auth/permissions/roles/templates', {
    method: 'GET',
    headers: { ...authHeaders() },
  })
  if (!res.ok) throw new Error(readMsg(data) || `获取角色模板失败（HTTP ${res.status}）`)
  assertBizOk(data, '角色模板')
  return normalizeRoleTemplates(unwrapData(data))
}

function normalizeRoleTemplates(raw: unknown): RoleTemplateRow[] {
  const d = raw
  if (d == null) return []
  if (Array.isArray(d)) {
    const out: RoleTemplateRow[] = []
    for (const item of d) {
      if (!item || typeof item !== 'object') continue
      const row = templateFromObject(item as Record<string, unknown>)
      if (row) out.push(row)
    }
    return out.sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'))
  }
  if (typeof d !== 'object') return []
  const o = d as Record<string, unknown>
  if (Array.isArray(o.roles)) return normalizeRoleTemplates(o.roles)
  if (Array.isArray(o.items)) return normalizeRoleTemplates(o.items)
  if (Array.isArray(o.list)) return normalizeRoleTemplates(o.list)
  const out: RoleTemplateRow[] = []
  for (const [key, val] of Object.entries(o)) {
    if (['code', 'message', 'detail', 'total'].includes(key)) continue
    if (val != null && typeof val === 'object' && !Array.isArray(val)) {
      const row = templateFromObject(val as Record<string, unknown>, key)
      if (row) out.push(row)
    }
  }
  return out.sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'))
}

/** 后端可能返回 true / 1 / "true" / { value: true } 等表示已授权 */
export function isPermissionGranted(value: unknown): boolean {
  if (value === true || value === 1) return true
  if (typeof value === 'string') {
    const s = value.trim().toLowerCase()
    if (s === 'true' || s === '1' || s === 'yes') return true
  }
  if (value && typeof value === 'object' && !Array.isArray(value) && 'value' in value) {
    return isPermissionGranted((value as { value?: unknown }).value)
  }
  return false
}

/** 从 GET /auth/permissions/me 等详情解析已开启的 field_name（与角色模板解析规则一致） */
export function collectGrantedFieldNames(detail: Record<string, unknown>): Set<string> {
  const { permissions } = parseTemplatePermissions(detail)
  const granted = new Set<string>()
  for (const [k, v] of Object.entries(permissions)) {
    if (v === true || isPermissionGranted(v)) granted.add(k)
  }
  for (const [k, v] of Object.entries(detail)) {
    if (PERM_FIELD_RE.test(k) && isPermissionGranted(v)) granted.add(k)
  }
  collectPermFieldsDeep(detail, granted)
  return granted
}

function mergePermissionsWithLabels(
  permissions: Record<string, boolean>,
  permissionLabels: Record<string, string>,
  pwl: unknown,
): void {
  if (!pwl || typeof pwl !== 'object' || Array.isArray(pwl)) return
  for (const [k, v] of Object.entries(pwl as Record<string, unknown>)) {
    if (!k) continue
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      const vo = v as Record<string, unknown>
      if ('value' in vo) permissions[k] = isPermissionGranted(vo.value)
      const lab = String(vo.label ?? '').trim()
      if (lab) permissionLabels[k] = lab
    }
  }
}

/**
 * 支持：扁平 Record<string, boolean>；数组 [{ field|field_name, label?, value }]；
 * 以及 permissions_with_labels: { key: { value, label } }（与 /auth/permissions/me 类似）。
 */
function parseTemplatePermissions(obj: Record<string, unknown>): {
  permissions: Record<string, boolean>
  permissionLabels: Record<string, string>
} {
  const permissions: Record<string, boolean> = {}
  const permissionLabels: Record<string, string> = {}
  const permsSrc = obj.permissions ?? obj.permission_map ?? obj.permissionMap

  if (Array.isArray(permsSrc)) {
    for (const item of permsSrc) {
      if (typeof item === 'string') {
        const field = item.trim()
        if (field.startsWith('perm_')) permissions[field] = true
        continue
      }
      if (!item || typeof item !== 'object' || Array.isArray(item)) continue
      const o = item as Record<string, unknown>
      const field = String(o.field ?? o.field_name ?? o.key ?? '').trim()
      if (!field) continue
      permissions[field] = isPermissionGranted(o.value ?? o.granted ?? o.enabled)
      const lab = String(o.label ?? o.name ?? o.title ?? '').trim()
      if (lab) permissionLabels[field] = lab
    }
  } else if (permsSrc && typeof permsSrc === 'object') {
    for (const [k, v] of Object.entries(permsSrc as Record<string, unknown>)) {
      if (typeof v === 'boolean') {
        permissions[k] = v
      } else if (v && typeof v === 'object' && !Array.isArray(v)) {
        const vo = v as Record<string, unknown>
        if ('value' in vo) {
          permissions[k] = isPermissionGranted(vo.value)
          const lab = String(vo.label ?? '').trim()
          if (lab) permissionLabels[k] = lab
        } else {
          permissions[k] = isPermissionGranted(v)
        }
      } else {
        permissions[k] = isPermissionGranted(v)
      }
    }
  }

  mergePermissionsWithLabels(permissions, permissionLabels, obj.permissions_with_labels)

  const extraKeys = [
    'granted_permissions',
    'enabled_permissions',
    'granted',
    'enabled',
    'permission_codes',
  ] as const
  for (const key of extraKeys) {
    const arr = obj[key]
    if (!Array.isArray(arr)) continue
    for (const item of arr) {
      if (typeof item === 'string' && item.trim().startsWith('perm_')) {
        permissions[item.trim()] = true
      }
    }
  }

  return { permissions, permissionLabels }
}

const PERM_FIELD_RE = /^perm_/

/** 深度扫描响应体中所有 perm_* 字段（兼容嵌套分组） */
function collectPermFieldsDeep(node: unknown, granted: Set<string>, depth = 0): void {
  if (depth > 10 || node == null) return
  if (Array.isArray(node)) {
    for (const item of node) {
      if (typeof item === 'string' && PERM_FIELD_RE.test(item.trim())) {
        granted.add(item.trim())
        continue
      }
      collectPermFieldsDeep(item, granted, depth + 1)
    }
    return
  }
  if (typeof node !== 'object') return
  for (const [k, v] of Object.entries(node as Record<string, unknown>)) {
    if (PERM_FIELD_RE.test(k) && isPermissionGranted(v)) {
      granted.add(k)
      continue
    }
    if (v && typeof v === 'object') collectPermFieldsDeep(v, granted, depth + 1)
  }
}

function templateFromObject(obj: Record<string, unknown>, fallbackRole?: string): RoleTemplateRow | null {
  const { permissions, permissionLabels } = parseTemplatePermissions(obj)
  const role =
    firstStr(obj, ['role', 'role_key', 'roleKey', 'id', 'code']) || (fallbackRole ? String(fallbackRole) : '')
  if (!role) return null
  const name = firstStr(obj, ['role_name', 'name', 'label', 'title', 'display_name']) || role
  const description = firstStr(obj, ['description', 'desc', 'remark', 'summary']) || ''
  const row: RoleTemplateRow = { role, name, description, permissions }
  if (Object.keys(permissionLabels).length > 0) row.permissionLabels = permissionLabels
  return row
}

export type RoleListRowUi = {
  code: string
  name: string
  description: string
}

function extractObjectArray(raw: unknown): Record<string, unknown>[] {
  if (Array.isArray(raw)) {
    return raw.filter((x): x is Record<string, unknown> => !!x && typeof x === 'object')
  }
  if (!raw || typeof raw !== 'object') return []
  const o = raw as Record<string, unknown>
  const inner = unwrapData(raw)
  if (Array.isArray(inner)) return extractObjectArray(inner)
  const arr = o.items ?? o.list ?? o.roles ?? o.results ?? o.records
  if (Array.isArray(arr)) return extractObjectArray(arr)
  return []
}

/**
 * 可选：独立角色列表（若后端提供）。失败则返回空数组，由前端用模板列表兜底。
 */
export async function fetchRoleList(): Promise<RoleListRowUi[]> {
  const paths = ['/auth/roles', '/auth/role/list', '/auth/user/roles']
  let lastErr = ''
  for (const path of paths) {
    try {
      const { res, data } = await fetchJson(path, {
        method: 'GET',
        headers: { ...authHeaders() },
      })
      if (!res.ok) {
        lastErr = readMsg(data) || `HTTP ${res.status}`
        continue
      }
      try {
        assertBizOk(data, '角色列表')
      } catch {
        /* 部分接口无 code 字段 */
      }
      const rows = extractObjectArray(unwrapData(data) ?? data)
      const out: RoleListRowUi[] = []
      for (const r of rows) {
        const code = String(
          r.code ?? r.role_code ?? r.role ?? r.id ?? r.role_id ?? '',
        ).trim()
        if (!code) continue
        const name = String(r.name ?? r.role_name ?? r.title ?? code).trim() || code
        const description = String(r.description ?? r.desc ?? r.summary ?? '').trim()
        out.push({ code, name, description })
      }
      if (out.length) return out
    } catch (e) {
      lastErr = e instanceof Error ? e.message : String(e)
    }
  }
  if (lastErr) console.warn('[permissions] fetchRoleList:', lastErr)
  return []
}

/** PUT /auth/permissions/roles/{role}/template */
export async function putRolePermissionTemplate(
  role: string,
  body: { permissions: Record<string, boolean>; apply_to_existing: boolean },
): Promise<void> {
  const path = `/auth/permissions/roles/${encodeURIComponent(role)}/template`
  const { res, data } = await fetchJson(path, {
    method: 'PUT',
    headers: {
      ...authHeaders(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(readMsg(data) || `更新角色权限失败（HTTP ${res.status}）`)
  assertBizOk(data, '更新角色权限')
}

/** GET /auth/permissions — 用户权限分页（可选备用） */
export async function fetchPermissionsPage(params: {
  page?: number
  size?: number
  role?: string
  keyword?: string
}): Promise<{ rows: Record<string, unknown>[]; total: number }> {
  const q = new URLSearchParams()
  q.set('page', String(params.page != null && params.page > 0 ? params.page : 1))
  q.set('size', String(params.size != null && params.size > 0 ? params.size : 20))
  if (params.role) q.set('role', params.role)
  if (params.keyword) q.set('keyword', params.keyword)

  const { res, data } = await fetchJson(`/auth/permissions?${q.toString()}`, {
    method: 'GET',
    headers: { ...authHeaders() },
  })
  if (!res.ok) throw new Error(readMsg(data) || `获取权限列表失败（HTTP ${res.status}）`)
  assertBizOk(data, '权限列表')

  const inner = (unwrapData(data) || {}) as Record<string, unknown>
  const listRaw = inner.items ?? inner.list ?? inner.records ?? inner.rows
  const list = Array.isArray(listRaw)
    ? listRaw.filter((x): x is Record<string, unknown> => !!x && typeof x === 'object')
    : []
  const total =
    typeof inner.total === 'number'
      ? inner.total
      : typeof inner.count === 'number'
        ? inner.count
        : list.length

  return { rows: list, total }
}

/** GET /auth/permission/definitions（失败时尝试复数路径，避免网关路由差异） */
export async function fetchPermissionDefinitions(): Promise<PermissionDefinition[]> {
  const paths = ['/auth/permission/definitions', '/auth/permissions/definitions']
  let last = ''
  for (const path of paths) {
    const { res, data } = await fetchJson(path, {
      method: 'GET',
      headers: { ...authHeaders() },
    })
    if (!res.ok) {
      last = readMsg(data) || `HTTP ${res.status}`
      continue
    }
    try {
      assertBizOk(data, '权限定义')
    } catch (e) {
      last = e instanceof Error ? e.message : String(e)
      continue
    }
    return normalizeDefinitions(unwrapData(data))
  }
  if (last) console.warn('[permissions] GET definitions:', last)
  return []
}

function normalizeDefinitions(raw: unknown): PermissionDefinition[] {
  const d = raw
  if (d == null) return []
  if (Array.isArray(d)) {
    const out: PermissionDefinition[] = []
    for (const x of d) {
      if (typeof x === 'string' && x.trim()) {
        out.push({ field_name: x.trim(), label: x.trim() })
        continue
      }
      if (x && typeof x === 'object' && !Array.isArray(x)) {
        const o = x as Record<string, unknown>
        const fn = String(o.field_name ?? o.key ?? o.id ?? '').trim()
        if (!fn) continue
        const lab = String(o.label ?? o.name ?? o.title ?? fn).trim() || fn
        out.push({ field_name: fn, label: lab })
      }
    }
    return out.sort((a, b) => a.label.localeCompare(b.label, 'zh-CN'))
  }
  if (typeof d === 'object' && d !== null) {
    const o = d as Record<string, unknown>
    if (Array.isArray(o.items)) return normalizeDefinitions(o.items)
    if (Array.isArray(o.list)) return normalizeDefinitions(o.list)
  }
  return []
}

/** POST /auth/permission/definitions */
export async function postPermissionDefinition(body: {
  field_name: string
  label: string
}): Promise<void> {
  const { res, data } = await fetchJson('/auth/permission/definitions', {
    method: 'POST',
    headers: {
      ...authHeaders(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(readMsg(data) || `新增权限字段失败（HTTP ${res.status}）`)
  assertBizOk(data, '新增权限字段')
}

/** DELETE /auth/permission/definitions/{field_name} */
export async function deletePermissionDefinition(fieldName: string): Promise<void> {
  const path = `/auth/permission/definitions/${encodeURIComponent(fieldName)}`
  const { res, data } = await fetchJson(path, {
    method: 'DELETE',
    headers: { ...authHeaders() },
  })
  if (!res.ok) throw new Error(readMsg(data) || `删除权限字段失败（HTTP ${res.status}）`)
  assertBizOk(data, '删除权限字段')
}
