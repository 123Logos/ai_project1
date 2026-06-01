/**
 * AI 比价嵌入页：当前库存管理 + 收货价格管理
 * Run: node scripts/patch-inventory-receipt-price-pages.cjs
 */
const fs = require('fs')
const path = require('path')

const appPath = path.join(
  __dirname,
  '../public/embedded/price_system/assets/app-BZHDhlyu.js',
)
const indexPath = path.join(
  __dirname,
  '../public/embedded/price_system/assets/index-e7CRb-gt.js',
)

let app = fs.readFileSync(appPath, 'utf8')
let idx = fs.readFileSync(indexPath, 'utf8')

const PAGE_INV = 'inventory-management'
const PAGE_RCP = 'receipt-price-management'

// --- index: module cards after 库房管理 ---
const warehouseCardEnd =
  '<p data-v-4b5a159b>管理发货库房信息</p></div></div><div class="module-card" data-page="freight-config"'
const warehouseCardWithNew =
  '<p data-v-4b5a159b>管理发货库房信息</p></div></div>' +
  `<div class="module-card" data-page="${PAGE_INV}" data-v-4b5a159b>` +
  '<div class="module-icon" data-v-4b5a159b><i class="fas fa-boxes-stacked" data-v-4b5a159b></i></div>' +
  '<div class="module-info" data-v-4b5a159b><h4 data-v-4b5a159b>当前库存管理</h4>' +
  '<p data-v-4b5a159b>维护各库房最新库存，支持手工录入与 Excel 导入</p></div></div>' +
  `<div class="module-card" data-page="${PAGE_RCP}" data-v-4b5a159b>` +
  '<div class="module-icon" data-v-4b5a159b><i class="fas fa-tags" data-v-4b5a159b></i></div>' +
  '<div class="module-info" data-v-4b5a159b><h4 data-v-4b5a159b>收货价格管理</h4>' +
  '<p data-v-4b5a159b>维护库房按品种回收单价，支持手工录入与 Excel 导入</p></div></div>' +
  '<div class="module-card" data-page="freight-config"'

if (!idx.includes(`data-page="${PAGE_INV}"`)) {
  if (!idx.includes(warehouseCardEnd)) {
    console.error('index: warehouse card anchor not found')
    process.exit(1)
  }
  idx = idx.split(warehouseCardEnd).join(warehouseCardWithNew)
}

// --- index: page templates ---
const invTemplate =
  `<div id="${PAGE_INV}-template" class="hidden-page-template" style="display:none;" data-v-4b5a159b>` +
  '<div class="page-content management-page" data-v-4b5a159b>' +
  '<div class="page-header" data-v-4b5a159b><div data-v-4b5a159b><h3 data-v-4b5a159b>当前库存管理</h3>' +
  '<p data-v-4b5a159b>展示各库房最新库存快照，支持手工录入与 Excel 批量导入</p></div>' +
  '<div class="header-actions" data-v-4b5a159b>' +
  '<button class="btn btn-outline" id="download-inv-template-btn" data-v-4b5a159b><i class="fas fa-download" data-v-4b5a159b></i> 下载导入模板</button>' +
  '<button class="btn btn-outline" id="import-inv-btn" data-v-4b5a159b><i class="fas fa-file-import" data-v-4b5a159b></i> 导入库存表格</button>' +
  '<input type="file" id="inv-import-input" accept=".xlsx,.xls" style="display:none;" data-v-4b5a159b>' +
  '<button class="btn btn-primary" id="add-inv-btn" data-v-4b5a159b><i class="fas fa-plus" data-v-4b5a159b></i> 手工录入</button>' +
  '</div></div>' +
  '<div class="card filter-card" data-v-4b5a159b><div class="card-header" data-v-4b5a159b><h4 data-v-4b5a159b>筛选条件</h4></div>' +
  '<div class="card-body" data-v-4b5a159b><div class="form-row freight-filter-toolbar" data-v-4b5a159b>' +
  '<div class="form-group" data-v-4b5a159b><label for="inv-keyword" data-v-4b5a159b>库房名称</label>' +
  '<input type="search" id="inv-keyword" class="form-control" autocomplete="off" placeholder="模糊搜索库房名称" data-v-4b5a159b></div>' +
  '<div class="form-group" data-v-4b5a159b><label for="inv-page-size" data-v-4b5a159b>每页条数</label>' +
  '<select id="inv-page-size" class="form-control" data-v-4b5a159b><option value="20" selected data-v-4b5a159b>20</option><option value="50" data-v-4b5a159b>50</option><option value="100" data-v-4b5a159b>100</option></select></div>' +
  '<div class="form-group freight-filter-actions" data-v-4b5a159b><label data-v-4b5a159b>\xA0</label>' +
  '<div class="form-actions" data-v-4b5a159b><button type="button" class="btn btn-secondary" id="inv-reset-btn" data-v-4b5a159b>重置</button>' +
  '<button type="button" class="btn btn-primary" id="inv-search-btn" data-v-4b5a159b><i class="fas fa-search" data-v-4b5a159b></i> 查询</button></div></div></div></div></div>' +
  '<div class="card" data-v-4b5a159b><div class="card-header" data-v-4b5a159b><h4 data-v-4b5a159b>库存列表</h4>' +
  '<span class="record-count" data-v-4b5a159b>共 <span id="inv-count" data-v-4b5a159b>0</span> 条记录</span></div>' +
  '<div class="card-body" data-v-4b5a159b><div class="table-responsive" data-v-4b5a159b>' +
  '<table class="data-table" data-v-4b5a159b><thead data-v-4b5a159b><tr data-v-4b5a159b>' +
  '<th data-v-4b5a159b>库房名称</th><th data-v-4b5a159b>回收品种</th><th data-v-4b5a159b>库存</th><th data-v-4b5a159b>库存日期</th><th data-v-4b5a159b>操作</th>' +
  '</tr></thead><tbody id="inv-table-body" data-v-4b5a159b></tbody></table></div>' +
  '<div class="table-footer freight-table-footer" data-v-4b5a159b><span id="inv-page-info" data-v-4b5a159b>—</span>' +
  '<div class="freight-pagination" data-v-4b5a159b><button type="button" class="btn btn-outline btn-sm" id="inv-prev-btn" data-v-4b5a159b>上一页</button>' +
  '<button type="button" class="btn btn-outline btn-sm" id="inv-next-btn" data-v-4b5a159b>下一页</button></div></div></div></div></div></div>'

