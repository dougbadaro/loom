import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import fs from 'fs'
import axios from 'axios'

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
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => mainWindow.show())

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
      const key = cacheKey(credentials, action)

      try {
        if (!ramCache.has(key)) {
          if (!fetchPromises.has(key)) {
            const promise = (async () => {
              const url = buildApiUrl(credentials, action)
              const response = await axios.get(url, { responseType: 'json', timeout: 30000 })

              const normalizedData: NormalizedItem[] = response.data
                .map((item: XtreamRawItem) => {
                  switch (action) {
                    case 'get_live_streams':
                      return {
                        id: item.stream_id,
                        nome: item.name?.trim() || 'Sem Nome',
                        capa: item.stream_icon || '',
                        tipo: 'live',
                        extensao: '',
                        categoria_id: String(item.category_id ?? '0')
                      }
                    case 'get_vod_streams':
                      return {
                        id: item.stream_id,
                        nome: item.name?.trim() || 'Sem Nome',
                        capa: item.stream_icon || '',
                        tipo: 'vod',
                        extensao: item.container_extension || 'mp4',
                        categoria_id: String(item.category_id ?? '0')
                      }
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
                .filter(Boolean)

              ramCache.set(key, normalizedData)
              // Limpa a promise após resolver — libera memória e permite retry futuro
              fetchPromises.delete(key)
              return normalizedData
            })()

            fetchPromises.set(key, promise)
          }

          await fetchPromises.get(key)!
        }

        const allData = ramCache.get(key)!

        const result =
          category_id && category_id !== ''
            ? allData.filter((m) => m.categoria_id === category_id)
            : allData

        return result
      } catch (error: unknown) {
        fetchPromises.delete(key)
        return { error: error instanceof Error ? error.message : 'Erro ao buscar catálogo.' }
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
