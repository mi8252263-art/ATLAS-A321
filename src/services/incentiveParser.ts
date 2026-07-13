export interface IncentiveConditionalItem {
  label: string
  amount: number
  status: string
}

export interface IncentiveConditionalRow {
  nik: string
  nama: string
  tokoValue: number
  challengeValue: number
  status: string
  items: Array<{ label: string; amount: number; status: string }>
  fields: Array<{ label: string; value: string }>
}

export interface IncentiveUnconditionalRow {
  nik: string
  nama: string
  category: string
  value: number
  items: Array<{ label: string; amount: number }>
  fields: Array<{ label: string; value: string }>
}

export interface IncentiveSkuRow {
  sku: string
  name: string
  requirement: string
  incentiveValue: number
  per: string
  imageUrl: string
}

export interface ParsedIncentiveData {
  conditional: { rows: IncentiveConditionalRow[]; totalTarget: number; totalAchieved: number }
  unconditional: { rows: IncentiveUnconditionalRow[]; totalTarget: number; totalAchieved: number }
  sku: { rows: IncentiveSkuRow[]; totalTarget: number; totalAchieved: number }
}

function normalizeText(value: string): string {
  return value.trim().replace(/\s+/g, ' ')
}

function toNumber(value: string): number {
  if (!value) return 0
  const cleaned = value.replace(/Rp\.?\s*/gi, '').replace(/\./g, '').replace(',', '.')
  return Number.parseFloat(cleaned) || 0
}

function evaluateRowReference(reference: string, row: string[], dataRowIndex: number): string {
  const normalized = reference.trim().toUpperCase()
  const match = normalized.match(/^([A-Z]+)(\d+)$/)
  if (!match) return ''

  const colLetters = match[1]
  const targetRowNumber = Number(match[2])
  const currentSheetRowNumber = dataRowIndex + 2

  if (targetRowNumber !== currentSheetRowNumber) return ''

  let colIndex = 0
  for (let i = 0; i < colLetters.length; i++) {
    colIndex = colIndex * 26 + (colLetters.charCodeAt(i) - 64)
  }
  colIndex -= 1
  return row[colIndex] ?? ''
}

function evaluateConcatExpression(expression: string, row: string[], dataRowIndex: number): string {
  return expression.split(/\s*&\s*/g).map(part => {
    const trimmed = part.trim()
    if (!trimmed) return ''

    const quoted = trimmed.match(/^"([\s\S]*)"$/)
    if (quoted) return quoted[1]

    const refValue = evaluateRowReference(trimmed, row, dataRowIndex)
    if (refValue) return refValue

    return trimmed
  }).join('')
}

