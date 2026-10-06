import type { DriverProfile } from '../../drivers'

interface Props {
  vehicleName: string
  licensePlate: string
  drivers: DriverProfile[]
}

export function VehicleAssignmentSummary({ vehicleName, licensePlate, drivers }: Props) {
  return <dl className="grid gap-4 rounded-md border border-neutral-300 bg-white p-4 md:grid-cols-2">
    <div><dt className="text-sm text-neutral-600">Chofer asignado</dt>
      <dd className="mt-1 font-medium">{drivers.length ? drivers.map((driver) => `${driver.firstName} ${driver.lastName}`).join(', ') : 'Sin chofer activo asignado'}</dd>
    </div>
    <div><dt className="text-sm text-neutral-600">Vehículo seleccionado</dt><dd className="mt-1 font-medium">{vehicleName} · {licensePlate}</dd></div>
  </dl>
}
