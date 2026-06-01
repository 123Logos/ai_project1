/**
 * 添加库存删除功能和收货价格日期列
 */
const fs = require('fs')
const path = require('path')

const appPath = path.join(__dirname, '../public/embedded/price_system/assets/app-BZHDhlyu.js')
let app = fs.readFileSync(appPath, 'utf8')

// 1. 修改 loadInventoryList 函数 - 添加品种列和删除按钮
const oldLoadInv = `async function loadInventoryList(){var e=document.getElementById(\`inv-table-body\`),t=document.getElementById(\`inv-count\`),n=document.getElementById(\`inv-page-size\`);if(n&&n.value&&(invPg.pageSize=parseInt(n.value,10)||invPg.pageSize),!e)return;E(e,4,\`正在加载库存数据...\`);try{var r=document.getElementById(\`inv-keyword\`),i=new URLSearchParams;i.set(\`page\`,String(invPg.page)),i.set(\`page_size\`,String(invPg.pageSize)),r&&r.value&&r.value.trim()&&i.set(\`keyword\`,r.value.trim());var a=z(await Api.request(\`GET\`,\`/tl/warehouse_inventories?\`+i.toString())),o=a.list||[];invPg.total=a.total||0,e.innerHTML=\`\`,o.length||D(e,4,\`暂无库存数据\`),o.forEach(function(t){var n=v(t,[\`id\`,\`record_id\`]),r=_(t,[\`库房名称\`,\`warehouse_name\`],\`-\`),i=Number(_(t,[\`当前库存\`,\`stock\`],null)),a=_(t,[\`库存日期\`,\`inventory_date\`],\`\`)||\`-\`,s=document.createElement(\`tr\`);s.innerHTML=\`<td>\`+M(r)+\`</td><td>\`+(isNaN(i)?\`-\`:i.toLocaleString())+\`</td><td>\`+M(a)+\`</td><td><button class="btn btn-sm btn-outline edit-inv-btn" data-id="\`+String(n)+\`" data-stock="\`+String(isNaN(i)?0:i)+\`" data-date="\`+M(a)+\`">修改</button></td>\`,e.appendChild(s)}),t&&(t.textContent=String(invPg.total)),invUpdatePager()}catch(n){alert(\`加载库存失败: \`+(n.message||String(n))),t&&(t.textContent=\`0\`),e.innerHTML=\`\`,D(e,4,n.message||\`加载失败\`),invUpdatePager()}}`

const newLoadInv = `async function loadInventoryList(){var e=document.getElementById(\`inv-table-body\`),t=document.getElementById(\`inv-count\`),n=document.getElementById(\`inv-page-size\`);if(n&&n.value&&(invPg.pageSize=parseInt(n.value,10)||invPg.pageSize),!e)return;E(e,5,\`正在加载库存数据...\`);try{var r=document.getElementById(\`inv-keyword\`),i=new URLSearchParams;i.set(\`page\`,String(invPg.page)),i.set(\`page_size\`,String(invPg.pageSize)),r&&r.value&&r.value.trim()&&i.set(\`keyword\`,r.value.trim());var a=z(await Api.request(\`GET\`,\`/tl/warehouse_inventories?\`+i.toString())),o=a.list||[];invPg.total=a.total||0,e.innerHTML=\`\`,o.length||D(e,5,\`暂无库存数据\`),o.forEach(function(t){var n=v(t,[\`id\`,\`record_id\`]),r=_(t,[\`库房名称\`,\`warehouse_name\`],\`-\`),c=_(t,[\`品类名\`,\`回收品种\`,\`category_name\`],\`-\`),i=Number(_(t,[\`当前库存\`,\`stock\`],null)),a=_(t,[\`库存日期\`,\`inventory_date\`],\`\`)||\`-\`,s=document.createElement(\`tr\`);s.innerHTML=\`<td>\`+M(r)+\`</td><td>\`+M(c)+\`</td><td>\`+(isNaN(i)?\`-\`:i.toLocaleString())+\`</td><td>\`+M(a)+\`</td><td><button class="btn btn-sm btn-outline edit-inv-btn" data-id="\`+String(n)+\`" data-stock="\`+String(isNaN(i)?0:i)+\`" data-date="\`+M(a)+\`">修改</button> <button class="btn btn-sm btn-danger delete-inv-btn" data-id="\`+String(n)+\`" data-date="\`+M(a)+\`">删除</button></td>\`,e.appendChild(s)}),t&&(t.textContent=String(invPg.total)),invUpdatePager()}catch(n){alert(\`加载库存失败: \`+(n.message||String(n))),t&&(t.textContent=\`0\`),e.innerHTML=\`\`,D(e,5,n.message||\`加载失败\`),invUpdatePager()}}`

