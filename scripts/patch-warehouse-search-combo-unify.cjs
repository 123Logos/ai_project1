/**
 * 库房筛选统一为：输入框模糊搜索 + 下方列表点选（与智能比价/库存手工录入一致）
 * Run: node scripts/patch-warehouse-search-combo-unify.cjs
 */
const fs = require('fs')
const path = require('path')

const appPath = path.join(__dirname, '../public/embedded/price_system/assets/app-BZHDhlyu.js')
const indexPath = path.join(__dirname, '../public/embedded/price_system/assets/index-e7CRb-gt.js')

let app = fs.readFileSync(appPath, 'utf8')
let idx = fs.readFileSync(indexPath, 'utf8')

const renderWhComboListFn =
  'function renderWhComboList(prefix,rows,cfg){cfg=cfg||{};var listEl=document.getElementById(prefix+`-warehouse-list`),hid=document.getElementById(prefix+`-warehouse`),searchEl=document.getElementById(prefix+`-warehouse-search`);if(!listEl||!hid)return;var q=searchEl&&searchEl.value?String(searchEl.value):``,sel=hid.value!=null?String(hid.value):``,filtered=(rows||[]).filter(function(r){return Kt(r,q)}),parts=[];if(cfg.allowAll)parts.push(`<button type="button" class="wh-sel-opt`+(sel===``?` wh-sel-opt--on`:``)+`" data-wh-id="">`+M(cfg.allLabel||`全部`)+`</button>`);for(var i=0;i<filtered.length;i++){var r=filtered[i],id=w(r);if(!id)continue;var name=T(r),on=String(id)===sel;parts.push(`<button type="button" class="wh-sel-opt`+(on?` wh-sel-opt--on`:``)+`" data-wh-id="`+id+`">`+M(name)+`</button>`)}listEl.innerHTML=parts.length?parts.join(``):`<p class="text-muted" style="margin:8px;text-align:center;font-size:13px;">`+M(cfg.emptyText||`无匹配库房`)+`</p>`;listEl.querySelectorAll(`button[data-wh-id]`).forEach(function(btn){btn.addEventListener(`click`,function(){var id=btn.getAttribute(`data-wh-id`)||``;hid.value=id;if(cfg.syncSearchOnPick&&searchEl){if(!id)searchEl.value=``;else{var row=(rows||[]).find(function(r){return String(w(r))===id});row&&(searchEl.value=T(row))}}renderWhComboList(prefix,rows,cfg);cfg.onPick&&cfg.onPick(id)})})}'

if (!app.includes('function renderWhComboList(')) {
  const anchor = 'function Kt(e,n){'
  if (!app.includes(anchor)) {
    console.error('app: Kt anchor not found')
    process.exit(1)
  }
  app = app.replace(anchor, renderWhComboListFn + anchor)
}

// modal combo 复用通用渲染
const oldRenderModal =
  'function renderModalWhCombo(e){var t=document.getElementById(e+`-warehouse-list`),n=document.getElementById(e+`-warehouse`),r=document.getElementById(e+`-warehouse-search`);if(!t||!n)return;var i=r&&r.value?String(r.value):``,a=parseInt(String(n.value||``),10)||0,o=modalWhRows.filter(function(t){return Kt(t,i)});t.innerHTML=o.length?o.map(function(t){var r=w(t),i=T(t),o=r===a;return`<button type="button" class="wh-sel-opt`+(o?` wh-sel-opt--on`:``)+`" data-wh-id="`+r+`">`+M(i)+`</button>`}).join(``):`<p class="text-muted" style="margin:8px;text-align:center;font-size:13px;">无匹配库房</p>`;t.querySelectorAll(`button[data-wh-id]`).forEach(function(r){r.addEventListener(`click`,function(){var i=parseInt(r.getAttribute(`data-wh-id`),10);n.value=i&&!isNaN(i)?String(i):``;var o=modalWhRows.find(function(e){return w(e)===i}),s=document.getElementById(e+`-warehouse-search`);o&&s&&(s.value=T(o)),renderModalWhCombo(e)})})}'

const newRenderModal =
  'function renderModalWhCombo(e){renderWhComboList(e,modalWhRows,{syncSearchOnPick:!0})}'

if (app.includes(oldRenderModal)) {
  app = app.replace(oldRenderModal, newRenderModal)
} else if (!app.includes('function renderModalWhCombo(e){renderWhComboList')) {
  console.warn('app: renderModalWhCombo block not found (may already be patched)')
}

