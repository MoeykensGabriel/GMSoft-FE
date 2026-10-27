import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { orderedZones } from '../../zones'
import { Badge, BUSINESS_TIME_ZONE, Button, DataTable, ErrorMessage, Field, LinkButton, Page, PageHeader, Pagination, Panel, currentBusinessDate, formatDateTime } from '../../core'
import { sessionService } from '../services/sessionService'
import { receptionDifferences, signedDifference } from '../utils/receptionResult'
import type { ReceptionDifference } from '../utils/receptionResult'

/** YYYY-MM-DD para leer. Se parte el texto: un Date lo tomaria como medianoche UTC. */
function fechaLegible(iso: string): string {
  const [anio, mes, dia] = iso.split('-')
  return `${dia}/${mes}/${anio}`
}

/** Una línea por producto con su número: rojo si falta, ámbar si sobra; sin diferencias, un tilde verde. */
function Diferencias({ lines }: { lines: ReceptionDifference[] }) {
  if (!lines.length) return <span className="text-lg font-semibold text-success" title="Cuadra" aria-label="Cuadra">✓</span>
  return <ul className="flex flex-col gap-0.5">{lines.map((l) => <li key={l.productId} className="flex justify-between gap-3 whitespace-nowrap">
    <span>{l.productDetail}</span>
    <span className={`min-w-9 rounded px-1.5 text-center font-semibold text-white tabular-nums ${l.difference < 0 ? 'bg-danger' : 'bg-warning'}`} title={l.difference < 0 ? 'Falta' : 'Sobra'}>
      {signedDifference(l.difference)}
    </span>
  </li>)}</ul>
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
        : <DataTable label="Camiones recibidos" className="min-w-[56rem]">
          <thead><tr><th scope="col">Camión</th><th scope="col">Zonas</th><th scope="col">Vacíos</th><th scope="col">Llenos</th><th scope="col">Fecha y hora</th>
            <th scope="col" data-label=""><span className="sr-only">Acciones</span></th></tr></thead>
          <tbody>{items.map((s) => {
            const diferencias = receptionDifferences(s.stock ?? [])
            const camion = `${s.vehicleName} ${s.vehicleLicensePlate}`
            return <tr key={s.id}>
              <td><span className="font-semibold">{s.vehicleName} · {s.vehicleLicensePlate}</span>
                <span className="block text-xs text-muted">{s.driverName}</span>
                <span className="mt-1 block">{s.isSettled ? <Badge tone="success">Rendida</Badge> : <Badge tone="warning">Falta rendir</Badge>}</span></td>
              <td>{orderedZones(s).map((z) => <span key={z.zoneId} className="block">{z.zoneName}</span>)}</td>
              <td><Diferencias lines={diferencias.empty} /></td>
              <td><Diferencias lines={diferencias.full} /></td>
              <td className="whitespace-nowrap">{s.closedAt ? formatDateTime(s.closedAt, BUSINESS_TIME_ZONE) : ''}</td>
              <td><div className="flex gap-2">
                <LinkButton to={`/panel/salidas/${s.id}`} variant="secondary" className="min-h-11 min-w-11 px-0" aria-label={`Ver salida de ${camion}`} title="Ver salida">
                  <svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" />
                  </svg>
                </LinkButton>
                <LinkButton to={`/panel/salidas/${s.id}/correccion`} variant="edit" className="min-h-11 min-w-11 px-0" aria-label={`Corregir recepción de ${camion}`} title="Corregir">
                  <svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
                  </svg>
                </LinkButton>
              </div></td>
            </tr>
          })}</tbody>
        </DataTable>}
      {recibidas.data && recibidas.data.totalPages > 1 && <Pagination page={page} totalPages={recibidas.data.totalPages}
        hasPreviousPage={recibidas.data.hasPreviousPage} hasNextPage={recibidas.data.hasNextPage} onChange={setPage} />}
    </Panel>
  </Page>
}
