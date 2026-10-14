import { useState } from 'react'
import type { ChangeEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Button, ErrorMessage, Field, Panel } from '../../core'
import { customerService } from '../services/customerService'
import type { ActivitySettings } from '../services/customerService'

const SETTINGS_KEY = ['customer-activity', 'settings'] as const

function SettingsForm({ initial }: { initial: ActivitySettings }) {
  const [red, setRed] = useState(String(initial.redAfterMissedWeeks))
  const [black, setBlack] = useState(String(initial.blackAfterMissedWeeks))
  const [saved, setSaved] = useState(false)
  const cache = useQueryClient()
  const save = useMutation({
    mutationFn: () => customerService.saveActivitySettings(Number(red), Number(black)),
    retry: false,
    onSuccess: async (result) => {
      cache.setQueryData(SETTINGS_KEY, result)
      // Los colores del listado de clientes dependen de estos umbrales.
      await cache.invalidateQueries({ queryKey: ['customers'] })
      setSaved(true)
    },
  })
  const r = Number(red)
  const b = Number(black)
  const valid = Number.isInteger(r) && Number.isInteger(b) && r >= 1 && b <= 52 && b > r
  const edit = (set: (v: string) => void) => (event: ChangeEvent<HTMLInputElement>) => { set(event.target.value); setSaved(false) }

  return <form className="flex flex-wrap items-end gap-3" onSubmit={(event) => { event.preventDefault(); if (valid && !save.isPending) save.mutate() }}>
    <Field label="Rojo desde (semanas sin comprar)" type="number" min={1} max={51} step={1} required value={red}
      disabled={save.isPending} onChange={edit(setRed)} />
    <Field label="Negro desde (semanas sin comprar)" type="number" min={2} max={52} step={1} required value={black}
      disabled={save.isPending} onChange={edit(setBlack)} />
    <Button type="submit" disabled={!valid || save.isPending}>{save.isPending ? 'Guardando...' : 'Guardar umbrales'}</Button>
    {saved && <p role="status" className="text-sm">Umbrales guardados.</p>}
    {!valid && <p className="w-full text-sm text-danger">El negro tiene que ser mayor que el rojo, entre 1 y 52 semanas.</p>}
    <div className="w-full"><ErrorMessage error={save.error} /></div>
  </form>
}

/** Cuántas semanas sin comprar marcan a un cliente en rojo y en negro. */
export function ActivitySettingsPanel() {
  const settings = useQuery({ queryKey: SETTINGS_KEY, queryFn: customerService.activitySettings })
  return <Panel title="Actividad de clientes">
    <p className="text-sm text-muted">
      Cuentan las semanas en que el camión pasó y el cliente no compró. Una semana sin reparto no cuenta.
      {settings.data?.isDefault && ' Ahora se usan los valores de fábrica.'}
    </p>
    {settings.isPending ? <p role="status">Cargando umbrales...</p> : settings.isError ? <>
      <ErrorMessage error={settings.error} /><Button variant="secondary" onClick={() => settings.refetch()}>Reintentar</Button>
    </> : <SettingsForm initial={settings.data} />}
  </Panel>
}
