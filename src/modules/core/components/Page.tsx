import type { HTMLAttributes, ReactNode } from 'react'

export function Page({ className = '', ...props }: HTMLAttributes<HTMLElement>) {
  return <main {...props} className={`ui-page ${className}`} />
}

export function PageHeader({ title, description, actions }: { title: ReactNode; description?: ReactNode; actions?: ReactNode }) {
  return <header className="flex flex-col gap-3">
    <div className="flex flex-wrap items-center justify-between gap-3 rounded border border-brand bg-brand px-4 py-3 text-white">
      <h1 className="text-lg font-semibold leading-snug">{title}</h1>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
    {description && <p className="text-sm text-muted">{description}</p>}
  </header>
}
