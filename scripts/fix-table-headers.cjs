const fs = require('fs')
const path = require('path')

const indexPath = path.join(__dirname, '../public/embedded/price_system/assets/index-e7CRb-gt.js')
let idx = fs.readFileSync(indexPath, 'utf8')

// 1. 修复库存管理表头：添加"回收品种"和"操作"
const oldInvHeader = '<th data-v-4b5a159b>库房名称</th><th data-v-4b5a159b>库存</th><th data-v-4b5a159b>库存日期</th>'
const newInvHeader = '<th data-v-4b5a159b>库房名称</th><th data-v-4b5a159b>回收品种</th><th data-v-4b5a159b>库存</th><th data-v-4b5a159b>库存日期</th><th data-v-4b5a159b>操作</th>'

if (idx.includes(oldInvHeader)) {
  idx = idx.replace(oldInvHeader, newInvHeader)
  console.log('✅ 库存管理表头：添加了"回收品种"和"操作"列')
} else if (idx.includes(newInvHeader)) {
  console.log('✅ 库存管理表头已正确')
} else {
  console.log('❌ 未找到库存管理表头')
}

// 2. 修复收货价格表头：添加"价格日期"
const oldRcpHeader = '<th data-v-4b5a159b>库房名称</th><th data-v-4b5a159b>回收品种</th><th data-v-4b5a159b>价格</th><th data-v-4b5a159b>操作</th>'
const newRcpHeader = '<th data-v-4b5a159b>库房名称</th><th data-v-4b5a159b>回收品种</th><th data-v-4b5a159b>价格</th><th data-v-4b5a159b>价格日期</th><th data-v-4b5a159b>操作</th>'

if (idx.includes(oldRcpHeader)) {
  idx = idx.replace(oldRcpHeader, newRcpHeader)
  console.log('✅ 收货价格表头：添加了"价格日期"列')
} else if (idx.includes(newRcpHeader)) {
  console.log('✅ 收货价格表头已正确')
} else {
  console.log('❌ 未找到收货价格表头')
}

fs.writeFileSync(indexPath, idx, 'utf8')
console.log('\n已保存 index 文件')
