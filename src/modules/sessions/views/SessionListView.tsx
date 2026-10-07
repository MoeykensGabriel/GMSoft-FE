import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Badge, DataTable, LinkButton, BUSINESS_TIME_ZONE, Button, ErrorMessage, Field, Pagination, currentBusinessDate, formatDateTime, Page, PageHeader } from '../../core'
import { sessionService } from '../services/sessionService'

/** YYYY-MM-DD para leer. Se parte el texto: un Date lo tomaria como medianoche UTC. */
function fechaLegible(iso: string): string {
  const [anio, mes, dia] = iso.split('-')

  return `${dia}/${mes}/${anio}`
}

/**
 * Las recepciones del dia: por defecto, los camiones que se recibieron hoy.
 *
 * Se filtra por cuando se recibio y no por cuando salio: una salida de ayer recibida
 * hoy es trabajo de hoy. Mirando hoy se suman arriba las que siguen en la calle,
 * porque desde aca se entra a recibirlas.
 */
export function SessionListView() {
  const hoy = currentBusinessDate()
  const [fecha, setFecha] = useState(hoy)
  const [page, setPage] = useState(1)
  const esHoy = fecha === hoy

  const salidas = useQuery({
    queryKey: ['sessions', 'received', fecha, esHoy, page],
    queryFn: () => sessionService.listReceivedOn(fecha, esHoy, page),
    enabled: Boolean(fecha),
  })

  const items = salidas.data?.items ?? []

  return (
    <Page className="mx-auto flex max-w-6xl flex-col gap-4 p-6">
      <PageHeader title={<>Salidas de reparto</>} />

      <div className="ui-toolbar flex flex-wrap items-end gap-3">
        <Field
          label="Recibidas el día"
          name="fecha"
          type="date"
          value={fecha}
          onChange={(e) => { setFecha(e.target.value); setPage(1) }}
        />
        {!esHoy && <Button variant="secondary" onClick={() => { setFecha(hoy); setPage(1) }}>Hoy</Button>}
      </div>

      {!fecha ? (
        <p className="text-sm text-muted">Elegí un día para ver sus recepciones.</p>
      ) : salidas.isPending ? (
        <p className="text-sm text-muted">Cargando...</p>
      ) : salidas.isError ? (
        <div className="flex flex-col items-start gap-2">
          <ErrorMessage error={salidas.error} />
          <Button variant="secondary" onClick={() => salidas.refetch()}>Reintentar</Button>
        </div>
      ) : (
        <>
          {!items.some((s) => s.status === 'Closed') && (
            <p className="ui-card bg-surface p-3 text-sm text-muted">
              {esHoy ? 'Todavía no hubo recepciones hoy.' : `No hubo recepciones el ${fechaLegible(fecha)}.`}
            </p>
          )}

          {items.length > 0 && <DataTable label="Salidas y recepciones del día" className="min-w-[50rem]">
            <thead><tr><th scope="col">Chofer</th><th scope="col">Camión / zona</th><th scope="col">Salida</th><th scope="col">Recepción</th><th scope="col">Estado</th><th scope="col">Acciones</th></tr></thead>
            <tbody>{items.map((s) => <tr key={s.id}>
              <td className="font-semibold">{s.driverName}</td><td>{s.vehicleLicensePlate}<span className="block text-xs text-muted">{s.zoneName}</span></td>
              <td>{formatDateTime(s.openedAt, BUSINESS_TIME_ZONE)}</td><td>{s.closedAt ? formatDateTime(s.closedAt, BUSINESS_TIME_ZONE) : 'Pendiente'}</td>
              <td><Badge tone={s.status === 'Open' ? 'info' : 'neutral'}>{s.status === 'Open' ? 'En la calle' : 'Recibida'}</Badge></td>
              <td><LinkButton to={`/panel/salidas/${s.id}`} aria-label={`Ver salida de ${s.driverName}`}>Ver salida</LinkButton></td>
            </tr>)}</tbody>
          </DataTable>}

          {salidas.data.totalPages > 1 && (
            <Pagination
              page={page}
              totalPages={salidas.data.totalPages}
              hasPreviousPage={salidas.data.hasPreviousPage}
              hasNextPage={salidas.data.hasNextPage}
              onChange={setPage}
            />
          )}
        </>
      )}
    </Page>
  )
}