if (app.includes(oldLoadInv)) {
  app = app.replace(oldLoadInv, newLoadInv)
  console.log('✅ Updated loadInventoryList - added category column and delete button')
} else {
  console.log('⚠️ loadInventoryList old version not found, checking if already updated...')
  if (app.includes('delete-inv-btn')) {
    console.log('✅ loadInventoryList already has delete button')
  } else {
    console.log('❌ Could not find loadInventoryList to update')
  }
}

// 2. 添加删除库存的函数
const invDeleteFunc = `
async function invDeleteStock(id, date) {
  if (!id || !confirm('确定删除该库存记录？删除后不可恢复。')) return;
  try {
    await Api.request('DELETE', '/tl/warehouse_inventories', { 库房id: id, 库存日期: date });
    alert('删除成功');
    await loadInventoryList();
  } catch (e) {
    alert('删除失败: ' + (e.message || String(e)));
  }
}
`

if (!app.includes('function invDeleteStock(')) {
  // 在 invEditStock 函数后添加
  const invEditStockEnd = 'await loadInventoryList()}})}'
  if (app.includes(invEditStockEnd)) {
    app = app.replace(invEditStockEnd, invEditStockEnd + invDeleteFunc)
    console.log('✅ Added invDeleteStock function')
  }
}

// 3. 修改 initInventoryPage 函数 - 添加删除按钮事件
const oldInitInvClickListener = 'var i=document.getElementById(`inv-table-body`);i&&i.addEventListener(`click`,function(e){var t=e.target.closest(`.edit-inv-btn`);if(t){var n=parseInt(t.getAttribute(`data-id`),10),r=parseFloat(t.getAttribute(`data-stock`))||0,i=t.getAttribute(`data-date`)||``;invEditStock(n,r,i)}})'

const newInitInvClickListener = 'var i=document.getElementById(`inv-table-body`);i&&i.addEventListener(`click`,function(e){var t=e.target.closest(`.edit-inv-btn`),d=e.target.closest(`.delete-inv-btn`);if(t){var n=parseInt(t.getAttribute(`data-id`),10),r=parseFloat(t.getAttribute(`data-stock`))||0,i=t.getAttribute(`data-date`)||``;invEditStock(n,r,i)}if(d){var did=parseInt(d.getAttribute(`data-id`),10),ddate=d.getAttribute(`data-date`)||``;invDeleteStock(did,ddate)}})'

if (app.includes(oldInitInvClickListener)) {
  app = app.replace(oldInitInvClickListener, newInitInvClickListener)
  console.log('✅ Updated initInventoryPage - added delete button listener')
} else if (app.includes('delete-inv-btn')) {
  console.log('✅ initInventoryPage already has delete listener')
}

