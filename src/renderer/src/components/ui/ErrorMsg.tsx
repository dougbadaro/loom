import { tokens } from '../../styles/tokens'

export const ErrorMsg = ({ msg }: { msg: string }) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '16px 20px',
      borderRadius: tokens.radius.lg,
      background: 'rgba(255, 59, 48, 0.08)',
      border: '1px solid rgba(255, 59, 48, 0.2)',
      color: '#ff6b6b',
      fontSize: '14px',
      marginBottom: '24px'
    }}
  >
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
    {msg}
  </div>
)
