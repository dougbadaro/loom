import { useState } from 'react'
import type { JSX } from 'react'
import { GlobalStyles } from './styles/GlobalStyles'
import { Credenciais, TipoCatalogo } from './types'

import { LoginScreen } from './screens/Login/LoginScreen'
import { HomeScreen } from './screens/Home/HomeScreen'
import { CatalogScreen } from './screens/Catalog/CatalogScreen'

export default function App(): JSX.Element {
  const [credentials, setCredentials] = useState<Credenciais | null>(() => {
    const saved = localStorage.getItem('loom_credentials')
    return saved ? JSON.parse(saved) : null
  })

  const [activeTab, setActiveTab] = useState<TipoCatalogo | 'home'>('home')

  const handleLogin = (c: Credenciais) => {
    localStorage.setItem('loom_credentials', JSON.stringify(c))
    setCredentials(c)
  }

  const handleLogout = () => {
    localStorage.removeItem('loom_credentials')
    setCredentials(null)
    setActiveTab('home')
  }

  return (
    <>
      <GlobalStyles />

      {!credentials && <LoginScreen onLogin={handleLogin} />}

      {credentials && activeTab === 'home' && (
        <HomeScreen onEnter={setActiveTab} onLogout={handleLogout} />
      )}

      {credentials && activeTab !== 'home' && (
        <CatalogScreen
          credentials={credentials}
          initialTab={activeTab}
          onBack={() => setActiveTab('home')}
          onLogout={handleLogout}
        />
      )}
    </>
  )
}
