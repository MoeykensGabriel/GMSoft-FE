import { useQuery } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { Badge, DataTable, ErrorMessage, LinkButton, Page, PageHeader, Panel, Select, StatTile, currentBusinessDate, formatDate } from '../../core'
import { VehicleKilometersCorrections } from '../components/VehicleKilometersCorrections'
import { vehicleService } from '../services/vehicleService'
import { kilometersReadingsKey } from '../utils/kilometersReadings'
import { kilometersStatus, kmLabel, lastDays } from '../utils/vehicleControl'

/**
 * Todo lo que se controla de un camión, en un solo lugar. Por ahora el kilometraje; más
 * adelante se suman acá el service y los vencimientos. El camión elegido queda en la
 * dirección, para volver al mismo.
 */
export function VehicleControlView() {
  const [params, setParams] = useSearchParams()
  const vehicleId = params.get('camion') ?? ''
  const vehicles = useQuery({ queryKey: ['vehicles', 'all'], queryFn: vehicleService.listAll })

  return <Page className="mx-auto flex max-w-5xl flex-col gap-5 p-4 md:p-6">
    <PageHeader title="Control de vehículos" />
    <Panel>
      <Select label="Vehículo" value={vehicleId} onChange={(e) => setParams(e.target.value ? { camion: e.target.value } : {}, { replace: true })}>
        <option value="">Elegí el vehículo</option>
        {(vehicles.data ?? []).map((v) => <option key={v.id} value={v.id}>{v.name} · {v.licensePlate}</option>)}
      </Select>
      <ErrorMessage error={vehicles.error} />
    </Panel>
    {vehicleId && <VehicleControl key={vehicleId} vehicleId={vehicleId} />}
  </Page>
}

function VehicleControl({ vehicleId }: { vehicleId: string }) {
  const vehicle = useQuery({ queryKey: ['vehicles', vehicleId], queryFn: () => vehicleService.getById(vehicleId) })
  const readings = useQuery({ queryKey: kilometersReadingsKey, queryFn: vehicleService.getPendingKilometersReadings })
  const range = lastDays(currentBusinessDate(), 30)
  const report = useQuery({ queryKey: ['vehicles', 'kilometers-report', range.from, range.to],
    queryFn: () => vehicleService.getKilometersReport(range.from, range.to) })

  if (vehicle.isError) return <ErrorMessage error={vehicle.error} />
  if (!vehicle.data) return <p role="status" className="text-muted">Cargando...</p>
  const v = vehicle.data
  const reading = readings.data?.find((r) => r.vehicleId === vehicleId)
  const status = kilometersStatus(v, Boolean(reading))
  const stats = report.data?.vehicles.find((line) => line.vehicleId === vehicleId)

  return <>
    <Panel title="Kilometraje">
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-3xl font-bold tabular-nums">{kmLabel(v.currentKilometers)}</span>
        <Badge tone={status.tone}>{status.label}</Badge>
      </div>
      {v.kilometersCheckedAt && !reading && !v.kilometersCheckPending
        && <p className="text-sm text-muted">Revisado el {formatDate(v.kilometersCheckedAt)}</p>}
      {status.detail && <p className="text-sm text-muted">{status.detail}</p>}
      {reading && <LinkButton variant="navigation" className="self-start" to="/panel/alertas">Revisar en Alertas</LinkButton>}
    </Panel>

    <Panel title="Últimos 30 días">
      <ErrorMessage error={report.error} />
      {report.isPending ? <p role="status" className="text-muted">Cargando...</p> : !stats
        ? <p className="text-sm text-muted">Sin salidas con el km revisado en estos días.</p>
        : <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatTile label="Salidas" value={stats.sessions} />
            <StatTile label="Km recorridos" value={kmLabel(stats.totalKilometers)} />
            <StatTile label="Km por salida" value={kmLabel(stats.medianPerSession)} detail={`Promedio ${kmLabel(stats.averagePerSession)}`} />
            <StatTile label="Km por día" value={kmLabel(stats.averagePerDay)} detail={`${stats.daysWorked} ${stats.daysWorked === 1 ? 'día' : 'días'}`} />
          </div>
          {(stats.zeroKilometerSessions > 0 || stats.kilometersBetweenSessions !== 0) && <div className="grid gap-3 sm:grid-cols-2">
            {stats.zeroKilometerSessions > 0 && <StatTile tone="warning" label="Salidas con 0 km" value={stats.zeroKilometerSessions} />}
            {stats.kilometersBetweenSessions !== 0 && <StatTile tone="warning" label="Km entre salidas" value={kmLabel(stats.kilometersBetweenSessions)} />}
          </div>}
          {stats.routes.length > 0 && <DataTable label="Km por recorrido" className="w-full text-sm">
            <thead><tr className="border-b border-line text-left">
              <th scope="col" className="py-2 font-medium">Recorrido</th>
              <th scope="col" className="py-2 text-right font-medium">Salidas</th>
              <th scope="col" className="py-2 text-right font-semibold">Km por salida</th>
              <th scope="col" className="py-2 text-right font-medium">Mín.</th>
              <th scope="col" className="py-2 text-right font-medium">Máx.</th>
            </tr></thead>
            <tbody>{stats.routes.map((r) => <tr key={r.route} className="border-b border-line">
              <th scope="row" className="break-words py-2 pr-2 text-left font-normal">{r.route}</th>
              <td className="py-2 text-right tabular-nums">{r.sessions}</td>
              <td className="py-2 text-right font-semibold tabular-nums">{kmLabel(r.medianPerSession)}</td>
              <td className="py-2 text-right tabular-nums">{kmLabel(r.minPerSession)}</td>
              <td className="py-2 text-right tabular-nums">{kmLabel(r.maxPerSession)}</td>
            </tr>)}</tbody>
          </DataTable>}
        </>}
    </Panel>

    <VehicleKilometersCorrections vehicleId={vehicleId} />
  </>
}
