import { ref } from 'vue'
import { fetchMyPermissionsDetail } from '@/api/permissionsApi'
import { getToken } from '@/api/authApi'

const granted = ref(new Set<string>())
const loading = ref(false)
const loadError = ref('')

function collectGrantedFromDetail(detail: Record<string, unknown>): Set<string> {
  const s = new Set<string>()
  const perms = detail.permissions
  if (perms && typeof perms === 'object' && !Array.isArray(perms)) {
    for (const [k, v] of Object.entries(perms as Record<string, unknown>)) {
      if (v === true) s.add(k)
    }
  }
  const pwl = detail.permissions_with_labels
  if (pwl && typeof pwl === 'object' && !Array.isArray(pwl)) {
    for (const [k, v] of Object.entries(pwl as Record<string, unknown>)) {
      if (v && typeof v === 'object' && !Array.isArray(v)) {
        const val = (v as { value?: unknown }).value
        if (val === true) s.add(k)
      }
    }
  }
  return s
}

export function hasNavPermission(fieldName: string): boolean {
  return granted.value.has(fieldName)
}

export function useMePermissionsState() {
  return { granted, loading, loadError }
}

/** 登录成功或带 token 进入应用时调用 */
export async function loadMePermissions(): Promise<void> {
  if (!getToken()) {
    granted.value = new Set()
    loadError.value = ''
    return
  }
  loading.value = true
  loadError.value = ''
  try {
    const detail = await fetchMyPermissionsDetail()
    granted.value = collectGrantedFromDetail(detail as Record<string, unknown>)
  } catch (e) {
    granted.value = new Set()
    loadError.value = e instanceof Error ? e.message : String(e)
  } finally {
    loading.value = false
  }
}

export function clearMePermissions(): void {
  granted.value = new Set()
  loadError.value = ''
}
