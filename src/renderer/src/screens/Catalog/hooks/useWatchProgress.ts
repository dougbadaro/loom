import { useState, useCallback } from 'react'

const STORAGE_KEY_MOVIES = 'loom_watch_progress'
const STORAGE_KEY_SERIES = 'loom_series_progress'

// ─── Movies ───────────────────────────────────────────────────────────────────

export interface WatchEntry {
  id: number
  nome: string
  capa: string
  extensao: string
  currentTime: number
  duration: number
  watchedAt: number
}

// ─── Series ───────────────────────────────────────────────────────────────────

export interface SeriesWatchEntry {
  seriesId: number
  seriesNome: string
  seriesCapa: string
  episodeId: string
  episodeNum: number | string
  episodeTitle: string
  seasonNum: string
  container_extension: string
  currentTime: number
  duration: number
  watchedAt: number
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function loadStorage<T>(key: string): Record<string, T> {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function saveStorage<T>(key: string, data: Record<string, T>) {
  try {
    localStorage.setItem(key, JSON.stringify(data))
  } catch (e) {
    console.warn('localStorage unavailable', e)
  }
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useWatchProgress() {
  const [movieProgress, setMovieProgress] = useState<Record<number, WatchEntry>>(
    () => loadStorage<WatchEntry>(STORAGE_KEY_MOVIES) as Record<number, WatchEntry>
  )
  const [seriesProgress, setSeriesProgress] = useState<Record<string, SeriesWatchEntry>>(() =>
    loadStorage<SeriesWatchEntry>(STORAGE_KEY_SERIES)
  )

  // ── Movies ──────────────────────────────────────────────────────────────────

  const saveMovieProgress = useCallback((entry: Omit<WatchEntry, 'watchedAt'>) => {
    if (!entry.currentTime || !entry.duration || entry.duration <= 0) return
    setMovieProgress((prev) => {
      const next = { ...prev, [entry.id]: { ...entry, watchedAt: Date.now() } }
      saveStorage(STORAGE_KEY_MOVIES, next)
      return next
    })
  }, [])

  const removeMovieProgress = useCallback((id: number) => {
    setMovieProgress((prev) => {
      const next = { ...prev }
      delete next[id]
      saveStorage(STORAGE_KEY_MOVIES, next)
      return next
    })
  }, [])

  const getMovieProgress = useCallback(
    (id: number): WatchEntry | null => movieProgress[id] ?? null,
    [movieProgress]
  )

  const continueWatching = useCallback((): WatchEntry[] => {
    return Object.values(movieProgress)
      .filter((e) => e.currentTime > 0 && e.duration > 0)
      .sort((a, b) => b.watchedAt - a.watchedAt)
  }, [movieProgress])

  // ── Series ──────────────────────────────────────────────────────────────────

  const seriesKey = (seriesId: number, episodeId: string) => `${seriesId}::${episodeId}`

  const removeSeriesProgress = useCallback((seriesId: number) => {
    setSeriesProgress((prev) => {
      const next = { ...prev }
      // Remove todas as entradas da série
      for (const key of Object.keys(next)) {
        if (next[key].seriesId === seriesId) delete next[key]
      }
      saveStorage(STORAGE_KEY_SERIES, next)
      return next
    })
  }, [])

  const saveSeriesProgress = useCallback((entry: Omit<SeriesWatchEntry, 'watchedAt'>) => {
    if (!entry.currentTime || !entry.duration || entry.duration <= 0) return
    const key = seriesKey(entry.seriesId, entry.episodeId)
    setSeriesProgress((prev) => {
      const next = { ...prev, [key]: { ...entry, watchedAt: Date.now() } }
      saveStorage(STORAGE_KEY_SERIES, next)
      return next
    })
  }, [])

  const getSeriesProgress = useCallback(
    (seriesId: number, episodeId: string): SeriesWatchEntry | null => {
      return seriesProgress[seriesKey(seriesId, episodeId)] ?? null
    },
    [seriesProgress]
  )

  const continueWatchingSeries = useCallback((): SeriesWatchEntry[] => {
    const bySeriesLatest: Record<number, SeriesWatchEntry> = {}
    for (const entry of Object.values(seriesProgress)) {
      // Ignora entradas com seriesId inválido (0)
      if (!entry.seriesId) continue
      const existing = bySeriesLatest[entry.seriesId]
      if (!existing || entry.watchedAt > existing.watchedAt) {
        bySeriesLatest[entry.seriesId] = entry
      }
    }
    return Object.values(bySeriesLatest).sort((a, b) => b.watchedAt - a.watchedAt)
  }, [seriesProgress])

  return {
    saveMovieProgress,
    removeMovieProgress,
    getMovieProgress,
    continueWatching,
    saveSeriesProgress,
    removeSeriesProgress,
    getSeriesProgress,
    continueWatchingSeries
  }
}
