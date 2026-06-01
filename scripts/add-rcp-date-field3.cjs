const fs = require('fs')
const path = require('path')

const appPath = path.join(__dirname, '../public/embedded/price_system/assets/app-BZHDhlyu.js')
let app = fs.readFileSync(appPath, 'utf8')

// 1. 修改收货价格录入表单 - 添加价格日期字段
const oldRcpForm = 'id="rcp-price" class="form-control" required>\n            </div>\n        </form>`}\nfunction rcpEditFormHtml'

const newRcpForm = 'id="rcp-price" class="form-control" required>\n            </div>\n            <div class="form-group">\n                <label for="rcp-date">价格日期</label>\n                <input type="date" id="rcp-date" class="form-control">\n                <small class="text-muted">留空则使用定价日历当天</small>\n            </div>\n        </form>`}\nfunction rcpEditFormHtml'

if (app.includes(oldRcpForm)) {
  app = app.replace(oldRcpForm, newRcpForm)
  console.log('1. ✅ 录入表单添加价格日期')
} else {
  console.log('1. ⚠️ 录入表单模式不匹配，尝试其他方式')
  // 尝试在 </form> 之前插入
  const anchor = 'id="rcp-price" class="form-control" required>'
  if (app.includes(anchor)) {
    const insertAfter = 'required>\n            </div>'
    const insertWith = 'required>\n            </div>\n            <div class="form-group">\n                <label for="rcp-date">价格日期</label>\n                <input type="date" id="rcp-date" class="form-control">\n                <small class="text-muted">留空则使用定价日历当天</small>\n            </div>'
    // Only replace first occurrence (the add form, not edit form)
    const idx = app.indexOf(insertAfter)
    if (idx !== -1 && idx < app.indexOf('rcp-edit-price')) {
      app = app.substring(0, idx) + insertWith + app.substring(idx + insertAfter.length)
      console.log('1. ✅ 录入表单添加价格日期（方式2）')
    }
  }
}

// 2. 修改收货价格编辑表单 - 添加价格日期字段
const oldEditForm = 'id="rcp-edit-price" class="form-control" step="0.01" min="0" required>\n            </div>\n        </form>`}\nfunction rcpUpdatePager'

const newEditForm = 'id="rcp-edit-price" class="form-control" step="0.01" min="0" required>\n            </div>\n            <div class="form-group">\n                <label for="rcp-edit-date">价格日期</label>\n                <input type="date" id="rcp-edit-date" class="form-control">\n            </div>\n        </form>`}\nfunction rcpUpdatePager'

if (app.includes(oldEditForm)) {
  app = app.replace(oldEditForm, newEditForm)
  console.log('2. ✅ 编辑表单添加价格日期')
} else {
  console.log('2. ⚠️ 编辑表单模式不匹配')
}

// 3. 修改 rcpEditPrice 函数的 onOpen - 回填价格日期
const oldOnOpen = 'onOpen:function(){var n=document.getElementById(`rcp-edit-price`);n&&!isNaN(t)&&(n.value=String(t))}'
const newOnOpen = 'onOpen:function(){var n=document.getElementById(`rcp-edit-price`);n&&!isNaN(t)&&(n.value=String(t));var ed=document.getElementById(`rcp-edit-date`);if(ed){var dv=_(`t`,["价格日期","price_date","日期"],"");ed.value=O(dv||"")}}'

if (app.includes(oldOnOpen)) {
  app = app.replace(oldOnOpen, newOnOpen)
  console.log('3. ✅ 编辑回填价格日期')
} else {
  console.log('3. ⚠️ 编辑回填模式不匹配')
}

fs.writeFileSync(appPath, app, 'utf8')
console.log('\n已保存修改')
