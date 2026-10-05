export const VISIT_DAYS = [
  { value: 1, label: 'Lunes' }, { value: 2, label: 'Martes' },
  { value: 3, label: 'Miércoles' }, { value: 4, label: 'Jueves' },
  { value: 5, label: 'Viernes' }, { value: 6, label: 'Sábado' }, { value: 7, label: 'Domingo' },
]

export function visitDaysLabel(days: number[] | null) {
  return days?.length ? VISIT_DAYS.filter((day) => days.includes(day.value)).map((day) => day.label).join(', ') : 'Días pendientes de configurar'
}
