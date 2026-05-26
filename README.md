# Loom

Player IPTV desktop construído com Electron, React e TypeScript. Interface inspirada no design system da Apple com identidade visual própria.

---

## Funcionalidades

**TV Ao Vivo**
- Canais HLS em tempo real com configuração otimizada para streams IPTV
- Sidebar com categorias agrupadas automaticamente por prefixo
- Recuperação automática de erros de rede e fragmentos corrompidos

**Filmes**
- Grade estilo Netflix com carrosséis horizontais por categoria
- Seção Top 10 com matching automático via TMDB API
- Busca em tempo real no catálogo completo
- Continue Assistindo com barra de progresso por filme
- Retoma automaticamente de onde parou

**Séries**
- Grade com Top 10 via TMDB
- Visualização por temporada com tabs
- Progresso por episódio com indicador percentual
- Continue Assistindo com episódio e temporada salvos
- Botão de próximo episódio no player (aparece nos últimos 30s)
- Avanço automático ao terminar episódio

**Player**
- Controles customizados — sem UI padrão do navegador
- Suporte a HLS (live) e MP4/MKV nativo (VOD)
- Barra de progresso com seek, skip ±10s
- Controle de volume com slider
- Fullscreen
- Auto-hide dos controles após 3s
- Badge AO VIVO com animação de pulso
- Indicador de qualidade automático (HLS levels)
- Atalhos de teclado

**Atalhos de teclado no player**

| Tecla | Ação |
|-------|------|
| `Space` | Play / Pause |
| `←` `→` | Voltar / Avançar 10s |
| `↑` `↓` | Volume +/- |
| `F` | Fullscreen |
| `M` | Mudo |
| `N` | Próximo episódio |
| `Esc` | Voltar |

---

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Desktop | Electron 28 |
| UI | React 18 + TypeScript |
| Build | electron-vite |
| HLS | hls.js |
| HTTP | axios |
| Dados externos | TMDB API |
| Persistência | localStorage |

---

## Estrutura do projeto

```
src/
├── main/
│   └── index.ts              # Processo principal — IPC handlers, cache RAM
├── preload/
│   └── index.ts              # Bridge main ↔ renderer
└── renderer/src/
    ├── screens/
    │   ├── Catalog/           # Tela principal (TV, Filmes, Séries)
    │   │   ├── components/
    │   │   │   ├── cards/     # LiveCard, MovieCard, SeriesCard
    │   │   │   ├── layouts/   # LiveLayout, MoviesLayout, SeriesLayout
    │   │   │   │              # MovieRow, SeriesRow, ContinueWatchingRow
    │   │   │   └── sidebars/  # LiveSidebar, MoviesSidebar, SeriesSidebar
    │   │   ├── hooks/
    │   │   │   └── useWatchProgress.ts
    │   │   ├── useTopMovies.ts
    │   │   ├── useTopSeries.ts
    │   │   └── CatalogScreen.tsx
    │   ├── Player/
    │   │   └── PlayerScreen.tsx
    │   ├── Series/
    │   │   ├── EpisodeContext.ts
    │   │   └── SeriesScreen.tsx
    │   ├── Home/
    │   └── Login/
    ├── components/            # Componentes globais (Spinner, ErrorMsg, etc)
    ├── styles/
    │   └── tokens.ts          # Design tokens centralizados
    └── types/
        └── index.ts           # Tipos TypeScript globais
```

---

## Instalação

```bash
# Dependências
npm install

# Desenvolvimento
npm run dev

# Build
npm run build
```

---

## Configuração

Na tela de login, informe:

- **URL do Servidor** — endereço do seu provedor IPTV (ex: `http://servidor.com:8080`)
- **Usuário** e **Senha** — credenciais fornecidas pelo provedor

As credenciais são salvas localmente e persistem entre sessões.

---

## Cache e performance

O catálogo completo de cada tipo (filmes, séries, canais) é carregado uma única vez por sessão e armazenado em memória RAM no processo principal. Trocas de categoria são instantâneas — sem nova requisição ao servidor.

O cache é invalidado automaticamente no logout.

---

## Progresso de visualização

O progresso é salvo no `localStorage` a cada 10 segundos durante a reprodução e imediatamente ao pausar. Filmes e séries aparecem na seção "Continue Assistindo" enquanto houver progresso registrado.

---

## API externa

A seção Top 10 usa a [TMDB API](https://www.themoviedb.org/documentation/api) para buscar os títulos mais populares e cruzar com o catálogo local. Requer uma chave de API gratuita configurada em `useTopMovies.ts` e `useTopSeries.ts`.

---

## Protocolo IPTV

Compatível com servidores **Xtream Codes** — o protocolo mais comum em provedores IPTV brasileiros. Endpoints utilizados:

```
/player_api.php  → categorias e catálogo
/live/           → streams ao vivo (HLS)
/movie/          → filmes (MP4/MKV)
/series/         → episódios
```