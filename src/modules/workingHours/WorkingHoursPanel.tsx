import { useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ApiError, Button, ErrorMessage, Field, Modal, Panel } from '../core'
import type { WorkingDay, WorkingHours } from './types'
import { dayNames, draftDays, normalizeFieldErrors, validateDays, workingHoursBody } from './utils'
import { saveWorkingHours, workingHoursQuery } from './service'

function HoursForm({ initial }: { initial: WorkingHours }) {
  const cache = useQueryClient()
  const [days, setDays] = useState(() => draftDays(initial))
  const [configured, setConfigured] = useState(initial.isConfigured)
  const [review, setReview] = useState(false)
  const [saved, setSaved] = useState(false)
  const busy = useRef(false)
  const save = useMutation({ mutationFn: saveWorkingHours, retry: false })
  const localErrors = validateDays(days)
  const serverErrors = normalizeFieldErrors(save.error instanceof ApiError ? save.error.errors : undefined)
  const errorFor = (key: string) => localErrors[key] ?? serverErrors[key.toLowerCase()]
  function change(index: number, patch: Partial<WorkingDay>) {
    setDays((rows) => rows.map((row, i) => i === index ? { ...row, ...patch } : row))
    setSaved(false)
    save.reset()
  }
  async function confirm() {
    if (busy.current || Object.keys(localErrors).length) return
    busy.current = true
    try {
      const result = await save.mutateAsync(workingHoursBody(days))
      cache.setQueryData(workingHoursQuery.queryKey, result)
      setDays(draftDays(result)); setConfigured(result.isConfigured); setSaved(true); setReview(false)
    } catch { setReview(false) }
    finally { busy.current = false }
  }
  return <>
    {!configured && <p role="status" className="rounded border border-warning/40 bg-warning-soft p-3 text-warning">No hay horario cargado: por eso no hay restricciones. Estos valores son sugeridos y no se guardan hasta que confirmes.</p>}
    <p className="text-sm text-muted">Horas de Argentina (UTC-3). El cierre no está incluido. Si dejás vacío el límite para abrir salidas, se usa el cierre. Una semana sin días laborables bloquea las operaciones restringidas todos los días.</p>
    <form className="flex flex-col gap-4" onSubmit={(event) => { event.preventDefault(); if (!Object.keys(localErrors).length) setReview(true) }}>
      <fieldset disabled={save.isPending || review} className="flex flex-col gap-3">
        {days.map((day, index) => <fieldset key={day.dayOfWeek} className="rounded border border-line p-3">
          <legend className="px-1 font-semibold text-brand">{dayNames[day.dayOfWeek - 1]}</legend>
          <div className="grid items-start gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <label className="flex min-h-11 items-center gap-2 text-sm font-medium">
              <input type="checkbox" role="switch" className="peer sr-only" aria-label={`${dayNames[day.dayOfWeek - 1]}: se trabaja`} checked={day.isWorkingDay}
                onChange={(event) => change(index, event.target.checked
                  ? { isWorkingDay: true, from: '08:00', until: day.dayOfWeek === 6 ? '13:00' : '18:00' }
                  : { isWorkingDay: false, from: null, until: null, openingCutoff: null })} />
              <span aria-hidden="true" className="relative h-6 w-10 shrink-0 rounded-full bg-line transition-colors after:absolute after:left-1 after:top-1 after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-transform peer-checked:bg-brand peer-checked:after:translate-x-4 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent" />
              Se trabaja
            </label>
            {(['from', 'until', 'openingCutoff'] as const).map((field) => <Field key={field}
              label={field === 'from' ? 'Desde' : field === 'until' ? 'Hasta' : 'Límite para abrir salidas (opcional)'}
              aria-label={`${dayNames[day.dayOfWeek - 1]}: ${field === 'from' ? 'desde' : field === 'until' ? 'hasta' : 'límite para abrir salidas'}`}
              type="time" step={60} required={day.isWorkingDay && field !== 'openingCutoff'} disabled={!day.isWorkingDay}
              value={day[field] ?? ''} error={errorFor(`days[${index}].${field}`)}
              onChange={(event) => change(index, { [field]: event.target.value || null })} />)}
          </div>
          {errorFor(`days[${index}].isWorkingDay`) && <p role="alert" className="text-sm text-danger">{errorFor(`days[${index}].isWorkingDay`)}</p>}
        </fieldset>)}
      </fieldset>
      {errorFor('days') && <p role="alert" className="text-danger">{errorFor('days')}</p>}
      <ErrorMessage error={save.error} />
      {saved && <p role="status">Horario laboral guardado.</p>}
      <Button type="submit" className="self-end" disabled={save.isPending || review || Boolean(Object.keys(localErrors).length)}>Guardar horario</Button>
    </form>
    {review && <Modal title="Confirmar horario laboral" busy={save.isPending} onClose={() => setReview(false)} footer={<>
      <Button variant="danger" disabled={save.isPending} onClick={() => setReview(false)}>Cancelar</Button>
      <Button disabled={save.isPending} onClick={() => void confirm()}>{save.isPending ? 'Guardando...' : 'Confirmar horario'}</Button>
    </>}>
      <p>Este horario se aplica a las próximas operaciones de toda la empresa. Las marcas de operaciones anteriores se conservan.</p>
      <ul className="space-y-2">{days.map((day) => <li key={day.dayOfWeek}><strong>{dayNames[day.dayOfWeek - 1]}:</strong> {day.isWorkingDay ? `${day.from} a ${day.until} · Límite para abrir salidas: ${day.openingCutoff || day.until}` : 'No laborable'}</li>)}</ul>
    </Modal>}
  </>
}
export function WorkingHoursPanel() {
  const hours = useQuery(workingHoursQuery)
  return <Panel title="Horario laboral">
    {hours.isPending ? <p role="status">Cargando horario...</p> : hours.isError ? <>
      <ErrorMessage error={hours.error} /><Button variant="secondary" onClick={() => void hours.refetch()}>Reintentar</Button>
    </> : <HoursForm initial={hours.data} />}
  </Panel>
}
