import { useRef, useState } from 'react'
import { tokens } from '@renderer/styles/tokens'
import type { Midia } from '@renderer/types'
import { MovieCard } from '../cards/MovieCard'
import { WatchEntry } from '../../hooks/useWatchProgress'

interface ContinueWatchingRowProps {
  entries: WatchEntry[]
  onPlay: (movie: Midia) => void
  onRemove: (id: number) => void
}

export function ContinueWatchingRow({ entries, onPlay, onRemove }: ContinueWatchingRowProps) {
  const rowRef = useRef<HTMLDivElement>(null)
  const isDraggingRef = useRef(false)
  const startXRef = useRef(0)
  const scrollLeftRef = useRef(0)
  const [isPressed, setIsPressed] = useState(false)
  const [hoveredId, setHoveredId] = useState<number | null>(null)

  if (entries.length === 0) return null

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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '32px' }}>
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
        {entries.map((entry) => {
          const movie: Midia = {
            id: entry.id,
            nome: entry.nome,
            capa: entry.capa,
            tipo: 'vod',
            extensao: entry.extensao
          }
          const progressRatio = entry.duration > 0 ? entry.currentTime / entry.duration : 0

          return (
            <div
              key={entry.id}
              style={{ flexShrink: 0, width: '140px', position: 'relative' }}
              onMouseEnter={() => setHoveredId(entry.id)}
              onMouseLeave={() => setHoveredId(null)}
            >
              <MovieCard movie={movie} onClick={onPlay} progress={progressRatio} />

              {/* Botão remover — aparece no hover */}
              {hoveredId === entry.id && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onRemove(entry.id)
                  }}
                  title="Remover da lista"
                  style={{
                    position: 'absolute',
                    top: '6px',
                    right: '6px',
                    zIndex: 20,
                    width: '22px',
                    height: '22px',
                    borderRadius: '50%',
                    background: 'rgba(0,0,0,0.7)',
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
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
