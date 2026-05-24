import { useMemo, useState, useEffect, useRef } from 'react'
import { tokens } from '@renderer/styles/tokens'
import type { Credenciais, Categoria, Midia } from '@renderer/types'
import { useTopMovies } from '../useTopMovies'
import { MovieCard } from '../cards/MovieCard'
import { MovieRow } from './MovieRow'
import { Spinner } from '@renderer/components/ui/Spinner'

interface MoviesLayoutProps {
  credentials: Credenciais
  categorias: Categoria[]
  onPlay: (movie: Midia) => void
}

const TERMOS_BLOQUEADOS = [
  'adulto',
  'onlyfans',
  'hentai',
  '+18',
  '18+',
  'xxx',
  'porn',
  'cinema (cam)'
]

export function MoviesLayout({ credentials, categorias, onPlay }: MoviesLayoutProps) {
  const { topMovies, loading: topLoading } = useTopMovies(credentials)

  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Midia[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [inputFocused, setInputFocused] = useState(false)

  const top10Ref = useRef<HTMLDivElement>(null)
  const isDraggingRef = useRef(false)
  const startXRef = useRef(0)
  const scrollLeftRef = useRef(0)
  const [isPressed, setIsPressed] = useState(false)

  const serverUrl = credentials.serverUrl
  const username = credentials.username
  const password = credentials.password

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

  const categoriasValidas = useMemo(() => {
    return categorias
      .filter((cat) => !TERMOS_BLOQUEADOS.some((t) => cat.category_name.toLowerCase().includes(t)))
      .slice(0, 15)
  }, [categorias])

  const isSearchActive = searchQuery.trim().length >= 3

  // Busca com debounce — só roda quando isSearchActive
  useEffect(() => {
    if (!isSearchActive) return

    const timer = setTimeout(async () => {
      setIsSearching(true)
      try {
        const data = await window.api.fetchCatalog({
          credentials: { serverUrl, username, password },
          action: 'get_vod_streams',
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
            const nomeFilme = m.nome
              .normalize('NFD')
              .replace(/[\u0300-\u036f]/g, '')
              .replace(/[^\w\s]/gi, ' ')
              .toLowerCase()
              .trim()
            return termosBusca.every((termo) => nomeFilme.includes(termo))
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

  // Resultados exibidos: derivados do estado, não sincronizados via efeito
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
          placeholder="Buscar filmes no catálogo..."
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
              {resultadosVisiveis.map((movie) => (
                <div key={movie.id} style={{ width: '140px' }}>
                  <MovieCard movie={movie} onClick={onPlay} />
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: tokens.textTertiary, fontFamily: tokens.font, fontSize: '14px' }}>
              Nenhum filme encontrado.
            </p>
          )}
        </section>
      ) : (
        <>
          {!topLoading && topMovies.length > 0 && (
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
                Top 10 Filmes Hoje
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
                {topMovies.map((movie, i) => (
                  <div key={movie.id} style={{ flexShrink: 0, width: '160px' }}>
                    <div draggable={false} style={{ width: '100%', height: '100%' }}>
                      <MovieCard movie={movie} onClick={onPlay} rank={i + 1} />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section>
            {categoriasValidas.map((categoria) => (
              <MovieRow
                key={categoria.category_id}
                categoria={categoria}
                credentials={credentials}
                onPlay={onPlay}
              />
            ))}
          </section>
        </>
      )}
    </main>
  )
}
