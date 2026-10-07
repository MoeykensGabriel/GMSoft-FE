import { useQuery } from '@tanstack/react-query'
import { Button, ErrorMessage, Panel, formatDateTime } from '../../core'
import { sessionService } from '../services/sessionService'
import { ActiveDepartureSummary } from './ActiveDepartureSummary'

/** Card independiente que se puede componer con otros resúmenes en Home. */
export function ActiveDeparturesCard() {
  const departures = useQuery({
    queryKey: ['sessions', 'active-departures'], queryFn: sessionService.getActiveDepartures,
    refetchInterval: 60_000, refetchOnWindowFocus: true,
  })
  return <Panel title={`Camiones en la calle${departures.data ? ` (${departures.data.length})` : ''}`}
    actions={<Button variant="secondary" disabled={departures.isFetching} onClick={() => departures.refetch()}>
        {departures.isFetching ? 'Actualizando…' : 'Actualizar'}
      </Button>}>
    <p className="mt-2 text-sm text-muted">Productos llenos con los que empezó cada salida.</p>
    {departures.isPending && <p role="status" className="mt-4">Cargando camiones…</p>}
    {departures.isError && <div className="mt-4"><ErrorMessage error={departures.error} /><p className="text-sm">Usá Actualizar para reintentar.</p></div>}
    {departures.data && <>
      {departures.data.length === 0 ? <p className="mt-4 text-sm">No hay camiones en reparto.</p>
        : <div className="mt-4 grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {departures.data.map((departure) => <ActiveDepartureSummary key={departure.sessionId} departure={departure} />)}
        </div>}
      <p className="mt-4 text-xs text-muted">Última actualización: {formatDateTime(new Date(departures.dataUpdatedAt), 'America/Argentina/Buenos_Aires')}{departures.isError ? ' · Datos anteriores' : ''}</p>
    </>}
  </Panel>
}
