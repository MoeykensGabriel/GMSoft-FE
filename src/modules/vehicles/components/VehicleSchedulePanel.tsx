import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Button, ErrorMessage, Panel, Select, WEEKDAYS } from '../../core'
import { scheduleService } from '../../schedule'
import type { ScheduleCustomerCount } from '../../schedule'
import { zoneService, orderedZones } from '../../zones'
import { customersFor, replaceDay, unscheduled, zoneWithCount } from '../utils/scheduleWeek'
import type { WeekDay } from '../utils/scheduleWeek'

type ZoneOption = { id: string; name: string; isActive: boolean }

/**
 * La agenda del camión como una tabla de la semana: cada día con sus zonas en el orden
 * en que se recorren y cuántos clientes tiene cada una. Se cambia un día por vez y se
 * guarda al momento. Al abrir la salida, esas zonas vienen marcadas.
 */
export function VehicleSchedulePanel({ vehicleId }: { vehicleId: string }) {
  const cache = useQueryClient()
  const query = useQuery({ queryKey: ['vehicles', 'schedule', vehicleId], queryFn: () => scheduleService.get(vehicleId) })
  const zones = useQuery({ queryKey: ['zones', 'schedule-options'], queryFn: zoneService.listAll })
  const [editing, setEditing] = useState<WeekDay | null>(null)
  const [saved, setSaved] = useState<number | null>(null)
  const week: WeekDay[] = query.data?.days.map((d) => ({ day: d.day, zoneIds: orderedZones(d).map((z) => z.zoneId) })) ?? []
  const counts = query.data?.customerCounts ?? []
  const nombre = (id: string) => zones.data?.find((z) => z.id === id)?.name
    ?? counts.find((c) => c.zoneId === id)?.zoneName ?? 'Zona'

  const save = useMutation({
    mutationFn: (day: WeekDay) => scheduleService.save(vehicleId,
      replaceDay(week, day.day, day.zoneIds).map(({ day: d, zoneIds }) => ({ day: d, zoneId: null, zoneIds }))),
    onSuccess: (data, day) => {
      cache.setQueryData(['vehicles', 'schedule', vehicleId], data)
      setEditing(null); setSaved(day.day)
      void cache.invalidateQueries({ queryKey: ['sessions', 'suggested-zone'] })
      void cache.invalidateQueries({ queryKey: ['route-planning', 'uncovered'] })
    },
  })

  return <Panel title="Semana del camión">
    <ErrorMessage error={query.error ?? zones.error} />
    {(query.isError || zones.isError) && <Button variant="secondary" className="self-start" onClick={() => { void query.refetch(); void zones.refetch() }}>Reintentar</Button>}
    {query.isPending && <p role="status">Cargando agenda…</p>}
    {query.data && <>
      {query.data.isSuggested && <p className="rounded bg-warning-soft p-3 text-sm text-ink">
        Todavía no está guardada: es lo que hizo el camión en las últimas semanas. Al guardar un día queda fija toda la semana.
      </p>}
      <p className="text-sm text-muted">Entre paréntesis, cuántos clientes de esa zona tiene el camión ese día. Las zonas van en el orden en que se recorren.</p>
      <ul className="flex flex-col divide-y divide-line rounded border border-line">
        {WEEKDAYS.map(({ value: day, label }) => {
          const zoneIds = week.find((w) => w.day === day)?.zoneIds ?? []
          const faltan = unscheduled(counts, day, zoneIds)
          return <li key={day} className="flex flex-col gap-2 p-3">
            {editing?.day === day
              ? <DayEditor label={label} value={editing} counts={counts} options={zones.data ?? []} nombre={nombre}
                  busy={save.isPending} error={save.error}
                  onChange={setEditing} onCancel={() => { save.reset(); setEditing(null) }} onSave={() => save.mutate(editing)} />
              : <>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                  <span className="w-24 shrink-0 font-semibold">{label}</span>
                  <span className={`min-w-0 flex-1 ${zoneIds.length ? '' : 'text-muted'}`}>
                    {zoneIds.length ? zoneIds.map((id) => zoneWithCount(nombre(id), customersFor(counts, day, id))).join(' → ') : 'No sale'}
                  </span>
                  {saved === day && <span role="status" className="text-sm text-success">Guardado</span>}
                  <Button variant="secondary" disabled={!!editing || zones.isPending} onClick={() => { setSaved(null); save.reset(); setEditing({ day, zoneIds }) }}>Cambiar</Button>
                </div>
                {faltan.length > 0 && <p className="text-sm text-warning sm:pl-28">
                  Sin agendar: {faltan.map((c) => `${c.zoneName} (${c.customers})`).join(', ')}. Esos clientes no le aparecen al chofer si no agrega la zona.
                </p>}
              </>}
          </li>
        })}
      </ul>
    </>}
  </Panel>
}

