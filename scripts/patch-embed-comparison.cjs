/**
 * Patches embedded price_system assets for map-aligned comparison table.
 * Run: node scripts/patch-embed-comparison.cjs
 */
const fs = require('fs')
const path = require('path')

const appPath = path.join(
  __dirname,
  '../public/embedded/price_system/assets/app-BZHDhlyu.js',
)
const indexPath = path.join(
  __dirname,
  '../public/embedded/price_system/assets/index-e7CRb-gt.js',
)

const newHtUt = `function Ht(e,t){t=t||i&&i.priceMode||\`base\`;var T=(typeof globalThis!==\`undefined\`&&globalThis.TlComparisonRanking)||(typeof window!==\`undefined\`&&window.TlComparisonRanking);if(T&&typeof T.rankingsFromComparisonResponse==\`function\`){var mode=t===\`tax3\`?\`tax3\`:\`base\`,raw=e&&typeof e==\`object\`&&!Array.isArray(e)?e:{},detail=ye(e),ranks=T.rankingsFromComparisonResponse(raw,detail,mode);return a=ranks,Ut(ranks),void(ranks.length&&Wt({silent:!0}))}var n=i;if(e&&typeof e==\`object\`&&!Array.isArray(e)&&Array.isArray(e.冶炼厂利润排行)&&e.冶炼厂利润排行.length){for(var d=ye(e),f=e.冶炼厂利润排行,p=[],m=0;m<f.length;m++){var h=f[m],g=h.冶炼厂||\`-\`,y=t===\`tax3\`?v(h,[\`利润_含3%合计\`,\`利润_含3%\`,\`利润\`]):v(h,[\`利润_基准合计\`,\`利润_基准\`,\`利润\`]),b=y==null?0:Number(y),_={},k=0,w=0;d.forEach(function(e){var t=e.冶炼厂||\`\`,n=t===g||t.includes(g)||g.includes(t);if(!n)return;var r=e.品类||\`-\`,i=v(e,[\`单价\`,\`基准价\`,\`报价\`]),a=v(e,[\`总价\`,\`报价金额\`]),o=v(e,[\`总运费\`]);_[r]=null!=i&&!isNaN(i)?i:\`-\`,null!=a&&!isNaN(a)&&(k+=a),null!=o&&!isNaN(o)&&(w+=o)});if(!Object.keys(_).length){var x=d.find(function(e){var t=e.冶炼厂||\`\`;return t===g||t.includes(g)||g.includes(t)});if(x){var P=x.品类||\`-\`,N=v(x,[\`单价\`,\`基准价\`,\`报价\`]);_[P]=null!=N&&!isNaN(N)?N:\`-\`,k||(k=v(x,[\`总价\`,\`报价金额\`])||0),w||(w=v(x,[\`总运费\`])||0)}}p.push({rank:m+1,smelter:g,prices:_,totalRecovery:k,freightPerTon:0,freightTotal:w,profit:b})}a=p,Ut(p),p.length&&Wt({silent:!0});return}e=Array.isArray(e)?e:ye(e);e=Array.isArray(e)?e:[];let r={};e.forEach(function(e){var i=e.品类||\`-\`;if(!j(i)&&I(e)){var a=(e.冶炼厂||\`-\`)+\`|\`+(e.仓库||\`-\`);r[a]||(r[a]={smelter:e.冶炼厂||\`-\`,prices:{},freightSum:0,freightCount:0,materialSum:0,qtySum:0});var o=r[a],s=be(e,t),c=xe(e),l=c==null?NaN:Number(c),u=Se(e,n);o.prices[i]=s??\`-\`,isNaN(l)||(o.freightSum+=l,o.freightCount+=1),o.qtySum+=u,s!=null&&!isNaN(s)&&u>0&&(o.materialSum+=s*u)}});let o=Object.values(r).map(function(e){var t=e.freightCount?e.freightSum/e.freightCount:0,n=t*e.qtySum,r=e.materialSum-n;return{smelter:e.smelter,prices:e.prices,totalRecovery:e.materialSum,freightPerTon:t,freightTotal:n,profit:r}}).sort(function(e,t){return t.profit-e.profit}).map(function(e,t){return e.rank=t+1,e});a=o,Ut(o),o.length&&Wt({silent:!0})}function Ut(e){function o0(n){return Math.round(Number(n||0)*100)/100}function f0(n){return o0(n).toLocaleString(\`zh-CN\`,{maximumFractionDigits:2})}function optYen(x){if(x===void 0||x===null||!Number.isFinite(x))return\`\`;return\`¥\`+Number(x).toLocaleString(void 0,{minimumFractionDigits:2,maximumFractionDigits:2})}function xrbTitle(row){if(row.xunRongBaoExcludedPricing)return\`本行为不含循融宝口径（来自接口「不含循融宝」对象）；运费与含循融宝行一致。\`;var n=row.xunRongBaoSurchargeYuanPerTon,s=\`列表金额与排序为含循融宝口径（与接口顶层字段一致）。\`;return n!=null&&Number.isFinite(n)?n+\` 元/吨（在不含税基准上加价后重算含税列）；\`+s:\`该冶炼厂已开循融宝。\`+s}let t=document.getElementById(\`comparison-results\`),n=document.getElementById(\`comparison-table-body\`),r=document.getElementById(\`best-smelter\`),bu=document.getElementById(\`best-unit-price\`),i=document.getElementById(\`total-cost\`),a=document.getElementById(\`savings\`);if(!t||!n)return;var legacy=e.length&&e[0]&&e[0].profit!==void 0&&e[0].netProfit===void 0;if(legacy){t.style.display=\`block\`,r&&(r.textContent=e.length>0?e[0].smelter:\`-\`),bu&&(bu.textContent=\`-\`),i&&(i.textContent=e.length>0?\`¥\`+e[0].profit.toLocaleString():\`-\`),a&&(e.length>1?a.textContent=\`¥\`+(e[0].profit-e[1].profit).toLocaleString():a.textContent=\`-\`),n.innerHTML=\`\`,e.forEach(function(e){var tr=document.createElement(\`tr\`),pr=Object.entries(e.prices).map(function(e){var t=String(e[0]||\`\`).trim()||\`-\`,n=e[1],r=n===\`-\`?\`-\`:Number(n).toLocaleString();return M(t)+\`: ¥\`+r}).join(\`<br>\`);var i=e.totalRecovery==null?NaN:Number(e.totalRecovery),ac=!isFinite(i)||i===0?\`-\`:\`¥\`+i.toLocaleString();tr.innerHTML=\`
            <td>\${e.rank}</td>
            <td>\${M(e.smelter)}</td>
            <td colspan="2"></td>
            <td>\${pr}</td>
            <td>\${ac}</td>
            <td>¥\${Number(e.freightTotal||0).toLocaleString(void 0,{minimumFractionDigits:2,maximumFractionDigits:2})}</td>
            <td>¥\${e.profit.toLocaleString()}</td>
        \`,n.appendChild(tr)});var po=document.getElementById(\`purchase-suggestion-box\`);return void(po&&(po.style.display=e.length?\`block\`:\`none\`))}t.style.display=\`block\`;var sorted=e.length?e.slice().sort(function(x,y){return x.rank-y.rank}):[],first=sorted[0],second=sorted[1];r&&(r.textContent=first?first.smelter:\`-\`),bu&&(bu.textContent=first?\`¥ \`+f0(first.unitPrice):\`-\`),i&&(i.textContent=first?\`¥ \`+f0(first.netProfit):\`-\`),a&&(second?a.textContent=\`¥ \`+f0(first.netProfit-second.netProfit):a.textContent=\`-\`),n.innerHTML=\`\`,e.forEach(function(e){var cats=e.categoryPrices||e.prices||{},html=Object.keys(cats).length?Object.entries(cats).map(function(t){var n=String(t[0]||\`\`).trim()||\`-\`,r=t[1];return r==null||!Number.isFinite(r)?M(n)+\`: —\`:M(n)+\`: ¥\`+Number(r).toLocaleString(\`zh-CN\`)}).join(\`<br>\`):e.unitPrice>0?\`均价: ¥\`+Number(o0(e.unitPrice)).toLocaleString(\`zh-CN\`):\`—\`;var rec=e.totalRecovery==null?NaN:Number(e.totalRecovery),recCell=!isFinite(rec)||rec===0?\`—\`:\`¥\`+rec.toLocaleString(\`zh-CN\`);var xrb=e.xunRongBao&&!e.xunRongBaoExcludedPricing?\`<span class="ps-cmp-xrb" title="\`+M(xrbTitle(e))+\`">循</span>\`:\`\`;var tr=document.createElement(\`tr\`);tr.innerHTML=\`
            <td><span class="ps-cmp-rank-wrap"><span class="ps-cmp-rank-num">\${e.rank}</span>\${xrb}</span></td>
            <td>\${M(e.smelter)}</td>
            <td>\${M(optYen(e.lineUnitPrice))}</td>
            <td>\${M(optYen(e.freightUnitPrice))}</td>
            <td>\${html}</td>
            <td>\${recCell}</td>
            <td>¥\${Number(e.totalFreight||0).toLocaleString(void 0,{minimumFractionDigits:2,maximumFractionDigits:2})}</td>
            <td>¥ \${f0(e.netProfit)}</td>
        \`,n.appendChild(tr)});var pc=document.getElementById(\`purchase-suggestion-box\`);pc&&(pc.style.display=e.length?\`block\`:\`none\`)}`

