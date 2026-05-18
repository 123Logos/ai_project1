import { NAV_PERMISSION_SEED } from '@/data/navPermissionSeed'

/** 门户「AI 比价系统」主 tab：任一比价相关导航权限为 true 即可进入嵌入页 */
export const AI_PRICE_NAV_FIELDS: readonly string[] = NAV_PERMISSION_SEED.filter(
  (r) => r.category === 'ai_price',
).map((r) => r.field_name)

export type PrimaryNavKey = 'map' | 'prediction' | 'detect' | 'price' | 'aiPricing' | 'warehouseDistance'

export function primaryNavRequiredFields(key: PrimaryNavKey): readonly string[] {
  switch (key) {
    case 'map':
      return ['perm_nav_map_supply_electronic_map']
    case 'warehouseDistance':
      return ['perm_nav_map_supply_warehouse_distance_config']
    case 'prediction':
      return ['perm_nav_ai_prediction']
    case 'detect':
      return ['perm_nav_ai_security_image_detect']
    case 'price':
      return ['perm_nav_ai_price']
    case 'aiPricing':
      return ['perm_nav_ai_pricing']
    default:
      return []
  }
}

/** 聚合入口：预测 / 比价 为「任一为 true」；其余为「列表中任一为 true」 */
export function canSeePrimaryNav(key: PrimaryNavKey, has: (field: string) => boolean): boolean {
  const fields = primaryNavRequiredFields(key)
  return fields.some((f) => has(f))
}

export type PredictionSubKey = 'historyManage' | 'historyQuery' | 'forecast'

export const PREDICTION_SUB_TO_FIELD: Record<PredictionSubKey, string> = {
  historyManage: 'perm_nav_ai_prediction_history_manage',
  historyQuery: 'perm_nav_ai_prediction_history_query',
  forecast: 'perm_nav_ai_prediction_forecast',
}

/** 子 Tab：显式子权限，或已勾选父级「AI 预测」时视为全部可进 */
export function hasPredictionSubNavPermission(
  key: PredictionSubKey,
  has: (field: string) => boolean,
): boolean {
  if (has(PREDICTION_SUB_TO_FIELD[key])) return true
  return has('perm_nav_ai_prediction')
}

export function canOpenUserManage(has: (field: string) => boolean): boolean {
  return (
    has('perm_nav_system_account_user_account') || has('perm_nav_system_account_role_manage')
  )
}
