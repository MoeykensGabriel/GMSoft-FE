import { useId } from 'react'

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
      <button type="button" aria-label={`Restar: ${label}`} disabled={value <= 0} onClick={() => change(value - 1)}
        className="min-h-11 w-11 shrink-0 rounded-md bg-red-700 text-xl text-white disabled:opacity-40">−</button>
      <input id={id} type="number" min={0} max={limit} step={1} inputMode="numeric" value={value || ''} placeholder="0"
        onChange={(event) => change(event.target.valueAsNumber)}
        className="min-h-11 min-w-0 w-full rounded-md border border-neutral-300 px-2 text-center text-base" />
      <button type="button" aria-label={`Sumar: ${label}`} disabled={value >= limit} onClick={() => change(value + 1)}
        className="min-h-11 w-11 shrink-0 rounded-md bg-green-700 text-xl text-white disabled:opacity-40">+</button>
    </div>
  </div>
}
