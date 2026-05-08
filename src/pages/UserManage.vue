<template>
  <div class="user-manage-page">
    <div class="card shadow-sm user-manage-card">
      <div class="card-body pb-2">
        <h5 class="um-page-title mb-3">
          <i class="bi bi-shield-lock me-2" aria-hidden="true"></i>
          用户管理
        </h5>
        <ul class="nav nav-tabs um-tabs" role="tablist">
          <li class="nav-item" role="presentation">
            <button
              type="button"
              class="nav-link"
              :class="{ active: umTab === 'account' }"
              role="tab"
              :aria-selected="umTab === 'account'"
              @click="umTab = 'account'"
            >
              账号管理
            </button>
          </li>
          <li v-if="!isRegularUser" class="nav-item" role="presentation">
            <button
              type="button"
              class="nav-link"
              :class="{ active: umTab === 'roles' }"
              role="tab"
              :aria-selected="umTab === 'roles'"
              @click="umTab = 'roles'"
            >
              角色管理
            </button>
          </li>
        </ul>
      </div>

      <div v-show="umTab === 'account'" class="card-body border-top pt-3">
        <div class="toolbar">
          <div v-if="!isRegularUser" class="left-tools">
            <input v-model.trim="keyword" class="form-control form-control-sm" placeholder="用户名/姓名关键字" />
            <select v-model="roleFilter" class="form-select form-select-sm">
              <option value="">全部角色</option>
              <option value="admin">管理员</option>
              <option value="user">普通用户</option>
            </select>
            <button class="btn btn-sm btn-outline-primary" @click="loadUsers(1)">查询</button>
          </div>
          <p v-else class="user-manage-self-hint text-muted small mb-0">
            当前为普通用户，仅可查看本账号信息并修改自己的密码。
          </p>
          <button v-if="!isRegularUser" class="btn btn-sm btn-success" @click="openCreateModal">新增用户</button>
        </div>

        <div v-if="errorText" class="alert alert-warning mt-3 mb-0">{{ errorText }}</div>

        <div class="table-wrap">
          <table class="table table-sm table-hover align-middle mb-0">
            <thead>
              <tr>
                <th style="width: 70px">ID</th>
                <th>用户名</th>
                <th>姓名</th>
                <th style="width: 120px">角色</th>
                <th>手机号</th>
                <th>邮箱</th>
                <th style="width: 260px">操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="loading">
                <td colspan="7" class="text-center py-4">加载中...</td>
              </tr>
              <tr v-else-if="users.length === 0">
                <td colspan="7" class="text-center py-4 text-muted">暂无用户数据</td>
              </tr>
              <tr v-for="u in users" :key="u.id">
                <td>{{ u.id > 0 ? u.id : '—' }}</td>
                <td>{{ u.username }}</td>
                <td>{{ u.real_name || '-' }}</td>
                <td>
                  <span class="badge rounded-pill text-bg-primary">{{ roleText(u.role) }}</span>
                </td>
                <td>{{ u.phone || '-' }}</td>
                <td>{{ u.email || '-' }}</td>
                <td>
                  <div class="action-btns">
                    <button
                      v-if="!isRegularUser"
                      class="btn btn-sm btn-outline-primary"
                      @click="openRoleModal(u)"
                    >
                      改角色
                    </button>
                    <button class="btn btn-sm btn-outline-warning" @click="openPasswordModal(u)">改密码</button>
                    <button
                      v-if="!isRegularUser"
                      class="btn btn-sm btn-outline-danger"
                      @click="confirmDelete(u)"
                    >
                      删除
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-if="!isRegularUser" class="pager">
          <button class="btn btn-sm btn-outline-secondary" :disabled="page <= 1" @click="loadUsers(page - 1)">
            上一页
          </button>
          <span class="pager-text">第 {{ page }} 页 / 共 {{ totalPages }} 页（{{ total }} 条）</span>
          <button
            class="btn btn-sm btn-outline-secondary"
            :disabled="page >= totalPages"
            @click="loadUsers(page + 1)"
          >
            下一页
          </button>
        </div>
      </div>

      <div v-show="umTab === 'roles' && !isRegularUser" class="card-body border-top pt-3">
        <RoleManagePanel />
      </div>
    </div>

    <div v-if="showCreate" class="mask">
      <div class="dialog card">
        <div class="card-body">
          <h6 class="mb-3">新增用户</h6>
          <div v-if="createErrorText" class="alert alert-warning py-2">{{ createErrorText }}</div>
          <div class="row g-2">
            <div class="col-md-6">
              <label class="form-label">用户名</label>
              <input
                v-model.trim="createForm.username"
                class="form-control form-control-sm"
                autocomplete="off"
              />
            </div>
            <div class="col-md-6">
              <label class="form-label">姓名</label>
              <input
                v-model.trim="createForm.real_name"
                class="form-control form-control-sm"
                autocomplete="off"
              />
            </div>
            <div class="col-md-6">
              <label class="form-label">密码</label>
              <input
                v-model.trim="createForm.password"
                type="password"
                class="form-control form-control-sm"
                autocomplete="new-password"
              />
            </div>
            <div class="col-md-6">
              <label class="form-label">角色</label>
              <select v-model="createForm.role" class="form-select form-select-sm">
                <option value="admin">管理员</option>
                <option value="user">普通用户</option>
              </select>
            </div>
            <div class="col-md-6">
              <label class="form-label">手机号</label>
              <input
                v-model.trim="createForm.phone"
                class="form-control form-control-sm"
                autocomplete="off"
              />
            </div>
            <div class="col-md-6">
              <label class="form-label">邮箱</label>
              <input
                v-model.trim="createForm.email"
                class="form-control form-control-sm"
                autocomplete="off"
              />
            </div>
          </div>
          <div class="dialog-actions mt-3">
            <button class="btn btn-sm btn-secondary" @click="showCreate = false">取消</button>
            <button class="btn btn-sm btn-primary" :disabled="submitting" @click="submitCreate">保存</button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showRole" class="mask">
      <div class="dialog card">
        <div class="card-body">
          <h6 class="mb-3">修改角色</h6>
          <div class="mb-2">用户：{{ currentUser?.username }}</div>
          <select v-model="roleValue" class="form-select form-select-sm">
            <option value="admin">管理员</option>
            <option value="user">普通用户</option>
          </select>
          <div class="dialog-actions mt-3">
            <button class="btn btn-sm btn-secondary" @click="showRole = false">取消</button>
            <button class="btn btn-sm btn-primary" :disabled="submitting" @click="submitRole">保存</button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showPassword" class="mask">
      <div class="dialog card">
        <div class="card-body">
          <h6 class="mb-3">修改密码</h6>
          <div class="mb-2">用户：{{ currentUser?.username }}</div>
          <div class="mb-2">
            <label class="form-label">管理员密钥</label>
            <input v-model.trim="pwdForm.admin_key" type="password" class="form-control form-control-sm" />
          </div>
          <div class="mb-2">
            <label class="form-label">新密码</label>
            <input v-model.trim="pwdForm.new_password" type="password" class="form-control form-control-sm" />
          </div>
          <div class="dialog-actions mt-3">
            <button class="btn btn-sm btn-secondary" @click="showPassword = false">取消</button>
            <button class="btn btn-sm btn-primary" :disabled="submitting" @click="submitPassword">保存</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import RoleManagePanel from '../components/RoleManagePanel.vue'
