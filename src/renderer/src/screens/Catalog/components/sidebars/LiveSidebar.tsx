import { useMemo, useState } from 'react'
import { tokens } from '@renderer/styles/tokens'
import type { Categoria } from '@renderer/types'

interface LiveSidebarProps {
  categorias: Categoria[]
  categoriaAtiva: string | null
  onSelectCategory: (categoryId: string) => void
}

// ─── Agrupamento por prefixo ──────────────────────────────────────────────────
// "Canais | SBT"  → grupo "Canais",  label "SBT"
// "Jogos de Hoje" → grupo null,      label "Jogos de Hoje"

interface CategoriaProcessada {
  category_id: string
  label: string
  grupo: string | null
}

interface Grupo {
  nome: string | null
  itens: CategoriaProcessada[]
}

function processarCategorias(categorias: Categoria[]): Grupo[] {
  const processadas: CategoriaProcessada[] = categorias.map((cat) => {
    const sepIndex = cat.category_name.indexOf(' | ')
    if (sepIndex !== -1) {
      return {
        category_id: cat.category_id,
        label: cat.category_name.slice(sepIndex + 3).trim(),
        grupo: cat.category_name.slice(0, sepIndex).trim()
      }
    }
    return { category_id: cat.category_id, label: cat.category_name, grupo: null }
  })

  const mapa = new Map<string, CategoriaProcessada[]>()
  const AVULSO = '__avulso__'

  for (const cat of processadas) {
    const chave = cat.grupo ?? AVULSO
    if (!mapa.has(chave)) mapa.set(chave, [])
    mapa.get(chave)!.push(cat)
  }

  const grupos: Grupo[] = []
  if (mapa.has(AVULSO)) grupos.push({ nome: null, itens: mapa.get(AVULSO)! })
  for (const [chave, itens] of mapa.entries()) {
    if (chave !== AVULSO) grupos.push({ nome: chave, itens })
  }
  return grupos
}

// ─── Componente ───────────────────────────────────────────────────────────────

export function LiveSidebar({ categorias, categoriaAtiva, onSelectCategory }: LiveSidebarProps) {
  const grupos = useMemo(() => processarCategorias(categorias), [categorias])
  const [gruposColapsados, setGruposColapsados] = useState<Set<string>>(new Set())

  const toggleGrupo = (nome: string) => {
    setGruposColapsados((prev) => {
      const next = new Set(prev)
      next.has(nome) ? next.delete(nome) : next.add(nome)
      return next
    })
  }

  return (
    <>
      <style>{`
        @keyframes livePulse {
          0%,100% { opacity:1; transform:scale(1); }
          50%      { opacity:0.5; transform:scale(0.85); }
        }
        .live-dot-anim { animation: livePulse 2s ease-in-out infinite; }

        .cat-item {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          width: 100%;
          padding: 9px 10px 9px 14px;
          border: 1px solid transparent;
          border-radius: 10px;
          text-align: left;
          cursor: pointer;
          overflow: hidden;
          font-family: ${tokens.font};
          font-size: 13.5px;
          font-weight: 500;
          line-height: 1.3;
          transition: all 0.15s cubic-bezier(0.25, 1, 0.5, 1);
          background: transparent;
          color: ${tokens.textSecondary};
        }
        .cat-item:hover {
          background: rgba(255,255,255,0.04);
          color: ${tokens.textPrimary};
        }
        .cat-item.active {
          background: rgba(138, 43, 226, 0.1);
          color: ${tokens.textPrimary};
          font-weight: 600;
          border-color: rgba(138, 43, 226, 0.2);
        }
        .cat-item .indicator {
          position: absolute;
          left: 0; top: 50%;
          transform: translateY(-50%);
          width: 2.5px; height: 16px;
          border-radius: 999px;
          background: linear-gradient(180deg, #a855f7, #6d1fc4);
          box-shadow: 0 0 7px rgba(138,43,226,0.55);
          opacity: 0;
          transition: opacity 0.2s;
        }
        .cat-item.active .indicator { opacity: 1; }
        .live-badge {
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.1em;
          color: #ff453a;
          flex-shrink: 0;
          opacity: 0;
          transform: translateX(-4px);
          transition: opacity 0.18s, transform 0.18s;
        }
        .cat-item.active .live-badge { opacity: 1; transform: translateX(0); }

        .group-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 10px 5px 10px;
          cursor: pointer;
          user-select: none;
          border-radius: 6px;
          transition: background 0.15s;
        }
        .group-header:hover { background: rgba(255,255,255,0.02); }
        .group-header-label {
          font-family: ${tokens.font};
          font-size: 10.5px;
          font-weight: 600;
          letter-spacing: 0.09em;
          text-transform: uppercase;
          color: ${tokens.textTertiary};
        }
        .group-chevron {
          color: ${tokens.textTertiary};
          font-size: 10px;
          opacity: 0.5;
          transition: transform 0.2s ease;
        }
        .group-chevron.closed { transform: rotate(-90deg); }
        .group-sep {
          height: 1px;
          background: rgba(255,255,255,0.04);
          margin: 6px 4px 2px;
        }
      `}</style>

      <aside
        style={{
          width: '260px',
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          padding: '20px 10px',
          overflowY: 'auto',
          borderRight: `1px solid ${tokens.border}`,
          backgroundColor: tokens.bg
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '0 6px',
            marginBottom: '18px'
          }}
        >
          <div
            className="live-dot-anim"
            style={{
              width: '7px',
              height: '7px',
              borderRadius: '50%',
              flexShrink: 0,
              backgroundColor: '#ff453a',
              boxShadow: '0 0 6px rgba(255,69,58,0.8)'
            }}
          />
          <span
            style={{
              fontFamily: tokens.font,
              fontSize: '11px',
              fontWeight: 600,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: tokens.textTertiary
            }}
          >
            TV Ao Vivo
          </span>
        </div>

        {/* Grupos */}
        {grupos.map((grupo, gi) => {
          const colapsado = grupo.nome ? gruposColapsados.has(grupo.nome) : false
          return (
            <div key={grupo.nome ?? '__avulso__'}>
              {gi > 0 && <div className="group-sep" />}

              {grupo.nome && (
                <div className="group-header" onClick={() => toggleGrupo(grupo.nome!)}>
                  <span className="group-header-label">{grupo.nome}</span>
                  <span className={`group-chevron${colapsado ? ' closed' : ''}`}>▾</span>
                </div>
              )}

              {!colapsado && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  {grupo.itens.map((cat) => {
                    const isActive = categoriaAtiva === cat.category_id
                    return (
                      <button
                        key={cat.category_id}
                        className={`cat-item${isActive ? ' active' : ''}`}
                        onClick={() => onSelectCategory(cat.category_id)}
                        style={{ paddingLeft: grupo.nome ? '22px' : '14px' }}
                      >
                        <div className="indicator" />
                        <span
                          style={{
                            flex: 1,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}
                        >
                          {cat.label}
                        </span>
                        <span className="live-badge">LIVE</span>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </aside>
    </>
  )
}
