/**
 * 智能比价：比价结果字段与调用参数与电子地图对齐
 * Run: node scripts/patch-smart-comparison-align-emap.cjs
 */
const fs = require('fs')
const path = require('path')

const root = path.join(__dirname, '..')
const rankingPath = path.join(root, 'public/embedded/price_system/assets/tl-comparison-ranking.js')
const appPath = path.join(root, 'public/embedded/price_system/assets/app-BZHDhlyu.js')
const indexPath = path.join(root, 'public/embedded/price_system/assets/index-e7CRb-gt.js')

// --- tl-comparison-ranking.js: insert field pickers after pickNumberComparisonDetail ---
let ranking = fs.readFileSync(rankingPath, 'utf8')

const pickHelpers = `
  function pickComparisonTotalGoods(row) {
    var top = pickNumber(row, ['总货款'])
    if (top != null && Number.isFinite(top)) return top
    return pickNumberComparisonDetail(row, [
      '总货款',
      '总价',
      '总回收价',
      'total_recovery',
      '报价金额',
      '物料总价',
      'material_sum',
    ])
  }

  function pickComparisonFreight(row) {
    var top = pickNumber(row, ['运费'])
    if (top != null && Number.isFinite(top)) return top
    return pickNumberComparisonDetail(row, ['运费', '总运费', '运费合计'])
  }

  function pickComparisonNetGoods(row) {
    var top = pickNumber(row, ['净货款'])
    if (top != null && Number.isFinite(top)) return top
    return pickNumberComparisonDetail(row, ['净货款', '利润_基准', '利润_含3%', '利润'])
  }

  function pickComparisonValuePerTon(row) {
    var top = pickNumber(row, ['每吨净值'])
    if (top != null && Number.isFinite(top)) return top
    return pickNumberComparisonDetail(row, ['每吨净值'])
  }

  function pickComparisonGrossProfit(row) {
    var src = comparisonDetailValueSource(row)
    if (Object.prototype.hasOwnProperty.call(src, '毛利') && src['毛利'] == null) return null
    var v = pickNumber(src, ['毛利', 'gross_profit'])
    if (v != null && Number.isFinite(v)) return v
    if (src !== row) {
      if (Object.prototype.hasOwnProperty.call(row, '毛利') && row['毛利'] == null) return null
      return pickNumber(row, ['毛利', 'gross_profit'])
    }
    return null
  }

  function pickComparisonGrossProfitPerTon(row) {
    var src = comparisonDetailValueSource(row)
    if (Object.prototype.hasOwnProperty.call(src, '每吨毛利') && src['每吨毛利'] == null) return null
    var v = pickNumber(src, ['每吨毛利', 'gross_profit_per_ton'])
    if (v != null && Number.isFinite(v)) return v
    if (src !== row) {
      if (Object.prototype.hasOwnProperty.call(row, '每吨毛利') && row['每吨毛利'] == null) return null
      return pickNumber(row, ['每吨毛利', 'gross_profit_per_ton'])
    }
    return null
  }

  function accumulateComparisonMoneyFromRows(rows) {
    var totalGoods = 0
    var freight = 0
    var netGoods = 0
    var grossProfitSum = 0
    var grossProfitAny = false
    var grossProfitAllNull = true
    var vptNum = 0
    var vptDen = 0
    var gptNum = 0
    var gptDen = 0
    var qtySum = 0
    for (var i = 0; i < rows.length; i++) {
      var row = rows[i]
      var qty = pickNumber(row, ['吨数', 'quantity', 'qty', '需求吨数', 'weight']) ?? 0
      var qtyEff = Math.max(0, qty)
      qtySum += qtyEff
      var tg = pickComparisonTotalGoods(row)
      var fr = pickComparisonFreight(row)
      var ng = pickComparisonNetGoods(row)
      var gp = pickComparisonGrossProfit(row)
      var vpt = pickComparisonValuePerTon(row)
      var gpt = pickComparisonGrossProfitPerTon(row)
      if (tg != null && Number.isFinite(tg)) totalGoods += tg
      if (fr != null && Number.isFinite(fr)) freight += fr
      if (ng != null && Number.isFinite(ng)) netGoods += ng
      if (gp != null && Number.isFinite(gp)) {
        grossProfitSum += gp
        grossProfitAny = true
        grossProfitAllNull = false
      } else if (!Object.prototype.hasOwnProperty.call(row, '毛利') || row['毛利'] != null) {
        grossProfitAllNull = false
      }
      if (vpt != null && Number.isFinite(vpt) && qtyEff > 0) {
        vptNum += vpt * qtyEff
        vptDen += qtyEff
      }
      if (gpt != null && Number.isFinite(gpt) && qtyEff > 0) {
        gptNum += gpt * qtyEff
        gptDen += qtyEff
      }
    }
    return {
      totalGoods: totalGoods,
      freight: freight,
      netGoods: netGoods,
      grossProfit: grossProfitAny ? grossProfitSum : grossProfitAllNull ? null : grossProfitSum,
      valuePerTon: vptDen > 0 ? vptNum / vptDen : null,
      grossProfitPerTon: gptDen > 0 ? gptNum / gptDen : null,
      qtySum: qtySum,
    }
  }
`

