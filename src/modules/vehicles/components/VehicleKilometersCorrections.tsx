import { useQuery } from '@tanstack/react-query'
import { ErrorMessage, formatDateTime, BUSINESS_TIME_ZONE } from '../../core'
import { vehicleService } from '../services/vehicleService'

export function VehicleKilometersCorrections({ vehicleId }: { vehicleId: string }) {
  const history = useQuery({ queryKey: ['vehicles', 'kilometers-corrections', vehicleId],
    queryFn: () => vehicleService.getKilometersCorrections(vehicleId) })
  if (history.isError) return <ErrorMessage error={history.error} />
  if (!history.data?.length) return null
  return <section className="ui-card min-w-0 p-4">
    <h2 className="font-semibold">Correcciones de kilometraje</h2>
    <ul className="mt-2 divide-y divide-line text-sm">
      {history.data.map((correction, index) => <li key={`${correction.correctedAt}-${index}`} className="py-2 break-words">
        <p className="text-muted">{formatDateTime(correction.correctedAt, BUSINESS_TIME_ZONE)}</p>
        <p className="font-medium">de {correction.previousKilometers.toLocaleString('es-AR')} a {correction.newKilometers.toLocaleString('es-AR')} km</p>
        <p className="whitespace-pre-wrap">{correction.reason}</p>
        <p className="text-muted">{correction.correctedByName ?? '—'}</p>
      </li>)}
    </ul>
  </section>
}
