import { ReactNode } from 'react'

interface CatalogGridProps {
  children: ReactNode
}

export function CatalogGrid({ children }: CatalogGridProps) {
  return (
    <div
      className="fade-in"
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
        gap: '20px',
        alignItems: 'start'
      }}
    >
      {children}
    </div>
  )
}
