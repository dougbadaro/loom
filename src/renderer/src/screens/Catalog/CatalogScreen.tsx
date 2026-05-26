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
import { useWatchProgress } from './hooks/useWatchProgress'
import { EpisodeContext } from '../Series/EpisodeContext'

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

function hasError(data: unknown): data is { error: string } {
  return typeof data === 'object' && data !== null && 'error' in data
}

interface ActiveMovieEntry {
  movie: Midia
  startTime: number
}

interface ActiveEpisodeEntry {
  context: EpisodeContext
  startTime: number
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
  const [activeMovieEntry, setActiveMovieEntry] = useState<ActiveMovieEntry | null>(null)
  const [activeEpisodeEntry, setActiveEpisodeEntry] = useState<ActiveEpisodeEntry | null>(null)
  const [activeSeriesId, setActiveSeriesId] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    saveMovieProgress,
    removeMovieProgress,
    getMovieProgress,
    continueWatching,
    saveSeriesProgress,
    removeSeriesProgress,
    getSeriesProgress,
    continueWatchingSeries
  } = useWatchProgress()

  const isNetflixStyle = tipoCatalogo === 'vod' || tipoCatalogo === 'series'
  const serverUrl = credentials.serverUrl
  const username = credentials.username
  const password = credentials.password

  // ── Load Categories ──────────────────────────────────────────────────────

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

  // ── Load Catalog (só Live) ───────────────────────────────────────────────

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

  const isLiveLoading =
    tipoCatalogo === 'live' && categoriaAtiva !== null && movies.length === 0 && !error

  // ── Handle Item Click ────────────────────────────────────────────────────

  const handleItemClick = async (movie: Midia) => {
    if (movie.tipo === 'series') {
      setLoading(true)
      try {
        const data = await window.api.fetchSeriesInfo({
          credentials: { serverUrl, username, password },
          series_id: movie.id
        })
        if (hasError(data)) setError(data.error)
        else {
          setActiveSeriesData(data as SeriesData)
          setActiveSeriesId(movie.id)
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
        ? `${serverUrl}/live/${username}/${password}/${movie.id}.m3u8`
        : `${serverUrl}/movie/${username}/${password}/${movie.id}.${movie.extensao}`

    const saved = movie.tipo === 'vod' ? getMovieProgress(movie.id) : null
    setActiveMovieEntry(movie.tipo === 'vod' ? { movie, startTime: saved?.currentTime ?? 0 } : null)
    setActiveEpisodeEntry(null)
    setActiveVideo(url)
  }

  // ── Handle Continue Episode (do Continue Assistindo de séries) ─────────────
  // Busca dados da série, reconstrói EpisodeContext e vai direto ao player

  const handleContinueEpisode = async (
    entry: import('./hooks/useWatchProgress').SeriesWatchEntry
  ) => {
    setLoading(true)
    try {
      const data = await window.api.fetchSeriesInfo({
        credentials: { serverUrl, username, password },
        series_id: entry.seriesId
      })
      if (hasError(data)) {
        setError(data.error)
        return
      }

      const seriesData = data as SeriesData
      const episodeList = seriesData.episodes[entry.seasonNum] ?? []
      const currentIndex = episodeList.findIndex((ep) => String(ep.id) === String(entry.episodeId))
      const baseUrl = `${serverUrl}/series/${username}/${password}/`
      const url = `${baseUrl}${entry.episodeId}.${entry.container_extension}`

      const context: EpisodeContext = {
        seriesId: entry.seriesId,
        seriesNome: entry.seriesNome,
        seriesCapa: entry.seriesCapa,
        episodeId: String(entry.episodeId),
        episodeNum: entry.episodeNum,
        episodeTitle: entry.episodeTitle,
        seasonNum: entry.seasonNum,
        container_extension: entry.container_extension,
        episodeList,
        currentIndex: currentIndex >= 0 ? currentIndex : 0,
        baseUrl
      }

      setActiveEpisodeEntry({ context, startTime: entry.currentTime ?? 0 })
      setActiveMovieEntry(null)
      setActiveSeriesId(entry.seriesId)
      setActiveVideo(url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao continuar série')
    } finally {
      setLoading(false)
    }
  }

  // ── Handle Play Episode (do SeriesScreen) ────────────────────────────────

  const handlePlayEpisode = (url: string, context: EpisodeContext) => {
    const saved = getSeriesProgress(context.seriesId, context.episodeId)
    setActiveEpisodeEntry({ context, startTime: saved?.currentTime ?? 0 })
    setActiveMovieEntry(null)
    setActiveVideo(url)
  }

  // ── Handle Next Episode (do PlayerScreen) ────────────────────────────────

  const handleNextEpisode = (url: string, context: EpisodeContext) => {
    // Salva progresso do episódio atual antes de avançar
    const video = document.querySelector('video')
    if (video && activeEpisodeEntry && video.duration > 0) {
      saveSeriesProgress({
        seriesId: activeEpisodeEntry.context.seriesId,
        seriesNome: activeEpisodeEntry.context.seriesNome,
        seriesCapa: activeEpisodeEntry.context.seriesCapa,
        episodeId: activeEpisodeEntry.context.episodeId,
        episodeNum: activeEpisodeEntry.context.episodeNum,
        episodeTitle: activeEpisodeEntry.context.episodeTitle,
        seasonNum: activeEpisodeEntry.context.seasonNum,
        container_extension: activeEpisodeEntry.context.container_extension,
        currentTime: video.currentTime,
        duration: video.duration
      })
    }
    const saved = getSeriesProgress(context.seriesId, context.episodeId)
    setActiveEpisodeEntry({ context, startTime: saved?.currentTime ?? 0 })
    setActiveVideo(url)
  }

  // ── Progresso de episódio ────────────────────────────────────────────────

  const handleEpisodeProgressUpdate = (currentTime: number, duration: number) => {
    if (!activeEpisodeEntry) return
    const ctx = activeEpisodeEntry.context
    saveSeriesProgress({
      seriesId: ctx.seriesId,
      seriesNome: ctx.seriesNome,
      seriesCapa: ctx.seriesCapa,
      episodeId: ctx.episodeId,
      episodeNum: ctx.episodeNum,
      episodeTitle: ctx.episodeTitle,
      seasonNum: ctx.seasonNum,
      container_extension: ctx.container_extension,
      currentTime,
      duration
    })
  }

  // ── Progresso por episódio para SeriesScreen ─────────────────────────────
  // Mapa de episodeId → SeriesWatchEntry para a série ativa
  // Mapa de episodeId → progresso para a série ativa
  const episodeProgressMap =
    activeSeriesData && activeSeriesId !== null
      ? Object.fromEntries(
          continueWatchingSeries()
            .filter((e) => e.seriesId === activeSeriesId)
            .map((e) => [e.episodeId, e])
        )
      : {}

  // ── Overlays ─────────────────────────────────────────────────────────────

  if (activeVideo) {
    return (
      <PlayerScreen
        url={activeVideo}
        title={activeMovieEntry?.movie.nome}
        startTime={activeMovieEntry?.startTime ?? activeEpisodeEntry?.startTime}
        episodeContext={activeEpisodeEntry?.context}
        onBack={() => {
          setActiveVideo(null)
          setActiveMovieEntry(null)
          setActiveEpisodeEntry(null)
        }}
        onProgressUpdate={
          activeMovieEntry
            ? (currentTime, duration) => {
                saveMovieProgress({
                  id: activeMovieEntry.movie.id,
                  nome: activeMovieEntry.movie.nome,
                  capa: activeMovieEntry.movie.capa,
                  extensao: activeMovieEntry.movie.extensao,
                  currentTime,
                  duration
                })
              }
            : activeEpisodeEntry
              ? handleEpisodeProgressUpdate
              : undefined
        }
        onNextEpisode={activeEpisodeEntry ? handleNextEpisode : undefined}
      />
    )
  }

  if (activeSeriesData) {
    return (
      <SeriesScreen
        data={activeSeriesData}
        credentials={credentials}
        onBack={() => setActiveSeriesData(null)}
        onPlayEpisode={handlePlayEpisode}
        episodeProgress={episodeProgressMap}
        seriesId={activeSeriesId ?? 0}
      />
    )
  }

  // ── Render ────────────────────────────────────────────────────────────────

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
            continueWatchingEntries={continueWatchingSeries()}
            onRemoveFromContinue={removeSeriesProgress}
            onContinueEpisode={handleContinueEpisode}
          />
        )
      case 'vod':
      default:
        return (
          <MoviesLayout
            credentials={credentials}
            categorias={categorias}
            onPlay={handleItemClick}
            continueWatchingEntries={continueWatching()}
            onRemoveFromContinue={removeMovieProgress}
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
        {tipoCatalogo === 'live' && (
          <LiveSidebar
            categorias={categorias}
            categoriaAtiva={categoriaAtiva}
            onSelectCategory={setCategoriaAtiva}
          />
        )}

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
