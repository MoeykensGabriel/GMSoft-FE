import { weekdayLabels } from '../../core'

export function visitDaysLabel(days: number[] | null) {
  return days?.length ? weekdayLabels(days) : 'Días pendientes de configurar'
}