if (!ranking.includes('function pickComparisonTotalGoods')) {
  ranking = ranking.replace(
    '  function pickDetailUnitPrice(row, priceMode) {',
    pickHelpers + '\n  function pickDetailUnitPrice(row, priceMode) {',
  )
}

// parseSmelterProfitRankArray
const oldParseSmelter = ranking.match(
  /function parseSmelterProfitRankArray\(arr, priceMode\) \{[\s\S]*?return out\n  \}/,
)
if (oldParseSmelter && !ranking.includes('pickComparisonNetGoods(row)')) {
  ranking = ranking.replace(
    oldParseSmelter[0],
    `function parseSmelterProfitRankArray(arr, priceMode) {
    if (!Array.isArray(arr)) return []
    var out = []
    var fallback = 0
    for (var ii = 0; ii < arr.length; ii++) {
      var item = arr[ii]
      if (!item || typeof item !== 'object') continue
      var row = item
      var smelter = pickStr(row, [
        '冶炼厂',
        'smelter',
        'smelter_name',
        '冶炼厂名',
        'factory_name',
        'name',
        '厂名',
      ])
      if (!smelter) continue
      fallback += 1
      var rank = pickNumber(row, ['rank', '名次', '排序', '排行', '排名']) ?? fallback
      var netProfit =
        pickComparisonNetGoods(row) ?? pickProfitFromSmelterRankRow(row, priceMode)
      var totalRecovery = pickComparisonTotalGoods(row) ?? 0
      var totalFreight = pickComparisonFreight(row) ?? 0
      var qtySum = pickNumber(row, ['吨数', 'quantity', 'qtySum', 'qty', '需求吨数']) ?? 0
      var unitPriceRaw = pickNumber(row, [
        '单价',
        '回收单价',
        'unit_price',
        '最优价',
        'price',
        '基准价',
        '3%含税价',
      ])
      var unitPrice = unitPriceRaw != null ? unitPriceRaw : qtySum > 0 ? totalRecovery / qtySum : 0
      var vpt = pickComparisonValuePerTon(row)
      var gp = pickComparisonGrossProfit(row)
      var gpt = pickComparisonGrossProfitPerTon(row)
      out.push({
        rank: rank,
        smelter: smelter,
        unitPrice: toDisplayNum(unitPrice),
        netProfit: toDisplayNum(netProfit ?? 0),
        totalRecovery: toDisplayNum(totalRecovery),
        totalFreight: toDisplayNum(totalFreight),
        qtySum: toDisplayNum(qtySum),
        valuePerTon: vpt != null ? toDisplayNum(vpt) : null,
        grossProfit: gp != null ? toDisplayNum(gp) : gp,
        grossProfitPerTon: gpt != null ? toDisplayNum(gpt) : gpt,
      })
    }
    out.sort(function (a, b) {
      return a.rank - b.rank
    })
    return out
  }`,
  )
}

