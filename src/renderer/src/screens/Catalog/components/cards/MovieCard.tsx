import { tokens } from '@renderer/styles/tokens'
import type { Midia } from '@renderer/types'

interface MovieCardProps {
  movie: Midia
  onClick: (movie: Midia) => void
  rank?: number
}

export function MovieCard({ movie, onClick, rank }: MovieCardProps) {
  const displayName = movie.nome.includes(' | ')
    ? movie.nome.split(' | ').slice(1).join(' | ').trim()
    : movie.nome

  return (
    <>
      <style>{`
        .mv-card-wrap {
          cursor: pointer;
          display: flex;
          flex-direction: column;
          gap: 8px;
          position: relative;
          width: 100%;
        }
        .mv-card-poster {
          width: 100%;
          aspect-ratio: 2/3;
          border-radius: 6px;
          overflow: hidden;
          background: ${tokens.surface};
          position: relative;
          transition: transform 0.3s cubic-bezier(0.25, 1, 0.5, 1),
                      box-shadow 0.3s ease;
          z-index: 1;
        }
        .mv-card-wrap:hover .mv-card-poster {
          transform: scale(1.06);
          z-index: 10;
          box-shadow: 0 12px 28px rgba(0,0,0,0.8);
        }
        .mv-rank {
          position: absolute;
          bottom: -12px;
          left: -16px;
          font-family: ${tokens.font};
          font-size: 110px;
          font-weight: 900;
          line-height: 1;
          letter-spacing: -0.06em;
          color: transparent;
          -webkit-text-stroke: 3px rgba(255,255,255,0.2);
          pointer-events: none;
          user-select: none;
          z-index: 2;
          transition: -webkit-text-stroke-color 0.2s ease;
        }
        .mv-card-wrap:hover .mv-rank {
          -webkit-text-stroke-color: rgba(255,255,255,0.5);
        }
        .rank-poster-container {
          position: relative;
          width: 100%;
          display: flex;
          justify-content: flex-end;
        }
        .mv-title {
          font-family: ${tokens.font};
          font-size: 12px;
          font-weight: 500;
          color: ${tokens.textSecondary};
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          padding: 0 2px;
          transition: color 0.2s;
          line-height: 1.3;
        }
        .mv-card-wrap:hover .mv-title {
          color: ${tokens.textPrimary};
        }
      `}</style>

      <div className="mv-card-wrap" onClick={() => onClick(movie)}>
        <div className="rank-poster-container">
          {rank !== undefined && <div className="mv-rank">{rank}</div>}

          <div className="mv-card-poster" style={{ width: rank !== undefined ? '75%' : '100%' }}>
            {movie.capa ? (
              <img
                src={movie.capa}
                alt={displayName}
                referrerPolicy="no-referrer"
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
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
                {displayName.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
        </div>

        <p className="mv-title">{displayName}</p>
      </div>
    </>
  )
}