const rcpTemplate =
  `<div id="${PAGE_RCP}-template" class="hidden-page-template" style="display:none;" data-v-4b5a159b>` +
  '<div class="page-content management-page" data-v-4b5a159b>' +
  '<div class="page-header" data-v-4b5a159b><div data-v-4b5a159b><h3 data-v-4b5a159b>收货价格管理</h3>' +
  '<p data-v-4b5a159b>维护库房按品种回收单价（元/吨），支持手工录入与 Excel 批量导入</p></div>' +
  '<div class="header-actions" data-v-4b5a159b>' +
  '<button class="btn btn-outline" id="download-rcp-template-btn" data-v-4b5a159b><i class="fas fa-download" data-v-4b5a159b></i> 下载导入模板</button>' +
  '<button class="btn btn-outline" id="import-rcp-btn" data-v-4b5a159b><i class="fas fa-file-import" data-v-4b5a159b></i> 导入价格表格</button>' +
  '<input type="file" id="rcp-import-input" accept=".xlsx,.xls" style="display:none;" data-v-4b5a159b>' +
  '<button class="btn btn-primary" id="add-rcp-btn" data-v-4b5a159b><i class="fas fa-plus" data-v-4b5a159b></i> 手工录入</button>' +
  '</div></div>' +
  '<div class="card filter-card" data-v-4b5a159b><div class="card-header" data-v-4b5a159b><h4 data-v-4b5a159b>筛选条件</h4></div>' +
  '<div class="card-body" data-v-4b5a159b><div class="form-row freight-filter-toolbar" data-v-4b5a159b>' +
  '<div class="form-group" data-v-4b5a159b><label for="rcp-keyword" data-v-4b5a159b>关键字</label>' +
  '<input type="search" id="rcp-keyword" class="form-control" autocomplete="off" placeholder="库房名称或品种名称" data-v-4b5a159b></div>' +
  '<div class="form-group" data-v-4b5a159b><label for="rcp-page-size" data-v-4b5a159b>每页条数</label>' +
  '<select id="rcp-page-size" class="form-control" data-v-4b5a159b><option value="20" selected data-v-4b5a159b>20</option><option value="50" data-v-4b5a159b>50</option><option value="100" data-v-4b5a159b>100</option></select></div>' +
  '<div class="form-group freight-filter-actions" data-v-4b5a159b><label data-v-4b5a159b>\xA0</label>' +
  '<div class="form-actions" data-v-4b5a159b><button type="button" class="btn btn-secondary" id="rcp-reset-btn" data-v-4b5a159b>重置</button>' +
  '<button type="button" class="btn btn-primary" id="rcp-search-btn" data-v-4b5a159b><i class="fas fa-search" data-v-4b5a159b></i> 查询</button></div></div></div></div></div>' +
  '<div class="card" data-v-4b5a159b><div class="card-header" data-v-4b5a159b><h4 data-v-4b5a159b>收货价格列表</h4>' +
  '<span class="record-count" data-v-4b5a159b>共 <span id="rcp-count" data-v-4b5a159b>0</span> 条记录</span></div>' +
  '<div class="card-body" data-v-4b5a159b><div class="table-responsive" data-v-4b5a159b>' +
  '<table class="data-table" data-v-4b5a159b><thead data-v-4b5a159b><tr data-v-4b5a159b>' +
  '<th data-v-4b5a159b>库房名称</th><th data-v-4b5a159b>回收品种</th><th data-v-4b5a159b>价格</th><th data-v-4b5a159b>价格日期</th><th data-v-4b5a159b>操作</th>' +
  '</tr></thead><tbody id="rcp-table-body" data-v-4b5a159b></tbody></table></div>' +
  '<div class="table-footer freight-table-footer" data-v-4b5a159b><span id="rcp-page-info" data-v-4b5a159b>—</span>' +
  '<div class="freight-pagination" data-v-4b5a159b><button type="button" class="btn btn-outline btn-sm" id="rcp-prev-btn" data-v-4b5a159b>上一页</button>' +
  '<button type="button" class="btn btn-outline btn-sm" id="rcp-next-btn" data-v-4b5a159b>下一页</button></div></div></div></div></div></div>'

