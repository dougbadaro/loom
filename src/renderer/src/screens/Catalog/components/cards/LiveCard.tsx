import { tokens } from '@renderer/styles/tokens'
import { Midia } from '@renderer/types'

interface LiveCardProps {
  channel: Midia
  onClick: (channel: Midia) => void
}

export function LiveCard({ channel, onClick }: LiveCardProps) {
  return (
    <div
      onClick={() => onClick(channel)}
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
          aspectRatio: '16/9',
          backgroundColor: tokens.surface,
          borderRadius: tokens.radius.lg,
          overflow: 'hidden',
          border: `1px solid ${tokens.border}`,
          position: 'relative'
        }}
      >
        {channel.capa ? (
          <img
            src={channel.capa}
            alt={channel.nome}
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
              fontSize: '24px',
              fontWeight: 700
            }}
          >
            {channel.nome.charAt(0).toUpperCase()}
          </div>
        )}

        {/* Badge AO VIVO */}
        <div
          style={{
            position: 'absolute',
            top: '10px',
            left: '10px',
            backgroundColor: '#ff2d55',
            color: '#fff',
            fontSize: '11px',
            fontWeight: 700,
            padding: '4px 8px',
            borderRadius: '999px',
            letterSpacing: '0.5px'
          }}
        >
          AO VIVO
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
            textOverflow: 'ellipsis'
          }}
        >
          {channel.nome}
        </p>

        <span
          style={{
            fontSize: '12px',
            color: tokens.textSecondary
          }}
        >
          Canal de TV
        </span>
      </div>
    </div>
  )
}
