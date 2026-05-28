/**
 * 修复上传报价页：冶炼厂下拉可选、品种改为下拉（仅主名称）
 * Run: node scripts/patch-quote-upload-manual.cjs
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

// --- index: 品种 input -> select（保留 Vue scoped 属性，避免残留 data-v-…> 文本） ---
const oldCategoryInput =
  '<input type="text" id="manual-category-name" class="form-control" placeholder="固定品种或别名" data-v-4b5a159b>'
const newCategorySelect =
  '<select id="manual-category-name" class="form-control" data-v-4b5a159b><option value="">请选择品种</option></select>'
if (!idx.includes(oldCategoryInput)) {
  const brokenSelect =
    '<select id="manual-category-name" class="form-control"><option value="">请选择品种</option></select> data-v-4b5a159b>'
  const fixedSelect =
    '<select id="manual-category-name" class="form-control" data-v-4b5a159b><option value="">请选择品种</option></select>'
  if (idx.includes(brokenSelect)) {
    idx = idx.split(brokenSelect).join(fixedSelect)
  } else if (
    !idx.includes(
      '<select id="manual-category-name" class="form-control" data-v-4b5a159b>',
    )
  ) {
    console.error('index: manual-category field not found')
    process.exit(1)
  }
} else {
  idx = idx.split(oldCategoryInput).join(newCategorySelect)
}

// --- app: 冶炼厂 label 点击后立即被 outside 关闭 ---
const oldOutside =
  'msddOutsideHandler=function(e){var r=document.querySelector(`.manual-smelter-dd`),p=document.getElementById(`manual-smelter-panel`);if(!r||!p)return;var v=p.style.display;if(v===`none`||!v||v===``)return;r.contains(e.target)||msddClose()}'
const newOutside =
  'msddOutsideHandler=function(e){var r=document.querySelector(`.manual-smelter-dd`),p=document.getElementById(`manual-smelter-panel`),lb=document.querySelector(`label[for="manual-smelter-trigger"]`);if(!r||!p)return;var v=p.style.display;if(v===`none`||!v||v===``)return;if(r.contains(e.target)||p.contains(e.target)||lb&&lb.contains(e.target))return;msddClose()}'
if (!app.includes(oldOutside)) {
  console.error('app: msddOutsideHandler not found')
  process.exit(1)
}
app = app.split(oldOutside).join(newOutside)

const oldLabelClick =
  'lb.addEventListener(`click`,function(e){e.preventDefault(),msddToggle()})'
const newLabelClick =
  'lb.addEventListener(`click`,function(e){e.preventDefault(),e.stopPropagation(),msddToggle()})'
if (!app.includes(oldLabelClick)) {
  console.error('app: label click handler not found')
  process.exit(1)
}
app = app.split(oldLabelClick).join(newLabelClick)

// --- app: 行点击阻止冒泡，避免偶发 outside 误关 ---
const oldRowClick =
  'n.addEventListener(`click`,function(){var i=parseInt(n.getAttribute(`data-sid`),10),a=qS.find(function(e){return S(e)===i});'
const newRowClick =
  'n.addEventListener(`mousedown`,function(e){e.stopPropagation()}),n.addEventListener(`click`,function(e){e.stopPropagation();var i=parseInt(n.getAttribute(`data-sid`),10),a=qS.find(function(e){return S(e)===i});'
if (!app.includes(oldRowClick)) {
  console.error('app: smelter row click not found')
  process.exit(1)
}
app = app.split(oldRowClick).join(newRowClick)

// --- app: 品种下拉加载 ---
const loadCategoryFn =
  'async function loadManualCategorySelect(){var sel=document.getElementById(`manual-category-name`);if(!sel||sel.tagName!==`SELECT`)return;try{await L();var resp=await Api.request(`GET`,`/tl/get_category_mapping`);var rawList=V(Api.unwrapData(resp)||{}).list;var list=ue(se(Array.isArray(rawList)?rawList:[]));sel.innerHTML=`<option value="">请选择品种</option>`+list.map(function(c){var id=c.id,n=String(c.name||``).trim();if(id==null||isNaN(Number(id))||!n)return``;return`<option value="`+String(id)+`">`+M(n)+`</option>`}).join(``)}catch(err){console.error(`loadManualCategorySelect`,err)}}'
const insertBefore = 'async function ns(){'
if (!app.includes(insertBefore)) {
  console.error('app: ns() anchor not found')
  process.exit(1)
}
if (!app.includes('function loadManualCategorySelect(') && !app.includes('async function loadManualCategorySelect(')) {
  app = app.split(insertBefore).join(loadCategoryFn + insertBefore)
}

// --- app: He() 防重复绑定 + 加载品种 ---
const oldHeTail =
  'f&&f.addEventListener(`click`,async function(){try{await Qn()}catch(e){alert(e.message||String(e))}});msddWire(),ns().catch(function(e){console.error(e)});'
const newHeTail =
  'f&&!f.dataset.manualQuoteSubmitWired&&(f.dataset.manualQuoteSubmitWired=`1`,f.addEventListener(`click`,async function(){try{await Qn()}catch(e){alert(e.message||String(e))}}));msddWire(),ns().catch(function(e){console.error(e)}),loadManualCategorySelect().catch(function(e){console.error(e)});'
if (!app.includes(oldHeTail)) {
  console.error('app: He() tail not found')
  process.exit(1)
}
app = app.split(oldHeTail).join(newHeTail)

// --- app: Qn() 从下拉读取品类 ---
const oldQnCat =
  'let l=n&&n.value?n.value.trim():``;if(!l)throw Error(`请填写品种`);if(!I({品类:l}))throw Error(`该品种不在「固定十个品种（含别名）」范围内。`);let u={冶炼厂id:smelterId,冶炼厂名:c,冶炼厂:c,factory_name:c,smelter_name:c,品类名:l,品类:l,category_name:l}'
const newQnCat =
  'let catId=NaN,l=``;if(n&&n.tagName===`SELECT`){catId=parseInt(String(n.value||``).trim(),10);var catOpt=n.selectedOptions&&n.selectedOptions[0];l=catOpt&&catOpt.value?String(catOpt.textContent||``).trim():``}else l=n&&n.value?n.value.trim():``;if(!l||!catId||isNaN(catId))throw Error(`请选择品种`);if(!I({品类id:catId,品类:l}))throw Error(`该品种不在系统管理的固定品种范围内，请先在「回收品类管理」中配置。`);let u={冶炼厂id:smelterId,冶炼厂名:c,冶炼厂:c,factory_name:c,smelter_name:c,品类id:catId,品类名:l,品类:l,category_name:l,category_id:catId}'
if (!app.includes(oldQnCat)) {
  console.error('app: Qn() category block not found')
  process.exit(1)
}
app = app.split(oldQnCat).join(newQnCat)

// --- index.html CSS: 下拉 z-index 与 card overflow ---
const htmlPath = path.join(
  __dirname,
  '../public/embedded/price_system/index.html',
)
let html = fs.readFileSync(htmlPath, 'utf8')
const oldCardOverflow =
  '.upload-page .card {\n      border: 1px solid #d8e2ef !important;\n      border-radius: 12px !important;\n      overflow: hidden !important;'
const newCardOverflow =
  '.upload-page .card {\n      border: 1px solid #d8e2ef !important;\n      border-radius: 12px !important;\n      overflow: visible !important;'
if (html.includes(oldCardOverflow)) {
  html = html.split(oldCardOverflow).join(newCardOverflow)
}
if (!html.includes('z-index: 9999')) {
  html = html.replace(
    '.manual-smelter-panel {\n      position: fixed;',
    '.manual-smelter-panel {\n      position: fixed;',
  )
  html = html.replace(
    'z-index: 300;',
    'z-index: 9999;',
  )
}

fs.writeFileSync(appPath, app, 'utf8')
fs.writeFileSync(indexPath, idx, 'utf8')
fs.writeFileSync(htmlPath, html, 'utf8')
console.log('Patched quote-upload manual smelter + category dropdown')
