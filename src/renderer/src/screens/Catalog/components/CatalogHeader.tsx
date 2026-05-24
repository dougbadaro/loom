import { TipoCatalogo } from '../../../types'
import { LogoLoomFluid } from '@renderer/components/icons/LogoLoomFluid'
import { tokens } from '@renderer/styles/tokens'

interface CatalogHeaderProps {
  tipoCatalogo: TipoCatalogo
  onChangeTab: (tab: TipoCatalogo) => void
  onBack: () => void
  onLogout: () => void
}

const TAB_LABELS: Record<TipoCatalogo, string> = {
  live: 'TV',
  vod: 'Filmes',
  series: 'Séries'
}

export function CatalogHeader({ tipoCatalogo, onChangeTab, onBack, onLogout }: CatalogHeaderProps) {
  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '14px 36px',
        flexShrink: 0,
        borderBottom: `1px solid ${tokens.border}`,
        backdropFilter: 'blur(12px)',
        backgroundColor: 'rgba(0,0,0,0.85)'
      }}
    >
      {/* Logo */}
      <button
        onClick={onBack}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: 0,
          display: 'flex',
          alignItems: 'center'
        }}
      >
        <LogoLoomFluid size={36} />
      </button>

      {/* Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '4px',
          backgroundColor: tokens.surface,
          padding: '4px',
          borderRadius: tokens.radius.lg,
          border: `1px solid ${tokens.border}`
        }}
      >
        {(['live', 'vod', 'series'] as TipoCatalogo[]).map((tipo) => (
          <button
            key={tipo}
            onClick={() => onChangeTab(tipo)}
            style={{
              padding: '9px 26px',
              background: tipoCatalogo === tipo ? 'rgba(138,43,226,0.2)' : 'transparent',
              color: tipoCatalogo === tipo ? tokens.textPrimary : tokens.textSecondary,
              border: 'none',
              borderRadius: tokens.radius.md,
              fontSize: '14px',
              fontWeight: tipoCatalogo === tipo ? 600 : 500,
              cursor: 'pointer',
              fontFamily: tokens.font,
              transition: 'all 0.2s ease'
            }}
          >
            {TAB_LABELS[tipo]}
          </button>
        ))}
      </div>

      {/* Logout */}
      <button
        onClick={onLogout}
        style={{
          background: 'none',
          border: 'none',
          color: tokens.textSecondary,
          cursor: 'pointer',
          fontSize: '13px',
          fontWeight: 500,
          fontFamily: tokens.font,
          transition: 'color 0.2s'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = tokens.textPrimary
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = tokens.textSecondary
        }}
      >
        Sair
      </button>
    </header>
  )
}
