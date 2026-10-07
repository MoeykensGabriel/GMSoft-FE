import { useId } from 'react'
import type { TextareaHTMLAttributes } from 'react'

export function Textarea({ label, error, id, className = '', ...props }: TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string; error?: string }) {
  const generatedId = useId()
  const inputId = id ?? generatedId
  const errorId = `${inputId}-error`
  return <div className="flex flex-col gap-1">
    <label htmlFor={inputId} className="text-sm font-medium text-muted">{label}</label>
    <textarea {...props} id={inputId} aria-invalid={error ? true : undefined}
      aria-describedby={[props['aria-describedby'], error ? errorId : null].filter(Boolean).join(' ') || undefined}
      className={`ui-input resize-y ${className}`} />
    {error && <span id={errorId} className="text-xs text-danger">{error}</span>}
  </div>
}
