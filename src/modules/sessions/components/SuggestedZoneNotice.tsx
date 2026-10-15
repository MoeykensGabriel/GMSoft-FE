import { weekdayLabels } from '../../core'
import type { SuggestedZone } from '../../schedule'

export function SuggestedZoneNotice({ suggestion, zoneId }: { suggestion?: SuggestedZone; zoneId: string }) {
  if (!suggestion?.zoneId) return null
  return <div className="flex flex-col gap-2 text-sm">
    <p>Zona de hoy según la agenda: <strong>{suggestion.zoneName}</strong></p>
    <ul>{suggestion.days.map((day) => <li key={day.day}>{weekdayLabels([day.day])}: {day.zoneName ?? 'No sale'}</li>)}</ul>
    {zoneId && zoneId !== suggestion.zoneId && <p role="status" className="rounded border border-warning/40 bg-warning-soft p-3 text-warning">Esta zona no es la de hoy para tu camión. Podés guardar igual y abrir la salida.</p>}
  </div>
}
