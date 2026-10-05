import { VISIT_DAYS } from '../utils/visitDays'

export function VisitDaysField({ value, onChange }: { value: number[]; onChange: (days: number[]) => void }) {
  return <fieldset className="flex flex-col gap-2">
    <legend className="font-medium">Días de visita (obligatorio)</legend>
    <p className="text-sm text-neutral-600">Seleccioná al menos un día.</p>
    <div className="flex flex-wrap gap-2">
      {VISIT_DAYS.map((day) => <label key={day.value} className="flex min-h-11 cursor-pointer items-center gap-2 rounded-md border border-neutral-300 px-3">
        <input type="checkbox" checked={value.includes(day.value)}
          onChange={(event) => onChange(event.target.checked ? [...value, day.value].sort((a, b) => a - b) : value.filter((item) => item !== day.value))} />
        {day.label}
      </label>)}
    </div>
  </fieldset>
}
