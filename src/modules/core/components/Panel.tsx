import type { HTMLAttributes, ReactNode } from 'react'

export function Panel({ title, actions, children, className = '', ...props }: Omit<HTMLAttributes<HTMLElement>, 'title'> & { title?: string; actions?: ReactNode }) {
  return <section {...props} className={`ui-card min-w-0 overflow-hidden ${className}`}>
    {(title || actions) && <div className="ui-section-heading flex flex-wrap items-center justify-between gap-3">
      {title && <h2>{title}</h2>}{actions}
    </div>}
    <div className="flex flex-col gap-4 p-4">{children}</div>
  </section>
}
