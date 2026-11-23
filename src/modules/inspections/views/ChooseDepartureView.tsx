import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Button, ErrorMessage, formatDateTime } from '../../core'
import { inspectionService } from '../services/inspectionService'

/** El controlador elige a qué camión se sube: solo los que ya salieron. */
export function ChooseDepartureView() {
  const departures = useQuery({ queryKey: ['inspections', 'departures'], queryFn: inspectionService.departures })
  if (departures.isPending) return <p className="text-muted">Buscando camiones en la calle...</p>
  if (departures.isError) return <div className="flex flex-col gap-3"><ErrorMessage error={departures.error} />
    <Button variant="secondary" onClick={() => departures.refetch()}>Reintentar</Button></div>
  return <section className="flex flex-col gap-3">
    <h1 className="text-xl font-semibold">¿A qué camión te subís?</h1>
    {departures.data.length === 0
      ? <div className="ui-card flex flex-col gap-3 p-4"><p>Todavía no salió ningún camión. Cuando el chofer abra su salida, aparece acá.</p>
        <Button variant="secondary" onClick={() => departures.refetch()}>Actualizar</Button></div>
      : departures.data.map((d) => <Link key={d.sessionId} to={`/control/${d.sessionId}`}
          className="ui-card flex flex-col gap-1 border-l-4 border-l-brand p-4 hover:bg-accent-soft">
          <span className="text-lg font-semibold">{d.vehicleName} <span className="text-sm font-normal text-muted">{d.licensePlate}</span></span>
          <span>Chofer: <strong>{d.driverName}</strong></span>
          <span className="text-sm text-muted">{d.zones.join(' → ')} · salió {formatDateTime(d.openedAt)}</span>
        </Link>)}
  </section>
}