let app = fs.readFileSync(appPath, 'utf8')
const start = app.indexOf('function Ht(e,t){')
const end = app.indexOf('async function Wt')
if (start < 0 || end < 0) {
  console.error('Could not find Ht/Wt markers in app-BZHDhlyu.js')
  process.exit(1)
}
app = app.slice(0, start) + newHtUt + app.slice(end)
fs.writeFileSync(appPath, app, 'utf8')
console.log('Patched app-BZHDhlyu.js')

let idx = fs.readFileSync(indexPath, 'utf8')
const oldSummary =
  '<div class="summary-item" data-v-4b5a159b><span class="summary-label" data-v-4b5a159b>最优方案</span><span class="summary-value highlight" id="best-smelter" data-v-4b5a159b>-</span></div><div class="summary-item" data-v-4b5a159b><span class="summary-label" data-v-4b5a159b>总利润</span><span class="summary-value" id="total-cost" data-v-4b5a159b>-</span></div>'
const newSummary =
  '<div class="summary-item" data-v-4b5a159b><span class="summary-label" data-v-4b5a159b>最优方案</span><span class="summary-value highlight" id="best-smelter" data-v-4b5a159b>-</span></div><div class="summary-item" data-v-4b5a159b><span class="summary-label" data-v-4b5a159b>单价</span><span class="summary-value" id="best-unit-price" data-v-4b5a159b>-</span></div><div class="summary-item" data-v-4b5a159b><span class="summary-label" data-v-4b5a159b>总利润</span><span class="summary-value" id="total-cost" data-v-4b5a159b>-</span></div>'
