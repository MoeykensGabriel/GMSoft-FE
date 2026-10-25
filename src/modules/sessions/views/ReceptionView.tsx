import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { zonesLabel } from '../../zones'
import { Badge, BUSINESS_TIME_ZONE, Button, DataTable, ErrorMessage, Field, LinkButton, Page, PageHeader, Pagination, Panel, currentBusinessDate, formatDateTime } from '../../core'
import { sessionService } from '../services/sessionService'
import { receptionDifferences } from '../utils/receptionResult'

/** YYYY-MM-DD para leer. Se parte el texto: un Date lo tomaria como medianoche UTC. */
function fechaLegible(iso: string): string {
  const [anio, mes, dia] = iso.split('-')
  return `${dia}/${mes}/${anio}`
}

/**
 * La tarde: arriba los camiones que hay que recibir, con el botón directo al conteo;
 * abajo los que ya se recibieron ese día y cómo quedaron (envases y plata).
 */
export function ReceptionView() {
  const hoy = currentBusinessDate()
  const [fecha, setFecha] = useState(hoy)
  const [page, setPage] = useState(1)
  const enLaCalle = useQuery({ queryKey: ['sessions', 'active-departures'], queryFn: sessionService.getActiveDepartures, refetchInterval: 60_000 })
  const recibidas = useQuery({
    queryKey: ['sessions', 'received', fecha, false, page],
    queryFn: () => sessionService.listReceivedOn(fecha, false, page),
    enabled: Boolean(fecha),
  })
  const items = (recibidas.data?.items ?? []).filter((s) => s.status === 'Closed')

  return <Page className="mx-auto flex max-w-6xl flex-col gap-5 p-6">
    <PageHeader title="Recepción" description="Recibí los camiones cuando vuelven y revisá cómo quedó cada uno." />

    <Panel title={`Para recibir${enLaCalle.data ? ` (${enLaCalle.data.length})` : ''}`}>
      <ErrorMessage error={enLaCalle.error} />
      {enLaCalle.isPending ? <p role="status">Cargando…</p>
        : !enLaCalle.data?.length ? <p className="text-sm text-muted">No hay camiones en la calle.</p>
        : <ul className="flex flex-col gap-3">{enLaCalle.data.map((d) => <li key={d.sessionId} className="ui-card flex flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="min-w-0">
            <p className="text-lg font-semibold">{d.vehicleName} · {d.vehicleLicensePlate}</p>
            <p className="text-sm text-muted">{d.driverName} · {d.zoneName} · salió {formatDateTime(d.openedAt, BUSINESS_TIME_ZONE)}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <LinkButton to={`/panel/salidas/${d.sessionId}`}>Ver salida</LinkButton>
            <LinkButton to={`/panel/salidas/${d.sessionId}/recepcion`} variant="primary" aria-label={`Recibir ${d.vehicleName} ${d.vehicleLicensePlate}`}>Recibir</LinkButton>
          </div>
        </li>)}</ul>}
    </Panel>

    <Panel title="Recibidos">
      <div className="flex flex-wrap items-end gap-3">
        <Field label="Recibidos el día" name="fecha" type="date" value={fecha} onChange={(e) => { setFecha(e.target.value); setPage(1) }} />
        {fecha !== hoy && <Button variant="secondary" onClick={() => { setFecha(hoy); setPage(1) }}>Hoy</Button>}
      </div>
      {!fecha ? <p className="text-sm text-muted">Elegí un día para ver sus recepciones.</p>
        : recibidas.isPending ? <p role="status">Cargando…</p>
        : recibidas.isError ? <div className="flex flex-col items-start gap-2"><ErrorMessage error={recibidas.error} /><Button variant="secondary" onClick={() => recibidas.refetch()}>Reintentar</Button></div>
        : !items.length ? <p className="text-sm text-muted">{fecha === hoy ? 'Todavía no se recibió ningún camión hoy.' : `No hubo recepciones el ${fechaLegible(fecha)}.`}</p>
        : <DataTable label="Camiones recibidos" className="min-w-[52rem]">
          <thead><tr><th scope="col">Camión</th><th scope="col">Recibido</th><th scope="col">Envases</th><th scope="col">Plata</th><th scope="col">Acciones</th></tr></thead>
          <tbody>{items.map((s) => {
            const diferencias = receptionDifferences(s.stock ?? [])
            return <tr key={s.id}>
              <td><span className="font-semibold">{s.vehicleName} · {s.vehicleLicensePlate}</span>
                <span className="block text-xs text-muted">{s.driverName} · {zonesLabel(s)}</span></td>
              <td>{s.closedAt ? formatDateTime(s.closedAt, BUSINESS_TIME_ZONE) : ''}</td>
              <td>{diferencias.length ? diferencias.map((d) => <span key={d} className="block text-warning">{d}</span>) : <Badge tone="success">Cuadra</Badge>}</td>
              <td>{s.isSettled ? <Badge tone="success">Rendida</Badge> : <Badge tone="warning">Falta rendir</Badge>}</td>
              <td><div className="flex flex-wrap gap-2">
                <LinkButton to={`/panel/salidas/${s.id}`}>Ver salida</LinkButton>
                <LinkButton to={`/panel/salidas/${s.id}/correccion`} variant="edit">Corregir</LinkButton>
              </div></td>
            </tr>
          })}</tbody>
        </DataTable>}
      {recibidas.data && recibidas.data.totalPages > 1 && <Pagination page={page} totalPages={recibidas.data.totalPages}
        hasPreviousPage={recibidas.data.hasPreviousPage} hasNextPage={recibidas.data.hasNextPage} onChange={setPage} />}
    </Panel>
  </Page>
}
