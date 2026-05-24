import { useMemo, useState } from 'react'
import { tokens } from '@renderer/styles/tokens'
import type { Categoria } from '@renderer/types'

interface MoviesSidebarProps {
  categorias: Categoria[]
  categoriaAtiva: string | null
  onSelectCategory: (categoryId: string) => void
}

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
    const sep = cat.category_name.indexOf(' | ')
    if (sep !== -1) {
      return {
        category_id: cat.category_id,
        label: cat.category_name.slice(sep + 3).trim(),
        grupo: cat.category_name.slice(0, sep).trim()
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

export function MoviesSidebar({
  categorias,
  categoriaAtiva,
  onSelectCategory
}: MoviesSidebarProps) {
  const grupos = useMemo(() => processarCategorias(categorias), [categorias])
  const [colapsados, setColapsados] = useState<Set<string>>(new Set())

  const toggle = (nome: string) => {
    setColapsados((prev) => {
      const next = new Set(prev)
      next.has(nome) ? next.delete(nome) : next.add(nome)
      return next
    })
  }

  return (
    <>
      <style>{`
        .mv-item {
          position: relative;
          display: flex;
          align-items: center;
          gap: 8px;
          width: 100%;
          padding: 9px 10px 9px 14px;
          border: 1px solid transparent;
          border-radius: 10px;
          text-align: left;
          cursor: pointer;
          font-family: ${tokens.font};
          font-size: 13.5px;
          font-weight: 500;
          line-height: 1.3;
          transition: all 0.15s cubic-bezier(0.25, 1, 0.5, 1);
          background: transparent;
          color: ${tokens.textSecondary};
        }
        .mv-item:hover { background: rgba(255,255,255,0.04); color: ${tokens.textPrimary}; }
        .mv-item.active {
          background: rgba(138,43,226,0.1);
          color: ${tokens.textPrimary};
          font-weight: 600;
          border-color: rgba(138,43,226,0.2);
        }
        .mv-item .mv-ind {
          position: absolute; left: 0; top: 50%; transform: translateY(-50%);
          width: 2.5px; height: 16px; border-radius: 999px;
          background: linear-gradient(180deg, #a855f7, #6d1fc4);
          box-shadow: 0 0 7px rgba(138,43,226,0.55);
          opacity: 0; transition: opacity 0.2s;
        }
        .mv-item.active .mv-ind { opacity: 1; }
        .mv-gh {
          display: flex; align-items: center; justify-content: space-between;
          padding: 14px 10px 5px; cursor: pointer; border-radius: 6px;
          transition: background 0.15s; user-select: none;
        }
        .mv-gh:hover { background: rgba(255,255,255,0.02); }
        .mv-gh-label {
          font-family: ${tokens.font}; font-size: 10.5px; font-weight: 600;
          letter-spacing: 0.09em; text-transform: uppercase; color: ${tokens.textTertiary};
        }
        .mv-ch { color: ${tokens.textTertiary}; font-size: 10px; opacity: 0.5; transition: transform 0.2s ease; }
        .mv-ch.closed { transform: rotate(-90deg); }
        .mv-sep { height: 1px; background: rgba(255,255,255,0.04); margin: 6px 4px 2px; }
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
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#48484a"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="2" y="2" width="20" height="20" rx="4" />
            <line x1="7" y1="2" x2="7" y2="22" />
            <line x1="17" y1="2" x2="17" y2="22" />
            <line x1="2" y1="12" x2="22" y2="12" />
          </svg>
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
            Filmes
          </span>
        </div>

        {grupos.map((grupo, gi) => {
          const colapsado = grupo.nome ? colapsados.has(grupo.nome) : false
          return (
            <div key={grupo.nome ?? '__avulso__'}>
              {gi > 0 && <div className="mv-sep" />}
              {grupo.nome && (
                <div className="mv-gh" onClick={() => toggle(grupo.nome!)}>
                  <span className="mv-gh-label">{grupo.nome}</span>
                  <span className={`mv-ch${colapsado ? ' closed' : ''}`}>▾</span>
                </div>
              )}
              {!colapsado && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  {grupo.itens.map((cat) => {
                    const isActive = categoriaAtiva === cat.category_id
                    return (
                      <button
                        key={cat.category_id}
                        className={`mv-item${isActive ? ' active' : ''}`}
                        onClick={() => onSelectCategory(cat.category_id)}
                        style={{ paddingLeft: grupo.nome ? '22px' : '14px' }}
                      >
                        <div className="mv-ind" />
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
