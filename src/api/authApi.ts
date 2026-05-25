import { fetchJson } from './userApi'

export type UserRow = {
  id: number
  username: string
  real_name: string
  role: string
  phone?: string
  email?: string
  is_active?: boolean
}

type ApiResp<T> = {
  code?: number
  message?: string
  detail?: string
  data?: T
}

type FastApiValidationItem = {
  loc?: unknown
  msg?: unknown
}

const TOKEN_KEY = 'api_token'
const SESSION_USERNAME_KEY = 'auth_session_username'
const SESSION_ROLE_KEY = 'auth_session_role'
const SESSION_USER_ID_KEY = 'auth_session_user_id'

function pickUserIdFromRecord(o: Record<string, unknown> | null | undefined): number | null {
  if (!o || typeof o !== 'object') return null
  const nested =
    o.user && typeof o.user === 'object' && !Array.isArray(o.user)
      ? (o.user as Record<string, unknown>)
      : null
  for (const key of ['id', 'user_id', 'userId', 'uid']) {
    const v = o[key] ?? nested?.[key]
    if (typeof v === 'number' && Number.isFinite(v) && v > 0) return Math.trunc(v)
    if (typeof v === 'string' && v.trim() !== '') {
      const n = Number(v.trim())
      if (Number.isFinite(n) && n > 0) return Math.trunc(n)
    }
  }
  return null
}

function tryDecodeJwtPayload(token: string): Record<string, unknown> | null {
  const parts = token.split('.')
  if (parts.length !== 3) return null
  try {
    const seg = parts[1]!
    const base64 = seg.replace(/-/g, '+').replace(/_/g, '/')
    const pad = base64.length % 4 === 0 ? '' : '='.repeat(4 - (base64.length % 4))
    const json = atob(base64 + pad)
    return JSON.parse(json) as Record<string, unknown>
  } catch {
    return null
  }
}

function firstNonEmptyString(...vals: unknown[]): string {
  for (const v of vals) {
    if (typeof v === 'string' && v.trim() !== '') return v.trim()
  }
  return ''
}

function pickRoleFromRecord(o: Record<string, unknown> | null | undefined): string {
  if (!o || typeof o !== 'object') return ''
  const nested =
    o.user && typeof o.user === 'object' && !Array.isArray(o.user)
      ? (o.user as Record<string, unknown>)
      : null
  const rolesArr = o.roles
  const r0 =
    Array.isArray(rolesArr) && rolesArr.length && typeof rolesArr[0] === 'string' ? rolesArr[0] : ''
  return firstNonEmptyString(o.role, o.user_role, nested?.role, r0)
}

let sessionBackfilled = false

function backfillSessionFromToken(): void {
  if (sessionBackfilled || typeof localStorage === 'undefined') return
  sessionBackfilled = true
  const token = localStorage.getItem(TOKEN_KEY) || ''
  if (!token) return
  const p = tryDecodeJwtPayload(token)
  if (!p) return
  if (!localStorage.getItem(SESSION_USERNAME_KEY)) {
    const u = firstNonEmptyString(p.sub, p.username, p.preferred_username, p.name)
    if (u) localStorage.setItem(SESSION_USERNAME_KEY, u)
  }
  if (!localStorage.getItem(SESSION_ROLE_KEY)) {
    const r = firstNonEmptyString(p.role, p.user_role)
    if (r) localStorage.setItem(SESSION_ROLE_KEY, r)
  }
  if (!localStorage.getItem(SESSION_USER_ID_KEY)) {
    const uid = pickUserIdFromRecord(p as Record<string, unknown>)
    if (uid != null) localStorage.setItem(SESSION_USER_ID_KEY, String(uid))
  }
}

function setSessionProfile(username: string, role: string, userId?: number | null) {
  if (typeof localStorage === 'undefined') return
  localStorage.setItem(SESSION_USERNAME_KEY, username.trim())
  localStorage.setItem(SESSION_ROLE_KEY, role.trim())
  if (userId != null && Number.isFinite(userId) && userId > 0) {
    localStorage.setItem(SESSION_USER_ID_KEY, String(Math.trunc(userId)))
  } else {
    localStorage.removeItem(SESSION_USER_ID_KEY)
  }
}

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

