import { readonly, ref } from 'vue'
import { collectGrantedFieldNames, fetchMyPermissionsDetail } from '@/api/permissionsApi'
import { getToken } from '@/api/authApi'

const granted = ref(new Set<string>())
const loading = ref(false)
const loadError = ref('')
/** 至少成功拉取过一次（用于区分「加载中」与「确认为空」） */
const permissionsHydrated = ref(false)

let loadSeq = 0

export function hasNavPermission(fieldName: string): boolean {
  return granted.value.has(fieldName)
}

export function useMePermissionsState() {
  return {
    granted: readonly(granted),
    loading: readonly(loading),
    loadError: readonly(loadError),
    permissionsHydrated: readonly(permissionsHydrated),
  }
}

/** 登录成功或带 token 进入应用时调用 */
export async function loadMePermissions(): Promise<void> {
  if (!getToken()) {
    loadSeq += 1
    granted.value = new Set()
    loadError.value = ''
    permissionsHydrated.value = false
    return
  }

  const seq = ++loadSeq
  const previous = new Set(granted.value)
  loading.value = true
  loadError.value = ''

  try {
    const detail = await fetchMyPermissionsDetail()
    if (seq !== loadSeq) return
    granted.value = collectGrantedFieldNames(detail as Record<string, unknown>)
    permissionsHydrated.value = true
  } catch (e) {
    if (seq !== loadSeq) return
    loadError.value = e instanceof Error ? e.message : String(e)
    // 刷新失败时保留上次权限，避免偶发网络/超时导致整站误判为无权限
    if (previous.size > 0) {
      granted.value = previous
    } else {
      granted.value = new Set()
    }
  } finally {
    if (seq === loadSeq) loading.value = false
  }
}

export function clearMePermissions(): void {
  loadSeq += 1
  granted.value = new Set()
  loadError.value = ''
  permissionsHydrated.value = false
}
