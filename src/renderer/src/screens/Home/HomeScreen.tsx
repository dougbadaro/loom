import { IconSeries } from '@renderer/components/icons/IconSeries'
import { LogoLoomFluid } from '@renderer/components/icons/LogoLoomFluid'
import { IconTV } from '@renderer/components/icons/IconTV'
import { IconFilm } from '@renderer/components/icons/IconFilm'
import { TipoCatalogo } from '../../types'
import { tokens } from '@renderer/styles/tokens'
import styles from './HomeScreen.module.css'

const CATALOG_ITEMS = [
  {
    id: 'live' as TipoCatalogo,
    titulo: 'TV Ao Vivo',
    desc: 'Canais em tempo real',
    icon: <IconTV />
  },
  { id: 'vod' as TipoCatalogo, titulo: 'Filmes', desc: 'O cinema na sua tela', icon: <IconFilm /> },
  {
    id: 'series' as TipoCatalogo,
    titulo: 'Séries',
    desc: 'Todas as temporadas',
    icon: <IconSeries />
  }
]

interface HomeScreenProps {
  onEnter: (t: TipoCatalogo) => void
  onLogout: () => void
}

export function HomeScreen({ onEnter, onLogout }: HomeScreenProps) {
  // Passa os valores do seu tokens.ts para o CSS
  const cssVariables = {
    '--bg': tokens.bg,
    '--surface': tokens.surface,
    '--textPrimary': tokens.textPrimary,
    '--textSecondary': tokens.textSecondary,
    '--accent': tokens.accent,
    '--font': tokens.font,
    '--radius-xxl': tokens.radius.xxl
  } as React.CSSProperties

  return (
    <div className={styles.homeContainer} style={cssVariables}>
      <button className={styles.logoutBtn} onClick={onLogout}>
        Desconectar
      </button>

      <div className={styles.logoWrapper}>
        <LogoLoomFluid size={88} />
      </div>

      <nav className={styles.bentoGrid}>
        {CATALOG_ITEMS.map((item) => (
          <button key={item.id} className={styles.bentoCard} onClick={() => onEnter(item.id)}>
            <div className={styles.bentoIcon}>{item.icon}</div>
            <h2 className={styles.bentoTitle}>{item.titulo}</h2>
            <span className={styles.bentoDesc}>{item.desc}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}