if (!idx.includes(oldSummary)) {
  console.error('index-e7CRb-gt.js: expected summary HTML not found')
  process.exit(1)
}
idx = idx.split(oldSummary).join(newSummary)

const oldTh =
  '<thead data-v-4b5a159b><tr data-v-4b5a159b><th data-v-4b5a159b>排名</th><th data-v-4b5a159b>冶炼厂名称</th><th data-v-4b5a159b>各品种单价</th><th data-v-4b5a159b>总回收价</th><th data-v-4b5a159b>总运费</th><th data-v-4b5a159b>利润</th></tr></thead>'
const newTh =
  '<thead data-v-4b5a159b><tr data-v-4b5a159b><th data-v-4b5a159b>排名</th><th data-v-4b5a159b>冶炼厂名称</th><th data-v-4b5a159b>单价</th><th data-v-4b5a159b>运费单价</th><th data-v-4b5a159b>各品种单价</th><th data-v-4b5a159b>总回收价</th><th data-v-4b5a159b>总运费</th><th data-v-4b5a159b>利润</th></tr></thead>'
if (!idx.includes(oldTh)) {
  console.error('index-e7CRb-gt.js: expected thead HTML not found')
  process.exit(1)
}
idx = idx.split(oldTh).join(newTh)
fs.writeFileSync(indexPath, idx, 'utf8')
console.log('Patched index-e7CRb-gt.js')
