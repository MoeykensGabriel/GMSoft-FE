import type { ReactNode } from 'react'

const tones = {
  neutral: 'border-line bg-surface',
  info: 'border-accent/40 bg-accent-soft',
  warning: 'border-warning/40 bg-warning-soft',
  danger: 'border-danger/40 bg-danger-soft',
  success: 'border-success/40 bg-success-soft',
}

/** Una cifra que tiene que verse de un vistazo: etiqueta chica, número grande. */
export function StatTile({ label, value, detail, tone = 'neutral' }: {
  label: string
  value: ReactNode
  detail?: ReactNode
  tone?: keyof typeof tones
}) {
  return (
    <div className={`flex flex-col gap-1 rounded border px-4 py-3 ${tones[tone]}`}>
      <span className="text-sm font-medium text-muted">{label}</span>
      <span className="text-2xl font-semibold leading-tight text-ink">{value}</span>
      {detail && <span className="text-sm text-muted">{detail}</span>}
    </div>
  )
}
