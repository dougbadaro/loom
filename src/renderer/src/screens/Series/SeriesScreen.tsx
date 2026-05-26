import { useState } from 'react'
import { SeriesData, Credenciais, Episodio } from '../../types'
import { tokens } from '@renderer/styles/tokens'
import { IconPlay } from '@renderer/components/icons/IconPlay'
import type { SeriesWatchEntry } from '../Catalog/hooks/useWatchProgress'
import { EpisodeContext } from './EpisodeContext'

interface SeriesScreenProps {
  data: SeriesData
  credentials: Credenciais
  onBack: () => void
  onPlayEpisode: (url: string, context: EpisodeContext) => void
  episodeProgress: Record<string, SeriesWatchEntry>
  /** ID da série — necessário para montar o contexto do episódio */
  seriesId: number
}

export function SeriesScreen({
  data,
  credentials,
  onBack,
  onPlayEpisode,
  episodeProgress,
  seriesId
}: SeriesScreenProps) {
  const seasons = data.episodes ? Object.keys(data.episodes) : []
  const [activeSeason, setActiveSeason] = useState(seasons[0] ?? '')

  const baseUrl = `${credentials.serverUrl}/series/${credentials.username}/${credentials.password}/`
  const episodeList = data.episodes[activeSeason] ?? []

  const handlePlay = (ep: Episodio, index: number) => {
    const url = `${baseUrl}${ep.id}.${ep.container_extension}`

    const context: EpisodeContext = {
      seriesId,
      seriesNome: data.info?.name ?? '',
      seriesCapa: data.info?.cover ?? '',
      episodeId: ep.id,
      episodeNum: ep.episode_num,
      episodeTitle: ep.title || 'Sem Título',
      seasonNum: activeSeason,
      container_extension: ep.container_extension,
      episodeList,
      currentIndex: index,
      baseUrl
    }

    onPlayEpisode(url, context)
  }

  return (
    <div
      style={{
        backgroundColor: tokens.bg,
        minHeight: '100vh',
        width: '100vw',
        fontFamily: tokens.font,
        color: tokens.textPrimary
      }}
    >
      <div style={{ padding: '28px 64px 0' }}>
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

      <div style={{ display: 'flex', gap: '56px', padding: '40px 64px 64px' }}>
        {data.info?.cover && (
          <div style={{ flexShrink: 0 }}>
            <img
              src={data.info.cover}
              alt="Capa"
              style={{
                width: '280px',
                height: '420px',
                objectFit: 'cover',
                borderRadius: tokens.radius.xl,
                boxShadow: '0 40px 80px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.05)'
              }}
            />
          </div>
        )}

        <div style={{ flex: 1, minWidth: 0 }}>
          <h1
            style={{
              fontSize: '42px',
              fontWeight: 700,
              letterSpacing: '-0.03em',
              marginBottom: '32px'
            }}
          >
            {data.info?.name}
          </h1>

          {seasons.length > 1 && (
            <div style={{ display: 'flex', gap: '8px', marginBottom: '32px', flexWrap: 'wrap' }}>
              {seasons.map((s) => (
                <button
                  key={s}
                  onClick={() => setActiveSeason(s)}
                  className={`tab-btn${activeSeason === s ? ' active' : ''}`}
                  style={{
                    padding: '8px 20px',
                    background: 'transparent',
                    color: activeSeason === s ? tokens.textPrimary : tokens.textSecondary,
                    border: `1px solid ${activeSeason === s ? 'rgba(138,43,226,0.3)' : tokens.border}`,
                    fontSize: '14px',
                    fontWeight: 500,
                    fontFamily: tokens.font,
                    cursor: 'pointer'
                  }}
                >
                  T{s}
                </button>
              ))}
            </div>
          )}

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              overflowY: 'auto',
              maxHeight: 'calc(100vh - 340px)',
              paddingRight: '8px'
            }}
          >
            {episodeList.map((ep: Episodio, index: number) => {
              const saved = episodeProgress[ep.id]
              const progressRatio = saved?.duration > 0 ? saved.currentTime / saved.duration : 0
              const hasProgress = progressRatio > 0

              return (
                <button
                  key={ep.id}
                  className="ep-row"
                  onClick={() => handlePlay(ep, index)}
                  style={{
                    padding: '18px 22px',
                    backgroundColor: tokens.surface,
                    color: tokens.textPrimary,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    textAlign: 'left',
                    cursor: 'pointer',
                    fontFamily: tokens.font,
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                >
                  {hasProgress && (
                    <div
                      style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        height: '2px',
                        background: 'rgba(255,255,255,0.08)'
                      }}
                    >
                      <div
                        style={{
                          height: '100%',
                          width: `${progressRatio * 100}%`,
                          background: tokens.accent,
                          borderRadius: '0 2px 2px 0'
                        }}
                      />
                    </div>
                  )}

                  <span style={{ color: tokens.accent, flexShrink: 0 }}>
                    <IconPlay />
                  </span>
                  <span
                    style={{
                      color: tokens.textSecondary,
                      fontSize: '13px',
                      fontWeight: 500,
                      flexShrink: 0,
                      minWidth: '28px'
                    }}
                  >
                    {ep.episode_num}
                  </span>
                  <span
                    style={{
                      fontSize: '14px',
                      fontWeight: 500,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      flex: 1
                    }}
                  >
                    {ep.title || 'Sem Título'}
                  </span>
                  {hasProgress && (
                    <span style={{ fontSize: '11px', color: tokens.textTertiary, flexShrink: 0 }}>
                      {Math.round(progressRatio * 100)}%
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