const templateAnchor = '<div id="price-comparison-template"'
if (!idx.includes(`${PAGE_INV}-template`)) {
  if (!idx.includes(templateAnchor)) {
    console.error('index: price-comparison-template anchor not found')
    process.exit(1)
  }
  idx = idx.split(templateAnchor).join(invTemplate + rcpTemplate + templateAnchor)
}

// --- app: pagination state ---
const oldPgState = 'o={page:1,pageSize:50,total:0},s={},c={}'
const newPgState =
  'o={page:1,pageSize:50,total:0},invPg={page:1,pageSize:20,total:0},rcpPg={page:1,pageSize:20,total:0},s={},c={}'
if (!app.includes('invPg=')) {
  if (!app.includes(oldPgState)) {
    console.error('app: pagination state anchor not found')
    process.exit(1)
  }
  app = app.split(oldPgState).join(newPgState)
}

// --- app: page title map ---
const oldFe =
  '"price-comparison":`智能比价工具`}[e]||`内部版`}`'
const newFe =
  `"${PAGE_INV}":\`当前库存管理\`,"${PAGE_RCP}":\`收货价格管理\`,"price-comparison":\`智能比价工具\`}[e]||\`内部版\`}\``
if (!app.includes(PAGE_INV)) {
  if (!app.includes(oldFe)) {
    console.error('app: Fe() title map anchor not found')
    process.exit(1)
  }
  app = app.split(oldFe).join(newFe)
}

// --- app: Ie switch ---
const oldIe =
  'case`price-comparison`:Ge();break}}function Le(){'
const newIe =
  `case\`${PAGE_INV}\`:initInventoryPage();break;case\`${PAGE_RCP}\`:initReceiptPricePage();break;case\`price-comparison\`:Ge();break}}function Le(){`
if (!app.includes('initInventoryPage()')) {
  if (!app.includes(oldIe)) {
    console.error('app: Ie() switch anchor not found')
    process.exit(1)
  }
  app = app.split(oldIe).join(newIe)
}

// --- app: Ctrl+N shortcuts ---
const oldNe =
  '"tax-config":`add-tax-config-btn`}[e],r=n?document.getElementById(n):null;'
const newNe =
  `"${PAGE_INV}":\`add-inv-btn\`,"${PAGE_RCP}":\`add-rcp-btn\`,"tax-config":\`add-tax-config-btn\`}[e],r=n?document.getElementById(n):null;`
if (!app.includes('add-inv-btn')) {
  if (!app.includes(oldNe)) {
    console.error('app: Ne() shortcut anchor not found')
    process.exit(1)
  }
  app = app.split(oldNe).join(newNe)
}

