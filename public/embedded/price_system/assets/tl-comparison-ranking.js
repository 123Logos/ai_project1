/**
 * 与 src/pages/ElectronicMap.vue 中比价排行逻辑对齐（rankingsFromComparisonResponse 管线）。
 * 嵌入页在 app-BZHDhlyu.js 的 Ht() 中调用；修改地图侧时请同步更新本文件。
 */
;(function (global) {
  'use strict'

  function toDisplayNum(n) {
    var x = Number(n)
    if (!Number.isFinite(x)) return 0
    return Math.round(x * 100) / 100
  }

  function pickStr(row, keys) {
    for (var i = 0; i < keys.length; i++) {
      var k = keys[i]
      var v = row[k]
      if (v != null && String(v).trim() !== '') return String(v).trim()
    }
    return ''
  }

  function pickNumber(row, keys) {
    for (var i = 0; i < keys.length; i++) {
      var k = keys[i]
      var v = row[k]
      if (v == null || v === '') continue
      var n = Number(v)
      if (!Number.isNaN(n)) return n
    }
    return null
  }

  function detailRowXunRongBaoOn(row) {
    var v = row['冶炼厂循融宝发货']
    return v === 1 || v === '1'
  }

  function detailRowXunRongBaoSurcharge(row) {
    return pickNumber(row, ['循融宝加价元每吨'])
  }

  function comparisonDetailValueSource(row) {
    if (!detailRowXunRongBaoOn(row)) return row
    var branch = row['含循融宝']
    if (branch != null && typeof branch === 'object' && !Array.isArray(branch)) return branch
    return row
  }

  function comparisonDetailExcludedValueSource(row) {
    if (!detailRowXunRongBaoOn(row)) return null
    var branch = row['不含循融宝']
    if (branch != null && typeof branch === 'object' && !Array.isArray(branch)) return branch
    return null
  }

  function pickNumberComparisonDetail(row, keys) {
    var src = comparisonDetailValueSource(row)
    var a = pickNumber(src, keys)
    if (a != null && Number.isFinite(a)) return a
    if (src !== row) return pickNumber(row, keys)
    return null
  }

  function pickDetailUnitPrice(row, priceMode) {
    if (priceMode === 'tax3') {
      return pickNumberComparisonDetail(row, [
        '含3%税价',
        '3%含税价',
        '含税价',
        '单价',
        '基准价',
        '报价',
        'unit_price',
        '最优价',
        '3pct_price',
      ])
    }
    return pickNumberComparisonDetail(row, [
      '单价',
      '基准价',
      '报价',
      'unit_price',
      '最优价',
      '不含税价',
      'base_price',
    ])
  }

  function pickDetailUnitPriceExcluded(row, priceMode) {
    var ex = comparisonDetailExcludedValueSource(row)
    if (!ex) return null
    if (priceMode === 'tax3') {
      return pickNumber(ex, [
        '含3%税价',
        '3%含税价',
        '含税价',
        '单价',
        '基准价',
        '报价',
        'unit_price',
        '最优价',
        '3pct_price',
      ])
    }
    return pickNumber(ex, [
      '单价',
      '基准价',
      '报价',
      'unit_price',
      '最优价',
      '不含税价',
      'base_price',
    ])
  }

  function pickProfitFromSmelterRankRow(row, priceMode) {
    var nested = row['最优价口径合计']
    var nestObj =
      nested && typeof nested === 'object' && !Array.isArray(nested) ? nested : null
    if (priceMode === 'tax3') {
      var n =
        pickNumber(row, ['利润_含3%合计', '利润_含3%']) ??
        (nestObj ? pickNumber(nestObj, ['3pct', 'tax3']) : null) ??
        pickNumber(row, ['利润'])
      return n ?? 0
    }
    var n2 =
      pickNumber(row, ['利润_基准合计', '利润_基准']) ??
      (nestObj ? pickNumber(nestObj, ['base']) : null) ??
      pickNumber(row, ['利润'])
    return n2 ?? 0
  }

  function parseSmelterProfitRankArray(arr, priceMode) {
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
      var netProfit = pickProfitFromSmelterRankRow(row, priceMode)
      var totalRecovery =
        pickNumber(row, [
          '总价合计',
          '总回收价',
          '回收额',
          'totalRecovery',
          'materialSum',
          '物料总价',
          'total_recovery',
        ]) ?? 0
      var totalFreight = pickNumber(row, ['总运费合计', '总运费', '估算运费', '运费合计']) ?? 0
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
      out.push({
        rank: rank,
        smelter: smelter,
        unitPrice: toDisplayNum(unitPrice),
        netProfit: toDisplayNum(netProfit),
        totalRecovery: toDisplayNum(totalRecovery),
        totalFreight: toDisplayNum(totalFreight),
        qtySum: toDisplayNum(qtySum),
      })
    }
    out.sort(function (a, b) {
      return a.rank - b.rank
    })
    return out
  }

  function mergeComparisonRanksWithDetailRows(ranks, detailRows, priceMode) {
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
      var totalRecovery = 0
      var totalFreight = 0
      var qtySum = 0
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
        var tot = pickNumberComparisonDetail(row, [
          '总价',
          '报价金额',
          '物料总价',
          'total_recovery',
          'material_sum',
        ])
        var tf = pickNumberComparisonDetail(row, ['总运费', '运费合计'])
        if (tot != null && Number.isFinite(tot)) totalRecovery += tot
        else if (up != null && qty > 0) totalRecovery += up * qty
        if (tf != null && Number.isFinite(tf)) totalFreight += tf
        qtySum += qtyEff
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
      var unitPrice =
        unitDen > 0
          ? unitNum / unitDen
          : pickNumberComparisonDetail(rows[0], ['单价', '基准价', '报价']) ?? 0
      var out = Object.assign({}, r, {
        categoryPrices: categoryPrices,
        unitPrice: toDisplayNum(unitPrice),
        totalRecovery: toDisplayNum(totalRecovery),
        totalFreight: toDisplayNum(totalFreight),
        qtySum: toDisplayNum(qtySum),
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

  function pickComparisonPayload(raw) {
    var data = raw['data']
    if (data != null && typeof data === 'object' && !Array.isArray(data)) return data
    return null
  }

  function walkObjectArraysDeep(input, depth) {
    if (depth === void 0) depth = 0
    if (depth > 4 || input == null) return []
    var out = []
    if (Array.isArray(input)) {
      var rows = input.filter(function (x) {
        return !!x && typeof x === 'object'
      })
      if (rows.length) out.push(rows)
      return out
    }
    if (typeof input !== 'object') return out
    var obj = input
    var vals = Object.values(obj)
    for (var i = 0; i < vals.length; i++) {
      var v = vals[i]
      if (Array.isArray(v)) {
        var rows2 = v.filter(function (x) {
          return !!x && typeof x === 'object'
        })
        if (rows2.length) out.push(rows2)
        continue
      }
      if (v && typeof v === 'object') {
        var sub = walkObjectArraysDeep(v, depth + 1)
        for (var j = 0; j < sub.length; j++) out.push(sub[j])
      }
    }
    return out
  }

  function parseRankRowsLoose(rows, priceMode) {
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
        pickNumberComparisonDetail(row, ['利润', '利润_基准', '利润_含3%', '净收益', 'profit']) != null
      if (!smelter || !hasProfitLike) continue
      fallback += 1
      var rank = pickNumber(row, ['排名', '排行', '排序', 'rank', '名次']) ?? fallback
      var netProfit = netProfitRaw
      var totalRecovery =
        pickNumberComparisonDetail(row, [
          '总价',
          '总回收价',
          '回收额',
          '物料总价',
          'total_recovery',
          'material_sum',
        ]) ?? 0
      var totalFreight =
        pickNumberComparisonDetail(row, [
          '总运费',
          '运费合计',
          '估算运费',
          '运费单价',
          '运费/吨',
          'freight_per_ton',
          'freight',
        ]) ?? 0
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
      })
    }
    out.sort(function (a, b) {
      return a.rank - b.rank
    })
    return out
  }

  function detailRowsForSmelterName(smelter, detailRows) {
    var s = smelter.trim()
    if (!s) return []
    return detailRows.filter(function (row) {
      var name = pickStr(row, [
        '冶炼厂',
        'smelter',
        'smelter_name',
        '冶炼厂名',
        'factory_name',
        'name',
      ])
      if (!name) return false
      return name === s || name.includes(s) || s.includes(name)
    })
  }

  function buildExcludedComparisonRankFromDetails(base, detailRows, priceMode) {
    var rows = detailRowsForSmelterName(base.smelter, detailRows)
    if (!rows.length) return null
    if (!rows.some(detailRowXunRongBaoOn)) return null
    if (!rows.some(comparisonDetailExcludedValueSource)) return null

    var categoryPrices = {}
    var totalRecovery = 0
    var totalFreight = 0
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
      var tot = pickNumber(ex, ['总价', '报价金额', '物料总价', 'total_recovery', 'material_sum'])
      var tf = pickNumber(ex, ['总运费', '运费合计'])
      if (tot != null && Number.isFinite(tot)) totalRecovery += tot
      else if (up != null && qty > 0) totalRecovery += up * qty
      if (tf != null && Number.isFinite(tf)) totalFreight += tf
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

    var firstExRow = rows.find(function (r) {
      return detailRowXunRongBaoOn(r) && comparisonDetailExcludedValueSource(r)
    })
    var netProfit = totalRecovery - totalFreight
    if (firstExRow) {
      var ex0 = comparisonDetailExcludedValueSource(firstExRow)
      if (ex0) {
        var p =
          priceMode === 'tax3'
            ? pickNumber(ex0, ['利润_含3%', '利润'])
            : pickNumber(ex0, ['利润_基准', '利润'])
        if (p != null && Number.isFinite(p)) netProfit = p
      }
    }

    var unitPrice =
      unitDen > 0
        ? unitNum / unitDen
        : (function () {
            var r0 = rows.find(function (r) {
              return detailRowXunRongBaoOn(r) && comparisonDetailExcludedValueSource(r)
            })
            var ex = r0 ? comparisonDetailExcludedValueSource(r0) : null
            return ex ? pickNumber(ex, ['单价', '基准价', '报价']) ?? 0 : 0
          })()

    return {
      rank: base.rank,
      smelter: base.smelter,
      unitPrice: toDisplayNum(unitPrice),
      netProfit: toDisplayNum(netProfit),
      totalRecovery: toDisplayNum(totalRecovery),
      totalFreight: toDisplayNum(totalFreight),
      qtySum: toDisplayNum(qtySum),
      categoryPrices: categoryPrices,
      lineUnitPrice: strictLineDen > 0 ? toDisplayNum(strictLineNum / strictLineDen) : undefined,
      freightUnitPrice: strictFpuDen > 0 ? toDisplayNum(strictFpuNum / strictFpuDen) : undefined,
      xunRongBao: false,
      xunRongBaoExcludedPricing: true,
    }
  }

  function expandComparisonRanksWithXunRongBaoExcludedRows(ranks, detailRows, priceMode) {
    if (!detailRows.length) return ranks
    var out = []
    for (var i = 0; i < ranks.length; i++) {
      var r = ranks[i]
      if (r.xunRongBaoExcludedPricing) {
        out.push(r)
        continue
      }
      var exRow = buildExcludedComparisonRankFromDetails(r, detailRows, priceMode)
      if (exRow) {
        out.push(r.xunRongBao ? r : Object.assign({}, r, { xunRongBao: true }))
        out.push(exRow)
        continue
      }
      out.push(r)
    }
    return out
  }

  function rerankComparisonByProfitDesc(items) {
    var sorted = items.slice().sort(function (a, b) {
      if (b.netProfit !== a.netProfit) return b.netProfit - a.netProfit
      var aw = a.xunRongBao ? 1 : 0
      var bw = b.xunRongBao ? 1 : 0
      if (bw !== aw) return bw - aw
      return a.rank - b.rank
    })
    return sorted.map(function (x, i) {
      return Object.assign({}, x, { rank: i + 1 })
    })
  }

  function aggregateComparisonRows(rows, priceMode) {
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
      var lineTotalFreight = pickNumberComparisonDetail(row, ['总运费', '运费合计'])
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
      g.materialSum += unitPrice * qtyEff
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
        var avgFreightPerTon = g.freightCount > 0 ? g.freightSum / g.freightCount : 0
        var totalFreightFromLine =
          g.totalFreightSum > 0 ? g.totalFreightSum : avgFreightPerTon * g.qtySum
        var netProfit = g.materialSum - totalFreightFromLine
        var sample = rows.find(function (r) {
          return (
            (pickStr(r, ['smelter_name', '冶炼厂', '冶炼厂名', 'smelter', 'factory_name']) ||
              '未知冶炼厂') === g.smelter
          )
        })
        if (sample) {
          var backendProfit =
            priceMode === 'tax3'
              ? pickNumberComparisonDetail(sample, ['利润_含3%', '利润'])
              : pickNumberComparisonDetail(sample, ['利润_基准', '利润'])
          if (backendProfit != null && Number.isFinite(backendProfit)) netProfit = backendProfit
        }
        var unitPrice2 = g.qtySum > 0 ? g.materialSum / g.qtySum : 0
        var o = {
          smelter: g.smelter,
          unitPrice: toDisplayNum(unitPrice2),
          netProfit: toDisplayNum(netProfit),
          totalRecovery: toDisplayNum(g.materialSum),
          totalFreight: toDisplayNum(totalFreightFromLine),
          qtySum: toDisplayNum(g.qtySum),
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

  function rankingsFromComparisonResponse(raw, detailRows, priceMode) {
    var payload = pickComparisonPayload(raw)
    var fromApi = parseSmelterProfitRankArray(
      raw['冶炼厂利润排行'] ?? payload?.['冶炼厂利润排行'] ?? payload?.['smelter_profit_rank'],
      priceMode,
    )
    if (fromApi.length) {
      var mergedTop = mergeComparisonRanksWithDetailRows(fromApi, detailRows, priceMode)
      if (!detailRows.length) return rerankComparisonByProfitDesc(mergedTop)
      var allFromDetail = aggregateComparisonRows(detailRows, priceMode)
      var existed = new Set(mergedTop.map(function (x) {
        return x.smelter.trim()
      }))
      var extras = allFromDetail.filter(function (x) {
        return !existed.has(x.smelter.trim())
      })
      var combined = mergedTop.concat(extras)
      return rerankComparisonByProfitDesc(
        expandComparisonRanksWithXunRongBaoExcludedRows(combined, detailRows, priceMode),
      )
    }
    var looseArrays = walkObjectArraysDeep(payload ?? raw)
    for (var i = 0; i < looseArrays.length; i++) {
      var parsed = parseRankRowsLoose(looseArrays[i], priceMode)
      if (parsed.length) {
        var merged = mergeComparisonRanksWithDetailRows(parsed, detailRows, priceMode)
        return rerankComparisonByProfitDesc(
          expandComparisonRanksWithXunRongBaoExcludedRows(merged, detailRows, priceMode),
        )
      }
    }
    return rerankComparisonByProfitDesc(
      expandComparisonRanksWithXunRongBaoExcludedRows(
        aggregateComparisonRows(detailRows, priceMode),
        detailRows,
        priceMode,
      ),
    )
  }

  global.TlComparisonRanking = {
    rankingsFromComparisonResponse: rankingsFromComparisonResponse,
    toDisplayNum: toDisplayNum,
  }
})(typeof window !== 'undefined' ? window : globalThis)
