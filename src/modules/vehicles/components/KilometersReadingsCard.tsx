import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { BUSINESS_TIME_ZONE, Button, ErrorMessage, Modal, formatDateTime } from '../../core'
import { vehicleService } from '../services/vehicleService'
import type { KilometersReading } from '../services/vehicleService'

import { kilometersReadingsKey } from '../utils/kilometersReadings'

const km = (value: number) => `${value.toLocaleString('es-AR')} km`

/**
 * Los km que leyeron los choferes en el tablero. Aceptar los deja como el km real del
 * camión; rechazar hace que se lo vuelvan a pedir en la próxima salida.
 */
export function KilometersReadingsCard() {
  const cache = useQueryClient()
  const readings = useQuery({ queryKey: kilometersReadingsKey, queryFn: vehicleService.getPendingKilometersReadings, refetchInterval: 60_000 })
  const [rejecting, setRejecting] = useState<KilometersReading | null>(null)
  const done = async () => { setRejecting(null); await cache.invalidateQueries({ queryKey: ['vehicles'] }) }
  const accept = useMutation({ mutationFn: vehicleService.acceptKilometersReading, onSuccess: done })
  const reject = useMutation({ mutationFn: vehicleService.rejectKilometersReading, onSuccess: done })
  const items = readings.data ?? []
  if (!items.length) return null
  const busy = accept.isPending || reject.isPending

  return <section className="flex min-w-0 flex-col gap-3 rounded border border-warning/40 bg-warning-soft p-4">
    <h2 className="font-semibold text-warning">Kilometraje para revisar</h2>
    <ErrorMessage error={accept.error ?? reject.error} />
    <ul className="flex flex-col gap-2">
      {items.map((r) => <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 rounded border border-line bg-surface p-3">
        <div className="min-w-0">
          <p className="font-semibold">{r.vehicleName} · {r.licensePlate}</p>
          <p className="text-2xl font-bold tabular-nums">{km(r.kilometers)}</p>
          <p className="text-sm text-muted">{r.driverName} · {formatDateTime(r.readAt, BUSINESS_TIME_ZONE)} · antes {km(r.previousKilometers)}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="danger" disabled={busy} onClick={() => setRejecting(r)}>Rechazar</Button>
          <Button disabled={busy} onClick={() => accept.mutate(r.id)}>Aceptar</Button>
        </div>
      </li>)}
    </ul>
    {rejecting && <Modal title="Rechazar kilometraje" busy={reject.isPending} onClose={() => { if (!reject.isPending) setRejecting(null) }} footer={<>
      <Button type="button" variant="secondary" disabled={reject.isPending} onClick={() => setRejecting(null)}>Volver</Button>
      <Button type="button" variant="danger" disabled={reject.isPending} onClick={() => reject.mutate(rejecting.id)}>Rechazar</Button>
    </>}>
      <p className="text-lg font-semibold">{rejecting.vehicleName}: {km(rejecting.kilometers)}</p>
      <p>En la próxima salida se le pide al chofer que lo vuelva a leer del tablero.</p>
    </Modal>}
  </section>
}
