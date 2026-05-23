export interface Midia {
  id: number
  nome: string
  capa: string
  tipo: string
  extensao: string
}

export interface Categoria {
  category_id: string
  category_name: string
}

export interface Episodio {
  id: string
  episode_num: number | string
  title: string
  container_extension: string
}

export interface SerieInfo {
  name: string
  cover: string
}

export interface SeriesData {
  info: SerieInfo
  episodes: Record<string, Episodio[]>
}

export type TipoCatalogo = 'live' | 'vod' | 'series'

export interface Credenciais {
  serverUrl: string
  username: string
  password: string
}

// ─── Tipagem do Electron IPC (window.api) ─────────────────────────────────────

declare global {
  interface Window {
    api: {
      fetchCategories: (params: {
        credentials: Credenciais
        action: string
      }) => Promise<Categoria[] | { error: string }>

      fetchCatalog: (params: {
        credentials: Credenciais
        action: string
        category_id: string
      }) => Promise<Midia[] | { error: string }>

      fetchSeriesInfo: (params: {
        credentials: Credenciais
        series_id: number | string
      }) => Promise<SeriesData | { error: string }>
    }
  }
}
