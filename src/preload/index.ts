import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

export interface CatalogRequest {
  credentials: { username: string; password: string }
  action: 'get_vod_streams' | 'get_live_streams' | 'get_series'
}

export interface CatalogRequest {
  credentials: { username: string; password: string }
  action: 'get_vod_streams' | 'get_live_streams' | 'get_series'
  category_id?: string // <- Agora é possível filtrar
}

export interface CategoryRequest {
  credentials: { username: string; password: string }
  action: 'get_vod_categories' | 'get_live_categories' | 'get_series_categories'
}

export interface SeriesInfoRequest {
  credentials: { username: string; password: string }
  series_id: number
}

const api = {
  fetchCatalog: (request: CatalogRequest) => ipcRenderer.invoke('fetch-catalog', request),
  fetchCategories: (request: CategoryRequest) => ipcRenderer.invoke('fetch-categories', request),
  fetchSeriesInfo: (request: SeriesInfoRequest) => ipcRenderer.invoke('fetch-series-info', request)
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
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
