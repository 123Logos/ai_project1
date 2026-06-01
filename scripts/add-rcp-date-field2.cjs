const fs = require('fs')
const path = require('path')

const appPath = path.join(__dirname, '../public/embedded/price_system/assets/app-BZHDhlyu.js')
let app = fs.readFileSync(appPath, 'utf8')

// 1. 修改收货价格录入表单 - 添加价格日期字段
const oldRcpForm = `<input type="number" step="0.01" min="0" id="rcp-price" class="form-control" required>
            </div>
        </form>\`}
function rcpEditFormHtml`

const newRcpForm = `<input type="number" step="0.01" min="0" id="rcp-price" class="form-control" required>
            </div>
            <div class="form-group">
                <label for="rcp-date">价格日期</label>
                <input type="date" id="rcp-date" class="form-control">
                <small class="text-muted">留空则使用定价日历当天</small>
            </div>
        </form>\`}
function rcpEditFormHtml`

if (app.includes(oldRcpForm)) {
  app = app.replace(oldRcpForm, newRcpForm)
  console.log('✅ 收货价格录入表单：添加了"价格日期"字段')
} else if (app.includes('id="rcp-date"')) {
  console.log('✅ 收货价格录入表单已有"价格日期"字段')
} else {
  console.log('❌ 未找到收货价格录入表单')
}

// 2. 修改收货价格编辑表单 - 添加价格日期字段
const oldRcpEditForm = `<input type="number" id="rcp-edit-price" class="form-control" step="0.01" min="0" required>
            </div>
        </form>\`}
function rcpUpdatePager`

const newRcpEditForm = `<input type="number" id="rcp-edit-price" class="form-control" step="0.01" min="0" required>
            </div>
            <div class="form-group">
                <label for="rcp-edit-date">价格日期</label>
                <input type="date" id="rcp-edit-date" class="form-control">
            </div>
        </form>\`}
function rcpUpdatePager`

if (app.includes(oldRcpEditForm)) {
  app = app.replace(oldRcpEditForm, newRcpEditForm)
  console.log('✅ 收货价格编辑表单：添加了"价格日期"字段')
} else if (app.includes('id="rcp-edit-date"')) {
  console.log('✅ 收货价格编辑表单已有"价格日期"字段')
} else {
  console.log('❌ 未找到收货价格编辑表单')
}

// 3. 修改 rcpEditPrice 函数 - 编辑时回填价格日期
const oldEditOpen = 'onOpen:function(){var n=document.getElementById(`rcp-edit-price`);n&&!isNaN(t)&&(n.value=String(t))}'
const newEditOpen = 'onOpen:function(){var n=document.getElementById(`rcp-edit-price`);n&&!isNaN(t)&&(n.value=String(t));var ed=document.getElementById(`rcp-edit-date`);if(ed){var dv=_(`+ 't' + `,[` + '`' + `价格日期` + '`' + `,` + '`' + `price_date` + '`' + `,` + '`' + `日期` + '`' + `],` + '`' + '`' + `);ed.value=O(dv||` + '`' + '`' + `)}}'

// Simpler approach - just check if it needs updating
if (!app.includes('rcp-edit-date')) {
  // The edit form already got the date field above, now wire the open handler
  const marker = 'onOpen:function(){var n=document.getElementById(`rcp-edit-price`);n&&!isNaN(t)&&(n.value=String(t))}'
  if (app.includes(marker)) {
    const replacement = 'onOpen:function(){var n=document.getElementById(`rcp-edit-price`);n&&!isNaN(t)&&(n.value=String(t));var ed=document.getElementById(`rcp-edit-date`);ed&&(ed.value=O(_(` + '`' + 't' + '`' + ',["价格日期","price_date","日期"],"")||""))}'
    app = app.replace(marker, replacement)
    console.log('✅ rcpEditPrice：编辑时回填价格日期')
  }
} else {
  console.log('✅ rcpEditPrice 已处理')
}

fs.writeFileSync(appPath, app, 'utf8')
console.log('\n已保存修改')
