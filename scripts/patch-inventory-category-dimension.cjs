/**
 * 库存 API 品类维度适配：列表/录入/模板/导入
 * Run: node scripts/patch-inventory-category-dimension.cjs
 */
const fs = require('fs')
const path = require('path')

const appPath = path.join(__dirname, '../public/embedded/price_system/assets/app-BZHDhlyu.js')
const indexPath = path.join(__dirname, '../public/embedded/price_system/assets/index-e7CRb-gt.js')

let app = fs.readFileSync(appPath, 'utf8')
let idx = fs.readFileSync(indexPath, 'utf8')
let changed = 0

function rep(label, from, to) {
  if (app.includes(to)) return
  if (!app.includes(from)) {
    console.error(`app: ${label} anchor not found`)
    process.exit(1)
  }
  app = app.split(from).join(to)
  changed++
}

function repIdx(label, from, to) {
  if (idx.includes(to)) return
  if (!idx.includes(from)) {
    console.error(`index: ${label} anchor not found`)
    process.exit(1)
  }
  idx = idx.split(from).join(to)
  changed++
}

repIdx(
  'inv page desc',
  '展示各库房最新库存快照，支持手工录入与 Excel 批量导入',
  '展示各「库房 + 品类」最新库存快照，支持手工录入与 Excel 批量导入',
)
repIdx(
  'inv module desc',
  '维护各库房最新库存，支持手工录入与 Excel 导入',
  '维护库房按品种库存，支持手工录入与 Excel 导入',
)
repIdx(
  'inv filter placeholder',
  '<input type="search" id="inv-keyword" class="form-control" autocomplete="off" placeholder="搜索库房名称" data-v-4b5a159b>',
  '<input type="search" id="inv-keyword" class="form-control" autocomplete="off" placeholder="搜索库房名称或品种名称" data-v-4b5a159b>',
)
repIdx(
  'inv table head',
  '<th data-v-4b5a159b>库房名称</th><th data-v-4b5a159b>库存</th><th data-v-4b5a159b>库存日期</th></tr></thead><tbody id="inv-table-body"',
  '<th data-v-4b5a159b>库房名称</th><th data-v-4b5a159b>回收品种</th><th data-v-4b5a159b>当前库存</th><th data-v-4b5a159b>库存日期</th></tr></thead><tbody id="inv-table-body"',
)

const oldInvFormTail = `            </div>
            <div class="form-group">
                <label for="inv-stock">当前库存（吨） <span class="required">*</span></label>
                <input type="number" step="0.0001" min="0" id="inv-stock" class="form-control" required>
            </div>
            <div class="form-group">
                <label for="inv-date">库存日期</label>
                <input type="date" id="inv-date" class="form-control">
                <small class="text-muted">留空则使用当天</small>
            </div>
        </form>\`}`

const newInvFormTail = `            </div>
            <div class="form-group">
                <label for="inv-category">回收品种 <span class="required">*</span></label>
                <select id="inv-category" class="form-control" required><option value="">请选择品种</option></select>
            </div>
            <div class="form-group">
                <label for="inv-stock">当前库存（吨） <span class="required">*</span></label>
                <input type="number" step="0.0001" min="0" id="inv-stock" class="form-control" required>
            </div>
            <div class="form-group">
                <label for="inv-date">库存日期</label>
                <input type="date" id="inv-date" class="form-control">
                <small class="text-muted">留空则使用定价日历当天</small>
            </div>
        </form>\`}`

rep('invFormHtml tail', oldInvFormTail, newInvFormTail)

const oldLoadList =
  'async function loadInventoryList(){var e=document.getElementById(`inv-table-body`),t=document.getElementById(`inv-count`);if(!e)return;E(e,3,`正在加载库存数据...`);try{var r=document.getElementById(`inv-keyword`),i=new URLSearchParams;i.set(`page`,String(invPg.page)),i.set(`page_size`,String(invPg.pageSize)),r&&r.value&&r.value.trim()&&i.set(`keyword`,r.value.trim());var a=z(await Api.request(`GET`,`/tl/warehouse_inventories?`+i.toString())),o=a.list||[];invPg.total=a.total||0,e.innerHTML=``,o.length||D(e,3,`暂无库存数据`),o.forEach(function(t){var n=_(t,[`库房名称`,`warehouse_name`],`-`),r=Number(_(t,[`当前库存`,`stock`],null)),i=_(t,[`库存日期`,`inventory_date`],``)||`-`,a=document.createElement(`tr`);a.innerHTML=`<td>`+M(n)+`</td><td>`+(isNaN(r)?`-`:r.toLocaleString())+`</td><td>`+M(i)+`</td>`,e.appendChild(a)}),t&&(t.textContent=String(invPg.total)),invUpdatePager()}catch(n){alert(`加载库存失败: `+(n.message||String(n))),t&&(t.textContent=`0`),e.innerHTML=``,D(e,3,n.message||`加载失败`),invUpdatePager()}}'

