/**
 * 手工录入弹窗：库房改为可搜索，下拉列表在输入框下方
 * Run: node scripts/patch-inventory-warehouse-search.cjs
 */
const fs = require('fs')
const path = require('path')

const appPath = path.join(
  __dirname,
  '../public/embedded/price_system/assets/app-BZHDhlyu.js',
)
const htmlPath = path.join(
  __dirname,
  '../public/embedded/price_system/index.html',
)

let app = fs.readFileSync(appPath, 'utf8')
let html = fs.readFileSync(htmlPath, 'utf8')

const oldInvForm =
  'function invFormHtml(){return`\n        <form id="inv-manual-form">\n            <div class="form-group">\n                <label for="inv-warehouse">库房 <span class="required">*</span></label>\n                <select id="inv-warehouse" class="form-control" required><option value="">请选择库房</option></select>\n            </div>'
const newInvForm =
  'function invFormHtml(){return`\n        <form id="inv-manual-form">\n            <div class="form-group">\n                <label for="inv-warehouse-search">库房 <span class="required">*</span></label>\n                <div class="warehouse-select-combo wh-modal-combo">\n                    <input type="search" id="inv-warehouse-search" class="form-control" autocomplete="off" placeholder="输入名称或编号筛选，点击下方选择库房">\n                    <div id="inv-warehouse-list" class="warehouse-select-list"></div>\n                    <input type="hidden" id="inv-warehouse" value="">\n                </div>\n            </div>'

const oldRcpForm =
  'function rcpFormHtml(){return`\n        <form id="rcp-manual-form">\n            <div class="form-group">\n                <label for="rcp-warehouse">库房 <span class="required">*</span></label>\n                <select id="rcp-warehouse" class="form-control" required><option value="">请选择库房</option></select>\n            </div>'
const newRcpForm =
  'function rcpFormHtml(){return`\n        <form id="rcp-manual-form">\n            <div class="form-group">\n                <label for="rcp-warehouse-search">库房 <span class="required">*</span></label>\n                <div class="warehouse-select-combo wh-modal-combo">\n                    <input type="search" id="rcp-warehouse-search" class="form-control" autocomplete="off" placeholder="输入名称或编号筛选，点击下方选择库房">\n                    <div id="rcp-warehouse-list" class="warehouse-select-list"></div>\n                    <input type="hidden" id="rcp-warehouse" value="">\n                </div>\n            </div>'

const oldWhFill =
  'async function invFillWarehouseSelect(e){var t=document.getElementById(e);if(!t)return;var n=await Api.request(`GET`,`/tl/get_warehouses`),r=Api.unwrapList(n).filter(function(e){return!b(T(e))});t.innerHTML=`<option value="">请选择库房</option>`+r.map(function(e){var n=w(e),r=T(e);return n?`<option value="`+String(n)+`">`+M(r||`库房 #`+n)+`</option>`:``}).join(``)}'
const newWhFill =
  'var modalWhRows=[];function renderModalWhCombo(e){var t=document.getElementById(e+`-warehouse-list`),n=document.getElementById(e+`-warehouse`),r=document.getElementById(e+`-warehouse-search`);if(!t||!n)return;var i=r&&r.value?String(r.value):``,a=parseInt(String(n.value||``),10)||0,o=modalWhRows.filter(function(t){return Kt(t,i)});t.innerHTML=o.length?o.map(function(t){var r=w(t),i=T(t),o=r===a;return`<button type="button" class="wh-sel-opt`+(o?` wh-sel-opt--on`:``)+`" data-wh-id="`+r+`">`+M(i)+`</button>`}).join(``):`<p class="text-muted" style="margin:8px;text-align:center;font-size:13px;">无匹配库房</p>`;t.querySelectorAll(`button[data-wh-id]`).forEach(function(r){r.addEventListener(`click`,function(){var i=parseInt(r.getAttribute(`data-wh-id`),10);n.value=i&&!isNaN(i)?String(i):``;var o=modalWhRows.find(function(e){return w(e)===i}),s=document.getElementById(e+`-warehouse-search`);o&&s&&(s.value=T(o)),renderModalWhCombo(e)})})}async function setupModalWhCombo(e){var t=await Api.request(`GET`,`/tl/get_warehouses`);modalWhRows=Api.unwrapList(t).filter(function(e){return!b(T(e))});var n=document.getElementById(e+`-warehouse`),r=document.getElementById(e+`-warehouse-search`);n&&(n.value=``),r&&(r.value=``),r&&(r.oninput=function(){renderModalWhCombo(e)},r.onkeydown=function(t){if(t.key===`Enter`){t.preventDefault();var n=document.getElementById(e+`-warehouse-list`);if(!n)return;var r=n.querySelector(`button[data-wh-id]`);r&&r.click()}}),renderModalWhCombo(e)}'

const oldInvOpen =
  'onOpen:async function(){await invFillWarehouseSelect(`inv-warehouse`);var e=document.getElementById(`inv-date`);'
const newInvOpen =
  'onOpen:async function(){await setupModalWhCombo(`inv`);var e=document.getElementById(`inv-date`);'

const oldRcpOpen =
  'onOpen:async function(){await invFillWarehouseSelect(`rcp-warehouse`),await invFillCategorySelect(`rcp-category`)}'
const newRcpOpen =
  'onOpen:async function(){await setupModalWhCombo(`rcp`),await invFillCategorySelect(`rcp-category`)}'

if (!app.includes('setupModalWhCombo(')) {
  if (!app.includes(oldInvForm)) {
    console.error('app: invFormHtml not found')
    process.exit(1)
  }
  app = app.split(oldInvForm).join(newInvForm)

  if (!app.includes(oldRcpForm)) {
    console.error('app: rcpFormHtml not found')
    process.exit(1)
  }
  app = app.split(oldRcpForm).join(newRcpForm)

  if (!app.includes(oldWhFill)) {
    console.error('app: invFillWarehouseSelect not found')
    process.exit(1)
  }
  app = app.split(oldWhFill).join(newWhFill)

  if (!app.includes(oldInvOpen)) {
    console.error('app: inv onOpen not found')
    process.exit(1)
  }
  app = app.split(oldInvOpen).join(newInvOpen)

  if (!app.includes(oldRcpOpen)) {
    console.error('app: rcp onOpen not found')
    process.exit(1)
  }
  app = app.split(oldRcpOpen).join(newRcpOpen)
}

const cssBlock = `
    /* 手工录入弹窗：库房可搜索，列表在输入框下方 */
    .modal-body .wh-modal-combo {
      position: relative;
      z-index: 2;
    }
    .wh-modal-combo .warehouse-select-list {
      margin-top: 0;
    }
`

if (!html.includes('.wh-modal-combo')) {
  const anchor = '.warehouse-select-combo {'
  if (!html.includes(anchor)) {
    console.error('index.html: warehouse-select-combo css anchor not found')
    process.exit(1)
  }
  html = html.replace(anchor, cssBlock + anchor)
}

fs.writeFileSync(appPath, app, 'utf8')
fs.writeFileSync(htmlPath, html, 'utf8')
console.log('Patched modal warehouse searchable combo')
