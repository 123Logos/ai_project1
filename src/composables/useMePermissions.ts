import { ref } from 'vue'
import { collectGrantedFieldNames, fetchMyPermissionsDetail } from '@/api/permissionsApi'
import { getToken } from '@/api/authApi'

const granted = ref(new Set<string>())
const loading = ref(false)
const loadError = ref('')

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
    granted.value = collectGrantedFieldNames(detail as Record<string, unknown>)
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
