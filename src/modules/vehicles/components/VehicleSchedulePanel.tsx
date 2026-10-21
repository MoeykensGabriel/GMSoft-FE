import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Button, ErrorMessage, Modal, Panel, WEEKDAYS } from '../../core'
import { scheduleService } from '../../schedule'
import { zoneService, OrderedZoneEditor, orderedZones } from '../../zones'

export function VehicleSchedulePanel({ vehicleId }: { vehicleId: string }) {
  const cache = useQueryClient()
  const query = useQuery({ queryKey: ['vehicles', 'schedule', vehicleId], queryFn: () => scheduleService.get(vehicleId) })
  const zones = useQuery({ queryKey: ['zones', 'schedule-options'], queryFn: zoneService.listAll })
  const [draft, setDraft] = useState<{ day: number; zoneIds: string[] }[] | null>(null)
  const [confirm, setConfirm] = useState(false)
  const [saved, setSaved] = useState(false)
  const days = draft ?? query.data?.days.map((day) => ({ day: day.day, zoneIds: orderedZones(day).map((zone) => zone.zoneId) })) ?? []
  const save = useMutation({
    mutationFn: () => scheduleService.save(vehicleId, days.map(({ day, zoneIds }) => ({ day, zoneId: null, zoneIds }))),
    onSuccess: (data) => {
      cache.setQueryData(['vehicles', 'schedule', vehicleId], data)
      setDraft(null); setConfirm(false); setSaved(true)
      void cache.invalidateQueries({ queryKey: ['sessions', 'suggested-zone'] })
      void cache.invalidateQueries({ queryKey: ['route-planning', 'uncovered'] })
    },
  })
  return <Panel title="Agenda semanal">
    <ErrorMessage error={query.error ?? zones.error} />
    {(query.isError || zones.isError) && <Button variant="secondary" onClick={() => { void query.refetch(); void zones.refetch() }}>Reintentar</Button>}
    {query.isPending ? <p>Cargando agenda…</p> : query.data && <div className="flex flex-col gap-4">
      {query.data.isSuggested && <p>Sugerida a partir de sus últimas salidas</p>}
      <p className="text-sm text-muted">Es una guía: siempre se puede salir o guardar clientes en otra zona.</p>
      <div className="grid gap-4 sm:grid-cols-2">{WEEKDAYS.map(({ value, label }) => <OrderedZoneEditor key={value} label={`${label} (sin zonas = no sale)`} disabled={save.isPending} value={days.find((day) => day.day === value)?.zoneIds ?? []} options={zones.data ?? []}
        onChange={(zoneIds) => { setSaved(false); setDraft(WEEKDAYS.map(({ value: day }) => ({ day, zoneIds: day === value ? zoneIds : days.find((item) => item.day === day)?.zoneIds ?? [] }))) }} />)}</div>
      {saved && <p role="status">Agenda guardada.</p>}
      <Button className="self-start" disabled={save.isPending || zones.isPending || zones.isError} onClick={() => { save.reset(); setConfirm(true) }}>{query.data.isConfigured ? 'Guardar cambios' : 'Guardar agenda'}</Button>
    </div>}
    {confirm && <Modal title="Confirmar agenda semanal" busy={save.isPending} onClose={() => setConfirm(false)} footer={<>
      <Button variant="danger" disabled={save.isPending} onClick={() => setConfirm(false)}>Cancelar</Button>
      <Button disabled={save.isPending} onClick={() => save.mutate()}>{save.isPending ? 'Guardando…' : 'Confirmar agenda'}</Button>
    </>}>
      <ul>{days.map((day) => <li key={day.day}>{WEEKDAYS.find((item) => item.value === day.day)?.label}: {day.zoneIds.map((id) => zones.data?.find((zone) => zone.id === id)?.name ?? 'Zona actual').join(' → ') || 'No sale'}</li>)}</ul>
      <ErrorMessage error={save.error} />
    </Modal>}
  </Panel>
}
