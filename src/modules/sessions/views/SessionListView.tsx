import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { BUSINESS_TIME_ZONE, Button, ErrorMessage, Field, Pagination, currentBusinessDate, formatDateTime } from '../../core'
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
    <main className="mx-auto flex max-w-6xl flex-col gap-4 p-6">
      <h1 className="text-xl font-semibold text-neutral-900">Salidas de reparto</h1>

      <div className="flex flex-wrap items-end gap-2">
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
        <p className="text-sm text-neutral-500">Elegí un día para ver sus recepciones.</p>
      ) : salidas.isPending ? (
        <p className="text-sm text-neutral-500">Cargando...</p>
      ) : salidas.isError ? (
        <div className="flex flex-col items-start gap-2">
          <ErrorMessage error={salidas.error} />
          <Button variant="secondary" onClick={() => salidas.refetch()}>Reintentar</Button>
        </div>
      ) : (
        <>
          {!items.some((s) => s.status === 'Closed') && (
            <p className="rounded-md border border-neutral-200 bg-white p-3 text-sm text-neutral-600">
              {esHoy ? 'Todavía no hubo recepciones hoy.' : `No hubo recepciones el ${fechaLegible(fecha)}.`}
            </p>
          )}

          <ul className="flex flex-col gap-2">
            {items.map((s) => (
              <li key={s.id}>
                <Link
                  to={`/panel/salidas/${s.id}`}
                  className="flex items-center justify-between gap-3 rounded-md border border-neutral-200 bg-white px-3 py-3 hover:bg-neutral-50"
                >
                  <div>
                    <p className="text-sm font-medium text-neutral-900">
                      {s.driverName} · {s.zoneName}
                    </p>
                    <p className="text-xs text-neutral-500">
                      {s.vehicleLicensePlate} · Salió {formatDateTime(s.openedAt, BUSINESS_TIME_ZONE)}
                      {s.closedAt && ` · Recibida ${formatDateTime(s.closedAt, BUSINESS_TIME_ZONE)}`}
                    </p>
                  </div>

                  <span
                    className={`shrink-0 rounded-full border px-2 py-0.5 text-xs font-medium ${
                      s.status === 'Open'
                        ? 'border-neutral-900 bg-neutral-900 text-white'
                        : 'border-neutral-300 bg-white text-neutral-700'
                    }`}
                  >
                    {s.status === 'Open' ? 'En la calle' : 'Recibida'}
                  </span>
                </Link>
              </li>
            ))}
          </ul>

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
    </main>
  )
}