// 4. 修改 loadReceiptPriceList 函数 - 添加价格日期列
const oldLoadRcp = `async function loadReceiptPriceList(){var e=document.getElementById(\`rcp-table-body\`),t=document.getElementById(\`rcp-count\`),n=document.getElementById(\`rcp-page-size\`);if(n&&n.value&&(rcpPg.pageSize=parseInt(n.value,10)||rcpPg.pageSize),!e)return;E(e,4,\`正在加载收货价格...\`);try{var r=document.getElementById(\`rcp-keyword\`),i=new URLSearchParams;i.set(\`page\`,String(rcpPg.page)),i.set(\`page_size\`,String(rcpPg.pageSize)),r&&r.value&&r.value.trim()&&i.set(\`keyword\`,r.value.trim());var a=z(await Api.request(\`GET\`,\`/tl/warehouse_receipt_prices?\`+i.toString())),o=a.list||[];rcpPg.total=a.total||0,e.innerHTML=\`\`,o.length||D(e,4,\`暂无收货价格数据\`),o.forEach(function(t){var n=v(t,[\`id\`,\`price_id\`]),r=_(t,[\`库房名称\`,\`warehouse_name\`],\`-\`),i=_(t,[\`品类名\`,\`品类名称\`,\`category_name\`],\`-\`),a=Number(_(t,[\`价格\`,\`price\`],null)),o=document.createElement(\`tr\`);o.innerHTML=\`<td>\`+M(r)+\`</td><td>\`+M(i)+\`</td><td>\`+(isNaN(a)?\`-\`:a.toLocaleString())+\`</td><td><button class="btn btn-sm btn-outline edit-btn" data-id="\`+String(n)+\`">编辑</button> <button class="btn btn-sm btn-danger delete-btn" data-id="\`+String(n)+\`">删除</button></td>\`,e.appendChild(o)}),t&&(t.textContent=String(rcpPg.total)),rcpUpdatePager()}catch(n){alert(\`加载收货价格失败: \`+(n.message||String(n))),t&&(t.textContent=\`0\`),e.innerHTML=\`\`,D(e,4,n.message||\`加载失败\`),rcpUpdatePager()}}`

const newLoadRcp = `async function loadReceiptPriceList(){var e=document.getElementById(\`rcp-table-body\`),t=document.getElementById(\`rcp-count\`),n=document.getElementById(\`rcp-page-size\`);if(n&&n.value&&(rcpPg.pageSize=parseInt(n.value,10)||rcpPg.pageSize),!e)return;E(e,5,\`正在加载收货价格...\`);try{var r=document.getElementById(\`rcp-keyword\`),i=new URLSearchParams;i.set(\`page\`,String(rcpPg.page)),i.set(\`page_size\`,String(rcpPg.pageSize)),r&&r.value&&r.value.trim()&&i.set(\`keyword\`,r.value.trim());var a=z(await Api.request(\`GET\`,\`/tl/warehouse_receipt_prices?\`+i.toString())),o=a.list||[];rcpPg.total=a.total||0,e.innerHTML=\`\`,o.length||D(e,5,\`暂无收货价格数据\`),o.forEach(function(t){var n=v(t,[\`id\`,\`price_id\`]),r=_(t,[\`库房名称\`,\`warehouse_name\`],\`-\`),i=_(t,[\`品类名\`,\`品类名称\`,\`category_name\`],\`-\`),a=Number(_(t,[\`价格\`,\`price\`],null)),d=_(t,[\`价格日期\`,\`price_date\`,\`日期\`],\`-\`),o=document.createElement(\`tr\`);o.innerHTML=\`<td>\`+M(r)+\`</td><td>\`+M(i)+\`</td><td>\`+(isNaN(a)?\`-\`:a.toLocaleString())+\`</td><td>\`+M(d)+\`</td><td><button class="btn btn-sm btn-outline edit-btn" data-id="\`+String(n)+\`">编辑</button> <button class="btn btn-sm btn-danger delete-btn" data-id="\`+String(n)+\`">删除</button></td>\`,e.appendChild(o)}),t&&(t.textContent=String(rcpPg.total)),rcpUpdatePager()}catch(n){alert(\`加载收货价格失败: \`+(n.message||String(n))),t&&(t.textContent=\`0\`),e.innerHTML=\`\`,D(e,5,n.message||\`加载失败\`),rcpUpdatePager()}}`

if (app.includes(oldLoadRcp)) {
  app = app.replace(oldLoadRcp, newLoadRcp)
  console.log('✅ Updated loadReceiptPriceList - added price date column')
} else {
  console.log('⚠️ loadReceiptPriceList old version not found, checking if already updated...')
  if (app.includes('price_date')) {
    console.log('✅ loadReceiptPriceList already has price date')
  } else {
    console.log('❌ Could not find loadReceiptPriceList to update')
  }
}

// 保存修改
fs.writeFileSync(appPath, app, 'utf8')
console.log('\n✅ All changes saved to app-BZHDhlyu.js')
