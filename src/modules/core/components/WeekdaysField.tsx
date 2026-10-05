import { WEEKDAYS } from '../utils/weekdays'

interface Props {
  label: string
  value: number[]
  onChange: (days: number[]) => void
  disabled?: boolean
}

export function WeekdaysField({ label, value, onChange, disabled }: Props) {
  return <fieldset disabled={disabled} className="flex flex-col gap-2">
    <legend className="font-medium">{label}</legend>
    <p className="text-sm text-neutral-600">Seleccioná al menos un día.</p>
    <div className="flex flex-wrap gap-2">
      {WEEKDAYS.map((day) => <label key={day.value} className="flex min-h-11 cursor-pointer items-center gap-2 rounded-md border border-neutral-300 px-3">
        <input type="checkbox" checked={value.includes(day.value)}
          onChange={(event) => onChange(event.target.checked ? [...value, day.value].sort((a, b) => a - b) : value.filter((item) => item !== day.value))} />
        {day.label}
      </label>)}
    </div>
  </fieldset>
}
