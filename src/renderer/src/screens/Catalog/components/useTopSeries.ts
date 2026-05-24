import { useState, useEffect } from 'react'
import type { Credenciais, Midia } from '@renderer/types'

const API_KEY = '844a707dcb0f3b691928532dd82f04e4'

let cacheTopSeries: Midia[] | null = null

function normalizarTitulo(titulo: string): string {
  if (!titulo) return ''
  return titulo
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s*\(\d{4}\)\s*/g, '')
    .replace(/\[.*?\]/g, '')
    .replace(/[^\w\s]/gi, ' ')
    .toLowerCase()
    .trim()
}

export function useTopSeries(credentials: Credenciais) {
  const [topSeries, setTopSeries] = useState<Midia[]>(cacheTopSeries ?? [])
  const [loading, setLoading] = useState(!cacheTopSeries)

  const serverUrl = credentials.serverUrl
  const username = credentials.username
  const password = credentials.password

  useEffect(() => {
    if (cacheTopSeries) return

    let montado = true

    const fetchTop = async () => {
      try {
        const [res1, res2] = await Promise.all([
          fetch(`https://api.themoviedb.org/3/tv/popular?language=pt-BR&page=1&api_key=${API_KEY}`),
          fetch(`https://api.themoviedb.org/3/tv/popular?language=pt-BR&page=2&api_key=${API_KEY}`)
        ])

        if (!res1.ok || !res2.ok) throw new Error('Falha ao conectar no TMDB')

        const [data1, data2] = await Promise.all([res1.json(), res2.json()])
        const trendingTMDB = [...data1.results, ...data2.results]

        const iptvData = await window.api.fetchCatalog({
          credentials: { serverUrl, username, password },
          action: 'get_series',
          category_id: ''
        })

        if (!Array.isArray(iptvData)) throw new Error('Falha ao buscar IPTV no TopSeries')

        const matched: Midia[] = []
        const usados = new Set<number>()

        for (const tmdbSerie of trendingTMDB) {
          const tituloBR = normalizarTitulo(tmdbSerie.name)
          const tituloOriginal = normalizarTitulo(tmdbSerie.original_name)

          const encontrado = iptvData.find((iptvSerie) => {
            if (usados.has(iptvSerie.id)) return false

            const nomeIptvLimpo = normalizarTitulo(
              iptvSerie.nome.includes(' | ') ? iptvSerie.nome.split(' | ').pop()! : iptvSerie.nome
            )

            const regexBR = tituloBR ? new RegExp(`\\b${tituloBR}\\b`, 'i') : null
            const regexEN = tituloOriginal ? new RegExp(`\\b${tituloOriginal}\\b`, 'i') : null

            return (
              (regexBR && regexBR.test(nomeIptvLimpo)) || (regexEN && regexEN.test(nomeIptvLimpo))
            )
          })

          if (encontrado) {
            const posterTMDB = tmdbSerie.poster_path
              ? `https://image.tmdb.org/t/p/w500${tmdbSerie.poster_path}`
              : encontrado.capa

            matched.push({ ...encontrado, capa: posterTMDB })
            usados.add(encontrado.id)
          }

          if (matched.length >= 10) break
        }

        cacheTopSeries = matched
        if (montado) setTopSeries(matched)
      } catch (err) {
        console.error('Erro no Top 10 Séries:', err)
        if (montado) setTopSeries([])
      } finally {
        if (montado) setLoading(false)
      }
    }

    fetchTop()
    return () => {
      montado = false
    }
  }, [serverUrl, username, password])

  return { topSeries, loading }
}
