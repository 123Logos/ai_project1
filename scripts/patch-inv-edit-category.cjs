/**
 * Fix: invEditStock sends 库房id + 当前库存 but missing 品类id
 * - Adds data-category-id to edit button in loadInventoryList
 * - Updates click handler to pass categoryId to invEditStock
 * - Updates invEditStock to include 品类id in the POST payload
 *
 * Run: node scripts/patch-inv-edit-category.cjs
 */
const fs = require('fs')
const path = require('path')

const appPath = path.join(__dirname, '../public/embedded/price_system/assets/app-BZHDhlyu.js')
let app = fs.readFileSync(appPath, 'utf8')
let changed = 0

function rep(label, from, to) {
  if (app.includes(to)) {
    console.log('  [skip] ' + label + ' -- already applied')
    return
  }
  if (!app.includes(from)) {
    console.error('  [FAIL] ' + label + ' -- anchor not found')
    process.exit(1)
  }
  app = app.split(from).join(to)
  changed++
  console.log('  [ok]   ' + label)
}

// 1. loadInventoryList: extract categoryId and add data-category-id to edit button
rep(
  'loadInventoryList: extract categoryId',
  'c=_(t,[`品类名`,`回收品种`,`category_name`],`-`),i=Number(_(t,[`当前库存`,`stock`],null))',
  'c=_(t,[`品类名`,`回收品种`,`category_name`],`-`),cid=v(t,[`品类id`,`category_id`]),i=Number(_(t,[`当前库存`,`stock`],null))',
)

rep(
  'loadInventoryList: add data-category-id to edit btn',
  'edit-inv-btn" data-id="`+String(n)+`" data-stock="`',
  'edit-inv-btn" data-id="`+String(n)+`" data-category-id="`+String(cid||0)+`" data-stock="`',
)

// 2. Click handler: read data-category-id and pass to invEditStock
rep(
  'click handler: pass categoryId',
  'if(t){var n=parseInt(t.getAttribute(`data-id`),10),r=parseFloat(t.getAttribute(`data-stock`))||0,i=t.getAttribute(`data-date`)||``;invEditStock(n,r,i)}',
  'if(t){var n=parseInt(t.getAttribute(`data-id`),10),cid=parseInt(t.getAttribute(`data-category-id`),10)||0,r=parseFloat(t.getAttribute(`data-stock`))||0,i=t.getAttribute(`data-date`)||``;invEditStock(n,r,i,cid)}',
)

// 3. invEditStock: accept categoryId param and include 品类id in payload
rep(
  'invEditStock: add categoryId param',
  'async function invEditStock(e,t,n){',
  'async function invEditStock(e,t,n,cid){',
)

rep(
  'invEditStock: add 品类id to payload',
  'var i={库房id:e,当前库存:t}',
  'var i={库房id:e,品类id:cid||0,当前库存:t}',
)

fs.writeFileSync(appPath, app, 'utf8')
console.log('\nDone -- ' + changed + ' replacement(s) applied')
