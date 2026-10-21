import { weekdayLabels } from '../../core'
import { orderedZones, sameZones } from '../../zones'
import type { SuggestedZone } from '../../schedule'

export function SuggestedZoneNotice({ suggestion, zoneIds }: { suggestion?: SuggestedZone; zoneIds: string[] }) {
  if (!suggestion) return null
  const zones = orderedZones(suggestion)
  return <div className="flex flex-col gap-2 text-sm">
    <p>Zonas de hoy según la agenda: <strong>{zones.map((zone) => zone.zoneName).join(' → ') || 'No sale'}</strong></p>
    <ul>{suggestion.days.map((day) => <li key={day.day}>{weekdayLabels([day.day])}: {orderedZones(day).map((zone) => zone.zoneName).join(' → ') || 'No sale'}</li>)}</ul>
    {!sameZones(zoneIds, zones.map((zone) => zone.zoneId)) && <p role="status" className="rounded border border-warning/40 bg-warning-soft p-3 text-warning">Estas zonas no son las de hoy para tu camión o están en otro orden. Podés guardar igual y abrir la salida.</p>}
  </div>
}
