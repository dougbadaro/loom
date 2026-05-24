import { useEffect, useState } from 'react'
import { Categoria, Credenciais, Midia, SeriesData, TipoCatalogo } from '../../types'
import { tokens } from '@renderer/styles/tokens'

import { PlayerScreen } from '../Player/PlayerScreen'
import { SeriesScreen } from '../Series/SeriesScreen'
import { ErrorMsg } from '@renderer/components/ui/ErrorMsg'
import { Spinner } from '@renderer/components/ui/Spinner'

import { CatalogHeader } from './components/CatalogHeader'
import { LiveLayout } from './components/layouts/LiveLayout'
import { MoviesLayout } from './components/layouts/MoviesLayout'
import { SeriesLayout } from './components/layouts/SeriesLayout'
import { LiveSidebar } from './components/sidebars/LiveSidebar'

interface CatalogScreenProps {
  credentials: Credenciais
  initialTab?: TipoCatalogo
  onBack: () => void
  onLogout: () => void
}

const actionMap = {
  live: 'get_live_categories',
  vod: 'get_vod_categories',
  series: 'get_series_categories'
} as const

const contentMap = {
  live: 'get_live_streams',
  vod: 'get_vod_streams',
  series: 'get_series'
} as const

// Type guard para respostas com erro
function hasError(data: unknown): data is { error: string } {
  return typeof data === 'object' && data !== null && 'error' in data
}

export function CatalogScreen({
  credentials,
  initialTab = 'vod',
  onBack,
  onLogout
}: CatalogScreenProps) {
  const [tipoCatalogo, setTipoCatalogo] = useState<TipoCatalogo>(initialTab)
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [categoriaAtiva, setCategoriaAtiva] = useState<string | null>(null)
  const [movies, setMovies] = useState<Midia[]>([])
  const [activeSeriesData, setActiveSeriesData] = useState<SeriesData | null>(null)
  const [activeVideo, setActiveVideo] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isNetflixStyle = tipoCatalogo === 'vod' || tipoCatalogo === 'series'

  const serverUrl = credentials.serverUrl
  const username = credentials.username
  const password = credentials.password

  // ── Load Categories ────────────────────────────────────────────────────────

  useEffect(() => {
    const load = async () => {
      try {
        setError(null)
        const data = await window.api.fetchCategories({
          credentials: { serverUrl, username, password },
          action: actionMap[tipoCatalogo]
        })

        if (hasError(data)) {
          setError(data.error)
          return
        }

        setCategorias(data)
        setCategoriaAtiva(data.length > 0 ? String(data[0].category_id) : null)
        setMovies([])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar categorias')
      }
    }

    load()
  }, [tipoCatalogo, serverUrl, username, password])

  // ── Load Catalog (só para Live) ────────────────────────────────────────────

  useEffect(() => {
    if (isNetflixStyle) return
    if (!categoriaAtiva) return

    let montado = true

    const load = async () => {
      setError(null)
      try {
        const data = await window.api.fetchCatalog({
          credentials: { serverUrl, username, password },
          action: contentMap[tipoCatalogo],
          category_id: categoriaAtiva
        })

        if (!montado) return

        if (hasError(data)) setError(data.error)
        else setMovies(data)
      } catch (err) {
        if (montado) setError(err instanceof Error ? err.message : 'Erro ao carregar catálogo')
      } finally {
        if (montado) setLoading(false)
      }
    }

    load()
    return () => {
      montado = false
    }
  }, [categoriaAtiva, tipoCatalogo, serverUrl, username, password, isNetflixStyle])

  // loading para live: derivado, sem setState no efeito
  const isLiveLoading =
    tipoCatalogo === 'live' && categoriaAtiva !== null && movies.length === 0 && !error

  // ── Handle Item Click ──────────────────────────────────────────────────────

  const handleItemClick = async (movie: Midia) => {
    if (movie.tipo === 'series') {
      setLoading(true)
      try {
        const data = await window.api.fetchSeriesInfo({
          credentials: { serverUrl, username, password },
          series_id: movie.id
        })

        if (hasError(data)) setError(data.error)
        else setActiveSeriesData(data as SeriesData)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao buscar série')
      } finally {
        setLoading(false)
      }
      return
    }

    const url =
      movie.tipo === 'live'
        ? `${serverUrl}/live/${username}/${password}/${movie.id}.m3u8`
        : `${serverUrl}/movie/${username}/${password}/${movie.id}.${movie.extensao}`

    setActiveVideo(url)
  }

  // ── Overlays ───────────────────────────────────────────────────────────────

  if (activeVideo) {
    return <PlayerScreen url={activeVideo} onBack={() => setActiveVideo(null)} />
  }

  if (activeSeriesData) {
    return (
      <SeriesScreen
        data={activeSeriesData}
        credentials={credentials}
        onBack={() => setActiveSeriesData(null)}
        onPlay={setActiveVideo}
      />
    )
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  const renderSidebar = () => {
    if (tipoCatalogo !== 'live') return null
    return (
      <LiveSidebar
        categorias={categorias}
        categoriaAtiva={categoriaAtiva}
        onSelectCategory={setCategoriaAtiva}
      />
    )
  }

  const renderContent = () => {
    switch (tipoCatalogo) {
      case 'live':
        return <LiveLayout channels={movies} onItemClick={handleItemClick} />
      case 'series':
        return (
          <SeriesLayout
            credentials={credentials}
            categorias={categorias}
            onItemClick={handleItemClick}
          />
        )
      case 'vod':
      default:
        return (
          <MoviesLayout
            credentials={credentials}
            categorias={categorias}
            onPlay={handleItemClick}
          />
        )
    }
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        width: '100vw',
        overflow: 'hidden',
        fontFamily: tokens.font,
        color: tokens.textPrimary,
        background: `radial-gradient(circle at top, rgba(255,255,255,0.03), transparent 40%), ${tokens.bg}`
      }}
    >
      <CatalogHeader
        tipoCatalogo={tipoCatalogo}
        onChangeTab={(tipo) => {
          setTipoCatalogo(tipo)
          setActiveSeriesData(null)
        }}
        onBack={onBack}
        onLogout={onLogout}
      />

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {renderSidebar()}

        <main
          style={{
            flex: 1,
            padding: isNetflixStyle ? '0' : '34px 38px',
            overflowY: 'auto',
            background: 'transparent'
          }}
        >
          {error && (
            <div style={{ marginBottom: '24px', padding: isNetflixStyle ? '0 36px' : '0' }}>
              <ErrorMsg msg={error} />
            </div>
          )}

          {(isLiveLoading || loading) && tipoCatalogo === 'live' ? <Spinner /> : renderContent()}
        </main>
      </div>
    </div>
  )
}
