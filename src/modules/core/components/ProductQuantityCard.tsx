import { useId } from 'react'
import type { ReactNode } from 'react'

/** La misma presentación para cualquier conteo de un producto. */
export function ProductQuantityCard({ name, description, children, tone }: {
  name: string
  description?: ReactNode
  children: ReactNode
  tone?: 'danger'
}) {
  const id = useId()
  return <section aria-labelledby={id} className={`ui-card flex min-w-0 flex-col gap-3 p-3 ${tone === 'danger' ? 'border-danger bg-danger-soft' : ''}`}>
    <div className="min-w-0 text-center">
      <h3 id={id} className="text-lg font-semibold whitespace-normal break-normal hyphens-none [overflow-wrap:normal]">{name}</h3>
      {description && <div className="mt-1 text-sm text-muted">{description}</div>}
    </div>
    {children}
  </section>
}
