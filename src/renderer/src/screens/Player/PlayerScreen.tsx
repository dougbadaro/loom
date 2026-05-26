import { useEffect, useRef, useState, useCallback } from 'react'
import Hls from 'hls.js'
import { tokens } from '@renderer/styles/tokens'
import { EpisodeContext } from '../Series/EpisodeContext'

interface PlayerScreenProps {
  url: string
  title?: string
  startTime?: number
  onBack: () => void
  onProgressUpdate?: (currentTime: number, duration: number) => void
  /** Contexto de série — habilita botão de próximo episódio */
  episodeContext?: EpisodeContext
  /** Chamado ao avançar para o próximo episódio */
  onNextEpisode?: (url: string, context: EpisodeContext) => void
}

const isLive = (url: string) => url.includes('.m3u8') || url.includes('/live/')

const HLS_VOD_CONFIG: Partial<Hls['config']> = {
  enableWorker: true,
  lowLatencyMode: false,
  backBufferLength: 90
}

const HLS_LIVE_CONFIG: Partial<Hls['config']> = {
  enableWorker: true,
  lowLatencyMode: true,
  liveBackBufferLength: 10,
  liveSyncDurationCount: 3,
  liveMaxLatencyDurationCount: 6,
  fragLoadingMaxRetry: 6,
  fragLoadingRetryDelay: 500,
  manifestLoadingMaxRetry: 4,
  manifestLoadingRetryDelay: 500,
  levelLoadingMaxRetry: 4,
  fragLoadingTimeOut: 8000
}

