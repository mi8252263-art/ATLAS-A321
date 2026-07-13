import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  DEFAULT_ADMIN_SETTINGS,
  getAdminSettings,
  setAdminSettings,
  type AdminSettings,
} from '../services/adminSettings'
import { writeAdminSettingsToSheet } from '../services/loginTracker'

interface AdminSettingsContextValue {
  settings: AdminSettings
  setSettings: (value: AdminSettings | ((prev: AdminSettings) => AdminSettings)) => void
  updateTargetFormula: (patch: Partial<AdminSettings['targetFormula']>) => void
  updateLayout: (patch: Partial<AdminSettings['layout']>) => void
}

const AdminSettingsContext = createContext<AdminSettingsContextValue | undefined>(undefined)

export function AdminSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettingsState] = useState<AdminSettings>(() => getAdminSettings())

  const applySettings = useCallback((value: AdminSettings | ((prev: AdminSettings) => AdminSettings)) => {
    const next = typeof value === 'function' ? value(settings) : value
    setSettingsState(next)
    setAdminSettings(next)
    window.dispatchEvent(new Event('atlas-admin-settings-changed'))
    void writeAdminSettingsToSheet({
      targetFormula: next.targetFormula,
      layout: next.layout,
    })
  }, [settings])

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key === 'atlas_admin_settings_v1') {
        setSettingsState(getAdminSettings())
      }
    }
    const handleCustom = () => setSettingsState(getAdminSettings())
    window.addEventListener('storage', handleStorage)
    window.addEventListener('atlas-admin-settings-changed', handleCustom)
    return () => {
      window.removeEventListener('storage', handleStorage)
      window.removeEventListener('atlas-admin-settings-changed', handleCustom)
    }
  }, [])

  const updateTargetFormula = useCallback((patch: Partial<AdminSettings['targetFormula']>) => {
    applySettings(prev => ({ ...prev, targetFormula: { ...prev.targetFormula, ...patch } }))
  }, [applySettings])

  const updateLayout = useCallback((patch: Partial<AdminSettings['layout']>) => {
    applySettings(prev => ({ ...prev, layout: { ...prev.layout, ...patch } }))
  }, [applySettings])

  const value = useMemo(() => ({
    settings,
    setSettings: applySettings,
    updateTargetFormula,
    updateLayout,
  }), [settings, applySettings, updateTargetFormula, updateLayout])

  return <AdminSettingsContext.Provider value={value}>{children}</AdminSettingsContext.Provider>
}

export function useAdminSettings() {
  const context = useContext(AdminSettingsContext)
  if (!context) throw new Error('useAdminSettings must be used within AdminSettingsProvider')
  return context
}

export const adminThemeDefaults = DEFAULT_ADMIN_SETTINGS
