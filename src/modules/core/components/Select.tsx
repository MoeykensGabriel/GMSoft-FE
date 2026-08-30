import type { SelectHTMLAttributes } from 'react'

interface Props extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string
  error?: string
}

export function Select({ label, error, id, className = '', children, ...props }: Props) {
  const selectId = id ?? props.name

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={selectId} className="text-sm font-medium text-slate-700">
        {label}
      </label>
      <select
        {...props}
        id={selectId}
        className={`rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 ${
          error ? 'border-red-500 focus:ring-red-200' : 'border-slate-300 focus:ring-slate-200'
        } ${className}`}
      >
        {children}
      </select>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  )
}