function formatTime(s: number): string {
  if (!isFinite(s)) return '0:00'
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${sec.toString().padStart(2, '0')}`
}

export function PlayerScreen({
  url,
  title,
  startTime = 0,
  onBack,
  onProgressUpdate,
  episodeContext,
  onNextEpisode
}: PlayerScreenProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const hlsRef = useRef<Hls | null>(null)
  const lastSavedTime = useRef(0)

  const live = isLive(url)

  const [playing, setPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [muted, setMuted] = useState(false)
  const [buffering, setBuffering] = useState(true)
  const [controlsVisible, setControlsVisible] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [hlsError, setHlsError] = useState<string | null>(null)
  const [quality, setQuality] = useState<string>('AUTO')
  /** Mostra overlay "Próximo episódio" nos últimos 30s */
  const [showNextOverlay, setShowNextOverlay] = useState(false)

  // Episódio seguinte — calculado a partir do contexto
  const nextEpisode = episodeContext
    ? (episodeContext.episodeList[episodeContext.currentIndex + 1] ?? null)
    : null

  const handleNextEpisode = useCallback(() => {
    if (!nextEpisode || !episodeContext || !onNextEpisode) return
    const nextUrl = `${episodeContext.baseUrl}${nextEpisode.id}.${nextEpisode.container_extension}`
    const nextContext: EpisodeContext = {
      ...episodeContext,
      episodeId: nextEpisode.id,
      episodeNum: nextEpisode.episode_num,
      episodeTitle: nextEpisode.title || 'Sem Título',
      container_extension: nextEpisode.container_extension,
      currentIndex: episodeContext.currentIndex + 1
    }
    onNextEpisode(nextUrl, nextContext)
  }, [nextEpisode, episodeContext, onNextEpisode])

  // ── HLS setup ───────────────────────────────────────────────────────────────

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    setBuffering(true)
    setHlsError(null)
    setShowNextOverlay(false)
    lastSavedTime.current = 0

    if (hlsRef.current) {
      hlsRef.current.destroy()
      hlsRef.current = null
    }

    const isHls = url.includes('.m3u8') || url.includes('/live/') || url.includes('/play/live.php')

    if (isHls && Hls.isSupported()) {
      const config = live ? HLS_LIVE_CONFIG : HLS_VOD_CONFIG
      const hls = new Hls(config)
      hlsRef.current = hls

      hls.loadSource(url)
      hls.attachMedia(video)

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        if (startTime > 0) video.currentTime = startTime
        video.play().catch(() => {})
      })

      hls.on(Hls.Events.LEVEL_SWITCHED, (_, data) => {
        const level = hls.levels[data.level]
        setQuality(level?.height ? `${level.height}p` : 'AUTO')
      })

      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              hls.startLoad()
              break
            case Hls.ErrorTypes.MEDIA_ERROR:
              hls.recoverMediaError()
              break
            default:
              setHlsError('Erro ao carregar stream.')
              break
          }
        }
      })

      return () => {
        hls.destroy()
        hlsRef.current = null
      }
    }

    video.src = url

    const onLoadedMetadata = () => {
      if (startTime > 0) video.currentTime = startTime
      video.play().catch(() => {})
    }
    const onError = () => {
      setHlsError('Erro ao reproduzir vídeo.')
    }
    const onCanPlay = () => {
      setBuffering(false)
    }
    const onWaiting = () => {
      setBuffering(true)
    }
    const onPlaying = () => {
      setBuffering(false)
    }

    video.addEventListener('loadedmetadata', onLoadedMetadata)
    video.addEventListener('error', onError)
    video.addEventListener('canplay', onCanPlay)
    video.addEventListener('waiting', onWaiting)
    video.addEventListener('playing', onPlaying)

    return () => {
      video.pause()
      video.removeEventListener('loadedmetadata', onLoadedMetadata)
      video.removeEventListener('error', onError)
      video.removeEventListener('canplay', onCanPlay)
      video.removeEventListener('waiting', onWaiting)
      video.removeEventListener('playing', onPlaying)
      video.removeAttribute('src')
      video.load()
    }
  }, [url, live, startTime])

  // ── Video event listeners ────────────────────────────────────────────────────

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const onPlay = () => setPlaying(true)

    const onPause = () => {
      setPlaying(false)
      if (onProgressUpdate && video.duration > 0) {
        onProgressUpdate(video.currentTime, video.duration)
        lastSavedTime.current = video.currentTime
      }
    }

    const onTimeUpdate = () => {
      setCurrentTime(video.currentTime)

      // Salva a cada 10s
      if (
        onProgressUpdate &&
        video.duration > 0 &&
        Math.abs(video.currentTime - lastSavedTime.current) >= 10
      ) {
        onProgressUpdate(video.currentTime, video.duration)
        lastSavedTime.current = video.currentTime
      }

      // Mostra overlay "próximo episódio" nos últimos 30s
      if (nextEpisode && video.duration > 0 && !live) {
        const remaining = video.duration - video.currentTime
        setShowNextOverlay(remaining <= 30 && remaining > 0)
      }
    }

    const onDurationChange = () => setDuration(video.duration)
    const onWaiting = () => setBuffering(true)
    const onPlaying = () => setBuffering(false)
    const onCanPlay = () => setBuffering(false)
    const onVolumeChange = () => {
      setVolume(video.volume)
      setMuted(video.muted)
    }

    // Avança automaticamente ao terminar
    const onEnded = () => {
      if (nextEpisode && onNextEpisode) handleNextEpisode()
    }

    video.addEventListener('play', onPlay)
    video.addEventListener('pause', onPause)
    video.addEventListener('timeupdate', onTimeUpdate)
    video.addEventListener('durationchange', onDurationChange)
    video.addEventListener('waiting', onWaiting)
    video.addEventListener('playing', onPlaying)
    video.addEventListener('canplay', onCanPlay)
    video.addEventListener('volumechange', onVolumeChange)
    video.addEventListener('ended', onEnded)

    return () => {
      video.removeEventListener('play', onPlay)
      video.removeEventListener('pause', onPause)
      video.removeEventListener('timeupdate', onTimeUpdate)
      video.removeEventListener('durationchange', onDurationChange)
      video.removeEventListener('waiting', onWaiting)
      video.removeEventListener('playing', onPlaying)
      video.removeEventListener('canplay', onCanPlay)
      video.removeEventListener('volumechange', onVolumeChange)
      video.removeEventListener('ended', onEnded)
    }
  }, [onProgressUpdate, nextEpisode, onNextEpisode, handleNextEpisode, live])

  // ── Fullscreen ───────────────────────────────────────────────────────────────

  useEffect(() => {
    const onFsChange = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', onFsChange)
    return () => document.removeEventListener('fullscreenchange', onFsChange)
  }, [])

  // ── Auto-hide controls ────────────────────────────────────────────────────────

  const resetHideTimer = useCallback(() => {
    setControlsVisible(true)
    if (hideTimer.current) clearTimeout(hideTimer.current)
    hideTimer.current = setTimeout(() => {
      setControlsVisible(false)
    }, 3000)
  }, [])

  useEffect(() => {
    return () => {
      if (hideTimer.current) clearTimeout(hideTimer.current)
    }
  }, [])

  // ── Controls ──────────────────────────────────────────────────────────────────

  const togglePlay = (e?: React.MouseEvent) => {
    e?.stopPropagation()
    const video = videoRef.current
    if (!video) return
    if (video.paused) video.play().catch(() => {})
    else video.pause()
    resetHideTimer()
  }

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current
    if (!video) return
    const t = Number(e.target.value)
    video.currentTime = t
    setCurrentTime(t)
  }

  const handleVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current
    if (!video) return
    const v = Number(e.target.value)
    video.volume = v
    video.muted = v === 0
  }

  const toggleMute = () => {
    const video = videoRef.current
    if (!video) return
    video.muted = !video.muted
  }

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) containerRef.current?.requestFullscreen()
    else document.exitFullscreen()
  }

  const skipSeconds = (s: number) => {
    const video = videoRef.current
    if (!video) return
    video.currentTime = Math.min(Math.max(0, video.currentTime + s), duration)
  }

  // ── Keyboard ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const video = videoRef.current
      switch (e.code) {
        case 'Space':
          e.preventDefault()
          if (video) {
            if (video.paused) video.play().catch(() => {})
            else video.pause()
          }
          break
        case 'ArrowLeft':
          if (video) video.currentTime = Math.max(0, video.currentTime - 10)
          break
        case 'ArrowRight':
          if (video) video.currentTime = Math.min(video.duration || 0, video.currentTime + 10)
          break
        case 'ArrowUp':
          if (video) video.volume = Math.min(1, video.volume + 0.1)
          break
        case 'ArrowDown':
          if (video) video.volume = Math.max(0, video.volume - 0.1)
          break
        case 'KeyF':
          if (!document.fullscreenElement) containerRef.current?.requestFullscreen()
          else document.exitFullscreen()
          break
        case 'KeyM':
          if (video) video.muted = !video.muted
          break
        case 'KeyN':
          if (nextEpisode && onNextEpisode && episodeContext) {
            const nextEp = episodeContext.episodeList[episodeContext.currentIndex + 1]
            if (nextEp) {
              const nextUrl = `${episodeContext.baseUrl}${nextEp.id}.${nextEp.container_extension}`
              const nextCtx: EpisodeContext = {
                ...episodeContext,
                episodeId: nextEp.id,
                episodeNum: nextEp.episode_num,
                episodeTitle: nextEp.title || 'Sem Título',
                container_extension: nextEp.container_extension,
                currentIndex: episodeContext.currentIndex + 1
              }
              onNextEpisode(nextUrl, nextCtx)
            }
          }
          break
        case 'Escape':
          if (!document.fullscreenElement) onBack()
          break
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [nextEpisode, episodeContext, onNextEpisode, onBack])

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  // Título exibido no player
  const displayTitle = episodeContext
    ? `${episodeContext.seriesNome} · T${episodeContext.seasonNum} E${episodeContext.episodeNum}`
    : title

  return (
    <>
      <style>{`
        .player-range { -webkit-appearance:none; appearance:none; height:4px; border-radius:999px; outline:none; cursor:pointer; background:transparent; }
        .player-range::-webkit-slider-thumb { -webkit-appearance:none; width:14px; height:14px; border-radius:50%; background:#fff; cursor:pointer; box-shadow:0 0 4px rgba(0,0,0,0.5); transition:transform 0.15s; }
        .player-range:hover::-webkit-slider-thumb { transform:scale(1.3); }
        .ctrl-btn { background:none; border:none; cursor:pointer; color:rgba(255,255,255,0.9); display:flex; align-items:center; justify-content:center; padding:8px; border-radius:8px; transition:background 0.15s,color 0.15s; }
        .ctrl-btn:hover { background:rgba(255,255,255,0.1); color:#fff; }
        @keyframes spin { to { transform:rotate(360deg); } }
        .buffering-spinner { width:48px; height:48px; border:3px solid rgba(255,255,255,0.15); border-top-color:#fff; border-radius:50%; animation:spin 0.8s linear infinite; }
        @keyframes livePulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(0.8)} }
        .live-dot { animation:livePulse 2s ease-in-out infinite; }
        @keyframes slideUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        .next-overlay { animation: slideUp 0.3s ease forwards; }
      `}</style>

      <div
        ref={containerRef}
        onMouseMove={resetHideTimer}
        onClick={(e) => {
          e.stopPropagation()
          togglePlay(e)
        }}
        style={{
          position: 'relative',
          backgroundColor: '#000',
          height: '100vh',
          width: '100vw',
          overflow: 'hidden',
          cursor: controlsVisible ? 'default' : 'none',
          fontFamily: tokens.font
        }}
      >
        <video
          ref={videoRef}
          autoPlay
          playsInline
          style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
        />

        {/* Buffering */}
        {buffering && !hlsError && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '16px',
              background: 'rgba(0,0,0,0.4)',
              pointerEvents: 'none'
            }}
          >
            <div className="buffering-spinner" />
            {live && (
              <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px' }}>
                Conectando ao canal...
              </span>
            )}
          </div>
        )}

        {/* Error */}
        {hlsError && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '16px'
            }}
          >
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="rgba(255,255,255,0.4)"
              strokeWidth="1.5"
              strokeLinecap="round"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '15px', margin: 0 }}>
              {hlsError}
            </p>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onBack()
              }}
              style={{
                padding: '10px 24px',
                borderRadius: '10px',
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.15)',
                color: '#fff',
                cursor: 'pointer',
                fontSize: '14px',
                fontFamily: tokens.font
              }}
            >
              Voltar
            </button>
          </div>
        )}

        {/* Overlay próximo episódio */}
        {showNextOverlay && nextEpisode && !hlsError && (
          <div
            className="next-overlay"
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'absolute',
              bottom: '100px',
              right: '36px',
              background: 'rgba(10,10,10,0.92)',
              border: `1px solid ${tokens.border}`,
              borderRadius: '16px',
              padding: '16px 20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              minWidth: '260px',
              backdropFilter: 'blur(12px)',
              zIndex: 10
            }}
          >
            <span
              style={{
                fontSize: '11px',
                fontWeight: 600,
                letterSpacing: '0.08em',
                color: tokens.textTertiary,
                textTransform: 'uppercase'
              }}
            >
              A seguir
            </span>
            <span
              style={{
                fontSize: '14px',
                fontWeight: 600,
                color: tokens.textPrimary,
                lineHeight: 1.3
              }}
            >
              E{nextEpisode.episode_num} — {nextEpisode.title || 'Sem Título'}
            </span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={handleNextEpisode}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: '10px',
                  background: tokens.accent,
                  border: 'none',
                  color: '#fff',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: tokens.font,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  transition: 'opacity 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.opacity = '0.85'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = '1'
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
                Próximo
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setShowNextOverlay(false)
                }}
                style={{
                  padding: '10px 14px',
                  borderRadius: '10px',
                  background: 'rgba(255,255,255,0.08)',
                  border: `1px solid ${tokens.border}`,
                  color: tokens.textSecondary,
                  fontSize: '13px',
                  cursor: 'pointer',
                  fontFamily: tokens.font,
                  transition: 'color 0.15s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = tokens.textPrimary
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = tokens.textSecondary
                }}
              >
                Fechar
              </button>
            </div>
          </div>
        )}

        {/* Controls overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            background: controlsVisible
              ? 'linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, transparent 25%, transparent 65%, rgba(0,0,0,0.85) 100%)'
              : 'transparent',
            opacity: controlsVisible ? 1 : 0,
            transition: 'opacity 0.3s ease',
            pointerEvents: controlsVisible ? 'auto' : 'none'
          }}
        >
          {/* Top */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '20px 28px' }}>
            <button
              className="ctrl-btn"
              onClick={(e) => {
                e.stopPropagation()
                onBack()
              }}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            {displayTitle && (
              <span
                style={{
                  color: '#fff',
                  fontSize: '15px',
                  fontWeight: 600,
                  letterSpacing: '-0.01em'
                }}
              >
                {displayTitle}
              </span>
            )}
            {live && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  marginLeft: '4px',
                  padding: '4px 10px',
                  borderRadius: '999px',
                  background: 'rgba(255,69,58,0.15)',
                  border: '1px solid rgba(255,69,58,0.3)'
                }}
              >
                <div
                  className="live-dot"
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: '#ff453a'
                  }}
                />
                <span
                  style={{
                    color: '#ff453a',
                    fontSize: '11px',
                    fontWeight: 700,
                    letterSpacing: '0.08em'
                  }}
                >
                  AO VIVO
                </span>
              </div>
            )}
            {quality && !live && (
              <span
                style={{
                  marginLeft: 'auto',
                  fontSize: '11px',
                  fontWeight: 600,
                  color: 'rgba(255,255,255,0.5)',
                  letterSpacing: '0.06em'
                }}
              >
                {quality}
              </span>
            )}
          </div>

          {/* Bottom */}
          <div
            style={{
              padding: '12px 28px 24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}
          >
            {!live && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span
                  style={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px', minWidth: '36px' }}
                >
                  {formatTime(currentTime)}
                </span>
                <div style={{ flex: 1, position: 'relative', height: '4px' }}>
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      borderRadius: '999px',
                      background: 'rgba(255,255,255,0.2)'
                    }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      left: 0,
                      top: 0,
                      bottom: 0,
                      width: `${progress}%`,
                      borderRadius: '999px',
                      background: tokens.accent,
                      transition: 'width 0.1s linear'
                    }}
                  />
                  <input
                    type="range"
                    min={0}
                    max={duration || 0}
                    step={0.5}
                    value={currentTime}
                    onChange={handleSeek}
                    onClick={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                    className="player-range"
                    style={{
                      position: 'absolute',
                      inset: 0,
                      width: '100%',
                      background: `linear-gradient(to right, ${tokens.accent} ${progress}%, transparent ${progress}%)`
                    }}
                  />
                </div>
                <span
                  style={{
                    color: 'rgba(255,255,255,0.7)',
                    fontSize: '12px',
                    minWidth: '36px',
                    textAlign: 'right'
                  }}
                >
                  {formatTime(duration)}
                </span>
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <button
                className="ctrl-btn"
                onClick={(e) => {
                  e.stopPropagation()
                  togglePlay(e)
                }}
              >
                {playing ? (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                    <rect x="6" y="4" width="4" height="16" rx="1" />
                    <rect x="14" y="4" width="4" height="16" rx="1" />
                  </svg>
                ) : (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                    <polygon points="5 3 19 12 5 21 5 3" />
                  </svg>
                )}
              </button>

              {!live && (
                <>
                  <button
                    className="ctrl-btn"
                    onClick={(e) => {
                      e.stopPropagation()
                      skipSeconds(-10)
                    }}
                  >
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="1 4 1 10 7 10" />
                      <path d="M3.51 15a9 9 0 1 0 .49-3.31" />
                      <text
                        x="9"
                        y="16"
                        fontSize="7"
                        fill="currentColor"
                        stroke="none"
                        fontWeight="700"
                      >
                        10
                      </text>
                    </svg>
                  </button>
                  <button
                    className="ctrl-btn"
                    onClick={(e) => {
                      e.stopPropagation()
                      skipSeconds(10)
                    }}
                  >
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="23 4 23 10 17 10" />
                      <path d="M20.49 15a9 9 0 1 1-.49-3.31" />
                      <text
                        x="8"
                        y="16"
                        fontSize="7"
                        fill="currentColor"
                        stroke="none"
                        fontWeight="700"
                      >
                        10
                      </text>
                    </svg>
                  </button>
                </>
              )}

              {/* Botão próximo episódio nos controles */}
              {nextEpisode && !live && (
                <button
                  className="ctrl-btn"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleNextEpisode()
                  }}
                  title="Próximo episódio (N)"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <polygon points="5 3 15 12 5 21 5 3" />
                    <rect x="17" y="3" width="2" height="18" rx="1" />
                  </svg>
                </button>
              )}

              <button
                className="ctrl-btn"
                onClick={(e) => {
                  e.stopPropagation()
                  toggleMute()
                }}
              >
                {muted || volume === 0 ? (
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  >
                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                    <line x1="23" y1="9" x2="17" y2="15" />
                    <line x1="17" y1="9" x2="23" y2="15" />
                  </svg>
                ) : volume < 0.5 ? (
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  >
                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                    <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                  </svg>
                ) : (
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  >
                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                    <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                    <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                  </svg>
                )}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={muted ? 0 : volume}
                onChange={handleVolume}
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
                className="player-range"
                style={{
                  width: '80px',
                  background: `linear-gradient(to right, rgba(255,255,255,0.9) ${(muted ? 0 : volume) * 100}%, rgba(255,255,255,0.2) ${(muted ? 0 : volume) * 100}%)`
                }}
              />

              <div style={{ flex: 1 }} />

              <button
                className="ctrl-btn"
                onClick={(e) => {
                  e.stopPropagation()
                  toggleFullscreen()
                }}
              >
                {isFullscreen ? (
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  >
                    <path d="M8 3v3a2 2 0 0 1-2 2H3" />
                    <path d="M21 8h-3a2 2 0 0 1-2-2V3" />
                    <path d="M3 16h3a2 2 0 0 1 2 2v3" />
                    <path d="M16 21v-3a2 2 0 0 1 2-2h3" />
                  </svg>
                ) : (
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  >
                    <path d="M8 3H5a2 2 0 0 0-2 2v3" />
                    <path d="M21 8V5a2 2 0 0 0-2-2h-3" />
                    <path d="M3 16v3a2 2 0 0 0 2 2h3" />
                    <path d="M16 21h3a2 2 0 0 0 2-2v-3" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>

        {!buffering && !hlsError && (
          <div
            onClick={(e) => {
              e.stopPropagation()
              togglePlay(e)
            }}
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              pointerEvents: controlsVisible ? 'none' : 'auto',
              cursor: 'pointer'
            }}
          />
        )}
      </div>
    </>
  )
}
