import { WeekdaysField } from '../../core'

export function VisitDaysField({ value, onChange }: { value: number[]; onChange: (days: number[]) => void }) {
  return <WeekdaysField label="Días de visita (obligatorio)" value={value} onChange={onChange} />
}