// 运费列表筛选
const oldFtwApply =
  /function ftwApplyFilter\(\)\{var e=document\.getElementById\(`freight-filter-warehouse-search`\),t=document\.getElementById\(`freight-filter-warehouse`\),n=e&&e\.value\?String\(e\.value\):``,r=t&&t\.value\?t\.value:``;if\(!t\)return;var i=qFW\.filter\(function\(e\)\{return ftwRowMatch\(e,n\)\}\);t\.innerHTML=`<option value="">全部<\/option>`,i\.forEach\(function\(e\)\{var n=document\.createElement\(`option`\);n\.value=String\(w\(e\)\),n\.textContent=T\(e\),t\.appendChild\(n\)\}\),r&&i\.some\(function\(e\)\{return String\(w\(e\)\)===r\}\)\?t\.value=r:t\.value=``\}/

if (oldFtwApply.test(app)) {
  app = app.replace(
    oldFtwApply,
    'function ftwApplyFilter(){renderWhComboList(`freight-filter`,qFW,{allowAll:!0,allLabel:`全部`})}',
  )
} else if (!app.includes('renderWhComboList(`freight-filter`')) {
  console.error('app: ftwApplyFilter not found')
  process.exit(1)
}

// 运费新增弹窗 HTML
const oldJe =
  'function Je(){return`\n        <form id="freight-form">\n            <div class="form-group">\n                <label for="freight-warehouse-search">库房 <span class="required">*</span></label>\n                <input type="search" id="freight-warehouse-search" class="form-control" autocomplete="off" placeholder="输入名称或编号筛选" style="margin-bottom:8px;">\n                <select id="freight-warehouse" class="form-control" required>\n                    <option value="">请选择库房</option>\n                    <!-- 库房选项将通过JavaScript动态生成 -->\n                </select>\n            </div>'

const newJe =
  'function Je(){return`\n        <form id="freight-form">\n            <div class="form-group">\n                <label for="freight-warehouse-search">库房 <span class="required">*</span></label>\n                <div class="warehouse-select-combo wh-modal-combo">\n                    <input type="search" id="freight-warehouse-search" class="form-control" autocomplete="off" placeholder="输入名称或编号筛选，点击下方选择库房">\n                    <div id="freight-warehouse-list" class="warehouse-select-list"></div>\n                    <input type="hidden" id="freight-warehouse" value="">\n                </div>\n            </div>'

if (app.includes(oldJe)) {
  app = app.replace(oldJe, newJe)
} else if (!app.includes('freight-warehouse-list')) {
  console.error('app: Je() freight form not found')
  process.exit(1)
}

// 运费弹窗库房筛选
const oldFfwApply =
  /function ffwApply\(\)\{var e=document\.getElementById\(`freight-warehouse-search`\),t=document\.getElementById\(`freight-warehouse`\),n=e&&e\.value\?String\(e\.value\):``,r=t&&t\.value\?String\(t\.value\):``;if\(!t\)return;var i=qFJ\.filter\(function\(e\)\{return ftwRowMatch\(e,n\)\}\);t\.innerHTML=`<option value="">请选择库房<\/option>`,i\.forEach\(function\(e\)\{var n=document\.createElement\(`option`\);n\.value=String\(w\(e\)\),n\.textContent=T\(e\),t\.appendChild\(n\)\}\),r&&i\.some\(function\(e\)\{return String\(w\(e\)\)===r\}\)\?t\.value=r:t\.value=``\}/

if (oldFfwApply.test(app)) {
  app = app.replace(
    oldFfwApply,
    'function ffwApply(){renderWhComboList(`freight`,qFJ,{syncSearchOnPick:!0})}',
  )
} else if (!app.includes('renderWhComboList(`freight`')) {
  console.error('app: ffwApply not found')
  process.exit(1)
}

