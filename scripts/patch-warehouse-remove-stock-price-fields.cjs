/**
 * 库房管理：列表去掉「当前库存」「收货价格」；新增/编辑表单去掉「运费」「当前库存」「收货价格」
 * Run: node scripts/patch-warehouse-remove-stock-price-fields.cjs
 */
const fs = require('fs')
const path = require('path')

const appPath = path.join(__dirname, '../public/embedded/price_system/assets/app-BZHDhlyu.js')
const indexPath = path.join(__dirname, '../public/embedded/price_system/assets/index-e7CRb-gt.js')
const htmlPath = path.join(__dirname, '../public/embedded/price_system/index.html')

let app = fs.readFileSync(appPath, 'utf8')
let index = fs.readFileSync(indexPath, 'utf8')
let html = fs.readFileSync(htmlPath, 'utf8')

const thOld =
  '<th data-v-4b5a159b>月均收货</th><th data-v-4b5a159b>当前库存</th><th data-v-4b5a159b>收货价格</th><th data-v-4b5a159b>操作</th>'
const thNew = '<th data-v-4b5a159b>月均收货</th><th data-v-4b5a159b>操作</th>'
if (index.includes(thOld)) index = index.split(thOld).join(thNew)

const formFreightOld = `            <div class="form-group">
                <label for="warehouse-freight-base">运费</label>
                <input type="number" id="warehouse-freight-base" class="form-control" step="0.01" min="0" placeholder="可选，与库房基础信息字段一致">
            </div>
            <div class="form-group">
                <label for="warehouse-hazmat-permit-qty">危废经营许可数量</label>`
if (app.includes(formFreightOld)) app = app.split(formFreightOld).join(`            <div class="form-group">
                <label for="warehouse-hazmat-permit-qty">危废经营许可数量</label>`)

const formTailOld = `            <div class="form-group">
                <label for="warehouse-current-stock">当前库存</label>
                <input type="number" id="warehouse-current-stock" class="form-control" step="0.01" min="0" placeholder="可选">
            </div>
            <div class="form-group">
                <label for="warehouse-receive-price">收货价格</label>
                <input type="number" id="warehouse-receive-price" class="form-control" step="0.01" min="0" placeholder="可选，元/吨">
            </div>
        </form>`
if (app.includes(formTailOld)) app = app.split(formTailOld).join('        </form>')

const clearOld =
  '[`warehouse-contact`,`warehouse-phone`,`warehouse-freight-base`,`warehouse-hazmat-permit-qty`,`warehouse-monthly-inbound`,`warehouse-current-stock`,`warehouse-receive-price`]'
const clearNew =
  '[`warehouse-contact`,`warehouse-phone`,`warehouse-hazmat-permit-qty`,`warehouse-monthly-inbound`]'
if (app.includes(clearOld)) app = app.split(clearOld).join(clearNew)

const saveOld =
  'var _wcc=document.getElementById(`warehouse-contact`),_wpp=document.getElementById(`warehouse-phone`),_wff=document.getElementById(`warehouse-freight-base`),_whz=document.getElementById(`warehouse-hazmat-permit-qty`),_wmi=document.getElementById(`warehouse-monthly-inbound`),_wcs=document.getElementById(`warehouse-current-stock`),_wrp=document.getElementById(`warehouse-receive-price`);c.库房联系人=_wcc?String(_wcc.value||``).trim():``;var _ph0=_wpp?String(_wpp.value||``).trim():``;if(_ph0){var _ph=_ph0.replace(/\\s+/g,``).replace(/-/g,``);if(!/^\\d{11}$/.test(_ph))throw Error(`电话填写时须为 11 位数字`);c.电话=_ph}else c.电话=``;var _nz=function(el){if(!el)return null;var s=String(el.value||``).trim();if(!s)return null;var x=Number(s);return isFinite(x)?x:null};c.运费=_nz(_wff),c[`危废经营许可数量`]=_nz(_whz),c[`月均收货`]=_nz(_wmi),c[`当前库存`]=_nz(_wcs),c[`收货价格`]=_nz(_wrp),'
const saveNew =
  'var _wcc=document.getElementById(`warehouse-contact`),_wpp=document.getElementById(`warehouse-phone`),_whz=document.getElementById(`warehouse-hazmat-permit-qty`),_wmi=document.getElementById(`warehouse-monthly-inbound`);c.库房联系人=_wcc?String(_wcc.value||``).trim():``;var _ph0=_wpp?String(_wpp.value||``).trim():``;if(_ph0){var _ph=_ph0.replace(/\\s+/g,``).replace(/-/g,``);if(!/^\\d{11}$/.test(_ph))throw Error(`电话填写时须为 11 位数字`);c.电话=_ph}else c.电话=``;var _nz=function(el){if(!el)return null;var s=String(el.value||``).trim();if(!s)return null;var x=Number(s);return isFinite(x)?x:null};c[`危废经营许可数量`]=_nz(_whz),c[`月均收货`]=_nz(_wmi),'
