/**
 * 当前库存/收货价格：去掉每页条数，缩小筛选区域
 * Run: node scripts/patch-inventory-rcp-compact-filter.cjs
 */
const fs = require('fs')
const path = require('path')

const indexPath = path.join(
  __dirname,
  '../public/embedded/price_system/assets/index-e7CRb-gt.js',
)
const appPath = path.join(
  __dirname,
  '../public/embedded/price_system/assets/app-BZHDhlyu.js',
)
const htmlPath = path.join(
  __dirname,
  '../public/embedded/price_system/index.html',
)

let idx = fs.readFileSync(indexPath, 'utf8')
let app = fs.readFileSync(appPath, 'utf8')
let html = fs.readFileSync(htmlPath, 'utf8')

const oldInvFilter =
  '<div class="card filter-card" data-v-4b5a159b><div class="card-header" data-v-4b5a159b><h4 data-v-4b5a159b>筛选条件</h4></div><div class="card-body" data-v-4b5a159b><div class="form-row freight-filter-toolbar" data-v-4b5a159b><div class="form-group" data-v-4b5a159b><label for="inv-keyword" data-v-4b5a159b>库房名称</label><input type="search" id="inv-keyword" class="form-control" autocomplete="off" placeholder="模糊搜索库房名称" data-v-4b5a159b></div><div class="form-group" data-v-4b5a159b><label for="inv-page-size" data-v-4b5a159b>每页条数</label><select id="inv-page-size" class="form-control" data-v-4b5a159b><option value="20" selected data-v-4b5a159b>20</option><option value="50" data-v-4b5a159b>50</option><option value="100" data-v-4b5a159b>100</option></select></div><div class="form-group freight-filter-actions" data-v-4b5a159b><label data-v-4b5a159b>\xA0</label><div class="form-actions" data-v-4b5a159b><button type="button" class="btn btn-secondary" id="inv-reset-btn" data-v-4b5a159b>重置</button><button type="button" class="btn btn-primary" id="inv-search-btn" data-v-4b5a159b><i class="fas fa-search" data-v-4b5a159b></i> 查询</button></div></div></div></div></div>'

const newInvFilter =
  '<div class="card inv-rcp-filter-card" data-v-4b5a159b><div class="card-body inv-rcp-filter-body" data-v-4b5a159b><div class="inv-rcp-filter-row" data-v-4b5a159b><input type="search" id="inv-keyword" class="form-control" autocomplete="off" placeholder="搜索库房名称" data-v-4b5a159b><button type="button" class="btn btn-secondary btn-sm" id="inv-reset-btn" data-v-4b5a159b>重置</button><button type="button" class="btn btn-primary btn-sm" id="inv-search-btn" data-v-4b5a159b><i class="fas fa-search" data-v-4b5a159b></i> 查询</button></div></div></div>'

const oldRcpFilter =
  '<div class="card filter-card" data-v-4b5a159b><div class="card-header" data-v-4b5a159b><h4 data-v-4b5a159b>筛选条件</h4></div><div class="card-body" data-v-4b5a159b><div class="form-row freight-filter-toolbar" data-v-4b5a159b><div class="form-group" data-v-4b5a159b><label for="rcp-keyword" data-v-4b5a159b>关键字</label><input type="search" id="rcp-keyword" class="form-control" autocomplete="off" placeholder="库房名称或品种名称" data-v-4b5a159b></div><div class="form-group" data-v-4b5a159b><label for="rcp-page-size" data-v-4b5a159b>每页条数</label><select id="rcp-page-size" class="form-control" data-v-4b5a159b><option value="20" selected data-v-4b5a159b>20</option><option value="50" data-v-4b5a159b>50</option><option value="100" data-v-4b5a159b>100</option></select></div><div class="form-group freight-filter-actions" data-v-4b5a159b><label data-v-4b5a159b>\xA0</label><div class="form-actions" data-v-4b5a159b><button type="button" class="btn btn-secondary" id="rcp-reset-btn" data-v-4b5a159b>重置</button><button type="button" class="btn btn-primary" id="rcp-search-btn" data-v-4b5a159b><i class="fas fa-search" data-v-4b5a159b></i> 查询</button></div></div></div></div></div>'

const newRcpFilter =
  '<div class="card inv-rcp-filter-card" data-v-4b5a159b><div class="card-body inv-rcp-filter-body" data-v-4b5a159b><div class="inv-rcp-filter-row" data-v-4b5a159b><input type="search" id="rcp-keyword" class="form-control" autocomplete="off" placeholder="搜索库房名称或品种名称" data-v-4b5a159b><button type="button" class="btn btn-secondary btn-sm" id="rcp-reset-btn" data-v-4b5a159b>重置</button><button type="button" class="btn btn-primary btn-sm" id="rcp-search-btn" data-v-4b5a159b><i class="fas fa-search" data-v-4b5a159b></i> 查询</button></div></div></div>'