// mergeComparisonRanksWithDetailRows - replace body that uses old accumulation
const mergeStart = ranking.indexOf('function mergeComparisonRanksWithDetailRows')
const mergeEnd = ranking.indexOf('  function pickComparisonPayload', mergeStart)
if (mergeStart >= 0 && mergeEnd > mergeStart && !ranking.slice(mergeStart, mergeEnd).includes('accumulateComparisonMoneyFromRows')) {
  ranking =
    ranking.slice(0, mergeStart) +
    `function mergeComparisonRanksWithDetailRows(ranks, detailRows, priceMode) {
    if (!detailRows.length) return ranks
    return ranks.map(function (r) {
      var rows = detailRows.filter(function (row) {
        var name = pickStr(row, [
          '冶炼厂',
          'smelter',
          'smelter_name',
          '冶炼厂名',
          'factory_name',
          'name',
        ])
        if (!name) return false
        return name === r.smelter || name.includes(r.smelter) || r.smelter.includes(name)
      })
      if (!rows.length) return r
      var categoryPrices = {}
      var unitNum = 0
      var unitDen = 0
      var strictLineNum = 0
      var strictLineDen = 0
      var strictFpuNum = 0
      var strictFpuDen = 0
      var xunRongBao = false
      var xunRongBaoSurchargeYuanPerTon = null
      for (var i = 0; i < rows.length; i++) {
        var row = rows[i]
        var cat = pickStr(row, ['品类', 'category', '品种', '产品品种', 'category_name']) || '—'
        var upDetail = pickDetailUnitPrice(row, priceMode)
        categoryPrices[cat] = upDetail != null && Number.isFinite(upDetail) ? upDetail : null
        var qty = pickNumber(row, ['吨数', 'quantity', 'qty', '需求吨数', 'weight']) ?? 0
        var qtyEff = Math.max(0, qty)
        var up = pickNumberComparisonDetail(row, [
          '单价',
          '基准价',
          '含3%税价',
          '报价',
          'unit_price',
          '最优价',
        ])
        if (up != null && qty > 0) {
          unitNum += up * qty
          unitDen += qty
        }
        var strictLine = pickNumberComparisonDetail(row, ['单价'])
        if (strictLine != null && Number.isFinite(strictLine) && qtyEff > 0) {
          strictLineNum += strictLine * qtyEff
          strictLineDen += qtyEff
        }
        var strictFpu = pickNumberComparisonDetail(row, ['运费单价', 'freight_per_ton'])
        if (strictFpu != null && Number.isFinite(strictFpu) && qtyEff > 0) {
          strictFpuNum += strictFpu * qtyEff
          strictFpuDen += qtyEff
        }
        if (detailRowXunRongBaoOn(row)) {
          xunRongBao = true
          var s = detailRowXunRongBaoSurcharge(row)
          if (xunRongBaoSurchargeYuanPerTon == null && s != null && Number.isFinite(s)) {
            xunRongBaoSurchargeYuanPerTon = s
          }
        }
      }
      var money = accumulateComparisonMoneyFromRows(rows)
      var unitPrice =
        unitDen > 0
          ? unitNum / unitDen
          : pickNumberComparisonDetail(rows[0], ['单价', '基准价', '报价']) ?? 0
      var netProfit =
        money.netGoods > 0
          ? money.netGoods
          : money.totalGoods - money.freight > 0
            ? money.totalGoods - money.freight
            : r.netProfit
      var out = Object.assign({}, r, {
        categoryPrices: categoryPrices,
        unitPrice: toDisplayNum(unitPrice),
        totalRecovery: toDisplayNum(money.totalGoods > 0 ? money.totalGoods : r.totalRecovery),
        totalFreight: toDisplayNum(money.freight > 0 ? money.freight : r.totalFreight),
        netProfit: toDisplayNum(netProfit),
        qtySum: toDisplayNum(money.qtySum > 0 ? money.qtySum : r.qtySum),
        valuePerTon: money.valuePerTon != null ? toDisplayNum(money.valuePerTon) : null,
        grossProfit:
          money.grossProfit != null && Number.isFinite(money.grossProfit)
            ? toDisplayNum(money.grossProfit)
            : money.grossProfit,
        grossProfitPerTon:
          money.grossProfitPerTon != null && Number.isFinite(money.grossProfitPerTon)
            ? toDisplayNum(money.grossProfitPerTon)
            : money.grossProfitPerTon,
        lineUnitPrice: strictLineDen > 0 ? toDisplayNum(strictLineNum / strictLineDen) : undefined,
        freightUnitPrice: strictFpuDen > 0 ? toDisplayNum(strictFpuNum / strictFpuDen) : undefined,
      })
      if (xunRongBao) {
        out.xunRongBao = true
        out.xunRongBaoSurchargeYuanPerTon = xunRongBaoSurchargeYuanPerTon
      }
      return out
    })
  }

` +
    ranking.slice(mergeEnd)
}