function DayEditor({ label, value, counts, options, nombre, busy, error, onChange, onCancel, onSave }: {
  label: string; value: WeekDay; counts: ScheduleCustomerCount[]; options: ZoneOption[]; nombre: (id: string) => string
  busy: boolean; error: unknown; onChange: (day: WeekDay) => void; onCancel: () => void; onSave: () => void
}) {
  const { day, zoneIds } = value
  const set = (ids: string[]) => onChange({ day, zoneIds: ids })
  const mover = (i: number, paso: -1 | 1) => { const ids = [...zoneIds]; [ids[i], ids[i + paso]] = [ids[i + paso], ids[i]]; set(ids) }
  // Primero las zonas que tienen clientes ese día: son las que de verdad hay que agendar.
  const disponibles = options.filter((z) => z.isActive && !zoneIds.includes(z.id))
    .map((z) => ({ ...z, clientes: customersFor(counts, day, z.id) }))
    .sort((a, b) => b.clientes - a.clientes || a.name.localeCompare(b.name, 'es'))

  return <fieldset disabled={busy} className="flex flex-col gap-3">
    <legend className="font-semibold">{label}</legend>
    {zoneIds.length === 0 && <p className="text-sm text-muted">Sin zonas, el camión no sale ese día.</p>}
    <ol className="flex flex-col gap-2">{zoneIds.map((id, i) => {
      const name = nombre(id)
      return <li key={id} className="flex flex-wrap items-center gap-2">
        <span className="min-w-0 flex-1">{i + 1}. {zoneWithCount(name, customersFor(counts, day, id))}</span>
        <Button type="button" variant="secondary" className="min-h-11 min-w-11" aria-label={`Subir ${name}`} disabled={i === 0} onClick={() => mover(i, -1)}>↑</Button>
        <Button type="button" variant="secondary" className="min-h-11 min-w-11" aria-label={`Bajar ${name}`} disabled={i === zoneIds.length - 1} onClick={() => mover(i, 1)}>↓</Button>
        <Button type="button" variant="danger" className="min-h-11" onClick={() => set(zoneIds.filter((z) => z !== id))}>Sacar</Button>
      </li>
    })}</ol>
    {zoneIds.length < 5
      ? <Select label="Agregar zona" value="" onChange={(e) => e.target.value && set([...zoneIds, e.target.value])}>
        <option value="">Elegí una zona</option>
        {disponibles.map((z) => <option key={z.id} value={z.id}>{z.name}{z.clientes ? ` — ${z.clientes} clientes ese día` : ''}</option>)}
      </Select>
      : <p className="text-sm text-muted">Hasta 5 zonas por día.</p>}
    <ErrorMessage error={error} />
    <div className="flex flex-wrap gap-2">
      <Button type="button" variant="danger" onClick={onCancel}>Cancelar</Button>
      <Button type="button" onClick={onSave}>{busy ? 'Guardando…' : `Guardar ${label.toLowerCase()}`}</Button>
    </div>
  </fieldset>
}