import {
  changeUserPassword,
  createUser,
  deleteUser,
  fetchMeUserProfile,
  fetchUsers,
  getSessionRole,
  getSessionUserId,
  getSessionUsername,
  isRegularUserSession,
  updateUserRole,
  type UserRow,
} from '../api/authApi'

const users = ref<UserRow[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(10)
const keyword = ref('')
const roleFilter = ref('')
const loading = ref(false)
const submitting = ref(false)
const errorText = ref('')

const showCreate = ref(false)
const showRole = ref(false)
const showPassword = ref(false)
const currentUser = ref<UserRow | null>(null)
const roleValue = ref('user')
const createErrorText = ref('')

const createForm = ref({
  username: '',
  real_name: '',
  password: '',
  role: 'user',
  phone: '',
  email: '',
})

const pwdForm = ref({
  admin_key: '',
  new_password: '',
})

const isRegularUser = computed(() => isRegularUserSession())

type UmTab = 'account' | 'roles'
const umTab = ref<UmTab>('account')

watch(isRegularUser, (v) => {
  if (v) umTab.value = 'account'
})

const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pageSize.value)))

/** 普通用户无权限拉列表时：/auth/me 或本地会话拼一行，不抛错、不展示「权限不足」 */
async function fillRestrictedSelfRows(selfName: string): Promise<UserRow[]> {
  const me = await fetchMeUserProfile()
  if (me && me.username === selfName) return [me]
  const id = getSessionUserId()
  const role = getSessionRole() || 'user'
  return [
    {
      id: id ?? 0,
      username: selfName,
      real_name: '',
      role,
    },
  ]
}

