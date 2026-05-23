import { ElectronAPI } from '@electron-toolkit/preload'
import { CatalogRequest, CategoryRequest, SeriesInfoRequest } from './index'

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      fetchCatalog: (request: CatalogRequest) => Promise<unknown>
      fetchCategories: (request: CategoryRequest) => Promise<unknown>
      fetchSeriesInfo: (request: SeriesInfoRequest) => Promise<unknown>
    }
  }
}