if (!idx.includes('inv-rcp-filter-card')) {
  if (!idx.includes(oldInvFilter)) {
    console.error('index: inv filter not found')
    process.exit(1)
  }
  idx = idx.split(oldInvFilter).join(newInvFilter)

  if (!idx.includes(oldRcpFilter)) {
    console.error('index: rcp filter not found')
    process.exit(1)
  }
  idx = idx.split(oldRcpFilter).join(newRcpFilter)
}

const oldLoadInv =
  'async function loadInventoryList(){var e=document.getElementById(`inv-table-body`),t=document.getElementById(`inv-count`),n=document.getElementById(`inv-page-size`);if(n&&n.value&&(invPg.pageSize=parseInt(n.value,10)||invPg.pageSize),!e)return;'
const newLoadInv =
  'async function loadInventoryList(){var e=document.getElementById(`inv-table-body`),t=document.getElementById(`inv-count`);if(!e)return;'

const oldLoadRcp =
  'async function loadReceiptPriceList(){var e=document.getElementById(`rcp-table-body`),t=document.getElementById(`rcp-count`),n=document.getElementById(`rcp-page-size`);if(n&&n.value&&(rcpPg.pageSize=parseInt(n.value,10)||rcpPg.pageSize),!e)return;'
const newLoadRcp =
  'async function loadReceiptPriceList(){var e=document.getElementById(`rcp-table-body`),t=document.getElementById(`rcp-count`);if(!e)return;'

const oldInvInitPageSize =
  'var c=document.getElementById(`inv-page-size`);c&&c.addEventListener(`change`,function(){invPg.pageSize=parseInt(this.value,10)||20,invPg.page=1,loadInventoryList()});var l=document.getElementById(`inv-keyword`);'
const newInvInitPageSize =
  'var l=document.getElementById(`inv-keyword`);'

const oldRcpInitPageSize =
  'var l=document.getElementById(`rcp-page-size`);l&&l.addEventListener(`change`,function(){rcpPg.pageSize=parseInt(this.value,10)||20,rcpPg.page=1,loadReceiptPriceList()});var u=document.getElementById(`rcp-keyword`);'
const newRcpInitPageSize =
  'var u=document.getElementById(`rcp-keyword`);'

if (!app.includes('inv-rcp-filter')) {
  if (!app.includes(oldLoadInv)) {
    console.error('app: loadInventoryList anchor not found')
    process.exit(1)
  }
  app = app.split(oldLoadInv).join(newLoadInv)

  if (!app.includes(oldLoadRcp)) {
    console.error('app: loadReceiptPriceList anchor not found')
    process.exit(1)
  }
  app = app.split(oldLoadRcp).join(newLoadRcp)

  if (!app.includes(oldInvInitPageSize)) {
    console.error('app: inv page-size listener not found')
    process.exit(1)
  }
  app = app.split(oldInvInitPageSize).join(newInvInitPageSize)

  if (!app.includes(oldRcpInitPageSize)) {
    console.error('app: rcp page-size listener not found')
    process.exit(1)
  }
  app = app.split(oldRcpInitPageSize).join(newRcpInitPageSize)
}

const cssBlock = `
    /* 库存/收货价格：紧凑筛选条 */
    .inv-rcp-filter-card {
      margin-bottom: 12px !important;
      border-radius: 10px !important;
    }
    .inv-rcp-filter-body {
      padding: 10px 12px !important;
    }
    .inv-rcp-filter-row {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }
    .inv-rcp-filter-row .form-control {
      flex: 1 1 220px;
      min-width: 160px;
      max-width: 360px;
      height: 34px;
      padding: 4px 10px;
      font-size: 13px;
    }
    .inv-rcp-filter-row .btn {
      white-space: nowrap;
      flex: 0 0 auto;
    }
`

if (!html.includes('.inv-rcp-filter-card')) {
  const anchor = '.wh-modal-combo .warehouse-select-list {'
  if (!html.includes(anchor)) {
    console.error('index.html: css anchor not found')
    process.exit(1)
  }
  html = html.replace(anchor, cssBlock + anchor)
}

fs.writeFileSync(indexPath, idx, 'utf8')
fs.writeFileSync(appPath, app, 'utf8')
fs.writeFileSync(htmlPath, html, 'utf8')
console.log('Patched compact filter for inventory + receipt price pages')
