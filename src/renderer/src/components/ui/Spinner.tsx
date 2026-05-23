import { tokens } from '../../styles/tokens'

export const Spinner = () => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '60px 0',
      gap: '14px'
    }}
  >
    <div className="spinner" />
    <span style={{ color: tokens.textSecondary, fontSize: '14px' }}>Carregando...</span>
  </div>
)
