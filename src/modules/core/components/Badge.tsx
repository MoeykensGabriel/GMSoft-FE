import type { ReactNode } from 'react'

const tones = {
  info: 'border-accent/30 bg-accent-soft text-brand-dark',
  neutral: 'border-line bg-canvas text-muted',
  success: 'border-success/30 bg-success-soft text-success-dark',
  danger: 'border-danger/30 bg-danger-soft text-danger-dark',
  warning: 'border-warning/30 bg-warning-soft text-warning',
}

export function Badge({ children, tone = 'neutral' }: { children: ReactNode; tone?: keyof typeof tones }) {
  return <span className={`inline-flex rounded border px-2 py-1 text-xs font-semibold ${tones[tone]}`}>{children}</span>
}
