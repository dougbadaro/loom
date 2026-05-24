import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CatalogRequest {
  credentials: { serverUrl: string; username: string; password: string }
  action: 'get_vod_streams' | 'get_live_streams' | 'get_series'
  category_id?: string
}

export interface CategoryRequest {
  credentials: { serverUrl: string; username: string; password: string }
  action: 'get_vod_categories' | 'get_live_categories' | 'get_series_categories'
}

export interface SeriesInfoRequest {
  credentials: { serverUrl: string; username: string; password: string }
  series_id: number
}

// ─── API ──────────────────────────────────────────────────────────────────────

const api = {
  fetchCategories: (request: CategoryRequest) => ipcRenderer.invoke('fetch-categories', request),
  fetchCatalog: (request: CatalogRequest) => ipcRenderer.invoke('fetch-catalog', request),
  fetchSeriesInfo: (request: SeriesInfoRequest) => ipcRenderer.invoke('fetch-series-info', request),
  clearCache: () => ipcRenderer.invoke('clear-cache')
}

// ─── Expose ───────────────────────────────────────────────────────────────────

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
