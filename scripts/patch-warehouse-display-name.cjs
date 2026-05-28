/**
 * 嵌入比价系统：库房展示名去掉末尾括号 ID，发货库房列表不再追加 (编号)
 * Run: node scripts/patch-warehouse-display-name.cjs
 */
const fs = require('fs')
const path = require('path')

const appPath = path.join(
  __dirname,
  '../public/embedded/price_system/assets/app-BZHDhlyu.js',
)

let app = fs.readFileSync(appPath, 'utf8')

const oldT =
  'function T(e){return String(_(e,[`仓库名`,`仓库`,`name`,`warehouse_name`,`warehouseName`],``))}'
const newT =
  'function T(e){var t=String(_(e,[`仓库名`,`仓库`,`name`,`warehouse_name`,`warehouseName`],``));return t.replace(/[（(][^）)]*[）)]\\s*$/u,``).trim()}'

const oldXt = '`" data-wh-id="`+n+`">`+M(r)+`（`+n+`）</button>`'
const newXt = '`" data-wh-id="`+n+`">`+M(r)+`</button>`'

if (!app.includes(oldT) && !app.includes(newT)) {
  console.error('app: function T(e) not found')
  process.exit(1)
}
if (app.includes(oldT)) {
  app = app.split(oldT).join(newT)
}

if (app.includes(oldXt)) {
  app = app.split(oldXt).join(newXt)
} else if (!app.includes(newXt)) {
  console.error('app: Xt warehouse list button template not found')
  process.exit(1)
}

fs.writeFileSync(appPath, app, 'utf8')
console.log('Patched warehouse display names in app-BZHDhlyu.js')
