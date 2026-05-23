import { tokens } from '@renderer/styles/tokens'
import { Midia } from '@renderer/types'

interface MovieCardProps {
  movie: Midia
  onClick: (movie: Midia) => void
}

export function MovieCard({ movie, onClick }: MovieCardProps) {
  return (
    <div
      onClick={() => onClick(movie)}
      style={{
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px'
      }}
    >
      <div
        className="media-card"
        style={{
          width: '100%',
          aspectRatio: '2/3',
          backgroundColor: tokens.surface,
          borderRadius: tokens.radius.lg,
          overflow: 'hidden',
          border: `1px solid ${tokens.border}`,
          transition: 'transform 0.2s ease'
        }}
      >
        {movie.capa ? (
          <img
            src={movie.capa}
            alt={movie.nome}
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
              fontSize: '32px',
              fontWeight: 700
            }}
          >
            {movie.nome.charAt(0).toUpperCase()}
          </div>
        )}
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '4px'
        }}
      >
        <p
          style={{
            fontSize: '14px',
            fontWeight: 600,
            color: tokens.textPrimary,
            margin: 0,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            lineHeight: 1.3
          }}
        >
          {movie.nome}
        </p>

        <span
          style={{
            fontSize: '12px',
            color: tokens.textSecondary
          }}
        >
          Filme
        </span>
      </div>
    </div>
  )
}
