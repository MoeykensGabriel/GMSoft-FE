import { useQuery } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { BUSINESS_TIME_ZONE, DataTable, ErrorMessage, LinkButton, Page, PageHeader, Select, formatDateTime } from '../../core'
import { vehicleService } from '../../vehicles'

/** Historial de lo que se bajó de un camión antes de salir: qué, cuándo y quién. */
export function RemovedLoadsView() {
  const [params, setParams] = useSearchParams()
  const vehicleId = params.get('vehiculo') ?? ''

  const vehiculos = useQuery({ queryKey: ['vehicles', 'all'], queryFn: vehicleService.listAll })
  const bajadas = useQuery({
    queryKey: ['vehicles', 'removed-loads', vehicleId],
    queryFn: () => vehicleService.listRemovedLoads(vehicleId),
    enabled: Boolean(vehicleId),
  })

  return (
    <Page className="mx-auto flex max-w-6xl flex-col gap-4 p-6">
      <PageHeader title="Cargas bajadas" description="Lo que se bajó de un camión antes de que saliera."
        actions={<LinkButton to="/panel/carga">← Volver a Carga inicial</LinkButton>} />

      <div className="ui-toolbar flex flex-wrap items-end gap-3">
        <Select label="Vehículo" name="vehicleId" value={vehicleId}
          onChange={(e) => setParams(e.target.value ? { vehiculo: e.target.value } : {}, { replace: true })}>
          <option value="">Elegí un vehículo</option>
          {vehiculos.data?.map((v) => <option key={v.id} value={v.id}>{v.name} ({v.licensePlate})</option>)}
        </Select>
      </div>

      <ErrorMessage error={vehiculos.error ?? bajadas.error} />

      {!vehicleId ? (
        <p className="text-sm text-muted">Elegí un vehículo para ver lo que se le bajó.</p>
      ) : bajadas.isPending ? (
        <p className="text-sm text-muted">Cargando...</p>
      ) : bajadas.data?.length === 0 ? (
        <p className="ui-card bg-surface p-3 text-sm text-muted">A este vehículo no se le bajó ninguna carga.</p>
      ) : bajadas.data && (
        <DataTable label="Cargas bajadas del vehículo" className="min-w-[40rem]">
          <thead><tr><th scope="col">Se bajó</th><th scope="col">Producto</th><th scope="col">Cantidad</th><th scope="col">Quién</th><th scope="col">Se había cargado</th></tr></thead>
          <tbody>{bajadas.data.map((l) => <tr key={l.id}>
            <td className="font-semibold">{formatDateTime(l.removedAt, BUSINESS_TIME_ZONE)}</td>
            <td>{l.productDetail}</td>
            <td>{l.quantity}</td>
            <td>{l.removedByUserName ?? 'Sin registrar'}</td>
            <td className="text-muted">{formatDateTime(l.loadedAt, BUSINESS_TIME_ZONE)}</td>
          </tr>)}</tbody>
        </DataTable>
      )}
    </Page>
  )
}
