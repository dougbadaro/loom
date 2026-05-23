export const LogoLoomFluid = ({ size = 64 }: { size?: number }) => {
  const r = size * 0.25
  const sw = size * 0.073
  const x1 = size * 0.333
  const yTop = size * 0.271
  const yBot = size * 0.729
  const x2 = size * 0.667
  const uid = `lg_${size}`

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id={uid} x1="0" y1="0" x2={size} y2={size} gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#a855f7" />
          <stop offset="100%" stopColor="#6d1fc4" />
        </linearGradient>
      </defs>
      <rect width={size} height={size} rx={r} fill={`url(#${uid})`} />
      <rect width={size} height={size * 0.5} rx={r} fill="rgba(255,255,255,0.06)" />
      <rect y={size * 0.25} width={size} height={size * 0.25} fill="rgba(255,255,255,0.06)" />
      <line
        x1={x1}
        y1={yTop}
        x2={x1}
        y2={yBot}
        stroke="white"
        strokeWidth={sw}
        strokeLinecap="round"
      />
      <line
        x1={x1}
        y1={yBot}
        x2={x2}
        y2={yBot}
        stroke="white"
        strokeWidth={sw}
        strokeLinecap="round"
      />
      <circle cx={x2} cy={yBot} r={sw * 0.57} fill="rgba(255,255,255,0.45)" />
    </svg>
  )
}