if (app.includes(saveOld)) app = app.split(saveOld).join(saveNew)

const editOld =
  'var wc1=document.getElementById(`warehouse-contact`),wp1=document.getElementById(`warehouse-phone`),wf1=document.getElementById(`warehouse-freight-base`),wh1=document.getElementById(`warehouse-hazmat-permit-qty`),wm1=document.getElementById(`warehouse-monthly-inbound`),wcs1=document.getElementById(`warehouse-current-stock`),wrp1=document.getElementById(`warehouse-receive-price`);wc1&&(wc1.value=String(_(n,[`库房联系人`,`联系人`],``)||``)),wp1&&(wp1.value=String(_(n,[`电话`,`联系电话`,`手机`],``)||``));var fv=v(n,[`运费`]);wf1&&(wf1.value=fv!=null&&!isNaN(fv)?String(fv):``);var hv=v(n,[`危废经营许可数量`]);wh1&&(wh1.value=hv!=null&&!isNaN(hv)?String(hv):``);var mv=v(n,[`月均收货`]);wm1&&(wm1.value=mv!=null&&!isNaN(mv)?String(mv):``);var cv=v(n,[`当前库存`]);wcs1&&(wcs1.value=cv!=null&&!isNaN(cv)?String(cv):``);var rv=v(n,[`收货价格`]);wrp1&&(wrp1.value=rv!=null&&!isNaN(rv)?String(rv):``)'
const editNew =
  'var wc1=document.getElementById(`warehouse-contact`),wp1=document.getElementById(`warehouse-phone`),wh1=document.getElementById(`warehouse-hazmat-permit-qty`),wm1=document.getElementById(`warehouse-monthly-inbound`);wc1&&(wc1.value=String(_(n,[`库房联系人`,`联系人`],``)||``)),wp1&&(wp1.value=String(_(n,[`电话`,`联系电话`,`手机`],``)||``));var hv=v(n,[`危废经营许可数量`]);wh1&&(wh1.value=hv!=null&&!isNaN(hv)?String(hv):``);var mv=v(n,[`月均收货`]);wm1&&(wm1.value=mv!=null&&!isNaN(mv)?String(mv):``)'
if (app.includes(editOld)) app = app.split(editOld).join(editNew)

const listMapOld =
  'hazQty:v(e,[`危废经营许可数量`]),monthRecv:v(e,[`月均收货`]),currStock:v(e,[`当前库存`]),recvPrice:v(e,[`收货价格`])'
const listMapNew = 'hazQty:v(e,[`危废经营许可数量`]),monthRecv:v(e,[`月均收货`])'
if (app.includes(listMapOld)) app = app.split(listMapOld).join(listMapNew)

app = app.replace(/D\(e,12,(?:n\?`未找到匹配的库房`:`暂无库房数据`|`数据格式异常`)\)/g, (m) =>
  m.replace(',12,', ',10,'),
)
app = app.replace('E(e,12,`正在加载库房...`)', 'E(e,10,`正在加载库房...`)')
app = app.replace(
  ',cs=t.currStock!=null&&!isNaN(t.currStock)?t.currStock.toLocaleString():`-`,rp=t.recvPrice!=null&&!isNaN(t.recvPrice)?t.recvPrice.toLocaleString():`-`,',
  '',
)
app = app.replace(
  '\n            <td>${M(mr)}</td>\n            <td>${M(cs)}</td>\n            <td>${M(rp)}</td>\n            <td>',
  '\n            <td>${M(mr)}</td>\n            <td>',
)
app = app.replace('D(e,12,i)}}}async function K()', 'D(e,10,i)}}}async function K()')

const payloadOld = `              运费: readWarehouseOptNum('warehouse-freight-base'),
              危废经营许可数量: readWarehouseOptNum('warehouse-hazmat-permit-qty'),
              月均收货: readWarehouseOptNum('warehouse-monthly-inbound'),
              当前库存: readWarehouseOptNum('warehouse-current-stock'),
              收货价格: readWarehouseOptNum('warehouse-receive-price'),`
const payloadNew = `              危废经营许可数量: readWarehouseOptNum('warehouse-hazmat-permit-qty'),
              月均收货: readWarehouseOptNum('warehouse-monthly-inbound'),`
if (html.includes(payloadOld)) html = html.split(payloadOld).join(payloadNew)

const extraOld = `;['运费', '危废经营许可数量', '月均收货', '当前库存', '收货价格'].forEach((k) => {`
const extraNew = `;['危废经营许可数量', '月均收货'].forEach((k) => {`
if (html.includes(extraOld)) html = html.split(extraOld).join(extraNew)

fs.writeFileSync(appPath, app)
fs.writeFileSync(indexPath, index)
fs.writeFileSync(htmlPath, html)
console.log('patch-warehouse-remove-stock-price-fields: ok')
