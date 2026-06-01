const fs = require('fs')
const path = require('path')

const appPath = path.join(__dirname, '../public/embedded/price_system/assets/app-BZHDhlyu.js')
let app = fs.readFileSync(appPath, 'utf8')

// 录入表单：价格日期默认填当天
const oldInput = 'id="rcp-date" class="form-control">\n                <small class="text-muted">留空则使用定价日历当天</small>'
const newInput = 'id="rcp-date" class="form-control" value="">\n                <small class="text-muted">默认为当天</small>'

if (app.includes(oldInput)) {
  app = app.replace(oldInput, newInput)
  console.log('✅ 录入表单日期字段更新')
}

// 在 initReceiptPricePage 中设置默认日期为当天
// 找到 add-rcp-btn 的 click 事件，在 onOpen 中设置默认日期
const oldOnOpen = 'onOpen:async function(){await invFillWarehouseSelect(`rcp-warehouse`),await invFillCategorySelect(`rcp-category`)}'
const newOnOpen = 'onOpen:async function(){await invFillWarehouseSelect(`rcp-warehouse`),await invFillCategorySelect(`rcp-category`);var rd=document.getElementById(`rcp-date`);rd&&!rd.value&&(rd.value=kt())}'

if (app.includes(oldOnOpen)) {
  app = app.replace(oldOnOpen, newOnOpen)
  console.log('✅ 录入时默认日期设为当天')
} else {
  console.log('⚠️ 录入 onOpen 模式不匹配')
}

fs.writeFileSync(appPath, app, 'utf8')
console.log('已保存')
