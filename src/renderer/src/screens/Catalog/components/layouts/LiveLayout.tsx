import { Midia } from '@renderer/types'
import { LiveCard } from '../cards/LiveCard'

interface LiveLayoutProps {
  channels: Midia[]
  onItemClick: (channel: Midia) => void
}

export function LiveLayout({ channels, onItemClick }: LiveLayoutProps) {
  return (
    <div
      className="fade-in"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
        width: '100%'
      }}
    >
      {channels.map((channel) => (
        <LiveCard key={channel.id} channel={channel} onClick={onItemClick} />
      ))}
    </div>
  )
}
