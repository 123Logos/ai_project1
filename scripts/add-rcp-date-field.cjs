const fs = require('fs')
const path = require('path')

const appPath = path.join(__dirname, '../public/embedded/price_system/assets/app-BZHDhlyu.js')
let app = fs.readFileSync(appPath, 'utf8')

// 1. 修改收货价格录入表单 - 添加价格日期字段
const oldRcpForm = `<label for="rcp-price">价格（元/吨） <span class="required">*</span></label>
                <input type="number" id="rcp-price" class="form-control" step="0.01" min="0" required>
            </div>
        </form>`

const newRcpForm = `<label for="rcp-price">价格（元/吨） <span class="required">*</span></label>
                <input type="number" id="rcp-price" class="form-control" step="0.01" min="0" required>
            </div>
            <div class="form-group">
                <label for="rcp-date">价格日期</label>
                <input type="date" id="rcp-date" class="form-control">
                <small class="text-muted">留空则使用定价日历当天</small>
            </div>
        </form>`

if (app.includes(oldRcpForm)) {
  app = app.replace(oldRcpForm, newRcpForm)
  console.log('✅ 收货价格表单：添加了"价格日期"字段')
} else if (app.includes('id="rcp-date"')) {
  console.log('✅ 收货价格表单已有"价格日期"字段')
} else {
  console.log('❌ 未找到收货价格表单')
}

// 2. 修改收货价格编辑表单 - 添加价格日期字段
const oldRcpEditForm = `<label for="rcp-edit-price">价格（元/吨） <span class="required">*</span></label>
                <input type="number" id="rcp-edit-price" class="form-control" step="0.01" min="0" required>
            </div>
        </form>`

const newRcpEditForm = `<label for="rcp-edit-price">价格（元/吨） <span class="required">*</span></label>
                <input type="number" id="rcp-edit-price" class="form-control" step="0.01" min="0" required>
            </div>
            <div class="form-group">
                <label for="rcp-edit-date">价格日期</label>
                <input type="date" id="rcp-edit-date" class="form-control">
            </div>
        </form>`

if (app.includes(oldRcpEditForm)) {
  app = app.replace(oldRcpEditForm, newRcpEditForm)
  console.log('✅ 收货价格编辑表单：添加了"价格日期"字段')
} else if (app.includes('id="rcp-edit-date"')) {
  console.log('✅ 收货价格编辑表单已有"价格日期"字段')
} else {
  console.log('❌ 未找到收货价格编辑表单')
}

// 3. 修改 rcpManualSubmit 函数 - 提交时带上价格日期
const oldSubmit = 'if(isNaN(n)||n<0)throw Error(`请填写有效价格`);await Api.request(`POST`,`/tl/warehouse_receipt_prices`,{库房id:e,品类id:t,价格:n})'
const newSubmit = 'if(isaN(n)||n<0)throw Error(`请填写有效价格`);var rd=document.getElementById(`rcp-date`),rv=rd&&rd.value?rd.value.trim():``;var body={库房id:e,品类id:t,价格:n};if(rv)body.价格日期=rv;await Api.request(`POST`,`/tl/warehouse_receipt_prices`,body)'

// Fix typo
const newSubmitFixed = 'if(isNaN(n)||n<0)throw Error(`请填写有效价格`);var rd=document.getElementById(`rcp-date`),rv=rd&&rd.value?rd.value.trim():``;var body={库房id:e,品类id:t,价格:n};if(rv)body.价格日期=rv;await Api.request(`POST`,`/tl/warehouse_receipt_prices`,body)'

if (app.includes(oldSubmit)) {
  app = app.replace(oldSubmit, newSubmitFixed)
  console.log('✅ rcpManualSubmit：添加了价格日期提交')
} else {
  console.log('⚠️ rcpManualSubmit 需要手动检查')
}

// 4. 修改 rcpEditPrice 函数 - 编辑时显示和提交价格日期
const oldEditPrice = 'onConfirm:async function(){var t=parseFloat(document.getElementById(`rcp-edit-price`).value);if(isNaN(t)||t<0)throw Error(`请填写有效价格`);await Api.request(`PUT`,`/tl/warehouse_receipt_prices/`+String(e),{价格:t})'
const newEditPrice = 'onConfirm:async function(){var t=parseFloat(document.getElementById(`rcp-edit-price`).value);if(isNaN(t)||t<0)throw Error(`请填写有效价格`);var ed=document.getElementById(`rcp-edit-date`),ev=ed&&ed.value?ed.value.trim():``;var body={价格:t};if(ev)body.价格日期=ev;await Api.request(`PUT`,`/tl/warehouse_receipt_prices/`+String(e),body)'

if (app.includes(oldEditPrice)) {
  app = app.replace(oldEditPrice, newEditPrice)
  console.log('✅ rcpEditPrice：添加了价格日期提交')
} else {
  console.log('⚠️ rcpEditPrice 需要手动检查')
}

fs.writeFileSync(appPath, app, 'utf8')
console.log('\n已保存修改')