// ct() 初始化运费弹窗
const oldCt =
  'async function ct(){let e=await Api.request(`GET`,`/tl/get_warehouses`),t=await Api.request(`GET`,`/tl/get_smelters`),n=Api.unwrapList(e).filter(function(e){return!b(T(e))}),r=Api.unwrapList(t).filter(function(e){return!b(C(e))}),i=document.getElementById(`freight-warehouse`),a=document.getElementById(`freight-smelter`);if(!i||!a)return;qFJ=n;var sf=document.getElementById(`freight-warehouse-search`);sf&&(sf.value=``),ffwApply();var sfc=document.getElementById(`freight-warehouse-search`);sfc&&(sfc.oninput=function(){ffwApply()}),a.innerHTML=`<option value="">请选择冶炼厂</option>`,r.forEach(function(e){let t=document.createElement(`option`);t.value=S(e),t.textContent=C(e),a.appendChild(t)})}'

const newCt =
  'async function ct(){let e=await Api.request(`GET`,`/tl/get_warehouses`),t=await Api.request(`GET`,`/tl/get_smelters`),n=Api.unwrapList(e).filter(function(e){return!b(T(e))}),r=Api.unwrapList(t).filter(function(e){return!b(C(e))}),i=document.getElementById(`freight-warehouse`),a=document.getElementById(`freight-smelter`);if(!i||!a)return;qFJ=n,i.value=``;var sf=document.getElementById(`freight-warehouse-search`);sf&&(sf.value=``,sf.oninput=function(){ffwApply()},sf.onkeydown=function(e){if(e.key===`Enter`){e.preventDefault();var t=document.getElementById(`freight-warehouse-list`);t&&t.querySelector(`button[data-wh-id]`)&&t.querySelector(`button[data-wh-id]`).click()}}),ffwApply(),a.innerHTML=`<option value="">请选择冶炼厂</option>`,r.forEach(function(e){let t=document.createElement(`option`);t.value=S(e),t.textContent=C(e),a.appendChild(t)})}'

if (app.includes(oldCt)) {
  app = app.replace(oldCt, newCt)
}

// lt() 提交：从 qFJ 取库房名
const oldLtWh =
  'let i=[{仓库:(document.querySelector(`#freight-warehouse option:checked`)||{}).textContent||``,冶炼厂:(document.querySelector(`#freight-smelter option:checked`)||{}).textContent||``,运费:r}];'
const newLtWh =
  'var whRow=qFJ.find(function(e){return w(e)===t}),whName=whRow?T(whRow):``;let i=[{仓库:whName,冶炼厂:(document.querySelector(`#freight-smelter option:checked`)||{}).textContent||``,运费:r}];'

if (app.includes(oldLtWh)) {
  app = app.replace(oldLtWh, newLtWh)
}

// ze() 运费筛选 Enter
const oldEnter =
  'whs&&whs.addEventListener(`keydown`,function(e){if(e.key===`Enter`){e.preventDefault();ftwApplyFilter();var sel=document.getElementById(`freight-filter-warehouse`);if(sel&&sel.options.length>1){sel.selectedIndex=1;o.page=1,K()}}})'
const newEnter =
  'whs&&whs.addEventListener(`keydown`,function(e){if(e.key===`Enter`){e.preventDefault();var list=document.getElementById(`freight-filter-warehouse-list`),btn=list&&list.querySelector(`button[data-wh-id]:not([data-wh-id=""])`);btn?btn.click():ftwApplyFilter();o.page=1,K()}})'

if (app.includes(oldEnter)) {
  app = app.replace(oldEnter, newEnter)
}

// 运费模板：qFTW + 可搜索
if (!app.includes('qFTW=[]')) {
  app = app.replace('qFJ=[],', 'qFJ=[],qFTW=[],')
}

const templateRenderFn =
  'function renderFreightTemplateWhList(){var box=document.getElementById(`freight-template-warehouse-list`),searchEl=document.getElementById(`freight-template-warehouse-search`);if(!box)return;var checked={};box.querySelectorAll(`.freight-template-warehouse:checked`).forEach(function(c){checked[String(c.value||``)]=!0});var q=searchEl&&searchEl.value?String(searchEl.value):``,filtered=qFTW.filter(function(r){return Kt(r,q)});if(!filtered.length){box.innerHTML=`<p class="text-muted" style="margin:8px;text-align:center;">无匹配库房</p>`;return}box.innerHTML=``;filtered.forEach(function(t){var n=w(t);if(!n)return;var r=document.createElement(`label`);r.style.display=`block`;r.style.marginBottom=`8px`;var cid=String(n),chk=checked[cid]?` checked`:``;r.innerHTML=`<input type="checkbox" class="freight-template-warehouse" value="`+cid+`"`+chk+`> `+M(T(t)||`库房 #`+n);box.appendChild(r)})}'

