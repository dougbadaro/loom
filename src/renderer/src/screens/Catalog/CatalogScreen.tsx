import { useEffect, useState } from 'react'

import { Categoria, Credenciais, Midia, SeriesData, TipoCatalogo } from '../../types'

import { tokens } from '@renderer/styles/tokens'

import { PlayerScreen } from '../Player/PlayerScreen'
import { SeriesScreen } from '../Series/SeriesScreen'

import { ErrorMsg } from '@renderer/components/ui/ErrorMsg'
import { Spinner } from '@renderer/components/ui/Spinner'

import { CatalogHeader } from './components/CatalogHeader'
import { CatalogSidebar } from './components/CatalogSidebar'
import { CatalogGrid } from './components/CatalogGrid'

import { MovieCard } from './components/cards/MovieCard'
import { SeriesCard } from './components/cards/SeriesCard'
import { LiveCard } from './components/cards/LiveCard'

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

  // =========================
  // Load Categories
  // =========================

  useEffect(() => {
    const load = async () => {
      try {
        setError(null)

        const data = (await window.api.fetchCategories({
          credentials,
          action: actionMap[tipoCatalogo]
        })) as Categoria[] & {
          error?: string
        }

        if (data.error) {
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
  }, [tipoCatalogo, credentials])

  // =========================
  // Load Catalog
  // =========================

  useEffect(() => {
    if (!categoriaAtiva) return

    const load = async () => {
      setLoading(true)
      setError(null)

      try {
        const data = (await window.api.fetchCatalog({
          credentials,
          action: contentMap[tipoCatalogo],
          category_id: categoriaAtiva
        })) as Midia[] & {
          error?: string
        }

        if (data.error) {
          setError(data.error)
        } else {
          setMovies(data)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar catálogo')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [categoriaAtiva, tipoCatalogo, credentials])

  // =========================
  // Handle Click
  // =========================

  const handleItemClick = async (movie: Midia) => {
    if (movie.tipo === 'series') {
      setLoading(true)

      try {
        const data = (await window.api.fetchSeriesInfo({
          credentials,
          series_id: movie.id
        })) as SeriesData & {
          error?: string
        }

        if (data.error) {
          setError(data.error)
        } else {
          setActiveSeriesData(data)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao buscar série')
      } finally {
        setLoading(false)
      }

      return
    }

    const url =
      movie.tipo === 'live'
        ? `${credentials.serverUrl}/live/${credentials.username}/${credentials.password}/${movie.id}.m3u8`
        : `${credentials.serverUrl}/movie/${credentials.username}/${credentials.password}/${movie.id}.${movie.extensao}`

    setActiveVideo(url)
  }

  // =========================
  // Render Layout
  // =========================

  const renderContent = () => {
    switch (tipoCatalogo) {
      case 'live':
        return (
          <CatalogGrid>
            {movies.map((movie) => (
              <LiveCard key={movie.id} channel={movie} onClick={handleItemClick} />
            ))}
          </CatalogGrid>
        )

      case 'series':
        return (
          <CatalogGrid>
            {movies.map((movie) => (
              <SeriesCard key={movie.id} series={movie} onClick={handleItemClick} />
            ))}
          </CatalogGrid>
        )

      case 'vod':
      default:
        return (
          <CatalogGrid>
            {movies.map((movie) => (
              <MovieCard key={movie.id} movie={movie} onClick={handleItemClick} />
            ))}
          </CatalogGrid>
        )
    }
  }

  // =========================
  // Screens
  // =========================

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

  // =========================
  // Main Screen
  // =========================

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        width: '100vw',
        fontFamily: tokens.font,
        color: tokens.textPrimary,
        backgroundColor: tokens.bg
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

      <div
        style={{
          display: 'flex',
          flex: 1,
          overflow: 'hidden'
        }}
      >
        <CatalogSidebar
          categorias={categorias}
          categoriaAtiva={categoriaAtiva}
          onSelectCategory={setCategoriaAtiva}
        />

        <main
          style={{
            flex: 1,
            padding: '32px 36px',
            overflowY: 'auto',
            backgroundColor: tokens.bg
          }}
        >
          {error && <ErrorMsg msg={error} />}

          {loading ? <Spinner /> : renderContent()}
        </main>
      </div>
    </div>
  )
}
