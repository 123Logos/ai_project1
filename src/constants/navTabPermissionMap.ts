import { NAV_PERMISSION_SEED } from '@/data/navPermissionSeed'

/** 门户「AI 比价系统」主 tab：任一比价相关导航权限为 true 即可进入嵌入页 */
export const AI_PRICE_NAV_FIELDS: readonly string[] = NAV_PERMISSION_SEED.filter(
  (r) => r.category === 'ai_price',
).map((r) => r.field_name)

/** AI 预测：与 /auth/permissions/me 一致，仅勾选子项（无 perm_nav_ai_prediction 父项）也应可进 */
export const AI_PREDICTION_NAV_FIELDS: readonly string[] = NAV_PERMISSION_SEED.filter(
  (r) => r.category === 'ai_prediction',
).map((r) => r.field_name)

/** AI 定价：任一定价子权限为 true 即可 */
export const AI_PRICING_NAV_FIELDS: readonly string[] = NAV_PERMISSION_SEED.filter(
  (r) => r.category === 'ai_pricing',
).map((r) => r.field_name)

export type PrimaryNavKey =
  | 'map'
  | 'prediction'
  | 'detect'
  | 'price'
  | 'aiPricing'
  | 'dataMaintain'
  | 'warehouseDistance'

export function primaryNavRequiredFields(key: PrimaryNavKey): readonly string[] {
  switch (key) {
    case 'map':
      return ['perm_nav_map_supply_electronic_map']
    case 'dataMaintain':
      return [
        'perm_nav_map_supply_data_maintain',
        'perm_nav_map_supply_current_stock',
        'perm_nav_map_supply_receive_price',
      ]
    case 'warehouseDistance':
      return ['perm_nav_map_supply_warehouse_distance_config']
    case 'prediction':
      return AI_PREDICTION_NAV_FIELDS
    case 'detect':
      return ['perm_nav_ai_security_image_detect']
    case 'price':
      return AI_PRICE_NAV_FIELDS
    case 'aiPricing':
      return AI_PRICING_NAV_FIELDS
    default:
      return []
  }
}

/** 聚合入口：大类下「任一 perm 为 true」即视为可进入该主导航 */
export function canSeePrimaryNav(key: PrimaryNavKey, has: (field: string) => boolean): boolean {
  const fields = primaryNavRequiredFields(key)
  return fields.some((f) => has(f))
}

export function hasAnyAiPredictionNavPermission(has: (field: string) => boolean): boolean {
  return canSeePrimaryNav('prediction', has)
}

export type PredictionSubKey = 'historyManage' | 'historyQuery' | 'forecast'

export const PREDICTION_SUB_TO_FIELD: Record<PredictionSubKey, string> = {
  historyManage: 'perm_nav_ai_prediction_history_manage',
  historyQuery: 'perm_nav_ai_prediction_history_query',
  forecast: 'perm_nav_ai_prediction_forecast',
}

/**
 * 子 Tab：对应子权限为 true 即可；或勾选父级 perm_nav_ai_prediction 时三项均可进。
 * 与后端实践一致：/me 常只返回子项（如 history_manage），不返回父项。
 */
export function hasPredictionSubNavPermission(
  key: PredictionSubKey,
  has: (field: string) => boolean,
): boolean {
  if (has(PREDICTION_SUB_TO_FIELD[key])) return true
  if (has('perm_nav_ai_prediction')) return true
  return false
}

export function canOpenUserManage(has: (field: string) => boolean): boolean {
  return (
    has('perm_nav_system_account_user_account') || has('perm_nav_system_account_role_manage')
  )
}