// --- app: page logic ---
const pageLogic = `
function invFormHtml(){return\`
        <form id="inv-manual-form">
            <div class="form-group">
                <label for="inv-warehouse">库房 <span class="required">*</span></label>
                <select id="inv-warehouse" class="form-control" required><option value="">请选择库房</option></select>
            </div>
            <div class="form-group">
                <label for="inv-stock">当前库存（吨） <span class="required">*</span></label>
                <input type="number" step="0.0001" min="0" id="inv-stock" class="form-control" required>
            </div>
            <div class="form-group">
                <label for="inv-date">库存日期</label>
                <input type="date" id="inv-date" class="form-control">
                <small class="text-muted">留空则使用当天</small>
            </div>
        </form>\`}
function rcpFormHtml(){return\`
        <form id="rcp-manual-form">
            <div class="form-group">
                <label for="rcp-warehouse">库房 <span class="required">*</span></label>
                <select id="rcp-warehouse" class="form-control" required><option value="">请选择库房</option></select>
            </div>
            <div class="form-group">
                <label for="rcp-category">回收品种 <span class="required">*</span></label>
                <select id="rcp-category" class="form-control" required><option value="">请选择品种</option></select>
            </div>
            <div class="form-group">
                <label for="rcp-price">价格（元/吨） <span class="required">*</span></label>
                <input type="number" step="0.01" min="0" id="rcp-price" class="form-control" required>
            </div>
        </form>\`}
function rcpEditFormHtml(){return\`
        <form id="rcp-edit-form">
            <div class="form-group">
                <label for="rcp-edit-price">价格（元/吨） <span class="required">*</span></label>
                <input type="number" step="0.01" min="0" id="rcp-edit-price" class="form-control" required>
            </div>
        </form>\`}
async function invFillWarehouseSelect(e){var t=document.getElementById(e);if(!t)return;var n=await Api.request(\`GET\`,\`/tl/get_warehouses\`),r=Api.unwrapList(n).filter(function(e){return!b(T(e))});t.innerHTML=\`<option value="">请选择库房</option>\`+r.map(function(e){var n=w(e),r=T(e);return n?\`<option value="\`+String(n)+\`">\`+M(r||\`库房 #\`+n)+\`</option>\`:\`\`}).join(\`\`)}
async function invFillCategorySelect(e){var t=document.getElementById(e);if(!t)return;var n=await Api.request(\`GET\`,\`/tl/get_category_mapping\`),r=V(Api.unwrapData(n)||{}).list,i=ue(se(Array.isArray(r)?r:[]));t.innerHTML=\`<option value="">请选择品种</option>\`+i.map(function(e){var t=e.id,n=String(e.name||\`\`).trim();return t!=null&&!isNaN(Number(t))&&n?\`<option value="\`+String(t)+\`">\`+M(n)+\`</option>\`:\`\`}).join(\`\`)}
function invUpdatePager(){var e=document.getElementById(\`inv-page-info\`),t=document.getElementById(\`inv-prev-btn\`),n=document.getElementById(\`inv-next-btn\`),r=Math.max(1,Math.ceil((invPg.total||0)/invPg.pageSize));e&&(e.textContent=\`第 \`+invPg.page+\` / \`+r+\` 页（共 \`+invPg.total+\` 条）\`),t&&(t.disabled=invPg.page<=1),n&&(n.disabled=invPg.page>=r)}
async function loadInventoryList(){var e=document.getElementById(\`inv-table-body\`),t=document.getElementById(\`inv-count\`),n=document.getElementById(\`inv-page-size\`);if(n&&n.value&&(invPg.pageSize=parseInt(n.value,10)||invPg.pageSize),!e)return;E(e,4,\`正在加载库存数据...\`);try{var r=document.getElementById(\`inv-keyword\`),i=new URLSearchParams;i.set(\`page\`,String(invPg.page)),i.set(\`page_size\`,String(invPg.pageSize)),r&&r.value&&r.value.trim()&&i.set(\`keyword\`,r.value.trim());var a=z(await Api.request(\`GET\`,\`/tl/warehouse_inventories?\`+i.toString())),o=a.list||[];invPg.total=a.total||0,e.innerHTML=\`\`,o.length||D(e,4,\`暂无库存数据\`),o.forEach(function(t){var n=v(t,[\`id\`,\`record_id\`]),r=_(t,[\`库房名称\`,\`warehouse_name\`],\`-\`),i=Number(_(t,[\`当前库存\`,\`stock\`],null)),a=_(t,[\`库存日期\`,\`inventory_date\`],\`\`)||\`-\`,s=document.createElement(\`tr\`);s.innerHTML=\`<td>\`+M(r)+\`</td><td>\`+(isNaN(i)?\`-\`:i.toLocaleString())+\`</td><td>\`+M(a)+\`</td><td><button class="btn btn-sm btn-outline edit-inv-btn" data-id="\`+String(n)+\`" data-stock="\`+String(isNaN(i)?0:i)+\`" data-date="\`+M(a)+\`">修改</button></td>\`,e.appendChild(s)}),t&&(t.textContent=String(invPg.total)),invUpdatePager()}catch(n){alert(\`加载库存失败: \`+(n.message||String(n))),t&&(t.textContent=\`0\`),e.innerHTML=\`\`,D(e,4,n.message||\`加载失败\`),invUpdatePager()}}
async function invManualSubmit(){var e=parseInt(document.getElementById(\`inv-warehouse\`).value,10),t=parseFloat(document.getElementById(\`inv-stock\`).value),n=document.getElementById(\`inv-date\`),r=n&&n.value?n.value.trim():\`\`;if(!e||isNaN(e))throw Error(\`请选择库房\`);if(isNaN(t)||t<0)throw Error(\`请填写有效库存\`);var i={库房id:e,当前库存:t};r&&(i.库存日期=r),await Api.request(\`POST\`,\`/tl/warehouse_inventories\`,i),invPg.page=1,await loadInventoryList()}
function invEditFormHtml(){return\`
        <form id="inv-edit-form">
            <div class="form-group">
                <label for="inv-edit-stock">当前库存（吨） <span class="required">*</span></label>
                <input type="number" step="0.0001" min="0" id="inv-edit-stock" class="form-control" required>
            </div>
            <div class="form-group">
                <label for="inv-edit-date">库存日期</label>
                <input type="date" id="inv-edit-date" class="form-control">
            </div>
        </form>\`}
function invEditStock(e,t,n){U(\`修改库存\`,invEditFormHtml(),{onOpen:function(){var r=document.getElementById(\`inv-edit-stock\`);r&&!isNaN(t)&&(r.value=String(t));var i=document.getElementById(\`inv-edit-date\`);i&&n&&n!==\`-\`&&(i.value=n)},onConfirm:async function(){var t=parseFloat(document.getElementById(\`inv-edit-stock\`).value),n=document.getElementById(\`inv-edit-date\`),r=n&&n.value?n.value.trim():\`\`;if(isNaN(t)||t<0)throw Error(\`请填写有效库存\`);var i={库房id:e,当前库存:t};r&&(i.库存日期=r),await Api.request(\`POST\`,\`/tl/warehouse_inventories\`,i),await loadInventoryList()}})}
async function invDownloadTemplate(){try{var e=await Api.getBlob(\`/tl/download_warehouse_inventory_template_excel\`),t=window.URL.createObjectURL(e),n=document.createElement(\`a\`);n.href=t,n.download=\`库房库存导入模板.xlsx\`,document.body.appendChild(n),n.click(),n.remove(),window.URL.revokeObjectURL(t)}catch(e){alert(\`下载模板失败: \`+(e.message||String(e)))}}
async function invImportExcel(e){var t=e&&e[0];if(!t)return;if(!/\\.(xlsx|xls)$/i.test(String(t.name||\`\`))){alert(\`请上传 Excel 文件（.xlsx/.xls）\`);return}var n=document.getElementById(\`import-inv-btn\`),r=n?n.innerHTML:\`\`;n&&(n.disabled=!0,n.innerHTML=\`<i class="fas fa-spinner fa-spin"></i> 导入中...\`);try{var i=new FormData;i.append(\`file\`,t);var o=await Api.request(\`POST\`,\`/tl/import_warehouse_inventory_excel\`,i),s=_(o,[\`msg\`,\`message\`],\`\`)||_(Api.unwrapData(o),[\`msg\`,\`message\`],\`\`);alert(s||\`导入成功\`),invPg.page=1,await loadInventoryList()}catch(e){alert(\`导入失败: \`+(e.message||String(e)))}finally{n&&(n.disabled=!1,n.innerHTML=r||\`<i class="fas fa-file-import"></i> 导入库存表格\`)}}
function initInventoryPage(){console.log(\`初始化当前库存管理页面\`);var e=document.getElementById(\`add-inv-btn\`);e&&e.addEventListener(\`click\`,function(){U(\`手工录入库存\`,invFormHtml(),{onOpen:async function(){await invFillWarehouseSelect(\`inv-warehouse\`);var e=document.getElementById(\`inv-date\`);e&&!e.value&&(e.value=kt())},onConfirm:function(){return invManualSubmit()}})});var t=document.getElementById(\`download-inv-template-btn\`);t&&t.addEventListener(\`click\`,function(){invDownloadTemplate()});var n=document.getElementById(\`import-inv-btn\`),r=document.getElementById(\`inv-import-input\`);n&&r&&(n.addEventListener(\`click\`,function(){r.click()}),r.addEventListener(\`change\`,function(e){invImportExcel(e&&e.target?e.target.files:null),r.value=\`\`}));var i=document.getElementById(\`inv-table-body\`);i&&i.addEventListener(\`click\`,function(e){var t=e.target.closest(\`.edit-inv-btn\`);if(t){var n=parseInt(t.getAttribute(\`data-id\`),10),r=parseFloat(t.getAttribute(\`data-stock\`))||0,i=t.getAttribute(\`data-date\`)||\`\`;invEditStock(n,r,i)}});var a=document.getElementById(\`inv-search-btn\`);a&&a.addEventListener(\`click\`,function(){invPg.page=1,loadInventoryList()});var o=document.getElementById(\`inv-reset-btn\`);o&&o.addEventListener(\`click\`,function(){var e=document.getElementById(\`inv-keyword\`);e&&(e.value=\`\`),invPg.page=1,loadInventoryList()});var s=document.getElementById(\`inv-prev-btn\`);s&&s.addEventListener(\`click\`,function(){invPg.page>1&&(--invPg.page,loadInventoryList())});var c=document.getElementById(\`inv-next-btn\`);c&&c.addEventListener(\`click\`,function(){invPg.page+=1,loadInventoryList()});var l=document.getElementById(\`inv-page-size\`);l&&l.addEventListener(\`change\`,function(){invPg.pageSize=parseInt(this.value,10)||20,invPg.page=1,loadInventoryList()});var u=document.getElementById(\`inv-keyword\`);u&&u.addEventListener(\`keydown\`,function(e){e.key===\`Enter\`&&(e.preventDefault(),invPg.page=1,loadInventoryList())}),loadInventoryList()}
function rcpUpdatePager(){var e=document.getElementById(\`rcp-page-info\`),t=document.getElementById(\`rcp-prev-btn\`),n=document.getElementById(\`rcp-next-btn\`),r=Math.max(1,Math.ceil((rcpPg.total||0)/rcpPg.pageSize));e&&(e.textContent=\`第 \`+rcpPg.page+\` / \`+r+\` 页（共 \`+rcpPg.total+\` 条）\`),t&&(t.disabled=rcpPg.page<=1),n&&(n.disabled=rcpPg.page>=r)}
async function loadReceiptPriceList(){var e=document.getElementById(\`rcp-table-body\`),t=document.getElementById(\`rcp-count\`),n=document.getElementById(\`rcp-page-size\`);if(n&&n.value&&(rcpPg.pageSize=parseInt(n.value,10)||rcpPg.pageSize),!e)return;E(e,4,\`正在加载收货价格...\`);try{var r=document.getElementById(\`rcp-keyword\`),i=new URLSearchParams;i.set(\`page\`,String(rcpPg.page)),i.set(\`page_size\`,String(rcpPg.pageSize)),r&&r.value&&r.value.trim()&&i.set(\`keyword\`,r.value.trim());var a=z(await Api.request(\`GET\`,\`/tl/warehouse_receipt_prices?\`+i.toString())),o=a.list||[];rcpPg.total=a.total||0,e.innerHTML=\`\`,o.length||D(e,4,\`暂无收货价格数据\`),o.forEach(function(t){var n=v(t,[\`id\`,\`price_id\`]),r=_(t,[\`库房名称\`,\`warehouse_name\`],\`-\`),i=_(t,[\`品类名\`,\`品类名称\`,\`category_name\`],\`-\`),a=Number(_(t,[\`价格\`,\`price\`],null)),o=document.createElement(\`tr\`);o.innerHTML=\`<td>\`+M(r)+\`</td><td>\`+M(i)+\`</td><td>\`+(isNaN(a)?\`-\`:a.toLocaleString())+\`</td><td><button class="btn btn-sm btn-outline edit-btn" data-id="\`+String(n)+\`">编辑</button> <button class="btn btn-sm btn-danger delete-btn" data-id="\`+String(n)+\`">删除</button></td>\`,e.appendChild(o)}),t&&(t.textContent=String(rcpPg.total)),rcpUpdatePager()}catch(n){alert(\`加载收货价格失败: \`+(n.message||String(n))),t&&(t.textContent=\`0\`),e.innerHTML=\`\`,D(e,4,n.message||\`加载失败\`),rcpUpdatePager()}}
async function rcpManualSubmit(){var e=parseInt(document.getElementById(\`rcp-warehouse\`).value,10),t=parseInt(document.getElementById(\`rcp-category\`).value,10),n=parseFloat(document.getElementById(\`rcp-price\`).value);if(!e||isNaN(e))throw Error(\`请选择库房\`);if(!t||isNaN(t))throw Error(\`请选择回收品种\`);if(isNaN(n)||n<0)throw Error(\`请填写有效价格\`);await Api.request(\`POST\`,\`/tl/warehouse_receipt_prices\`,{库房id:e,品类id:t,价格:n}),rcpPg.page=1,await loadReceiptPriceList()}
function rcpEditPrice(e,t){U(\`编辑收货价格\`,rcpEditFormHtml(),{onOpen:function(){var n=document.getElementById(\`rcp-edit-price\`);n&&!isNaN(t)&&(n.value=String(t))},onConfirm:async function(){var t=parseFloat(document.getElementById(\`rcp-edit-price\`).value);if(isNaN(t)||t<0)throw Error(\`请填写有效价格\`);await Api.request(\`PUT\`,\`/tl/warehouse_receipt_prices/\`+String(e),{价格:t}),await loadReceiptPriceList()}})}
async function rcpDeletePrice(e){if(!e||isNaN(e))return;if(!confirm(\`确定删除该收货价格记录？\`))return;try{await Api.request(\`DELETE\`,\`/tl/warehouse_receipt_prices/\`+String(e)),await loadReceiptPriceList()}catch(e){alert(\`删除失败: \`+(e.message||String(e)))}}
async function rcpDownloadTemplate(){try{var e=await Api.getBlob(\`/tl/download_warehouse_receipt_prices_template_excel\`),t=window.URL.createObjectURL(e),n=document.createElement(\`a\`);n.href=t,n.download=\`库房收货价格导入模板.xlsx\`,document.body.appendChild(n),n.click(),n.remove(),window.URL.revokeObjectURL(t)}catch(e){alert(\`下载模板失败: \`+(e.message||String(e)))}}
async function rcpImportExcel(e){var t=e&&e[0];if(!t)return;if(!/\\.(xlsx|xls)$/i.test(String(t.name||\`\`))){alert(\`请上传 Excel 文件（.xlsx/.xls）\`);return}var n=document.getElementById(\`import-rcp-btn\`),r=n?n.innerHTML:\`\`;n&&(n.disabled=!0,n.innerHTML=\`<i class="fas fa-spinner fa-spin"></i> 导入中...\`);try{var i=new FormData;i.append(\`file\`,t);var a=await Api.request(\`POST\`,\`/tl/import_warehouse_receipt_prices_excel\`,i),o=_(a,[\`msg\`,\`message\`],\`\`)||_(Api.unwrapData(a),[\`msg\`,\`message\`],\`\`);alert(o||\`导入成功\`),rcpPg.page=1,await loadReceiptPriceList()}catch(e){alert(\`导入失败: \`+(e.message||String(e)))}finally{n&&(n.disabled=!1,n.innerHTML=r||\`<i class="fas fa-file-import"></i> 导入价格表格\`)}}
function initReceiptPricePage(){console.log(\`初始化收货价格管理页面\`);var e=document.getElementById(\`add-rcp-btn\`);e&&e.addEventListener(\`click\`,function(){U(\`手工录入收货价格\`,rcpFormHtml(),{onOpen:async function(){await invFillWarehouseSelect(\`rcp-warehouse\`),await invFillCategorySelect(\`rcp-category\`)},onConfirm:function(){return rcpManualSubmit()}})});var t=document.getElementById(\`download-rcp-template-btn\`);t&&t.addEventListener(\`click\`,function(){rcpDownloadTemplate()});var n=document.getElementById(\`import-rcp-btn\`),r=document.getElementById(\`rcp-import-input\`);n&&r&&(n.addEventListener(\`click\`,function(){r.click()}),r.addEventListener(\`change\`,function(e){rcpImportExcel(e&&e.target?e.target.files:null),r.value=\`\`}));var i=document.getElementById(\`rcp-table-body\`);i&&i.addEventListener(\`click\`,function(e){var t=e.target.closest(\`.edit-btn\`),n=e.target.closest(\`.delete-btn\`);if(t){var r=parseInt(t.getAttribute(\`data-id\`),10),i=t.closest(\`tr\`),a=i&&i.children&&i.children[2]?parseFloat(String(i.children[2].textContent||\`\`).replace(/,/g,\`\`)):NaN;rcpEditPrice(r,a)}n&&rcpDeletePrice(parseInt(n.getAttribute(\`data-id\`),10))});var a=document.getElementById(\`rcp-search-btn\`);a&&a.addEventListener(\`click\`,function(){rcpPg.page=1,loadReceiptPriceList()});var o=document.getElementById(\`rcp-reset-btn\`);o&&o.addEventListener(\`click\`,function(){var e=document.getElementById(\`rcp-keyword\`);e&&(e.value=\`\`),rcpPg.page=1,loadReceiptPriceList()});var s=document.getElementById(\`rcp-prev-btn\`);s&&s.addEventListener(\`click\`,function(){rcpPg.page>1&&(--rcpPg.page,loadReceiptPriceList())});var c=document.getElementById(\`rcp-next-btn\`);c&&c.addEventListener(\`click\`,function(){rcpPg.page+=1,loadReceiptPriceList()});var l=document.getElementById(\`rcp-page-size\`);l&&l.addEventListener(\`change\`,function(){rcpPg.pageSize=parseInt(this.value,10)||20,rcpPg.page=1,loadReceiptPriceList()});var u=document.getElementById(\`rcp-keyword\`);u&&u.addEventListener(\`keydown\`,function(e){e.key===\`Enter\`&&(e.preventDefault(),rcpPg.page=1,loadReceiptPriceList())}),loadReceiptPriceList()}
`

