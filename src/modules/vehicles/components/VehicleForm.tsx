import { useState } from 'react'
import type { FormEvent } from 'react'
import { LinkButton, Button, ErrorMessage, Field, Select, Modal } from '../../core'
import type { Vehicle, VehicleInput, VehicleType } from '../services/vehicleService'
import { requiresKilometersReason } from '../utils/kilometersCorrection'
import { vehicleTypeLabels } from '../utils/vehicleTypeLabels'

export function VehicleForm({ initial, saving, error, onSubmit }: {
  initial?: Vehicle; saving: boolean; error: unknown; onSubmit: (input: VehicleInput) => void
}) {
  const [name, setName] = useState(initial?.name ?? '')
  const [plate, setPlate] = useState(initial?.licensePlate ?? '')
  const [type, setType] = useState<VehicleType>(initial?.type ?? 'Truck')
  const [kilometers, setKilometers] = useState(String(initial?.currentKilometers ?? 0))

  const [reason, setReason] = useState('')
  const [confirmation, setConfirmation] = useState<VehicleInput | null>(null)
  const lowering = initial !== undefined && requiresKilometersReason(initial.currentKilometers, Number(kilometers))

  function submit(event: FormEvent) {
    event.preventDefault()
    if (saving) return
    const input = { name: name.trim(), licensePlate: plate.trim(), type, currentKilometers: Number(kilometers),
      ...(lowering ? { kilometersReason: reason.trim() } : {}) }
    if (lowering) {
      if (!reason.trim()) return
      setConfirmation(input)
    } else onSubmit(input)
  }

  return <form onSubmit={submit} className="ui-card p-4 flex flex-col gap-4">
    <fieldset disabled={saving} className="grid gap-4 sm:grid-cols-2">
      <Field label="Nombre del vehículo" name="name" required maxLength={100} value={name} onChange={(e) => setName(e.target.value)} />
      <Field label="Patente" name="licensePlate" required maxLength={15} value={plate} onChange={(e) => setPlate(e.target.value.toUpperCase())} />
      <Select label="Tipo de vehículo" name="type" value={type} onChange={(e) => setType(e.target.value as VehicleType)}>
        {Object.entries(vehicleTypeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
      </Select>
      <Field label="Kilómetros actuales" name="kilometers" type="number" required min={0} step="1" value={kilometers} onChange={(e) => setKilometers(e.target.value)} />
      {lowering && <div className="flex flex-col gap-1 sm:col-span-2">
        <label htmlFor="kilometers-reason" className="text-sm font-medium text-muted">Motivo</label>
        <textarea id="kilometers-reason" name="kilometersReason" className="ui-input min-w-0" rows={2}
          required maxLength={300} value={reason} onChange={(event) => setReason(event.target.value)} />
      </div>}
    </fieldset>
    <ErrorMessage error={error} />
    <div className="flex flex-wrap items-center justify-end gap-4">
      <LinkButton to="/panel/vehiculos" variant="danger">Cancelar</LinkButton>
      <Button type="submit" disabled={saving || (lowering && !reason.trim())}>{saving ? 'Guardando...' : initial ? 'Guardar vehículo' : 'Crear vehículo'}</Button>
    </div>
    {confirmation && initial && <Modal title="Corregir kilometraje" busy={saving} onClose={() => setConfirmation(null)}
      footer={<>
        <Button type="button" variant="danger" disabled={saving} onClick={() => setConfirmation(null)}>Cancelar</Button>
        <Button type="button" disabled={saving} onClick={() => { if (!saving) onSubmit(confirmation) }}>{saving ? 'Guardando...' : 'Corregir'}</Button>
      </>}>
      <p className="font-semibold">De {initial.currentKilometers.toLocaleString('es-AR')} km a {confirmation.currentKilometers.toLocaleString('es-AR')} km</p>
      <p className="whitespace-pre-wrap break-words">{confirmation.kilometersReason}</p>
      <ErrorMessage error={error} />
    </Modal>}
  </form>
}
