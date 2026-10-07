import { useState } from 'react'
import type { FormEvent } from 'react'
import { LinkButton, Button, ErrorMessage, Field, Select } from '../../core'
import type { Vehicle, VehicleInput, VehicleType } from '../services/vehicleService'
import { vehicleTypeLabels } from '../utils/vehicleTypeLabels'

export function VehicleForm({ initial, saving, error, onSubmit }: {
  initial?: Vehicle; saving: boolean; error: unknown; onSubmit: (input: VehicleInput) => void
}) {
  const [name, setName] = useState(initial?.name ?? '')
  const [plate, setPlate] = useState(initial?.licensePlate ?? '')
  const [type, setType] = useState<VehicleType>(initial?.type ?? 'Truck')
  const [kilometers, setKilometers] = useState(String(initial?.currentKilometers ?? 0))

  function submit(event: FormEvent) {
    event.preventDefault()
    if (saving) return
    onSubmit({ name: name.trim(), licensePlate: plate.trim(), type, currentKilometers: Number(kilometers) })
  }

  return <form onSubmit={submit} className="ui-card p-4 flex flex-col gap-4">
    <fieldset disabled={saving} className="grid gap-4 sm:grid-cols-2">
      <Field label="Nombre del vehículo" name="name" required maxLength={100} value={name} onChange={(e) => setName(e.target.value)} />
      <Field label="Patente" name="licensePlate" required maxLength={15} value={plate} onChange={(e) => setPlate(e.target.value.toUpperCase())} />
      <Select label="Tipo de vehículo" name="type" value={type} onChange={(e) => setType(e.target.value as VehicleType)}>
        {Object.entries(vehicleTypeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
      </Select>
      <Field label="Kilómetros actuales" name="kilometers" type="number" required min={initial?.currentKilometers ?? 0} step="1" value={kilometers} onChange={(e) => setKilometers(e.target.value)} />
    </fieldset>
    {initial && <p className="text-sm text-muted">El kilometraje debe ser igual o mayor al registrado: {initial.currentKilometers} km.</p>}
    <ErrorMessage error={error} />
    <div className="flex flex-wrap items-center justify-end gap-4">
      <LinkButton to="/panel/vehiculos" variant="danger">Cancelar</LinkButton>
      <Button type="submit" disabled={saving}>{saving ? 'Guardando...' : initial ? 'Guardar vehículo' : 'Crear vehículo'}</Button>
    </div>
  </form>
}
