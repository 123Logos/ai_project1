const fs = require('fs')
const path = require('path')

const appPath = path.join(__dirname, '../public/embedded/price_system/assets/app-BZHDhlyu.js')
let app = fs.readFileSync(appPath, 'utf8')

// 修复编辑表单 - 添加价格日期
const oldEditEnd = 'id="rcp-edit-price" class="form-control" required>\n            </div>\n        </form>`}\nvar modalWhRows'

const newEditEnd = 'id="rcp-edit-price" class="form-control" required>\n            </div>\n            <div class="form-group">\n                <label for="rcp-edit-date">价格日期</label>\n                <input type="date" id="rcp-edit-date" class="form-control">\n            </div>\n        </form>`}\nvar modalWhRows'

if (app.includes(oldEditEnd)) {
  app = app.replace(oldEditEnd, newEditEnd)
  fs.writeFileSync(appPath, app, 'utf8')
  console.log('✅ 编辑表单添加价格日期')
} else if (app.includes('id="rcp-edit-date"')) {
  console.log('✅ 编辑表单已有价格日期')
} else {
  console.log('❌ 未找到编辑表单')
}
