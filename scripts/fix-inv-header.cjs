const fs = require('fs')
const path = require('path')

const indexPath = path.join(__dirname, '../public/embedded/price_system/assets/index-e7CRb-gt.js')
let idx = fs.readFileSync(indexPath, 'utf8')

// 修复库存管理表头：添加"操作"列
const oldInv = '<th data-v-4b5a159b>库房名称</th><th data-v-4b5a159b>回收品种</th><th data-v-4b5a159b>当前库存</th><th data-v-4b5a159b>库存日期</th>'
const newInv = '<th data-v-4b5a159b>库房名称</th><th data-v-4b5a159b>回收品种</th><th data-v-4b5a159b>当前库存</th><th data-v-4b5a159b>库存日期</th><th data-v-4b5a159b>操作</th>'

if (idx.includes(oldInv)) {
  idx = idx.replace(oldInv, newInv)
  fs.writeFileSync(indexPath, idx, 'utf8')
  console.log('✅ 库存管理表头：添加了"操作"列')
} else if (idx.includes(newInv)) {
  console.log('✅ 库存管理表头已正确')
} else {
  console.log('❌ 未找到库存管理表头')
}
