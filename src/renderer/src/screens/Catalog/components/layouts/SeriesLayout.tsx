import { Midia } from '@renderer/types'
import { SeriesCard } from '../cards/SeriesCard'

interface SeriesLayoutProps {
  series: Midia[]
  onItemClick: (series: Midia) => void
}

export function SeriesLayout({ series, onItemClick }: SeriesLayoutProps) {
  return (
    <div
      className="fade-in"
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
        gap: '24px',
        alignItems: 'start'
      }}
    >
      {series.map((item) => (
        <SeriesCard key={item.id} series={item} onClick={onItemClick} />
      ))}
    </div>
  )
}
