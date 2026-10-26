import { weekdayLabels } from '../../core'

export function outOfRouteChip(visitDays: number[], zoneName: string) {
  const days = weekdayLabels(visitDays).split(', ').filter(Boolean).map((day) => day.slice(0, 3)).join(', ')
  return [days, zoneName.trim()].filter(Boolean).join(' · ')
}

export function canOfferNoPurchase(outOfRoute: boolean) {
  return !outOfRoute
}
