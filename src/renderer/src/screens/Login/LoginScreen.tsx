import { tokens } from '@renderer/styles/tokens'
import { Credenciais } from '../../types'
import { LogoLoomFluid } from '@renderer/components/icons/LogoLoomFluid'

interface LoginScreenProps {
  onLogin: (c: Credenciais) => void
}

export function LoginScreen({ onLogin }: LoginScreenProps) {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const url = (fd.get('serverUrl') as string).replace(/\/$/, '')
    onLogin({
      serverUrl: url,
      username: fd.get('username') as string,
      password: fd.get('password') as string
    })
  }

  return (
    <div
      style={{
        backgroundColor: tokens.bg,
        minHeight: '100vh',
        width: '100vw',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: tokens.font,
        color: tokens.textPrimary,
        padding: '20px'
      }}
    >
      <div
        className="fade-in"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          width: '100%',
          maxWidth: '380px'
        }}
      >
        <LogoLoomFluid size={72} />
        <h1
          style={{
            marginTop: '20px',
            marginBottom: '8px',
            fontSize: '26px',
            fontWeight: 700,
            letterSpacing: '-0.03em'
          }}
        >
          Loom
        </h1>
        <p style={{ color: tokens.textSecondary, fontSize: '15px', marginBottom: '44px' }}>
          Conecte sua conta IPTV
        </p>

        <form
          onSubmit={handleSubmit}
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '18px',
            width: '100%',
            backgroundColor: tokens.surface,
            padding: '36px',
            borderRadius: tokens.radius.xxl,
            border: `1px solid ${tokens.border}`
          }}
        >
          {[
            {
              name: 'serverUrl',
              label: 'URL do Servidor',
              type: 'url',
              placeholder: 'http://dominio.com:porta'
            },
            { name: 'username', label: 'Usuário', type: 'text', placeholder: 'Seu usuário' },
            { name: 'password', label: 'Senha', type: 'password', placeholder: '••••••••' }
          ].map((f) => (
            <div key={f.name} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label
                style={{ fontSize: '13px', color: tokens.textSecondary, letterSpacing: '0.01em' }}
              >
                {f.label}
              </label>
              <input
                name={f.name}
                type={f.type}
                required
                placeholder={f.placeholder}
                className="input-field"
              />
            </div>
          ))}

          <button
            type="submit"
            style={{
              marginTop: '8px',
              padding: '15px',
              background: `linear-gradient(135deg, ${tokens.accent}, #6a1fb0)`,
              color: '#fff',
              border: 'none',
              borderRadius: tokens.radius.md,
              fontSize: '15px',
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: tokens.font,
              letterSpacing: '-0.01em',
              transition: 'opacity 0.2s, transform 0.15s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = '0.9'
              e.currentTarget.style.transform = 'scale(0.99)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = '1'
              e.currentTarget.style.transform = 'scale(1)'
            }}
          >
            Conectar
          </button>
        </form>
      </div>
    </div>
  )
}
