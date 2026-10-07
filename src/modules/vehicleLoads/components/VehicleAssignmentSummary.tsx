import type { DriverProfile } from '../../drivers'

interface Props {
  vehicleName: string
  licensePlate: string
  drivers: DriverProfile[]
}

export function VehicleAssignmentSummary({ vehicleName, licensePlate, drivers }: Props) {
  return <dl className="grid gap-4 ui-card bg-surface p-4 md:grid-cols-2">
    <div><dt className="text-sm text-muted">Chofer asignado</dt>
      <dd className="mt-1 font-medium">{drivers.length ? drivers.map((driver) => `${driver.firstName} ${driver.lastName}`).join(', ') : 'Sin chofer activo asignado'}</dd>
    </div>
    <div><dt className="text-sm text-muted">Vehículo seleccionado</dt><dd className="mt-1 font-medium">{vehicleName} · {licensePlate}</dd></div>
  </dl>
}
