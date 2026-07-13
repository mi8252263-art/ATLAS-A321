const SHEET_ID = '1mNGKDPFNnF1Ca0CtNzyriwTE8zjuwdJei0RafXxna38'

function ci(col: string): number {
  col = col.toUpperCase()
  if (col.length === 1) return col.charCodeAt(0) - 65
  return (col.charCodeAt(0) - 64) * 26 + (col.charCodeAt(1) - 65)
}

function parseCSV(text: string): string[][] {
  const rows: string[][] = []
  for (const line of text.split('\n')) {
    if (!line.trim()) continue
    const cells: string[] = []
    let inQ = false, cell = ''
    for (let i = 0; i < line.length; i++) {
      const c = line[i]
      if (c === '"') { if (inQ && line[i+1] === '"') { cell += '"'; i++ } else inQ = !inQ }
      else if (c === ',' && !inQ) { cells.push(cell); cell = '' }
      else cell += c
    }
    cells.push(cell)
    rows.push(cells)
  }
  return rows
}

function n(s: string): number {
  if (!s) return 0
  return parseFloat(s.replace(/Rp\.?\s*/gi, '').replace(/\./g, '').replace(',', '.').trim()) || 0
}

function g(row: string[], idx: number): string {
  return (row[idx] ?? '').trim()
}

export interface TokoRow {
  date:             string
  // Daily
  salesDaily:       number
  targetDaily:      number
  traffic:          number
  targetTraffic:    number
  transaksi:        number
  targetTransaksi:  number
  newMember:        number
  targetNewMember:  number
  instantUpgrade:   number
  proteksi:         number
  targetProteksi:   number
  salesOnline:      number
  targetOnline:     number
  salesOffline:     number
  basketSize:       number
  targetBasketSize: number
  // MTD
  salesMTD:            number
  targetMTD:           number
  trafficMTD:          number
  targetTrafficMTD:    number
  transaksiMTD:        number
  targetTransaksiMTD:  number
  proteksiMTD:         number
  targetProteksiMTD:   number
  newMemberMTD:        number
  targetNewMemberMTD:  number
  basketSizeMTD:       number
  targetBasketSizeMTD: number
  salesOnlineMTD:      number
  targetOnlineMTD:     number
}

export async function fetchPencapaianToko(): Promise<TokoRow[]> {
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent('Pencapaian Toko')}&_t=${Date.now()}`
  const res  = await fetch(url, { cache: 'no-store' })
  const text = await res.text()
  if (!res.ok || text.trimStart().startsWith('<!')) throw new Error('Sheet "Pencapaian Toko" tidak bisa dibaca')
  const raw = parseCSV(text)
  // Debug: log semua baris dengan kolom B & U untuk cek date vs trafficMTD
  const dataRows = raw.slice(3).filter(r => g(r, ci('B')))
  dataRows.forEach((r, i) => {
    const b = g(r, ci('B')), u = g(r, ci('U')), t = g(r, ci('T'))
    if (u || i < 15) console.warn(`[TOKO ROW ${i+1}] date=${b} | T(tgtTrafficMTD)=${t} | U(trafficMTD)=${u}`)
  })
  // Data mulai baris ke-4 (index 3)
  return dataRows.map(r => ({
    date:             g(r, ci('B')),
    salesDaily:       n(g(r, ci('J'))),
    targetDaily:      n(g(r, ci('I'))),
    traffic:          n(g(r, ci('D'))),
    targetTraffic:    n(g(r, ci('R'))),
    transaksi:        n(g(r, ci('E'))),
    targetTransaksi:  n(g(r, ci('W'))),
    newMember:        n(g(r, ci('F'))),
    targetNewMember:  n(g(r, ci('AM'))),
    instantUpgrade:   n(g(r, ci('G'))),
    proteksi:         n(g(r, ci('H'))),
    targetProteksi:   n(g(r, ci('AH'))),
    salesOnline:      n(g(r, ci('Q'))),
    targetOnline:     n(g(r, ci('P'))),
    salesOffline:     n(g(r, ci('O'))),
    basketSize:       n(g(r, ci('AC'))),
    targetBasketSize: n(g(r, ci('AB'))),
    salesMTD:            n(g(r, ci('M'))),
    targetMTD:           n(g(r, ci('L'))),
    trafficMTD:          n(g(r, ci('U'))),
    targetTrafficMTD:    n(g(r, ci('T'))),
    transaksiMTD:        n(g(r, ci('Z'))),
    targetTransaksiMTD:  n(g(r, ci('Y'))),
    proteksiMTD:         n(g(r, ci('AK'))),
    targetProteksiMTD:   n(g(r, ci('AJ'))),
    newMemberMTD:        n(g(r, ci('AP'))),
    targetNewMemberMTD:  n(g(r, ci('AO'))),
    basketSizeMTD:       n(g(r, ci('AF'))),
    targetBasketSizeMTD: n(g(r, ci('AE'))),
    salesOnlineMTD:      n(g(r, ci('AX'))),
    targetOnlineMTD:     n(g(r, ci('AW'))),
  }))
}

// Parse day number from sheet date string (DD-MM-YYYY, DD/MM/YYYY, YYYY-MM-DD)
function parseDayFromDateStr(dateStr: string): number {
  if (!dateStr) return 0
  const parts = dateStr.split(/[-\/]/)
  if (parts.length === 3) {
    if (parts[0].length === 4) return parseInt(parts[2], 10) // YYYY-MM-DD → day
    return parseInt(parts[0], 10)                            // DD-MM-YYYY → day
  }
  return 0
}

// Untuk TODAY: baris tanggal hari ini
export function todayTokoRow(rows: TokoRow[]): TokoRow | null {
  if (rows.length === 0) return null
  const todayDay = new Date().getDate()
  for (let i = rows.length - 1; i >= 0; i--) {
    if (parseDayFromDateStr(rows[i].date) === todayDay) return rows[i]
  }
  // fallback: baris terdekat ≤ hari ini yang ada data
  for (let i = rows.length - 1; i >= 0; i--) {
    const d = parseDayFromDateStr(rows[i].date)
    if (d <= todayDay && (rows[i].salesMTD > 0 || rows[i].salesDaily > 0)) return rows[i]
  }
  return rows[rows.length - 1]
}

// Untuk MTD: H-1 (kemarin), karena data toko MTD baru final setelah hari tutup
export function latestTokoRow(rows: TokoRow[]): TokoRow | null {
  if (rows.length === 0) return null
  const yesterdayDay = new Date().getDate() - 1
  if (yesterdayDay <= 0) return todayTokoRow(rows) // awal bulan, pakai hari ini

  // Cari baris H-1
  for (let i = rows.length - 1; i >= 0; i--) {
    if (parseDayFromDateStr(rows[i].date) === yesterdayDay) return rows[i]
  }
  // fallback: baris terdekat ≤ H-1 yang ada data
  for (let i = rows.length - 1; i >= 0; i--) {
    const d = parseDayFromDateStr(rows[i].date)
    if (d <= yesterdayDay && (rows[i].salesMTD > 0 || rows[i].salesDaily > 0)) return rows[i]
  }
  return rows[rows.length - 1]
}