if (!app.includes('function renderFreightTemplateWhList(')) {
  app = app.replace('function pt(){', templateRenderFn + 'function pt(){')
}

const oldPt =
  'function pt(){return`\n        <div>\n            <p style="margin:0 0 10px;">请选择要下载模板的库房（可多选）</p>\n            <div id="freight-template-warehouse-list" style="max-height:280px;overflow:auto;border:1px solid #e5e7eb;border-radius:8px;padding:10px;">\n                <p class="text-muted" style="margin:0;">库房加载中...</p>\n            </div>\n        </div>\n    `}'

const newPt =
  'function pt(){return`\n        <div>\n            <p style="margin:0 0 10px;">请选择要下载模板的库房（可多选）</p>\n            <input type="search" id="freight-template-warehouse-search" class="form-control" autocomplete="off" placeholder="输入名称或编号筛选" style="margin-bottom:8px;">\n            <div id="freight-template-warehouse-list" style="max-height:280px;overflow:auto;border:1px solid #e5e7eb;border-radius:8px;padding:10px;">\n                <p class="text-muted" style="margin:0;">库房加载中...</p>\n            </div>\n        </div>\n    `}'

if (app.includes(oldPt)) {
  app = app.replace(oldPt, newPt)
}

const oldHt =
  'async function ht(){let e=document.getElementById(`freight-template-warehouse-list`);if(e)try{let t=await Api.request(`GET`,`/tl/get_warehouses`),n=Api.unwrapList(t).filter(function(e){return!b(T(e))});if(!n.length){e.innerHTML=`<p class="text-muted" style="margin:0;">暂无可选库房</p>`;return}e.innerHTML=``,n.forEach(function(t){var n=w(t);if(n){var r=document.createElement(`label`);r.style.display=`block`,r.style.marginBottom=`8px`,r.innerHTML=`<input type="checkbox" class="freight-template-warehouse" value="`+String(n)+`"> `+M(T(t)||`库房 #`+n),e.appendChild(r)}})}catch(t){e.innerHTML=`<p class="text-muted" style="margin:0;">库房加载失败：`+M(t.message||String(t))+`</p>`}}'

const newHt =
  'async function ht(){let e=document.getElementById(`freight-template-warehouse-list`);var sf=document.getElementById(`freight-template-warehouse-search`);sf&&(sf.value=``,sf.oninput=function(){renderFreightTemplateWhList()});if(e)try{let t=await Api.request(`GET`,`/tl/get_warehouses`);qFTW=Api.unwrapList(t).filter(function(e){return!b(T(e))});if(!qFTW.length){e.innerHTML=`<p class="text-muted" style="margin:0;">暂无可选库房</p>`;return}renderFreightTemplateWhList()}catch(t){e.innerHTML=`<p class="text-muted" style="margin:0;">库房加载失败：`+M(t.message||String(t))+`</p>`}}'

if (app.includes(oldHt)) {
  app = app.replace(oldHt, newHt)
}

// index: 运费配置筛选区
const oldIdxFilter =
  '<input type="search" id="freight-filter-warehouse-search" class="form-control" autocomplete="off" placeholder="输入名称或编号筛选" data-v-4b5a159b><select id="freight-filter-warehouse" class="form-control" data-v-4b5a159b><option value="" data-v-4b5a159b>全部</option></select>'

const newIdxFilter =
  '<div class="warehouse-select-combo" data-v-4b5a159b><input type="search" id="freight-filter-warehouse-search" class="form-control" autocomplete="off" placeholder="输入名称或编号筛选，点击下方选择库房" data-v-4b5a159b><div id="freight-filter-warehouse-list" class="warehouse-select-list" role="listbox" aria-label="库房" data-v-4b5a159b></div><input type="hidden" id="freight-filter-warehouse" value="" data-v-4b5a159b></div>'

if (idx.includes(oldIdxFilter)) {
  idx = idx.split(oldIdxFilter).join(newIdxFilter)
} else if (!idx.includes('freight-filter-warehouse-list')) {
  console.error('index: freight filter anchor not found')
  process.exit(1)
}

fs.writeFileSync(appPath, app, 'utf8')
fs.writeFileSync(indexPath, idx, 'utf8')
console.log('Patched warehouse searchable combo (freight filter, freight modal, template download)')
