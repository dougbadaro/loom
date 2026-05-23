import { tokens } from '@renderer/styles/tokens'
import { Categoria } from '@renderer/types'

interface MoviesSidebarProps {
  categorias: Categoria[]
  categoriaAtiva: string | null
  onSelectCategory: (categoryId: string) => void
}

export function MoviesSidebar({
  categorias,
  categoriaAtiva,
  onSelectCategory
}: MoviesSidebarProps) {
  return (
    <aside
      style={{
        width: '300px',
        flexShrink: 0,

        padding: '28px 20px',

        overflowY: 'auto',

        background: 'rgba(255,255,255,0.02)',

        backdropFilter: 'blur(30px)',

        borderRight: '1px solid rgba(255,255,255,0.04)'
      }}
    >
      {/* Header */}
      <div
        style={{
          marginBottom: '28px',
          paddingLeft: '8px'
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
          Filmes
        </span>
      </div>

      {/* Categories */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '10px'
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

                borderRadius: '22px',

                padding: '18px 18px',

                textAlign: 'left',

                cursor: 'pointer',

                overflow: 'hidden',

                background: isActive ? 'rgba(255,255,255,0.08)' : 'transparent',

                color: isActive ? tokens.textPrimary : tokens.textSecondary,

                fontSize: '15px',

                fontWeight: isActive ? 600 : 500,

                transition: 'all 0.22s ease',

                backdropFilter: 'blur(16px)',

                boxShadow: isActive
                  ? `
                    inset 0 1px 0 rgba(255,255,255,0.05),
                    0 0 0 1px rgba(255,255,255,0.04)
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
                  e.currentTarget.style.background = 'transparent'
                }
              }}
            >
              {/* Glow */}
              {isActive && (
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,

                    background: 'linear-gradient(90deg, rgba(255,255,255,0.03), transparent)',

                    pointerEvents: 'none'
                  }}
                />
              )}

              <div
                style={{
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <span
                  style={{
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                >
                  {cat.category_name}
                </span>

                {isActive && (
                  <div
                    style={{
                      width: '7px',
                      height: '7px',

                      borderRadius: '999px',

                      background: tokens.textPrimary,

                      opacity: 0.9,

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
