# 规则预测 `/forecast` — 前端联调说明

与后端 OpenAPI 一致：**snake_case**、**无 `{ code, data }` 包装**、路径 `/forecast/*`（与 `/tl` 并列）。

## 前端已实现（送货量预测 `PurchaseQuantity.vue`）

| 后端 | 前端行为 |
|------|----------|
| `GET /forecast/chart` → `summary_analysis` | 页顶 `ForecastBasisPanel` 展示；与 `dates`/`total_by_date` 同次查询刷新 |
| `GET /forecast/details` → `items[].analysis` | 「预测明细」表格列 + 点击行 `PredictionAnalysisDrawer` 全文 |
| `GET /forecast/export` | 原「导出 Excel」按钮，参数与 chart 相同（无分页） |
| 多值 Query `regional_managers=a&b` | `axios` `paramsSerializer.indexes: null` 已配置 |

类型与解析：`src/api/forecastApi.ts`。

## 筛选参数（chart / details / export 共用）

| Query | 前端来源 |
|-------|----------|
| `date_from` / `date_to` | 各 Tab 日期；默认今天～今天+14 |
| `regional_managers` | 按大区经理 / 按仓库 / 预测明细（明细复用仓库 Tab 维度） |
| `warehouses` | 按仓库 / 预测明细 |
| `smelters` | 各 Tab 冶炼厂多选 |
| `product_varieties` | 暂未做 UI；需时可从 `GET /forecast/dimension-options` 扩展 |

`details` 额外：`page`、`page_size`（前端全量拉取时 `page_size=500`）。

## 联调检查

1. Network：`/forecast/chart` 响应根级含 **`summary_analysis`**（非空 string）。
2. `/forecast/details` 每行含 **`analysis`**。
3. 无历史时 chart 仍 200，`summary_analysis` 为说明文案（前端原样展示，不弹错误）。
4. 导出 xlsx 含 **`analysis`** 列。

## 代码索引

- 页面：`src/pages/PurchaseQuantity.vue`
- API：`src/api/forecastApi.ts`
- 组件：`src/components/ForecastBasisPanel.vue`、`PredictionAnalysisDrawer.vue`
