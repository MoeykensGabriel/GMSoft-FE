import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Button, ErrorMessage, Modal, Panel, Select, WEEKDAYS } from '../../core'
import { scheduleService } from '../../schedule'
import { zoneService } from '../../zones'

export function VehicleSchedulePanel({ vehicleId }: { vehicleId: string }) {
  const cache = useQueryClient()
  const query = useQuery({ queryKey: ['vehicles', 'schedule', vehicleId], queryFn: () => scheduleService.get(vehicleId) })
  const zones = useQuery({ queryKey: ['zones', 'schedule-options'], queryFn: zoneService.listAll })
  const [draft, setDraft] = useState<{ day: number; zoneId: string | null }[] | null>(null)
  const [confirm, setConfirm] = useState(false)
  const [saved, setSaved] = useState(false)
  const days = draft ?? query.data?.days ?? []
  const save = useMutation({
    mutationFn: () => scheduleService.save(vehicleId, days.map(({ day, zoneId }) => ({ day, zoneId }))),
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
      <div className="grid gap-3 sm:grid-cols-2">{WEEKDAYS.map(({ value, label }) => <Select key={value} label={label} disabled={save.isPending} value={days.find((day) => day.day === value)?.zoneId ?? ''}
        onChange={(event) => { setSaved(false); setDraft(days.map((day) => day.day === value ? { ...day, zoneId: event.target.value || null } : day)) }}>
        <option value="">No sale</option>
        {days.find((day) => day.day === value)?.zoneId && !zones.data?.some((zone) => zone.isActive && zone.id === days.find((day) => day.day === value)?.zoneId) && <option value={days.find((day) => day.day === value)!.zoneId!}>Zona actual</option>}
        {zones.data?.filter((zone) => zone.isActive).map((zone) => <option key={zone.id} value={zone.id}>{zone.name}</option>)}
      </Select>)}</div>
      {saved && <p role="status">Agenda guardada.</p>}
      <Button className="self-start" disabled={save.isPending || zones.isPending || zones.isError} onClick={() => { save.reset(); setConfirm(true) }}>{query.data.isConfigured ? 'Guardar cambios' : 'Guardar agenda'}</Button>
    </div>}
    {confirm && <Modal title="Confirmar agenda semanal" busy={save.isPending} onClose={() => setConfirm(false)} footer={<>
      <Button variant="danger" disabled={save.isPending} onClick={() => setConfirm(false)}>Cancelar</Button>
      <Button disabled={save.isPending} onClick={() => save.mutate()}>{save.isPending ? 'Guardando…' : 'Confirmar agenda'}</Button>
    </>}>
      <ul>{days.map((day) => <li key={day.day}>{WEEKDAYS.find((item) => item.value === day.day)?.label}: {day.zoneId ? zones.data?.find((zone) => zone.id === day.zoneId)?.name ?? 'Zona actual' : 'No sale'}</li>)}</ul>
      <ErrorMessage error={save.error} />
    </Modal>}
  </Panel>
}
