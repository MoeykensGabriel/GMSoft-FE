import { useState } from 'react'
import type { FormEvent } from 'react'
import { LinkButton, Button, Field, Select, Textarea, ErrorMessage, currentBusinessWeekday } from '../../core'
import type { Vehicle } from '../../vehicles'
import type { Zone } from '../../zones'
import type { Customer, CustomerInput } from '../services/customerService'
import { VisitDaysField } from './VisitDaysField'

interface Props {
  initial?: Customer
  zones: Zone[]
  vehicles: Vehicle[]
  saving: boolean
  error: unknown
  onSave: (input: CustomerInput) => void
}

export function CustomerForm({ initial, zones, vehicles, saving, error, onSave }: Props) {
  const [input, setInput] = useState<CustomerInput>(() => ({
    businessName: initial?.businessName ?? '', contactName: initial?.contactName ?? '',
    phone: initial?.phone ?? '', address: initial?.address ?? '', email: initial?.email ?? '',
    zoneId: initial?.zoneId ?? '', notes: initial?.notes ?? '',
    vehicleId: initial?.vehicleId ?? '',
    visitDays: initial ? initial.visitDays ?? [] : [currentBusinessWeekday()], isActive: initial?.isActive ?? true,
  }))
  const [missingDays, setMissingDays] = useState(false)
  function submit(event: FormEvent) {
    event.preventDefault()
    if (saving) return
    setMissingDays(input.visitDays.length === 0)
    if (!input.visitDays.length) return
    onSave({ ...input, contactName: input.contactName.trim(), phone: input.phone.trim(), address: input.address.trim(),
      businessName: input.businessName?.trim() || null, email: input.email?.trim() || null, notes: input.notes?.trim() || null })
  }
  return <form onSubmit={submit} className="ui-card p-4 flex flex-col gap-5">
    <fieldset disabled={saving} className="flex flex-col gap-5 disabled:opacity-60">
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Nombre y apellido" name="contactName" required maxLength={150} value={input.contactName} onChange={(e) => setInput({ ...input, contactName: e.target.value })} />
        <Field label="Razón social / comercio (opcional)" name="businessName" maxLength={200} value={input.businessName ?? ''} onChange={(e) => setInput({ ...input, businessName: e.target.value })} />
        <Field label="Dirección" name="address" required maxLength={300} value={input.address} onChange={(e) => setInput({ ...input, address: e.target.value })} />
        <Field label="Teléfono" name="phone" type="tel" required maxLength={30} value={input.phone} onChange={(e) => setInput({ ...input, phone: e.target.value })} />
        <Field label="Email (opcional)" name="email" type="email" maxLength={150} value={input.email ?? ''} onChange={(e) => setInput({ ...input, email: e.target.value })} />
        <Select label="Zona de reparto" name="zoneId" required value={input.zoneId} onChange={(e) => setInput({ ...input, zoneId: e.target.value })}>
          <option value="">Seleccioná una zona</option>
          {zones.map((zone) => <option key={zone.id} value={zone.id}>{zone.name}{zone.isActive ? '' : ' (inactiva)'}</option>)}
        </Select>
        <Select label="Camión asignado" name="vehicleId" required value={input.vehicleId} onChange={(e) => setInput({ ...input, vehicleId: e.target.value })}>
          <option value="">Seleccioná un camión</option>
          {vehicles.map((vehicle) => <option key={vehicle.id} value={vehicle.id}>{vehicle.name} · {vehicle.licensePlate}</option>)}
        </Select>
      </div>
      {initial && !initial.vehicleId && <p className="text-sm">Este cliente está pendiente de asignación. Seleccioná su camión para incluirlo en el reparto.</p>}
      <VisitDaysField value={input.visitDays} onChange={(days) => { setInput({ ...input, visitDays: days }); setMissingDays(false) }} />
      {missingDays && <p role="alert" className="text-danger">Seleccioná al menos un día de visita.</p>}
      <Textarea label="Indicaciones para el chofer (opcional)" name="notes" rows={3} maxLength={1000} placeholder="Piso, departamento, casa de atrás, timbre…" value={input.notes ?? ''}
        onChange={(e) => setInput({ ...input, notes: e.target.value })} />
      {initial && <label className="flex min-h-11 items-center gap-2"><input type="checkbox" checked={input.isActive} onChange={(e) => setInput({ ...input, isActive: e.target.checked })} />Cliente activo</label>}
      <ErrorMessage error={error} />
      <div className="flex items-center gap-4"><Button type="submit">{saving ? 'Guardando…' : 'Guardar cliente'}</Button><LinkButton to="/panel/clientes" variant="danger">Cancelar</LinkButton></div>
    </fieldset>
  </form>
}
