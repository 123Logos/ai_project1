const fs = require('fs')
const path = require('path')
const appPath = path.join(__dirname, '../public/embedded/price_system/assets/app-BZHDhlyu.js')
let app = fs.readFileSync(appPath, 'utf8')

// 修复所有 "async async" 双重 async 问题
let count = 0
while (app.includes('async async function')) {
  app = app.replace('async async function', 'async function')
  count++
}
console.log('修复了 ' + count + ' 个 "async async function" 问题')

// 也检查其他函数
const doubleAsync = app.match(/async\s+async\s+/g)
if (doubleAsync) {
  console.log('还有其他双重async问题:', doubleAsync.length)
}

// 检查 "async async async" 三重问题
while (app.includes('async async async')) {
  app = app.replace('async async async', 'async')
}

fs.writeFileSync(appPath, app, 'utf8')
console.log('已保存修复后的文件')

// 验证
const app2 = fs.readFileSync(appPath, 'utf8')
console.log('验证: 还有 "async async":', app2.includes('async async') ? '有' : '无')
