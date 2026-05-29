export type WarehouseMatchOption = { id: number; name: string }

/** 子序列匹配：query 各字符按顺序出现在 text 中即可 */
function subsequenceMatch(text: string, pattern: string): boolean {
  if (!pattern) return true
  let i = 0
  for (const c of pattern) {
    i = text.indexOf(c, i)
    if (i === -1) return false
    i += 1
  }
  return true
}

/** 库房名称 / id 模糊搜索：子串、分词、子序列 */
export function warehouseMatchesQuery(w: WarehouseMatchOption, raw: string): boolean {
  const q = raw.trim()
  if (!q) return true

  const idStr = String(w.id)
  const name = String(w.name)
  const qLower = q.toLowerCase()

  if (name.includes(q) || idStr.includes(q)) return true
  if (name.toLowerCase().includes(qLower) || idStr.toLowerCase().includes(qLower)) return true

  const tokens = q.split(/\s+/).filter(Boolean)
  if (tokens.length > 1) {
    return tokens.every((t) => warehouseMatchesQuery(w, t))
  }

  const compactName = name.replace(/\s/g, '').toLowerCase()
  const compactQ = qLower.replace(/\s/g, '')
  if (compactQ.length >= 1 && subsequenceMatch(compactName, compactQ)) return true
  if (compactQ.length >= 1 && subsequenceMatch(idStr.toLowerCase(), compactQ)) return true

  return false
}

export function allOptionMatchesQuery(label: string, raw: string): boolean {
  const q = raw.trim()
  if (!q) return true
  return label.includes(q) || label.toLowerCase().includes(q.toLowerCase())
}