export function getToken(): string {
  if (typeof localStorage === 'undefined') return ''
  return localStorage.getItem(TOKEN_KEY) || ''
}

export function setToken(token: string) {
  if (typeof localStorage === 'undefined') return
  localStorage.setItem(TOKEN_KEY, token)
}

/** 当前登录用户名（登录时写入；旧会话可从 JWT sub/username 补全） */
export function getSessionUsername(): string {
  backfillSessionFromToken()
  if (typeof localStorage === 'undefined') return ''
  return localStorage.getItem(SESSION_USERNAME_KEY) || ''
}

/** 当前登录角色（如 admin / user）；未知时为空字符串，按非普通用户处理 */
export function getSessionRole(): string {
  backfillSessionFromToken()
  if (typeof localStorage === 'undefined') return ''
  return localStorage.getItem(SESSION_ROLE_KEY) || ''
}

/** 是否为「普通用户」——仅此类账号在用户管理页受限 */
export function isRegularUserSession(): boolean {
  return getSessionRole() === 'user'
}

/** 当前登录用户数字 id（登录 / JWT 补全）；改密码等接口依赖 */
export function getSessionUserId(): number | null {
  backfillSessionFromToken()
  if (typeof localStorage === 'undefined') return null
  const s = localStorage.getItem(SESSION_USER_ID_KEY)
  if (!s) return null
  const n = Number(s)
  return Number.isFinite(n) && n > 0 ? Math.trunc(n) : null
}

export function clearToken() {
  if (typeof localStorage === 'undefined') return
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(SESSION_USERNAME_KEY)
  localStorage.removeItem(SESSION_ROLE_KEY)
  localStorage.removeItem(SESSION_USER_ID_KEY)
  sessionBackfilled = false
}