// parseRankRowsLoose
const looseStart = ranking.indexOf('function parseRankRowsLoose')
const looseEnd = ranking.indexOf('  function detailRowsForSmelterName', looseStart)
if (looseStart >= 0 && looseEnd > looseStart && !ranking.slice(looseStart, looseEnd).includes('pickComparisonTotalGoods')) {
  ranking =
    ranking.slice(0, looseStart) +
    `function parseRankRowsLoose(rows, priceMode) {
    var out = []
    var fallback = 0
    for (var i = 0; i < rows.length; i++) {
      var row = rows[i]
      var smelter = pickStr(row, [
        '冶炼厂名称',
        '冶炼厂',
        '冶炼厂名',
        'smelter_name',
        'smelter',
        'factory_name',
        'name',
      ])
      var netProfitRaw =
        priceMode === 'tax3'
          ? (pickNumberComparisonDetail(row, ['利润_含3%', '利润']) ?? 0)
          : (pickNumberComparisonDetail(row, ['利润_基准', '利润']) ?? 0)
      var hasProfitLike =
        pickNumberComparisonDetail(row, ['利润', '利润_基准', '利润_含3%', '净收益', 'profit', '净货款']) != null
      if (!smelter || !hasProfitLike) continue
      fallback += 1
      var rank = pickNumber(row, ['排名', '排行', '排序', 'rank', '名次']) ?? fallback
      var netProfit = pickComparisonNetGoods(row) ?? netProfitRaw
      var totalRecovery = pickComparisonTotalGoods(row) ?? 0
      var totalFreight = pickComparisonFreight(row) ?? 0
      var qtySum = pickNumber(row, ['吨数', 'quantity', 'qty', '需求吨数']) ?? 0
      var unitPriceRaw = pickNumberComparisonDetail(row, [
        '单价',
        '回收单价',
        'unit_price',
        '最优价',
        'price',
        '基准价',
        '3%含税价',
      ])
      var unitPrice = unitPriceRaw != null ? unitPriceRaw : qtySum > 0 ? totalRecovery / qtySum : 0
      var strictLineUp = pickNumberComparisonDetail(row, ['单价'])
      var strictFpu = pickNumberComparisonDetail(row, ['运费单价', 'freight_per_ton'])
      var vpt = pickComparisonValuePerTon(row)
      var gp = pickComparisonGrossProfit(row)
      var gpt = pickComparisonGrossProfitPerTon(row)
      out.push({
        rank: rank,
        smelter: smelter,
        unitPrice: toDisplayNum(unitPrice),
        netProfit: toDisplayNum(netProfit),
        totalRecovery: toDisplayNum(totalRecovery),
        totalFreight: toDisplayNum(totalFreight),
        qtySum: toDisplayNum(qtySum),
        lineUnitPrice:
          strictLineUp != null && Number.isFinite(strictLineUp) ? toDisplayNum(strictLineUp) : undefined,
        freightUnitPrice:
          strictFpu != null && Number.isFinite(strictFpu) ? toDisplayNum(strictFpu) : undefined,
        valuePerTon: vpt != null ? toDisplayNum(vpt) : null,
        grossProfit: gp != null ? toDisplayNum(gp) : gp,
        grossProfitPerTon: gpt != null ? toDisplayNum(gpt) : gpt,
      })
    }
    out.sort(function (a, b) {
      return a.rank - b.rank
    })
    return out
  }

` +
    ranking.slice(looseEnd)
}

