import { useState } from 'react'
import { DataProvider } from './context/DataContext'
import { useAtlasData } from './context/useAtlasData'
import LoginPage from './components/LoginPage'
import MenuPage from './components/MenuPage'
import PerformanceSales from './components/PerformanceSales'
import ForecastingInsentif from './components/ForecastingInsentif'
import PencapaianToko from './components/PencapaianToko'
import SpreadsheetGuide from './components/SpreadsheetGuide'
import AdminDashboard from './components/AdminDashboard'
import type { User } from './data/mockData'

type Page = 'login' | 'menu' | 'performance' | 'forecasting' | 'toko' | 'spreadsheet' | 'admin'

function AppInner() {
  const [page, setPage] = useState<Page>('login')
  const [user, setUser] = useState<User | null>(null)
  const { reload } = useAtlasData()

  const handleLogin = (u: User) => {
    setUser(u)
    setPage(u.role === 'admin' ? 'admin' : 'menu')
    reload(u.nik)
  }

  const handleLogout = () => {
    setUser(null)
    setPage('login')
  }

  if (page === 'login' || !user) return <LoginPage onLogin={handleLogin} />
  if (page === 'menu') return <MenuPage user={user} onNavigate={p => setPage(p as Page)} onLogout={handleLogout} />
  if (page === 'performance') return <PerformanceSales user={user} onBack={() => setPage('menu')} />
  if (page === 'forecasting') return <ForecastingInsentif user={user} onBack={() => setPage('menu')} />
  if (page === 'toko')        return <PencapaianToko       user={user} onBack={() => setPage('menu')} />
  if (page === 'spreadsheet') return <SpreadsheetGuide user={user} onBack={() => setPage('menu')} />
  if (page === 'admin') return <AdminDashboard user={user} onLogout={handleLogout} />
  return null
}

export default function App() {
  return (
    <DataProvider>
      <AppInner />
    </DataProvider>
  )
}
