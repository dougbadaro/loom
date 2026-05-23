import { tokens } from '@renderer/styles/tokens'
import { Categoria } from '@renderer/types'

interface SeriesSidebarProps {
  categorias: Categoria[]
  categoriaAtiva: string | null
  onSelectCategory: (categoryId: string) => void
}

export function SeriesSidebar({
  categorias,
  categoriaAtiva,
  onSelectCategory
}: SeriesSidebarProps) {
  return (
    <aside
      style={{
        width: '320px',
        flexShrink: 0,

        padding: '30px 22px',

        overflowY: 'auto',

        background: 'rgba(255,255,255,0.025)',

        backdropFilter: 'blur(32px)',

        borderRight: '1px solid rgba(255,255,255,0.05)'
      }}
    >
      {/* Header */}
      <div
        style={{
          marginBottom: '30px',
          paddingLeft: '10px'
        }}
      >
        <span
          style={{
            fontSize: '12px',
            fontWeight: 700,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: tokens.textTertiary
          }}
        >
          Séries
        </span>
      </div>

      {/* Categories */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
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

                borderRadius: '24px',

                padding: '18px 20px',

                textAlign: 'left',

                cursor: 'pointer',

                overflow: 'hidden',

                background: isActive ? 'rgba(255,255,255,0.09)' : 'rgba(255,255,255,0.015)',

                color: isActive ? tokens.textPrimary : tokens.textSecondary,

                fontSize: '15px',

                fontWeight: isActive ? 600 : 500,

                transition: 'all 0.25s ease',

                backdropFilter: 'blur(18px)',

                boxShadow: isActive
                  ? `
                    inset 0 1px 0 rgba(255,255,255,0.06),
                    0 0 0 1px rgba(255,255,255,0.05),
                    0 10px 30px rgba(0,0,0,0.25)
                  `
                  : 'none'
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.015)'
                }
              }}
            >
              {/* Active Glow */}
              {isActive && (
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,

                    background: `
                      linear-gradient(
                        135deg,
                        rgba(255,255,255,0.05),
                        transparent 60%
                      )
                    `,

                    pointerEvents: 'none'
                  }}
                />
              )}

              <div
                style={{
                  position: 'relative',

                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',

                  gap: '12px'
                }}
              >
                {/* Name */}
                <span
                  style={{
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                >
                  {cat.category_name}
                </span>

                {/* Active Indicator */}
                {isActive && (
                  <div
                    style={{
                      width: '8px',
                      height: '8px',

                      borderRadius: '999px',

                      background: tokens.textPrimary,

                      boxShadow: `
                        0 0 12px rgba(255,255,255,0.5)
                      `,

                      flexShrink: 0
                    }}
                  />
                )}
              </div>
            </button>
          )
        })}
      </div>
    </aside>
  )
}
