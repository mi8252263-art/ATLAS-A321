import { useEffect, useMemo, useState } from 'react'
import azkoLogo from '../imports/logo-azko_ratio-16x9__1_.jpg'
import { formatRupiahFull, type User } from '../data/mockData'
import { parseIncentiveSheets } from '../services/incentiveParser'
import { useMobile } from '../hooks/useMobile'

interface Props { user: User; onBack: () => void }

const S = { bg: '#f0f4ff', card: '#fff', border: '#e8edf8', muted: '#94a3b8', text: '#1e293b', sub: '#64748b' }

type SubPage = 'bersyarat' | 'tanpa_syarat' | 'sku'

type SummaryType = SubPage

interface IncentiveSummaryItem {
  name: string
  type: SummaryType
  achieved: number
  forecast: number
}

const SHEET_NAMES = {
  conditional: 'INSENTIF BERSYARAT',
  unconditional: 'INSENTIF TANPA SYARAT',
  sku: 'SKU INSENTIF',
}

function useIncentiveData() {
  const [data, setData] = useState<ReturnType<typeof parseIncentiveSheets> | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    const fetchData = async () => {
      try {
        const sheetIds = Object.values(SHEET_NAMES)
        const sheets = await Promise.all(sheetIds.map(async sheet => {
          const res = await fetch(`https://docs.google.com/spreadsheets/d/1mNGKDPFNnF1Ca0CtNzyriwTE8zjuwdJei0RafXxna38/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheet)}&_t=${Date.now()}`)
          const text = await res.text()
          if (!res.ok || text.trimStart().startsWith('<!')) return []
          return text.split('\n').filter(Boolean).map(line => {
            const cells: string[] = []
            let inQuote = false
            let cell = ''
            for (let i = 0; i < line.length; i++) {
              const c = line[i]
              if (c === '"') {
                if (inQuote && line[i + 1] === '"') { cell += '"'; i++ }
                else { inQuote = !inQuote }
              } else if (c === ',' && !inQuote) {
                cells.push(cell)
                cell = ''
              } else {
                cell += c
              }
            }
            cells.push(cell)
            return cells
          })
        }))

        const parsed = parseIncentiveSheets({
          [SHEET_NAMES.conditional]: sheets[0] ?? [],
          [SHEET_NAMES.unconditional]: sheets[1] ?? [],
          [SHEET_NAMES.sku]: sheets[2] ?? [],
        })
        if (!cancelled) setData(parsed)
      } catch (error) {
        console.warn('[INSENTIF] Error loading spreadsheet data:', error)
        if (!cancelled) setData(parseIncentiveSheets({}))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void fetchData()
    return () => { cancelled = true }
  }, [])

  return { data, loading }
}

function normalizeNik(value: string) {
  return (value ?? '').trim().replace(/\D/g, '').replace(/^0+/, '')
}

function normalizeName(value: string) {
  return (value ?? '').trim().toLowerCase().replace(/\s+/g, ' ')
}

function isNumericString(value: string) {
  return /^\s*[-+]?\d[\d.,\s]*$/.test(value)
}

function formatDisplayNik(value: string) {
  const raw = (value ?? '').trim()
  const match = raw.match(/\d+/)
  return match ? match[0] : raw
}

function isStatusFulfilled(status: string) {
  const normalized = (status || '').toLowerCase()
  return normalized.includes('terpenuhi') && !normalized.includes('belum')
}

function filterUserRows<T extends { nik?: string; nama?: string }>(rows: T[] | undefined, userNik: string, userName: string): T[] {
  const normalizedUserNik = normalizeNik(userNik)
  const normalizedUserName = normalizeName(userName)
  if (!normalizedUserNik && !normalizedUserName) return rows ?? []

  return (rows ?? []).filter(row => {
    const rowNik = normalizeNik(row.nik ?? '')
    const rowName = normalizeName(row.nama ?? '')

    const cleanNik = rowNik.split(' ').find(part => isNumericString(part)) ?? rowNik
    const cleanUserNik = normalizedUserNik.split(' ').find(part => isNumericString(part)) ?? normalizedUserNik

    const nikMatches = cleanNik && cleanUserNik && (cleanNik === cleanUserNik || cleanNik.endsWith(cleanUserNik) || cleanUserNik.endsWith(cleanNik))
    const nameMatches = normalizedUserName && (rowName === normalizedUserName || rowName.includes(normalizedUserName) || normalizedUserName.includes(rowName))
    return Boolean(nikMatches || nameMatches)
  })
}

