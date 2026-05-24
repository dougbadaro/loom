import { ElectronAPI } from '@electron-toolkit/preload'
import { CatalogRequest, CategoryRequest, SeriesInfoRequest } from './index'
import { Categoria, Midia, SeriesData } from '@renderer/types'

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      fetchCategories: (request: CategoryRequest) => Promise<Categoria[] & { error?: string }>
      fetchCatalog: (request: CatalogRequest) => Promise<Midia[] & { error?: string }>
      fetchSeriesInfo: (request: SeriesInfoRequest) => Promise<SeriesData & { error?: string }>
      clearCache: () => Promise<void>
    }
  }
}