function extractImageUrl(value: string, row: string[], dataRowIndex: number): string {
  const raw = normalizeText(value)
  if (!raw) return ''

  const imageFormula = raw.match(/=\s*IMAGE\s*\((([\s\S]*))\)/i)
  if (imageFormula?.[1]) {
    const content = imageFormula[1].trim()
    const url = evaluateConcatExpression(content, row, dataRowIndex)
    if (/^https?:\/\//i.test(url)) return url
  }

  const hyperlinkFormula = raw.match(/=\s*HYPERLINK\s*\((([\s\S]*))\)/i)
  if (hyperlinkFormula?.[1]) {
    const content = hyperlinkFormula[1].trim()
    const url = evaluateConcatExpression(content, row, dataRowIndex)
    if (/^https?:\/\//i.test(url)) return url
  }

  if (raw.startsWith('=')) {
    const content = raw.slice(1).trim()
    const url = evaluateConcatExpression(content, row, dataRowIndex)
    if (/^https?:\/\//i.test(url)) return url
  }

  const urlMatch = raw.match(/(https?:\/\/[^\s"]+)/i)
  return urlMatch?.[1] ?? ''
}

function findHeaderIndex(headers: string[], matcher: RegExp): number {
  return headers.findIndex(header => matcher.test(header))
}

function findHeaderIndices(headers: string[], matcher: RegExp): number[] {
  return headers.reduce<number[]>((acc, header, index) => matcher.test(header) ? acc.concat(index) : acc, [])
}

function isNumericHeader(header: string): boolean {
  return /\b(angka|total|nilai|value|bonus|insentif|amount|nominal|price|harga|target|toko|challeng)/i.test(header)
}

function parseConditionalRow(row: string[], headers: string[]): IncentiveConditionalRow {
  const normalizedHeaders = headers.map(normalizeText)
  const nikIndex = findHeaderIndex(normalizedHeaders, /\bnik\b/i)
  const namaIndex = findHeaderIndex(normalizedHeaders, /\b(nama|name)\b/i)

  const items: Array<{ label: string; amount: number; status: string }> = []
  let i = 0
  while (i < normalizedHeaders.length) {
    if (i === nikIndex || i === namaIndex) {
      i += 1
      continue
    }

    const header = normalizedHeaders[i]
    if (/\bstatus\b/i.test(header) && items.length > 0) {
      items[items.length - 1].status = normalizeText(row[i] ?? '')
      i += 1
      continue
    }

    const amount = toNumber(row[i] ?? '')
    const statusIndex = i + 1
    const statusHeader = normalizedHeaders[statusIndex] ?? ''
    const statusValue = statusIndex < row.length && /\bstatus\b/i.test(statusHeader) ? normalizeText(row[statusIndex] ?? '') : ''

    if (amount > 0 || statusValue) {
      items.push({ label: headers[i] ?? '', amount, status: statusValue })
      i += statusValue ? 2 : 1
    } else {
      i += 1
    }
  }

  const tokoItem = items.find(item => /\btoko\b/i.test(item.label)) ?? items[0]
  const challengeItem = items.find(item => /\b(challenge|challeng)\b/i.test(item.label)) ?? items[1] ?? tokoItem
  const tokoValue = tokoItem?.amount ?? 0
  const challengeValue = challengeItem?.amount ?? 0
  const status = normalizeText(challengeItem?.status || tokoItem?.status || '')

  const nik = normalizeText(row[nikIndex] ?? '')
  const nama = normalizeText(row[namaIndex] ?? '')
  const fields = headers.map((header, index) => ({ label: header, value: normalizeText(row[index] ?? '') }))
  return { nik, nama, tokoValue, challengeValue, status, items, fields }
}

function parseUnconditionalRow(row: string[], headers: string[]): IncentiveUnconditionalRow {
  const normalizedHeaders = headers.map(normalizeText)
  const nikIndex = findHeaderIndex(normalizedHeaders, /\bnik\b/i)
  const namaIndex = findHeaderIndex(normalizedHeaders, /\b(nama|name)\b/i)
  const categoryIndex = findHeaderIndex(normalizedHeaders, /\b(kategori|category|item|jenis|nama insentif|insentif kategori)\b/i)

  const items: Array<{ label: string; amount: number }> = []
  normalizedHeaders.forEach((header, index) => {
    if (index === nikIndex || index === namaIndex || index === categoryIndex) return
    const amount = toNumber(row[index] ?? '')
    if (amount > 0) {
      const label = normalizeText(headers[index] ?? '') || normalizeText(row[index] ?? '')
      items.push({ label, amount })
    }
  })

  const value = items.reduce((sum, item) => sum + item.amount, 0)
  const category = normalizeText(row[categoryIndex] ?? '')
  const nik = normalizeText(row[nikIndex] ?? '')
  const nama = normalizeText(row[namaIndex] ?? '')
  const fields = headers.map((header, index) => ({ label: header, value: normalizeText(row[index] ?? '') }))
  return { nik, nama, category, value, items, fields }
}

export function parseIncentiveSheets(sheets: Record<string, string[][]>): ParsedIncentiveData {
  const conditionalRows: IncentiveConditionalRow[] = []
  const unconditionalRows: IncentiveUnconditionalRow[] = []
  const skuRows: IncentiveSkuRow[] = []

  const conditionalSheet = sheets['INSENTIF BERSYARAT'] ?? []
  const unconditionalSheet = sheets['INSENTIF TANPA SYARAT'] ?? []
  const skuSheet = sheets['SKU INSENTIF'] ?? []

  const conditionalHeaders = conditionalSheet[0]?.map(normalizeText) ?? []
  const unconditionalHeaders = unconditionalSheet[0]?.map(normalizeText) ?? []
  const skuHeaders = skuSheet[0]?.map(normalizeText) ?? []

  for (const row of conditionalSheet.slice(1)) {
    if (!row.some(cell => normalizeText(cell))) continue
    const parsedRow = parseConditionalRow(row, conditionalHeaders)
    if (!parsedRow.nik && !parsedRow.nama) continue
    conditionalRows.push(parsedRow)
  }

  for (const row of unconditionalSheet.slice(1)) {
    if (!row.some(cell => normalizeText(cell))) continue
    const parsedRow = parseUnconditionalRow(row, unconditionalHeaders)
    if (!parsedRow.nik && !parsedRow.nama) continue
    unconditionalRows.push(parsedRow)
  }

  const skuPerIndex = findHeaderIndex(skuHeaders, /\bper\b/i)
  for (const [rowIndex, row] of skuSheet.slice(1).entries()) {
    if (!row.some(cell => normalizeText(cell))) continue
    const sku = normalizeText(row[0] ?? '')
    const name = normalizeText(row[1] ?? '')
    const requirement = normalizeText(row[2] ?? '')
    const incentiveValue = toNumber(row[3] ?? '')
    const per = skuPerIndex >= 0 ? normalizeText(row[skuPerIndex] ?? '') : ''
    const imageUrl = extractImageUrl(row[5] ?? '', row, rowIndex)
    if (!sku && !name) continue
    skuRows.push({ sku, name, requirement, incentiveValue, per, imageUrl })
  }

  return {
    conditional: {
      rows: conditionalRows,
      totalTarget: conditionalRows.reduce((acc, row) => acc + row.items.reduce((sum, item) => sum + item.amount, 0), 0),
      totalAchieved: conditionalRows.reduce((acc, row) => acc + row.items.filter(item => item.status.toLowerCase().includes('terpenuhi')).reduce((sum, item) => sum + item.amount, 0), 0),
    },
    unconditional: {
      rows: unconditionalRows,
      totalTarget: unconditionalRows.reduce((acc, row) => acc + row.items.reduce((sum, item) => sum + item.amount, 0), 0),
      totalAchieved: unconditionalRows.reduce((acc, row) => acc + row.items.reduce((sum, item) => sum + item.amount, 0), 0),
    },
    sku: {
      rows: skuRows,
      totalTarget: skuRows.reduce((acc, row) => acc + row.incentiveValue, 0),
      totalAchieved: skuRows.reduce((acc, row) => acc + row.incentiveValue, 0),
    },
  }
}