function ConditionalRowCard({ row, userNik }: { row: NonNullable<ReturnType<typeof parseIncentiveSheets>['conditional']['rows']>[number]; userNik: string }) {
  const achievedValue = row.items.reduce((sum, item) => {
    return sum + (isStatusFulfilled(item.status || '') ? item.amount : 0)
  }, 0)
  const potentialValue = row.items.reduce((sum, item) => {
    return sum + (!isStatusFulfilled(item.status || '') && item.amount ? item.amount : 0)
  }, 0)

  const displayNik = formatDisplayNik(userNik || row.nik || '')

  return (
    <div style={{ background: S.card, border: `1.5px solid ${S.border}`, borderRadius: 16, padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ color: '#0f172a', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Insentif Bersyarat</div>
          <div style={{ color: S.text, fontWeight: 800, fontSize: 15 }}>{row.nama || row.nik}</div>
          <div style={{ color: S.muted, fontSize: 12 }}>NIK {displayNik || 'belum tersedia'}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ color: '#D93119', fontWeight: 800, fontSize: 14 }}>{formatRupiahFull(achievedValue)}</div>
          <div style={{ color: S.muted, fontSize: 11 }}>Cair</div>
        </div>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
        {potentialValue > 0 ? (
          <span style={{ background: '#f0fdf9', color: '#059669', border: '1px solid #bbf7d0', borderRadius: 999, padding: '4px 10px', fontSize: 11, fontWeight: 700 }}>Potensial {formatRupiahFull(potentialValue)}</span>
        ) : null}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, marginTop: 10 }}>
        {row.items.map(item => (
          <div key={`${item.label}-${item.amount}-${item.status}`} style={{ background: '#f8fafc', borderRadius: 18, padding: '16px', minHeight: 110, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 10 }}>
            <div>
              <div style={{ color: S.muted, fontSize: 11, marginBottom: 8, fontWeight: 700 }}>{item.label || 'Insentif'}</div>
              <div style={{ color: S.text, fontSize: 18, fontWeight: 800 }}>{formatRupiahFull(item.amount)}</div>
            </div>
            <div style={{ color: item.status ? '#334155' : '#64748b', fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>{item.status || 'Belum ada status'}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function UnconditionalRowCard({ row, userNik }: { row: NonNullable<ReturnType<typeof parseIncentiveSheets>['unconditional']['rows']>[number]; userNik: string }) {
  const categoryLabel = row.category && !/^\d+$/.test(row.category) ? row.category : ''
  const displayNik = formatDisplayNik(userNik || row.nik || '')

  return (
    <div style={{ background: S.card, border: `1.5px solid ${S.border}`, borderRadius: 16, padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          {categoryLabel ? (
            <>
              <div style={{ color: S.text, fontWeight: 800, fontSize: 15 }}>{categoryLabel}</div>
              <div style={{ color: S.muted, fontSize: 12, marginTop: 6 }}>{row.nama ? `${row.nama} • ` : ''}NIK {displayNik || 'belum tersedia'}</div>
            </>
          ) : (
            <>
              <div style={{ color: S.text, fontWeight: 800, fontSize: 15 }}>{row.nama || row.nik}</div>
              <div style={{ color: S.muted, fontSize: 12 }}>NIK {displayNik || 'belum tersedia'}</div>
            </>
          )}
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ color: '#7c3aed', fontWeight: 800, fontSize: 14 }}>{formatRupiahFull(row.value)}</div>
          <div style={{ color: S.muted, fontSize: 11 }}>Pasti diperoleh</div>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10 }}>
        {row.items.map(item => (
          <div key={`${item.label}-${item.amount}`} style={{ background: '#f8fafc', borderRadius: 18, padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 10 }}>
            <div>
              <div style={{ color: S.muted, fontSize: 11, marginBottom: 8, fontWeight: 700 }}>{item.label || 'Insentif'}</div>
              <div style={{ color: S.text, fontSize: 18, fontWeight: 800 }}>{formatRupiahFull(item.amount)}</div>
            </div>
            <div style={{ color: '#64748b', fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>Pasti diperoleh</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function SkuRowCard({ row }: { row: NonNullable<ReturnType<typeof parseIncentiveSheets>['sku']['rows']>[number] }) {
  return (
    <div style={{ background: S.card, border: `1.5px solid ${S.border}`, borderRadius: 16, padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, alignItems: 'stretch' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ color: S.text, fontWeight: 800, fontSize: 15, marginBottom: 4 }}>{row.name || row.sku}</div>
            <div style={{ color: S.muted, fontSize: 12 }}>SKU: {row.sku || '—'}</div>
          </div>
          {row.imageUrl ? (
            <img src={row.imageUrl} alt={row.name || row.sku} style={{ width: '100%', maxWidth: 96, height: 96, objectFit: 'cover', borderRadius: 16, border: `1px solid ${S.border}`, background: '#f8fafc' }} />
          ) : null}
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ color: S.sub, fontSize: 13, lineHeight: 1.5 }}>{row.requirement || '—'}</div>
        {row.incentiveValue > 0 ? (
          <div style={{ textAlign: 'right' }}>
            <div style={{ color: '#7c3aed', fontWeight: 800, fontSize: 16 }}>{formatRupiahFull(row.incentiveValue)}</div>
            <div style={{ color: S.muted, fontSize: 11 }}>{row.per ? `Per ${row.per}` : 'Per qty'}</div>
          </div>
        ) : null}
      </div>
    </div>
  )
}

function SummaryCard({ item, onClick }: { item: IncentiveSummaryItem; onClick: () => void }) {
  const color = item.type === 'bersyarat' ? '#dc2626' : item.type === 'sku' ? '#059669' : '#4338ca'
  const light = item.type === 'bersyarat' ? '#fef2f2' : item.type === 'sku' ? '#ecfdf5' : '#eef2ff'
  const border = item.type === 'bersyarat' ? '#fecaca' : item.type === 'sku' ? '#bbf7d0' : '#c7d2fe'
  const isSku = item.type === 'sku'

  const icon = isSku ? '📦' : item.type === 'bersyarat' ? '🔥' : '✨'

  return (
    <button onClick={onClick} style={{ background: light, border: `1px solid ${border}`, borderRadius: 22, padding: '22px 24px', boxShadow: '0 10px 24px rgba(15,23,42,0.05)', transition: 'transform 0.18s, border-color 0.18s', cursor: 'pointer', textAlign: 'left', width: '100%' }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLElement).style.borderColor = color }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLElement).style.borderColor = border }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, color: S.text, fontWeight: 800, fontSize: 15 }}>
            <span style={{ width: 28, height: 28, borderRadius: 999, background: 'rgba(255,255,255,0.4)', display: 'grid', placeItems: 'center', fontSize: 14 }}>{icon}</span>
            <span>{item.name}</span>
          </div>
          <div style={{ color: S.muted, fontSize: 12, marginTop: 4 }}>{isSku ? 'Detail SKU' : 'Ringkasan insentif'}</div>
        </div>
        <span style={{ color: S.muted, fontSize: 20 }}>›</span>
      </div>
      {!isSku ? (
        <div style={{ color: S.text, fontSize: 20, fontWeight: 800 }}>{formatRupiahFull(item.achieved)}</div>
      ) : (
        <div style={{ marginTop: 8, color: S.muted, fontSize: 13 }}>Ringkasan tersedia — buka detail SKU</div>
      )}
      {isSku ? <div style={{ marginTop: 12, color: color, fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Lihat detail SKU</div> : null}
    </button>
  )
}

function SubPageView({ type, data, user, isMobile, onBack: goBack }: { type: SubPage; data: ReturnType<typeof parseIncentiveSheets> | null; user: User; isMobile: boolean; onBack: () => void }) {
  const [skuQuery, setSkuQuery] = useState('')
  const [skuSort, setSkuSort] = useState<'sku' | 'name'>('sku')
  const [skuOrder, setSkuOrder] = useState<'asc' | 'desc'>('asc')

  const isBersyarat = type === 'bersyarat'
  const isSku = type === 'sku'
  const color = isBersyarat ? '#D93119' : isSku ? '#059669' : '#7c3aed'
  const title = isBersyarat ? 'Insentif Bersyarat' : isSku ? 'SKU Insentif' : 'Insentif Tanpa Syarat'
  const subtitle = isBersyarat ? 'Data individu dari sheet INSENTIF BERSYARAT' : isSku ? '' : 'Data individu dari sheet INSENTIF TANPA SYARAT'

  const rows = isBersyarat ? filterUserRows(data?.conditional.rows, user.nik, user.nama) : isSku ? data?.sku.rows : filterUserRows(data?.unconditional.rows, user.nik, user.nama)

  const skuRows = isSku ? (data?.sku.rows ?? []) : []
  const filteredSkuRows = skuRows.filter(row => {
    const query = skuQuery.trim().toLowerCase()
    if (!query) return true
    return row.sku.toLowerCase().includes(query) || row.name.toLowerCase().includes(query)
  })
  const sortedSkuRows = [...filteredSkuRows].sort((a, b) => {
    const left = (a[skuSort] || '').toLowerCase()
    const right = (b[skuSort] || '').toLowerCase()
    if (left === right) return 0
    return skuOrder === 'asc' ? (left < right ? -1 : 1) : (left > right ? -1 : 1)
  })

  return (
    <div style={{ minHeight: '100vh', background: S.bg }}>
      <header style={{ background: S.card, borderBottom: `1px solid ${S.border}`, padding: isMobile ? '10px 14px' : '14px 32px', display: 'flex', alignItems: 'center', gap: 12, position: 'sticky', top: 0, zIndex: 10, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        <img src={azkoLogo} alt="Azko" style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', objectPosition: 'center', boxShadow: '0 2px 8px rgba(217,49,25,0.25)' }}/>
        <span style={{ color: S.text, fontWeight: 800, fontSize: 14, letterSpacing: '0.06em' }}>ATLAS</span>
        <div style={{ width: 1, height: 20, background: S.border }}/>
        <button onClick={goBack} style={{ background: 'none', border: 'none', color: S.muted, fontSize: 13, cursor: 'pointer', fontWeight: 600, padding: 0, transition: 'color 0.15s' }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = S.text }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = S.muted }}
        >← Forecasting Insentif</button>
        <div style={{ width: 1, height: 20, background: S.border }}/>
        <span style={{ color, fontWeight: 700, fontSize: 14 }}>{title}</span>
        <span style={{ color: S.muted, fontSize: 12, marginLeft: 'auto' }}>{user.nama}</span>
      </header>

      <main style={{ maxWidth: '100%', margin: '0 auto', padding: isMobile ? '18px 14px' : '32px 24px' }}>
        <div style={{ marginBottom: 20 }}>
          <h2 style={{ color: S.text, fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 6 }}>{title}</h2>
          <p style={{ color: S.muted, fontSize: 14 }}>{subtitle}</p>
        </div>

        {isSku ? (
          <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', flexWrap: 'wrap', gap: 10, marginBottom: 18, alignItems: isMobile ? 'stretch' : 'center' }}>
            <input
              value={skuQuery}
              onChange={event => setSkuQuery(event.target.value)}
              placeholder="Cari SKU atau nama produk"
              style={{ width: '100%', minWidth: 0, border: `1px solid ${S.border}`, borderRadius: 14, padding: '12px 14px', fontSize: 14, color: S.text, background: S.card }}
            />
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', width: '100%', justifyContent: isMobile ? 'stretch' : 'flex-start' }}>
              <button type="button" onClick={() => setSkuSort('sku')} style={{ flex: isMobile ? '1 1 100%' : undefined, borderRadius: 14, border: `1px solid ${skuSort === 'sku' ? color : S.border}`, background: skuSort === 'sku' ? color : S.card, color: skuSort === 'sku' ? '#fff' : S.text, padding: '10px 14px', cursor: 'pointer' }}>Sort SKU</button>
              <button type="button" onClick={() => setSkuSort('name')} style={{ flex: isMobile ? '1 1 100%' : undefined, borderRadius: 14, border: `1px solid ${skuSort === 'name' ? color : S.border}`, background: skuSort === 'name' ? color : S.card, color: skuSort === 'name' ? '#fff' : S.text, padding: '10px 14px', cursor: 'pointer' }}>Sort Nama</button>
              <button type="button" onClick={() => setSkuOrder(prev => prev === 'asc' ? 'desc' : 'asc')} style={{ flex: isMobile ? '1 1 100%' : undefined, borderRadius: 14, border: `1px solid ${S.border}`, background: S.card, color: S.text, padding: '10px 14px', cursor: 'pointer' }}>{skuOrder === 'asc' ? 'A→Z' : 'Z→A'}</button>
            </div>
          </div>
        ) : null}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {!rows?.length ? (
            <div style={{ padding: '16px 20px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 12, color: '#92400e', fontSize: 13 }}>
              Data belum tersedia. Pastikan sheet memiliki data dan nama sheet sesuai.
            </div>
          ) : (
            (isBersyarat ? rows : isSku ? sortedSkuRows : rows).map((row, index) => {
              if (isBersyarat) return <ConditionalRowCard key={`${(row as any).nik}-${index}`} row={row as any} userNik={user.nik} />
              if (isSku) return <SkuRowCard key={`${(row as any).sku}-${index}`} row={row as any} />
              return <UnconditionalRowCard key={`${(row as any).nik}-${index}`} row={row as any} userNik={user.nik} />
            })
          )}
        </div>
      </main>
    </div>
  )
}

export default function ForecastingInsentif({ user, onBack }: Props) {
  const [subPage, setSubPage] = useState<SubPage | null>(null)
  const { data, loading } = useIncentiveData()
  const isMobile = useMobile(720)

  const summary = useMemo<IncentiveSummaryItem[]>(() => {
    if (!data) return []

    const conditionalRows = filterUserRows(data.conditional.rows, user.nik, user.nama)
    const unconditionalRows = filterUserRows(data.unconditional.rows, user.nik, user.nama)
    const skuRows = data.sku.rows

    const conditionalAchieved = conditionalRows.reduce((sum, row) => sum + row.items.filter(item => isStatusFulfilled(item.status || '')).reduce((subSum, item) => subSum + item.amount, 0), 0)
    const conditionalPotential = conditionalRows.reduce((sum, row) => sum + row.items.filter(item => !isStatusFulfilled(item.status || '')).reduce((subSum, item) => subSum + item.amount, 0), 0)
    const unconditionalAchieved = unconditionalRows.reduce((sum, row) => sum + row.value, 0)
    const skuAchieved = skuRows.reduce((sum, row) => sum + row.incentiveValue, 0)
    const skuForecast = 0

    return [
      {
        name: 'Insentif Bersyarat',
        type: 'bersyarat',
        achieved: conditionalAchieved,
        forecast: conditionalPotential,
      },
      {
        name: 'Insentif Tanpa Syarat',
        type: 'tanpa_syarat',
        achieved: unconditionalAchieved,
        forecast: 0,
      },
      {
        name: 'SKU Insentif',
        type: 'sku',
        achieved: skuAchieved,
        forecast: skuForecast,
      },
    ]
  }, [data, user.nik, user.nama])

  const totalPotential = summary.find(item => item.type === 'bersyarat')?.forecast ?? 0
  const totalAchieved = summary.reduce((sum, item) => sum + item.achieved, 0)
  const totalProjected = totalAchieved + totalPotential

  if (subPage) {
    return <SubPageView type={subPage} data={data} user={user} isMobile={isMobile} onBack={() => setSubPage(null)} />
  }

  return (
    <div style={{ minHeight: '100vh', background: S.bg }}>
      <header style={{ background: S.card, borderBottom: `1px solid ${S.border}`, padding: isMobile ? '16px 18px' : '14px 32px', display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'flex-start' : 'center', gap: 12, position: 'sticky', top: 0, zIndex: 10, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', flexWrap: 'wrap' }}>
          <img src={azkoLogo} alt="Azko" style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', objectPosition: 'center', boxShadow: '0 2px 8px rgba(217,49,25,0.25)' }}/>
          <span style={{ color: S.text, fontWeight: 800, fontSize: 14, letterSpacing: '0.06em' }}>ATLAS</span>
          <div style={{ width: 1, height: 20, background: S.border }} />
          <button onClick={onBack} style={{ background: 'none', border: 'none', color: S.muted, fontSize: 13, cursor: 'pointer', fontWeight: 600, padding: 0, transition: 'color 0.15s' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = S.text }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = S.muted }}
          >← Menu</button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', width: '100%', justifyContent: isMobile ? 'flex-start' : 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ color: S.text, fontWeight: 700, fontSize: 14 }}>Forecasting Insentif</span>
            <span style={{ color: S.muted, fontSize: 12 }}>{user.nama}</span>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: isMobile ? '100%' : 1100, margin: '0 auto', padding: isMobile ? '18px 14px' : '28px 32px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1.65fr 1fr', gap: 20, alignItems: 'stretch' }}>
          <div style={{ position: 'relative', borderRadius: 28, overflow: 'hidden', background: 'linear-gradient(135deg, #4338ca 0%, #7c3aed 100%)', minHeight: 260, padding: isMobile ? '22px 20px' : '28px 30px', boxShadow: '0 20px 50px rgba(67, 56, 202, 0.18)', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 22 }}>
            <div style={{ position: 'absolute', right: -40, top: -30, width: 140, height: 140, borderRadius: '50%', background: 'rgba(255, 255, 255, 0.14)' }} />
            <div style={{ position: 'absolute', right: 20, bottom: -30, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255, 255, 255, 0.08)' }} />
            <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'flex-start', gap: 20 }}>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.18em', marginBottom: 12 }}>Total Insentif Anda</div>
                <div style={{ color: '#ffffff', fontSize: 36, fontWeight: 900, lineHeight: 1.05, maxWidth: 360 }}>{formatRupiahFull(totalProjected)}</div>
              </div>
              <div style={{ display: 'inline-flex', flexShrink: 0, alignItems: 'center', gap: 10, background: 'rgba(255,255,255,0.16)', borderRadius: 999, padding: '10px 14px', color: '#ffffff', fontSize: 12, fontWeight: 700, marginTop: isMobile ? 12 : 0, whiteSpace: 'nowrap' }}>
                <span style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(255,255,255,0.24)', display: 'grid', placeItems: 'center' }}>👤</span>
                NIK {user.nik}
              </div>
            </div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, background: 'rgba(255,255,255,0.12)', borderRadius: 999, padding: '12px 16px', color: 'rgba(255,255,255,0.92)', fontSize: 13, fontWeight: 600 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 26, height: 26, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', fontSize: 14 }}>↗</span>
              Total keseluruhan insentif
            </div>
          </div>
          <div style={{ display: 'grid', gap: 20 }}>
            <div style={{ borderRadius: 24, padding: '24px 22px', background: '#ecfdf5', border: '1px solid #bbf7d0', boxShadow: '0 12px 28px rgba(16, 185, 129, 0.12)', minHeight: 220, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#dcfce7', color: '#16a34a', display: 'grid', placeItems: 'center', fontSize: 18 }}>✓</div>
                  <div style={{ color: '#15803d', fontSize: 13, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Insentif Cair</div>
                </div>
                <div style={{ color: '#0f172a', fontSize: 30, fontWeight: 900, marginBottom: 10 }}>{formatRupiahFull(totalAchieved)}</div>
              </div>
              <div style={{ color: '#475569', fontSize: 13, lineHeight: 1.65 }}>Insentif yang sudah memenuhi syarat dan siap dicairkan.</div>
            </div>
            <div style={{ borderRadius: 24, padding: '24px 22px', background: '#ffedd5', border: '1px solid #fed7aa', boxShadow: '0 12px 28px rgba(251, 146, 60, 0.12)', minHeight: 220, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#fff7ed', color: '#ea580c', display: 'grid', placeItems: 'center', fontSize: 18 }}>⏳</div>
                  <div style={{ color: '#9a3412', fontSize: 13, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Potensial Insentif</div>
                </div>
                <div style={{ color: '#0f172a', fontSize: 30, fontWeight: 900, marginBottom: 10 }}>{formatRupiahFull(totalPotential)}</div>
              </div>
              <div style={{ color: '#6b4226', fontSize: 13, lineHeight: 1.65 }}>Insentif yang masih bersyarat dan belum terpenuhi.</div>
            </div>
          </div>
        </div>

        <div>
          <div style={{ color: S.muted, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>Ringkasan per Tipe Insentif</div>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
            {loading ? (
              <div style={{ gridColumn: '1 / -1', padding: '16px 20px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 12, color: '#92400e', fontSize: 13 }}>
                Memuat data insentif dari sheet...
              </div>
            ) : summary.map(item => (
              <SummaryCard key={item.type} item={item} onClick={() => setSubPage(item.type)} />
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
