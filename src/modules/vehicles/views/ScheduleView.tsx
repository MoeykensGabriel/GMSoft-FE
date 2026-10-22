import { useQuery } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { ErrorMessage, Page, PageHeader, Panel, Select } from '../../core'
import { VehicleSchedulePanel } from '../components/VehicleSchedulePanel'
import { vehicleService } from '../services/vehicleService'

/**
 * La agenda de reparto: qué zonas recorre cada camión cada día y en qué orden. El
 * camión elegido queda en la dirección, para volver a la misma agenda.
 */
export function ScheduleView() {
  const [params, setParams] = useSearchParams()
  const vehicleId = params.get('camion') ?? ''
  const vehicles = useQuery({ queryKey: ['vehicles', 'all'], queryFn: vehicleService.listAll })

  return <Page className="mx-auto flex max-w-4xl flex-col gap-5 p-6">
    <PageHeader title="Agenda" description="Las zonas de cada camión para cada día, en el orden en que las recorre. Al abrir la salida vienen marcadas." />
    <Panel>
      <Select label="Camión" value={vehicleId} onChange={(e) => setParams(e.target.value ? { camion: e.target.value } : {}, { replace: true })}>
        <option value="">Elegí el camión</option>
        {(vehicles.data ?? []).map((v) => <option key={v.id} value={v.id}>{v.name} · {v.licensePlate}</option>)}
      </Select>
      <ErrorMessage error={vehicles.error} />
    </Panel>
    {vehicleId && <VehicleSchedulePanel key={vehicleId} vehicleId={vehicleId} />}
  </Page>
}
