import { useId } from 'react'
import { Button } from './Button'

interface Props {
  label: string
  value: number
  onChange: (value: number) => void
  max?: number
}

export function QuantityInput({ label, value, onChange, max = 2147483647 }: Props) {
  const id = useId()
  const limit = Math.max(0, Math.floor(max))
  function change(next: number) {
    onChange(Number.isFinite(next) ? Math.min(limit, Math.max(0, Math.floor(next))) : 0)
  }
  return <div className="flex flex-col gap-1">
    <label htmlFor={id} className="text-sm">{label}</label>
    <div className="flex gap-2">
      <Button type="button" variant="danger" aria-label={`Restar: ${label}`} disabled={value <= 0} onClick={() => change(value - 1)}
        className="w-11 shrink-0 px-0 text-xl">−</Button>
      <input id={id} type="number" min={0} max={limit} step={1} inputMode="numeric" value={value || ''} placeholder="0"
        onChange={(event) => change(event.target.valueAsNumber)}
        className="ui-input text-center" />
      <Button type="button" aria-label={`Sumar: ${label}`} disabled={value >= limit} onClick={() => change(value + 1)}
        className="w-11 shrink-0 px-0 text-xl">+</Button>
    </div>
  </div>
}
