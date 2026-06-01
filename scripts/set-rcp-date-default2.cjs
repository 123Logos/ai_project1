const fs = require('fs')
const path = require('path')

const appPath = path.join(__dirname, '../public/embedded/price_system/assets/app-BZHDhlyu.js')
let app = fs.readFileSync(appPath, 'utf8')

// 在 initReceiptPricePage 中设置默认日期为当天
const oldOnOpen = 'onOpen:async function(){await setupModalWhCombo(`rcp`),await invFillCategorySelect(`rcp-category`)}'
const newOnOpen = 'onOpen:async function(){await setupModalWhCombo(`rcp`),await invFillCategorySelect(`rcp-category`);var rd=document.getElementById(`rcp-date`);rd&&(rd.value=kt())}'

if (app.includes(oldOnOpen)) {
  app = app.replace(oldOnOpen, newOnOpen)
  console.log('✅ 录入时默认日期设为当天')
} else {
  console.log('❌ 未找到 onOpen')
}

fs.writeFileSync(appPath, app, 'utf8')
console.log('已保存')