// buildExcludedComparisonRankFromDetails
const exStart = ranking.indexOf('function buildExcludedComparisonRankFromDetails')
const exEnd = ranking.indexOf('  function expandComparisonRanksWithXunRongBaoExcludedRows', exStart)
if (exStart >= 0 && exEnd > exStart && !ranking.slice(exStart, exEnd).includes('netGoods')) {
  ranking =
    ranking.slice(0, exStart) +
    `function buildExcludedComparisonRankFromDetails(base, detailRows, priceMode) {
    var rows = detailRowsForSmelterName(base.smelter, detailRows)
    if (!rows.length) return null
    if (!rows.some(detailRowXunRongBaoOn)) return null
    if (!rows.some(comparisonDetailExcludedValueSource)) return null

    var categoryPrices = {}
    var totalRecovery = 0
    var totalFreight = 0
    var netGoods = 0
    var grossProfitSum = 0
    var grossProfitAny = false
    var grossProfitAllNull = true
    var vptNum = 0
    var vptDen = 0
    var gptNum = 0
    var gptDen = 0
    var qtySum = 0
    var unitNum = 0
    var unitDen = 0
    var strictLineNum = 0
    var strictLineDen = 0
    var strictFpuNum = 0
    var strictFpuDen = 0

    for (var i = 0; i < rows.length; i++) {
      var row = rows[i]
      if (!detailRowXunRongBaoOn(row)) continue
      var ex = comparisonDetailExcludedValueSource(row)
      if (!ex) continue
      var cat = pickStr(row, ['品类', 'category', '品种', '产品品种', 'category_name']) || '—'
      var upDetail = pickDetailUnitPriceExcluded(row, priceMode)
      categoryPrices[cat] = upDetail != null && Number.isFinite(upDetail) ? upDetail : null
      var qty = pickNumber(row, ['吨数', 'quantity', 'qty', '需求吨数', 'weight']) ?? 0
      var qtyEff = Math.max(0, qty)
      var up = pickNumber(ex, ['单价', '基准价', '含3%税价', '报价', 'unit_price', '最优价'])
      var tot =
        pickNumber(ex, ['总货款']) ??
        pickNumber(ex, ['总回收价', 'total_recovery']) ??
        pickNumber(ex, ['总价', '报价金额', '物料总价', 'material_sum'])
      var tf = pickNumber(ex, ['运费', '总运费', '运费合计'])
      var ng = pickNumber(ex, ['净货款', '利润_基准', '利润_含3%', '利润'])
      var gp = pickNumber(ex, ['毛利'])
      var vpt = pickNumber(ex, ['每吨净值'])
      var gpt = pickNumber(ex, ['每吨毛利'])
      if (tot != null && Number.isFinite(tot)) totalRecovery += tot
      else if (up != null && qty > 0) totalRecovery += up * qty
      if (tf != null && Number.isFinite(tf)) totalFreight += tf
      if (ng != null && Number.isFinite(ng)) netGoods += ng
      if (gp != null && Number.isFinite(gp)) {
        grossProfitSum += gp
        grossProfitAny = true
        grossProfitAllNull = false
      } else if (!Object.prototype.hasOwnProperty.call(ex, '毛利') || ex['毛利'] != null) {
        grossProfitAllNull = false
      }
      if (vpt != null && Number.isFinite(vpt) && qtyEff > 0) {
        vptNum += vpt * qtyEff
        vptDen += qtyEff
      }
      if (gpt != null && Number.isFinite(gpt) && qtyEff > 0) {
        gptNum += gpt * qtyEff
        gptDen += qtyEff
      }
      qtySum += qtyEff
      if (up != null && qty > 0) {
        unitNum += up * qty
        unitDen += qty
      }
      var strictLine = pickNumber(ex, ['单价'])
      if (strictLine != null && Number.isFinite(strictLine) && qtyEff > 0) {
        strictLineNum += strictLine * qtyEff
        strictLineDen += qtyEff
      }
      var strictFpu = pickNumber(ex, ['运费单价', 'freight_per_ton'])
      if (strictFpu != null && Number.isFinite(strictFpu) && qtyEff > 0) {
        strictFpuNum += strictFpu * qtyEff
        strictFpuDen += qtyEff
      }
    }

    if (qtySum <= 0 && totalRecovery <= 0 && strictLineDen <= 0) return null

    var netProfit = netGoods > 0 ? netGoods : totalRecovery - totalFreight
    if (netGoods <= 0) {
      var firstExRow = rows.find(function (r) {
        return detailRowXunRongBaoOn(r) && comparisonDetailExcludedValueSource(r)
      })
      if (firstExRow) {
        var ex0 = comparisonDetailExcludedValueSource(firstExRow)
        if (ex0) {
          var p =
            priceMode === 'tax3'
              ? pickNumber(ex0, ['利润_含3%', '利润', '净货款'])
              : pickNumber(ex0, ['利润_基准', '利润', '净货款'])
          if (p != null && Number.isFinite(p)) netProfit = p
        }
      }
    }

    var unitPrice =
      unitDen > 0
        ? unitNum / unitDen
        : (function () {
            var r0 = rows.find(function (r) {
              return detailRowXunRongBaoOn(r) && comparisonDetailExcludedValueSource(r)
            })
            var ex2 = r0 ? comparisonDetailExcludedValueSource(r0) : null
            return ex2 ? pickNumber(ex2, ['单价', '基准价', '报价']) ?? 0 : 0
          })()

    return {
      rank: base.rank,
      smelter: base.smelter,
      unitPrice: toDisplayNum(unitPrice),
      netProfit: toDisplayNum(netProfit),
      totalRecovery: toDisplayNum(totalRecovery),
      totalFreight: toDisplayNum(totalFreight),
      qtySum: toDisplayNum(qtySum),
      valuePerTon: vptDen > 0 ? toDisplayNum(vptNum / vptDen) : null,
      grossProfit: grossProfitAny
        ? toDisplayNum(grossProfitSum)
        : grossProfitAllNull
          ? null
          : toDisplayNum(grossProfitSum),
      grossProfitPerTon: gptDen > 0 ? toDisplayNum(gptNum / gptDen) : null,
      categoryPrices: categoryPrices,
      lineUnitPrice: strictLineDen > 0 ? toDisplayNum(strictLineNum / strictLineDen) : undefined,
      freightUnitPrice: strictFpuDen > 0 ? toDisplayNum(strictFpuNum / strictFpuDen) : undefined,
      xunRongBao: false,
      xunRongBaoExcludedPricing: true,
    }
  }

` +
    ranking.slice(exEnd)
}

