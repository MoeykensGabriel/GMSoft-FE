import { useId } from 'react'
import type { SelectHTMLAttributes } from 'react'

interface Props extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string
  /** Dentro de una tabla el encabezado ya dice qué es: la etiqueta queda solo para lectores de pantalla. */
  hideLabel?: boolean
  error?: string
}

export function Select({ label, hideLabel = false, error, id, className = '', children, ...props }: Props) {
  const generatedId = useId()
  const selectId = id ?? generatedId
  const errorId = `${selectId}-error`

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={selectId} className={hideLabel ? 'sr-only' : 'text-sm font-medium text-muted'}>
        {label}
      </label>
      <select
        {...props}
        id={selectId}
        aria-invalid={error ? true : undefined}
        aria-describedby={[props['aria-describedby'], error ? errorId : null].filter(Boolean).join(' ') || undefined}
        className={`ui-input ${className}`}
      >
        {children}
      </select>
      {error && <span id={errorId} className="text-xs text-danger">{error}</span>}
    </div>
  )
}