const newLoadList =
  'async function loadInventoryList(){var e=document.getElementById(`inv-table-body`),t=document.getElementById(`inv-count`);if(!e)return;E(e,4,`正在加载库存数据...`);try{var r=document.getElementById(`inv-keyword`),i=new URLSearchParams;i.set(`page`,String(invPg.page)),i.set(`page_size`,String(invPg.pageSize)),r&&r.value&&r.value.trim()&&i.set(`keyword`,r.value.trim());var a=z(await Api.request(`GET`,`/tl/warehouse_inventories?`+i.toString())),o=a.list||[];invPg.total=a.total||0,e.innerHTML=``,o.length||D(e,4,`暂无库存数据`),o.forEach(function(t){var n=_(t,[`库房名称`,`warehouse_name`],`-`),r=_(t,[`品类名`,`品类名称`,`category_name`,`回收品种`],`-`),i=Number(_(t,[`当前库存`,`stock`],null)),o=_(t,[`库存日期`,`inventory_date`],``)||`-`,a=document.createElement(`tr`);a.innerHTML=`<td>`+M(n)+`</td><td>`+M(r)+`</td><td>`+(isNaN(i)?`-`:i.toLocaleString())+`</td><td>`+M(o)+`</td>`,e.appendChild(a)}),t&&(t.textContent=String(invPg.total)),invUpdatePager()}catch(n){alert(`加载库存失败: `+(n.message||String(n))),t&&(t.textContent=`0`),e.innerHTML=``,D(e,4,n.message||`加载失败`),invUpdatePager()}}'

rep('loadInventoryList', oldLoadList, newLoadList)

const oldManual =
  'async function invManualSubmit(){var e=parseInt(document.getElementById(`inv-warehouse`).value,10),t=parseFloat(document.getElementById(`inv-stock`).value),n=document.getElementById(`inv-date`),r=n&&n.value?n.value.trim():``;if(!e||isNaN(e))throw Error(`请选择库房`);if(isNaN(t)||t<0)throw Error(`请填写有效库存`);var i={库房id:e,当前库存:t};r&&(i.库存日期=r),await Api.request(`POST`,`/tl/warehouse_inventories`,i),invPg.page=1,await loadInventoryList()}'

const newManual =
  'async function invManualSubmit(){var e=parseInt(document.getElementById(`inv-warehouse`).value,10),t=parseInt(document.getElementById(`inv-category`).value,10),n=parseFloat(document.getElementById(`inv-stock`).value),r=document.getElementById(`inv-date`),i=r&&r.value?r.value.trim():``;if(!e||isNaN(e))throw Error(`请选择库房`);if(!t||isNaN(t))throw Error(`请选择回收品种`);if(isNaN(n)||n<0)throw Error(`请填写有效库存`);var a={库房id:e,品类id:t,当前库存:n};i&&(a.库存日期=i),await Api.request(`POST`,`/tl/warehouse_inventories`,a),invPg.page=1,await loadInventoryList()}'

rep('invManualSubmit', oldManual, newManual)

const oldInitOpen =
  'onOpen:async function(){await setupModalWhCombo(`inv`);var e=document.getElementById(`inv-date`);e&&!e.value&&(e.value=kt())}'
const newInitOpen =
  'onOpen:async function(){await setupModalWhCombo(`inv`),await invFillCategorySelect(`inv-category`);var e=document.getElementById(`inv-date`);e&&!e.value&&(e.value=kt())}'

rep('initInventoryPage onOpen', oldInitOpen, newInitOpen)

fs.writeFileSync(appPath, app, 'utf8')
fs.writeFileSync(indexPath, idx, 'utf8')
console.log(`Patched inventory category dimension (${changed} replacements)`)
