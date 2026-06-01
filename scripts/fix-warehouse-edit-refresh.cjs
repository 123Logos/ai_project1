const fs = require('fs')
const path = require('path')

const appPath = path.join(__dirname, '../public/embedded/price_system/assets/app-BZHDhlyu.js')
let app = fs.readFileSync(appPath, 'utf8')

// 找到编辑库房保存后的代码，把 await G() 改为单行刷新
// tt 函数是编辑库房的保存函数

// 当前代码：保存后调用 await G() 刷新整个列表
// 目标：保存后只刷新当前编辑的那一行

// 查找 tt 函数中保存后调用 G() 的位置
const patterns = [
  // 编辑保存后调用 G()
  'await Api.request(`POST`,`/tl/update_warehouse`,c)):await Api.request(`POST`,`/tl/add_warehouse`,c),await G()}',
  // 可能的其他写法
  'await Api.request(`POST`,`/tl/update_warehouse`,c)):await Api.request(`POST`,`/tl/add_warehouse`,c);await G()}',
]

let found = false
for (const old of patterns) {
  if (app.includes(old)) {
    console.log('找到匹配模式')
    found = true
    break
  }
}

if (!found) {
  // 搜索 G() 调用
  const idx = app.indexOf('update_warehouse')
  if (idx !== -1) {
    console.log('update_warehouse 附近代码:')
    console.log(app.substring(idx, idx + 300))
  }
}