const logicAnchor = 'console.log(`AI智能比价系统逻辑已加载完成`);'
if (!app.includes(logicAnchor)) {
  console.error('app: logic anchor not found')
  process.exit(1)
}

// 删除旧的函数（如果存在）
if (app.includes('function initInventoryPage()')) {
  // 删除旧的 loadInventoryList 函数
  const oldLoadListStart = app.indexOf('async function loadInventoryList()')
  const oldLoadListEnd = app.indexOf('async function invManualSubmit()', oldLoadListStart)
  if (oldLoadListStart !== -1 && oldLoadListEnd !== -1) {
    app = app.substring(0, oldLoadListStart) + app.substring(oldLoadListEnd)
  }

  // 删除旧的 invManualSubmit 函数
  const oldManualSubmitStart = app.indexOf('async function invManualSubmit()')
  const oldManualSubmitEnd = app.indexOf('function invEditFormHtml()', oldManualSubmitStart)
  if (oldManualSubmitStart !== -1 && oldManualSubmitEnd !== -1) {
    app = app.substring(0, oldManualSubmitStart) + app.substring(oldManualSubmitEnd)
  }

  // 删除旧的 invEditFormHtml 函数（如果存在）
  if (app.includes('function invEditFormHtml()')) {
    const oldEditFormStart = app.indexOf('function invEditFormHtml()')
    const oldEditFormEnd = app.indexOf('function invEditStock(', oldEditFormStart)
    if (oldEditFormStart !== -1 && oldEditFormEnd !== -1) {
      app = app.substring(0, oldEditFormStart) + app.substring(oldEditFormEnd)
    }
  }

  // 删除旧的 invEditStock 函数（如果存在）
  if (app.includes('function invEditStock(')) {
    const oldEditStockStart = app.indexOf('function invEditStock(')
    const oldEditStockEnd = app.indexOf('async function invDownloadTemplate()', oldEditStockStart)
    if (oldEditStockStart !== -1 && oldEditStockEnd !== -1) {
      app = app.substring(0, oldEditStockStart) + app.substring(oldEditStockEnd)
    }
  }

  // 删除旧的 initInventoryPage 函数
  const oldInitStart = app.indexOf('function initInventoryPage()')
  const oldInitEnd = app.indexOf('function rcpUpdatePager()', oldInitStart)
  if (oldInitStart !== -1 && oldInitEnd !== -1) {
    app = app.substring(0, oldInitStart) + app.substring(oldInitEnd)
  }
}

// 添加新的函数
app = app.split(logicAnchor).join(pageLogic + logicAnchor)

fs.writeFileSync(appPath, app, 'utf8')
fs.writeFileSync(indexPath, idx, 'utf8')
console.log('Patched inventory-management + receipt-price-management pages')