// aggregateComparisonRows
const aggStart = ranking.indexOf('function aggregateComparisonRows')
const aggEnd = ranking.indexOf('  function rankingsFromComparisonResponse', aggStart)
if (aggStart >= 0 && aggEnd > aggStart && !ranking.slice(aggStart, aggEnd).includes('accumulateComparisonMoneyFromRows')) {
  ranking =
    ranking.slice(0, aggStart) +
    `function aggregateComparisonRows(rows, priceMode) {
    var grouped = new Map()
    for (var i = 0; i < rows.length; i++) {
      var row = rows[i]
      var smelter =
        pickStr(row, ['smelter_name', '冶炼厂', '冶炼厂名', 'smelter', 'factory_name']) || '未知冶炼厂'
      var unitPrice =
        pickNumberComparisonDetail(row, [
          'unit_price',
          '单价',
          '最优价',
          '价格',
          'price',
          'base_price',
          '不含税价',
          '3pct_price',
        ]) ?? 0
      var freight =
        pickNumberComparisonDetail(row, ['freight_per_ton', '运费单价', 'freight', '运费每吨']) ?? 0
      var lineTotalFreight = pickComparisonFreight(row)
      var qty = pickNumber(row, ['quantity', '吨数', '数量', 'qty', 'weight', '需求吨数']) ?? 1
      var key = smelter
      if (!grouped.has(key)) {
        grouped.set(key, {
          smelter: smelter,
          materialSum: 0,
          freightSum: 0,
          freightCount: 0,
          totalFreightSum: 0,
          qtySum: 0,
          categoryPrices: {},
          strictLineNum: 0,
          strictLineDen: 0,
          strictFpuNum: 0,
          strictFpuDen: 0,
          xunRongBao: false,
          xunRongBaoSurchargeYuanPerTon: null,
        })
      }
      var g = grouped.get(key)
      var cat = pickStr(row, ['品类', 'category', '品种', '产品品种', 'category_name']) || '—'
      var upLine = pickDetailUnitPrice(row, priceMode)
      g.categoryPrices[cat] = upLine != null && Number.isFinite(upLine) ? upLine : null
      var qtyEff = Math.max(0, qty)
      var lineRecovery = pickComparisonTotalGoods(row)
      if (lineRecovery != null && Number.isFinite(lineRecovery)) g.materialSum += lineRecovery
      else g.materialSum += unitPrice * qtyEff
      g.freightSum += freight
      g.freightCount += 1
      if (lineTotalFreight != null && Number.isFinite(lineTotalFreight)) g.totalFreightSum += lineTotalFreight
      g.qtySum += qtyEff
      var strictLine = pickNumberComparisonDetail(row, ['单价'])
      if (strictLine != null && Number.isFinite(strictLine) && qtyEff > 0) {
        g.strictLineNum += strictLine * qtyEff
        g.strictLineDen += qtyEff
      }
      var strictFpuOnly = pickNumberComparisonDetail(row, ['运费单价', 'freight_per_ton'])
      if (strictFpuOnly != null && Number.isFinite(strictFpuOnly) && qtyEff > 0) {
        g.strictFpuNum += strictFpuOnly * qtyEff
        g.strictFpuDen += qtyEff
      }
      if (detailRowXunRongBaoOn(row)) {
        g.xunRongBao = true
        var s = detailRowXunRongBaoSurcharge(row)
        if (g.xunRongBaoSurchargeYuanPerTon == null && s != null && Number.isFinite(s)) {
          g.xunRongBaoSurchargeYuanPerTon = s
        }
      }
    }
    return Array.from(grouped.values())
      .map(function (g) {
        var smelterRows = rows.filter(function (r) {
          return (
            (pickStr(r, ['smelter_name', '冶炼厂', '冶炼厂名', 'smelter', 'factory_name']) ||
              '未知冶炼厂') === g.smelter
          )
        })
        var money = accumulateComparisonMoneyFromRows(smelterRows)
        var avgFreightPerTon = g.freightCount > 0 ? g.freightSum / g.freightCount : 0
        var totalFreightFromLine =
          money.freight > 0
            ? money.freight
            : g.totalFreightSum > 0
              ? g.totalFreightSum
              : avgFreightPerTon * g.qtySum
        var totalGoods = money.totalGoods > 0 ? money.totalGoods : g.materialSum
        var netProfit =
          money.netGoods > 0 ? money.netGoods : totalGoods - totalFreightFromLine
        if (money.netGoods <= 0) {
          var sample = smelterRows[0]
          if (sample) {
            var backendProfit = pickComparisonNetGoods(sample)
            if (backendProfit != null && Number.isFinite(backendProfit)) netProfit = backendProfit
          }
        }
        var unitPrice2 = g.qtySum > 0 ? totalGoods / g.qtySum : 0
        var o = {
          smelter: g.smelter,
          unitPrice: toDisplayNum(unitPrice2),
          netProfit: toDisplayNum(netProfit),
          totalRecovery: toDisplayNum(totalGoods),
          totalFreight: toDisplayNum(totalFreightFromLine),
          qtySum: toDisplayNum(g.qtySum),
          valuePerTon: money.valuePerTon != null ? toDisplayNum(money.valuePerTon) : null,
          grossProfit:
            money.grossProfit != null && Number.isFinite(money.grossProfit)
              ? toDisplayNum(money.grossProfit)
              : money.grossProfit,
          grossProfitPerTon:
            money.grossProfitPerTon != null && Number.isFinite(money.grossProfitPerTon)
              ? toDisplayNum(money.grossProfitPerTon)
              : money.grossProfitPerTon,
          categoryPrices: g.categoryPrices,
          lineUnitPrice: g.strictLineDen > 0 ? toDisplayNum(g.strictLineNum / g.strictLineDen) : undefined,
          freightUnitPrice: g.strictFpuDen > 0 ? toDisplayNum(g.strictFpuNum / g.strictFpuDen) : undefined,
        }
        if (g.xunRongBao) {
          o.xunRongBao = true
          o.xunRongBaoSurchargeYuanPerTon = g.xunRongBaoSurchargeYuanPerTon
        }
        return o
      })
      .sort(function (a, b) {
        return b.netProfit - a.netProfit
      })
      .map(function (x, idx) {
        return Object.assign({}, x, { rank: idx + 1 })
      })
  }

` +
    ranking.slice(aggEnd)
}

