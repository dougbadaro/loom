import type { Episodio } from '@renderer/types'

/** Contexto completo da série passado ao PlayerScreen para habilitar próximo episódio */
export interface EpisodeContext {
  seriesId: number
  seriesNome: string
  seriesCapa: string
  episodeId: string
  episodeNum: number | string
  episodeTitle: string
  seasonNum: string
  container_extension: string
  /** Lista flat de todos os episódios da temporada atual, em ordem */
  episodeList: Episodio[]
  /** Índice do episódio atual em episodeList */
  currentIndex: number
  /** URL base para montar próximas URLs: `${serverUrl}/series/${user}/${pass}/` */
  baseUrl: string
}
