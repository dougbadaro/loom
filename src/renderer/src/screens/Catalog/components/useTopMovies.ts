import { useState, useEffect } from 'react'
import type { Credenciais, Midia } from '@renderer/types'

const API_KEY = '844a707dcb0f3b691928532dd82f04e4'

// Cache persistente na memória do renderer
let cacheTopMovies: Midia[] | null = null

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

export function useTopMovies(credentials: Credenciais) {
  const [topMovies, setTopMovies] = useState<Midia[]>(cacheTopMovies ?? [])
  const [loading, setLoading] = useState(!cacheTopMovies)

  const serverUrl = credentials.serverUrl
  const username = credentials.username
  const password = credentials.password

  useEffect(() => {
    if (cacheTopMovies) return

    let montado = true

    const fetchTop = async () => {
      try {
        const [res1, res2] = await Promise.all([
          fetch(
            `https://api.themoviedb.org/3/movie/popular?language=pt-BR&page=1&api_key=${API_KEY}`
          ),
          fetch(
            `https://api.themoviedb.org/3/movie/popular?language=pt-BR&page=2&api_key=${API_KEY}`
          )
        ])

        if (!res1.ok || !res2.ok) throw new Error('Falha ao conectar no TMDB')

        const [data1, data2] = await Promise.all([res1.json(), res2.json()])
        const trendingTMDB = [...data1.results, ...data2.results]

        const iptvData = await window.api.fetchCatalog({
          credentials: { serverUrl, username, password },
          action: 'get_vod_streams',
          category_id: ''
        })

        if (!Array.isArray(iptvData)) throw new Error('Falha ao buscar IPTV no TopMovies')

        const matched: Midia[] = []
        const usados = new Set<number>()

        for (const tmdbMovie of trendingTMDB) {
          const tituloBR = normalizarTitulo(tmdbMovie.title)
          const tituloOriginal = normalizarTitulo(tmdbMovie.original_title)

          const encontrado = iptvData.find((iptvMovie) => {
            if (usados.has(iptvMovie.id)) return false

            const nomeIptvLimpo = normalizarTitulo(
              iptvMovie.nome.includes(' | ') ? iptvMovie.nome.split(' | ').pop()! : iptvMovie.nome
            )

            const regexBR = tituloBR ? new RegExp(`\\b${tituloBR}\\b`, 'i') : null
            const regexEN = tituloOriginal ? new RegExp(`\\b${tituloOriginal}\\b`, 'i') : null

            return (
              (regexBR && regexBR.test(nomeIptvLimpo)) || (regexEN && regexEN.test(nomeIptvLimpo))
            )
          })

          if (encontrado) {
            const posterTMDB = tmdbMovie.poster_path
              ? `https://image.tmdb.org/t/p/w500${tmdbMovie.poster_path}`
              : encontrado.capa

            matched.push({ ...encontrado, capa: posterTMDB })
            usados.add(encontrado.id)
          }

          if (matched.length >= 10) break
        }

        cacheTopMovies = matched
        if (montado) setTopMovies(matched)
      } catch (err) {
        console.error('Erro no Top 10:', err)
        if (montado) setTopMovies([])
      } finally {
        if (montado) setLoading(false)
      }
    }

    fetchTop()
    return () => {
      montado = false
    }
  }, [serverUrl, username, password])

  return { topMovies, loading }
}
