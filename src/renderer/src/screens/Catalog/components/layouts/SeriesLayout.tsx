import { useMemo, useState, useEffect, useRef } from 'react'
import { tokens } from '@renderer/styles/tokens'
import type { Credenciais, Categoria, Midia } from '@renderer/types'
import { useTopSeries } from '../useTopSeries'
import { SeriesCard } from '../cards/SeriesCard'
import { SeriesRow } from './SeriesRow'
import { Spinner } from '@renderer/components/ui/Spinner'
import type { SeriesWatchEntry } from '../../hooks/useWatchProgress'

interface SeriesLayoutProps {
  credentials: Credenciais
  categorias: Categoria[]
  onItemClick: (serie: Midia) => void
  continueWatchingEntries: SeriesWatchEntry[]
  onRemoveFromContinue: (seriesId: number) => void
  onContinueEpisode: (entry: SeriesWatchEntry) => void
}

const TERMOS_BLOQUEADOS = ['adulto', 'onlyfans', 'hentai', '+18', '18+', 'xxx', 'porn']

export function SeriesLayout({
  credentials,
  categorias,
  onItemClick,
  continueWatchingEntries,
  onRemoveFromContinue,
  onContinueEpisode
}: SeriesLayoutProps) {
  const { topSeries, loading: topLoading } = useTopSeries(credentials)

  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Midia[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [inputFocused, setInputFocused] = useState(false)

  const top10Ref = useRef<HTMLDivElement>(null)
  const continueRef = useRef<HTMLDivElement>(null)
  const isDraggingRef = useRef(false)
  const continueDraggingRef = useRef(false)
  const startXRef = useRef(0)
  const scrollLeftRef = useRef(0)
  const [isPressed, setIsPressed] = useState(false)
  const [isContinuePressed, setIsContinuePressed] = useState(false)

  const serverUrl = credentials.serverUrl
  const username = credentials.username
  const password = credentials.password

  // ── Drag handlers Top 10 ──────────────────────────────────────────────────

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!top10Ref.current) return
    setIsPressed(true)
    isDraggingRef.current = false
    startXRef.current = e.pageX - top10Ref.current.offsetLeft
    scrollLeftRef.current = top10Ref.current.scrollLeft
  }

  const stopDragging = () => setIsPressed(false)

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isPressed || !top10Ref.current) return
    const x = e.pageX - top10Ref.current.offsetLeft
    const walk = x - startXRef.current
    if (Math.abs(walk) > 15) {
      isDraggingRef.current = true
      e.preventDefault()
    }
    top10Ref.current.scrollLeft = scrollLeftRef.current - walk
  }

  const handleClickCapture = (e: React.MouseEvent) => {
    if (isDraggingRef.current) {
      e.stopPropagation()
      e.preventDefault()
      isDraggingRef.current = false
    }
  }

  // ── Drag handlers Continue ────────────────────────────────────────────────

  const handleContinueMouseDown = (e: React.MouseEvent) => {
    if (!continueRef.current) return
    setIsContinuePressed(true)
    continueDraggingRef.current = false
    startXRef.current = e.pageX - continueRef.current.offsetLeft
    scrollLeftRef.current = continueRef.current.scrollLeft
  }

  const stopContinueDragging = () => setIsContinuePressed(false)

  const handleContinueMouseMove = (e: React.MouseEvent) => {
    if (!isContinuePressed || !continueRef.current) return
    const x = e.pageX - continueRef.current.offsetLeft
    const walk = x - startXRef.current
    if (Math.abs(walk) > 15) {
      continueDraggingRef.current = true
      e.preventDefault()
    }
    continueRef.current.scrollLeft = scrollLeftRef.current - walk
  }

  const handleContinueClickCapture = (e: React.MouseEvent) => {
    if (continueDraggingRef.current) {
      e.stopPropagation()
      e.preventDefault()
      continueDraggingRef.current = false
    }
  }

  // ── Busca ─────────────────────────────────────────────────────────────────

  const categoriasValidas = useMemo(() => {
    return categorias
      .filter((cat) => !TERMOS_BLOQUEADOS.some((t) => cat.category_name.toLowerCase().includes(t)))
      .slice(0, 15)
  }, [categorias])

  const isSearchActive = searchQuery.trim().length >= 3

  useEffect(() => {
    if (!isSearchActive) return
    const timer = setTimeout(async () => {
      setIsSearching(true)
      try {
        const data = await window.api.fetchCatalog({
          credentials: { serverUrl, username, password },
          action: 'get_series',
          category_id: ''
        })
        if (Array.isArray(data)) {
          const termosBusca = searchQuery
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^\w\s]/gi, ' ')
            .toLowerCase()
            .trim()
            .split(/\s+/)
          const filtrados = data.filter((m) => {
            const nomeSerie = m.nome
              .normalize('NFD')
              .replace(/[\u0300-\u036f]/g, '')
              .replace(/[^\w\s]/gi, ' ')
              .toLowerCase()
              .trim()
            return termosBusca.every((termo) => nomeSerie.includes(termo))
          })
          setSearchResults(filtrados.slice(0, 100))
        }
      } catch (err) {
        console.error('Falha na busca', err)
      } finally {
        setIsSearching(false)
      }
    }, 600)
    return () => clearTimeout(timer)
  }, [searchQuery, isSearchActive, serverUrl, username, password])

  const resultadosVisiveis = isSearchActive ? searchResults : []

  return (
    <main
      style={{
        flex: 1,
        overflowY: 'auto',
        overflowX: 'hidden',
        backgroundColor: tokens.bg,
        paddingTop: '32px',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      {/* Search */}
      <div style={{ padding: '0 36px', marginBottom: '32px' }}>
        <input
          type="text"
          placeholder="Buscar séries no catálogo..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => setInputFocused(true)}
          onBlur={() => setInputFocused(false)}
          style={{
            width: '100%',
            maxWidth: '400px',
            padding: '12px 16px',
            borderRadius: '10px',
            border: `1px solid ${inputFocused ? tokens.accent : tokens.border}`,
            backgroundColor: tokens.surfaceElevated,
            color: tokens.textPrimary,
            fontFamily: tokens.font,
            fontSize: '14px',
            outline: 'none',
            transition: 'border-color 0.2s ease'
          }}
        />
      </div>

      {isSearchActive ? (
        <section style={{ padding: '0 36px' }}>
          <h2
            style={{
              fontFamily: tokens.font,
              fontSize: '20px',
              fontWeight: 700,
              letterSpacing: '-0.02em',
              color: tokens.textPrimary,
              marginBottom: '20px'
            }}
          >
            Resultados para &ldquo;{searchQuery}&rdquo;
          </h2>
          {isSearching ? (
            <Spinner />
          ) : resultadosVisiveis.length > 0 ? (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
              {resultadosVisiveis.map((serie) => (
                <div key={serie.id} style={{ width: '140px' }}>
                  <SeriesCard movie={serie} onClick={onItemClick} />
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: tokens.textTertiary, fontFamily: tokens.font, fontSize: '14px' }}>
              Nenhuma série encontrada.
            </p>
          )}
        </section>
      ) : (
        <>
          {/* Top 10 */}
          {!topLoading && topSeries.length > 0 && (
            <section style={{ marginBottom: '40px' }}>
              <h2
                style={{
                  fontFamily: tokens.font,
                  fontSize: '22px',
                  fontWeight: 700,
                  letterSpacing: '-0.02em',
                  color: tokens.textPrimary,
                  margin: '0 0 10px 36px'
                }}
              >
                Top 10 Séries Hoje
              </h2>
              <div
                ref={top10Ref}
                className="hide-scrollbar"
                onMouseDown={handleMouseDown}
                onMouseLeave={stopDragging}
                onMouseUp={stopDragging}
                onMouseMove={handleMouseMove}
                onClickCapture={handleClickCapture}
                onDragStart={(e) => e.preventDefault()}
                style={{
                  display: 'flex',
                  gap: '36px',
                  padding: '20px 36px 30px',
                  overflowX: 'auto',
                  overflowY: 'hidden',
                  scrollBehavior: isPressed ? 'auto' : 'smooth',
                  cursor: isPressed ? 'grabbing' : 'grab',
                  userSelect: 'none'
                }}
              >
                {topSeries.map((serie, i) => (
                  <div key={serie.id} style={{ flexShrink: 0, width: '160px' }}>
                    <div draggable={false} style={{ width: '100%', height: '100%' }}>
                      <SeriesCard movie={serie} onClick={onItemClick} rank={i + 1} />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Continue Assistindo — séries */}
          {continueWatchingEntries.length > 0 && (
            <section style={{ marginBottom: '32px' }}>
              <h3
                style={{
                  fontFamily: tokens.font,
                  fontSize: '18px',
                  fontWeight: 600,
                  letterSpacing: '-0.01em',
                  color: tokens.textPrimary,
                  margin: '0 0 0 36px'
                }}
              >
                Continue Assistindo
              </h3>
              <div
                ref={continueRef}
                className="hide-scrollbar"
                onMouseDown={handleContinueMouseDown}
                onMouseLeave={stopContinueDragging}
                onMouseUp={stopContinueDragging}
                onMouseMove={handleContinueMouseMove}
                onClickCapture={handleContinueClickCapture}
                onDragStart={(e) => e.preventDefault()}
                style={{
                  display: 'flex',
                  gap: '12px',
                  padding: '10px 36px 20px',
                  overflowX: 'auto',
                  overflowY: 'hidden',
                  scrollBehavior: isContinuePressed ? 'auto' : 'smooth',
                  cursor: isContinuePressed ? 'grabbing' : 'grab',
                  userSelect: 'none'
                }}
              >
                {continueWatchingEntries.map((entry) => {
                  return (
                    <div
                      key={entry.seriesId}
                      style={{
                        flexShrink: 0,
                        width: '140px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px'
                      }}
                    >
                      {/* Card da série */}
                      <div
                        onClick={() => !continueDraggingRef.current && onContinueEpisode(entry)}
                        style={{
                          width: '100%',
                          aspectRatio: '2/3',
                          borderRadius: '6px',
                          overflow: 'hidden',
                          background: tokens.surface,
                          border: `1px solid ${tokens.border}`,
                          cursor: 'pointer',
                          position: 'relative',
                          transition:
                            'transform 0.28s cubic-bezier(0.25,1,0.5,1), border-color 0.28s, box-shadow 0.28s'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'scale(1.04) translateY(-3px)'
                          e.currentTarget.style.borderColor = 'rgba(138,43,226,0.45)'
                          e.currentTarget.style.boxShadow = '0 12px 28px rgba(0,0,0,0.8)'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'scale(1)'
                          e.currentTarget.style.borderColor = tokens.border
                          e.currentTarget.style.boxShadow = 'none'
                        }}
                      >
                        {entry.seriesCapa ? (
                          <img
                            src={entry.seriesCapa}
                            alt={entry.seriesNome}
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                              display: 'block'
                            }}
                            onError={(e) => {
                              e.currentTarget.style.display = 'none'
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              width: '100%',
                              height: '100%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: tokens.textTertiary,
                              fontSize: '22px',
                              fontWeight: 700
                            }}
                          >
                            {entry.seriesNome.charAt(0).toUpperCase()}
                          </div>
                        )}
                        {/* Botão remover */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            onRemoveFromContinue(entry.seriesId)
                          }}
                          style={{
                            position: 'absolute',
                            top: '6px',
                            right: '6px',
                            width: '22px',
                            height: '22px',
                            borderRadius: '50%',
                            background: 'rgba(0,0,0,0.75)',
                            border: '1px solid rgba(255,255,255,0.15)',
                            color: tokens.textSecondary,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            transition: 'color 0.15s'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.color = '#fff'
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.color = tokens.textSecondary
                          }}
                        >
                          <svg
                            width="10"
                            height="10"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                          >
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                          </svg>
                        </button>
                        {/* Badge do episódio */}
                        <div
                          style={{
                            position: 'absolute',
                            bottom: '6px',
                            left: '6px',
                            background: 'rgba(0,0,0,0.75)',
                            backdropFilter: 'blur(4px)',
                            borderRadius: '6px',
                            padding: '3px 7px'
                          }}
                        >
                          <span
                            style={{
                              fontSize: '10px',
                              fontWeight: 600,
                              color: tokens.textPrimary,
                              fontFamily: tokens.font
                            }}
                          >
                            T{entry.seasonNum} E{entry.episodeNum}
                          </span>
                        </div>
                      </div>
                      {/* Nome da série */}
                      <p
                        style={{
                          fontSize: '12px',
                          fontWeight: 500,
                          color: tokens.textSecondary,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          padding: '0 2px',
                          margin: 0,
                          fontFamily: tokens.font
                        }}
                      >
                        {entry.seriesNome}
                      </p>
                    </div>
                  )
                })}
              </div>
            </section>
          )}

          {/* Rows por categoria */}
          <section>
            {categoriasValidas.map((categoria) => (
              <SeriesRow
                key={categoria.category_id}
                categoria={categoria}
                credentials={credentials}
                onPlay={onItemClick}
              />
            ))}
          </section>
        </>
      )}
    </main>
  )
}
