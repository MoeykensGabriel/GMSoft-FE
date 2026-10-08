import { useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Button, ErrorMessage, Field, Panel } from '../../core'
import { promotionService } from '../services/promotionService'

function SettingsForm({ initialDays }: { initialDays: number }) {
  const [days, setDays] = useState(String(initialDays))
  const [saved, setSaved] = useState(false)
  const busy = useRef(false)
  const cache = useQueryClient()
  const save = useMutation({ mutationFn: promotionService.saveSettings, retry: false })
  const value = Number(days)
  const valid = Number.isInteger(value) && value > 0 && value <= 2147483647
  return <form className="flex flex-wrap items-end gap-3" onSubmit={async (event) => {
    event.preventDefault()
    if (!valid || busy.current) return
    busy.current = true
    setSaved(false)
    try {
      const result = await save.mutateAsync(value)
      cache.setQueryData(['promotions', 'settings'], result)
      setDays(String(result.pickupDays))
      setSaved(true)
    } catch { /* Se presenta el error de la API debajo. */ }
    finally { busy.current = false }
  }}>
    <Field label="Plazo de retiro (días)" type="number" min={1} max={2147483647} step={1} required value={days}
      disabled={save.isPending} onChange={(event) => { setDays(event.target.value); setSaved(false) }} />
    <Button type="submit" disabled={!valid || save.isPending}>{save.isPending ? 'Guardando...' : 'Guardar plazo'}</Button>
    {saved && <p role="status" className="text-sm">Plazo guardado.</p>}
    <div className="w-full"><ErrorMessage error={save.error} /></div>
  </form>
}
export function PromotionSettings() {
  const settings = useQuery({ queryKey: ['promotions', 'settings'], queryFn: promotionService.settings })
  return <Panel title="Plazo de retiro">
    <p className="text-sm text-muted">Se aplica a las nuevas promociones. No modifica las fechas de retiro de las promociones ya registradas.</p>
    {settings.isPending ? <p role="status">Cargando plazo...</p> : settings.isError ? <>
      <ErrorMessage error={settings.error} /><Button variant="secondary" onClick={() => settings.refetch()}>Reintentar</Button>
    </> : <SettingsForm initialDays={settings.data.pickupDays} />}
  </Panel>
}
