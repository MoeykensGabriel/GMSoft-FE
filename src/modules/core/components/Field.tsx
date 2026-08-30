import type { InputHTMLAttributes } from 'react'

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
}

export function Field({ label, error, id, className = '', ...props }: Props) {
  const inputId = id ?? props.name

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={inputId} className="text-sm font-medium text-slate-700">
        {label}
      </label>
      <input
        {...props}
        id={inputId}
        aria-invalid={error ? true : undefined}
        className={`rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 ${
          error ? 'border-red-500 focus:ring-red-200' : 'border-slate-300 focus:ring-slate-200'
        } ${className}`}
      />
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  )
}
