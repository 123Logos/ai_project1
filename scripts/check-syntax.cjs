const fs = require('fs')
const path = require('path')
const appPath = path.join(__dirname, '../public/embedded/price_system/assets/app-BZHDhlyu.js')
const app = fs.readFileSync(appPath, 'utf8')

// 检查括号平衡
let parens = 0
let maxDepth = 0
let problemLine = 0
let lineNum = 1
for (let i = 0; i < app.length; i++) {
  if (app[i] === '\n') lineNum++
  if (app[i] === '(') {
    parens++
    if (parens > maxDepth) maxDepth = parens
  }
  if (app[i] === ')') {
    parens--
    if (parens < 0) {
      console.log('圆括号不平衡，位置:', i, '行:', lineNum)
      const start = Math.max(0, i - 80)
      const end = Math.min(app.length, i + 80)
      console.log('附近:', app.substring(start, end))
      break
    }
  }
}
console.log('圆括号最终余额:', parens)

// 检查 invDeleteStock 函数格式
const invDeleteStart = app.indexOf('async function invDeleteStock(')
if (invDeleteStart !== -1) {
  const snippet = app.substring(invDeleteStart, invDeleteStart + 500)
  console.log('\ninvDeleteStock:')
  console.log(snippet)
}
