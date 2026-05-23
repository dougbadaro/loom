import { useEffect, useRef } from 'react'
import Hls from 'hls.js'

interface PlayerScreenProps {
  url: string
  onBack: () => void
}

export function PlayerScreen({ url, onBack }: PlayerScreenProps) {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (!videoRef.current) return
    if (url.includes('.m3u8') && Hls.isSupported()) {
      const hls = new Hls()
      hls.loadSource(url)
      hls.attachMedia(videoRef.current)
      return () => hls.destroy()
    } else {
      videoRef.current.src = url
    }
  }, [url])

  return (
    <div
      style={{
        backgroundColor: '#000',
        height: '100vh',
        width: '100vw',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <div style={{ padding: '20px 36px', flexShrink: 0 }}>
        <button className="btn-back" onClick={onBack}>
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Voltar
        </button>
      </div>
      <video
        ref={videoRef}
        controls
        autoPlay
        style={{ width: '100%', flex: 1, outline: 'none', backgroundColor: '#000', minHeight: 0 }}
      />
    </div>
  )
}
