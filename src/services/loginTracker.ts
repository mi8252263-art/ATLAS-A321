const STORAGE_KEY = 'atlas_login_tracker_url'
// URL hardcoded — berlaku otomatis di semua device tanpa config
const DEFAULT_TRACKER_URL = 'https://script.google.com/macros/s/AKfycby4Hh7wHE_7KOfvG9R8XmR5Jnop59tJE7swZYwP94xtbAvosB_CA2FduFaz8vd__0NM/exec'

export function getTrackerUrl(): string {
  return localStorage.getItem(STORAGE_KEY) ?? ''
}

export function setTrackerUrl(url: string) {
  localStorage.setItem(STORAGE_KEY, url.trim())
}

export async function writeMenuConfigToSheet(key: string, val: boolean): Promise<boolean> {
  const url = getTrackerUrl().trim() || DEFAULT_TRACKER_URL
  if (!url) return false
  const fullUrl = `${url}?action=menuConfig&key=${encodeURIComponent(key)}&val=${val}&t=${Date.now()}`
  console.warn('[MENU-CONFIG] Sending to Apps Script:', fullUrl)
  try {
    // fetch no-cors — request fires, response unreadable (normal for Apps Script)
    await fetch(fullUrl, { method: 'GET', mode: 'no-cors', cache: 'no-store' })
    console.warn('[MENU-CONFIG] Request sent OK')
    return true
  } catch (err) {
    console.error('[MENU-CONFIG] Fetch failed:', err)
    // Fallback: image tag
    try { new Image().src = fullUrl } catch { /* silent */ }
    return false
  }
}

export async function writeAdminSettingsToSheet(payload: Record<string, unknown>): Promise<boolean> {
  const url = getTrackerUrl().trim() || DEFAULT_TRACKER_URL
  if (!url) return false
  const qs = new URLSearchParams({ action: 'adminSettings', t: String(Date.now()) })
  Object.entries(payload).forEach(([k, v]) => {
    qs.append(k, typeof v === 'string' ? v : JSON.stringify(v))
  })
  const fullUrl = `${url}?${qs.toString()}`
  console.warn('[ADMIN-SETTINGS] Sending to Apps Script:', fullUrl)
  try {
    await fetch(fullUrl, { method: 'GET', mode: 'no-cors', cache: 'no-store' })
    console.warn('[ADMIN-SETTINGS] Request sent OK')
    return true
  } catch (err) {
    console.error('[ADMIN-SETTINGS] Fetch failed:', err)
    try { new Image().src = fullUrl } catch { /* silent */ }
    return false
  }
}

export async function trackLogin(nik: string, nama: string): Promise<void> {
  const url = getTrackerUrl().trim() || DEFAULT_TRACKER_URL
  if (!url) return
  try {
    const img = new Image()
    img.src = `${url}?nik=${encodeURIComponent(nik)}&nama=${encodeURIComponent(nama)}&t=${Date.now()}`
  } catch {
    // silent
  }
}
