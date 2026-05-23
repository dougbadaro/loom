import { Categoria } from '../../../types'
import { tokens } from '@renderer/styles/tokens'

interface CatalogSidebarProps {
  categorias: Categoria[]
  categoriaAtiva: string | null
  onSelectCategory: (categoryId: string) => void
}

export function CatalogSidebar({
  categorias,
  categoriaAtiva,
  onSelectCategory
}: CatalogSidebarProps) {
  return (
    <aside
      style={{
        width: '260px',
        flexShrink: 0,
        overflowY: 'auto',
        padding: '20px 16px',
        borderRight: `1px solid ${tokens.border}`,
        backgroundColor: tokens.bg
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '4px'
        }}
      >
        {categorias.map((cat) => {
          const isActive = categoriaAtiva === String(cat.category_id)

          return (
            <button
              key={cat.category_id}
              onClick={() => onSelectCategory(String(cat.category_id))}
              style={{
                padding: '11px 16px',
                textAlign: 'left',
                backgroundColor: isActive ? 'rgba(255,255,255,0.06)' : 'transparent',
                color: isActive ? tokens.textPrimary : tokens.textSecondary,
                border: `1px solid ${isActive ? tokens.border : 'transparent'}`,
                borderRadius: tokens.radius.md,
                fontSize: '14px',
                fontWeight: isActive ? 600 : 500,
                cursor: 'pointer',
                fontFamily: tokens.font,
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.03)'
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = 'transparent'
                }
              }}
            >
              {cat.category_name}
            </button>
          )
        })}
      </div>
    </aside>
  )
}
