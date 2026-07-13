import { useState } from 'react'
import azkoLogo from '../imports/logo-azko_ratio-16x9__1_.jpg'
import { INSENTIF_SUMMARY, formatRupiahFull, type User } from '../data/mockData'

interface Props { user: User; onBack: () => void }

const S = { bg: '#f0f4ff', card: '#fff', border: '#e8edf8', muted: '#94a3b8', text: '#1e293b', sub: '#64748b' }

type SubPage = 'bersyarat' | 'tanpa-syarat'

// ─── Placeholder tier data ───────────────────────────────────────────────────

const TIERS_BERSYARAT = [
  { id: 'toko-95',  label: 'Insentif Toko 95%',  desc: 'Pencapaian toko 90% – 94.99%', icon: '🏪', color: '#f59e0b', light: '#fffbeb' },
  { id: 'toko-100', label: 'Insentif Toko 100%', desc: 'Pencapaian toko 95% – 99.99%', icon: '🏬', color: '#3b82f6', light: '#eff6ff' },
  { id: 'toko-105', label: 'Insentif Toko 105%', desc: 'Pencapaian toko 100% – 104.99%', icon: '🌟', color: '#7c3aed', light: '#f5f3ff' },
  { id: 'toko-110', label: 'Insentif Toko 110%', desc: 'Pencapaian toko ≥ 105%', icon: '🚀', color: '#059669', light: '#f0fdf9' },
]

const TIERS_TANPA_SYARAT = [
  { id: 'produk-1', label: 'Insentif Produk', desc: 'Program insentif berbasis produk terpilih', icon: '📦', color: '#D93119', light: '#fff5f3' },
]

// ─── Sub-page components ─────────────────────────────────────────────────────

function TierCard({ tier }: { tier: typeof TIERS_BERSYARAT[0] }) {
  return (
    <div style={{
      background: S.card, border: `1.5px solid ${S.border}`, borderRadius: 18,
      padding: '22px 24px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
      display: 'flex', alignItems: 'center', gap: 18, transition: 'all 0.18s', cursor: 'default',
    }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = tier.color; (e.currentTarget as HTMLElement).style.boxShadow = `0 6px 24px ${tier.color}20` }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = S.border; (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)' }}
    >
      <div style={{ width: 54, height: 54, borderRadius: 14, background: tier.light, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, flexShrink: 0 }}>
        {tier.icon}
      </div>
      <div style={{ flex: 1 }}>
        <p style={{ color: S.text, fontWeight: 800, fontSize: 15, marginBottom: 4 }}>{tier.label}</p>
        <p style={{ color: S.muted, fontSize: 13 }}>{tier.desc}</p>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
        <span style={{ background: tier.light, color: tier.color, border: `1px solid ${tier.color}30`, fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 8, letterSpacing: '0.04em' }}>
          DATA BELUM TERSEDIA
        </span>
      </div>
    </div>
  )
}