ranking = ranking.replace(
  ' * 表头/列展示（货值、每吨货值等）与电子地图比价弹窗一致',
  ' * 表头/列展示（净货款、每吨净值、毛利等）与电子地图比价弹窗一致',
)

fs.writeFileSync(rankingPath, ranking, 'utf8')
console.log('patched tl-comparison-ranking.js')

// --- index: table headers + summary label ---
let idx = fs.readFileSync(indexPath, 'utf8')

const oldHead =
  '<th data-v-4b5a159b>排名</th><th data-v-4b5a159b>冶炼厂名称</th><th data-v-4b5a159b>运费单价</th><th data-v-4b5a159b>各品种单价</th><th data-v-4b5a159b>总回收价</th><th data-v-4b5a159b>总运费</th><th data-v-4b5a159b>货值</th><th data-v-4b5a159b>每吨货值</th>'
const newHead =
  '<th data-v-4b5a159b>排名</th><th data-v-4b5a159b>冶炼厂</th><th data-v-4b5a159b>运费单价</th><th data-v-4b5a159b>冶炼厂回收单价</th><th data-v-4b5a159b>总货款</th><th data-v-4b5a159b>总运费</th><th data-v-4b5a159b>净货款</th><th data-v-4b5a159b>每吨净值</th><th data-v-4b5a159b>毛利</th><th data-v-4b5a159b>每吨毛利</th>'

if (idx.includes(oldHead)) {
  idx = idx.split(oldHead).join(newHead)
} else if (!idx.includes('每吨毛利')) {
  console.warn('index: table header anchor not found')
}

if (idx.includes('>总货值</span>')) {
  idx = idx.split('>总货值</span>').join('>净货款</span>')
}

fs.writeFileSync(indexPath, idx, 'utf8')
console.log('patched index-e7CRb-gt.js')

// --- app: Ut() rendering ---
let app = fs.readFileSync(appPath, 'utf8')

const utOld = `function Ut(e){function o0(n){return Math.round(Number(n||0)*100)/100}function f0(n){return o0(n).toLocaleString(\`zh-CN\`,{maximumFractionDigits:2})}function optYen(x){if(x===void 0||x===null||!Number.isFinite(x))return\`\`;return\`¥\`+Number(x).toLocaleString(void 0,{minimumFractionDigits:2,maximumFractionDigits:2})}`

