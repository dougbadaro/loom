import { tokens } from '@renderer/styles/tokens'
import { Categoria } from '@renderer/types'

interface LiveSidebarProps {
  categorias: Categoria[]
  categoriaAtiva: string | null
  onSelectCategory: (categoryId: string) => void
}

export function LiveSidebar({ categorias, categoriaAtiva, onSelectCategory }: LiveSidebarProps) {
  return (
    <aside
      style={{
        width: '280px',
        flexShrink: 0,

        padding: '22px 16px',

        overflowY: 'auto',

        background: 'rgba(255,255,255,0.015)',

        backdropFilter: 'blur(26px)',

        borderRight: '1px solid rgba(255,255,255,0.04)'
      }}
    >
      {/* Header */}
      <div
        style={{
          marginBottom: '22px',
          paddingLeft: '10px',

          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}
      >
        {/* Live Dot */}
        <div
          style={{
            width: '8px',
            height: '8px',

            borderRadius: '999px',

            background: '#ff453a',

            boxShadow: `
              0 0 10px rgba(255,69,58,0.7)
            `
          }}
        />

        <span
          style={{
            fontSize: '12px',
            fontWeight: 700,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: tokens.textTertiary
          }}
        >
          TV Ao Vivo
        </span>
      </div>

      {/* Categories */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '6px'
        }}
      >
        {categorias.map((cat) => {
          const isActive = categoriaAtiva === String(cat.category_id)

          return (
            <button
              key={cat.category_id}
              onClick={() => onSelectCategory(String(cat.category_id))}
              style={{
                position: 'relative',

                border: 'none',

                borderRadius: '16px',

                padding: '14px 16px',

                textAlign: 'left',

                cursor: 'pointer',

                overflow: 'hidden',

                background: isActive ? 'rgba(255,255,255,0.08)' : 'transparent',

                color: isActive ? tokens.textPrimary : tokens.textSecondary,

                fontSize: '14px',

                fontWeight: isActive ? 600 : 500,

                transition: 'all 0.18s ease',

                backdropFilter: 'blur(10px)',

                boxShadow: isActive
                  ? `
                    inset 0 1px 0 rgba(255,255,255,0.04),
                    0 0 0 1px rgba(255,255,255,0.03)
                  `
                  : 'none'
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.035)'
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = 'transparent'
                }
              }}
            >
              {/* Active Indicator */}
              {isActive && (
                <div
                  style={{
                    position: 'absolute',

                    left: '0',
                    top: '50%',

                    transform: 'translateY(-50%)',

                    width: '3px',
                    height: '22px',

                    borderRadius: '999px',

                    background: '#ff453a',

                    boxShadow: `
                      0 0 12px rgba(255,69,58,0.7)
                    `
                  }}
                />
              )}

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',

                  gap: '12px'
                }}
              >
                {/* Category Name */}
                <span
                  style={{
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                >
                  {cat.category_name}
                </span>

                {/* Live Badge */}
                {isActive && (
                  <span
                    style={{
                      fontSize: '10px',
                      fontWeight: 700,

                      letterSpacing: '0.08em',

                      color: '#ff453a',

                      flexShrink: 0
                    }}
                  >
                    LIVE
                  </span>
                )}
              </div>
            </button>
          )
        })}
      </div>
    </aside>
  )
}
