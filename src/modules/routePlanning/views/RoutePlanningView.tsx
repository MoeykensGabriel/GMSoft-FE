import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Button, ErrorMessage, Page, PageHeader, Select, WEEKDAYS } from '../../core'
import { vehicleService } from '../../vehicles'
import type { Vehicle } from '../../vehicles'
import { zoneService } from '../../zones'
import { RouteEditor } from '../components/RouteEditor'
import { routePlanningKey, routePlanningService } from '../services/routePlanningService'
import type { RouteFilters } from '../types'

export function RoutePlanningView() {
  const [filters, setFilters] = useState<RouteFilters>({ vehicleId: '', zoneId: '', day: 0 })
  const [dirty, setDirty] = useState(false)
  const [busy, setBusy] = useState(false)
  const vehicles = useQuery({ queryKey: ['route-planning', 'vehicle-options'], queryFn: vehicleService.listAll })
  const zones = useQuery({ queryKey: ['route-planning', 'zone-options'], queryFn: zoneService.listAll })
  const ready = !!(filters.vehicleId && filters.zoneId && filters.day)

  function changeFilters(next: RouteFilters) {
    if (busy || (dirty && !window.confirm('Tenés cambios sin guardar. Si cambiás los filtros, se van a descartar. ¿Querés continuar?'))) return
    setDirty(false)
    setFilters(next)
  }

  return <Page className="flex min-w-0 flex-col gap-5 p-6">
    <PageHeader title="Recorridos" description="Organizá el orden, los días de visita y el camión de los clientes. Los cambios se aplican todos juntos al guardar." />
    {vehicles.isError && <div><ErrorMessage error={vehicles.error} /><Button variant="secondary" onClick={() => vehicles.refetch()}>Reintentar camiones</Button></div>}
    {zones.isError && <div><ErrorMessage error={zones.error} /><Button variant="secondary" onClick={() => zones.refetch()}>Reintentar zonas</Button></div>}
    <div className="ui-toolbar flex flex-col gap-4">
      <div className="grid gap-3 md:grid-cols-2">
        <Select label="Camión" value={filters.vehicleId} disabled={busy || vehicles.isPending}
          onChange={(event) => changeFilters({ ...filters, vehicleId: event.target.value })}>
          <option value="">{vehicles.isPending ? 'Cargando camiones…' : 'Elegí un camión'}</option>
          {vehicles.data?.map((vehicle) => <option key={vehicle.id} value={vehicle.id}>{vehicle.name} · {vehicle.licensePlate}</option>)}
        </Select>
        <Select label="Zona" value={filters.zoneId} disabled={busy || zones.isPending}
          onChange={(event) => changeFilters({ ...filters, zoneId: event.target.value })}>
          <option value="">{zones.isPending ? 'Cargando zonas…' : 'Elegí una zona'}</option>
          {zones.data?.map((zone) => <option key={zone.id} value={zone.id}>{zone.name}{zone.isActive ? '' : ' (inactiva)'}</option>)}
        </Select>
      </div>
      <fieldset disabled={busy} className="flex flex-wrap gap-2">
        <legend className="mb-2 text-sm font-medium text-muted">Día de visita</legend>
        {WEEKDAYS.map((day) => <label key={day.value} className="ui-choice flex min-h-11 cursor-pointer items-center gap-2 px-3 py-2 text-sm">
          <input type="radio" name="route-day" value={day.value} checked={filters.day === day.value}
            onChange={() => changeFilters({ ...filters, day: day.value })} />{day.label}
        </label>)}
      </fieldset>
    </div>
    {!ready ? <p>Elegí camión, zona y día para ver el recorrido</p>
      : <RouteWorkspace key={`${filters.vehicleId}/${filters.zoneId}/${filters.day}`} filters={filters}
        vehicles={vehicles.data ?? []} onDirty={setDirty} onBusy={setBusy} />}
  </Page>
}

function RouteWorkspace({ filters, vehicles, onDirty, onBusy }: {
  filters: RouteFilters; vehicles: Vehicle[]; onDirty: (value: boolean) => void; onBusy: (value: boolean) => void
}) {
  const client = useQueryClient()
  const query = useQuery({
    queryKey: routePlanningKey(filters), queryFn: () => routePlanningService.get(filters),
    staleTime: Infinity, gcTime: 0, refetchOnWindowFocus: false, refetchOnReconnect: false,
    refetchOnMount: 'always',
  })
  if (!query.data) {
    if (query.isError) return <div><ErrorMessage error={query.error} />
      <Button variant="secondary" onClick={() => query.refetch()}>Reintentar</Button></div>
    return <p role="status">Cargando recorrido…</p>
  }
  return <RouteEditor initial={query.data} filters={filters} vehicles={vehicles} onDirty={onDirty} onBusy={onBusy}
    onSaved={(snapshot) => {
      client.setQueryData(routePlanningKey(filters), snapshot)
      void client.invalidateQueries({ queryKey: ['customers'] })
      // Other day/truck lists can share customers, but must never replace this editor's draft.
      void client.invalidateQueries({ queryKey: ['route-planning', 'list'], refetchType: 'none' })
    }}
    reload={async () => {
      const result = await query.refetch()
      if (result.error) throw result.error
      return result.data!
    }} />
}
