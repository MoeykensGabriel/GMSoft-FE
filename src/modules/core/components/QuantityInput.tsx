import { useId } from 'react'
import type { InputHTMLAttributes, ReactNode } from 'react'
import { Button } from './Button'
import { ProductQuantityCard } from './ProductQuantityCard'

interface ControlProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string
  hideLabel?: boolean
  onDecrease: () => void
  onIncrease: () => void
  decreaseDisabled?: boolean
  increaseDisabled?: boolean
}

/** Mantiene el valor y el onChange del consumidor, incluso los conteos vacíos. */
export function QuantityControl({ label, hideLabel = false, onDecrease, onIncrease,
  decreaseDisabled, increaseDisabled, ...input }: ControlProps) {
  const id = useId()
  return <div className="flex min-w-0 flex-col gap-1 text-center">
    <label htmlFor={id} className={hideLabel ? 'sr-only' : 'text-sm text-muted'}>{label}</label>
    <div className="flex min-w-0 gap-2">
      <Button type="button" variant="danger" aria-label={`Restar: ${label}`} disabled={input.disabled || decreaseDisabled} onClick={onDecrease}
        className="min-h-11 w-11 shrink-0 px-0 text-xl">−</Button>
      <input {...input} id={id} type="number" className="ui-input min-h-11 min-w-0 flex-1 text-center" />
      <Button type="button" aria-label={`Sumar: ${label}`} disabled={input.disabled || increaseDisabled} onClick={onIncrease}
        className="min-h-11 w-11 shrink-0 px-0 text-xl">+</Button>
    </div>
  </div>
}

interface Props {
  label: string
  value: number
  onChange: (value: number) => void
  max?: number
  hideLabel?: boolean
  variant?: 'card' | 'inline'
  description?: ReactNode
  tone?: 'danger'
}

export function QuantityInput({ label, value, onChange, max = 2147483647, hideLabel = false,
  variant = 'card', description, tone }: Props) {
  const limit = Math.max(0, Math.floor(max))
  function change(next: number) {
    onChange(Number.isFinite(next) ? Math.min(limit, Math.max(0, Math.floor(next))) : 0)
  }
  const control = <QuantityControl label={label} hideLabel={hideLabel || variant === 'card'}
    min={0} max={limit} step={1} inputMode="numeric" value={value || ''} placeholder="0"
    onChange={(event) => change(event.target.valueAsNumber)}
    decreaseDisabled={value <= 0} increaseDisabled={value >= limit}
    onDecrease={() => change(value - 1)} onIncrease={() => change(value + 1)} />
  return variant === 'card'
    ? <ProductQuantityCard name={label} description={description} tone={tone}>{control}</ProductQuantityCard>
    : control
}
