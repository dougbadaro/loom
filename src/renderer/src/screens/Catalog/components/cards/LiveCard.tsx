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
        borderRadius: '22px',
        padding: '18px',
        background: 'rgba(255,255,255,0.03)',
        border: `1px solid ${tokens.border}`,
        backdropFilter: 'blur(12px)',
        transition: 'all 0.2s ease',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '18px',
        minHeight: '96px'
      }}
    >
      {/* Left */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '18px',
          minWidth: 0
        }}
      >
        {/* Logo */}
        <div
          style={{
            width: '72px',
            height: '72px',
            borderRadius: '18px',
            background: '#fff',
            overflow: 'hidden',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {channel.capa ? (
            <img
              src={channel.capa}
              alt={channel.nome}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                padding: '10px'
              }}
            />
          ) : (
            <span
              style={{
                fontSize: '24px',
                fontWeight: 700,
                color: '#000'
              }}
            >
              {channel.nome.charAt(0)}
            </span>
          )}
        </div>

        {/* Info */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            minWidth: 0
          }}
        >
          <span
            style={{
              fontSize: '18px',
              fontWeight: 600,
              color: tokens.textPrimary,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}
          >
            {channel.nome}
          </span>

          <span
            style={{
              marginTop: '4px',
              fontSize: '13px',
              color: tokens.textSecondary
            }}
          >
            Canal ao vivo
          </span>
        </div>
      </div>

      {/* Right */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          flexShrink: 0
        }}
      >
        <div
          style={{
            width: '8px',
            height: '8px',
            borderRadius: '999px',
            background: '#ff453a'
          }}
        />

        <span
          style={{
            fontSize: '13px',
            fontWeight: 600,
            color: '#ff453a'
          }}
        >
          AO VIVO
        </span>
      </div>
    </div>
  )
}