const utNew = `function Ut(e){function o0(n){return Math.round(Number(n||0)*100)/100}function f0(n){return o0(n).toLocaleString(\`zh-CN\`,{maximumFractionDigits:2})}function optYen(x){if(x===void 0||x===null||!Number.isFinite(x))return\`\`;return\`¥\`+Number(x).toLocaleString(void 0,{minimumFractionDigits:2,maximumFractionDigits:2})}function fmtMoney(n){if(n==null||!Number.isFinite(n))return\`—\`;return\`¥\`+f0(n)}function fmtGross(n){if(n==null||!Number.isFinite(n))return\`—\`;return\`¥\`+f0(n)}function fmtVpt(row){if(row.valuePerTon!=null&&Number.isFinite(row.valuePerTon))return fmtMoney(row.valuePerTon);if(!row.qtySum||row.qtySum<=0||!Number.isFinite(row.netProfit))return\`—\`;return fmtMoney(row.netProfit/row.qtySum)}`

if (app.includes(utOld) && !app.includes('function fmtGross')) {
  app = app.replace(utOld, utNew)
}

const summaryOld = 'i&&(i.textContent=first?`¥ `+f0(first.netProfit):`-`),a&&(second?a.textContent=`¥ `+f0(first.netProfit-second.netProfit):a.textContent=`-`)'
const summaryNew = 'i&&(i.textContent=first?fmtMoney(first.netProfit):`-`),a&&(second?a.textContent=fmtMoney(first.netProfit-second.netProfit):a.textContent=`-`)'
if (app.includes(summaryOld)) {
  app = app.replace(summaryOld, summaryNew)
}

const rowOld = `var rec=e.totalRecovery==null?NaN:Number(e.totalRecovery),recCell=!isFinite(rec)||rec===0?\`—\`:\`¥\`+rec.toLocaleString(\`zh-CN\`);var vptCell=!e.qtySum||e.qtySum<=0||!Number.isFinite(e.netProfit)?\`—\`:\`¥ \`+f0(e.netProfit/e.qtySum);var xrb=e.xunRongBao&&!e.xunRongBaoExcludedPricing?\`<span class="ps-cmp-xrb" title="\`+M(xrbTitle(e))+\`">循</span>\`:\`\`;var tr=document.createElement(\`tr\`);tr.innerHTML=\`
            <td><span class="ps-cmp-rank-wrap"><span class="ps-cmp-rank-num">\${e.rank}</span>\${xrb}</span></td>
            <td>\${M(e.smelter)}</td>
            <td>\${M(optYen(e.freightUnitPrice))}</td>
            <td>\${html}</td>
            <td>\${recCell}</td>
            <td>¥\${Number(e.totalFreight||0).toLocaleString(void 0,{minimumFractionDigits:2,maximumFractionDigits:2})}</td>
            <td>¥ \${f0(e.netProfit)}</td>
            <td>\${vptCell}</td>
        \`,n.appendChild(tr)});var pc=document.getElementById(\`purchase-suggestion-box\`);pc&&(pc.style.display=e.length?\`block\`:\`none\`)}`

const rowNew = `var rec=e.totalRecovery==null?NaN:Number(e.totalRecovery),recCell=!isFinite(rec)||rec===0?\`—\`:fmtMoney(rec);var vptCell=fmtVpt(e);var gpCell=fmtGross(e.grossProfit);var gptCell=fmtGross(e.grossProfitPerTon);var xrb=e.xunRongBao&&!e.xunRongBaoExcludedPricing?\`<span class="ps-cmp-xrb" title="\`+M(xrbTitle(e))+\`">循</span>\`:\`\`;var tr=document.createElement(\`tr\`);tr.innerHTML=\`
            <td><span class="ps-cmp-rank-wrap"><span class="ps-cmp-rank-num">\${e.rank}</span>\${xrb}</span></td>
            <td>\${M(e.smelter)}</td>
            <td>\${M(optYen(e.freightUnitPrice))}</td>
            <td>\${html}</td>
            <td>\${recCell}</td>
            <td>¥\${Number(e.totalFreight||0).toLocaleString(void 0,{minimumFractionDigits:2,maximumFractionDigits:2})}</td>
            <td>\${fmtMoney(e.netProfit)}</td>
            <td>\${vptCell}</td>
            <td>\${gpCell}</td>
            <td>\${gptCell}</td>
        \`,n.appendChild(tr)});var pc=document.getElementById(\`purchase-suggestion-box\`);pc&&(pc.style.display=e.length?\`block\`:\`none\`)}`

if (app.includes(rowOld)) {
  app = app.replace(rowOld, rowNew)
} else if (!app.includes('grossProfitPerTon')) {
  console.warn('app: Ut row render anchor not found')
}

fs.writeFileSync(appPath, app, 'utf8')
console.log('patched app-BZHDhlyu.js')
console.log('done')
