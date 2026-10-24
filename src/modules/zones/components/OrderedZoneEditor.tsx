import { Button, Select } from '../../core'
import { addZone, moveZone, removeZone, zoneChoices } from '../utils/orderedZones'

export function OrderedZoneEditor({ label = 'Zonas de reparto', value, options, onChange, disabled = false, counts }: {
  label?: string; value: string[]; options: { id: string; name: string; isActive: boolean }[]
  onChange: (ids: string[]) => void; disabled?: boolean
  /** Clientes del camión por zona para el día de la salida: ordena y aclara la lista. */
  counts?: Record<string, number>
}) {
  const choices = zoneChoices(options, value, counts)
  const conClientes = choices.filter((zone) => zone.customers !== 0)
  return <fieldset disabled={disabled} className="flex min-w-0 flex-col gap-2">
    <legend className="text-sm font-medium">{label}</legend>
    {!value.length && <p className="text-sm text-muted">Sin zonas elegidas</p>}
    <ol className="flex flex-col gap-2">{value.map((id, index) => {
      const name = options.find((zone) => zone.id === id)?.name ?? 'Zona actual'
      return <li key={id} className="flex flex-wrap items-center gap-2">
        <span className="min-w-0 flex-1">{index + 1}. {name}{counts && <span className="text-sm text-muted"> · {counts[id] ?? 0} clientes</span>}</span>
        <Button type="button" variant="secondary" className="min-h-11 min-w-11" aria-label={`Subir ${name}`} disabled={disabled || index === 0} onClick={() => onChange(moveZone(value, index, -1))}>↑</Button>
        <Button type="button" variant="secondary" className="min-h-11 min-w-11" aria-label={`Bajar ${name}`} disabled={disabled || index === value.length - 1} onClick={() => onChange(moveZone(value, index, 1))}>↓</Button>
        <Button type="button" variant="danger" className="min-h-11 min-w-11" aria-label={`Quitar ${name}`} onClick={() => onChange(removeZone(value, id))}>Quitar</Button>
      </li>
    })}</ol>
    {/* Si ninguna otra zona tiene clientes de este camión hoy, no hay nada útil para agregar. */}
    {counts && !conClientes.length
      ? <p className="text-sm text-muted">No hay otras zonas con clientes de este camión hoy.</p>
      : <Select label="Agregar otra zona" value="" disabled={disabled || value.length >= 5} onChange={(event) => onChange(addZone(value, event.target.value))}>
        <option value="">Elegí una zona</option>
        {choices.map((zone) => <option key={zone.id} value={zone.id} className={zone.customers === 0 ? 'text-muted' : ''}>{zone.label}</option>)}
      </Select>}
    {value.length >= 5 && <p className="text-sm text-muted">Hasta 5 zonas por día.</p>}
  </fieldset>
}