async function loadUsers(nextPage = page.value) {
  loading.value = true
  errorText.value = ''
  try {
    const restricted = isRegularUserSession()
    const selfName = getSessionUsername()
    if (restricted && !selfName) {
      users.value = []
      total.value = 0
      page.value = 1
      errorText.value = '无法识别当前登录账号，请退出后重新登录。'
      return
    }
    if (restricted && selfName) {
      try {
        const data = await fetchUsers({
          keyword: selfName,
          page: 1,
          page_size: 200,
        })
        let items = data.items.filter((u) => u.username === selfName)
        if (!items.length) {
          items = await fillRestrictedSelfRows(selfName)
        }
        users.value = items
        total.value = items.length
        page.value = 1
      } catch {
        users.value = await fillRestrictedSelfRows(selfName)
        total.value = users.value.length
        page.value = 1
      }
      return
    }

    const data = await fetchUsers({
      keyword: keyword.value || undefined,
      role: roleFilter.value || undefined,
      page: nextPage,
      page_size: pageSize.value,
    })
    users.value = data.items
    total.value = data.total
    page.value = nextPage
  } catch (e) {
    errorText.value = e instanceof Error ? e.message : String(e)
  } finally {
    loading.value = false
  }
}

function openCreateModal() {
  if (isRegularUserSession()) return
  createForm.value = {
    username: '',
    real_name: '',
    password: '',
    role: 'user',
    phone: '',
    email: '',
  }
  createErrorText.value = ''
  showCreate.value = true
}

async function submitCreate() {
  if (isRegularUserSession()) return
  if (!createForm.value.username || !createForm.value.password) {
    createErrorText.value = '用户名和密码必填'
    return
  }
  createErrorText.value = ''
  submitting.value = true
  try {
    await createUser({
      username: createForm.value.username,
      real_name: createForm.value.real_name,
      password: createForm.value.password,
      role: createForm.value.role,
      phone: createForm.value.phone || undefined,
      email: createForm.value.email || undefined,
    })
    showCreate.value = false
    await loadUsers(1)
  } catch (e) {
    createErrorText.value = e instanceof Error ? e.message : String(e)
  } finally {
    submitting.value = false
  }
}

function openRoleModal(u: UserRow) {
  if (isRegularUserSession()) return
  currentUser.value = u
  roleValue.value = u.role || 'user'
  showRole.value = true
}

async function submitRole() {
  if (isRegularUserSession()) return
  if (!currentUser.value) return
  submitting.value = true
  try {
    await updateUserRole(currentUser.value.id, roleValue.value)
    showRole.value = false
    await loadUsers(page.value)
  } catch (e) {
    alert(e instanceof Error ? e.message : String(e))
  } finally {
    submitting.value = false
  }
}

function openPasswordModal(u: UserRow) {
  if (isRegularUserSession()) {
    const self = getSessionUsername()
    if (self && u.username !== self) return
  }
  currentUser.value = u
  pwdForm.value = { admin_key: '', new_password: '' }
  showPassword.value = true
}

async function submitPassword() {
  if (!currentUser.value) return
  if (isRegularUserSession()) {
    const self = getSessionUsername()
    if (self && currentUser.value.username !== self) return
  }
  if (!currentUser.value.id || currentUser.value.id <= 0) {
    alert('当前无法获取您的用户编号（请重新登录后再试修改密码）。')
    return
  }
  if (!pwdForm.value.admin_key || !pwdForm.value.new_password) {
    alert('管理员密钥和新密码必填')
    return
  }
  submitting.value = true
  try {
    await changeUserPassword(currentUser.value.id, pwdForm.value.admin_key, pwdForm.value.new_password)
    showPassword.value = false
    alert('密码修改成功')
  } catch (e) {
    alert(e instanceof Error ? e.message : String(e))
  } finally {
    submitting.value = false
  }
}

async function confirmDelete(u: UserRow) {
  if (isRegularUserSession()) return
  if (!confirm(`确认删除用户「${u.username}」吗？`)) return
  submitting.value = true
  try {
    await deleteUser(u.id)
    await loadUsers(page.value)
  } catch (e) {
    alert(e instanceof Error ? e.message : String(e))
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  void loadUsers(1)
})

function roleText(role: string | undefined) {
  if (role === 'admin') return '管理员'
  if (role === 'user') return '普通用户'
  return role || '-'
}
</script>

<style scoped>
.user-manage-page {
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px;
}

.um-page-title {
  font-weight: 600;
  font-size: 17px;
  color: #0f172a;
}

.um-tabs .nav-link {
  cursor: pointer;
  border: none;
  background: transparent;
  color: #64748b;
  padding: 0.5rem 1rem;
  font-weight: 500;
}

.um-tabs .nav-link:hover {
  color: #0f172a;
}

.um-tabs .nav-link.active {
  color: #0d9488;
  border-bottom: 2px solid #0d9488;
  margin-bottom: -1px;
  background: transparent;
}

.user-manage-card .nav-tabs {
  border-bottom: 1px solid #e5e7eb;
}

.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.left-tools {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.left-tools .form-control,
.left-tools .form-select {
  width: 180px;
}

.table-wrap {
  margin-top: 12px;
  overflow: auto;
}

.action-btns {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.pager {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 12px;
}

.pager-text {
  font-size: 13px;
  color: #4b5563;
}

.mask {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.38);
  z-index: 1200;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}

.dialog {
  width: min(680px, 100%);
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
</style>
