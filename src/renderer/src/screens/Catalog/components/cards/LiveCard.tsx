import { tokens } from '@renderer/styles/tokens'
import type { Midia } from '@renderer/types'

interface LiveCardProps {
  channel: Midia
  onClick: (channel: Midia) => void
}

export function LiveCard({ channel, onClick }: LiveCardProps) {
  // Limpa prefixos tipo "Câmeras Ao Vivo | Elefantes" → "Elefantes"
  const displayName = channel.nome.includes(' | ')
    ? channel.nome.split(' | ').slice(1).join(' | ').trim()
    : channel.nome

  const prefix = channel.nome.includes(' | ') ? channel.nome.split(' | ')[0].trim() : null

  return (
    <>
      <style>{`
        @keyframes livePulse {
          0%,100% { opacity:1; transform:scale(1); }
          50%      { opacity:0.45; transform:scale(0.82); }
        }
        .live-card {
          cursor: pointer;
          border-radius: 20px;
          padding: 16px 20px;
          background: ${tokens.surface};
          border: 1px solid ${tokens.border};
          transition: all 0.25s cubic-bezier(0.25, 1, 0.5, 1);
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          min-height: 88px;
          position: relative;
          overflow: hidden;
        }
        .live-card::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(120deg, transparent 50%, rgba(138,43,226,0.06) 100%);
          opacity: 0;
          transition: opacity 0.3s ease;
          pointer-events: none;
        }
        .live-card:hover {
          background: rgba(255,255,255,0.04);
          border-color: rgba(138,43,226,0.3);
          transform: translateY(-1px);
          box-shadow: 0 8px 24px rgba(0,0,0,0.4), 0 0 0 1px rgba(138,43,226,0.15);
        }
        .live-card:hover::after { opacity: 1; }
        .live-card:active { transform: translateY(0) scale(0.995); }

        .live-card-dot {
          animation: livePulse 2s ease-in-out infinite;
        }
      `}</style>

      <div className="live-card" onClick={() => onClick(channel)}>
        {/* Logo */}
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '14px',
            background: 'rgba(255,255,255,0.06)',
            border: `1px solid ${tokens.border}`,
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
              style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '8px' }}
              onError={(e) => {
                e.currentTarget.style.display = 'none'
              }}
            />
          ) : (
            <span style={{ fontSize: '22px', fontWeight: 700, color: tokens.textTertiary }}>
              {displayName.charAt(0).toUpperCase()}
            </span>
          )}
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {prefix && (
            <span
              style={{
                fontSize: '11px',
                fontWeight: 500,
                color: tokens.textTertiary,
                letterSpacing: '0.02em',
                lineHeight: 1
              }}
            >
              {prefix}
            </span>
          )}
          <span
            style={{
              fontSize: '15px',
              fontWeight: 600,
              color: tokens.textPrimary,
              letterSpacing: '-0.01em',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              lineHeight: 1.3
            }}
          >
            {displayName}
          </span>
        </div>

        {/* Badge AO VIVO */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '7px',
            flexShrink: 0,
            padding: '5px 10px',
            borderRadius: '999px',
            background: 'rgba(255,69,58,0.08)',
            border: '1px solid rgba(255,69,58,0.18)'
          }}
        >
          <div
            className="live-card-dot"
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: '#ff453a',
              boxShadow: '0 0 5px rgba(255,69,58,0.7)',
              flexShrink: 0
            }}
          />
          <span
            style={{
              fontSize: '10px',
              fontWeight: 700,
              letterSpacing: '0.08em',
              color: '#ff453a',
              fontFamily: tokens.font
            }}
          >
            AO VIVO
          </span>
        </div>
      </div>
    </>
  )
}
