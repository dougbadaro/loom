import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import fs from 'fs'
import axios from 'axios'

const icon = join(__dirname, '../../resources/icon.png')

// ─── Types ────────────────────────────────────────────────────────────────────

interface Credenciais {
  serverUrl: string
  username: string
  password: string
}

interface XtreamRawItem {
  stream_id?: number
  series_id?: number
  name?: string
  stream_icon?: string
  cover?: string
  container_extension?: string
  category_id?: string | number
}

interface NormalizedItem {
  id?: number
  nome: string
  capa: string
  tipo: string
  extensao: string
  categoria_id: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildApiUrl(
  credentials: Credenciais,
  action: string,
  extra: Record<string, string> = {}
): string {
  const base = `${credentials.serverUrl}/player_api.php`
  const params = new URLSearchParams({
    username: credentials.username,
    password: credentials.password,
    action,
    ...extra
  })
  return `${base}?${params.toString()}`
}

/** Chave única por usuário + ação — impede cache cruzado entre contas */
function cacheKey(credentials: Credenciais, action: string): string {
  return `${credentials.serverUrl}::${credentials.username}::${action}`
}

// ─── Cache em memória RAM ─────────────────────────────────────────────────────

const ramCache = new Map<string, NormalizedItem[]>()
const fetchPromises = new Map<string, Promise<NormalizedItem[]>>()

// ─── Window ───────────────────────────────────────────────────────────────────

function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    show: false,
    autoHideMenuBar: true,
    titleBarStyle: 'hiddenInset',
    backgroundColor: '#000000',
    icon,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.once('ready-to-show', () => {
    mainWindow.maximize()
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// ─── App lifecycle ────────────────────────────────────────────────────────────

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.electron')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // ── Handler: categorias ──────────────────────────────────────────────────

  ipcMain.handle(
    'fetch-categories',
    async (_, request: { credentials: Credenciais; action: string }) => {
      try {
        const { credentials, action } = request
        const url = buildApiUrl(credentials, action)
        const response = await axios.get(url, { responseType: 'json', timeout: 15000 })

        const cachePath = join(app.getPath('userData'), `${action}_cache.json`)
        fs.writeFileSync(cachePath, JSON.stringify(response.data))

        return response.data
      } catch (error: unknown) {
        return { error: error instanceof Error ? error.message : 'Erro ao buscar categorias.' }
      }
    }
  )

  // ── Handler: catálogo ────────────────────────────────────────────────────

  ipcMain.handle(
    'fetch-catalog',
    async (_, request: { credentials: Credenciais; action: string; category_id?: string }) => {
      const { credentials, action, category_id } = request

      // Cache separado por usuário + ação
      const key = cacheKey(credentials, action)

      try {
        // ─────────────────────────────────────────────────────────────
        // Se já existe cache em RAM
        // ─────────────────────────────────────────────────────────────

        if (!ramCache.has(key)) {
          // Evita múltiplos fetch simultâneos
          if (!fetchPromises.has(key)) {
            const promise = (async () => {
              const url = buildApiUrl(credentials, action)

              console.log('\n==============================')
              console.log('FETCH CATALOG')
              console.log('ACTION:', action)
              console.log('URL:', url)

              const response = await axios.get(url, {
                responseType: 'json',
                timeout: 120000,
                maxContentLength: Infinity,
                maxBodyLength: Infinity
              })

              console.log('RESPONSE RECEIVED')

              // ─────────────────────────────────────────────────────────
              // Alguns painéis retornam arrays
              // outros retornam objetos
              // ─────────────────────────────────────────────────────────

              let rawData: XtreamRawItem[] = []

              if (Array.isArray(response.data)) {
                rawData = response.data
              } else if (response.data?.available_channels) {
                rawData = response.data.available_channels
              } else if (response.data?.movies) {
                rawData = response.data.movies
              } else if (response.data?.series) {
                rawData = response.data.series
              } else if (response.data?.data) {
                rawData = response.data.data
              }

              console.log('RAW ITEMS:', rawData.length)

              // ─────────────────────────────────────────────────────────
              // Normalização
              // ─────────────────────────────────────────────────────────

              const normalizedData = rawData
                .map((item: XtreamRawItem): NormalizedItem | null => {
                  switch (action) {
                    // ─── Canais ────────────────────────────────────────
                    case 'get_live_streams':
                      return {
                        id: item.stream_id,
                        nome: item.name?.trim() || 'Sem Nome',
                        capa: item.stream_icon || '',
                        tipo: 'live',
                        extensao: '',
                        categoria_id: String(item.category_id ?? '0')
                      }

                    // ─── Filmes ────────────────────────────────────────
                    case 'get_vod_streams':
                      return {
                        id: item.stream_id,
                        nome: item.name?.trim() || 'Sem Nome',
                        capa: item.stream_icon || '',
                        tipo: 'vod',
                        extensao: item.container_extension || 'mp4',
                        categoria_id: String(item.category_id ?? '0')
                      }

                    // ─── Séries ────────────────────────────────────────
                    case 'get_series':
                      return {
                        id: item.series_id,
                        nome: item.name?.trim() || 'Sem Nome',
                        capa: item.cover || '',
                        tipo: 'series',
                        extensao: '',
                        categoria_id: String(item.category_id ?? '0')
                      }

                    default:
                      return null
                  }
                })
                .filter((item): item is NormalizedItem => item !== null)

              console.log('NORMALIZED ITEMS:', normalizedData.length)

              // ─────────────────────────────────────────────────────────
              // Salva cache RAM
              // ─────────────────────────────────────────────────────────

              ramCache.set(key, normalizedData)

              // Limpa promise
              fetchPromises.delete(key)

              return normalizedData
            })()

            fetchPromises.set(key, promise)
          }

          await fetchPromises.get(key)
        }

        // ─────────────────────────────────────────────────────────────
        // Obtém cache
        // ─────────────────────────────────────────────────────────────

        const allData = ramCache.get(key) || []

        console.log('TOTAL CACHE ITEMS:', allData.length)

        // ─────────────────────────────────────────────────────────────
        // Filtra categoria
        // ─────────────────────────────────────────────────────────────

        const result =
          category_id && category_id !== ''
            ? allData.filter((m) => String(m.categoria_id) === String(category_id))
            : allData

        console.log('FILTERED ITEMS:', result.length)
        console.log('==============================\n')

        return result
      } catch (error: unknown) {
        fetchPromises.delete(key)

        console.error('\n❌ FETCH CATALOG ERROR')
        console.error(error)
        console.error('==============================\n')

        return {
          error: error instanceof Error ? error.message : 'Erro ao buscar catálogo.'
        }
      }
    }
  )

  // ── Handler: limpar cache (chamado no logout) ─────────────────────────────

  ipcMain.handle('clear-cache', () => {
    ramCache.clear()
    fetchPromises.clear()
  })

  // ── Handler: info da série ───────────────────────────────────────────────

  ipcMain.handle(
    'fetch-series-info',
    async (_, request: { credentials: Credenciais; series_id: number }) => {
      try {
        const { credentials, series_id } = request
        const url = buildApiUrl(credentials, 'get_series_info', {
          series_id: String(series_id)
        })
        const response = await axios.get(url, { responseType: 'json', timeout: 15000 })
        return response.data
      } catch (error: unknown) {
        return { error: error instanceof Error ? error.message : 'Erro ao buscar série.' }
      }
    }
  )

  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
