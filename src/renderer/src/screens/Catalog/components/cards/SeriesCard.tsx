import { tokens } from '@renderer/styles/tokens'
import { Midia } from '@renderer/types'

interface SeriesCardProps {
  series: Midia
  onClick: (series: Midia) => void
}

export function SeriesCard({ series, onClick }: SeriesCardProps) {
  return (
    <div
      onClick={() => onClick(series)}
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
          position: 'relative'
        }}
      >
        {series.capa ? (
          <img
            src={series.capa}
            alt={series.nome}
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
            {series.nome.charAt(0).toUpperCase()}
          </div>
        )}

        {/* Badge Série */}
        <div
          style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            backgroundColor: 'rgba(0,0,0,0.75)',
            color: '#fff',
            fontSize: '11px',
            fontWeight: 700,
            padding: '4px 8px',
            borderRadius: '999px',
            backdropFilter: 'blur(4px)',
            letterSpacing: '0.4px'
          }}
        >
          SÉRIE
        </div>
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
          {series.nome}
        </p>

        <span
          style={{
            fontSize: '12px',
            color: tokens.textSecondary
          }}
        >
          Série de TV
        </span>
      </div>
    </div>
  )
}
