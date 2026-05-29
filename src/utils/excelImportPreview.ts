import * as XLSX from 'xlsx'

export function cellToString(v: unknown): string {
  if (v == null || v === '') return ''
  return String(v).trim()
}

function rowHasAnyCell(row: Record<string, unknown>): boolean {
  return Object.values(row).some((v) => cellToString(v) !== '')
}

export function sheetRowsToKeyedRows(sheetRows: Record<string, unknown>[]): {
  columns: string[]
  rows: Record<string, string>[]
} {
  if (!sheetRows.length) return { columns: [], rows: [] }
  const headerOrder = Object.keys(sheetRows[0]!)
  const rows = sheetRows.filter(rowHasAnyCell).map((row) => {
    const out: Record<string, string> = {}
    for (const h of headerOrder) {
      out[h] = cellToString(row[h])
    }
    return out
  })
  return { columns: headerOrder, rows }
}

export function parseSheetRowsFromArrayBuffer(file: File, ab: ArrayBuffer): Record<string, unknown>[] {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
  const wb =
    ext === 'csv'
      ? XLSX.read(new Uint8Array(ab), { type: 'array' })
      : XLSX.read(ab, { type: 'array' })
  const sheetName = wb.SheetNames[0]
  if (!sheetName) return []
  const ws = wb.Sheets[sheetName]
  return XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { raw: false, defval: '' })
}

export async function parseExcelFileForPreview(file: File): Promise<{
  columns: string[]
  rows: Record<string, string>[]
  total: number
}> {
  const ab = await file.arrayBuffer()
  const sheetRows = parseSheetRowsFromArrayBuffer(file, ab)
  const { columns, rows } = sheetRowsToKeyedRows(sheetRows)
  return { columns, rows, total: rows.length }
}

export function downloadXlsxTemplate(
  filename: string,
  sheetName: string,
  headers: string[],
  sampleRows: (string | number)[][],
): void {
  const ws = XLSX.utils.aoa_to_sheet([headers, ...sampleRows])
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, sheetName)
  XLSX.writeFile(wb, filename)
}
