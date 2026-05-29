/**
 * 报价查询：操作列增加「删除」，调用 DELETE /t1/quote_detail/{detail_id}
 * Run: node scripts/patch-quote-query-delete.cjs
 */
const fs = require('fs')
const path = require('path')

const appPath = path.join(
  __dirname,
  '../public/embedded/price_system/assets/app-BZHDhlyu.js',
)
const indexPath = path.join(
  __dirname,
  '../public/embedded/price_system/index.html',
)

let app = fs.readFileSync(appPath, 'utf8')
let index = fs.readFileSync(indexPath, 'utf8')

const oldRowBtn =
  '<td><button type="button" class="btn btn-sm btn-outline-primary quote-edit-btn" data-i="${ix}">编辑</button></td>'
const newRowBtn =
  '<td><button type="button" class="btn btn-sm btn-outline-primary quote-edit-btn" data-i="${ix}">编辑</button> <button type="button" class="btn btn-sm btn-outline-danger quote-delete-btn" data-i="${ix}">删除</button></td>'
if (!app.includes(oldRowBtn) && !app.includes(newRowBtn)) {
  console.error('app: quote table row button not found')
  process.exit(1)
}
if (app.includes(oldRowBtn)) {
  app = app.split(oldRowBtn).join(newRowBtn)
}

const oldClick =
  'a&&a.addEventListener(`click`,function(e){let t=e.target.closest(`.quote-edit-btn`);if(!t)return;let n=parseInt(t.getAttribute(`data-i`)||`-1`,10);n<0||!qE||!qE[n]||$n(qE[n])}),'
const newClick =
  'a&&a.addEventListener(`click`,function(e){let t=e.target.closest(`.quote-edit-btn`);if(t){let n=parseInt(t.getAttribute(`data-i`)||`-1`,10);n<0||!qE||!qE[n]||$n(qE[n]);return}let d=e.target.closest(`.quote-delete-btn`);if(!d)return;let r=parseInt(d.getAttribute(`data-i`)||`-1`,10);r<0||!qE||!qE[r]||Jn(qE[r])}),'
if (!app.includes(oldClick) && !app.includes(newClick)) {
  console.error('app: quote-table click handler not found')
  process.exit(1)
}
if (app.includes(oldClick)) {
  app = app.split(oldClick).join(newClick)
}

const deleteFn =
  'async function Jn(e){var t=v(e,[`id`,`quote_detail_id`,`明细id`]);if(t==null||isNaN(t))return void alert(`当前行缺少明细 id，无法删除。`);var n=_(e,[`冶炼厂`,`冶炼厂名`,`factory_name`,`smelterName`],``)||`-`,r=F(e)||`-`;if(!confirm(`确定删除该条报价？\\n冶炼厂：`+n+`\\n品种：`+r))return;try{await Api.request(`DELETE`,`/t1/quote_detail/`+String(t));var ix=qE.indexOf(e);ix>=0?qE.splice(ix,1):qE=qE.filter(function(n){return v(n,[`id`,`quote_detail_id`,`明细id`])!==t}),X(qE,qE.length)}catch(e){alert(`删除失败: `+(e.message||String(e)))}}'
const deleteFnReload =
  'async function Jn(e){var t=v(e,[`id`,`quote_detail_id`,`明细id`]);if(t==null||isNaN(t))return void alert(`当前行缺少明细 id，无法删除。`);var n=_(e,[`冶炼厂`,`冶炼厂名`,`factory_name`,`smelterName`],``)||`-`,r=F(e)||`-`;if(!confirm(`确定删除该条报价？\\n冶炼厂：`+n+`\\n品种：`+r))return;try{await Api.request(`DELETE`,`/t1/quote_detail/`+String(t)),alert(`已删除`),await Z()}catch(e){alert(`删除失败: `+(e.message||String(e)))}}'
if (app.includes(deleteFnReload)) {
  app = app.split(deleteFnReload).join(deleteFn)
} else if (!app.includes(deleteFn)) {
  const anchor =
    'await Api.request(`POST`,`/tl/update_quote_detail`,e),alert(`报价已更新`),await Z()}})}async function Ue(){'
  const insert =
    'await Api.request(`POST`,`/tl/update_quote_detail`,e),alert(`报价已更新`),await Z()}})}' +
    deleteFn +
    'async function Ue(){'
  if (!app.includes(anchor)) {
    console.error('app: insert anchor for delete fn not found')
    process.exit(1)
  }
  app = app.split(anchor).join(insert)
}

const cssOld = `      .quote-query-page .data-table thead th,
      .quote-query-page .data-table tbody td {
        text-align: center;
        vertical-align: middle;
      }`
const cssNew = `${cssOld}
      .quote-query-page .quote-delete-btn {
        margin-left: 6px;
      }`
if (!index.includes(cssNew)) {
  if (!index.includes(cssOld)) {
    console.error('index: quote-query css block not found')
    process.exit(1)
  }
  index = index.split(cssOld).join(cssNew)
}

fs.writeFileSync(appPath, app)
fs.writeFileSync(indexPath, index)
console.log('patch-quote-query-delete: ok')
