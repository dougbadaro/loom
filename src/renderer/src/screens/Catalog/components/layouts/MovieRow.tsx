import { useState, useEffect, useRef } from 'react'
import { tokens } from '@renderer/styles/tokens'
import type { Credenciais, Midia, Categoria } from '@renderer/types'
import { MovieCard } from '../cards/MovieCard'
import { Spinner } from '@renderer/components/ui/Spinner'

interface MovieRowProps {
  categoria: Categoria
  credentials: Credenciais
  onPlay: (movie: Midia) => void
  limit?: number
}

export function MovieRow({ categoria, credentials, onPlay, limit = 20 }: MovieRowProps) {
  const [movies, setMovies] = useState<Midia[]>([])
  const [loading, setLoading] = useState(true)

  const rowRef = useRef<HTMLDivElement>(null)
  const isDraggingRef = useRef(false)
  const startXRef = useRef(0)
  const scrollLeftRef = useRef(0)
  const [isPressed, setIsPressed] = useState(false)

  const serverUrl = credentials.serverUrl
  const username = credentials.username
  const password = credentials.password
  const categoryId = categoria.category_id

  useEffect(() => {
    let montado = true

    const fetchMovies = async () => {
      try {
        const data = await window.api.fetchCatalog({
          credentials: { serverUrl, username, password },
          action: 'get_vod_streams',
          category_id: categoryId
        })

        if (!montado) return

        if (Array.isArray(data)) {
          setMovies(data.slice(0, limit))
        }
      } catch (e) {
        console.error('Erro na fileira', e)
      } finally {
        if (montado) setLoading(false)
      }
    }

    fetchMovies()
    return () => {
      montado = false
    }
  }, [serverUrl, username, password, categoryId, limit])

  const nomeLimpo = categoria.category_name.split(' | ').pop() || categoria.category_name

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!rowRef.current) return
    setIsPressed(true)
    isDraggingRef.current = false
    startXRef.current = e.pageX - rowRef.current.offsetLeft
    scrollLeftRef.current = rowRef.current.scrollLeft
  }

  const stopDragging = () => setIsPressed(false)

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isPressed || !rowRef.current) return
    const x = e.pageX - rowRef.current.offsetLeft
    const walk = x - startXRef.current
    if (Math.abs(walk) > 15) {
      isDraggingRef.current = true
      e.preventDefault()
    }
    rowRef.current.scrollLeft = scrollLeftRef.current - walk
  }

  const handleClickCapture = (e: React.MouseEvent) => {
    if (isDraggingRef.current) {
      e.stopPropagation()
      e.preventDefault()
      isDraggingRef.current = false
    }
  }

  if (loading) {
    return (
      <div style={{ height: '220px', display: 'flex', alignItems: 'center', paddingLeft: '36px' }}>
        <Spinner />
      </div>
    )
  }

  if (movies.length === 0) return null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '32px' }}>
      <h3
        style={{
          fontFamily: tokens.font,
          fontSize: '18px',
          fontWeight: 600,
          color: tokens.textPrimary,
          margin: '0 0 0 36px',
          letterSpacing: '-0.01em'
        }}
      >
        {nomeLimpo}
      </h3>

      <div
        ref={rowRef}
        className="hide-scrollbar"
        onMouseDown={handleMouseDown}
        onMouseLeave={stopDragging}
        onMouseUp={stopDragging}
        onMouseMove={handleMouseMove}
        onClickCapture={handleClickCapture}
        onDragStart={(e) => e.preventDefault()}
        style={{
          display: 'flex',
          gap: '12px',
          padding: '10px 36px 20px',
          overflowX: 'auto',
          scrollBehavior: isPressed ? 'auto' : 'smooth',
          cursor: isPressed ? 'grabbing' : 'grab',
          userSelect: 'none'
        }}
      >
        {movies.map((movie) => (
          <div key={movie.id} style={{ flexShrink: 0, width: '140px' }}>
            <MovieCard movie={movie} onClick={onPlay} />
          </div>
        ))}
      </div>
    </div>
  )
}
