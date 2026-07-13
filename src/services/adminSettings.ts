export interface TargetFormulaSettings {
  dailyTarget: number
  monthlyTarget: number
  monthlyMultiplier: number
  useMonthlyMultiplier: boolean
  achievementMode: 'actual_vs_target' | 'daily_prorated'
}

export interface LayoutSettings {
  primaryColor: string
  accentColor: string
  cardRadius: number
  compactMode: boolean
  showSummaryCards: boolean
  showTopPerformers: boolean
  showTrendChart: boolean
  showRankingTable: boolean
}

export interface AdminSettings {
  targetFormula: TargetFormulaSettings
  layout: LayoutSettings
}

export const ADMIN_SETTINGS_KEY = 'atlas_admin_settings_v1'

export const DEFAULT_ADMIN_SETTINGS: AdminSettings = {
  targetFormula: {
    dailyTarget: 5_000_000,
    monthlyTarget: 165_000_000,
    monthlyMultiplier: 1,
    useMonthlyMultiplier: true,
    achievementMode: 'actual_vs_target',
  },
  layout: {
    primaryColor: '#D93119',
    accentColor: '#2563eb',
    cardRadius: 18,
    compactMode: false,
    showSummaryCards: true,
    showTopPerformers: true,
    showTrendChart: true,
    showRankingTable: true,
  },
}

function readStorage(): string | null {
  if (typeof window === 'undefined') return null
  return window.localStorage.getItem(ADMIN_SETTINGS_KEY)
}

export function getAdminSettings(): AdminSettings {
  try {
    const raw = readStorage()
    if (!raw) return DEFAULT_ADMIN_SETTINGS
    const parsed = JSON.parse(raw) as Partial<AdminSettings>
    return mergeAdminSettings(DEFAULT_ADMIN_SETTINGS, parsed)
  } catch {
    return DEFAULT_ADMIN_SETTINGS
  }
}

export function setAdminSettings(next: AdminSettings): AdminSettings {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(ADMIN_SETTINGS_KEY, JSON.stringify(next))
  }
  return next
}

export function mergeAdminSettings(current: AdminSettings, patch: Partial<AdminSettings> | ((prev: AdminSettings) => AdminSettings)): AdminSettings {
  const merged = typeof patch === 'function' ? patch(current) : {
    ...current,
    ...patch,
    targetFormula: {
      ...current.targetFormula,
      ...(patch.targetFormula ?? {}),
    },
    layout: {
      ...current.layout,
      ...(patch.layout ?? {}),
    },
  }
  return merged
}

export function resetAdminSettings(): AdminSettings {
  return setAdminSettings(DEFAULT_ADMIN_SETTINGS)
}