export async function login(username: string, password: string): Promise<string> {
  const { res, data } = await fetchJson('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  })
  if (!res.ok) throw new Error(readMsg(data) || `登录失败（HTTP ${res.status}）`)

  const obj = (data || {}) as Record<string, unknown>
  const token =
    (typeof obj.access_token === 'string' && obj.access_token) ||
    (typeof obj.token === 'string' && obj.token) ||
    (obj.data && typeof obj.data === 'object'
      ? ((obj.data as Record<string, unknown>).access_token as string) ||
        ((obj.data as Record<string, unknown>).token as string)
      : '') ||
    ''
  if (!token) throw new Error('登录成功但未返回 token')
  sessionBackfilled = false
  setToken(token)
  localStorage.setItem('token', token)
  const dataInner =
    obj.data && typeof obj.data === 'object' && !Array.isArray(obj.data)
      ? (obj.data as Record<string, unknown>)
      : null
  let role = pickRoleFromRecord(obj) || pickRoleFromRecord(dataInner)
  let userId = pickUserIdFromRecord(obj) ?? pickUserIdFromRecord(dataInner)
  const jpEarly = tryDecodeJwtPayload(token)
  if (!role && jpEarly) role = firstNonEmptyString(jpEarly.role, jpEarly.user_role)
  if (userId == null && jpEarly) userId = pickUserIdFromRecord(jpEarly as Record<string, unknown>)
  setSessionProfile(username, role, userId)
  sessionBackfilled = false
  backfillSessionFromToken()
  return token
}

export async function fetchUsers(params: {
  keyword?: string
  role?: string
  page: number
  page_size: number
}): Promise<{ items: UserRow[]; total: number }> {
  const q = new URLSearchParams()
  if (params.keyword) q.set('keyword', params.keyword)
  if (params.role) q.set('role', params.role)
  q.set('page', String(params.page))
  q.set('page_size', String(params.page_size))

  const { res, data } = await fetchJson(`/auth/users?${q.toString()}`, {
    method: 'GET',
    headers: { ...authHeaders() },
  })
  if (!res.ok) throw new Error(readMsg(data) || `获取用户列表失败（HTTP ${res.status}）`)

  const payload = (data || {}) as ApiResp<{ items?: UserRow[]; total?: number }>
  const inner = (payload.data || {}) as Record<string, unknown>
  const list =
    (Array.isArray(inner.items) ? inner.items : null) ||
    (Array.isArray(inner.list) ? inner.list : null) ||
    (Array.isArray(inner.records) ? inner.records : null) ||
    []
  return {
    items: list as UserRow[],
    total: typeof inner.total === 'number' ? inner.total : list.length,
  }
}

function parseMeResponseToUserRow(data: unknown): UserRow | null {
  const root = data && typeof data === 'object' ? (data as Record<string, unknown>) : null
  if (!root) return null
  const inner =
    root.data && typeof root.data === 'object' && !Array.isArray(root.data)
      ? (root.data as Record<string, unknown>)
      : root
  const id = pickUserIdFromRecord(inner)
  let fromNested = ''
  if (inner.user && typeof inner.user === 'object' && !Array.isArray(inner.user)) {
    const uobj = inner.user as Record<string, unknown>
    fromNested = firstNonEmptyString(
      uobj.username as unknown,
      uobj.user_name as unknown,
    )
  }
  const username = firstNonEmptyString(inner.username, inner.user_name, fromNested)
  const uname = username || getSessionUsername()
  if (!uname || id == null) return null
  const role =
    firstNonEmptyString(inner.role, typeof inner.user_role === 'string' ? inner.user_role : '') ||
    getSessionRole() ||
    'user'
  const real_name = firstNonEmptyString(
    inner.real_name,
    inner.realName,
    inner.nickname,
    typeof inner.name === 'string' && inner.name !== uname ? String(inner.name) : '',
  )
  return {
    id,
    username: uname,
    real_name: real_name || '',
    role,
    phone: typeof inner.phone === 'string' ? inner.phone : undefined,
    email: typeof inner.email === 'string' ? inner.email : undefined,
  }
}

/**
 * 当前登录用户详情（部分后端提供，用于普通用户无法访问 /auth/users 列表时）。
 */
export async function fetchMeUserProfile(): Promise<UserRow | null> {
  const paths = ['/auth/me', '/auth/profile', '/auth/current_user']
  for (const path of paths) {
    try {
      const { res, data } = await fetchJson(path, {
        method: 'GET',
        headers: { ...authHeaders() },
      })
      if (!res.ok) continue
      const row = parseMeResponseToUserRow(data)
      if (row) return row
    } catch {
      /* 尝试下一路径 */
    }
  }
  return null
}

export async function createUser(body: {
  username: string
  real_name: string
  password: string
  role: string
  phone?: string
  email?: string
}) {
  const { res, data } = await fetchJson('/auth/users', {
    method: 'POST',
    headers: {
      ...authHeaders(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(readMsg(data) || `新增用户失败（HTTP ${res.status}）`)
}

export async function updateUserRole(id: number, role: string) {
  const { res, data } = await fetchJson('/auth/update_role', {
    method: 'POST',
    headers: {
      ...authHeaders(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ id, role }),
  })
  if (!res.ok) throw new Error(readMsg(data) || `修改角色失败（HTTP ${res.status}）`)
}

export async function changeUserPassword(id: number, admin_key: string, new_password: string) {
  const { res, data } = await fetchJson('/auth/change_password', {
    method: 'POST',
    headers: {
      ...authHeaders(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ id, admin_key, new_password }),
  })
  if (!res.ok) throw new Error(readMsg(data) || `修改密码失败（HTTP ${res.status}）`)
}

export async function deleteUser(id: number) {
  const { res, data } = await fetchJson('/auth/delete_user', {
    method: 'POST',
    headers: {
      ...authHeaders(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ id }),
  })
  if (!res.ok) throw new Error(readMsg(data) || `删除用户失败（HTTP ${res.status}）`)
}
