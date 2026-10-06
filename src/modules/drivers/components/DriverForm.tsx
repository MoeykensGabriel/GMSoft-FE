import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Button, ErrorMessage, Field, Select } from '../../core'
import type { Vehicle } from '../../vehicles'
import type { DriverInput, DriverProfile } from '../services/driverService'
import { PasswordFields } from './PasswordFields'

export type DriverFormValues = DriverInput & { userName: string; password: string; email: string | null }

export function DriverForm({ initial, vehicles, saving, error, onSubmit }: {
  initial?: DriverProfile; vehicles: Vehicle[]; saving: boolean; error: unknown; onSubmit: (values: DriverFormValues) => void
}) {
  const [firstName, setFirstName] = useState(initial?.firstName ?? '')
  const [lastName, setLastName] = useState(initial?.lastName ?? '')
  const [documentNumber, setDocumentNumber] = useState(initial?.documentNumber ?? '')
  const [phone, setPhone] = useState(initial?.phone ?? '')
  const [vehicleId, setVehicleId] = useState(initial?.vehicleId ?? '')
  const [isActive, setIsActive] = useState(initial?.isActive ?? true)
  const [userName, setUserName] = useState(initial?.userName ?? '')
  const [email, setEmail] = useState(initial?.email ?? '')
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const assignedVehicleUnavailable = Boolean(vehicleId && !vehicles.some((vehicle) => vehicle.id === vehicleId))

  function submit(event: FormEvent) {
    event.preventDefault()
    if (saving || assignedVehicleUnavailable || (!initial && password !== confirmation)) return
    onSubmit({ firstName: firstName.trim(), lastName: lastName.trim(), documentNumber: documentNumber.trim(), phone: phone.trim(),
      vehicleId: vehicleId || null, isActive, userName: userName.trim(), email: email.trim() || null, password })
  }

  return <form onSubmit={submit} className="flex flex-col gap-5">
    <fieldset disabled={saving} className="flex flex-col gap-4">
      <legend className="mb-3 font-semibold">Datos del chofer</legend>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nombre" name="firstName" required maxLength={100} value={firstName} onChange={(e) => setFirstName(e.target.value)} />
        <Field label="Apellido" name="lastName" required maxLength={100} value={lastName} onChange={(e) => setLastName(e.target.value)} />
        <Field label="Documento" name="documentNumber" required maxLength={50} value={documentNumber} onChange={(e) => setDocumentNumber(e.target.value)} />
        <Field label="Teléfono" name="phone" type="tel" required maxLength={30} value={phone} onChange={(e) => setPhone(e.target.value)} />
      </div>
      <Select label="Vehículo asignado" name="vehicleId" value={vehicleId} onChange={(e) => setVehicleId(e.target.value)}>
        <option value="">Sin vehículo asignado</option>
        {assignedVehicleUnavailable && <option value={vehicleId} disabled>Vehículo anterior no disponible</option>}
        {vehicles.map((vehicle) => <option key={vehicle.id} value={vehicle.id}>{vehicle.name} · {vehicle.licensePlate}</option>)}
      </Select>
      {!vehicleId && <p className="text-sm text-neutral-600">Sin un vehículo asignado, el chofer no podrá iniciar el reparto. <Link to="/panel/vehiculos" className="underline">Administrar vehículos</Link></p>}
      {assignedVehicleUnavailable && <p role="alert" className="text-sm text-red-700">Seleccioná un vehículo disponible o quitá la asignación anterior.</p>}
      {initial && <label className="flex min-h-11 items-center gap-3"><input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />Chofer activo (puede iniciar sesión)</label>}
    </fieldset>
    <fieldset disabled={saving} className="flex flex-col gap-4 border-t border-neutral-300 pt-4">
      <legend className="font-semibold">Usuario de acceso</legend>
      <Field label="Usuario" name="userName" autoComplete="off" required={!initial} readOnly={Boolean(initial)} maxLength={50}
        pattern="[a-zA-Z0-9._\-]+" title="Letras, números, punto, guion y guion bajo, sin espacios."
        value={userName} onChange={(e) => setUserName(e.target.value)} />
      <Field label="Email (opcional)" name="email" type="email" readOnly={Boolean(initial)} maxLength={150} value={email} onChange={(e) => setEmail(e.target.value)} />
      {initial ? <p className="text-sm text-neutral-600">El usuario y el email se establecen al crear el chofer. Podés cambiar su contraseña más abajo.</p>
        : <><p className="text-sm text-neutral-600">El chofer ingresará con este usuario. Su cuenta se crea junto con la ficha.</p>
          <PasswordFields password={password} confirmation={confirmation} onPasswordChange={setPassword} onConfirmationChange={setConfirmation} /></>}
    </fieldset>
    <ErrorMessage error={error} />
    <div className="flex flex-wrap items-center justify-end gap-4">
      <Link to="/panel/choferes" className="text-sm underline">Cancelar</Link>
      <Button type="submit" disabled={saving || assignedVehicleUnavailable}>{saving ? 'Guardando...' : initial ? 'Guardar chofer' : 'Crear chofer y usuario'}</Button>
    </div>
  </form>
}
