#!/usr/bin/env node
/**
 * 将门户「小 tab」对应的权限定义批量写入后端（与 src/data/navPermissionSeed.ts 中 NAV_PERMISSION_SEED 保持一致）。
 *
 * 用法（PowerShell）：
 *   $env:PERMISSION_SEED_TOKEN="<登录后 localStorage 的 api_token>"
 *   npm run seed:permissions
 *
 * 可选覆盖 API 根（不要末尾斜杠，与 Vite 代理 /auth 一致的目标主机）：
 *   $env:PERMISSION_SEED_API="http://118.25.96.187:8001"
 *
 * 仅打印将执行的操作、不请求：
 *   npm run seed:permissions -- --dry-run
 *
 * 说明：未设置 PERMISSION_SEED_TOKEN 时，若存在 --dry-run 则只校验清单；否则退出并提示设置 Token。
 */

import { readFileSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')

/** 与 src/data/navPermissionSeed.ts 同步（仅 label + field_name） */
const NAV_PERMISSION_SEED = [
  { label: '电子地图', field_name: 'perm_nav_map_supply_electronic_map' },
  {
    label: '库房距离监测配置',
    field_name: 'perm_nav_map_supply_warehouse_distance_config',
  },

  { label: 'AI 预测', field_name: 'perm_nav_ai_prediction' },
  { label: '历史数据管理', field_name: 'perm_nav_ai_prediction_history_manage' },
  { label: '历史数据查询', field_name: 'perm_nav_ai_prediction_history_query' },
  { label: '送货量预测', field_name: 'perm_nav_ai_prediction_forecast' },
  { label: '铅价格查询', field_name: 'perm_nav_ai_prediction_lead_price_query' },

  { label: '图片真伪检查', field_name: 'perm_nav_ai_security_image_detect' },

  { label: 'AI 比价系统', field_name: 'perm_nav_ai_price' },
  { label: '智能比价', field_name: 'perm_nav_ai_price_smart_compare' },
  { label: '比价与决策', field_name: 'perm_nav_ai_price_compare_decision' },
  { label: '后台配置', field_name: 'perm_nav_ai_price_backend_config' },
  { label: 'AI 比价', field_name: 'perm_nav_ai_price_ai_compare' },
  { label: '报价上传与识别', field_name: 'perm_nav_ai_price_quote_upload' },
  { label: '报价查询', field_name: 'perm_nav_ai_price_quote_query' },
  { label: 'Excel 报价导入', field_name: 'perm_nav_ai_price_excel_quote_import' },
  { label: '库房管理', field_name: 'perm_nav_ai_price_warehouse_manage' },
  { label: '冶炼厂管理', field_name: 'perm_nav_ai_price_smelter_manage' },
  { label: '回收品类管理', field_name: 'perm_nav_ai_price_category_manage' },
  { label: '库房类型配置', field_name: 'perm_nav_ai_price_warehouse_type_config' },
  { label: '运费模板', field_name: 'perm_nav_ai_price_freight_template' },
  { label: '税金/换算比例', field_name: 'perm_nav_ai_price_tax_rate_config' },
  { label: '异常信息补全', field_name: 'perm_nav_ai_price_abnormal_complete' },
  { label: '报价导出', field_name: 'perm_nav_ai_price_quote_export' },

  // AI 定价
  { label: 'AI 定价', field_name: 'perm_nav_ai_pricing' },
  { label: '库房AI定价对标分析', field_name: 'perm_nav_ai_pricing_benchmark_analysis' },
  { label: '库房自有定价分析', field_name: 'perm_nav_ai_pricing_self_pricing' },
  { label: '对标城市定价', field_name: 'perm_nav_ai_pricing_city_benchmark' },
  { label: '冶炼厂标定价格', field_name: 'perm_nav_ai_pricing_smelter_price' },
  { label: '库房差价和毛利管理', field_name: 'perm_nav_ai_pricing_margin_manage' },

  { label: '账号管理', field_name: 'perm_nav_system_account_user_account' },
  { label: '角色管理', field_name: 'perm_nav_system_account_role_manage' },
]

function loadDotEnvOptional() {
  for (const name of ['.env.development', '.env.local', '.env']) {
    const p = join(ROOT, name)
    if (!existsSync(p)) continue
    const text = readFileSync(p, 'utf8')
    for (const line of text.split(/\r?\n/)) {
      const t = line.trim()
      if (!t || t.startsWith('#')) continue
      const m = /^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/.exec(t)
      if (!m) continue
      const key = m[1]
      let v = m[2].trim()
      if (
        (v.startsWith('"') && v.endsWith('"')) ||
        (v.startsWith("'") && v.endsWith("'"))
      ) {
        v = v.slice(1, -1)
      }
      if (process.env[key] === undefined) process.env[key] = v
    }
  }
}

function normalizeLabel(s) {
  return String(s ?? '')
    .trim()
    .replace(/\s+/g, ' ')
}

function unwrapData(data) {
  if (data != null && typeof data === 'object' && !Array.isArray(data) && 'data' in data) {
    return data.data
  }
  return data
}

function parseDefinitions(data) {
  const d = unwrapData(data)
  if (d == null) return []
  if (Array.isArray(d)) {
    const out = []
    for (const x of d) {
      if (typeof x === 'string' && x.trim()) {
        out.push({ field_name: x.trim(), label: x.trim() })
        continue
      }
      if (x && typeof x === 'object' && !Array.isArray(x)) {
        const fn = String(x.field_name ?? x.key ?? x.id ?? '').trim()
        if (!fn) continue
        const lab = String(x.label ?? x.name ?? x.title ?? fn).trim() || fn
        out.push({ field_name: fn, label: lab })
      }
    }
    return out
  }
  if (typeof d === 'object') {
    const o = d
    if (Array.isArray(o.items)) return parseDefinitions({ data: o.items })
    if (Array.isArray(o.list)) return parseDefinitions({ data: o.list })
  }
  return []
}

async function fetchJson(base, path, options = {}) {
  const url = `${base}${path.startsWith('/') ? path : `/${path}`}`
  const res = await fetch(url, {
    ...options,
    headers: {
      ...(options.headers || {}),
    },
  })
  const text = await res.text()
  let data = {}
  try {
    if (text) data = JSON.parse(text)
  } catch {
    /* ignore */
  }
  return { res, data }
}

function readMsg(data) {
  if (!data || typeof data !== 'object') return ''
  if (typeof data.message === 'string') return data.message
  if (typeof data.detail === 'string') return data.detail
  if (Array.isArray(data.detail)) {
    const lines = data.detail
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

async function getDefinitions(base, authHeaders) {
  const paths = ['/auth/permission/definitions', '/auth/permissions/definitions']
  let last = ''
  for (const path of paths) {
    const { res, data } = await fetchJson(base, path, {
      method: 'GET',
      headers: { ...authHeaders },
    })
    if (!res.ok) {
      last = readMsg(data) || `HTTP ${res.status}`
      continue
    }
    return parseDefinitions(data)
  }
  throw new Error(last || '无法获取权限定义列表')
}

async function postDefinition(base, authHeaders, body) {
  const { res, data } = await fetchJson(base, '/auth/permission/definitions', {
    method: 'POST',
    headers: {
      ...authHeaders,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(readMsg(data) || `HTTP ${res.status}`)
}

async function main() {
  loadDotEnvOptional()

  const dryRun = process.argv.includes('--dry-run')
  const base = (
    process.env.PERMISSION_SEED_API ||
    process.env.VITE_TL_TARGET ||
    process.env.VITE_API_TARGET ||
    ''
  )
    .trim()
    .replace(/\/+$/, '')

  let token = (process.env.PERMISSION_SEED_TOKEN || '').trim()
  if (!token && process.env.API_TOKEN) token = String(process.env.API_TOKEN).trim()

  if (!base) {
    console.error(
      '请设置 PERMISSION_SEED_API，或在 .env.development 中配置 VITE_API_TARGET / VITE_TL_TARGET（与 dev 代理 /auth 目标一致）。',
    )
    process.exit(1)
  }

  const authHeaders =
    token === ''
      ? {}
      : {
          Authorization: token.startsWith('Bearer ') ? token : `Bearer ${token}`,
        }

  if (!dryRun && !token) {
    console.error(
      '请设置 PERMISSION_SEED_TOKEN（或 API_TOKEN）：浏览器登录后从 localStorage 读取 api_token 填入。',
    )
    process.exit(1)
  }

  console.info(`API 根: ${base}`)
  console.info(`条目数: ${NAV_PERMISSION_SEED.length}${dryRun ? '（dry-run）' : ''}`)

  let existing = []
  if (!dryRun) {
    existing = await getDefinitions(base, authHeaders)
  }

  const existingFields = new Set(
    existing.map((r) => String(r.field_name ?? '').trim()).filter(Boolean),
  )
  const existingLabels = new Set(
    existing.map((r) => normalizeLabel(r.label)).filter(Boolean),
  )

  let added = 0
  const skipped = []
  const errors = []

  for (const row of NAV_PERMISSION_SEED) {
    const field_name = String(row.field_name ?? '').trim()
    const label = normalizeLabel(row.label)
    if (!field_name || !label) continue

    if (existingFields.has(field_name)) {
      skipped.push(`${label} (${field_name}) 已存在 field_name`)
      continue
    }
    if (existingLabels.has(label)) {
      skipped.push(`${label} 已存在同名展示名`)
      continue
    }

    if (dryRun) {
      console.info(`[dry-run] POST ${field_name} ← ${label}`)
      added += 1
      existingFields.add(field_name)
      existingLabels.add(label)
      continue
    }

    try {
      await postDefinition(base, authHeaders, { field_name, label })
      console.info(`已新增: ${label} (${field_name})`)
      added += 1
      existingFields.add(field_name)
      existingLabels.add(label)
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      errors.push(`${label}：${msg}`)
    }
  }

  if (skipped.length) {
    console.info('跳过:\n  ' + skipped.join('\n  '))
  }
  if (errors.length) {
    console.error('失败:\n  ' + errors.join('\n  '))
    process.exit(1)
  }

  console.info(
    dryRun ? `dry-run 结束：将新增 ${added} 条（已跳过 ${skipped.length}）` : `完成：新增 ${added} 条，跳过 ${skipped.length} 条`,
  )
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e)
  process.exit(1)
})
