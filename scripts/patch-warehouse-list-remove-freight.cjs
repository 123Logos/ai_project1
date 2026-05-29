/**
 * 库房管理列表：去掉「运费」列（表头 + 行数据 + colspan）
 * Run: node scripts/patch-warehouse-list-remove-freight.cjs
 */
const fs = require('fs')
const path = require('path')

const appPath = path.join(__dirname, '../public/embedded/price_system/assets/app-BZHDhlyu.js')
const indexPath = path.join(__dirname, '../public/embedded/price_system/assets/index-e7CRb-gt.js')

let app = fs.readFileSync(appPath, 'utf8')
let index = fs.readFileSync(indexPath, 'utf8')

const thOld = '<th data-v-4b5a159b>运费</th>'
if (!index.includes(thOld)) {
  if (!index.includes('<th data-v-4b5a159b>电话</th><th data-v-4b5a159b>危废许可量')) {
    console.error('index: freight column header not found (already patched?)')
    process.exit(1)
  }
} else {
  index = index.replace(thOld, '')
}

const startMarker = 'Id(`warehouse-table-body`)'
const endMarker = '}async function K(){let e=document.getElementById(`freight-table-body`)'
const start = app.indexOf(startMarker)
const end = app.indexOf(endMarker, start)
if (start < 0 || end < 0) {
  console.error('app: warehouse list block not found')
  process.exit(1)
}

let block = app.slice(start, end)
if (!block.includes('freight:v(e,[`运费`])') && !block.includes('<td>${M(fr)}</td>')) {
  console.error('app: freight column already removed from warehouse list?')
  process.exit(1)
}

block = block.replace(/,freight:v\(e,\[`运费`\]\)/, '')
// 删除 fr= 时保留逗号，避免 `sw=...` 与 `hz=...` 粘连导致 SyntaxError
block = block.replace(
  /,fr=t\.freight!=null&&!isNaN\(t\.freight\)\?t\.freight\.toLocaleString\(\):`-`,/,
  '',
)
block = block.replace(/`"><\/span> `hz=/g, '`"></span> `,hz=')
block = block.replace(/\s*<td>\$\{M\(fr\)\}<\/td>/, '')
block = block.replace(/D\(e,13,/g, 'D(e,12,')
block = block.replace(/E\(e,13,/g, 'E(e,12,')

app = app.slice(0, start) + block + app.slice(end)

fs.writeFileSync(appPath, app, 'utf8')
fs.writeFileSync(indexPath, index, 'utf8')
console.log('Removed freight column from warehouse management list.')