function SubPageView({ type, user, onBack: goBack }: { type: SubPage; user: User; onBack: () => void }) {
  const isBersyarat = type === 'bersyarat'
  const color       = isBersyarat ? '#D93119' : '#7c3aed'
  const title       = isBersyarat ? 'Insentif Bersyarat' : 'Insentif Tanpa Syarat'
  const subtitle    = isBersyarat ? 'Tier insentif berdasarkan pencapaian toko' : 'Insentif berdasarkan produk terpilih'
  const tiers       = isBersyarat ? TIERS_BERSYARAT : TIERS_TANPA_SYARAT

  return (
    <div style={{ minHeight: '100vh', background: S.bg }}>
      <header style={{ background: S.card, borderBottom: `1px solid ${S.border}`, padding: '14px 32px', display: 'flex', alignItems: 'center', gap: 12, position: 'sticky', top: 0, zIndex: 10, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
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

      <main style={{ maxWidth: 800, margin: '0 auto', padding: '32px 24px' }}>
        <div style={{ marginBottom: 28 }}>
          <h2 style={{ color: S.text, fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 6 }}>{title}</h2>
          <p style={{ color: S.muted, fontSize: 14 }}>{subtitle}</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {tiers.map(tier => <TierCard key={tier.id} tier={tier} />)}
        </div>

        <div style={{ marginTop: 24, padding: '16px 20px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 12, color: '#92400e', fontSize: 13 }}>
          ⚠ Data insentif sedang disiapkan. Nilai akan muncul setelah sheet diisi.
        </div>
      </main>
    </div>
  )
}

// ─── Summary card (clickable) ────────────────────────────────────────────────

function SummaryCard({ item, onClick }: { item: typeof INSENTIF_SUMMARY[0]; onClick: () => void }) {
  const isBersyarat = item.type === 'bersyarat'
  const color = isBersyarat ? '#D93119' : '#7c3aed'
  const light = isBersyarat ? '#fff5f3' : '#f5f3ff'
  const pct   = Math.min(item.persen, 100)
  return (
    <button onClick={onClick} style={{ background: S.card, border: `1.5px solid ${S.border}`, borderRadius: 18, padding: '22px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', transition: 'all 0.18s', cursor: 'pointer', textAlign: 'left', width: '100%' }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = color; (e.currentTarget as HTMLElement).style.boxShadow = `0 6px 24px ${color}20` }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = S.border; (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: light, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
            {isBersyarat ? '⭐' : '✅'}
          </div>
          <span style={{ color: S.text, fontWeight: 700, fontSize: 14 }}>{item.nama}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ color, fontWeight: 900, fontSize: 24, letterSpacing: '-0.02em' }}>{item.persen.toFixed(1)}%</span>
          <span style={{ color: S.muted, fontSize: 18 }}>›</span>
        </div>
      </div>
      <div style={{ height: 8, background: '#e8edf8', borderRadius: 4, marginBottom: 12, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 4, transition: 'width 1s ease' }}/>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
        <span style={{ color: S.sub }}>Tercapai <b style={{ color: S.text }}>{formatRupiahFull(item.nilai_tercapai)}</b></span>
        <span style={{ color: S.muted }}>Target {formatRupiahFull(item.nilai_target)}</span>
      </div>
    </button>
  )
}

export default function ForecastingInsentif({ user, onBack }: Props) {
  const [subPage, setSubPage] = useState<SubPage | null>(null)
  const totalTercapai = INSENTIF_SUMMARY.reduce((s, i) => s + i.nilai_tercapai, 0)
  const totalTarget   = INSENTIF_SUMMARY.reduce((s, i) => s + i.nilai_target, 0)
  const totalPct      = (totalTercapai / totalTarget) * 100

  if (subPage) {
    return <SubPageView type={subPage} user={user} onBack={() => setSubPage(null)} />
  }

  return (
    <div style={{ minHeight: '100vh', background: S.bg }}>
      <header style={{ background: S.card, borderBottom: `1px solid ${S.border}`, padding: '14px 32px', display: 'flex', alignItems: 'center', gap: 12, position: 'sticky', top: 0, zIndex: 10, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        <img src={azkoLogo} alt="Azko" style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', objectPosition: 'center', boxShadow: '0 2px 8px rgba(217,49,25,0.25)' }}/>
        <span style={{ color: S.text, fontWeight: 800, fontSize: 14, letterSpacing: '0.06em' }}>ATLAS</span>
        <div style={{ width: 1, height: 20, background: S.border }}/>
        <button onClick={onBack} style={{ background: 'none', border: 'none', color: S.muted, fontSize: 13, cursor: 'pointer', fontWeight: 600, padding: 0, transition: 'color 0.15s' }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = S.text }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = S.muted }}
        >← Menu</button>
        <div style={{ width: 1, height: 20, background: S.border }}/>
        <span style={{ color: S.text, fontWeight: 700, fontSize: 14 }}>Forecasting Insentif</span>
        <span style={{ color: S.muted, fontSize: 12 }}>{user.nama}</span>
      </header>

      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '28px 32px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Total */}
        <div style={{ background: S.card, border: `1px solid ${S.border}`, borderRadius: 20, padding: '28px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 32, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          <div style={{ position: 'relative', width: 120, height: 120, flexShrink: 0 }}>
            <svg width="120" height="120" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="50" fill="none" stroke="#e8edf8" strokeWidth="10"/>
              <circle cx="60" cy="60" r="50" fill="none" stroke="#059669" strokeWidth="10"
                strokeDasharray={2 * Math.PI * 50}
                strokeDashoffset={2 * Math.PI * 50 * (1 - totalPct / 100)}
                strokeLinecap="round" transform="rotate(-90 60 60)"
                style={{ transition: 'stroke-dashoffset 1s ease', filter: 'drop-shadow(0 0 6px rgba(5,150,105,0.5))' }}/>
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: '#059669', fontSize: 22, fontWeight: 900 }}>{totalPct.toFixed(0)}%</span>
              <span style={{ color: S.muted, fontSize: 10 }}>Total</span>
            </div>
          </div>
          <div>
            <h2 style={{ color: S.text, fontSize: 20, fontWeight: 800, marginBottom: 6 }}>Total Insentif Bulan Ini</h2>
            <p style={{ color: S.muted, fontSize: 13, marginBottom: 20 }}>Gabungan semua kategori insentif aktif</p>
            <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap' }}>
              {[
                { label: 'Tercapai', val: totalTercapai, c: '#059669' },
                { label: 'Target',   val: totalTarget,   c: S.sub   },
                { label: 'Sisa',     val: totalTarget - totalTercapai, c: '#f59e0b' },
              ].map(r => (
                <div key={r.label}>
                  <div style={{ color: S.muted, fontSize: 11, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>{r.label}</div>
                  <div style={{ color: r.c, fontSize: 18, fontWeight: 800 }}>{formatRupiahFull(r.val)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Summary cards — clickable to sub-pages */}
        <div>
          <div style={{ color: S.muted, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>Ringkasan per Tipe Insentif</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
            {INSENTIF_SUMMARY.map(item => (
              <SummaryCard
                key={item.type}
                item={item}
                onClick={() => setSubPage(item.type === 'bersyarat' ? 'bersyarat' : 'tanpa-syarat')}
              />
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
