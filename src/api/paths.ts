/**
 * 后端 FastAPI 路由（与 Swagger / openapi.json 一致）。
 * 送货历史、送货量预测、预测模块等路径已统一为英文 segment（如 chart、details、export、template、batch-delete）。
 */
export const ApiPaths = {
  /** 列表/查询主路径（未改名则保持） */
  deliveryHistory: '/delivery-history',
  /** 送货历史筛选维度：大区经理 / 仓库 / 冶炼厂（与 pd_ip_delivery_records 一致） */
  deliveryHistoryDimensionOptions: '/delivery-history/dimension-options',
  deliveryHistoryTemplate: '/delivery-history/template',
  deliveryHistoryImport: '/delivery-history/import',
  deliveryHistoryBatchDelete: '/delivery-history/batch-delete',
  forecastDetail: '/forecast/details',
  /** PRD 规则预测筛选维度（数据源同送货历史） */
  forecastDimensionOptions: '/forecast/dimension-options',
  forecastChart: '/forecast/chart',
  forecastExport: '/forecast/export',
  /** 预测模块前缀；子路径示例：/predict/operation-audit、/predict/async、/predict/results、batches/{id} 等由后端挂载 */
  predict: '/predict',
  /** 已落库预测结果查询（GET） */
  predictResults: '/predict/results',
  /** 已落库预测结果中的维度（pd_ip_prediction_results） */
  predictDimensionOptions: '/predict/dimension-options',
} as const
